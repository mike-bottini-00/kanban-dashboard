import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';
import { TaskComment } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  // Fallback to storing comments in metadata JSONB since task_comments table might not exist
  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .select('metadata')
    .eq('id', taskId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments: TaskComment[] = task.metadata?.comments || [];
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id, author, content } = body;

    if (!task_id || !author || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1. Fetch current comments
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('title, assignee, metadata')
      .eq('id', task_id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const currentComments: TaskComment[] = task.metadata?.comments || [];

    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      task_id,
      author,
      content,
      created_at: new Date().toISOString(),
    };

    const updatedComments = [...currentComments, newComment];

    // 2. Update task metadata
    const { error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({
        metadata: {
          ...task.metadata,
          comments: updatedComments,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 3. Notify task assignee
    if (task.assignee && task.assignee !== 'unassigned' && task.assignee !== author) {
      await notificationService.createNotification({
        userId: task.assignee,
        type: 'new_comment',
        title: 'New Comment',
        message: `${author} commented on "${task.title}"`,
        taskId: task_id,
      });
    }

    return NextResponse.json(newComment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
