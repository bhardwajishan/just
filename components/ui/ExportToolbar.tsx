'use client';

import { useState } from 'react';
import { Download, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toTSV } from '@/lib/export';
import type { TestCase } from '@/lib/types';

interface ExportToolbarProps {
  moduleId: string;
  testCases: TestCase[];
}

export function ExportToolbar({ moduleId, testCases }: ExportToolbarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleDownloadXML() {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/export/xml`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.href = url;
      a.download = match?.[1] ?? 'test-cases.xml';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('XML export error', err);
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleCopyTSV() {
    const tsv = toTSV(testCases);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = tsv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (testCases.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadXML}
        disabled={isDownloading}
        className="gap-1.5"
      >
        {isDownloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Download XML
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyTSV}
        className="gap-1.5"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied!' : 'Copy for Sheets'}
      </Button>
    </div>
  );
}
