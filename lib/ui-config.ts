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

export const ASSIGNEE_CONFIG: Record<TaskAssignee, { label: string; initial: string; color: string; tint: string }> = {
  walter: {
    label: "Walter",
    initial: "W",
    color: "bg-indigo-600 dark:bg-indigo-500",
    tint: "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-900/10",
  },
  mike: {
    label: "Mike",
    initial: "M",
    color: "bg-blue-600 dark:bg-blue-500",
    tint: "border-blue-500/50 bg-blue-50/30 dark:bg-blue-900/10",
  },
  gilfoyle: {
    label: "Gilfoyle",
    initial: "G",
    color: "bg-emerald-600 dark:bg-emerald-500",
    tint: "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10",
  },
  dinesh: {
    label: "Dinesh",
    initial: "D",
    color: "bg-orange-600 dark:bg-orange-500",
    tint: "border-orange-500/50 bg-orange-50/30 dark:bg-orange-900/10",
  },
  unassigned: {
    label: "Unassigned",
    initial: "?",
    color: "bg-slate-400 dark:bg-slate-500",
    tint: "border-slate-300 dark:border-zinc-700",
  },
};

export const ASSIGNEE_OPTIONS = (Object.keys(ASSIGNEE_CONFIG) as TaskAssignee[]).map(key => ({
  value: key,
  label: ASSIGNEE_CONFIG[key].label,
}));

export const ASSIGNEE_COLORS: Record<TaskAssignee, string> = Object.entries(ASSIGNEE_CONFIG).reduce(
  (acc, [key, val]) => ({ ...acc, [key]: val.color }),
  {} as Record<TaskAssignee, string>
);

export const ASSIGNEE_INITIALS: Record<TaskAssignee, string> = Object.entries(ASSIGNEE_CONFIG).reduce(
  (acc, [key, val]) => ({ ...acc, [key]: val.initial }),
  {} as Record<TaskAssignee, string>
);

export const ASSIGNEE_TINTS: Record<TaskAssignee, string> = Object.entries(ASSIGNEE_CONFIG).reduce(
  (acc, [key, val]) => ({ ...acc, [key]: val.tint }),
  {} as Record<TaskAssignee, string>
);

const LABEL_PALETTE = [
  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800',
  'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
];

export function getLabelColor(label: string): string {
  if (!label) return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  
  // Specific overrides for common labels
  const lower = label.toLowerCase();
  if (lower === 'bug') return LABEL_PALETTE[0]; // Red
  if (lower === 'feature') return LABEL_PALETTE[8]; // Blue
  if (lower === 'enhancement') return LABEL_PALETTE[3]; // Green
  if (lower === 'design') return LABEL_PALETTE[11]; // Purple
  if (lower === 'urgent') return LABEL_PALETTE[14]; // Rose

  // Hash the string to pick a color
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % LABEL_PALETTE.length;
  return LABEL_PALETTE[index];
}
