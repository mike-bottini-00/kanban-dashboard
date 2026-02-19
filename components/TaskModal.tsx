'use client';

import { Project, Task, TaskPriority, TaskAssignee, TaskStatus, TaskComment } from '@/lib/types';
import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Flag, Trash2, Layout, Tag, MessageSquare, Send, User } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, ASSIGNEE_COLORS, getLabelColor } from '@/lib/ui-config';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  task?: Task | null;
  availableLabels?: string[];
  onSuccess: () => void;
}

const ASSIGNEE_OPTIONS: { value: TaskAssignee; label: string }[] = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'walter', label: 'Walter' },
  { value: 'mike', label: 'Mike' },
  { value: 'gilfoyle', label: 'Gilfoyle' },
  { value: 'dinesh', label: 'Dinesh' },
];

export default function TaskModal({
  isOpen,
  onClose,
  project,
  task,
  availableLabels = [],
  onSuccess,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState<TaskAssignee>('unassigned');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<TaskAssignee>('walter'); // Mock auth
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setAssignee(task.assignee);
      setStatus(task.status);
      setLabels(task.labels || []);
      setNewLabel('');
      setNewComment('');
      fetchComments(task.id);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignee('unassigned');
      setStatus('todo');
      setLabels([]);
      setNewLabel('');
      setComments([]);
      setNewComment('');
    }
  }, [task, isOpen]);

  const labelSuggestions = useMemo(() => {
    const existing = new Set(labels.map((l) => l.toLowerCase()));
    return availableLabels
      .filter((l) => !existing.has(l.toLowerCase()))
      .slice(0, 12);
  }, [availableLabels, labels]);

  const fetchComments = async (taskId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim() || addingComment) return;

    setAddingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          author: currentUser,
          content: newComment.trim(),
        }),
      });
      if (res.ok) {
        setNewComment('');
        await fetchComments(task.id);
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setAddingComment(false);
    }
  };

  const addLabel = (raw: string) => {
    const value = raw.trim();
    if (!value) return;

    setLabels((prev) => {
      const exists = prev.some((l) => l.toLowerCase() === value.toLowerCase());
      if (exists) return prev;
      return [...prev, value];
    });
  };

  const handleAddLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newLabel.trim()) {
      e.preventDefault();
      addLabel(newLabel);
      setNewLabel('');
    }
  };

  const removeLabel = (label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label));
  };

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
      labels,
      updated_at: new Date().toISOString(),
    };

    try {
      const res = task
        ? await fetch('/api/tasks', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: task.id, ...taskData }),
          })
        : await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...taskData, position: 1000 }),
          });

      setLoading(false);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        console.error(await res.text());
        alert('Failed to save task');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert('Failed to save task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?id=${task.id}`, { method: 'DELETE' });
      setLoading(false);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to delete task');
      }
    } catch (err) {
      setLoading(false);
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
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="task-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Task Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none cursor-pointer"
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
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" /> Assignee
            </label>

            <div className="grid grid-cols-2 gap-3">
              {ASSIGNEE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAssignee(opt.value)}
                  className={cn(
                    'px-3 py-2.5 rounded-lg text-sm font-semibold border transition-all flex items-center gap-3 shadow-sm',
                    assignee === opt.value
                      ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/20'
                      : 'bg-background hover:bg-muted border-input text-foreground hover:border-primary/50'
                  )}
                >
                  <span
                    className={cn(
                      'h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] text-white font-bold',
                      ASSIGNEE_COLORS[opt.value]
                    )}
                  >
                    {opt.value === 'unassigned' ? <User className="h-3.5 w-3.5" /> : opt.label.charAt(0)}
                  </span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="sr-only">
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as TaskAssignee)}
                className="w-full"
              >
                {ASSIGNEE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" /> Labels / Tags
            </label>

            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all animate-in zoom-in-50 duration-200",
                      getLabelColor(label)
                    )}
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="hover:text-destructive/80 hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove label ${label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleAddLabelKeyDown}
              placeholder="Press Enter to add label…"
              className="w-full px-4 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 text-sm"
            />

            {labelSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {labelSuggestions.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => addLabel(l)}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all hover:scale-105 active:scale-95 opacity-60 hover:opacity-100",
                      getLabelColor(l)
                    )}
                  >
                    + {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-y text-sm leading-relaxed"
              placeholder="Add details, checklists, or notes..."
            />
          </div>

          {task && (
            <div className="space-y-4 pt-4 border-t border-border mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" /> Comments
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Posting as:</span>
                  <select 
                    value={currentUser} 
                    onChange={(e) => setCurrentUser(e.target.value as TaskAssignee)}
                    className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer pr-4 py-0"
                  >
                    <option value="walter">Walter</option>
                    <option value="mike">Mike</option>
                    <option value="gilfoyle">Gilfoyle</option>
                    <option value="dinesh">Dinesh</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {loadingComments ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">Loading comments…</p>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border/50">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground italic">No comments yet. Start the discussion!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="group flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div 
                          className={cn(
                            "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold uppercase ring-2 ring-background shadow-sm",
                            ASSIGNEE_COLORS[c.author as TaskAssignee] || "bg-slate-400"
                          )}
                          title={c.author}
                        >
                          {c.author.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground capitalize">{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-border/40 hover:bg-muted/50 transition-colors">
                            <p className="whitespace-pre-wrap leading-relaxed">{c.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>

              <div className="flex gap-2 items-start bg-muted/20 p-2 rounded-xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  placeholder={`Comment as ${currentUser}...`}
                  className="flex-1 px-2 py-1.5 bg-transparent border-none text-sm focus:ring-0 min-h-[40px] max-h-[120px] resize-y placeholder:text-muted-foreground/70"
                  disabled={addingComment}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  className={cn(
                    "p-2 rounded-lg transition-all flex-shrink-0",
                    newComment.trim() 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                      : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                  )}
                  aria-label="Send comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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
              type="submit"
              form="task-form"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
