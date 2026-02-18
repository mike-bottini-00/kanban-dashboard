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

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(body)
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

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    // Fetch old task to compare changes
    const { data: oldTask } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
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

      // 2. Status change to 'done'
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

    return NextResponse.json(data);
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
