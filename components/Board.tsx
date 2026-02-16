'use client';

import { Project, Task, TaskStatus } from '@/lib/types';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import Column from './Column';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Plus } from 'lucide-react';
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

    // Optimistic update
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
    <div className="h-full flex flex-col p-6 space-y-6 min-w-[1000px]">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{project.name} Board</h2>
        <button 
          onClick={handleAddTask}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 grid grid-cols-4 gap-6 h-full min-h-0">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position)}
              onEditTask={handleEditTask}
            />
          ))}
        </div>
      </DragDropContext>

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
