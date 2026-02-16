import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { octokitAdmin } from '@/lib/github';

/**
 * Comments Service Endpoint
 * GET /api/comments?itemId=... - List comments for a task
 * POST /api/comments - Add a comment to a task
 */

type GitHubTaskLink = {
  repository_name: string | null;
  github_issue_number: number | null;
};

async function resolveTaskGitHubLink(itemId: string): Promise<
  | { ok: true; owner: string; repo: string; issueNumber: number }
  | { ok: false; response: NextResponse }
> {
  const { data: task, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select('repository_name, github_issue_number')
    .eq('id', itemId)
    .single<GitHubTaskLink>();

  if (fetchError || !task) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Task not found', code: 'NOT_FOUND' }, { status: 404 }),
    };
  }

  if (!task.repository_name || !task.github_issue_number) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Task is not linked to a GitHub issue', code: 'TASK_NOT_LINKED' },
        { status: 400 }
      ),
    };
  }

  const [owner, repo] = task.repository_name.split('/');
  if (!owner || !repo) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid repository format on task', code: 'INVALID_REPOSITORY' },
        { status: 400 }
      ),
    };
  }

  return { ok: true, owner, repo, issueNumber: task.github_issue_number };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId', code: 'MISSING_PARAM' }, { status: 400 });
    }

    const taskLink = await resolveTaskGitHubLink(itemId);
    if (!taskLink.ok) {
      return taskLink.response;
    }

    try {
      const { data: comments } = await octokitAdmin.issues.listComments({
        owner: taskLink.owner,
        repo: taskLink.repo,
        issue_number: taskLink.issueNumber,
      });

      return NextResponse.json({
        success: true,
        comments: comments.map((c) => ({
          id: c.id,
          body: c.body,
          user: {
            login: c.user?.login,
            avatar_url: c.user?.avatar_url,
          },
          created_at: c.created_at,
        })),
      });
    } catch (ghError: any) {
      console.error('GitHub Fetch Comments Error:', ghError);
      return NextResponse.json(
        {
          error: ghError.message || 'GitHub communication failed',
          code: 'GITHUB_ERROR',
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Comments GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { itemId, body } = await req.json();

    if (!itemId || !body) {
      return NextResponse.json({ error: 'Missing itemId or body', code: 'MISSING_PARAM' }, { status: 400 });
    }

    const taskLink = await resolveTaskGitHubLink(itemId);
    if (!taskLink.ok) {
      return taskLink.response;
    }

    try {
      const { data: newComment } = await octokitAdmin.issues.createComment({
        owner: taskLink.owner,
        repo: taskLink.repo,
        issue_number: taskLink.issueNumber,
        body,
      });

      return NextResponse.json({
        success: true,
        comment: {
          id: newComment.id,
          body: newComment.body,
          user: {
            login: newComment.user?.login,
            avatar_url: newComment.user?.avatar_url,
          },
          created_at: newComment.created_at,
        },
      });
    } catch (ghError: any) {
      console.error('GitHub Create Comment Error:', ghError);
      return NextResponse.json(
        {
          error: ghError.message || 'GitHub communication failed',
          code: 'GITHUB_ERROR',
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Comments POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
