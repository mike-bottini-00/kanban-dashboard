'use client';

import { Task } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PRIORITY_CONFIG, ASSIGNEE_CONFIG, getLabelColor } from '@/lib/ui-config';

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
  const assigneeConfig = ASSIGNEE_CONFIG[task.assignee] || ASSIGNEE_CONFIG.unassigned;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-white dark:bg-zinc-900 p-4 rounded-xl border-l-4 shadow-sm cursor-grab group",
            assigneeConfig.tint,
            snapshot.isDragging ? "shadow-xl rotate-2 scale-[1.02] ring-2 ring-primary/20 z-50" : "transition-all duration-150"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {task.title}
            </h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm",
              priorityConfig.className
            )}>
              {task.priority}
            </span>
          </div>

          {(task.labels && task.labels.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.labels.map(label => (
                <span key={label} className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-bold border transition-colors shadow-sm uppercase tracking-tight",
                  getLabelColor(label)
                )}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {task.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed italic">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</span>
            </div>

            <div className="flex items-center gap-2">
              <div 
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase ring-2 ring-white dark:ring-zinc-900 shadow-sm transition-transform group-hover:scale-110",
                  assigneeConfig.color
                )}
                title={`Assigned to ${assigneeConfig.label}`}
              >
                {assigneeConfig.initial}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
