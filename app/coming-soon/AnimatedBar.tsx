'use client';

import { useState, useEffect } from 'react';

interface AnimatedBarProps {
  pct: number;
}

export function AnimatedBar({ pct }: AnimatedBarProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="h-full bg-teal-500 rounded-full transition-all duration-1000"
      style={{ width: active ? `${pct}%` : '0%' }}
    />
  );
}
