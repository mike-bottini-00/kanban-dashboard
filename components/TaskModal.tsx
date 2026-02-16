'use client';

import { Project, Task, TaskPriority, TaskAssignee, TaskStatus } from '@/lib/types';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  task?: Task | null;
  onSuccess: () => void;
}

export default function TaskModal({ isOpen, onClose, project, task, onSuccess }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [assignee, setAssignee] = useState<TaskAssignee>(task?.assignee || 'unassigned');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [loading, setLoading] = useState(false);

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
          position: 1000, // Simple position for new tasks
        });
      error = insertError;
    }

    setLoading(false);
    if (!error) {
      onSuccess();
      onClose();
    } else {
      alert(error.message);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    setLoading(false);

    if (!error) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-lg shadow-xl border overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold">{task ? 'Edit Task' : 'Add New Task'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as TaskAssignee)}
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="unassigned">Unassigned</option>
                <option value="walter">Walter</option>
                <option value="mike">Mike</option>
                <option value="gilfoyle">Gilfoyle</option>
                <option value="dinesh">Dinesh</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-4">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 font-medium px-4 py-2 transition-colors"
              >
                Delete Task
              </button>
            )}
            <div className="flex-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
