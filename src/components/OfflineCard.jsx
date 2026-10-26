import { useState } from 'react';
import { CheckCircle, CloudArrowDown, Export } from '@phosphor-icons/react';
import ProgressBar from './ProgressBar';
import { isInstalled, isIOS, removeOfflineBible, startOfflineDownload, useOfflineBible } from '../lib/offline';

const card = 'rounded-2xl border border-border bg-card p-5';

// Status of the saved Bible, plus a one-line tip to install the app (mainly for iPhone,
// where Safari clears website data after about a week without a visit).
export default function OfflineCard() {
  const { status, saved, total } = useOfflineBible();
  const [confirmRemove, setConfirmRemove] = useState(false);
  if (status === 'unsupported') return null;

  return (
    <section aria-labelledby="offline-heading" className={card}>
      <h2 id="offline-heading" className="font-medium">Offline reading</h2>

      {status === 'ready' && (
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle size={18} weight="fill" className="shrink-0 text-success" aria-hidden />
          Whole Bible saved on this device · about 4 MB. Read anywhere, even without signal.
        </p>
      )}

      {(status === 'downloading' || status === 'checking') && (
        <div role="status" className="mt-1">
          <p className="text-sm text-muted-foreground tabular-nums">
            Saving the Bible for offline… {saved} of {total} books
          </p>
          <ProgressBar value={saved} max={total} label="Offline Bible download" className="mt-2" />
        </div>
      )}

      {status === 'paused' && (
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          Saved {saved} of {total} books. The rest will download when you're back online.
        </p>
      )}

      {status === 'off' && (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            The Bible isn't saved on this device, so chapters need a connection to open.
          </p>
          <button
            type="button"
            onClick={() => startOfflineDownload({ force: true })}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-on-primary"
          >
            <CloudArrowDown size={20} weight="bold" aria-hidden />
            Save the Bible for offline
          </button>
        </>
      )}

      {!isInstalled() && (
        <p className="mt-3 flex gap-2 rounded-xl bg-muted p-3 text-sm">
          <Export size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            {isIOS()
              ? 'Tip: tap Share, then "Add to Home Screen". The app opens like a normal app, and iPhone keeps your offline Bible saved.'
              : 'Tip: install the app from your browser menu ("Install app" or "Add to Home screen") to open it like a normal app.'}
          </span>
        </p>
      )}

      {status === 'ready' &&
        (confirmRemove ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setConfirmRemove(false)} className="h-12 rounded-xl border border-border font-semibold hover:bg-muted">
              Keep it
            </button>
            <button
              type="button"
              onClick={() => {
                removeOfflineBible();
                setConfirmRemove(false);
              }}
              className="h-12 rounded-xl bg-destructive font-semibold text-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="mt-2 min-h-11 w-full text-sm font-medium text-muted-foreground hover:underline"
          >
            Remove offline Bible
          </button>
        ))}
    </section>
  );
}
