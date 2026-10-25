// Cloud sync for the reading state. Local storage stays the source the app reads from;
// this module uploads what's pending and merges in what other devices added.
// Merging is safe to repeat: events are append-only with stable ids, so it's a union,
// and deriveProgress picks the newest event per chapter (read wins a tie).
import { supabase } from './supabase';
import { activeRun, emptySync, freshState } from './store';

const PAGE = 1000;

const runToRow = (r, userId) => ({
  id: r.id,
  user_id: userId,
  started_at: r.startedAt,
  deadline: r.deadline,
  status: r.status,
  ended_at: r.endedAt,
  updated_at: r.updatedAt,
});
const iso = (value) => (value ? new Date(value).toISOString() : null);
const rowToRun = (row) => ({
  id: row.id,
  startedAt: iso(row.started_at),
  deadline: row.deadline,
  status: row.status,
  endedAt: iso(row.ended_at),
  updatedAt: iso(row.updated_at),
});
const eventToRow = (e, userId) => ({
  id: e.id,
  user_id: userId,
  run_id: e.runId,
  book: e.book,
  chapter: e.chapter,
  action: e.action,
  at: e.at,
  source: e.source,
  undated: Boolean(e.undated),
});
const rowToEvent = (row) => ({
  id: row.id,
  runId: row.run_id,
  book: row.book,
  chapter: row.chapter,
  action: row.action,
  at: new Date(row.at).toISOString(),
  source: row.source,
  ...(row.undated ? { undated: true } : {}),
  synced: true,
});

async function pageAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function fetchRemote(userId, cursor) {
  // Re-read a minute before the cursor: rows that committed slightly out of order aren't missed,
  // and duplicates are dropped by id when merging.
  const since = cursor ? new Date(new Date(cursor).getTime() - 60_000).toISOString() : null;
  const [runs, events, steps] = await Promise.all([
    pageAll(() => supabase.from('plan_runs').select('*').eq('user_id', userId).order('started_at')),
    pageAll(() => {
      let q = supabase.from('reading_events').select('*').eq('user_id', userId).order('inserted_at');
      if (since) q = q.gt('inserted_at', since);
      return q;
    }),
    pageAll(() => supabase.from('story_steps').select('run_id, story_id, step').eq('user_id', userId)),
  ]);
  return { runs, events, steps };
}

// Exactly one active run: if devices started over separately, the newest start wins.
function normalizeActive(state) {
  const active = state.runs.filter((r) => r.status === 'active').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  if (active.length === 1) return state;
  if (active.length === 0) {
    const fresh = freshState();
    return { ...state, runs: [...state.runs, ...fresh.runs], stories: { ...state.stories, ...fresh.stories } };
  }
  const keep = active[0].id;
  const now = new Date().toISOString();
  return {
    ...state,
    runs: state.runs.map((r) =>
      r.status === 'active' && r.id !== keep ? { ...r, status: 'abandoned', endedAt: now, updatedAt: now, dirty: true } : r,
    ),
  };
}

export function mergeRemote(state, remote) {
  const runs = [...state.runs];
  for (const row of remote.runs) {
    const remoteRun = rowToRun(row);
    const i = runs.findIndex((r) => r.id === remoteRun.id);
    if (i === -1) runs.push(remoteRun);
    // Newest change wins; a local edit not yet uploaded is newer by definition.
    else if (!runs[i].dirty && remoteRun.updatedAt > runs[i].updatedAt) runs[i] = remoteRun;
  }

  const known = new Set(state.events.map((e) => e.id));
  const events = [...state.events];
  let cursor = state.sync.pullCursor;
  for (const row of remote.events) {
    if (!cursor || row.inserted_at > cursor) cursor = row.inserted_at;
    if (known.has(row.id)) continue;
    known.add(row.id);
    events.push(rowToEvent(row));
  }

  const stories = { ...state.stories };
  for (const { run_id, story_id, step } of remote.steps) {
    const run = { ...(stories[run_id] ?? {}) };
    const steps = run[story_id]?.steps ?? [];
    if (!steps.includes(step)) run[story_id] = { steps: [...steps, step].sort((a, b) => a - b) };
    stories[run_id] = run;
  }

  return normalizeActive({ ...state, runs, events, stories, sync: { ...state.sync, pullCursor: cursor } });
}

// First pull after signing in on this device.
// - Same account as last time: an ordinary merge.
// - A different account was signed in here before: start clean, then take that account's record.
// - Guest progress on this device: it joins the account. If the account already has a reading
//   in progress, this device's current reading is folded into it, so nothing is lost.
export function linkAccount(state, remote, userId) {
  if (state.sync.userId === userId) return mergeRemote(state, remote);

  let base;
  if (state.sync.userId) {
    base = { version: 1, runs: [], events: [], stories: {}, sync: emptySync() };
  } else {
    const remoteActive = remote.runs.find((r) => r.status === 'active');
    const local = activeRun(state);
    // Everything on this device is new to the account, however it was saved.
    base = {
      ...state,
      runs: state.runs.map((r) => ({ ...r, dirty: true })),
      events: state.events.map(({ synced: _synced, ...e }) => e),
      sync: { ...state.sync, dirtyStories: state.runs.map((r) => r.id) },
    };
    state = base;
    if (remoteActive && local) {
      const hasProgress = state.events.some((e) => e.runId === local.id) || Object.keys(state.stories[local.id] ?? {}).length > 0;
      const stories = { ...state.stories };
      delete stories[local.id];
      if (hasProgress) {
        const remoteStories = { ...(stories[remoteActive.id] ?? {}) };
        for (const [storyId, entry] of Object.entries(state.stories[local.id] ?? {})) {
          const steps = [...new Set([...(remoteStories[storyId]?.steps ?? []), ...entry.steps])].sort((a, b) => a - b);
          remoteStories[storyId] = { steps };
        }
        stories[remoteActive.id] = remoteStories;
      }
      base = {
        ...state,
        runs: state.runs.filter((r) => r.id !== local.id),
        events: hasProgress
          ? state.events.map((e) => (e.runId === local.id ? { ...e, runId: remoteActive.id } : e))
          : state.events.filter((e) => e.runId !== local.id),
        stories,
        sync: {
          ...state.sync,
          dirtyStories: [...state.sync.dirtyStories.filter((id) => id !== local.id), ...(hasProgress ? [remoteActive.id] : [])],
        },
      };
    }
  }
  return mergeRemote({ ...base, sync: { ...base.sync, userId, pullCursor: null } }, remote);
}

// Uploads everything pending and returns what was sent, for markPushed.
export async function pushPending(state, userId) {
  const runs = state.runs.filter((r) => r.dirty);
  const events = state.events.filter((e) => !e.synced);
  const storyRuns = state.sync.dirtyStories.filter((id) => state.runs.some((r) => r.id === id));

  if (runs.length) {
    const { error } = await supabase.from('plan_runs').upsert(runs.map((r) => runToRow(r, userId)));
    if (error) throw error;
  }
  for (let i = 0; i < events.length; i += 500) {
    const { error } = await supabase
      .from('reading_events')
      .upsert(events.slice(i, i + 500).map((e) => eventToRow(e, userId)), { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }
  const stepRows = storyRuns.flatMap((runId) =>
    Object.entries(state.stories[runId] ?? {}).flatMap(([storyId, { steps }]) =>
      steps.map((step) => ({ user_id: userId, run_id: runId, story_id: storyId, step })),
    ),
  );
  if (stepRows.length) {
    const { error } = await supabase.from('story_steps').upsert(stepRows, { ignoreDuplicates: true });
    if (error) throw error;
  }

  return {
    runs: new Map(runs.map((r) => [r.id, r.updatedAt])),
    events: new Set(events.map((e) => e.id)),
    stories: new Map(storyRuns.map((id) => [id, state.stories[id]])),
  };
}

// Clears the pending flags for what was uploaded, unless it changed again meanwhile.
export function markPushed(state, pushed) {
  return {
    ...state,
    runs: state.runs.map((r) => (r.dirty && pushed.runs.get(r.id) === r.updatedAt ? { ...r, dirty: false } : r)),
    events: state.events.map((e) => (!e.synced && pushed.events.has(e.id) ? { ...e, synced: true } : e)),
    sync: {
      ...state.sync,
      dirtyStories: state.sync.dirtyStories.filter((id) => !pushed.stories.has(id) || pushed.stories.get(id) !== state.stories[id]),
    },
  };
}

export const hasPending = (state) =>
  state.runs.some((r) => r.dirty) || state.events.some((e) => !e.synced) || state.sync.dirtyStories.length > 0;
