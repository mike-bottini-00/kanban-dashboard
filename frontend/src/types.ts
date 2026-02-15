export type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface KanbanCard {
  id: number;
  number: number;
  title: string;
  body: string;
  status: KanbanStatus;
  labels: Label[];
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface Label {
  name: string;
  color: string;
}

export interface Column {
  id: KanbanStatus;
  title: string;
  cards: KanbanCard[];
}

export const STATUS_LABELS: Record<KanbanStatus, string> = {
  'TODO': 'status:todo',
  'IN_PROGRESS': 'status:in-progress',
  'REVIEW': 'status:review',
  'DONE': 'status:done',
};

export const STATUS_CONFIG: Record<KanbanStatus, { state: 'open' | 'closed'; label: string }> = {
  'TODO': { state: 'open', label: 'status:todo' },
  'IN_PROGRESS': { state: 'open', label: 'status:in-progress' },
  'REVIEW': { state: 'open', label: 'status:review' },
  'DONE': { state: 'closed', label: 'status:done' },
};
