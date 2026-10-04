import { useState } from 'react';
import { BookOpenText, CaretDown, CaretRight, Check, CheckCircle, Confetti } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ChapterMap from '../components/ChapterMap';
import ProgressBar from '../components/ProgressBar';
import { books, TOTAL_CHAPTERS } from '../data/books';
import { countCompleted, formatRuns, percentRead, readRanges } from '../lib/progress';
import Link from '../components/Link';
import { paths } from '../lib/router';

const testaments = [
  { id: 'OT', label: 'Old Testament' },
  { id: 'NT', label: 'New Testament' },
];

// Remembered for the session so returning to the list keeps the chosen testament.
const TESTAMENT_KEY = 'bibleTestament';
function rememberedTestament() {
  try {
    return sessionStorage.getItem(TESTAMENT_KEY);
  } catch {
    return null;
  }
}

// Phones: the book list and a book's chapters are separate screens.
// Desktop: both side by side.
export default function BibleScreen({ book, completed }) {
  const [testament, setTestamentState] = useState(() => rememberedTestament() ?? book?.testament ?? 'OT');
  const setTestament = (id) => {
    try {
      sessionStorage.setItem(TESTAMENT_KEY, id);
    } catch {
      // Not remembered; the choice still applies for this visit.
    }
    setTestamentState(id);
  };

  const readInBook = book ? (completed[book.name]?.length ?? 0) : 0;

  return (
    <>
      <AppBar
        title={book ? book.name : 'Bible'}
        subtitle={book ? `${readInBook} of ${book.chapters} chapters read` : undefined}
        backTo={book ? paths.bible : undefined}
        backDesktop={false}
      />

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:grid lg:grid-cols-[20rem_1fr] lg:items-start lg:gap-6">
        <section aria-label="Books" className={book ? 'hidden lg:block' : ''}>
          <div role="group" aria-label="Testament" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {testaments.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={testament === id}
                onClick={() => setTestament(id)}
                className={`min-h-11 rounded-lg text-sm font-semibold transition-colors ${testament === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <ProgressSummary completed={completed} />

          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {books.filter((b) => b.testament === testament).map((b) => {
              const read = completed[b.name]?.length ?? 0;
              const done = read === b.chapters;
              return (
                <li key={b.name}>
                  <Link
                    to={paths.book(b.name)}
                    aria-current={book?.name === b.name ? 'page' : undefined}
                    className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted active:bg-muted aria-[current=page]:bg-primary/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{b.name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {read}/{b.chapters}
                          <span className={`ml-2 inline-block w-10 text-right font-semibold ${done ? 'text-success' : read ? 'text-primary' : ''}`}>
                            {percentRead(read, b.chapters)}%
                          </span>
                        </span>
                      </div>
                      <ProgressBar value={read} max={b.chapters} tone={done ? 'success' : 'primary'} decorative className="mt-2" />
                    </div>
                    {done ? (
                      <CheckCircle size={24} weight="fill" className="shrink-0 text-success" aria-label="Finished" />
                    ) : (
                      <CaretRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-label={book ? `${book.name} chapters` : 'Chapters'} className={book ? '' : 'hidden lg:block'}>
          {book ? (
            <BookProgress book={book} completed={completed} />
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
              <BookOpenText size={40} aria-hidden />
              <p className="mt-3">Choose a book to see its chapters.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}


// Whole-Bible and per-testament percentages above the book list.
function ProgressSummary({ completed }) {
  const total = countCompleted(completed);
  const pct = percentRead(total, TOTAL_CHAPTERS);
  const parts = testaments.map(({ id, label }) => {
    const inTestament = books.filter((b) => b.testament === id);
    const chapters = inTestament.reduce((sum, b) => sum + b.chapters, 0);
    const read = inTestament.reduce((sum, b) => sum + (completed[b.name]?.length ?? 0), 0);
    return { id, label, read, chapters };
  });

  return (
    <section aria-labelledby="summary-heading" className="mt-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="summary-heading" className="font-medium">Whole Bible</h2>
        <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
      </div>
      <ProgressBar value={total} max={TOTAL_CHAPTERS} tone={pct === 100 ? 'success' : 'primary'} label="Whole Bible progress" className="mt-2" />
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        {parts.map(({ id, label, read, chapters }) => (
          <div key={id}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">
              {percentRead(read, chapters)}%{' '}
              <span className="font-normal text-muted-foreground">
                · {read}/{chapters}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// Inside a book: how much is read, where in the book it is, and the chapters still to read.
function BookProgress({ book, completed }) {
  const read = completed[book.name] ?? [];
  const done = read.length === book.chapters;
  const runs = readRanges(read);
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  const unread = chapters.filter((chapter) => !read.includes(chapter));
  const readSorted = chapters.filter((chapter) => read.includes(chapter));

  return (
    <div className="space-y-4">
      <section aria-labelledby="book-progress-heading" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="book-progress-heading" className="sr-only lg:not-sr-only lg:mb-3 lg:block lg:font-serif lg:text-2xl lg:font-semibold">
          {book.name}
        </h2>
        <div className="flex items-baseline justify-between gap-3">
          <p className={`text-4xl font-semibold tabular-nums ${done ? 'text-success' : ''}`}>{percentRead(read.length, book.chapters)}%</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {read.length} of {book.chapters} chapter{book.chapters !== 1 ? 's' : ''}
          </p>
        </div>
        <ChapterMap book={book} read={read} className="mt-4" />
        <p className="mt-3 text-sm text-muted-foreground">
          {runs.length
            ? `Read: ${runs.length === 1 && runs[0].from === runs[0].to ? 'chapter' : 'chapters'} ${formatRuns(runs)}`
            : 'Not started yet. Each chapter you read lights up its place on the bar.'}
        </p>
      </section>

      {done ? (
        <section className="rounded-2xl border border-border bg-card p-5 text-center">
          <Confetti size={40} weight="duotone" className="mx-auto text-primary" aria-hidden />
          <h2 className="mt-2 font-serif text-2xl font-semibold">{book.name} complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">You've read every chapter of this book.</p>
        </section>
      ) : (
        <section aria-labelledby="unread-heading">
          <h2 id="unread-heading" className="px-1 pb-2 text-sm font-medium text-muted-foreground">
            Not yet read · {unread.length}
          </h2>
          <ol className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {unread.map((chapter) => (
              <li key={chapter}>
                <Link
                  to={paths.read(book.name, chapter)}
                  aria-label={`Chapter ${chapter}`}
                  className="flex min-h-16 flex-col items-center justify-center rounded-2xl border border-border bg-card transition-transform hover:border-primary active:scale-95"
                >
                  <span aria-hidden className="text-xs text-muted-foreground">Chapter</span>
                  <span className="text-2xl leading-tight font-semibold tabular-nums">{chapter}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {readSorted.length > 0 && (
        <details className="group rounded-2xl border border-border bg-card">
          <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-5 font-medium [&::-webkit-details-marker]:hidden">
            Read chapters · {readSorted.length}
            <CaretDown size={18} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <ol className="grid grid-cols-5 gap-2 px-5 pb-5 sm:grid-cols-8">
            {readSorted.map((chapter) => (
              <li key={chapter}>
                <Link
                  to={paths.read(book.name, chapter)}
                  aria-label={`Chapter ${chapter}, read`}
                  className="relative flex aspect-square min-h-12 items-center justify-center rounded-xl bg-success text-lg font-semibold text-on-success tabular-nums transition-transform active:scale-95"
                >
                  {chapter}
                  <Check size={12} weight="bold" className="absolute top-1.5 right-1.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
