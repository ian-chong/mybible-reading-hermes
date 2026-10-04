// Curated character reading sessions. Each step's ref fits within one chapter
// (the plan counts chapters), and each story ends with New Testament echoes.
import { booksByName } from '../books';
import { OT_STORIES } from './ot';
import { NT_STORIES } from './nt';

export const stories = [...OT_STORIES, ...NT_STORIES];

export const storiesById = new Map(stories.map((story) => [story.id, story]));

// Flattens acts into a 1-based step list, each carrying its anchor chapter.
function withSteps(story) {
  const steps = story.acts.flatMap((act) => act.steps);
  return {
    ...story,
    steps: steps.map((step) => ({ ...step, ...parseRef(step.ref) })),
  };
}

export const storyList = stories.map(withSteps);
export const storyById = new Map(storyList.map((story) => [story.id, story]));

// "Exodus 2:1-10" -> { book, chapter, from, to }. Chapter-only refs ("Ruth 1")
// mean the whole chapter. Returns null (and logs) for refs that don't resolve,
// so a bad curation is visible in the console instead of crashing the app.
export function parseRef(ref) {
  const match = /^(\d?\s?[A-Za-z. ]+?)\s(\d+)(?::(\d+)(?:-(\d+))?)?$/.exec(ref.trim());
  if (!match) {
    console.warn(`Story ref does not parse: "${ref}"`);
    return null;
  }
  const [, rawBook, chapter, from, to] = match;
  const book = booksByName.get(rawBook.trim());
  if (!book) {
    console.warn(`Story ref book not found: "${rawBook.trim()}"`);
    return null;
  }
  const chapterNum = Number(chapter);
  if (chapterNum < 1 || chapterNum > book.chapters) {
    console.warn(`Story ref chapter out of range: "${ref}"`);
    return null;
  }
  return { book, chapter: chapterNum, from: from ? Number(from) : null, to: to ? Number(to) : null };
}
