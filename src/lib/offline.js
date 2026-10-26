// Offline reading: registers the service worker (public/sw.js) and saves every KJV book
// into the same cache it serves from, so chapters open without signal.
import { useEffect, useState } from 'react';
import { books } from '../data/books';
import { bookUrl } from '../utils/bibleApi';

const BIBLE_CACHE = 'bible-kjv-v1';
const OFF_KEY = 'offlineBibleOff'; // set when the reader removes the offline Bible
export const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'caches' in window;

export function registerServiceWorker() {
  if (!supported || !import.meta.env.PROD) return;
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

const wantsOffline = () => {
  try {
    return localStorage.getItem(OFF_KEY) !== '1';
  } catch {
    return true;
  }
};
const setWantsOffline = (value) => {
  try {
    if (value) localStorage.removeItem(OFF_KEY);
    else localStorage.setItem(OFF_KEY, '1');
  } catch {
    // Not remembered; the choice still applies for this visit.
  }
};

async function savedCount() {
  const cache = await caches.open(BIBLE_CACHE);
  const keys = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
  return books.filter((book) => keys.has(bookUrl(book))).length;
}

// Downloads the books not yet saved, a few at a time. Resumes where it left off.
async function downloadMissing(onProgress) {
  const cache = await caches.open(BIBLE_CACHE);
  const saved = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
  const missing = books.map(bookUrl).filter((url) => !saved.has(url));
  let done = books.length - missing.length;
  onProgress(done);
  const queue = [...missing];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      await cache.add(url);
      onProgress(++done);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  // Ask the browser not to clear it when storage runs low (Chrome/Edge/Firefox honour this).
  navigator.storage?.persist?.().catch(() => {});
}

// status: 'unsupported' | 'checking' | 'downloading' | 'ready' | 'off' | 'paused'
// 'paused' means a download was interrupted (offline); it resumes on the next online event.
let shared = { status: supported ? 'checking' : 'unsupported', saved: 0 };
const listeners = new Set();
const set = (next) => {
  shared = { ...shared, ...next };
  listeners.forEach((listener) => listener(shared));
};

let running = false;
export async function startOfflineDownload({ force = false } = {}) {
  if (!supported || running) return;
  if (force) setWantsOffline(true);
  if (!wantsOffline()) {
    set({ status: 'off', saved: await savedCount() });
    return;
  }
  running = true;
  try {
    const saved = await savedCount();
    if (saved === books.length) {
      set({ status: 'ready', saved });
      return;
    }
    set({ status: 'downloading', saved });
    await downloadMissing((count) => set({ saved: count }));
    set({ status: 'ready' });
  } catch {
    set({ status: 'paused' });
  } finally {
    running = false;
  }
}

export async function removeOfflineBible() {
  setWantsOffline(false);
  await caches.delete(BIBLE_CACHE);
  set({ status: 'off', saved: 0 });
}

// Starts (or resumes) the background download a few seconds after the app opens,
// so it never competes with the first screen.
export function useOfflineBible() {
  const [state, setState] = useState(shared);
  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);
  return { ...state, total: books.length };
}

export function startOfflineBibleSoon() {
  if (!supported) return;
  setTimeout(() => startOfflineDownload(), 3000);
  window.addEventListener('online', () => startOfflineDownload());
}

export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

// True when opened from the Home Screen / as an installed app.
export const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

export const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
