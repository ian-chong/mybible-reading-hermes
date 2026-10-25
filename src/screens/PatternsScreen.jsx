import { CaretRight, CheckCircle } from '@phosphor-icons/react';
import AppBar from '../components/AppBar';
import Link from '../components/Link';
import ProgressBar from '../components/ProgressBar';
import { ANTITYPE_HELP, patternList } from '../data/patterns';
import { paths } from '../lib/router';

export default function PatternsScreen({ stories }) {
  return (
    <>
      <AppBar title="Types & Shadows" subtitle="Patterns fulfilled in Christ" backTo={paths.explore} backDesktop={false} />

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{ANTITYPE_HELP}</p>
          <blockquote className="mt-3 border-l-4 border-primary pl-3 font-serif text-lg italic">
            “Which are a shadow of things to come; but the body is of Christ.”
            <footer className="mt-1 font-sans text-sm not-italic text-muted-foreground">Colossians 2:17</footer>
          </blockquote>
          <p className="mt-3 text-xs text-muted-foreground">Every pattern here is one the New Testament itself names.</p>
        </section>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patternList.map((pattern) => {
            const read = stories[pattern.key]?.steps?.length ?? 0;
            const done = read === pattern.steps.length;
            return (
              <li key={pattern.id}>
                <Link
                  to={paths.pattern(pattern.id)}
                  className="flex h-full min-h-14 flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted active:bg-muted"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-xl font-semibold">{pattern.name}</span>
                    {done ? (
                      <CheckCircle size={22} weight="fill" className="shrink-0 self-center text-success" aria-label="Finished" />
                    ) : (
                      <CaretRight size={18} className="shrink-0 self-center text-muted-foreground" aria-hidden />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {pattern.type[0].ref.split(':')[0]} → {pattern.link.ref}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                    {read}/{pattern.steps.length} passages
                  </p>
                  <ProgressBar value={read} max={pattern.steps.length} tone={done ? 'success' : 'primary'} decorative className="mt-2" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
