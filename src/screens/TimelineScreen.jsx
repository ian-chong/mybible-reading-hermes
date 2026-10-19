import {
  ArrowRight, ArrowsSplit, CheckCircle, Church, Cross, Crown, Flag, Gavel, GlobeHemisphereWest, Hourglass,
  HouseLine, LinkBreak, SpeakerSlash, Suitcase, Tree, Users,
} from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import Link from '../components/Link';
import { booksByName } from '../data/books';
import { bookInfo, eras } from '../data/timeline';
import { percentRead } from '../lib/progress';
import { paths } from '../lib/router';

const icons = { Tree, Users, LinkBreak, Flag, Gavel, Crown, ArrowsSplit, Suitcase, HouseLine, SpeakerSlash, Cross, Church, GlobeHemisphereWest, Hourglass };

// The story of the Bible era by era on a vertical line: each era's icon sits on the line,
// with what happens, where to start, and its books. Browsing only — Today still follows Bible order.
export default function TimelineScreen({ completed }) {
  return (
    <>
      <AppBar title="Timeline" subtitle="The story of the Bible, era by era" backTo={paths.explore} backDesktop={false} />

      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Follow the Bible's story from creation to the end of time. Each era lists the books set in it or written during it.
          Dates are traditional and approximate.
        </p>

        <ol className="mt-6">
          {eras.map((era, i) => {
            const Icon = icons[era.icon];
            const eraBooks = era.books.map((name) => booksByName.get(name));
            const chapters = eraBooks.reduce((sum, b) => sum + b.chapters, 0);
            const read = eraBooks.reduce((sum, b) => sum + (completed[b.name]?.length ?? 0), 0);
            const startsNT = era.testament === 'NT' && eras[i - 1]?.testament === 'OT';
            const isLast = i === eras.length - 1;
            return (
              <li key={era.id} aria-labelledby={`era-${era.id}`} className="relative pl-14">
                {startsNT && (
                  <p className="pb-4 text-sm font-semibold tracking-wide text-primary uppercase">New Testament</p>
                )}
                {i === 0 && <p className="pb-4 text-sm font-semibold tracking-wide text-primary uppercase">Old Testament</p>}
                {!isLast && <span aria-hidden className="absolute top-0 bottom-0 left-5 w-0.5 bg-border" />}
                <span
                  aria-hidden
                  className={`absolute left-0 flex size-10.5 items-center justify-center rounded-full border-2 ring-4 ring-background ${startsNT || i === 0 ? 'top-9' : 'top-0'} ${
                    chapters && read === chapters ? 'border-success bg-success text-on-success' : read ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card text-primary'
                  }`}
                >
                  <Icon size={22} weight="duotone" />
                </span>

                <section className="pb-8">
                  <p className="text-xs font-semibold text-muted-foreground tabular-nums">{era.span}</p>
                  <h2 id={`era-${era.id}`} className="font-serif text-3xl leading-tight font-semibold">{era.title}</h2>
                  <p className="mt-1.5 text-muted-foreground">{era.hook}</p>

                  {era.start && (
                    <Link
                      to={paths.read(era.start[0], era.start[1])}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      Start at {era.start[0]} {era.start[1]}
                      <ArrowRight size={16} weight="bold" aria-hidden />
                    </Link>
                  )}

                  {eraBooks.length > 0 && (
                    <>
                      <p className="mt-4 text-xs text-muted-foreground tabular-nums">
                        {eraBooks.length} book{eraBooks.length !== 1 ? 's' : ''} · {percentRead(read, chapters)}% read
                      </p>
                      <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                        {eraBooks.map((book) => {
                          const bookRead = completed[book.name]?.length ?? 0;
                          const done = bookRead === book.chapters;
                          const info = bookInfo.get(book.name);
                          return (
                            <li key={book.name}>
                              <Link
                                to={paths.book(book.name)}
                                data-testid="timeline-book"
                                className="block px-4 py-3 transition-colors hover:bg-muted active:bg-muted"
                              >
                                <span className="flex items-baseline justify-between gap-2">
                                  <span className="font-medium">{book.name}</span>
                                  {done ? (
                                    <CheckCircle size={20} weight="fill" className="shrink-0 self-center text-success" aria-label="Finished" />
                                  ) : (
                                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${bookRead ? 'text-primary' : 'text-muted-foreground'}`}>
                                      {percentRead(bookRead, book.chapters)}%
                                    </span>
                                  )}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {info.author} · written {info.date}
                                </span>
                                <ProgressBar value={bookRead} max={book.chapters} tone={done ? 'success' : 'primary'} decorative className="mt-2" />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </section>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
