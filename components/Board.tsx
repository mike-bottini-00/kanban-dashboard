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

    // Optimistic UI update logic remains same
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    // Calculate new position
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
      // Ideally revert state here or show toast
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-zinc-950">
      {/* Board Header */}
      <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{project.name}</h2>
            <p className="text-xs text-slate-500 font-medium">Kanban Board</p>
          </div>
        </div>
        <button 
          onClick={handleAddTask}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Board Content - Horizontal Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-6 min-w-max pb-2">
            {COLUMNS.map((col) => (
              <div key={col.id} className="w-[320px] h-full flex-shrink-0 flex flex-col">
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
