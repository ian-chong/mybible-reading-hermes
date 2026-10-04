import { CaretRight, CheckCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import { storyList } from '../data/stories';
import Link from '../components/Link';
import { paths } from '../lib/router';

const testaments = [
  { id: 'OT', label: 'Old Testament' },
  { id: 'NT', label: 'New Testament' },
];

export default function StoriesScreen({ stories }) {
  return (
    <>
      <AppBar title="Stories" subtitle="The Bible, read through its people" />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:px-6">
        {testaments
          .filter(({ id }) => storyList.some((story) => story.testament === id))
          .map(({ id, label }) => (
          <section key={id} aria-labelledby={`stories-${id}-heading`}>
            <h2 id={`stories-${id}-heading`} className="px-1 pt-2 pb-2 text-sm font-medium text-muted-foreground">
              {label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {storyList
                .filter((story) => story.testament === id)
                .map((story) => {
                  const read = stories[story.id]?.steps?.length ?? 0;
                  const done = read === story.steps.length;
                  return (
                    <li key={story.id}>
                      <Link
                        to={paths.story(story.id)}
                        className="flex h-full min-h-14 flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted active:bg-muted"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-serif text-xl font-semibold">{story.name}</span>
                          {done ? (
                            <CheckCircle size={22} weight="fill" className="shrink-0 self-center text-success" aria-label="Finished" />
                          ) : (
                            <CaretRight size={18} className="shrink-0 self-center text-muted-foreground" aria-hidden />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{story.epithet}</p>
                        <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                          {read}/{story.steps.length} passages
                        </p>
                        <ProgressBar
                          value={read}
                          max={story.steps.length}
                          tone={done ? 'success' : 'primary'}
                          decorative
                          className="mt-2"
                        />
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
