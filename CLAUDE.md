# MyBibleReading

## Purpose
The app exists to help people read the Bible and track their progress. Every other
feature (Stories, Timeline, groups, challenges, avatars, accounts) supports that purpose
and must never compete with it.

## The tracker is the master record
- The Bible tab's chapter tracker is the single source of truth for what has been read.
- Reading from anywhere (Bible tab, Stories, Timeline, future challenges) is recorded in
  the same reading log and counts toward the main plan and deadline.
- Features derive their progress from the tracker: reading a chapter in the tracker also
  covers every story step and timeline entry in that chapter, even when several steps
  share one chapter (e.g. Moses steps 1–2 are both Exodus 2).
- Resetting a feature (e.g. a story) only removes what that feature added; it never
  unmarks chapters read in the tracker. A full restart is a plan reset (a new run).

See `docs/accounts-plan.md` for the reading-log/run model and the accounts roadmap.
