'use client';

import { Project, Task, TaskPriority, TaskAssignee, TaskStatus } from '@/lib/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Calendar, User, Flag, Trash2, Layout } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, ASSIGNEE_COLORS } from '@/lib/ui-config';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  task?: Task | null;
  onSuccess: () => void;
}

export default function TaskModal({ isOpen, onClose, project, task, onSuccess }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState<TaskAssignee>('unassigned');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setAssignee(task.assignee);
      setStatus(task.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignee('unassigned');
      setStatus('todo');
    }
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const taskData = {
      project_id: project.id,
      title,
      description,
      priority,
      assignee,
      status,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (task) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', task.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          position: 1000, 
        });
      error = insertError;
    }

    setLoading(false);
    if (!error) {
      onSuccess();
      onClose();
    } else {
      console.error(error);
      alert('Failed to save task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id);
    setLoading(false);

    if (!error) {
      onSuccess();
      onClose();
    } else {
      alert('Failed to delete task');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Layout className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">{task ? 'Edit Task' : 'New Task'}</h3>
              <p className="text-xs text-muted-foreground mt-1">in {project.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-foreground">
              Task Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Layout className="h-4 w-4" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" /> Assignee
            </label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value as TaskAssignee)}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
            >
              <option value="unassigned">Unassigned</option>
              <option value="walter">Walter</option>
              <option value="mike">Mike</option>
              <option value="gilfoyle">Gilfoyle</option>
              <option value="dinesh">Dinesh</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-y text-sm leading-relaxed"
              placeholder="Add details, checklists, or notes..."
            />
          </div>
        </form>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-4">
          {task ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div /> 
          )}
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (task ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
