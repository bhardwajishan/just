'use client';

import { useState, useEffect } from 'react';

interface WaitlistFormProps {
  isDark: boolean;
}

export function WaitlistForm({ isDark }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('waitlist_email')) {
      setSubmitted(true);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    localStorage.setItem('waitlist_email', email);
    setSubmitted(true);
  }

  const inputBg     = isDark ? '#0D1424'                : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)';
  const inputFocus  = '#00D4B4';
  const inputText   = isDark ? '#E2E8F0'                : '#0A0F1E';

  if (submitted) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <path d="M4 10.5l4 4 8-8" stroke="#00D4B4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-teal-400 font-medium">You&rsquo;re on the list!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors"
        style={{
          background: inputBg,
          border: `1px solid ${inputBorder}`,
          color: inputText,
          caretColor: inputFocus,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = inputFocus)}
        onBlur={(e) => (e.currentTarget.style.borderColor = inputBorder)}
      />
      <button
        type="submit"
        className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 whitespace-nowrap"
        style={{ background: '#00D4B4', color: '#0A0F1E' }}
      >
        Notify me
      </button>
    </form>
  );
}
