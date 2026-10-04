import { formatRuns, readRanges } from '../lib/progress';

// A book drawn left to right, chapter 1 to the last: the lit segments are exactly the chapters read,
// so reading the last 15 of 30 chapters lights the right half.
export default function ChapterMap({ book, read = [], className = '' }) {
  const runs = readRanges(read);
  const done = read.length === book.chapters;
  const description = runs.length ? `Chapters read: ${formatRuns(runs)} of ${book.chapters}` : `No chapters read yet of ${book.chapters}`;

  return (
    <div className={className}>
      <div role="img" aria-label={description} className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
        {runs.map(({ from, to }) => (
          <span
            key={from}
            data-testid="chapter-map-run"
            className={`absolute inset-y-0 ${done ? 'bg-success' : 'bg-primary'}`}
            style={{ left: `${((from - 1) / book.chapters) * 100}%`, width: `${((to - from + 1) / book.chapters) * 100}%` }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>Ch 1</span>
        {book.chapters > 2 && <span>Ch {Math.ceil(book.chapters / 2)}</span>}
        {book.chapters > 1 && <span>Ch {book.chapters}</span>}
      </div>
    </div>
  );
}
