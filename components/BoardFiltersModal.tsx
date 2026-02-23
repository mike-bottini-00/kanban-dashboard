'use client';

import { TaskPriority, TaskAssignee } from '@/lib/types';
import { Filter, X, Check, Clock } from 'lucide-react';
import { ASSIGNEE_CONFIG, ASSIGNEE_OPTIONS, PRIORITY_CONFIG } from '@/lib/ui-config';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SortOption = 'manual' | 'updated_desc' | 'updated_asc' | 'priority_desc';

interface BoardFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;

  assigneeFilters: TaskAssignee[];
  onAssigneeFilters: (value: TaskAssignee[]) => void;

  priorityFilters: TaskPriority[];
  onPriorityFilters: (value: TaskPriority[]) => void;

  labelFilter: 'all' | 'unlabeled' | string;
  onLabelFilter: (value: 'all' | 'unlabeled' | string) => void;

  availableLabels: string[];
  onClear: () => void;

  sortBy?: SortOption;
  onSortBy?: (value: SortOption) => void;

  showFutureTasks?: boolean;
  onShowFutureTasks?: (value: boolean) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'updated_desc', label: 'Newest first' },
  { value: 'updated_asc', label: 'Oldest first' },
  { value: 'priority_desc', label: 'Priority (High → Low)' },
];

export default function BoardFiltersModal({
  isOpen,
  onClose,
  assigneeFilters,
  onAssigneeFilters,
  priorityFilters,
  onPriorityFilters,
  labelFilter,
  onLabelFilter,
  availableLabels,
  onClear,
  sortBy = 'manual',
  onSortBy,
  showFutureTasks = false,
  onShowFutureTasks,
}: BoardFiltersModalProps) {
  if (!isOpen) return null;

  const toggleAssignee = (a: TaskAssignee) => {
    const next = assigneeFilters.includes(a)
      ? assigneeFilters.filter((item) => item !== a)
      : [...assigneeFilters, a];
    onAssigneeFilters(next);
  };

  const togglePriority = (p: TaskPriority) => {
    const next = priorityFilters.includes(p)
      ? priorityFilters.filter((item) => item !== p)
      : [...priorityFilters, p];
    onPriorityFilters(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div
        className="bg-card w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-none">Board Filters</h3>
              <p className="text-[11px] text-muted-foreground mt-1">Refine your view</p>
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

        <div className="p-5 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assignees</label>
              {assigneeFilters.length > 0 && (
                <button 
                  onClick={() => onAssigneeFilters([])}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ASSIGNEE_OPTIONS.map((opt) => {
                const a = opt.value;
                const config = ASSIGNEE_CONFIG[a];
                return (
                  <button
                    key={a}
                    onClick={() => toggleAssignee(a)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[56px]",
                      assigneeFilters.includes(a)
                        ? "bg-primary/5 border-primary text-primary ring-2 ring-primary/20 shadow-sm"
                        : "bg-background border-border text-foreground hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white uppercase shrink-0 shadow-sm",
                      config.color
                    )}>
                      {config.initial}
                    </div>
                    <span className="capitalize flex-1 text-left">{opt.label}</span>
                    {assigneeFilters.includes(a) && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
              {priorityFilters.length > 0 && (
                <button 
                  onClick={() => onPriorityFilters([])}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all min-w-[100px] justify-center",
                    priorityFilters.includes(p)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105 ring-2 ring-primary/20"
                      : "bg-background border-border text-foreground hover:border-primary/30"
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                  {priorityFilters.includes(p) && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Label</label>
            <div className="relative">
              <select
                value={labelFilter}
                onChange={(e) => onLabelFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="all">All labels</option>
                <option value="unlabeled">Unlabeled</option>
                {availableLabels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          </div>

          {onSortBy && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSortBy(opt.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all justify-center",
                      sortBy === opt.value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105 ring-2 ring-primary/20"
                        : "bg-background border-border text-foreground hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                    {sortBy === opt.value && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {onShowFutureTasks && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Upcoming</label>
              <button
                type="button"
                onClick={() => onShowFutureTasks(!showFutureTasks)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                  showFutureTasks
                    ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                    : "bg-background border-border text-foreground hover:border-primary/30"
                )}
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Show future tasks
                </span>
                {showFutureTasks && <Check className="h-4 w-4" />}
              </button>
              <p className="text-[11px] text-muted-foreground">
                When OFF, tasks with a future scheduled date are hidden from the board.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Reset All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-primary text-primary-foreground px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
