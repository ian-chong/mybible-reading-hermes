import { navigate } from '../lib/router';

// In-app link: a real <a href> (long-press, open in new tab) that navigates without a page load.
export default function Link({ to, onClick, ...props }) {
  const handleClick = (e) => {
    onClick?.(e);
    // Let modified clicks (new tab etc.) behave normally.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={handleClick} {...props} />;
}
