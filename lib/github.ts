import { Octokit } from '@octokit/rest';

export const getOctokit = (token?: string) => {
  return new Octokit({
    auth: token || process.env.GITHUB_TOKEN,
  });
};

export const octokitAdmin = new Octokit({
  auth: process.env.GITHUB_ADMIN_TOKEN || process.env.GITHUB_TOKEN,
});

/**
 * Kanban Status Mapping
 * Mapping between internal Kanban columns and GitHub issue state/labels.
 */
export const STATUS_MAPPING = {
  'TODO': { state: 'open', label: 'status:todo' },
  'IN_PROGRESS': { state: 'open', label: 'status:in-progress' },
  'REVIEW': { state: 'open', label: 'status:review' },
  'DONE': { state: 'closed', label: 'status:done' },
} as const;

export type KanbanStatus = keyof typeof STATUS_MAPPING;

/**
 * Resolves Kanban Status from GitHub Issue data
 */
export function resolveStatusFromGitHub(state: string, labels: string[]): KanbanStatus {
  if (state === 'closed') return 'DONE';
  
  if (labels.includes('status:review')) return 'REVIEW';
  if (labels.includes('status:in-progress')) return 'IN_PROGRESS';
  
  return 'TODO';
}

/**
 * Gets GitHub labels to apply for a target status
 */
export function getLabelsForStatus(status: KanbanStatus): string[] {
  const allStatusLabels = Object.values(STATUS_MAPPING).map(m => m.label);
  const targetLabel = STATUS_MAPPING[status].label;
  return [targetLabel]; // We can add logic to preserve other labels if needed
}
