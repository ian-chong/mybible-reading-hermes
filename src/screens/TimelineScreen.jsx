import { CheckCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import Link from '../components/Link';
import { booksByName } from '../data/books';
import { timelineEras } from '../data/timeline';
import { percentRead } from '../lib/progress';
import { paths } from '../lib/router';

// The books in written order on a vertical BC/AD line: year on the left, book on the right.
// Browsing only — Today and the plan still follow the usual Bible order.
export default function TimelineScreen({ completed }) {
  return (
    <>
      <AppBar title="Timeline" subtitle="The books in the order they were written" backTo={paths.explore} backDesktop={false} />

      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Dates follow traditional scholarship. Most are approximate, and scholars disagree on some. Tap a book to see its chapters.
        </p>

        {timelineEras.map((era, eraIndex) => (
          <section key={era.id} aria-labelledby={`era-${era.id}`} className="mt-6">
            {eraIndex > 0 && (
              <p className="mb-6 grid grid-cols-[4.5rem_1fr] gap-3 text-sm text-muted-foreground italic">
                <span aria-hidden />
                <span className="border-l-2 border-dashed border-border py-3 pl-5">About 400 years between the testaments</span>
              </p>
            )}
            <h2 id={`era-${era.id}`} className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3">
              <span aria-hidden />
              <span>
                <span className="font-serif text-2xl font-semibold">{era.label}</span>
                <span className="ml-2 text-sm text-muted-foreground">{era.span}</span>
              </span>
            </h2>

            <ol className="mt-3">
              {era.entries.map((entry, i) => {
                const book = booksByName.get(entry.book);
                const read = completed[book.name]?.length ?? 0;
                const done = read === book.chapters;
                const showMarker = i === 0 || era.entries[i - 1].marker !== entry.marker;
                return (
                  <li key={book.name} className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <span aria-hidden className="pt-4 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                      {showMarker ? entry.marker : ''}
                    </span>
                    <div className="relative border-l-2 border-border pb-3 pl-5">
                      <span
                        aria-hidden
                        className={`absolute top-5 -left-[7px] size-3 rounded-full ring-4 ring-background ${done ? 'bg-success' : read ? 'bg-primary' : 'bg-border'}`}
                      />
                      <Link
                        to={paths.book(book.name)}
                        className="block rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted active:bg-muted"
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-serif text-xl font-semibold">{book.name}</span>
                          {done ? (
                            <CheckCircle size={20} weight="fill" className="shrink-0 self-center text-success" aria-label="Finished" />
                          ) : (
                            <span className={`shrink-0 text-sm font-semibold tabular-nums ${read ? 'text-primary' : 'text-muted-foreground'}`}>
                              {percentRead(read, book.chapters)}%
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {entry.author} · {entry.date}
                        </span>
                        <ProgressBar value={read} max={book.chapters} tone={done ? 'success' : 'primary'} decorative className="mt-2" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
