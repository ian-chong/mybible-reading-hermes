// The reading record: an append-only log of read/unread events grouped into runs.
// Everything the screens show (completed chapters, the daily log, story progress) is
// derived from the active run's events, so a chapter read anywhere counts everywhere.
// Events are never deleted, which keeps a later cloud merge simple: union the logs.
import { addDays, parseISO } from 'date-fns';
import { TOTAL_CHAPTERS } from '../data/books';
import { dayKey } from './progress';

const STATE_KEY = 'bibleReadingState';
const LEGACY = { completed: 'bibleReadingProgress', log: 'bibleReadingLog', deadline: 'bibleReadingDeadline', stories: 'bibleReadingStories' };

// state: {
//   version: 1,
//   runs: [{ id, startedAt, deadline: 'yyyy-MM-dd', status: 'active' | 'completed' | 'abandoned', endedAt }],
//   events: [{ id, runId, book, chapter, action: 'read' | 'unread', at: ISO string, source, undated? }],
//   stories: { [runId]: { [storyId]: { steps: number[] } } },
//   sync: { userId, pullCursor, dirtyStories: runId[] },   — see src/lib/sync.js
// }
// Cloud sync bookkeeping: an event without `synced` and a run with `dirty` still need uploading.
// source is 'bible' or 'story:<id>' — informational only, it never changes what counts.
// undated marks reads migrated without a day: they count, but not toward any day's log.

function readJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function newRun(deadline, now) {
  return { id: newId(), startedAt: now.toISOString(), deadline, status: 'active', endedAt: null, updatedAt: now.toISOString(), dirty: true };
}

export const emptySync = () => ({ userId: null, pullCursor: null, dirtyStories: [] });

// A brand-new record: one empty run aiming to finish a year from today.
export function freshState(now = new Date()) {
  const run = newRun(dayKey(addDays(now, 365)), now);
  return { version: 1, runs: [run], events: [], stories: { [run.id]: {} }, sync: emptySync() };
}

// Builds run 1 from the pre-log storage. The old keys are left in place as a fallback copy.
export function migrateLegacy(legacy, now = new Date()) {
  const { completed = {}, log = {}, deadline, stories = {} } = legacy;
  const days = Object.keys(log).sort();
  const startedAt = days.length ? parseISO(days[0]) : now;
  const run = newRun(deadline || dayKey(addDays(now, 365)), startedAt);
  if (days.length) run.startedAt = startedAt.toISOString();

  const events = [];
  const logged = new Set();
  for (const day of days) {
    // Only the day was recorded, so place each read at local noon on that day.
    const at = new Date(parseISO(day).getTime() + 12 * 3600 * 1000).toISOString();
    for (const id of log[day]) {
      const split = id.lastIndexOf(' ');
      const book = id.slice(0, split);
      const chapter = Number(id.slice(split + 1));
      if (!completed[book]?.includes(chapter) || logged.has(id)) continue;
      logged.add(id);
      events.push({ id: newId(), runId: run.id, book, chapter, action: 'read', at, source: 'bible' });
    }
  }
  // Chapters marked read but missing from the daily log still count, but have no reading day.
  for (const [book, chapters] of Object.entries(completed)) {
    for (const chapter of chapters) {
      if (logged.has(`${book} ${chapter}`)) continue;
      events.push({ id: newId(), runId: run.id, book, chapter, action: 'read', at: run.startedAt, source: 'bible', undated: true });
    }
  }

  return { version: 1, runs: [run], events, stories: { [run.id]: stories }, sync: emptySync() };
}

export function loadState(now = new Date()) {
  const saved = readJSON(STATE_KEY, null);
  if (saved?.version === 1 && saved.runs?.some((r) => r.status === 'active')) return { ...saved, sync: saved.sync ?? emptySync() };
  const state = migrateLegacy(
    {
      completed: readJSON(LEGACY.completed, {}),
      log: readJSON(LEGACY.log, {}),
      deadline: readJSON(LEGACY.deadline, null),
      stories: readJSON(LEGACY.stories, {}),
    },
    now,
  );
  saveState(state);
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Progress still works for this session; it just won't persist.
  }
}

export const activeRun = (state) => state.runs.find((r) => r.status === 'active');

// Latest event per chapter wins; on an equal timestamp a read beats an unread,
// since marking read is always a deliberate tap.
function latestByChapter(events) {
  const latest = new Map();
  for (const event of events) {
    const key = `${event.book} ${event.chapter}`;
    const current = latest.get(key);
    if (!current || event.at > current.at || (event.at === current.at && event.action === 'read')) {
      latest.set(key, event);
    }
  }
  return latest;
}

// The { completed, log } shape the screens and computePlan already use.
export function deriveProgress(state, runId = activeRun(state)?.id) {
  const completed = {};
  const log = {};
  const runEvents = state.events.filter((e) => e.runId === runId);
  for (const [id, event] of latestByChapter(runEvents)) {
    if (event.action !== 'read') continue;
    (completed[event.book] ||= []).push(event.chapter);
    if (!event.undated) (log[dayKey(new Date(event.at))] ||= []).push(id);
  }
  for (const chapters of Object.values(completed)) chapters.sort((a, b) => a - b);
  return { completed, log };
}

export function recordChapter(state, book, chapter, action, source = 'bible', now = new Date()) {
  const run = activeRun(state);
  const event = { id: newId(), runId: run.id, book, chapter, action, at: now.toISOString(), source };
  return { ...state, events: [...state.events, event] };
}

export function setDeadline(state, deadline, now = new Date()) {
  return {
    ...state,
    runs: state.runs.map((r) => (r.status === 'active' ? { ...r, deadline, updatedAt: now.toISOString(), dirty: true } : r)),
  };
}

export const runStories = (state) => state.stories[activeRun(state).id] ?? {};

export function setRunStories(state, stories) {
  const runId = activeRun(state).id;
  const dirtyStories = state.sync.dirtyStories.includes(runId) ? state.sync.dirtyStories : [...state.sync.dirtyStories, runId];
  return { ...state, stories: { ...state.stories, [runId]: stories }, sync: { ...state.sync, dirtyStories } };
}

// Ends the active run (kept in history as completed or abandoned) and starts a fresh,
// empty one. Old events stay in the log under their own run.
export function startNewRun(state, deadline, now = new Date()) {
  const run = activeRun(state);
  const read = Object.values(deriveProgress(state).completed).reduce((sum, c) => sum + c.length, 0);
  const status = read >= TOTAL_CHAPTERS ? 'completed' : 'abandoned';
  const next = newRun(deadline, now);
  return {
    ...state,
    runs: [
      ...state.runs.map((r) =>
        r.id === run.id ? { ...r, status, endedAt: now.toISOString(), updatedAt: now.toISOString(), dirty: true } : r,
      ),
      next,
    ],
    stories: { ...state.stories, [next.id]: {} },
  };
}

// Past runs, newest first, with how far each got.
export function runHistory(state) {
  return state.runs
    .filter((r) => r.status !== 'active')
    .map((r) => ({ ...r, chaptersRead: Object.values(deriveProgress(state, r.id).completed).reduce((sum, c) => sum + c.length, 0) }))
    .reverse();
}
