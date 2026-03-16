'use client';

import { useState, useRef, useCallback } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

/* ─── Types ────────────────────────────────────────────────────────────────── */
export interface PrdFileResult {
  name: string;
  text: string;
  size: number;
  error?: string;
}

export interface PrdUploadResult {
  files: PrdFileResult[];
}

interface PrdUploadSectionProps {
  onPrdsReady: (result: PrdUploadResult) => void;
}

type FileStatus = 'extracting' | 'ready' | 'error';

interface ManagedFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  text: string;
  error?: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTS = ['pdf', 'docx', 'txt', 'md'];
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowed(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTS.includes(ext);
}

/* ─── Status dot ────────────────────────────────────────────────────────────── */
function StatusDot({ status }: { status: FileStatus }) {
  const cls =
    status === 'ready'
      ? 'bg-primary'
      : status === 'error'
      ? 'bg-destructive'
      : 'bg-amber-400 animate-pulse';
  return <span className={`inline-block h-2 w-2 rounded-full ${cls} shrink-0`} />;
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export function PrdUploadSection({ onPrdsReady }: PrdUploadSectionProps) {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [zoneError, setZoneError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const atMax = files.length >= MAX_FILES;

  /** Notify parent with current ready files. */
  const notifyParent = useCallback(
    (next: ManagedFile[]) => {
      onPrdsReady({
        files: next.map((f) => ({
          name: f.name,
          text: f.text,
          size: f.size,
          error: f.error,
        })),
      });
    },
    [onPrdsReady]
  );

  /** Add and upload files. */
  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) return;
      setZoneError('');

      const accepted: File[] = [];
      for (const f of arr.slice(0, remaining)) {
        if (!isAllowed(f)) {
          setZoneError(`${f.name}: unsupported type. Use PDF, DOCX, TXT or MD.`);
          continue;
        }
        if (f.size > MAX_FILE_SIZE) {
          setZoneError(`${f.name}: exceeds 20 MB limit.`);
          continue;
        }
        accepted.push(f);
      }
      if (!accepted.length) return;

      // Add placeholder rows immediately
      const placeholders: ManagedFile[] = accepted.map((f) => ({
        id: `${Date.now()}-${f.name}`,
        name: f.name,
        size: f.size,
        status: 'extracting',
        text: '',
      }));

      const next = [...files, ...placeholders];
      setFiles(next);

      // Upload in one request
      const form = new FormData();
      for (const f of accepted) form.append('documents', f);

      let updated = [...next];
      try {
        const res = await fetch('/api/upload/document', { method: 'POST', body: form });
        const data = await res.json();

        if (!res.ok) {
          // Mark all new placeholders as error
          updated = updated.map((m) =>
            placeholders.some((p) => p.id === m.id)
              ? { ...m, status: 'error' as FileStatus, error: data.error ?? 'Upload failed' }
              : m
          );
        } else {
          // Match results back to placeholders by name
          const resultMap: Record<string, { text: string; error?: string }> = {};
          for (const r of (data.files ?? []) as PrdFileResult[]) {
            resultMap[r.name] = { text: r.text, error: r.error };
          }
          updated = updated.map((m) => {
            const match = resultMap[m.name];
            if (!match) return m;
            return match.error
              ? { ...m, status: 'error' as FileStatus, error: match.error }
              : { ...m, status: 'ready' as FileStatus, text: match.text };
          });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : 'Upload failed';
        updated = updated.map((m) =>
          placeholders.some((p) => p.id === m.id)
            ? { ...m, status: 'error' as FileStatus, error: errMsg }
            : m
        );
      }

      setFiles(updated);
      notifyParent(updated);
    },
    [files, notifyParent]
  );

  function removeFile(id: string) {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    notifyParent(next);
  }

  const readyCount = files.filter((f) => f.status === 'ready').length;

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Requirement documents</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload your PRDs, specs, user stories, or any requirement docs. You can add up to{' '}
          {MAX_FILES} files.
        </p>
      </div>

      {/* Drop zone */}
      {atMax ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/10 p-8 text-center opacity-60">
          <p className="text-sm text-muted-foreground">Maximum {MAX_FILES} files reached</p>
        </div>
      ) : (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary/50 bg-primary/5'
              : 'border-border hover:border-primary/40 hover:bg-muted/20'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
        >
          {/* Stack of documents icon */}
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878M4.5 9.878A2.25 2.25 0 003 12v6a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-6a2.25 2.25 0 00-1.5-2.122M4.5 9.878l7.5 4.243 7.5-4.243"
            />
          </svg>
          <p className="text-sm font-medium">Drop your requirement documents here</p>
          <p className="text-xs text-muted-foreground">
            PDF, Word, TXT or Markdown — up to {MAX_FILES} files, 20 MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {zoneError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {zoneError}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
            >
              <StatusDot status={f.status} />

              <span className="flex-1 truncate text-foreground">{f.name}</span>

              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(f.size)}
              </span>

              <span className="shrink-0 text-xs text-muted-foreground">
                {f.status === 'extracting' && 'Extracting…'}
                {f.status === 'ready' && (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready
                  </span>
                )}
                {f.status === 'error' && (
                  <span className="text-destructive" title={f.error}>
                    Could not read this file
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {readyCount} of {files.length} file{files.length !== 1 ? 's' : ''} ready
        </p>
      )}
    </div>
  );
}
