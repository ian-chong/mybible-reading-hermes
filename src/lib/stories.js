// Story progress lives in the reading state, per run. Stories are an aid to reading the
// Bible, not a separate record: reading a step logs its anchor chapter in the tracker, and
// a chapter read in the tracker covers every step in it. Only the Plan reset clears them.
import { isChapterRead } from './progress';
import { deriveProgress, recordChapter, runStories, setRunStories } from './store';

// { [story.key]: { steps: number[] } } — step numbers are 1-based. Patterns use 'pattern:<id>' keys.

export function isStepRead(stories, storyId, step) {
  return Boolean(stories[storyId]?.steps?.includes(step));
}

// The tracker is the master record: a step also counts as read when its anchor chapter
// is read in this run, however it was read. Several steps can share one chapter, and
// reading the chapter covers all of them. Returns the shape the story screens use.
export function storyProgress(state, storyList) {
  const stories = runStories(state);
  const { completed } = deriveProgress(state);
  const view = {};
  for (const story of storyList) {
    const steps = story.steps
      .map((_, i) => i + 1)
      .filter((n) => {
        const { book, chapter } = story.steps[n - 1];
        return isStepRead(stories, story.key, n) || isChapterRead(completed, book.name, chapter);
      });
    if (steps.length) view[story.key] = { steps };
  }
  return view;
}

// Pure: records the step and, if its anchor chapter was unread, marks it in the reading log.
export function markStepRead(state, story, step, now = new Date()) {
  const stories = runStories(state);
  if (isStepRead(stories, story.key, step)) return state;

  const { book, chapter } = story.steps[step - 1];
  let next = state;
  // A chapter already read is not read again: re-reading never counts as new progress.
  if (!isChapterRead(deriveProgress(state).completed, book.name, chapter)) {
    next = recordChapter(next, book.name, chapter, 'read', story.source, now);
  }

  const steps = [...(stories[story.key]?.steps ?? []), step].sort((a, b) => a - b);
  return setRunStories(next, { ...stories, [story.key]: { steps } });
}
