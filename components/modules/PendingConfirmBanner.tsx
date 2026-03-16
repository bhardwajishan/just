'use client';

import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TestCase } from '@/lib/types';

interface PendingConfirmBannerProps {
  pendingTestCases: TestCase[];
  onConfirm: () => Promise<void>;
  onDiscard: () => void;
  isConfirming: boolean;
}

export function PendingConfirmBanner({
  pendingTestCases,
  onConfirm,
  onDiscard,
  isConfirming,
}: PendingConfirmBannerProps) {
  if (pendingTestCases.length === 0) return null;

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm"
      style={{
        borderColor: 'rgba(0, 212, 180, 0.3)',
        background: 'rgba(0, 212, 180, 0.06)',
      }}
    >
      <div className="flex items-center gap-2" style={{ color: '#00D4B4' }}>
        <div
          className="h-2 w-2 animate-pulse rounded-full"
          style={{ background: '#00D4B4' }}
        />
        <span className="font-medium">
          {pendingTestCases.length} test case{pendingTestCases.length !== 1 ? 's' : ''} pending review
        </span>
        <span className="text-muted-foreground">— confirm to save or discard changes</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          disabled={isConfirming}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <XCircle className="h-4 w-4" />
          Discard
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isConfirming}
          className="font-semibold"
          style={{ background: '#00D4B4', color: '#0A0F1E' }}
        >
          {isConfirming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isConfirming ? 'Saving…' : 'Confirm & Save'}
        </Button>
      </div>
    </div>
  );
}
