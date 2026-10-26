// Scripture text: the King James Version (1769, public domain), served from this site as
// one JSON file per book (public/bible/kjv/<n>.json, built by scripts/build-kjv.mjs).
// The service worker keeps those files on the device, so reading works offline.
import { books } from '../data/books';
import { parseRef } from '../data/stories';

export const TRANSLATION = 'King James Version';

export const bookUrl = (book) => `/bible/kjv/${books.indexOf(book) + 1}.json`;

// One request per book, shared for the session; failures are dropped so they can be retried.
const bookCache = new Map();
function loadBook(book) {
  if (!bookCache.has(book)) {
    const request = fetch(bookUrl(book))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch((error) => {
        bookCache.delete(book);
        throw error;
      });
    bookCache.set(book, request);
  }
  return bookCache.get(book);
}

// "Genesis 1", "Exodus 2:1-10" or "Hebrews 11:7" -> { reference, verses: [{ verse, text }] }.
// Throws on a bad reference or a failed download, so the caller can show an error state.
export async function fetchCachedPassage(reference) {
  const ref = parseRef(reference);
  if (!ref) throw new Error(`Unknown reference: ${reference}`);
  const { chapters } = await loadBook(ref.book);
  const all = chapters[ref.chapter - 1].map((text, i) => ({ verse: i + 1, text }));
  const from = ref.from ?? 1;
  const to = ref.to ?? (ref.from ? ref.from : all.length);
  return { reference, verses: all.slice(from - 1, to) };
}

export function fetchChapter(bookName, chapterNum) {
  return fetchCachedPassage(`${bookName} ${chapterNum}`);
}
