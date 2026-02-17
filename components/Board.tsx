'use client';

import { Project, Task, TaskStatus } from '@/lib/types';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import Column from './Column';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import TaskModal from './TaskModal';

interface BoardProps {
  project: Project;
  tasks: Task[];
  onTasksChange: () => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export default function Board({ project, tasks, onTasksChange }: BoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistic update
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    // Calculate new position logic (simplified for brevity, same as before)
    const columnTasks = tasks.filter(t => t.status === newStatus).sort((a, b) => a.position - b.position);
    let newPosition = 0;

    if (columnTasks.length === 0) {
      newPosition = 1000;
    } else {
      if (destination.index === 0) {
        newPosition = columnTasks[0].position / 2;
      } else if (destination.index >= columnTasks.length) {
        newPosition = columnTasks[columnTasks.length - 1].position + 1000;
      } else {
        newPosition = (columnTasks[destination.index - 1].position + columnTasks[destination.index].position) / 2;
      }
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', draggableId);

    if (error) {
      console.error('Failed to move task:', error);
    }
    
    onTasksChange();
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-zinc-950 w-full relative">
      {/* Board Header - Responsive */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-sm md:shadow-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 bg-primary/10 rounded-lg hidden md:flex items-center justify-center text-primary shrink-0">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            {/* Show title on desktop, hide on mobile if redundant (or keep small) */}
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate hidden md:block">
              {project.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium hidden md:block">Kanban Board</p>
            
            {/* Mobile Title Alternative (if needed, currently handled by Page header) */}
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:hidden truncate">
              {project.name}
            </h2>
          </div>
        </div>
        
        <button 
          onClick={handleAddTask}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow-md active:scale-95 text-sm whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Board Content - Horizontal Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6 w-full overscroll-x-contain">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-4 md:gap-6 min-w-max pb-2 snap-x snap-mandatory px-0.5">
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-[85vw] md:w-[320px] h-full flex-shrink-0 flex flex-col snap-center first:pl-0 last:pr-4 md:snap-align-none">
                <Column
                  id={col.id}
                  title={col.title}
                  tasks={tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position)}
                  onEditTask={handleEditTask}
                />
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={project}
          task={editingTask}
          onSuccess={onTasksChange}
        />
      )}
    </div>
  );
}
