import { CaretRight, Hourglass, Scroll, Stack } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import Link from '../components/Link';
import { books, booksByName } from '../data/books';
import { eras } from '../data/timeline';
import { storyList } from '../data/stories';
import { patternList } from '../data/patterns';
import { paths } from '../lib/router';

// Other ways into the Bible besides reading it front to back. Each method is a card;
// new methods are added here.
export default function ExploreScreen({ completed, stories }) {
  const countProgress = (list) => ({
    started: list.filter((item) => stories[item.key]?.steps?.length).length,
    finished: list.filter((item) => stories[item.key]?.steps?.length === item.steps.length).length,
  });
  const { started, finished } = countProgress(storyList);
  const patterns = countProgress(patternList);
  // Eras are counted by the chapters of their books; the Silence has no books, so it isn't counted.
  const readingEras = eras.filter((era) => era.books.length);
  const eraProgress = readingEras.map((era) => {
    const eraBooks = era.books.map((name) => booksByName.get(name));
    return {
      read: eraBooks.reduce((sum, b) => sum + (completed[b.name]?.length ?? 0), 0),
      total: eraBooks.reduce((sum, b) => sum + b.chapters, 0),
    };
  });
  const erasStarted = eraProgress.filter(({ read }) => read > 0).length;
  const erasFinished = eraProgress.filter(({ read, total }) => read === total).length;

  const methods = [
    {
      to: paths.stories,
      Icon: Scroll,
      title: 'Stories',
      description: 'The Bible read through its people: guided passages following one life from start to finish.',
      status: started
        ? `${started} of ${storyList.length} people started${finished ? ` · ${finished} finished` : ''}`
        : `${storyList.length} people to follow`,
    },
    {
      to: paths.patterns,
      Icon: Stack,
      title: 'Types & Shadows',
      description: 'Old Testament patterns the New Testament fulfils in Christ, each confirmed by Scripture itself.',
      status: patterns.started
        ? `${patterns.started} of ${patternList.length} patterns started${patterns.finished ? ` · ${patterns.finished} finished` : ''}`
        : `${patternList.length} patterns to explore`,
    },
    {
      to: paths.timeline,
      Icon: Hourglass,
      title: 'Timeline',
      description: 'The story of the Bible era by era, from Creation and the Exodus to the Gospels and the end of time.',
      status: erasStarted
        ? `${erasStarted} of ${readingEras.length} eras started${erasFinished ? ` · ${erasFinished} finished` : ''}`
        : `${eras.length} eras, ${books.length} books`,
    },
  ];

  return (
    <>
      <AppBar title="Explore" subtitle="Other ways to read the Bible" />

      <ul className="mx-auto max-w-2xl space-y-3 px-4 py-5 sm:px-6">
        {methods.map(({ to, Icon, title, description, status }) => (
          <li key={title}>
            <Link
              to={to}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted active:bg-muted"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={26} weight="duotone" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-2xl font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
                <span className="mt-2 block text-xs font-semibold text-primary tabular-nums">{status}</span>
              </span>
              <CaretRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
