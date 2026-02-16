'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Task } from '@/lib/types';
import Board from '@/components/Board';
import Sidebar from '@/components/Sidebar';
import { Loader2, Layout } from 'lucide-react';

export default function KanbanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject} 
        onSelectProject={setSelectedProject} 
      />
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {selectedProject ? (
          <Board 
            project={selectedProject} 
            tasks={tasks} 
            onTasksChange={() => fetchTasks(selectedProject.id)} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Layout className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Project Selected</h3>
            <p className="text-sm max-w-xs text-center mt-2">
              Select a project from the sidebar to view its Kanban board, or create a new one.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
