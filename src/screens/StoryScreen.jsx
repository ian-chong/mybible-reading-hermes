import { useState } from 'react';
import { ArrowRight, CheckCircle, Confetti, Info } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import Link from '../components/Link';
import { paths } from '../lib/router';
import { ANTITYPE_HELP } from '../data/patterns';

// Numbered from 1 across the whole story, so a step keeps its number wherever acts split.
function stepNumberOffset(acts, actIndex) {
  return acts.slice(0, actIndex).reduce((sum, act) => sum + act.steps.length, 0);
}

// Where a story's screens link to. Types & Shadows reuses these screens with its own links.
const storyLinks = {
  back: paths.stories,
  step: paths.storyStep,
  complete: (story) => ({ title: 'Story complete', text: `You've read all ${story.steps.length} passages of ${story.name}'s story. Well done.` }),
};

export default function StoryScreen({ story, stories, links = storyLinks }) {
  const read = stories[story.key]?.steps ?? [];
  const readCount = read.length;
  const done = readCount === story.steps.length;
  const nextStep = story.steps.findIndex((_, i) => !read.includes(i + 1)) + 1;

  return (
    <>
      <AppBar title={story.name} subtitle={story.epithet} backTo={links.back} backDesktop={false} />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-muted-foreground">{story.summary}</p>
          {story.link && (
            <blockquote className="mt-3 border-l-4 border-primary pl-3 font-serif text-lg italic">
              “{story.link.text}”
              <footer className="mt-1 font-sans text-sm not-italic text-muted-foreground">{story.link.ref}</footer>
            </blockquote>
          )}
          <div className="mt-4 flex items-baseline justify-between gap-3">
            <h2 className="font-medium">Reading progress</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {readCount} of {story.steps.length} passages
            </span>
          </div>
          <ProgressBar
            value={readCount}
            max={story.steps.length}
            tone={done ? 'success' : 'primary'}
            label={`${story.name} reading progress`}
            className="mt-3"
          />
        </section>

        {done ? (
          <section className="rounded-2xl border border-border bg-card p-5 text-center">
            <Confetti size={48} weight="duotone" className="mx-auto text-primary" aria-hidden />
            <h2 className="mt-3 font-serif text-3xl font-semibold">{links.complete(story).title}</h2>
            <p className="mt-2 text-muted-foreground">{links.complete(story).text}</p>
          </section>
        ) : (
          <Link
            to={links.step(story.id, nextStep)}
            className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-sm transition-transform active:scale-[0.98]"
          >
            <span>
              <span className="block text-sm opacity-90">{readCount === 0 ? 'Start reading' : 'Continue reading'}</span>
              <span className="block font-serif text-2xl font-semibold">
                {story.steps[nextStep - 1].title}
              </span>
            </span>
            <ArrowRight size={24} weight="bold" aria-hidden />
          </Link>
        )}

        <div className="space-y-4">
          {story.acts.map((act, actIndex) => {
            const offset = stepNumberOffset(story.acts, actIndex);
            return (
              <section key={act.title} aria-labelledby={`act-${actIndex}-heading`}>
                <div className="flex flex-wrap items-center gap-x-1 px-1 pt-2 pb-2">
                  <h2 id={`act-${actIndex}-heading`} className="text-sm font-medium text-muted-foreground">
                    {act.title}
                  </h2>
                  {act.kind === 'antitype' && <HelpToggle text={ANTITYPE_HELP} label="What is an antitype?" />}
                </div>
                <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {act.steps.map((step, i) => {
                    const number = offset + i + 1;
                    const stepRead = read.includes(number);
                    return (
                      <li key={number}>
                        <Link
                          to={links.step(story.id, number)}
                          className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-muted active:bg-muted"
                        >
                          {stepRead ? (
                            <CheckCircle size={22} weight="fill" className="shrink-0 text-success" aria-label="Read" />
                          ) : (
                            <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 border-border text-xs font-semibold text-muted-foreground tabular-nums" aria-hidden>
                              {number}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 font-medium">{step.title}</span>
                          <span className="shrink-0 text-sm text-muted-foreground">{step.ref}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

      </div>
    </>
  );
}

// A small ⓘ that reveals a one-line explanation in place.
function HelpToggle({ text, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="-my-3 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Info size={18} aria-hidden />
      </button>
      {open && <p className="basis-full text-sm text-muted-foreground">{text}</p>}
    </>
  );
}
