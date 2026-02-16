import { Project } from '@/lib/types';
import { Layout, Plus, Settings } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
}

export default function Sidebar({ projects, selectedProject, onSelectProject }: SidebarProps) {
  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full">
      <div className="p-6 border-bottom flex items-center gap-2 font-bold text-xl">
        <Layout className="h-6 w-6 text-primary" />
        <span>Kanban MVP</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Projects
          </h3>
          <nav className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2",
                  selectedProject?.id === project.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-muted-foreground"
                )}
              >
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  selectedProject?.id === project.id ? "bg-white" : "bg-primary"
                )} />
                {project.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t space-y-2">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors">
          <Plus className="h-4 w-4" />
          Add Project
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
