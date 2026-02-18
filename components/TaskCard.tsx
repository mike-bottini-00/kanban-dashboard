'use client';

import { Task } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PRIORITY_CONFIG, ASSIGNEE_COLORS } from '@/lib/ui-config';

const ASSIGNEE_LABELS: Record<Task['assignee'], string> = {
  walter: 'Walter',
  mike: 'Mike',
  gilfoyle: 'Gilfoyle',
  dinesh: 'Dinesh',
  unassigned: 'Unassigned',
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || ASSIGNEE_COLORS.unassigned;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-grab group",
            "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md",
            snapshot.isDragging ? "shadow-xl rotate-2 scale-[1.02] ring-2 ring-primary/20 z-50" : "transition-colors duration-150"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
              {task.title}
            </h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
              priorityConfig.className
            )}>
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                {ASSIGNEE_LABELS[task.assignee]}
              </span>
              <div 
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase ring-2 ring-white dark:ring-zinc-900 shadow-sm transition-transform group-hover:scale-110",
                  assigneeColor
                )}
                title={`Assigned to ${ASSIGNEE_LABELS[task.assignee]}`}
              >
                {task.assignee === 'unassigned' ? (
                  <User className="h-3 w-3" />
                ) : (
                  task.assignee.charAt(0)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
