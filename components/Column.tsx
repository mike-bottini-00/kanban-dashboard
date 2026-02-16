'use client';

import { Task, TaskStatus } from '@/lib/types';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { STATUS_CONFIG } from '@/lib/ui-config';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export default function Column({ id, title, tasks, onEditTask }: ColumnProps) {
  const config = STATUS_CONFIG[id] || STATUS_CONFIG.todo;

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 h-full min-h-0 overflow-hidden shadow-sm">
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10",
        config.borderColor
      )}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
          <h3 className="font-semibold text-sm tracking-tight text-slate-700 dark:text-slate-200">
            {title}
          </h3>
        </div>
        <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-slate-200 dark:ring-zinc-700">
          {tasks.length}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 overflow-y-auto p-3 space-y-3 transition-colors scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800",
              snapshot.isDraggingOver ? "bg-slate-100/50 dark:bg-zinc-800/20" : ""
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-600 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-lg mx-2 mt-4">
                <p className="text-xs font-medium">No tasks yet</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  onClick={() => onEditTask(task)}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
