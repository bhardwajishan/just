import { redirect, notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { ModuleDetailClient } from './_components/ModuleDetailClient';
import { DashboardHeader } from '@/components/theme/DashboardHeader';
import type { Module, TestCase, ChatMessage } from '@/lib/types';
import { decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

interface Props {
  params: { pid: string; mid: string };
}

export default async function ModuleDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: moduleRaw } = await supabase
    .from('modules')
    .select('*, projects!inner(user_id, name)')
    .eq('id', params.mid)
    .single();

  if (!moduleRaw) notFound();

  const moduleWithProject = moduleRaw as unknown as Module & {
    projects: { user_id: string; name: string };
  };

  if (moduleWithProject.projects.user_id !== user.id) {
    redirect('/dashboard/projects');
  }

  const { data: testCasesRaw } = await supabase
    .from('test_cases')
    .select('*')
    .eq('module_id', params.mid)
    .order('id');

  const { data: chatHistoryRaw } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('module_id', params.mid)
    .order('created_at', { ascending: true });

  const projectName = moduleWithProject.projects.name;
  const moduleData = moduleWithProject as unknown as Module & {
    figma_access_token?: string | null;
  };
  const testCases = testCasesRaw as unknown as TestCase[];
  const chatHistory = chatHistoryRaw as unknown as ChatMessage[];

  // Resolve Figma token presence server-side (never forwarded to client)
  const hasFigmaToken = (() => {
    const raw = moduleData.figma_access_token;
    if (!raw) return false;
    const decrypted = decrypt(raw);
    return decrypted.length > 0;
  })();

  // PRD document count — prefer prd_texts array, fall back to legacy prd_text
  const prdCount =
    (moduleData.prd_texts?.length ?? 0) > 0
      ? moduleData.prd_texts!.length
      : moduleData.prd_text
      ? 1
      : 0;

  const figmaTypeBadgeLabel: Record<string, string> = {
    url: 'Figma URL',
    pdf: 'Figma PDF',
    screenshot: 'Screenshots',
  };

  // Strip encrypted token before passing module to client component
  const { figma_access_token: _stripped, ...safeModuleData } = moduleData;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader backHref={`/dashboard/projects/${params.pid}`} backLabel={projectName}>
        <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sora)' }}>
          {moduleData.name}
        </span>
        <Badge variant="secondary">{moduleData.status}</Badge>
      </DashboardHeader>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Module info strip */}
        {(prdCount > 0 || moduleData.figma_input_type || hasFigmaToken) && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            {prdCount > 0 && (
              <span className="text-muted-foreground">
                {prdCount} requirement doc{prdCount !== 1 ? 's' : ''}
              </span>
            )}
            {moduleData.figma_input_type &&
              figmaTypeBadgeLabel[moduleData.figma_input_type] && (
                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary"
                >
                  {figmaTypeBadgeLabel[moduleData.figma_input_type]}
                </Badge>
              )}
            {hasFigmaToken && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Design token saved
              </span>
            )}
          </div>
        )}

        <ModuleDetailClient
          module={safeModuleData as unknown as Module}
          initialTestCases={testCases ?? []}
          initialChatHistory={chatHistory ?? []}
        />
      </main>
    </div>
  );
}
