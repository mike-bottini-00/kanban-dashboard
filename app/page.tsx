'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Task } from '@/lib/types';
import Board from '@/components/Board';
import Sidebar from '@/components/Sidebar';
import { Loader2, Layout, Menu, PanelLeft } from 'lucide-react';

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject.id);
    }
  }, [selectedProject]);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');
    
    if (data) {
      setProjects(data);
      if (data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      }
    }
    setLoading(false);
  }

  async function fetchTasks(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('position');
    
    if (data) {
      setTasks(data);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      {/* Sidebar - Desktop: static/sticky, Mobile: fixed/drawer */}
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject} 
        onSelectProject={(p) => {
          setSelectedProject(p);
          setIsSidebarOpen(false); // Close drawer on selection
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col w-full">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden h-14 border-b border-border bg-card flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-lg tracking-tight truncate max-w-[200px]">
              {selectedProject ? selectedProject.name : 'Kanban'}
            </h1>
          </div>
          {/* Optional: Add user avatar or settings here for mobile */}
        </div>

        {/* Board Content */}
        {selectedProject ? (
          <Board 
            project={selectedProject} 
            tasks={tasks} 
            onTasksChange={() => fetchTasks(selectedProject.id)} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/50 p-6 text-center">
            <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <PanelLeft className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Select a Project</h3>
            <p className="text-sm max-w-xs mt-2 text-muted-foreground">
              Open the menu to choose a project or create a new one.
            </p>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mt-6 md:hidden bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
            >
              Open Menu
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
