'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'suite_compile_banner_dismissed';

export function ComingSoonBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="w-full flex items-center justify-between gap-4 bg-card border border-border border-l-4 border-l-teal-500 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
        <span className="text-sm text-foreground/80">
          Web automation and mobile automation are coming to Suite Compile.
        </span>
        <a
          href="/coming-soon"
          className="text-sm text-teal-400 hover:text-teal-300 underline-offset-2 hover:underline ml-1 whitespace-nowrap transition-colors"
        >
          See what&rsquo;s coming →
        </a>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded flex-shrink-0"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>
    </div>
  );
}
