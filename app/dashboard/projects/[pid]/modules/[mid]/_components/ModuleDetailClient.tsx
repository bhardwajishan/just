'use client';

import { useState, useCallback, useEffect } from 'react';
import { TestCaseTable } from '@/components/modules/TestCaseTable';
import { RagChatPanel } from '@/components/modules/RagChatPanel';
import { PendingConfirmBanner } from '@/components/modules/PendingConfirmBanner';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import type { Module, TestCase, ChatMessage } from '@/lib/types';

interface ModuleDetailClientProps {
  module: Module;
  initialTestCases: TestCase[];
  initialChatHistory: ChatMessage[];
}

export function ModuleDetailClient({
  module,
  initialTestCases,
  initialChatHistory,
}: ModuleDetailClientProps) {
  const [savedTestCases, setSavedTestCases] = useState<TestCase[]>(initialTestCases);
  const [pendingTestCases, setPendingTestCases] = useState<TestCase[]>([]);

  // On first mount, check if the wizard stashed freshly generated test cases
  // in sessionStorage (they haven't been confirmed/saved to DB yet)
  useEffect(() => {
    const key = `pending_tc_${module.id}`;
    const stashed = sessionStorage.getItem(key);
    if (stashed) {
      try {
        const parsed: TestCase[] = JSON.parse(stashed);
        if (parsed.length > 0) setPendingTestCases(parsed);
      } catch {
        // malformed entry — ignore
      }
      sessionStorage.removeItem(key);
    }
  }, [module.id]);
  const [pendingChatMessage, setPendingChatMessage] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);

  // The table shows pending if available, otherwise saved
  const displayedTestCases =
    pendingTestCases.length > 0 ? pendingTestCases : savedTestCases;

  const handleNewTestCases = useCallback(
    (testCases: TestCase[], userMessage: string) => {
      setPendingTestCases(testCases);
      setPendingChatMessage(userMessage);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/modules/${module.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testCases: pendingTestCases,
          chatMessage: pendingChatMessage
            ? { role: 'user', content: pendingChatMessage }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');

      setSavedTestCases(pendingTestCases);
      setPendingTestCases([]);
      setPendingChatMessage('');
    } catch (err) {
      console.error('Confirm error:', err);
    } finally {
      setIsConfirming(false);
    }
  }, [module.id, pendingTestCases, pendingChatMessage]);

  const handleDiscard = useCallback(() => {
    setPendingTestCases([]);
    setPendingChatMessage('');
  }, []);

  const handleUpdateTestCase = useCallback(
    (updated: TestCase) => {
      if (pendingTestCases.length > 0) {
        setPendingTestCases((prev) =>
          prev.map((tc) => (tc.id === updated.id ? updated : tc))
        );
      } else {
        setSavedTestCases((prev) =>
          prev.map((tc) => (tc.id === updated.id ? updated : tc))
        );
        setPendingTestCases(
          savedTestCases.map((tc) => (tc.id === updated.id ? updated : tc))
        );
      }
    },
    [pendingTestCases, savedTestCases]
  );

  return (
    <div className="space-y-4">
      {/* Pending banner */}
      <PendingConfirmBanner
        pendingTestCases={pendingTestCases}
        onConfirm={handleConfirm}
        onDiscard={handleDiscard}
        isConfirming={isConfirming}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{module.name}</h2>
          <p className="text-xs text-muted-foreground">
            {displayedTestCases.length} test case{displayedTestCases.length !== 1 ? 's' : ''}
            {pendingTestCases.length > 0 && (
              <span className="ml-1 text-amber-600">(pending confirmation)</span>
            )}
          </p>
        </div>
        <ExportToolbar moduleId={module.id} testCases={savedTestCases} />
      </div>

      {/* Main layout: table + chat */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <TestCaseTable
          testCases={displayedTestCases}
          onUpdate={handleUpdateTestCase}
        />
        <div className="lg:h-[calc(100vh-240px)]">
          <RagChatPanel
            moduleId={module.id}
            initialHistory={initialChatHistory}
            onNewTestCases={handleNewTestCases}
          />
        </div>
      </div>
    </div>
  );
}
