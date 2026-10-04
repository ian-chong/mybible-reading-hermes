// Minimal hash router: every screen has a URL (deep links, refresh-safe on static hosting)
// and the browser/phone back button moves between screens.
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

export const paths = {
  today: '#/',
  bible: '#/bible',
  book: (name) => `#/bible/${encodeURIComponent(name)}`,
  read: (name, chapter) => `#/read/${encodeURIComponent(name)}/${chapter}`,
  explore: '#/explore',
  stories: '#/stories',
  story: (id) => `#/stories/${encodeURIComponent(id)}`,
  storyStep: (id, step) => `#/stories/${encodeURIComponent(id)}/${step}`,
  timeline: '#/timeline',
  plan: '#/plan',
};

export function parseRoute(hash) {
  const [section = '', first, second] = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  switch (section) {
    case 'bible':
      return { section: 'bible', book: first };
    case 'read':
      return { section: 'read', book: first, chapter: Number(second) };
    case 'explore':
      return { section: 'explore' };
    case 'stories':
      return { section: 'stories', storyId: first, step: Number(second) };
    case 'timeline':
      return { section: 'timeline' };
    case 'plan':
      return { section: 'plan' };
    default:
      return { section: 'today' };
  }
}

const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

// history.state.depth counts in-app pages, so Back knows whether there is an app page to return to.
export function navigate(path, { replace = false } = {}) {
  const depth = window.history.state?.depth ?? 0;
  if (replace) window.history.replaceState({ depth }, '', path);
  else window.history.pushState({ depth: depth + 1 }, '', path);
  notify();
}

// Go back like the system back button; if the page was opened directly, go to its parent instead.
export function goBack(fallback) {
  if ((window.history.state?.depth ?? 0) > 0) window.history.back();
  else navigate(fallback, { replace: true });
}

export function useRoute() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    listeners.add(update);
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);
  return useMemo(() => ({ key: hash || paths.today, ...parseRoute(hash) }), [hash]);
}

// Each screen reopens where you left it (e.g. back to the book list at Psalms), new screens start at the top.
const scrollPositions = new Map();
export function useScrollRestoration(key) {
  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, scrollPositions.get(key) ?? 0);
    const remember = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [key]);
}
