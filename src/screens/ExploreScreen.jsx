import { CaretRight, Hourglass, Scroll } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import Link from '../components/Link';
import { books } from '../data/books';
import { storyList } from '../data/stories';
import { paths } from '../lib/router';

// Other ways into the Bible besides reading it front to back. Each method is a card;
// new methods are added here.
export default function ExploreScreen({ completed, stories }) {
  const started = storyList.filter((story) => stories[story.id]?.steps?.length).length;
  const finished = storyList.filter((story) => stories[story.id]?.steps?.length === story.steps.length).length;
  const booksStarted = books.filter((book) => completed[book.name]?.length).length;

  const methods = [
    {
      to: paths.stories,
      Icon: Scroll,
      title: 'Stories',
      description: 'The Bible read through its people: guided passages following one life from start to finish.',
      status: started
        ? `${started} of ${storyList.length} started${finished ? ` · ${finished} finished` : ''}`
        : `${storyList.length} people to follow`,
    },
    {
      to: paths.timeline,
      Icon: Hourglass,
      title: 'Timeline',
      description: 'All 66 books in the order they were written, from Job and Moses to Revelation.',
      status: booksStarted ? `${booksStarted} of ${books.length} books started` : `${books.length} books, c. 2000 BC to AD 95`,
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
