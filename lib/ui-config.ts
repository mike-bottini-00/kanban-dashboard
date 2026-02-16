import { TaskPriority, TaskStatus, TaskAssignee } from './types';

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10' },
  medium: { label: 'Medium', className: 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20' },
  high: { label: 'High', className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' },
};

export const STATUS_CONFIG: Record<TaskStatus, { title: string; borderColor: string; dotColor: string }> = {
  todo: { title: 'To Do', borderColor: 'border-slate-200', dotColor: 'bg-slate-400' },
  in_progress: { title: 'In Progress', borderColor: 'border-blue-200', dotColor: 'bg-blue-500' },
  review: { title: 'Review', borderColor: 'border-purple-200', dotColor: 'bg-purple-500' },
  done: { title: 'Done', borderColor: 'border-green-200', dotColor: 'bg-green-500' },
};

export const ASSIGNEE_COLORS: Record<TaskAssignee, string> = {
  walter: "bg-indigo-500",
  mike: "bg-blue-500",
  gilfoyle: "bg-emerald-500",
  dinesh: "bg-orange-500",
  unassigned: "bg-slate-400",
};
