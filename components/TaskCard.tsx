'use client';

import { Task } from '@/lib/types';
import { Draggable } from '@hello-pangea/dnd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, AlertCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const PRIORITY_COLORS = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

const ASSIGNEE_COLORS = {
  walter: "bg-purple-500",
  mike: "bg-blue-500",
  gilfoyle: "bg-emerald-500",
  dinesh: "bg-orange-500",
  unassigned: "bg-gray-500",
};

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={cn(
            "bg-card p-4 rounded-lg border shadow-sm space-y-3 cursor-grab hover:border-primary/50 transition-colors",
            snapshot.isDragging ? "shadow-lg rotate-2" : ""
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <div className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              PRIORITY_COLORS[task.priority]
            )}>
              {task.priority}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(task.created_at))} ago</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold uppercase",
                ASSIGNEE_COLORS[task.assignee]
              )}>
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
