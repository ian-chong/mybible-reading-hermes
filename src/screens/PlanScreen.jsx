import { useState } from 'react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { ArrowCounterClockwise, CheckCircle } from '@phosphor-icons/react';
import AccountCard from '../components/AccountCard';
import AppBar from '../components/AppBar';
import { TOTAL_CHAPTERS } from '../data/books';
import { dayKey } from '../lib/progress';
import { TRANSLATION } from '../utils/bibleApi';

const card = 'rounded-2xl border border-border bg-card p-5';

export default function PlanScreen({ deadline, onDeadlineChange, plan, runs, onStartOver, account, state }) {
  const perDay = plan.schedule[0]?.chapters;
  const stats = [
    { label: 'Days left', value: plan.daysLeft },
    { label: 'Chapters left', value: plan.chaptersLeft.toLocaleString() },
    { label: 'Per day', value: perDay ?? '—' },
    { label: 'Complete', value: `${Math.floor((plan.totalCompleted / TOTAL_CHAPTERS) * 100)}%` },
  ];

  return (
    <>
      <AppBar title="Plan" />

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-5 sm:px-6">
        <section className={card}>
          <label htmlFor="deadline" className="font-medium">
            Target completion date
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            min={dayKey(new Date())}
            onChange={(e) => onDeadlineChange(e.target.value)}
            aria-describedby="deadline-help"
            className="mt-2 block h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground"
          />
          <p id="deadline-help" className={`mt-2 text-sm ${plan.deadlinePassed ? 'text-destructive' : 'text-muted-foreground'}`}>
            {plan.deadlinePassed
              ? 'This date has passed. Choose a date from today onwards.'
              : 'Your daily target is worked out from the chapters left and the days until this date, counting today.'}
          </p>
        </section>

        <dl className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {plan.schedule.length > 0 && (
          <section aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="px-1 pt-2 pb-2 text-sm font-medium text-muted-foreground">
              Next {plan.schedule.length} day{plan.schedule.length !== 1 ? 's' : ''}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {plan.schedule.map((day) => (
                <li key={day.date.toISOString()} className="flex min-h-14 items-center justify-between px-5 py-3">
                  <span className={isToday(day.date) ? 'font-semibold' : ''}>
                    {isToday(day.date) ? 'Today' : format(day.date, 'EEE d MMM')}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {day.chapters} chapter{day.chapters !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AccountCard account={account} state={state} />

        <StartOver plan={plan} onStartOver={onStartOver} />

        {runs.length > 0 && <RunHistory runs={runs} />}

        <p className="px-1 text-center text-xs text-muted-foreground">
          Scripture text: {TRANSLATION} via bible-api.com.
        </p>
      </div>
    </>
  );
}

// The one reset in the app: clears the tracker, Stories and Timeline together by starting
// a new run. The finished or abandoned run stays in history. Two steps so it can't happen by accident.
function StartOver({ plan, onStartOver }) {
  const [open, setOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState(() => dayKey(addDays(new Date(), 365)));
  const finished = plan.chaptersLeft === 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition-colors ${
          finished ? 'bg-primary text-on-primary' : 'border border-destructive/40 text-destructive hover:bg-destructive/10'
        }`}
      >
        <ArrowCounterClockwise size={18} weight="bold" aria-hidden />
        {finished ? 'Read the Bible again' : 'Start over'}
      </button>
    );
  }

  return (
    <section aria-labelledby="start-over-heading" className={`${card} space-y-3`}>
      <h2 id="start-over-heading" className="font-medium">
        {finished ? 'Start a new reading' : 'Start over from the beginning?'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {finished
          ? 'Your completed reading is saved in your history. The tracker, Stories and Timeline start fresh.'
          : `This clears all ${plan.totalCompleted.toLocaleString()} chapters you've marked read, along with your Stories and Timeline progress. This reading is kept in your history.`}
      </p>
      <div>
        <label htmlFor="new-deadline" className="text-sm font-medium">
          New target date
        </label>
        <input
          id="new-deadline"
          type="date"
          value={newDeadline}
          min={dayKey(new Date())}
          onChange={(e) => setNewDeadline(e.target.value)}
          className="mt-1 block h-12 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-12 rounded-xl border border-border font-semibold hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!newDeadline}
          onClick={() => {
            onStartOver(newDeadline);
            setOpen(false);
          }}
          className={`h-12 rounded-xl font-semibold disabled:opacity-50 ${finished ? 'bg-primary text-on-primary' : 'bg-destructive text-white'}`}
        >
          Start over
        </button>
      </div>
    </section>
  );
}

function RunHistory({ runs }) {
  return (
    <section aria-labelledby="history-heading">
      <h2 id="history-heading" className="px-1 pt-2 pb-2 text-sm font-medium text-muted-foreground">
        Past readings
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {runs.map((run) => (
          <li key={run.id} className="flex min-h-14 items-center justify-between gap-3 px-5 py-3">
            <span className="flex items-center gap-2">
              {run.status === 'completed' && <CheckCircle size={20} weight="fill" className="text-success" aria-label="Completed" />}
              <span>
                {format(parseISO(run.startedAt), 'd MMM yyyy')} – {format(parseISO(run.endedAt), 'd MMM yyyy')}
              </span>
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {run.status === 'completed' ? 'Finished' : `${Math.floor((run.chaptersRead / TOTAL_CHAPTERS) * 100)}% read`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
