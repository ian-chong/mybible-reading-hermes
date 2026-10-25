# Accounts, Cloud Sync & Groups — Plan

Status: planning (agreed 2026-10-24). Guiding principle: see CLAUDE.md — the tracker is always the master record. Backend: **Supabase** (Postgres + Auth + row-level security).
Target: web now, iOS/Android later via **Capacitor** wrapping the same React app.

## Now: phases 1–3

### Phase 1 — Reading log + runs (local only, no backend)
Replace the `{ book: chapters[] }` store with an event log; everything else is derived.

- `reading_log` entry: `{ id, runId, book, chapter, action: 'read' | 'unread', at, source }`
  - `source`: `bible` | `story:<id>` | `timeline:<era>` | `challenge:<id>` — informational only.
- **The Bible tab is the master record.** A chapter read from anywhere counts everywhere
  (Bible progress, deadline pace, streaks, story steps, challenges).
- Explore (Stories, Timeline) is an aid, not a separate record: story steps log their chapter
  in the tracker, and a chapter read in the tracker covers every step in it. There is no
  per-story reset — the only reset is **Start over** on the Plan tab. ✅ Done.
- **Re-reading:** read chapters stay green and tappable. Re-reading never counts as new
  progress (no streak, no "read today"). It will count only inside a challenge that includes
  that chapter — challenges will need a separate "opened/read in reader" event for this.
- Bible tab chapter grid: read chapters in green, with a "Hide read" toggle (remembered per device). ✅ Done.
- `plan_runs`: `{ id, startedAt, deadline, status: active | completed | abandoned, endedAt }`
- **Start over** (Plan tab) ✅ ends the current run and starts a new one; history is kept
  ("Run 1: finished in 11 months"). Works mid-way (status `abandoned`). Two-step confirm with a new target date.
- Migrate existing `bibleReadingProgress` / `bibleReadingStories` into run 1 on first load.

### Phase 2 — Sign-in + sync (code ✅ — `src/lib/sync.js`, `useAccount.js`, `supabase/migrations/`; awaiting Supabase setup)
- Sign-in: email magic link + Google + Apple (Apple required by App Store when Google is offered).
- **Guest mode:** app works fully without an account, local to the device only, no cross-device sync.
- On sign-up/sign-in: upload the device's log into the account and merge with the cloud.
- Offline first: local storage stays the instant cache; changes sync in the background.
- **Conflict rule:** newest change wins (by `at`). On a tie or uncertain clock, **read wins** —
  marking read is a deliberate click to confirm, so it is the safer state to keep.
- Unmark is stored as an `unread` event, never a delete, so merges stay correct.
- **Time zones:** days, streaks and deadlines use the user's local time zone.
- Profile: display name now; avatars later (need artwork). Account deletion + data export on the Plan tab.
- Signing out returns the device to a fresh guest (shared family devices); it won't sign out while
  reading is still unsynced.
- Apple sign-in needs a paid Apple Developer account — buttons are switched on via `VITE_AUTH_PROVIDERS`.

### Phase 3 — Plan reset & run history UI
- Reset button on Plan tab, run history list, per-run stats (duration, % via Stories/Timeline).

## Profiles & avatars
- Display name + avatar only; no real names required.
- Avatars are preset Bible characters. **One free pick** at sign-up; others **unlock by
  finishing that character's story**.

## Later: phases 4–5 (ideas, not scheduled)

### Groups, challenges, leaderboards
- **Invite-only. No public groups or leaderboards.**
- A challenge = a chapter set + a date window: a book in a month, a character's story, a timeline era.
- Challenge dates are locked to the **creator's time zone** when it starts.
- Leaderboards computed from `reading_log` — no separate scoring.
- No anti-cheat for now (friends-only groups).
- Placement: new tab or a section on Today — decide when we build it.
- Moderation (report button for names/groups) when this phase starts.
- Tables: `groups`, `group_members`, `challenges`, `challenge_participants`.

### Notifications
- Daily reading reminder; "your group is ahead of you". Push (mobile) / email (web).

### Mobile app
- Capacitor wrap; keep layouts mobile-first with safe-area insets and touch-sized targets.

### Translation picker
- See the API.Bible / ESV plan (keys via Vercel env, proxied through a Vercel function);
  store the chosen translation on the profile.

## Database (Supabase)
| table | key columns |
|---|---|
| `profiles` | user_id, display_name, avatar_id, timezone, translation |
| `plan_runs` | id, user_id, started_at, deadline, status, ended_at |
| `reading_log` | id, user_id, run_id, book, chapter, action, at, source |
| `avatar_unlocks` | user_id, avatar_id, unlocked_at |

Row-level security: users read/write only their own rows (group reads added in phase 4).
Index `reading_log (user_id, run_id)`.

## Cost & guardrails (researched 2026-10-24 — verify on supabase.com/pricing)
- **Free:** 500 MB database, 50k monthly active users, 5 GB egress, 2 projects.
  Projects **pause after 7 days of inactivity**; backups are limited.
- **Pro:** $25/month, 100k monthly active users included, then $0.00325 per user; backups.
- Size estimate: a log row is ~200 bytes including the index → 500 MB ≈ 2.5M rows ≈ about
  2,000 users finishing a full Bible. Plenty for development and a beta.

**Decision (2026-10-24):** personal app for family and friends, shaped by our own feedback.
**One Supabase project on the Free tier**, used for both dev and live. No separate test project.

Build so moving to Pro later is just flipping the plan, with no code changes:
1. Supabase URL and anon key come from env vars (Vercel + `.env.local`), never hard-coded.
2. Schema changes live as SQL migration files in the repo (`supabase/migrations/`), so
   the database can be rebuilt or cloned into a separate project if this ever grows.
3. **Pausing after 7 idle days:** the app keeps working offline from local storage if the
   project is paused, and syncs once it is unpaused in the dashboard.
4. **Backups:** add an "Export my data" (JSON) button; the local copy on each device is
   also a fallback.
5. Keep writes small: batch sync (debounce ~2–5 s), never re-upload the whole log.
6. Move to Pro only if it goes commercial or grows past the free limits.
