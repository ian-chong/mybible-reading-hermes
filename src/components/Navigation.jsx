import { BookOpenText, CalendarCheck, SunHorizon } from '@phosphor-icons/react';
import Link from './Link';
import { paths } from '../lib/router';

const tabs = [
  { id: 'today', label: 'Today', to: paths.today, Icon: SunHorizon },
  { id: 'bible', label: 'Bible', to: paths.bible, Icon: BookOpenText },
  { id: 'plan', label: 'Plan', to: paths.plan, Icon: CalendarCheck },
];

// Phones and tablets: bottom tab bar.
export function TabBar({ active }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {tabs.map(({ id, label, to, Icon }) => {
          const isActive = id === active;
          return (
            <li key={id}>
              <Link
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Desktop (≥1024px): the same destinations as a sidebar.
export function SideNav({ active }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <p className="px-3 font-display text-lg font-semibold tracking-wide">My Bible Reading</p>
      <nav aria-label="Main" className="mt-8">
        <ul className="space-y-1">
          {tabs.map(({ id, label, to, Icon }) => {
            const isActive = id === active;
            return (
              <li key={id}>
                <Link
                  to={to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Icon size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <p className="mt-auto px-3 text-xs text-muted-foreground">Progress is saved on this device.</p>
    </aside>
  );
}
