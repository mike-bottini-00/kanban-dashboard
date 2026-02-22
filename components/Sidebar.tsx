'use client';

import { Project } from '@/lib/types';
import { Layout, Plus, Settings, ChevronRight, X, Moon, Sun, Trash2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  onRefreshProjects: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ projects, selectedProject, onSelectProject, onRefreshProjects, isOpen, onClose }: SidebarProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Generate a simple slug from the name
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, slug }),
      });
      if (res.ok) {
        setProjectName('');
        setIsCreateModalOpen(false);
        onRefreshProjects();
      } else {
        const error = await res.json();
        alert(`Failed to create project: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project and all its tasks?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefreshProjects();
        setIsSettingsOpen(false);
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      alert('Error deleting project');
    } finally {
      setLoading(false);
    }
  };

  // Shared content for both sidebars
  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="h-16 px-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Layout className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Kanban</span>
        </div>
        {isMobile && (
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
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
                  onClick={() => {
                    onSelectProject(project);
                    if (isMobile) onClose();
                  }}
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

      <div className="p-4 border-t border-border space-y-2 bg-card">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR: Hidden on mobile (md:flex), Static positioning */}
      <aside className="hidden md:flex flex-col w-[280px] border-r border-border bg-card h-full flex-shrink-0 z-30 shadow-sm relative">
        <SidebarContent />
      </aside>

      {/* MOBILE DRAWER: Visible only when open, Fixed overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />
          
          {/* Drawer Content */}
          <aside className="absolute inset-y-0 left-0 w-[85%] max-w-[300px] bg-card shadow-xl animate-in slide-in-from-left duration-300 flex flex-col h-full border-r border-border">
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold text-lg">New Project</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <input
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Marketing Campaign"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-semibold text-lg">Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Appearance</p>
                  <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notify Walter on Telegram</p>
                  <p className="text-sm text-muted-foreground">Always ON for now (toggle coming soon)</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={true}
                  disabled
                  className="relative inline-flex h-6 w-11 cursor-not-allowed rounded-full bg-primary/60 opacity-80"
                  title="Coming soon"
                >
                  <span className="inline-block h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform" />
                </button>
              </div>

              {selectedProject && (
                <div className="pt-6 border-t border-border">
                  <p className="font-medium text-destructive mb-2">Danger Zone</p>
                  <div className="flex items-center justify-between bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                    <div>
                      <p className="text-sm font-medium">Delete Project</p>
                      <p className="text-xs text-muted-foreground mt-1">This action cannot be undone.</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteProject(selectedProject.id)}
                      className="p-2 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
