// Builds public/bible/kjv/<n>.json (one file per book, 1 = Genesis … 66 = Revelation) from a
// public-domain KJV (1769) source, so scripture loads from our own site and can be saved offline.
// Run: node scripts/build-kjv.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { books } from '../src/data/books.js';

const SOURCE = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

// The source puts stray spaces before punctuation ("the LORD ;") and uses Æ ligatures.
const clean = (text) =>
  text
    .replace(/Æ/g, 'Ae').replace(/æ/g, 'ae').replace(/Œ/g, 'Oe').replace(/œ/g, 'oe')
    .replace(/\s+([.,;:?!)])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const raw = await (await fetch(SOURCE)).text();
const source = JSON.parse(raw.replace(/^﻿/, ''));
if (source.length !== books.length) throw new Error(`Expected ${books.length} books, got ${source.length}`);

await mkdir('public/bible/kjv', { recursive: true });
let verses = 0;
for (const [i, book] of books.entries()) {
  const chapters = source[i].chapters.map((chapter) => chapter.map(clean));
  if (chapters.length !== book.chapters) throw new Error(`${book.name}: ${chapters.length} chapters, expected ${book.chapters}`);
  verses += chapters.reduce((sum, c) => sum + c.length, 0);
  await writeFile(`public/bible/kjv/${i + 1}.json`, JSON.stringify({ book: book.name, chapters }));
}
if (verses !== 31102) throw new Error(`Expected 31102 verses, got ${verses}`);
console.log(`Wrote ${books.length} books, ${verses} verses`);
