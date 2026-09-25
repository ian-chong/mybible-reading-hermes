// src/utils/bibleApi.js
// Fetch Bible text from a free API (bible-api.com) which provides ASV (public domain)
// For NKJV/NIV/KJV we may need to fallback to another source or bundle text.
// For now, we'll use bible-api.com and note the limitation.

export async function fetchVerse(reference) {
  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    // data.verses is an array; combine text
    const text = data.verses.map(v => v.text.trim()).join(' ');
    return { reference: data.reference, text };
  } catch (error) {
    console.error('Error fetching verse:', error);
    return { reference, text: `Unable to load passage: ${reference}` };
  }
}

// For multiple verses or whole chapter, we can fetch per verse but that's many requests.
// For simplicity, we'll fetch the whole chapter via bible-api.com? It returns verses array.
export async function fetchChapter(bookName, chapterNum) {
  const reference = `${bookName} ${chapterNum}`;
  return fetchVerse(reference);
}