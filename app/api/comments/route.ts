import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { octokitAdmin } from '@/lib/github';

/**
 * Comments Service Endpoint
 * GET /api/comments?itemId=... - List comments for a task
 * POST /api/comments - Add a comment to a task
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Missing itemId', code: 'MISSING_PARAM' }, { status: 400 });
    }

    // 1. Get task from DB to find GitHub mapping
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('kanban_items')
      .select('repository_name, metadata')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Task not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const [owner, repo] = item.repository_name.split('/');
    const issueNumber = item.metadata.number;

    // 2. Fetch from GitHub
    try {
      const { data: comments } = await octokitAdmin.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return NextResponse.json({ 
        success: true, 
        comments: comments.map(c => ({
          id: c.id,
          body: c.body,
          user: {
            login: c.user?.login,
            avatar_url: c.user?.avatar_url
          },
          created_at: c.created_at
        }))
      });
    } catch (ghError: any) {
      console.error('GitHub Fetch Comments Error:', ghError);
      return NextResponse.json({ 
        error: ghError.message || 'GitHub communication failed', 
        code: 'GITHUB_ERROR' 
      }, { status: 502 });
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

    // 1. Get task from DB
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('kanban_items')
      .select('repository_name, metadata')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Task not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const [owner, repo] = item.repository_name.split('/');
    const issueNumber = item.metadata.number;

    // 2. Post to GitHub
    try {
      const { data: newComment } = await octokitAdmin.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body
      });

      return NextResponse.json({ 
        success: true, 
        comment: {
          id: newComment.id,
          body: newComment.body,
          user: {
            login: newComment.user?.login,
            avatar_url: newComment.user?.avatar_url
          },
          created_at: newComment.created_at
        }
      });
    } catch (ghError: any) {
      console.error('GitHub Create Comment Error:', ghError);
      return NextResponse.json({ 
        error: ghError.message || 'GitHub communication failed', 
        code: 'GITHUB_ERROR' 
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Comments POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
