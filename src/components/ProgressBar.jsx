// Thin progress track. Animates with transform (not width) to avoid layout work.
// `decorative` hides it from screen readers when the same numbers are already in nearby text.
export default function ProgressBar({ value, max, tone = 'primary', label, decorative = false, className = '' }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value };

  return (
    <div {...a11y} className={`h-1.5 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className={`h-full w-full origin-left rounded-full transition-transform duration-300 ease-out ${tone === 'success' ? 'bg-success' : 'bg-primary'}`}
        style={{ transform: `scaleX(${ratio})` }}
      />
    </div>
  );
}
