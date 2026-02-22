import { Project, Task, TaskStatus, TaskPriority, TaskAssignee } from '@/lib/types';
import { ASSIGNEE_CONFIG, ASSIGNEE_OPTIONS } from '@/lib/ui-config';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import Column from './Column';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, LayoutGrid, Search, X, Filter, User, ArrowDownWideNarrow } from 'lucide-react';
import TaskModal from './TaskModal';
import BoardFiltersModal from './BoardFiltersModal';
import MultiSelect, { MultiSelectOption } from './MultiSelect';

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilters, setAssigneeFilters] = useState<TaskAssignee[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [labelFilter, setLabelFilter] = useState<'all' | 'unlabeled' | string>('all');
  const [sortBy, setSortBy] = useState<'manual' | 'updated_desc' | 'updated_asc' | 'priority_desc'>('manual');
  const [currentUser, setCurrentUser] = useState<TaskAssignee>('walter'); // Default user for "Posting as"

  const availableLabels = useMemo(() => {
    const s = new Set<string>();
    for (const t of tasks) {
      for (const l of (t.labels || [])) {
        if (typeof l === 'string' && l.trim()) s.add(l.trim());
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  // Memoize column data with filtering and stable sort
  const columnsData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Apply Search and Filters
    const filteredTasks = tasks.filter((task) => {
      const matchesSearch =
        q.length === 0 ||
        task.title.toLowerCase().includes(q) ||
        (task.description?.toLowerCase().includes(q) ?? false) ||
        (task.labels?.some((l) => l.toLowerCase().includes(q)) ?? false);

      const matchesAssignee = assigneeFilters.length === 0 || assigneeFilters.includes(task.assignee);
      const matchesPriority = priorityFilters.length === 0 || priorityFilters.includes(task.priority);

      const hasLabels = (task.labels?.length ?? 0) > 0;
      const matchesLabel =
        labelFilter === 'all' ||
        (labelFilter === 'unlabeled' ? !hasLabels : (task.labels || []).includes(labelFilter));

      return matchesSearch && matchesAssignee && matchesPriority && matchesLabel;
    });

    // 2. Map to columns
    return COLUMNS.map((col) => {
      const columnTasks = filteredTasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => {
          if (sortBy === 'manual') {
            if (a.position !== b.position) return a.position - b.position;
            return a.id.localeCompare(b.id);
          }
          if (sortBy === 'updated_desc') {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          if (sortBy === 'updated_asc') {
            return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          }
          if (sortBy === 'priority_desc') {
            const weights = { high: 3, medium: 2, low: 1 };
            const pa = weights[a.priority] || 0;
            const pb = weights[b.priority] || 0;
            if (pa !== pb) return pb - pa;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          return 0;
        })
        .map((task, index) => ({
          ...task,
          position: (index + 1) * 1000,
        }));

      return {
        ...col,
        tasks: columnTasks,
      };
    });
  }, [tasks, searchQuery, assigneeFilters, priorityFilters, labelFilter, sortBy]);

  // Listen for mobile header events
  useEffect(() => {
    const handleOpenModal = () => handleAddTask();
    const handleSearch = (e: any) => setSearchQuery(e.detail || '');
    const handleOpenFilters = () => setIsFiltersOpen(true);

    window.addEventListener('open-new-task-modal', handleOpenModal);
    window.addEventListener('board-search', handleSearch);
    window.addEventListener('board-open-filters', handleOpenFilters);

    return () => {
      window.removeEventListener('open-new-task-modal', handleOpenModal);
      window.removeEventListener('board-search', handleSearch);
      window.removeEventListener('board-open-filters', handleOpenFilters);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const task = tasks.find((t) => t.id === draggableId);
      if (!task) return;

      const newStatus = destination.droppableId as TaskStatus;

      // Reset sort to manual on drag
      if (sortBy !== 'manual') {
        setSortBy('manual');
      }

      // Use the memoized, correctly sorted column tasks for destination
      const destCol = columnsData.find((c) => c.id === newStatus);
      if (!destCol) return;

      // Filter out the dragged item if it's a same-column move
      const destTasks = destCol.tasks.filter((t) => t.id !== draggableId);

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
      setTasks((prev) => {
        const all = prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus, position: newPosition } : t));
        return all;
      });

      // Sync with server in background
      try {
        const res = await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: draggableId, status: newStatus, position: newPosition, changed_by: currentUser }),
        });
        if (!res.ok) {
          console.error('Failed to move task');
          onTasksChange();
        }
      } catch (err) {
        console.error('Failed to move task:', err);
        onTasksChange();
      }
    },
    [tasks, columnsData, setTasks, onTasksChange]
  );

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setAssigneeFilters([]);
    setPriorityFilters([]);
    setLabelFilter('all');
  };

  const toggleAssigneeFilter = (assignee: TaskAssignee) => {
    setAssigneeFilters((prev) =>
      prev.includes(assignee) ? prev.filter((a) => a !== assignee) : [...prev, assignee]
    );
  };

  const togglePriorityFilter = (priority: TaskPriority) => {
    setPriorityFilters((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  const handleTaskModalSuccess = (updatedTask?: Task) => {
    if (updatedTask) {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === updatedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
        return [...prev, updatedTask];
      });
    }
    onTasksChange();
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{project.name}</h2>
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
                className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-zinc-800 border-none rounded-lg text-sm w-48 lg:w-64 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MultiSelect
                label="Assignee"
                selected={assigneeFilters}
                onChange={(vals) => setAssigneeFilters(vals as TaskAssignee[])}
                options={ASSIGNEE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  colorClass: ASSIGNEE_CONFIG[opt.value].color,
                  initial: ASSIGNEE_CONFIG[opt.value].initial,
                }))}
              />

              <MultiSelect
                label="Priority"
                selected={priorityFilters}
                onChange={(vals) => setPriorityFilters(vals as TaskPriority[])}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />

              <div className="flex items-center bg-slate-50 dark:bg-zinc-800 rounded-lg p-1.5 h-9 border border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
                <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground ml-1" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-8 py-0 max-w-[140px]"
                  aria-label="Sort tasks"
                >
                  <option value="manual">Manual</option>
                  <option value="updated_desc">Newest</option>
                  <option value="updated_asc">Oldest</option>
                  <option value="priority_desc">Priority</option>
                </select>
              </div>

              <div className="flex items-center bg-slate-50 dark:bg-zinc-800 rounded-lg p-1.5 h-9 border border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
                <Filter className="h-4 w-4 text-muted-foreground ml-1" />
                <select
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-8 py-0 max-w-[140px]"
                  aria-label="Filter by label"
                >
                  <option value="all">All Labels</option>
                  <option value="unlabeled">Unlabeled</option>
                  {availableLabels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(assigneeFilters.length > 0 || priorityFilters.length > 0 || labelFilter !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
              <span className="text-xs text-muted-foreground hidden lg:inline">Posting as:</span>
              <div className="flex items-center bg-slate-50 dark:bg-zinc-800 rounded-lg p-1.5 h-9 border border-transparent hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors">
                <User className="h-4 w-4 text-muted-foreground ml-1" />
                <select
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value as TaskAssignee)}
                  className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer pr-8 py-0 max-w-[140px]"
                  aria-label="Select current user"
                >
                  {(Object.keys(ASSIGNEE_CONFIG) as TaskAssignee[])
                    .filter((a) => a !== 'unassigned')
                    .map((a) => (
                      <option key={a} value={a}>
                        {ASSIGNEE_CONFIG[a].label}
                      </option>
                    ))}
                </select>
              </div>
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
              <div
                key={col.id}
                className="w-[calc(100vw-2.5rem)] md:w-[320px] h-full flex-shrink-0 flex flex-col snap-center md:snap-align-none"
              >
                <Column id={col.id} title={col.title} tasks={col.tasks} onEditTask={handleEditTask} />
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
          availableLabels={availableLabels}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          onSuccess={handleTaskModalSuccess}
        />
      )}

      <BoardFiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        assigneeFilters={assigneeFilters}
        onAssigneeFilters={setAssigneeFilters}
        priorityFilters={priorityFilters}
        onPriorityFilters={setPriorityFilters}
        labelFilter={labelFilter}
        onLabelFilter={setLabelFilter}
        availableLabels={availableLabels}
        onClear={handleClearFilters}
        sortBy={sortBy}
        onSortBy={setSortBy}
      />
    </div>
  );
}
