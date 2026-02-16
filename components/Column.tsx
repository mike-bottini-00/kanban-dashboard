'use client';

import { Task } from '@/lib/types';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export default function Column({ id, title, tasks, onEditTask }: ColumnProps) {
  return (
    <div className="flex flex-col bg-muted/50 rounded-lg border h-full min-h-0">
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        id === 'todo' && "border-t-4 border-t-red-500",
        id === 'in_progress' && "border-t-4 border-t-yellow-500",
        id === 'review' && "border-t-4 border-t-blue-500",
        id === 'done' && "border-t-4 border-t-green-500",
      )}>
        <h3 className="font-semibold uppercase text-xs tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "flex-1 overflow-y-auto p-4 space-y-3 transition-colors",
              snapshot.isDraggingOver ? "bg-muted/80" : ""
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onClick={() => onEditTask(task)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
