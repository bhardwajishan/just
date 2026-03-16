import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Layers, TestTube2, CheckCircle2, Clock } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteModuleButton } from '@/components/modules/DeleteModuleButton';
import { DashboardHeader } from '@/components/theme/DashboardHeader';
import type { Project, Module } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: { pid: string };
}

function statusVariant(status: string) {
  if (status === 'confirmed') return 'low';
  if (status === 'generated') return 'medium';
  return 'outline';
}

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

function StatPill({ icon, label, value }: StatPillProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: Props) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: projectData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.pid)
    .eq('user_id', user.id)
    .single();

  if (!projectData) notFound();

  const project = projectData as unknown as Project;

  const { data: modulesData } = await supabase
    .from('modules')
    .select('*')
    .eq('project_id', params.pid)
    .order('created_at', { ascending: false });

  const modules = (modulesData as unknown as Module[]) ?? [];

  const { data: tcCountsData } = await supabase
    .from('test_cases')
    .select('module_id')
    .in('module_id', modules.map((m) => m.id));

  const tcCounts = (tcCountsData as unknown as { module_id: string }[]) ?? [];

  const tcCountMap: Record<string, number> = {};
  for (const tc of tcCounts) {
    tcCountMap[tc.module_id] = (tcCountMap[tc.module_id] ?? 0) + 1;
  }

  const totalTestCases = tcCounts.length;
  const confirmedCount = modules.filter((m) => m.status === 'confirmed').length;
  const generatedCount = modules.filter((m) => m.status === 'generated').length;
  const draftCount = modules.filter((m) => m.status === 'draft').length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader backHref="/dashboard/projects" backLabel="Dashboard">
        <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sora)' }}>
          {project.name}
        </span>
      </DashboardHeader>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Project header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Created {new Date(project.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <Link href={`/dashboard/projects/${params.pid}/modules/new`}>
            <Button
              className="gap-2 font-semibold"
              style={{ background: '#00D4B4', color: '#0A0F1E' }}
            >
              <Plus className="h-4 w-4" />
              New Module
            </Button>
          </Link>
        </div>

        {/* Analytics pills */}
        {modules.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill
              icon={<Layers className="h-4 w-4 text-primary" />}
              label="Total Modules"
              value={modules.length}
            />
            <StatPill
              icon={<TestTube2 className="h-4 w-4 text-primary" />}
              label="Test Cases"
              value={totalTestCases}
            />
            <StatPill
              icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
              label="Confirmed"
              value={confirmedCount}
            />
            <StatPill
              icon={<Clock className="h-4 w-4 text-primary" />}
              label="In Progress"
              value={generatedCount + draftCount}
            />
          </div>
        )}

        {/* Module list */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Modules</h2>
          {modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <Layers className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 text-lg font-semibold">No modules yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create a module to start generating test cases with AI.
              </p>
              <Link href={`/dashboard/projects/${params.pid}/modules/new`}>
                <Button style={{ background: '#00D4B4', color: '#0A0F1E' }}>
                  <Plus className="h-4 w-4" />
                  New Module
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => (
                <div key={mod.id} className="group relative">
                  <Link
                    href={`/dashboard/projects/${params.pid}/modules/${mod.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-primary/40 hover:bg-card/80">
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                          <Layers className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary">{mod.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(mod.created_at).toLocaleDateString()}
                            </span>
                            <span>
                              {tcCountMap[mod.id] ?? 0} test case{(tcCountMap[mod.id] ?? 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={statusVariant(mod.status) as Parameters<typeof Badge>[0]['variant']}
                        >
                          {mod.status}
                        </Badge>
                        <DeleteModuleButton
                          moduleId={mod.id}
                          moduleName={mod.name}
                          projectId={params.pid}
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
