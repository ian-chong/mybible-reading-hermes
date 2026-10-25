import { useEffect, useState } from 'react';
import { AppleLogo, CloudCheck, CloudSlash, CloudArrowUp, DownloadSimple, EnvelopeSimple, GoogleLogo } from '@phosphor-icons/react';
import { accountsEnabled, authProviders, deleteAccount, loadProfile, saveProfile, signInWithEmail, signInWithProvider } from '../lib/supabase';

const card = 'rounded-2xl border border-border bg-card p-5';
const button = 'flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border font-semibold hover:bg-muted disabled:opacity-50';

// A copy of everything on this device, for safekeeping (works signed in or not).
function exportData(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bible-reading-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function AccountCard({ account, state }) {
  if (!accountsEnabled) {
    return (
      <section className={card}>
        <h2 className="font-medium">Your reading</h2>
        <p className="mt-1 text-sm text-muted-foreground">Progress is saved on this device only.</p>
        <ExportButton state={state} />
      </section>
    );
  }
  return account.user ? <SignedIn account={account} state={state} /> : <SignIn state={state} />;
}

function ExportButton({ state }) {
  return (
    <button type="button" onClick={() => exportData(state)} className={`${button} mt-3`}>
      <DownloadSimple size={18} aria-hidden />
      Export my data
    </button>
  );
}

function SignIn({ state }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const sendLink = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await signInWithEmail(email.trim());
    if (err) setError(err.message);
    else setSent(true);
  };
  const withProvider = async (provider) => {
    const { error: err } = await signInWithProvider(provider);
    if (err) setError(err.message);
  };

  return (
    <section aria-labelledby="account-heading" className={card}>
      <h2 id="account-heading" className="font-medium">Sync across your devices</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Progress is saved on this device only. Sign in to keep it safe and pick up on your phone or laptop. What you've read
        here comes with you.
      </p>

      {authProviders.length > 0 && (
        <div className="mt-4 space-y-2">
          {authProviders.includes('google') && (
            <button type="button" onClick={() => withProvider('google')} className={button}>
              <GoogleLogo size={18} weight="bold" aria-hidden />
              Continue with Google
            </button>
          )}
          {authProviders.includes('apple') && (
            <button type="button" onClick={() => withProvider('apple')} className={button}>
              <AppleLogo size={18} weight="fill" aria-hidden />
              Continue with Apple
            </button>
          )}
        </div>
      )}

      {sent ? (
        <p role="status" className="mt-4 rounded-xl bg-muted p-3 text-sm">
          Check <strong>{email}</strong> for a sign-in link. Open it on this device.
        </p>
      ) : (
        <form onSubmit={sendLink} className="mt-4">
          <label htmlFor="email" className="text-sm font-medium">
            {authProviders.length ? 'Or use your email' : 'Sign in with your email'}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-base text-foreground"
            />
            <button type="submit" aria-label="Email me a sign-in link" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
              <EnvelopeSimple size={20} weight="bold" aria-hidden />
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}

      <ExportButton state={state} />
    </section>
  );
}

const statusText = {
  syncing: { icon: CloudArrowUp, text: 'Syncing…' },
  synced: { icon: CloudCheck, text: 'Synced' },
  offline: { icon: CloudSlash, text: "Offline — saved on this device, will sync when you're back online" },
};

function SignedIn({ account, state }) {
  const { user, status, signOut } = account;
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    loadProfile(user.id)
      .then((profile) => {
        const fallback = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '';
        const value = profile?.display_name ?? fallback;
        setName(value);
        setSavedName(profile?.display_name ?? '');
        // First sign-in: save a starting name they can change.
        if (!profile) saveProfile(user.id, { displayName: value }).then(() => setSavedName(value)).catch(() => {});
      })
      .catch(() => {});
  }, [user]);

  const saveName = async (e) => {
    e.preventDefault();
    try {
      await saveProfile(user.id, { displayName: name.trim() });
      setSavedName(name.trim());
    } catch {
      setMessage("Couldn't save your name. Try again when you're online.");
    }
  };

  const handleSignOut = async () => {
    setMessage('');
    const done = await signOut();
    if (!done) setMessage("Some reading hasn't synced yet. Connect to the internet and try again, so it isn't lost.");
  };

  const handleDelete = async () => {
    try {
      await deleteAccount();
      await signOut({ force: true });
    } catch {
      setMessage("Couldn't delete your account. Try again when you're online.");
    }
  };

  const { icon: StatusIcon, text } = statusText[status] ?? statusText.syncing;

  return (
    <section aria-labelledby="account-heading" className={card}>
      <h2 id="account-heading" className="font-medium">Your account</h2>
      <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
      <p role="status" className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <StatusIcon size={18} aria-hidden className={status === 'synced' ? 'text-success' : ''} />
        {text}
      </p>

      <form onSubmit={saveName} className="mt-4">
        <label htmlFor="display-name" className="text-sm font-medium">
          Display name
        </label>
        <p className="text-xs text-muted-foreground">Shown to people in your groups later. You don't need to use your real name.</p>
        <div className="mt-1 flex gap-2">
          <input
            id="display-name"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-base text-foreground"
          />
          <button
            type="submit"
            disabled={!name.trim() || name.trim() === savedName}
            className="h-12 shrink-0 rounded-xl bg-primary px-4 font-semibold text-on-primary disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        <ExportButton state={state} />
        <button type="button" onClick={handleSignOut} className={button}>
          Sign out
        </button>
      </div>
      {message && <p role="alert" className="mt-2 text-sm text-destructive">{message}</p>}

      {confirmDelete ? (
        <div className="mt-4 space-y-2 rounded-xl border border-destructive/40 p-3">
          <p className="text-sm">This permanently deletes your account and all your reading history from the cloud. It can't be undone.</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className={button}>
              Cancel
            </button>
            <button type="button" onClick={handleDelete} className="h-12 rounded-xl bg-destructive font-semibold text-white">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-4 min-h-11 w-full text-sm font-medium text-destructive hover:underline"
        >
          Delete account
        </button>
      )}
    </section>
  );
}
