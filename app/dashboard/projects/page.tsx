import { redirect } from 'next/navigation';
import { Layers, TestTube2, CheckCircle2, FolderOpen } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { DashboardHeader } from '@/components/theme/DashboardHeader';
import { UsageBanner } from '@/components/ui/UsageBanner';
import { ComingSoonBanner } from '@/components/ui/ComingSoonBanner';
import { NewProjectDialog } from './_components/NewProjectDialog';
import type { Project } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const projects = (projectsData as unknown as Project[]) ?? [];

  const { data: modulesData } = await supabase
    .from('modules')
    .select('id, project_id, status')
    .in(
      'project_id',
      projects.map((p) => p.id)
    );

  const modules = (modulesData as unknown as { id: string; project_id: string; status: string }[]) ?? [];

  const { data: tcData } = await supabase
    .from('test_cases')
    .select('module_id')
    .in(
      'module_id',
      modules.map((m) => m.id)
    );

  const totalTestCases = tcData?.length ?? 0;

  const moduleCountMap: Record<string, number> = {};
  for (const m of modules) {
    moduleCountMap[m.project_id] = (moduleCountMap[m.project_id] ?? 0) + 1;
  }

  const confirmedModules = modules.filter((m) => m.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={user.email ?? undefined} />

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Overview of all your QA projects
            </p>
          </div>
          <NewProjectDialog userId={user.id} />
        </div>

        {/* Coming Soon Banner */}
        <ComingSoonBanner />

        {/* Analytics bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FolderOpen className="h-5 w-5 text-primary" />}
            label="Total Projects"
            value={projects.length}
          />
          <StatCard
            icon={<Layers className="h-5 w-5 text-primary" />}
            label="Total Modules"
            value={modules.length}
            sub={`${confirmedModules} confirmed`}
          />
          <StatCard
            icon={<TestTube2 className="h-5 w-5 text-primary" />}
            label="Test Cases"
            value={totalTestCases}
            sub="across all modules"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
            label="Confirmed Modules"
            value={confirmedModules}
            sub={modules.length > 0 ? `${Math.round((confirmedModules / modules.length) * 100)}% complete` : '—'}
          />
        </div>

        {/* Usage banner */}
        <UsageBanner userId={user.id} />

        {/* Projects grid */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Projects</h2>
          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
              <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first project to start generating test cases.
              </p>
              <NewProjectDialog userId={user.id} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  moduleCount={moduleCountMap[project.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
