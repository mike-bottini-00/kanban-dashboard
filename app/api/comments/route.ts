import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';

function isMissingTableError(err: { message?: string; code?: string } | null | undefined, table: string) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return msg.includes(table.toLowerCase()) || err.code === 'PGRST205' || err.code === '42P01';
}

function safeUuid() {
  const g: any = globalThis as any;
  return g?.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getMetadataComments(meta: any) {
  const comments = meta?.comments;
  return Array.isArray(comments) ? comments : [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });
  }

  // Preferred: use task_comments table
  const { data: comments, error } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    // Fallback (prod safety): some envs were deployed without the migration.
    if (isMissingTableError(error, 'task_comments')) {
      console.warn('Falling back to metadata comments for taskId:', taskId);
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('metadata')
        .eq('id', taskId)
        .single();

      return NextResponse.json(getMetadataComments(task?.metadata));
    }

    console.error('Error fetching comments:', error);
    return NextResponse.json([]);
  }

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id, author, content } = body;

    if (!task_id || !author || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 1) Preferred: Insert into task_comments table
    const { data: newComment, error: insertError } = await supabaseAdmin
      .from('task_comments')
      .insert({
        task_id,
        author,
        content,
      })
      .select()
      .single();

    if (insertError) {
      // Fallback: Store in tasks.metadata.comments so the UI still works even if
      // the migration hasn't been applied in the target Supabase env.
      if (isMissingTableError(insertError, 'task_comments')) {
        console.warn('task_comments table missing, falling back to metadata for task:', task_id);

        const { data: task, error: fetchTaskError } = await supabaseAdmin
          .from('tasks')
          .select('metadata, title, assignee')
          .eq('id', task_id)
          .single();

        if (fetchTaskError) throw fetchTaskError;
        if (!task) throw new Error('Task not found');

        const meta = task.metadata ?? {};
        const currentComments = getMetadataComments(meta);
        const comment = {
          id: safeUuid(),
          task_id,
          author,
          content,
          created_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabaseAdmin
          .from('tasks')
          .update({
            metadata: {
              ...meta,
              comments: [...currentComments, comment],
            },
          })
          .eq('id', task_id);

        if (updateError) throw updateError;

        // Notify if needed
        if (task.assignee && task.assignee !== 'unassigned' && task.assignee !== author) {
          await notificationService.createNotification({
            userId: task.assignee,
            type: 'new_comment',
            title: 'New Comment',
            message: `${author} commented on "${task.title}"`,
            taskId: task_id,
          });
        }

        return NextResponse.json(comment);
      }

      throw new Error(insertError.message);
    }

    // 2) Notify assignee
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('title, assignee')
      .eq('id', task_id)
      .single();

    if (!fetchError && task) {
      if (task.assignee && task.assignee !== 'unassigned' && task.assignee !== author) {
        await notificationService.createNotification({
          userId: task.assignee,
          type: 'new_comment',
          title: 'New Comment',
          message: `${author} commented on "${task.title}"`,
          taskId: task_id,
        });
      }
    }

    return NextResponse.json(newComment);
  } catch (err: any) {
    console.error('API Error in POST /api/comments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
