import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveStatusFromGitHub } from '@/lib/github';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifySignature(payload: string, signature: string) {
  if (!WEBHOOK_SECRET) return true; // Safety bypass if not configured, should be hardened in production
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function mapGitHubStatusToTaskStatus(status: ReturnType<typeof resolveStatusFromGitHub>) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'in_progress';
    case 'REVIEW':
      return 'review';
    case 'DONE':
      return 'done';
    case 'TODO':
    default:
      return 'todo';
  }
}

async function getDefaultProjectId() {
  const { data: bySlug } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('slug', 'kanban-dashboard')
    .maybeSingle();

  if (bySlug?.id) return bySlug.id as string;

  const { data: firstProject } = await supabaseAdmin
    .from('projects')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (firstProject?.id as string | undefined) || null;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-hub-signature-256') || '';
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature', code: 'UNAUTHORIZED_WEBHOOK' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = req.headers.get('x-github-event');

  if (event === 'issues') {
    const { action, issue, repository } = payload;

    const labels = issue.labels.map((l: any) => l.name);
    const kanbanStatus = resolveStatusFromGitHub(issue.state, labels);
    const taskStatus = mapGitHubStatusToTaskStatus(kanbanStatus);
    const defaultProjectId = await getDefaultProjectId();

    const { error } = await supabaseAdmin
      .from('tasks')
      .upsert(
        {
          project_id: defaultProjectId,
          github_external_id: issue.id,
          github_issue_number: issue.number,
          repository_name: repository.full_name,
          title: issue.title,
          description: issue.body,
          status: taskStatus,
          metadata: {
            number: issue.number,
            html_url: issue.html_url,
            user: issue.user?.login,
            labels,
            github_state: issue.state,
            updated_at: issue.updated_at,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'github_external_id' }
      );

    if (error) {
      console.error('Supabase error (issues):', error);
      return NextResponse.json({ error: 'Database sync failed', code: 'DB_SYNC_ERROR' }, { status: 500 });
    }

    if (action === 'labeled' || action === 'unlabeled' || action === 'closed' || action === 'reopened') {
      await supabaseAdmin.from('move_metrics').insert({
        item_id: issue.id,
        to_status: taskStatus,
        triggered_by: 'github_webhook',
        repository: repository.full_name,
      });
    }
  }

  if (event === 'pull_request') {
    const { action, pull_request, repository } = payload;
    if (action === 'closed' && pull_request.merged) {
      const { error } = await supabaseAdmin.from('pr_metrics').insert({
        pr_id: pull_request.id,
        merged_at: pull_request.merged_at,
        repository: repository.full_name,
        additions: pull_request.additions,
        deletions: pull_request.deletions,
      });

      if (error) {
        console.error('Supabase error (PR):', error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
