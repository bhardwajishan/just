'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight, ChevronLeft, Wand2, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PrdUploadSection } from './PrdUploadSection';
import { FigmaInputSection } from './FigmaInputSection';
import type { PrdUploadResult } from './PrdUploadSection';
import type { FigmaInputResult, FigmaInputHandle } from './FigmaInputSection';

interface CreateModuleWizardProps {
  projectId: string;
  onGenerated: () => void;
}

interface WizardState {
  name: string;
  flow_description: string;
  desired_count: number;
  coverage_areas: string[];
}

const COVERAGE_PRESETS = [
  'Authentication',
  'Form Validation',
  'Error Handling',
  'Navigation',
  'CRUD Operations',
  'Permissions',
  'Responsive UI',
  'Performance',
  'Data Display',
  'Search & Filter',
];

export function CreateModuleWizard({ projectId, onGenerated }: CreateModuleWizardProps) {
  const router = useRouter();
  const figmaInputRef = useRef<FigmaInputHandle>(null);

  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverageInput, setCoverageInput] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof WizardState, string>>>({});
  const [globalError, setGlobalError] = useState('');

  const [state, setState] = useState<WizardState>({
    name: '',
    flow_description: '',
    desired_count: 10,
    coverage_areas: [],
  });

  // Multi-file PRD state
  const [prdFiles, setPrdFiles] = useState<PrdUploadResult['files']>([]);

  // Figma input state
  const [figmaResult, setFigmaResult] = useState<FigmaInputResult | null>(null);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handlePrdsReady(result: PrdUploadResult) {
    setPrdFiles(result.files);
  }

  function handleFigmaReady(result: FigmaInputResult) {
    setFigmaResult(result.type ? result : null);
  }

  function addCoverageArea(area: string) {
    const trimmed = area.trim();
    if (!trimmed || state.coverage_areas.includes(trimmed)) return;
    update('coverage_areas', [...state.coverage_areas, trimmed]);
  }

  function removeCoverageArea(area: string) {
    update('coverage_areas', state.coverage_areas.filter((a) => a !== area));
  }

  function validateStep1() {
    const errs: typeof errors = {};
    if (!state.name.trim()) errs.name = 'Module name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2() {
    const errs: typeof errors = {};
    if (state.desired_count < 1 || state.desired_count > 100) {
      errs.desired_count = 'Must be between 1 and 100';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleGenerate() {
    if (!validateStep2()) return;
    setIsGenerating(true);
    setGlobalError('');

    try {
      const readyPrds = prdFiles.filter((f) => f.text);
      const prdTexts = readyPrds.map((f) => f.text);

      // ── Step 1: Create the module ─────────────────────────────────────────
      const moduleRes = await fetch('/api/modules/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: state.name,
          // Legacy single-field for backward compat
          prd_text: prdTexts.join('\n\n---\n\n') || null,
          figma_url: figmaResult?.type === 'url' ? figmaResult.figmaUrl : null,
          figma_description: figmaResult?.extractedDescription ?? null,
          figma_input_type: figmaResult?.type ?? null,
          flow_description: state.flow_description,
          desired_count: state.desired_count,
          coverage_areas: state.coverage_areas,
        }),
      });
      const moduleData = await moduleRes.json();
      if (!moduleRes.ok) throw new Error(moduleData.error ?? 'Failed to create module');

      const moduleId: string = moduleData.id;

      // ── Step 2: Save pending Figma token (if URL type) ────────────────────
      await figmaInputRef.current?.savePendingToken(moduleId);

      // ── Step 3: If Figma URL, fetch description from Figma API ───────────
      let figmaDescription = figmaResult?.extractedDescription ?? '';
      if (figmaResult?.type === 'url' && figmaResult.figmaUrl && !figmaDescription) {
        try {
          const figmaRes = await fetch('/api/upload/figma', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              figma_url: figmaResult.figmaUrl,
              moduleId,
            }),
          });
          if (figmaRes.ok) {
            const figmaData = await figmaRes.json();
            figmaDescription = figmaData.description ?? '';
          }
        } catch {
          // Non-fatal — generation proceeds without Figma context
        }
      }

      // ── Step 4: Generate test cases ───────────────────────────────────────
      const genRes = await fetch('/api/modules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleData: {
            prd_texts: prdTexts,
            figma_description: figmaDescription,
            flow_description: state.flow_description,
            desired_count: state.desired_count,
            coverage_areas: state.coverage_areas,
          },
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error ?? 'Failed to generate test cases');

      sessionStorage.setItem(`pending_tc_${moduleId}`, JSON.stringify(genData.testCases));

      onGenerated();
      router.push(`/dashboard/projects/${projectId}/modules/${moduleId}`);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }

  /* ─── Derived review labels ──────────────────────────────────────────────── */
  const prdSummary = (() => {
    const ready = prdFiles.filter((f) => f.text);
    if (!ready.length) return 'None';
    return `${ready.length} document${ready.length !== 1 ? 's' : ''}`;
  })();

  const figmaSummary = (() => {
    if (!figmaResult?.type) return 'None';
    if (figmaResult.type === 'url') return `Figma URL`;
    if (figmaResult.type === 'pdf')
      return `Figma PDF${figmaResult.filePaths?.length ? ` (${figmaResult.filePaths.length} file${figmaResult.filePaths.length !== 1 ? 's' : ''})` : ''}`;
    if (figmaResult.type === 'screenshot')
      return `${figmaResult.filePaths?.length ?? 0} UI screenshot${(figmaResult.filePaths?.length ?? 0) !== 1 ? 's' : ''}`;
    return 'None';
  })();

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            <span
              className={`text-sm ${
                s === step ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s === 1 ? 'Basics & Docs' : s === 2 ? 'Flow & Coverage' : 'Review & Generate'}
            </span>
            {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-6 rounded-lg border p-6">
          <div>
            <h2 className="text-lg font-semibold">Module Details</h2>
            <p className="text-sm text-muted-foreground">
              Name this module, attach requirement documents, and optionally add a design reference.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Module Name *</Label>
            <Input
              id="name"
              value={state.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. User Authentication Flow"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Multi-file PRD upload */}
          <PrdUploadSection onPrdsReady={handlePrdsReady} />

          {/* Figma input section */}
          <FigmaInputSection
            ref={figmaInputRef}
            moduleId={undefined}
            onFigmaReady={handleFigmaReady}
          />

          <div className="flex justify-end">
            <Button onClick={() => validateStep1() && setStep(2)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-5 rounded-lg border p-6">
          <div>
            <h2 className="text-lg font-semibold">Flow & Coverage</h2>
            <p className="text-sm text-muted-foreground">
              Describe the user flow and select coverage areas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flow">User Flow Description *</Label>
            <Textarea
              id="flow"
              value={state.flow_description}
              onChange={(e) => update('flow_description', e.target.value)}
              placeholder="Describe the complete user flow, key actions, edge cases to focus on, and any specific scenarios you want covered…"
              className="min-h-[160px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Coverage Areas</Label>
            <div className="flex flex-wrap gap-2">
              {COVERAGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    state.coverage_areas.includes(preset)
                      ? removeCoverageArea(preset)
                      : addCoverageArea(preset)
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    state.coverage_areas.includes(preset)
                      ? 'border-primary bg-primary/10 font-medium text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={coverageInput}
                onChange={(e) => setCoverageInput(e.target.value)}
                placeholder="Add custom area…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCoverageArea(coverageInput);
                    setCoverageInput('');
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  addCoverageArea(coverageInput);
                  setCoverageInput('');
                }}
              >
                Add
              </Button>
            </div>
            {state.coverage_areas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {state.coverage_areas.map((area) => (
                  <Badge key={area} variant="secondary" className="gap-1">
                    {area}
                    <button onClick={() => removeCoverageArea(area)}>
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Desired Test Case Count</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={state.desired_count}
              onChange={(e) => update('desired_count', parseInt(e.target.value, 10) || 10)}
              className="w-32"
            />
            {errors.desired_count && (
              <p className="text-xs text-destructive">{errors.desired_count}</p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => validateStep2() && setStep(3)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="space-y-5 rounded-lg border p-6">
          <div>
            <h2 className="text-lg font-semibold">Review & Generate</h2>
            <p className="text-sm text-muted-foreground">
              Confirm the details and generate test cases with Claude.
            </p>
          </div>

          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-muted-foreground">Module Name</dt>
              <dd className="font-medium">{state.name}</dd>
            </div>

            {/* PRD documents summary */}
            <div className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Requirement Documents</dt>
                <dd className="font-medium">{prdSummary}</dd>
              </div>
              {prdFiles.filter((f) => f.text).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {prdFiles
                    .filter((f) => f.text)
                    .map((f) => (
                      <Badge key={f.name} variant="secondary" className="gap-1 text-xs">
                        <FileText className="h-3 w-3" />
                        {f.name}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Figma input summary */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <dt className="text-muted-foreground">Design Reference</dt>
              <dd className="flex items-center gap-1.5 font-medium">
                {figmaResult?.type === 'url' && (
                  <>
                    Figma URL connected
                    <Lock className="h-3.5 w-3.5 text-primary" />
                  </>
                )}
                {figmaResult?.type === 'pdf' && figmaSummary}
                {figmaResult?.type === 'screenshot' && figmaSummary}
                {!figmaResult?.type && (
                  <span className="text-muted-foreground">None (optional)</span>
                )}
              </dd>
            </div>

            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-muted-foreground">Test Case Count</dt>
              <dd className="font-medium">{state.desired_count}</dd>
            </div>

            <div className="flex justify-between px-4 py-2.5">
              <dt className="text-muted-foreground">Coverage Areas</dt>
              <dd className="flex flex-wrap justify-end gap-1">
                {state.coverage_areas.length > 0 ? (
                  state.coverage_areas.map((a) => (
                    <Badge key={a} variant="secondary" className="text-xs">
                      {a}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">None selected</span>
                )}
              </dd>
            </div>
          </dl>

          {globalError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {globalError}
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={isGenerating}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2 font-semibold"
              style={{ background: '#00D4B4', color: '#0A0F1E' }}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating…' : 'Generate Test Cases'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
