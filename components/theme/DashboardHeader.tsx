'use client';

import Link from 'next/link';
import { LogOut, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

interface DashboardHeaderProps {
  /** Back-navigation link. If omitted, no back button is shown. */
  backHref?: string;
  backLabel?: string;
  /** Right-side user email + sign-out form. Pass for top-level dashboard. */
  userEmail?: string;
  /** Extra content (e.g. project/module name + badge) rendered after back button. */
  children?: React.ReactNode;
}

export function DashboardHeader({
  backHref,
  backLabel = 'Back',
  userEmail,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </Link>
          )}

          {/* Suite Compile logo mark */}
          {!backHref && (
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold"
                style={{ background: '#00D4B4', color: '#0A0F1E', fontFamily: 'var(--font-sora)' }}
              >
                S
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
                Suite Compile
              </span>
            </div>
          )}

          {children}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userEmail && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:block">{userEmail}</span>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
