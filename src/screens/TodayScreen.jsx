import { format } from 'date-fns';
import { ArrowRight, CaretRight, CheckCircle, Confetti, Flame, WarningCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import ProgressBar from '../components/ProgressBar';
import { TOTAL_CHAPTERS } from '../data/books';
import { groupIntoRanges, nextUnread } from '../lib/progress';
import Link from '../components/Link';
import { paths } from '../lib/router';

const card = 'rounded-2xl border border-border bg-card p-5';

export default function TodayScreen({ progress, plan }) {
  const { completed } = progress;
  const [next] = nextUnread(completed, 1);
  const todayRanges = groupIntoRanges(nextUnread(completed, plan.remainingToday));
  const doneToday = plan.readToday >= plan.todayTarget && plan.todayTarget > 0;
  const overallPct = Math.floor((plan.totalCompleted / TOTAL_CHAPTERS) * 100);

  return (
    <>
      <AppBar title="Today" subtitle={format(new Date(), 'EEEE, d MMMM')} />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        {plan.chaptersLeft === 0 ? (
          <section className={`${card} text-center`}>
            <Confetti size={48} weight="duotone" className="mx-auto text-primary" aria-hidden />
            <h2 className="mt-3 font-serif text-3xl font-semibold">You've read the whole Bible</h2>
            <p className="mt-2 text-muted-foreground">All {TOTAL_CHAPTERS.toLocaleString()} chapters complete. Well done.</p>
          </section>
        ) : plan.deadlinePassed ? (
          <section className={card} role="alert">
            <div className="flex gap-3">
              <WarningCircle size={24} weight="fill" className="shrink-0 text-destructive" aria-hidden />
              <div>
                <h2 className="font-semibold">Your target date has passed</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a new date and we'll work out a fresh daily plan for the {plan.chaptersLeft.toLocaleString()} chapters left.
                </p>
              </div>
            </div>
            <Link
              to={paths.plan}
              className="mt-4 flex h-12 items-center justify-center rounded-xl bg-primary font-semibold text-on-primary transition-transform active:scale-[0.98]"
            >
              Choose a new date
            </Link>
          </section>
        ) : (
          <section className={card} aria-labelledby="today-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="today-heading" className="text-sm font-medium text-muted-foreground">Today's reading</h2>
                <p className="mt-1 text-3xl font-semibold tabular-nums">
                  {plan.readToday}
                  <span className="text-lg font-medium text-muted-foreground"> / {plan.todayTarget} chapters</span>
                </p>
              </div>
              {plan.streak > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  <Flame size={16} weight="fill" aria-hidden />
                  {plan.streak}-day streak
                </span>
              )}
            </div>
            <ProgressBar
              value={plan.readToday}
              max={plan.todayTarget}
              tone={doneToday ? 'success' : 'primary'}
              label="Today's reading progress"
              className="mt-4 h-2"
            />
            {doneToday && (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle size={20} weight="fill" aria-hidden />
                Today's reading is done. Anything more is a head start on tomorrow.
              </p>
            )}
          </section>
        )}

        {next && (
          <Link
            to={paths.read(next.book.name, next.chapter)}
            className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-on-primary shadow-sm transition-transform active:scale-[0.98]"
          >
            <span>
              <span className="block text-sm opacity-90">{plan.totalCompleted === 0 ? 'Start reading' : 'Continue reading'}</span>
              <span className="block font-serif text-2xl font-semibold">
                {next.book.name} {next.chapter}
              </span>
            </span>
            <ArrowRight size={24} weight="bold" aria-hidden />
          </Link>
        )}

        {todayRanges.length > 0 && (
          <section aria-labelledby="up-next-heading">
            <h2 id="up-next-heading" className="px-1 pt-2 pb-2 text-sm font-medium text-muted-foreground">
              Still to read today
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {todayRanges.map(({ book, from, to }) => (
                <li key={`${book.name}-${from}`}>
                  <Link
                    to={paths.read(book.name, from)}
                    className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-muted active:bg-muted"
                  >
                    <span className="flex-1 font-medium">
                      {book.name} {from === to ? from : `${from}–${to}`}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {to - from + 1} ch
                    </span>
                    <CaretRight size={18} className="text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link to={paths.plan} className={`${card} block transition-colors hover:bg-muted active:bg-muted`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-medium">Whole Bible</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{overallPct}%</span>
          </div>
          <ProgressBar value={plan.totalCompleted} max={TOTAL_CHAPTERS} decorative className="mt-3" />
          <p className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="tabular-nums">
              {plan.totalCompleted.toLocaleString()} of {TOTAL_CHAPTERS.toLocaleString()} chapters
              {plan.deadline && !plan.deadlinePassed && (
                <> · {plan.daysLeft} day{plan.daysLeft !== 1 ? 's' : ''} to {format(plan.deadline, 'd MMM')}</>
              )}
            </span>
            <CaretRight size={18} aria-hidden />
          </p>
        </Link>
      </div>
    </>
  );
}
