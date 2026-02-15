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

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-hub-signature-256') || '';
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature', code: 'UNAUTHORIZED_WEBHOOK' }, { status: 401 });
  }

  const payload = JSON.parse(body);
  const event = req.headers.get('x-github-event');

  // Handle events
  if (event === 'issues') {
    const { action, issue, repository } = payload;
    
    const labels = issue.labels.map((l: any) => l.name);
    const kanbanStatus = resolveStatusFromGitHub(issue.state, labels);

    const { error } = await supabaseAdmin.from('kanban_items').upsert({
      external_id: issue.id.toString(), // Ensure string if DB expects it
      title: issue.title,
      description: issue.body, // Sync body too
      status: kanbanStatus,
      repository_name: repository.full_name,
      metadata: {
        number: issue.number,
        html_url: issue.html_url,
        user: issue.user.login,
        labels: labels,
        github_state: issue.state,
        updated_at: issue.updated_at
      }
    }, { onConflict: 'external_id' });

    if (error) {
      console.error('Supabase error (issues):', error);
      return NextResponse.json({ error: 'Database sync failed', code: 'DB_SYNC_ERROR' }, { status: 500 });
    }

    // Metric tracking for "move"
    if (action === 'labeled' || action === 'unlabeled' || action === 'closed' || action === 'reopened') {
        await supabaseAdmin.from('move_metrics').insert({
            item_id: issue.id,
            to_status: kanbanStatus,
            triggered_by: 'github_webhook',
            repository: repository.full_name
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
        deletions: pull_request.deletions
      });

      if (error) {
        console.error('Supabase error (PR):', error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}