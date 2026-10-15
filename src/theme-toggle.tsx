import type { JSX } from "react";

export function ThemeToggle(): JSX.Element {
  return (
    <button className="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" aria-pressed="false">
      <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <g className="theme-glyph theme-glyph--sun">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </g>
        <path className="theme-glyph theme-glyph--moon" d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
      </svg>
    </button>
  );
}
