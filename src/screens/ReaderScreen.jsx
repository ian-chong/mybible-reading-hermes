import { useEffect, useState } from 'react';
import { ArrowClockwise, CaretLeft, CaretRight, Check, WarningCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import { adjacentChapter, isChapterRead } from '../lib/progress';
import Link from '../components/Link';
import { paths } from '../lib/router';
import { fetchChapter } from '../utils/bibleApi';

// Rendered with key={book+chapter}, so state starts fresh for every chapter.
export default function ReaderScreen({ book, chapter, completed, onToggle }) {
  const [result, setResult] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchChapter(book.name, chapter).then(
      ({ verses }) => {
        if (cancelled) return;
        setResult({ status: 'ready', verses });
        // Warm the cache so "next chapter" opens instantly.
        const next = adjacentChapter(book, chapter, 1);
        if (next) fetchChapter(next.book.name, next.chapter).catch(() => {});
      },
      () => !cancelled && setResult({ status: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [book, chapter, attempt]);

  const retry = () => {
    setResult({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  const read = isChapterRead(completed, book.name, chapter);
  const prev = adjacentChapter(book, chapter, -1);
  const next = adjacentChapter(book, chapter, 1);

  return (
    <>
      <AppBar title={`${book.name} ${chapter}`} subtitle="World English Bible" backTo={paths.book(book.name)} />

      <article className="mx-auto max-w-[38rem] px-5 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6">
        {result.status === 'loading' && <ChapterSkeleton />}

        {result.status === 'error' && (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
            <div className="flex gap-3">
              <WarningCircle size={24} weight="fill" className="shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-semibold">Error Loading Chapter</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Could not load {book.name} {chapter}. Check your connection and try again.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={retry}
              className="mt-4 flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 font-semibold transition-colors hover:bg-muted"
            >
              <ArrowClockwise size={18} weight="bold" aria-hidden />
              Try again
            </button>
          </div>
        )}

        {result.status === 'ready' && (
          <p className="font-reading text-xl leading-[1.65] text-foreground">
            {result.verses.map((v) => (
              <span key={v.verse}>
                <sup className="mr-0.5 font-sans text-[0.6em] leading-none font-semibold text-primary">{v.verse}</sup>
                {v.text}{' '}
              </span>
            ))}
          </p>
        )}
      </article>

      {/* Fixed action bar: mark as read is always one tap away, whatever the chapter length. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-[38rem] items-center gap-3 px-4 py-3">
          <ChapterNavButton target={prev} direction="previous" />
          <button
            type="button"
            onClick={() => onToggle(book.name, chapter)}
            aria-pressed={read}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,color] duration-200 active:scale-[0.98] ${read ? 'bg-success/15 text-success' : 'bg-primary text-on-primary'}`}
          >
            {read ? (
              <>
                <Check size={20} weight="bold" aria-hidden />
                Read
              </>
            ) : (
              'Mark as read'
            )}
          </button>
          <ChapterNavButton target={next} direction="next" emphasised={read} />
        </div>
      </div>
    </>
  );
}

function ChapterNavButton({ target, direction, emphasised = false }) {
  const Icon = direction === 'next' ? CaretRight : CaretLeft;
  const base = 'flex size-12 shrink-0 items-center justify-center rounded-xl transition-[transform,background-color,color] duration-200';
  if (!target) {
    return (
      <span aria-hidden className={`${base} border border-border text-muted-foreground opacity-40`}>
        <Icon size={22} weight="bold" />
      </span>
    );
  }
  return (
    <Link
      to={paths.read(target.book.name, target.chapter)}
      aria-label={`${direction === 'next' ? 'Next' : 'Previous'} chapter: ${target.book.name} ${target.chapter}`}
      className={`${base} active:scale-95 ${emphasised ? 'bg-primary text-on-primary' : 'border border-border text-foreground hover:bg-muted'}`}
    >
      <Icon size={22} weight="bold" aria-hidden />
    </Link>
  );
}

function ChapterSkeleton() {
  return (
    <div role="status" aria-label="Loading chapter" className="animate-pulse space-y-3">
      {[92, 100, 96, 88, 100, 94, 70, 100, 90, 97, 60].map((width, i) => (
        <div key={i} className="h-5 rounded bg-muted" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}
