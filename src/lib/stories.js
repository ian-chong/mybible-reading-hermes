// Progress store for story sessions. Story reading counts toward the main plan by
// marking each step's anchor chapter via toggleChapter; `newlyMarked` remembers
// which chapters the story marked that were unread before, so a reset only ever
// unmarks what the story itself added — chapters you read on your own stay read.
import { toggleChapter } from './progress';

const STORIES_KEY = 'bibleReadingStories';

// { [storyId]: { steps: number[], newlyMarked: string[] } } — step numbers are 1-based.
function read() {
  try {
    const saved = localStorage.getItem(STORIES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function write(stories) {
  try {
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  } catch {
    // Story progress still works for this session; it just won't persist.
  }
}

export function loadStories() {
  return read();
}

export function saveStories(stories) {
  write(stories);
}

export function isStepRead(stories, storyId, step) {
  return Boolean(stories[storyId]?.steps?.includes(step));
}

// Pure: returns { stories, progress } with the step recorded and, if its anchor
// chapter was unread, the chapter marked in the main plan.
export function markStepRead(stories, progress, story, step, now = new Date()) {
  if (isStepRead(stories, story.id, step)) return { stories, progress };

  const { book, chapter } = story.steps[step - 1];
  const id = `${book.name} ${chapter}`;
  const alreadyRead = (progress.completed[book.name] || []).includes(chapter);

  let nextProgress = progress;
  let newlyMarked = stories[story.id]?.newlyMarked ?? [];
  if (!alreadyRead) {
    nextProgress = toggleChapter(progress, book.name, chapter, now);
    newlyMarked = [...newlyMarked, id];
  }

  const steps = [...(stories[story.id]?.steps ?? []), step].sort((a, b) => a - b);
  return {
    stories: { ...stories, [story.id]: { steps, newlyMarked } },
    progress: nextProgress,
  };
}

// Pure: clears the story's step progress and unmarks only the chapters it added.
export function resetStory(stories, progress, story, now = new Date()) {
  const entry = stories[story.id];
  if (!entry) return { stories, progress };

  let nextProgress = progress;
  for (const id of entry.newlyMarked) {
    const [bookName, chapter] = [id.slice(0, id.lastIndexOf(' ')), Number(id.slice(id.lastIndexOf(' ') + 1))];
    nextProgress = toggleChapter(nextProgress, bookName, chapter, now);
  }

  const nextStories = { ...stories };
  delete nextStories[story.id];
  return { stories: nextStories, progress: nextProgress };
}

// A manually unmarked chapter may still sit in some story's newlyMarked; strip it
// so a later reset can't unmark a chapter you re-read by hand.
export function stripNewlyMarked(stories, chapterId) {
  let changed = false;
  const next = {};
  for (const [storyId, entry] of Object.entries(stories)) {
    if (entry.newlyMarked?.includes(chapterId)) {
      const newlyMarked = entry.newlyMarked.filter((id) => id !== chapterId);
      next[storyId] = newlyMarked.length
        ? { ...entry, newlyMarked }
        : { steps: entry.steps ?? [], newlyMarked: [] };
      changed = true;
    } else {
      next[storyId] = entry;
    }
  }
  return changed ? next : stories;
}
