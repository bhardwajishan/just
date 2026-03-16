'use client';

import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { Loader2, X, Lock, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ─── Types ────────────────────────────────────────────────────────────────── */
export interface FigmaInputResult {
  type: 'url' | 'pdf' | 'screenshot' | null;
  figmaUrl?: string;
  extractedDescription?: string;
  filePaths?: string[];
}

export interface FigmaInputHandle {
  /** Called after the module is created — saves any pending token to the DB. */
  savePendingToken: (moduleId: string) => Promise<void>;
}

interface FigmaInputSectionProps {
  moduleId?: string;
  onFigmaReady: (result: FigmaInputResult) => void;
}

type Tab = 'url' | 'pdf' | 'screenshot';

interface SavedTokenState {
  hasToken: boolean;
  tokenPreview?: string;
}

interface UploadedFile {
  file: File;
  id: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_IMG_SIZE = 10 * 1024 * 1024;
const MAX_PDFS = 3;
const MAX_SCREENSHOTS = 10;

function isFigmaUrl(value: string) {
  return /https?:\/\/(www\.)?figma\.com\/(file|design|proto)\/[A-Za-z0-9]+/.test(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Indeterminate progress bar ──────────────────────────────────────────── */
function IndeterminateBar() {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-border">
      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .sc-bar { animation: indeterminate 1.4s ease-in-out infinite; }
      `}</style>
      <div className="sc-bar absolute inset-y-0 w-1/2 rounded-full bg-primary" />
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────────────────────── */
const FigmaInputSection = forwardRef<FigmaInputHandle, FigmaInputSectionProps>(
  function FigmaInputSection({ moduleId, onFigmaReady }, ref) {
    const [activeTab, setActiveTab] = useState<Tab>('url');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    /* ── URL tab state ── */
    const [figmaUrl, setFigmaUrl] = useState('');
    const [urlValid, setUrlValid] = useState(false);
    const [savedToken, setSavedToken] = useState<SavedTokenState | null>(null);
    const [showTokenInput, setShowTokenInput] = useState(false);
    const [pendingToken, setPendingToken] = useState('');
    const [tokenSaved, setTokenSaved] = useState(false);

    /* ── PDF tab state ── */
    const [pdfFiles, setPdfFiles] = useState<UploadedFile[]>([]);
    const [pdfDragOver, setPdfDragOver] = useState(false);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    /* ── Screenshot tab state ── */
    const [screenshots, setScreenshots] = useState<UploadedFile[]>([]);
    const [screenshotThumbs, setScreenshotThumbs] = useState<Record<string, string>>({});
    const [imgDragOver, setImgDragOver] = useState(false);
    const imgInputRef = useRef<HTMLInputElement>(null);

    /* ── Load saved token on mount (if moduleId given) ── */
    useEffect(() => {
      if (!moduleId) return;
      fetch(`/api/modules/${moduleId}/figma-token`)
        .then((r) => r.json())
        .then((d: SavedTokenState) => {
          setSavedToken(d);
          setShowTokenInput(!d.hasToken);
        })
        .catch(() => setShowTokenInput(true));
    }, [moduleId]);

    /* ── Expose savePendingToken ref ── */
    useImperativeHandle(ref, () => ({
      async savePendingToken(newModuleId: string) {
        if (!pendingToken.trim()) return;
        try {
          await fetch(`/api/modules/${newModuleId}/figma-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: pendingToken }),
          });
        } catch {
          // Non-fatal — token can be added later from the module detail page
        }
      },
    }));

    /* ── URL validation on blur/change ── */
    function handleUrlChange(val: string) {
      setFigmaUrl(val);
      const valid = isFigmaUrl(val);
      setUrlValid(valid);
      if (!valid) {
        onFigmaReady({ type: null });
      }
    }

    /* ── Save token (when moduleId already exists) ── */
    async function handleSaveToken() {
      if (!pendingToken.trim()) return;
      if (!moduleId) {
        // No module yet — just mark as tokenSaved and signal ready
        setTokenSaved(true);
        onFigmaReady({ type: 'url', figmaUrl });
        return;
      }
      setIsProcessing(true);
      try {
        const res = await fetch(`/api/modules/${moduleId}/figma-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pendingToken }),
        });
        if (!res.ok) throw new Error('Failed to save token');
        setTokenSaved(true);
        setSavedToken({ hasToken: true, tokenPreview: `••••••${pendingToken.slice(-4)}` });
        setShowTokenInput(false);
        onFigmaReady({ type: 'url', figmaUrl });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save token');
      } finally {
        setIsProcessing(false);
      }
    }

    /* ── Remove token ── */
    async function handleRemoveToken() {
      if (!moduleId) return;
      await fetch(`/api/modules/${moduleId}/figma-token`, { method: 'DELETE' });
      setSavedToken({ hasToken: false });
      setShowTokenInput(true);
      setPendingToken('');
      setTokenSaved(false);
      onFigmaReady({ type: null });
    }

    /* ── PDF helpers ── */
    const addPdfs = useCallback(
      async (incoming: FileList | File[]) => {
        const files = Array.from(incoming);
        const remaining = MAX_PDFS - pdfFiles.length;
        if (remaining <= 0) return;
        setError('');

        const valid: UploadedFile[] = [];
        for (const f of files.slice(0, remaining)) {
          if (f.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            continue;
          }
          if (f.size > MAX_PDF_SIZE) {
            setError(`${f.name} is too large (max 20 MB).`);
            continue;
          }
          valid.push({ file: f, id: `${Date.now()}-${f.name}` });
        }
        if (!valid.length) return;

        const next = [...pdfFiles, ...valid];
        setPdfFiles(next);

        // Upload all PDFs together and extract description
        setIsProcessing(true);
        try {
          const form = new FormData();
          for (const u of next) form.append('files', u.file);
          const res = await fetch('/api/upload/figma-pdf', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Upload failed');
          onFigmaReady({
            type: 'pdf',
            extractedDescription: data.description,
            filePaths: data.filePaths ?? [],
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
          setIsProcessing(false);
        }
      },
      [pdfFiles, onFigmaReady]
    );

    function removePdf(id: string) {
      const next = pdfFiles.filter((f) => f.id !== id);
      setPdfFiles(next);
      if (!next.length) onFigmaReady({ type: null });
    }

    /* ── Screenshot helpers ── */
    const addScreenshots = useCallback(
      async (incoming: FileList | File[]) => {
        const files = Array.from(incoming);
        const remaining = MAX_SCREENSHOTS - screenshots.length;
        if (remaining <= 0) return;
        setError('');

        const valid: UploadedFile[] = [];
        const thumbUpdates: Record<string, string> = {};

        for (const f of files.slice(0, remaining)) {
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
            setError('Only PNG, JPG, and WebP images are allowed.');
            continue;
          }
          if (f.size > MAX_IMG_SIZE) {
            setError(`${f.name} is too large (max 10 MB).`);
            continue;
          }
          const id = `${Date.now()}-${f.name}`;
          valid.push({ file: f, id });
          thumbUpdates[id] = URL.createObjectURL(f);
        }
        if (!valid.length) return;

        const next = [...screenshots, ...valid];
        setScreenshots(next);
        setScreenshotThumbs((prev) => ({ ...prev, ...thumbUpdates }));

        setIsProcessing(true);
        try {
          const form = new FormData();
          for (const u of next) form.append('files', u.file);
          const res = await fetch('/api/upload/figma-screenshots', { method: 'POST', body: form });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? 'Upload failed');
          onFigmaReady({
            type: 'screenshot',
            extractedDescription: data.description,
            filePaths: data.filePaths ?? [],
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Upload failed');
        } finally {
          setIsProcessing(false);
        }
      },
      [screenshots, onFigmaReady]
    );

    function removeScreenshot(id: string) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      setScreenshotThumbs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (screenshots.length <= 1) onFigmaReady({ type: null });
    }

    /* ── Tab switch ── */
    function switchTab(t: Tab) {
      if (isProcessing) return;
      setActiveTab(t);
      setError('');
      onFigmaReady({ type: null });
    }

    /* ─── Render ─────────────────────────────────────────────────────────── */
    const tabs: { key: Tab; label: string }[] = [
      { key: 'url', label: 'Figma URL' },
      { key: 'pdf', label: 'PDF' },
      { key: 'screenshot', label: 'Screenshots' },
    ];

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Design reference (optional)</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Help the AI understand your UI for more accurate test cases.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              disabled={isProcessing}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isProcessing && (
          <div className="space-y-1">
            <IndeterminateBar />
            <p className="text-xs text-muted-foreground">Extracting UI context…</p>
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {/* ── URL tab ── */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <Input
              value={figmaUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onBlur={() => {
                if (urlValid) onFigmaReady({ type: 'url', figmaUrl });
              }}
              placeholder="https://www.figma.com/file/…"
            />

            {urlValid && (
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium text-foreground">Figma access token</p>

                {/* Saved token row */}
                {savedToken?.hasToken && !showTokenInput && (
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">
                      Figma token saved ({savedToken.tokenPreview})
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveToken}
                      className="ml-1 text-destructive hover:underline"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTokenInput(true)}
                      className="text-muted-foreground hover:underline"
                    >
                      Update
                    </button>
                  </div>
                )}

                {/* Token input */}
                {(!savedToken?.hasToken || showTokenInput) && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Required to read your Figma file. Get yours at{' '}
                      <a
                        href="https://www.figma.com/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Settings → Access tokens
                      </a>
                      .
                    </p>
                    <Input
                      type="password"
                      value={pendingToken}
                      onChange={(e) => setPendingToken(e.target.value)}
                      placeholder="figd_…"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your token is encrypted and stored only for this module. It is never
                      shared or used outside Suite Compile.
                    </p>
                    {!moduleId && (
                      <p className="text-xs text-muted-foreground italic">
                        Token will be saved when you create this module.
                      </p>
                    )}

                    {tokenSaved ? (
                      <div className="flex items-center gap-1.5 text-xs text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Token saved
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSaveToken}
                        disabled={!pendingToken.trim() || isProcessing}
                        className="gap-1.5"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                        Save token
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PDF tab ── */}
        {activeTab === 'pdf' && (
          <div className="space-y-3">
            {pdfFiles.length < MAX_PDFS && (
              <div
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  pdfDragOver
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/20'
                }`}
                onClick={() => pdfInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                onDragLeave={() => setPdfDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setPdfDragOver(false);
                  if (e.dataTransfer.files) addPdfs(e.dataTransfer.files);
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm font-medium">Drop your Figma PDF export here</p>
                <p className="text-xs text-muted-foreground">
                  or click to browse — PDF only, max 20 MB (up to {MAX_PDFS} files)
                </p>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addPdfs(e.target.files); e.target.value = ''; }}
                />
              </div>
            )}

            {pdfFiles.length >= MAX_PDFS && (
              <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
                Maximum {MAX_PDFS} PDFs reached
              </p>
            )}

            {pdfFiles.length > 0 && (
              <ul className="space-y-1">
                {pdfFiles.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="truncate text-foreground">{u.file.name}</span>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground">{formatBytes(u.file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removePdf(u.id)}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isProcessing && pdfFiles.length > 0 && !error && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Design context extracted successfully
              </div>
            )}
          </div>
        )}

        {/* ── Screenshot tab ── */}
        {activeTab === 'screenshot' && (
          <div className="space-y-3">
            {screenshots.length < MAX_SCREENSHOTS && (
              <div
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  imgDragOver
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/20'
                }`}
                onClick={() => imgInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setImgDragOver(true); }}
                onDragLeave={() => setImgDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImgDragOver(false);
                  if (e.dataTransfer.files) addScreenshots(e.dataTransfer.files);
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="text-sm font-medium">Drop your UI screenshots here</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or WebP — up to {MAX_SCREENSHOTS} screenshots, 10 MB each
                </p>
                <input
                  ref={imgInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addScreenshots(e.target.files); e.target.value = ''; }}
                />
              </div>
            )}

            {screenshots.length >= MAX_SCREENSHOTS && (
              <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
                Maximum {MAX_SCREENSHOTS} screenshots reached
              </p>
            )}

            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {screenshots.map((u) => (
                  <div key={u.id} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotThumbs[u.id]}
                      alt={u.file.name}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(u.id)}
                      disabled={isProcessing}
                      className="absolute right-1 top-1 hidden rounded-full bg-background/80 p-0.5 text-foreground group-hover:flex"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isProcessing && screenshots.length > 0 && !error && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                UI context extracted from {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

FigmaInputSection.displayName = 'FigmaInputSection';

export { FigmaInputSection };
