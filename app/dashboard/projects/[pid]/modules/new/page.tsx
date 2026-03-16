'use client';

import { useCallback } from 'react';
import { DashboardHeader } from '@/components/theme/DashboardHeader';
import { CreateModuleWizard } from '@/components/modules/CreateModuleWizard';

interface Props {
  params: { pid: string };
}

export default function NewModulePage({ params }: Props) {
  const handleGenerated = useCallback(() => {
    // Navigation handled inside the wizard after generation
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader backHref={`/dashboard/projects/${params.pid}`} backLabel="Back to Project">
        <span className="font-semibold text-sm" style={{ fontFamily: 'var(--font-sora)' }}>
          New Module
        </span>
      </DashboardHeader>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create Module</h1>
          <p className="text-sm text-muted-foreground">
            Follow the steps to configure your module and generate AI-powered test cases.
          </p>
        </div>
        <CreateModuleWizard projectId={params.pid} onGenerated={handleGenerated} />
      </main>
    </div>
  );
}
