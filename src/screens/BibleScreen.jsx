import { useState } from 'react';
import { BookOpenText, CaretRight, Check, CheckCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import { books } from '../data/books';
import { isChapterRead } from '../lib/progress';
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
            <ChapterGrid book={book} completed={completed} />
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

function ChapterGrid({ book, completed }) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
  return (
    <div className="lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-5">
      <h2 className="mb-4 hidden font-serif text-2xl font-semibold lg:block">{book.name}</h2>
      <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-8">
        {chapters.map((chapter) => {
          const done = isChapterRead(completed, book.name, chapter);
          return (
            <li key={chapter}>
              <Link
                to={paths.read(book.name, chapter)}
                aria-label={`Chapter ${chapter}${done ? ', read' : ''}`}
                className={`relative flex aspect-square min-h-12 items-center justify-center rounded-xl text-lg font-semibold tabular-nums transition-transform active:scale-95 ${done ? 'bg-success text-on-success' : 'border border-border bg-card hover:border-primary'}`}
              >
                {chapter}
                {done && <Check size={12} weight="bold" className="absolute top-1.5 right-1.5" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
