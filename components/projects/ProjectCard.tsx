import Link from 'next/link';
import { FolderOpen, ArrowRight, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  moduleCount?: number;
}

export function ProjectCard({ project, moduleCount = 0 }: ProjectCardProps) {
  const createdAt = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/dashboard/projects/${project.id}`} className="group block">
      <div className="h-full rounded-xl border bg-card p-5 shadow-sm transition-all duration-150 hover:border-primary/40 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight group-hover:text-primary">
                {project.name}
              </h3>
            </div>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {project.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {createdAt}
          </div>
          <Badge variant="secondary">{moduleCount} module{moduleCount !== 1 ? 's' : ''}</Badge>
        </div>
      </div>
    </Link>
  );
}
