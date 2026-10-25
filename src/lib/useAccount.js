import { useEffect, useRef, useState } from 'react';
import { freshState } from './store';
import { accountsEnabled, signOut as supabaseSignOut, supabase } from './supabase';
import { fetchRemote, hasPending, linkAccount, markPushed, mergeRemote, pushPending } from './sync';

const PUSH_DELAY = 2000;
const PULL_EVERY = 60_000;

// Signed-in session + background sync. `commit(fn)` applies fn to the latest state and saves it.
// Returns { user, status, signOut } — status: 'guest' | 'syncing' | 'synced' | 'offline'.
export function useAccount(state, commit) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(accountsEnabled ? 'syncing' : 'guest');
  const stateRef = useRef(state);
  stateRef.current = state;
  const busy = useRef(false);

  useEffect(() => {
    if (!accountsEnabled) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session) setStatus('guest');
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Pull (and link on first sign-in), then push anything pending.
  const sync = async (userId) => {
    if (busy.current) return;
    busy.current = true;
    setStatus('syncing');
    try {
      const current = stateRef.current;
      const linked = current.sync.userId === userId;
      const remote = await fetchRemote(userId, linked ? current.sync.pullCursor : null);
      commit((s) => (linked && s.sync.userId === userId ? mergeRemote(s, remote) : linkAccount(s, remote, userId)));
      // Let React apply the merge before reading it back for the push.
      await new Promise((r) => setTimeout(r, 0));
      if (hasPending(stateRef.current)) {
        const pushed = await pushPending(stateRef.current, userId);
        commit((s) => markPushed(s, pushed));
      }
      setStatus('synced');
    } catch {
      setStatus('offline');
    } finally {
      busy.current = false;
    }
  };

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    sync(userId);
    const onFocus = () => document.visibilityState === 'visible' && sync(userId);
    document.addEventListener('visibilitychange', onFocus);
    window.addEventListener('online', onFocus);
    const timer = setInterval(onFocus, PULL_EVERY);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('online', onFocus);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced upload after each change.
  useEffect(() => {
    if (!userId || state.sync.userId !== userId || !hasPending(state)) return undefined;
    const timer = setTimeout(() => sync(userId), PUSH_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, userId]);

  // Signing out leaves this device as a fresh guest, so the next person doesn't see your reading.
  // Uploads first; returns false (and stays signed in) if some reading couldn't be saved yet.
  const signOut = async ({ force = false } = {}) => {
    if (userId && !force) {
      await sync(userId);
      if (hasPending(stateRef.current)) return false;
    }
    await supabaseSignOut();
    commit(() => freshState());
    setStatus('guest');
    return true;
  };

  return { user, status: user ? status : 'guest', signOut };
}
