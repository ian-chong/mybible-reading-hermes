import { CaretLeft } from '@phosphor-icons/react';
import { goBack } from '../lib/router';

// Sticky top bar. Pass `backTo` to show a back button (hidden on desktop when `backDesktop` is false).
export default function AppBar({ title, subtitle, backTo, backDesktop = true, trailing }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-2 sm:px-4">
        {backTo && (
          <button
            type="button"
            onClick={() => goBack(backTo)}
            aria-label="Back"
            className={`-ml-1 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted active:bg-muted ${backDesktop ? '' : 'lg:hidden'}`}
          >
            <CaretLeft size={24} weight="bold" aria-hidden />
          </button>
        )}
        <div className={`min-w-0 flex-1 ${backTo ? '' : 'pl-2'} ${backTo && !backDesktop ? 'lg:pl-2' : ''}`}>
          <h1 className="truncate font-serif text-2xl leading-tight font-semibold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {trailing}
      </div>
    </header>
  );
}
