import { format, isToday } from 'date-fns';
import AppBar from '../components/AppBar';
import { TOTAL_CHAPTERS } from '../data/books';
import { dayKey } from '../lib/progress';
import { TRANSLATION } from '../utils/bibleApi';

const card = 'rounded-2xl border border-border bg-card p-5';

export default function PlanScreen({ deadline, onDeadlineChange, plan }) {
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

        <p className="px-1 text-center text-xs text-muted-foreground">
          Progress is saved on this device only. Scripture text: {TRANSLATION} via bible-api.com.
        </p>
      </div>
    </>
  );
}
