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

  // Fallback: Check if we should use tasks.metadata.comments instead of task_comments table
  const { data: comments, error } = await supabaseAdmin
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.message.includes('task_comments') || error.code === 'PGRST116') {
      console.warn('Falling back to metadata comments for taskId:', taskId);
      const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('metadata')
        .eq('id', taskId)
        .single();
      return NextResponse.json(task?.metadata?.comments || []);
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

    // 1. Attempt to insert into task_comments table
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
      // Fallback: Store in tasks.metadata.comments
      if (insertError.message.includes('task_comments')) {
        console.warn('task_comments table missing, falling back to metadata for task:', task_id);
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('metadata, title, assignee')
          .eq('id', task_id)
          .single();
        
        if (!task) throw new Error('Task not found');

        const currentComments = task.metadata?.comments || [];
        const comment = {
          id: crypto.randomUUID(),
          task_id,
          author,
          content,
          created_at: new Date().toISOString()
        };

        const { error: updateError } = await supabaseAdmin
          .from('tasks')
          .update({
            metadata: {
              ...task.metadata,
              comments: [...currentComments, comment]
            }
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
