import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  let query = supabaseAdmin.from('tasks').select('*');
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (startDate) {
    query = query.gte('due_date', startDate);
  }
  if (endDate) {
    query = query.lte('due_date', endDate);
  }

  const { data, error } = await query.order('position');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalized = (data ?? []).map((t: any) => ({
    ...t,
    labels: Array.isArray(t?.metadata?.labels) ? t.metadata.labels : [],
  }));

  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { labels, ...rest } = body;
    const payload = {
      ...rest,
      metadata: {
        ...(rest.metadata ?? {}),
        ...(Array.isArray(labels) ? { labels } : {}),
      },
    };

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger notification if assigned upon creation
    if (data.assignee && data.assignee !== 'unassigned') {
      await notificationService.createNotification({
        userId: data.assignee,
        type: 'assignment',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${data.title}`,
        taskId: data.id,
      });
    }

    return NextResponse.json({
      ...data,
      labels: Array.isArray((data as any)?.metadata?.labels) ? (data as any).metadata.labels : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, labels, changed_by, ...updates } = await req.json();

    // Fetch old task to compare changes
    const { data: oldTask } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    const normalizedChangedBy = typeof changed_by === 'string' ? changed_by.trim().toLowerCase() : null;
    const allowedChangedBy = new Set(['walter', 'mike', 'gilfoyle', 'dinesh']);
    const statusChangeAuthor = normalizedChangedBy && allowedChangedBy.has(normalizedChangedBy)
      ? normalizedChangedBy
      : (oldTask?.assignee ?? 'unassigned');

    // Prepare comments/activity log
    const currentMetadata = oldTask?.metadata ?? {};
    const currentComments = currentMetadata.comments || [];
    const newComments = [...currentComments];
    const now = new Date().toISOString();

    if (oldTask) {
        if (updates.status && updates.status !== oldTask.status) {
            newComments.push({
                id: crypto.randomUUID(),
                task_id: id,
                author: statusChangeAuthor,
                content: `Changed status to ${updates.status}`,
                created_at: now
            });
        }
        if (updates.priority && updates.priority !== oldTask.priority) {
            newComments.push({
                id: crypto.randomUUID(),
                task_id: id,
                author: 'unassigned', 
                content: `Changed priority to ${updates.priority}`,
                created_at: now
            });
        }
        if (updates.assignee && updates.assignee !== oldTask.assignee) {
             newComments.push({
                id: crypto.randomUUID(),
                task_id: id,
                author: 'unassigned', 
                content: `Changed assignee to ${updates.assignee}`,
                created_at: now
            });
        }
    }

    const nextMetadata = {
      ...(oldTask?.metadata ?? {}),
      ...(Array.isArray(labels) ? { labels } : {}),
      comments: newComments
    };

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ ...updates, metadata: nextMetadata, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notifications logic
    if (oldTask) {
      // 1. Assignment change
      if (updates.assignee && updates.assignee !== oldTask.assignee && updates.assignee !== 'unassigned') {
        await notificationService.createNotification({
          userId: updates.assignee,
          type: 'assignment',
          title: 'Task Assigned',
          message: `You have been assigned to: ${data.title}`,
          taskId: data.id,
        });
      }

      // 2. Status change to 'review' => notify Walter when update is performed by someone else
      if (updates.status === 'review' && oldTask.status !== 'review' && statusChangeAuthor !== 'walter') {
        await notificationService.createNotification({
          userId: 'walter',
          type: 'status_change',
          title: 'Task moved to Review',
          message: `${statusChangeAuthor} moved "${data.title}" to Review`,
          taskId: data.id,
        });
      }

      // 3. Status change to 'done'
      if (updates.status === 'done' && oldTask.status !== 'done' && data.assignee !== 'unassigned') {
         // Notify the assignee (or maybe the reporter, but we don't have reporter field yet)
         // For now, let's just notify that it's done if it was assigned
         await notificationService.createNotification({
            userId: data.assignee,
            type: 'status_change',
            title: 'Task Completed',
            message: `Task "${data.title}" is now Done.`,
            taskId: data.id,
          });
      }
    }

    return NextResponse.json({
      ...data,
      labels: Array.isArray((data as any)?.metadata?.labels) ? (data as any).metadata.labels : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
