'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TestCase } from '@/lib/types';

interface TestCaseTableProps {
  testCases: TestCase[];
  onUpdate?: (updated: TestCase) => void;
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;
const TYPE_OPTIONS = [
  'Functional',
  'Edge Case',
  'Negative',
  'UI',
  'Integration',
  'Performance',
] as const;

function priorityVariant(p: string) {
  if (p === 'High') return 'high';
  if (p === 'Medium') return 'medium';
  return 'low';
}

function typeVariant(t: string) {
  const map: Record<string, string> = {
    Functional: 'functional',
    'Edge Case': 'edge',
    Negative: 'negative',
    UI: 'ui',
    Integration: 'integration',
    Performance: 'performance',
  };
  return (map[t] ?? 'default') as Parameters<typeof Badge>[0]['variant'];
}

interface EditState {
  title: string;
  expected_result: string;
  steps: string;
  priority: string;
  type: string;
}

export function TestCaseTable({ testCases, onUpdate }: TestCaseTableProps) {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  const filtered = useMemo(() => {
    return testCases.filter((tc) => {
      const matchSearch =
        !search ||
        tc.title.toLowerCase().includes(search.toLowerCase()) ||
        tc.id.toLowerCase().includes(search.toLowerCase()) ||
        tc.expected_result.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === 'all' || tc.priority === filterPriority;
      const matchType = filterType === 'all' || tc.type === filterType;
      return matchSearch && matchPriority && matchType;
    });
  }, [testCases, search, filterPriority, filterType]);

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function startEdit(tc: TestCase) {
    setEditingId(tc.id);
    setEditState({
      title: tc.title,
      expected_result: tc.expected_result,
      steps: tc.steps.join('\n'),
      priority: tc.priority,
      type: tc.type,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  function confirmEdit(tc: TestCase) {
    if (!editState || !onUpdate) return;
    onUpdate({
      ...tc,
      title: editState.title,
      expected_result: editState.expected_result,
      steps: editState.steps.split('\n').filter(Boolean),
      priority: editState.priority as TestCase['priority'],
      type: editState.type as TestCase['type'],
    });
    setEditingId(null);
    setEditState(null);
  }

  if (testCases.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No test cases yet. Use the wizard to generate them.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by keyword or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} / {testCases.length} test cases
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="w-8 px-3 py-2" />
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Expected Result</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tc) => {
              const isExpanded = expandedRows.has(tc.id);
              const isEditing = editingId === tc.id;

              return (
                <>
                  <tr
                    key={tc.id}
                    className="border-b transition-colors hover:bg-muted/20"
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleExpand(tc.id)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                      {tc.id}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Input
                          value={editState!.title}
                          onChange={(e) =>
                            setEditState((s) => s && { ...s, title: e.target.value })
                          }
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className="font-medium">{tc.title}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Select
                          value={editState!.priority}
                          onValueChange={(v) =>
                            setEditState((s) => s && { ...s, priority: v })
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={priorityVariant(tc.priority) as Parameters<typeof Badge>[0]['variant']}>
                          {tc.priority}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <Select
                          value={editState!.type}
                          onValueChange={(v) =>
                            setEditState((s) => s && { ...s, type: v })
                          }
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={typeVariant(tc.type)}>
                          {tc.type}
                        </Badge>
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      {isEditing ? (
                        <Textarea
                          value={editState!.expected_result}
                          onChange={(e) =>
                            setEditState((s) => s && { ...s, expected_result: e.target.value })
                          }
                          className="min-h-[60px] text-xs"
                        />
                      ) : (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {tc.expected_result}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-green-600 hover:text-green-700"
                            onClick={() => confirmEdit(tc)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEdit(tc)}
                          disabled={!onUpdate}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${tc.id}-expanded`} className="bg-muted/10">
                      <td colSpan={7} className="px-6 pb-4 pt-2">
                        <div className="grid gap-4 text-xs md:grid-cols-2">
                          <div>
                            <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                              Preconditions
                            </p>
                            {tc.preconditions.length > 0 ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {tc.preconditions.map((pre, i) => (
                                  <li key={i}>{pre}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">None</p>
                            )}
                          </div>
                          <div>
                            <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                              Steps
                            </p>
                            {isEditing ? (
                              <Textarea
                                value={editState!.steps}
                                onChange={(e) =>
                                  setEditState((s) => s && { ...s, steps: e.target.value })
                                }
                                placeholder="One step per line"
                                className="min-h-[80px] text-xs"
                              />
                            ) : (
                              <ol className="pl-4 space-y-1">
                                {tc.steps.map((step, i) => (
                                  <li key={i}>{step}</li>
                                ))}
                              </ol>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
