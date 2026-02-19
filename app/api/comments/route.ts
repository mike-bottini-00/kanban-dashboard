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

  // Use real task_comments table
  const { data: comments, error } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    // If table doesn't exist yet or other error, return empty array instead of failing
    // so the UI doesn't break, but log it.
    console.error('Error fetching comments from task_comments table:', error);
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

    // 1. Insert the new comment into task_comments table
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
      throw new Error(insertError.message);
    }

    // 2. Fetch task info for notification
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('title, assignee')
      .eq('id', task_id)
      .single();

    if (!fetchError && task) {
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
    }

    return NextResponse.json(newComment);
  } catch (err: any) {
    console.error('API Error in POST /api/comments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
