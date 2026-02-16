'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Task } from '@/lib/types';
import Board from '@/components/Board';
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        projects={projects} 
        selectedProject={selectedProject} 
        onSelectProject={setSelectedProject} 
      />
      <main className="flex-1 overflow-x-auto">
        {selectedProject ? (
          <Board 
            project={selectedProject} 
            tasks={tasks} 
            onTasksChange={() => fetchTasks(selectedProject.id)} 
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Select a project to start</p>
          </div>
        )}
      </main>
    </div>
  );
}
