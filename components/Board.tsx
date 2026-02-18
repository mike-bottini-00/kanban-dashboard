import { Project, Task, TaskStatus } from '@/lib/types';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import Column from './Column';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, LayoutGrid, List, Search, Filter, X } from 'lucide-react';
import TaskModal from './TaskModal';

interface BoardProps {
  project: Project;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTasksChange: () => void;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

export default function Board({ project, tasks, setTasks, onTasksChange }: BoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Memoize column data with filtering and stable sort
  const columnsData = useMemo(() => {
    // 1. Apply Search and Filters
    const filteredTasks = tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.labels?.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesAssignee = assigneeFilter === 'all' || task.assignee === assigneeFilter;

      return matchesSearch && matchesAssignee;
    });

    // 2. Map to columns
    return COLUMNS.map(col => {
      const columnTasks = filteredTasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => {
          if (a.position !== b.position) return a.position - b.position;
          return a.id.localeCompare(b.id);
        })
        .map((task, index) => ({
          ...task,
          position: (index + 1) * 1000,
        }));

      return {
        ...col,
        tasks: columnTasks
      };
    });
  }, [tasks, searchQuery, assigneeFilter]);

  // Listen for mobile header events
  useEffect(() => {
    const handleOpenModal = () => handleAddTask();
    const handleSearch = (e: any) => setSearchQuery(e.detail || '');

    window.addEventListener('open-new-task-modal', handleOpenModal);
    window.addEventListener('board-search', handleSearch);

    return () => {
      window.removeEventListener('open-new-task-modal', handleOpenModal);
      window.removeEventListener('board-search', handleSearch);
    };
  }, []);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    // Use the memoized, correctly sorted column tasks for destination
    const destCol = columnsData.find(c => c.id === newStatus);
    if (!destCol) return;

    // Filter out the dragged item if it's a same-column move
    const destTasks = destCol.tasks.filter(t => t.id !== draggableId);

    // Calculate position based on destination index
    let newPosition: number;
    if (destTasks.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = destTasks[0].position / 2;
    } else if (destination.index >= destTasks.length) {
      newPosition = destTasks[destTasks.length - 1].position + 1000;
    } else {
      newPosition = (destTasks[destination.index - 1].position + destTasks[destination.index].position) / 2;
    }

    // Optimistic update — using current array to update state immediately
    setTasks(prev => {
      const all = prev.map(t =>
        t.id === draggableId
          ? { ...t, status: newStatus, position: newPosition }
          : t
      );
      return all;
    });

    // Sync with server in background
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draggableId, status: newStatus, position: newPosition }),
      });
      if (!res.ok) {
        console.error('Failed to move task');
        onTasksChange();
      }
    } catch (err) {
      console.error('Failed to move task:', err);
      onTasksChange();
    }
  }, [tasks, columnsData, setTasks, onTasksChange]);

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
      {/* Board Header - Responsive (Hidden on mobile as page.tsx header takes over) */}
      <div className="hidden md:flex flex-col bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-20 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {project.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Kanban Board</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, labels..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-slate-50 dark:bg-zinc-800 rounded-lg p-1">
              <select 
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer pr-8 py-1"
              >
                <option value="all">All Assignees</option>
                <option value="walter">Walter</option>
                <option value="mike">Mike</option>
                <option value="gilfoyle">Gilfoyle</option>
                <option value="dinesh">Dinesh</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <button 
              onClick={handleAddTask}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow-md active:scale-95 text-sm whitespace-nowrap ml-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Board Content - Horizontal Scroll Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-6 w-full overscroll-x-contain scrollbar-hide">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full flex gap-3 md:gap-6 min-w-max pb-4 snap-x snap-mandatory px-1 md:px-0">
            {columnsData.map((col) => (
              <div key={col.id} className="w-[calc(100vw-2.5rem)] md:w-[320px] h-full flex-shrink-0 flex flex-col snap-center md:snap-align-none">
                <Column
                  id={col.id}
                  title={col.title}
                  tasks={col.tasks}
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
