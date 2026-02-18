export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskAssignee = 'walter' | 'mike' | 'gilfoyle' | 'dinesh' | 'unassigned';

export interface Project {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TaskAssignee;
  position: number;
  created_at: string;
  updated_at: string;
  labels: string[];
  due_date: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author: TaskAssignee;
  content: string;
  created_at: string;
}
