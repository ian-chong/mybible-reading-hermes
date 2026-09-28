// src/utils/bibleApi.js
// Fetch Bible text from a free API (bible-api.com). We use the King James Version, which is
// public domain; NKJV, NIV and NLT are copyrighted and need a publisher licence.
export const TRANSLATION = 'King James Version';

// Returns { reference, verses: [{ verse, text }] }. Throws on network/HTTP errors
// so the caller can show an error state.
export async function fetchPassage(reference) {
  const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  const verses = data.verses.map(v => ({ verse: v.verse, text: v.text.trim() }));
  return { reference: data.reference, verses };
}

// Chapters are cached for the session, so going back/forward between chapters is instant.
// Failed requests are dropped from the cache so they can be retried.
const cache = new Map();

// bible-api.com returns every verse of a chapter when given "Book N".
export function fetchChapter(bookName, chapterNum) {
  const reference = `${bookName} ${chapterNum}`;
  if (!cache.has(reference)) {
    cache.set(reference, fetchPassage(reference).catch((error) => {
      cache.delete(reference);
      throw error;
    }));
  }
  return cache.get(reference);
}
