'use client';

import { TaskPriority, TaskAssignee } from '@/lib/types';
import { Filter, X } from 'lucide-react';

interface BoardFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;

  assigneeFilter: 'all' | TaskAssignee;
  onAssigneeFilter: (value: 'all' | TaskAssignee) => void;

  priorityFilter: 'all' | TaskPriority;
  onPriorityFilter: (value: 'all' | TaskPriority) => void;

  labelFilter: 'all' | 'unlabeled' | string;
  onLabelFilter: (value: 'all' | 'unlabeled' | string) => void;

  availableLabels: string[];
  onClear: () => void;
}

export default function BoardFiltersModal({
  isOpen,
  onClose,
  assigneeFilter,
  onAssigneeFilter,
  priorityFilter,
  onPriorityFilter,
  labelFilter,
  onLabelFilter,
  availableLabels,
  onClear,
}: BoardFiltersModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div
        className="bg-card w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl border border-border overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none">Filters</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Refine what you see on the board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(e) => onAssigneeFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
              >
                <option value="all">All</option>
                <option value="walter">Walter</option>
                <option value="mike">Mike</option>
                <option value="gilfoyle">Gilfoyle</option>
                <option value="dinesh">Dinesh</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => onPriorityFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Label</label>
            <select
              value={labelFilter}
              onChange={(e) => onLabelFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
            >
              <option value="all">All labels</option>
              <option value="unlabeled">Unlabeled</option>
              {availableLabels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
