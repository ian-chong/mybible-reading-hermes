import { useEffect, useState } from 'react';
import { ArrowClockwise, BookOpenText, CaretLeft, CaretRight, Check, WarningCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import Link from '../components/Link';
import { navigate, paths } from '../lib/router';
import { TRANSLATION, fetchCachedPassage } from '../utils/bibleApi';

// Rendered with key={story+step}, so state starts fresh for every step.
export default function StoryStepScreen({ story, step, onAdvance }) {
  const stepData = story.steps[step - 1];
  const isLast = step === story.steps.length;

  const [result, setResult] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchCachedPassage(stepData.ref).then(
      ({ verses }) => {
        if (cancelled) return;
        setResult({ status: 'ready', verses });
        // Warm the cache so the next step opens instantly.
        if (story.steps[step]) fetchCachedPassage(story.steps[step].ref).catch(() => {});
      },
      () => !cancelled && setResult({ status: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [story, step, stepData.ref, attempt]);

  const retry = () => {
    setResult({ status: 'loading' });
    setAttempt((n) => n + 1);
  };

  // Moving on records the step (and its anchor chapter in the main plan), then navigates.
  const advance = () => {
    onAdvance(story, step);
    if (isLast) navigate(paths.story(story.id));
    else navigate(paths.storyStep(story.id, step + 1));
  };

  return (
    <>
      <AppBar
        title={stepData.title}
        subtitle={`${stepData.ref} · ${TRANSLATION}`}
        backTo={paths.story(story.id)}
        backDesktop={false}
      />

      <article className="mx-auto max-w-[38rem] px-5 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6">
        {result.status === 'loading' && <StepSkeleton />}

        {result.status === 'error' && (
          <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5">
            <div className="flex gap-3">
              <WarningCircle size={24} weight="fill" className="shrink-0 text-destructive" aria-hidden />
              <div>
                <p className="font-semibold">Error Loading Passage</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Could not load {stepData.ref}. Check your connection and try again.
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
          <>
            <p className="font-reading text-xl leading-[1.65] text-foreground">
              {result.verses.map((v) => (
                <span key={v.verse}>
                  <sup className="mr-0.5 font-sans text-[0.6em] leading-none font-semibold text-primary">{v.verse}</sup>
                  {v.text}{' '}
                </span>
              ))}
            </p>

            <Link
              to={paths.read(stepData.book.name, stepData.chapter)}
              className="mt-6 flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted active:bg-muted"
            >
              <BookOpenText size={22} className="shrink-0 text-muted-foreground" aria-hidden />
              Read {stepData.book.name} {stepData.chapter} in context
            </Link>
          </>
        )}
      </article>

      {/* Fixed action bar mirrors the chapter reader: prev / progress / next. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-[38rem] items-center gap-3 px-4 py-3">
          {step > 1 ? (
            <Link
              to={paths.storyStep(story.id, step - 1)}
              aria-label="Previous passage"
              className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition-transform active:scale-95 hover:bg-muted"
            >
              <CaretLeft size={22} weight="bold" aria-hidden />
            </Link>
          ) : (
            <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground opacity-40">
              <CaretLeft size={22} weight="bold" aria-hidden />
            </span>
          )}

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-medium text-muted-foreground tabular-nums">
              Step {step} of {story.steps.length}
            </p>
            <ProgressBar
              value={step}
              max={story.steps.length}
              tone={isLast ? 'success' : 'primary'}
              label="Story progress"
              className="mt-1.5 h-1.5"
            />
          </div>

          <button
            type="button"
            onClick={advance}
            className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-transform active:scale-95 ${
              isLast ? 'bg-success text-on-success' : 'bg-primary text-on-primary'
            }`}
          >
            {isLast ? (
              <>
                <Check size={20} weight="bold" aria-hidden />
                Finish story
              </>
            ) : (
              <>
                Next passage
                <CaretRight size={20} weight="bold" aria-hidden />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function StepSkeleton() {
  return (
    <div role="status" aria-label="Loading passage" className="animate-pulse space-y-3">
      {[92, 100, 96, 88, 100, 94, 70, 100, 90, 97, 60].map((width, i) => (
        <div key={i} className="h-5 rounded bg-muted" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}
