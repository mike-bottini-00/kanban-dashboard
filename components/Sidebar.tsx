'use client';

import { Project } from '@/lib/types';
import { Layout, Plus, Settings, ChevronRight } from 'lucide-react';
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
    <aside className="w-[280px] bg-card border-r border-border flex flex-col h-full flex-shrink-0 z-30 shadow-sm relative transition-all duration-300">
      {/* Sidebar Header */}
      <div className="h-16 px-6 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
          <Layout className="h-5 w-5" />
        </div>
        <span className="font-bold text-lg tracking-tight">Kanban</span>
      </div>
      
      {/* Projects List */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-muted">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3 flex items-center justify-between">
            <span>Projects</span>
            <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">{projects.length}</span>
          </h3>
          <nav className="space-y-1">
            {projects.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center bg-muted/30 rounded-lg border border-dashed border-border">
                No projects found
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between group",
                    selectedProject?.id === project.id
                      ? "bg-primary text-primary-foreground shadow-sm font-medium"
                      : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={cn(
                      "h-2 w-2 rounded-full ring-2 ring-current ring-opacity-30",
                      selectedProject?.id === project.id ? "bg-white" : "bg-primary"
                    )} />
                    <span className="truncate">{project.name}</span>
                  </div>
                  {selectedProject?.id === project.id && (
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  )}
                </button>
              ))
            )}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border space-y-2 bg-card">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          Create Project
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
