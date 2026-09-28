import { addDays, differenceInCalendarDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import { books, TOTAL_CHAPTERS } from '../data/books';

const STORAGE_KEY = 'bibleReadingProgress'; // { [bookName]: number[] }
const LOG_KEY = 'bibleReadingLog'; // { 'yyyy-MM-dd': ['Genesis 1', ...] } — chapters read on each day
const DEADLINE_KEY = 'bibleReadingDeadline';
export const DEFAULT_DEADLINE = '2026-10-14'; // 14 October 2026

// localStorage can throw (private mode, blocked storage), so reads fall back to defaults.
function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Progress still works for this session; it just won't persist.
  }
}

export const dayKey = (date) => format(date, 'yyyy-MM-dd');

export function loadProgress() {
  return { completed: read(STORAGE_KEY, {}), log: read(LOG_KEY, {}) };
}

export function saveProgress({ completed, log }) {
  write(STORAGE_KEY, completed);
  write(LOG_KEY, log);
}

export const loadDeadline = () => read(DEADLINE_KEY, DEFAULT_DEADLINE);
export const saveDeadline = (deadline) => write(DEADLINE_KEY, deadline);

export function isChapterRead(completed, bookName, chapter) {
  return Boolean(completed[bookName]?.includes(chapter));
}

// Returns new objects so React sees the change.
export function toggleChapter({ completed, log }, bookName, chapter, now = new Date()) {
  const id = `${bookName} ${chapter}`;

  if (isChapterRead(completed, bookName, chapter)) {
    const nextCompleted = { ...completed };
    const chapters = completed[bookName].filter((c) => c !== chapter);
    if (chapters.length) nextCompleted[bookName] = chapters;
    else delete nextCompleted[bookName];

    const nextLog = Object.fromEntries(
      Object.entries(log)
        .map(([day, ids]) => [day, ids.filter((x) => x !== id)])
        .filter(([, ids]) => ids.length > 0),
    );
    return { completed: nextCompleted, log: nextLog };
  }

  const today = dayKey(now);
  return {
    completed: { ...completed, [bookName]: [...(completed[bookName] || []), chapter].sort((a, b) => a - b) },
    log: { ...log, [today]: [...(log[today] || []), id] },
  };
}

export function countCompleted(completed) {
  return Object.values(completed).reduce((sum, chapters) => sum + chapters.length, 0);
}

// The next `limit` unread chapters in canonical order.
export function nextUnread(completed, limit) {
  const result = [];
  for (const book of books) {
    const read = completed[book.name] || [];
    for (let chapter = 1; chapter <= book.chapters && result.length < limit; chapter++) {
      if (!read.includes(chapter)) result.push({ book, chapter });
    }
    if (result.length >= limit) break;
  }
  return result;
}

// Collapses consecutive chapters of the same book into ranges: Genesis 3–12.
export function groupIntoRanges(chapters) {
  const ranges = [];
  for (const { book, chapter } of chapters) {
    const last = ranges[ranges.length - 1];
    if (last && last.book === book && last.to === chapter - 1) last.to = chapter;
    else ranges.push({ book, from: chapter, to: chapter });
  }
  return ranges;
}

// The chapter before/after this one, crossing book boundaries. null at either end of the Bible.
export function adjacentChapter(book, chapter, direction) {
  const target = chapter + direction;
  if (target >= 1 && target <= book.chapters) return { book, chapter: target };
  const neighbour = books[books.indexOf(book) + direction];
  if (!neighbour) return null;
  return { book: neighbour, chapter: direction > 0 ? 1 : neighbour.chapters };
}

// Consecutive days with at least one chapter read, ending today (or yesterday if nothing read yet today).
export function readingStreak(log, now = new Date()) {
  let day = startOfDay(now);
  if (!log[dayKey(day)]?.length) day = subDays(day, 1);
  let streak = 0;
  while (log[dayKey(day)]?.length) {
    streak++;
    day = subDays(day, 1);
  }
  return streak;
}

export function computePlan({ completed, log }, deadlineStr, now = new Date()) {
  const today = startOfDay(now);
  // parseISO reads "YYYY-MM-DD" as local midnight (new Date() would read it as UTC)
  const deadline = parseISO(deadlineStr);
  const validDeadline = !Number.isNaN(deadline.getTime());

  const totalCompleted = countCompleted(completed);
  const chaptersLeft = TOTAL_CHAPTERS - totalCompleted;
  const readToday = log[dayKey(today)]?.length ?? 0;
  // Count today as a reading day, so a deadline of today still leaves 1 day.
  const daysLeft = validDeadline ? differenceInCalendarDays(deadline, today) + 1 : 0;

  const base = {
    deadline: validDeadline ? deadline : null,
    deadlinePassed: daysLeft <= 0,
    daysLeft: Math.max(0, daysLeft),
    totalCompleted,
    chaptersLeft,
    readToday,
    streak: readingStreak(log, now),
  };

  if (daysLeft <= 0 || chaptersLeft === 0) {
    return { ...base, todayTarget: readToday, remainingToday: 0, schedule: [] };
  }

  // Today's target counts what's already been read today, so it stays fixed as you read.
  const todayTarget = Math.ceil((chaptersLeft + readToday) / daysLeft);
  const remainingToday = Math.min(chaptersLeft, Math.max(0, todayTarget - readToday));

  // Spread what's left after today over the remaining days, extra chapters first.
  const later = chaptersLeft - remainingToday;
  const laterDays = daysLeft - 1;
  const schedule = [{ date: today, chapters: todayTarget }];
  for (let i = 1; i <= Math.min(6, laterDays); i++) {
    const chapters = Math.floor(later / laterDays) + (i <= later % laterDays ? 1 : 0);
    schedule.push({ date: addDays(today, i), chapters });
  }

  return { ...base, todayTarget, remainingToday, schedule };
}
