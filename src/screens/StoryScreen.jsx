import { useEffect, useState } from 'react';
import { ArrowRight, Check, CheckCircle, Confetti } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import Link from '../components/Link';
import { paths } from '../lib/router';

// Numbered from 1 across the whole story, so a step keeps its number wherever acts split.
function stepNumberOffset(acts, actIndex) {
  return acts.slice(0, actIndex).reduce((sum, act) => sum + act.steps.length, 0);
}

export default function StoryScreen({ story, stories, onReset }) {
  const read = stories[story.id]?.steps ?? [];
  const readCount = read.length;
  const done = readCount === story.steps.length;
  const nextStep = story.steps.findIndex((_, i) => !read.includes(i + 1)) + 1;

  return (
    <>
      <AppBar title={story.name} subtitle={story.epithet} backTo={paths.stories} backDesktop={false} />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-muted-foreground">{story.summary}</p>
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
            <h2 className="mt-3 font-serif text-3xl font-semibold">Story complete</h2>
            <p className="mt-2 text-muted-foreground">
              You've read all {story.steps.length} passages of {story.name}'s story. Well done.
            </p>
          </section>
        ) : (
          <Link
            to={paths.storyStep(story.id, nextStep)}
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
                <h2 id={`act-${actIndex}-heading`} className="px-1 pt-2 pb-2 text-sm font-medium text-muted-foreground">
                  {act.title}
                </h2>
                <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {act.steps.map((step, i) => {
                    const number = offset + i + 1;
                    const stepRead = read.includes(number);
                    return (
                      <li key={number}>
                        <Link
                          to={paths.storyStep(story.id, number)}
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

        {readCount > 0 && <ResetButton onReset={() => onReset(story.id)} />}
      </div>
    </>
  );
}

// Two-tap confirm: the first tap arms the button, the second commits the reset.
function ResetButton({ onReset }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const disarm = () => setArmed(false);
    window.addEventListener('click', disarm);
    return () => window.removeEventListener('click', disarm);
  }, [armed]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (armed) onReset();
        else setArmed(true);
      }}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${
        armed
          ? 'bg-destructive text-white'
          : 'border border-destructive/40 text-destructive hover:bg-destructive/10'
      }`}
    >
      {armed ? (
        <>
          <Check size={18} weight="bold" aria-hidden />
          Tap again to reset
        </>
      ) : (
        'Reset story'
      )}
    </button>
  );
}
