import { Octokit } from '@octokit/rest';
import { KanbanCard, KanbanStatus, STATUS_CONFIG, STATUS_LABELS } from './types';

let octokit: Octokit | null = null;

export function initOctokit(token: string) {
  octokit = new Octokit({ auth: token });
}

export function getOctokit(): Octokit {
  if (!octokit) {
    throw new Error('Octokit not initialized. Please set your GitHub token.');
  }
  return octokit;
}

export function resolveStatusFromGitHub(state: string, labels: string[]): KanbanStatus {
  if (state === 'closed') return 'DONE';
  if (labels.includes('status:review')) return 'REVIEW';
  if (labels.includes('status:in-progress')) return 'IN_PROGRESS';
  return 'TODO';
}

export async function fetchIssues(owner: string, repo: string): Promise<KanbanCard[]> {
  const client = getOctokit();
  
  // Fetch both open and closed issues
  const [openIssues, closedIssues] = await Promise.all([
    client.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 100,
    }),
    client.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
      per_page: 50,
      sort: 'updated',
    }),
  ]);

  const allIssues = [...openIssues.data, ...closedIssues.data];
  
  // Filter out PRs (they have pull_request property)
  const issues = allIssues.filter(issue => !issue.pull_request);

  return issues.map(issue => {
    const labelNames = issue.labels
      .map(l => (typeof l === 'string' ? l : l.name || ''))
      .filter(Boolean);
    
    const status = resolveStatusFromGitHub(issue.state, labelNames);
    
    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      status,
      labels: issue.labels
        .filter(l => typeof l !== 'string')
        .map(l => ({
          name: (l as { name?: string }).name || '',
          color: (l as { color?: string }).color || 'gray',
        })),
      assignee: issue.assignee?.login,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
    };
  });
}

export async function updateIssueStatus(
  owner: string,
  repo: string,
  issueNumber: number,
  currentLabels: string[],
  newStatus: KanbanStatus
): Promise<void> {
  const client = getOctokit();
  const config = STATUS_CONFIG[newStatus];
  
  // Remove old status labels, add new one
  const statusLabelValues = Object.values(STATUS_LABELS);
  const filteredLabels = currentLabels.filter(l => !statusLabelValues.includes(l));
  const newLabels = [...filteredLabels, config.label];
  
  await client.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: config.state,
    labels: newLabels,
  });
}

export async function createStatusLabels(owner: string, repo: string): Promise<void> {
  const client = getOctokit();
  
  const labelConfigs = [
    { name: 'status:todo', color: 'ff6b6b', description: 'Task is in TODO' },
    { name: 'status:in-progress', color: 'ffd93d', description: 'Task is in progress' },
    { name: 'status:review', color: '6bcb77', description: 'Task is in review' },
    { name: 'status:done', color: '4d96ff', description: 'Task is done' },
  ];
  
  for (const label of labelConfigs) {
    try {
      await client.issues.createLabel({
        owner,
        repo,
        ...label,
      });
    } catch (error: unknown) {
      // Label might already exist, ignore
      const err = error as { status?: number };
      if (err.status !== 422) {
        console.warn(`Failed to create label ${label.name}:`, error);
      }
    }
  }
}
