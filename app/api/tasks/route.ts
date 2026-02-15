import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { octokitAdmin, STATUS_MAPPING, KanbanStatus } from '@/lib/github';

/**
 * Atomic Task Update Endpoint
 * Supports moving task between columns and syncing with GitHub (labels/state).
 */
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, title, body, metadata } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    // 1. Fetch current item from DB to get GitHub info
    const { data: item, error: fetchError } = await supabaseAdmin
      .from('kanban_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const [owner, repo] = item.repository_name.split('/');
    const issueNumber = item.metadata.number;

    // Determine what to update
    const updatePayload: any = {};
    const dbUpdate: any = { updated_at: new Date().toISOString() };
    const dbMetadata = { ...item.metadata };

    // Handle Title/Body Update
    if (title !== undefined) {
      updatePayload.title = title;
      dbUpdate.title = title;
    }
    if (body !== undefined) {
      updatePayload.body = body;
      dbUpdate.description = body;
    }

    // Handle Status Update
    let targetStatus: KanbanStatus | undefined = undefined;
    if (status) {
      if (!STATUS_MAPPING[status as KanbanStatus]) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      targetStatus = status as KanbanStatus;
      const githubTarget = STATUS_MAPPING[targetStatus];
      const statusLabels = Object.values(STATUS_MAPPING).map(m => m.label as string);
      
      const currentLabels: string[] = item.metadata.labels || [];
      const filteredLabels = currentLabels.filter(l => !statusLabels.includes(l));
      const newLabels = [...filteredLabels, githubTarget.label];
      
      updatePayload.state = githubTarget.state;
      updatePayload.labels = newLabels;
      
      dbUpdate.status = targetStatus;
      dbMetadata.labels = newLabels;
      dbMetadata.github_state = githubTarget.state;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    // 2. Sync with GitHub
    try {
      await octokitAdmin.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        ...updatePayload
      });
    } catch (ghError: any) {
      console.error('GitHub Sync Error:', ghError);
      const ghStatus = ghError.status || 502;
      const ghMsg = ghError.message || 'GitHub Sync Failed';
      return NextResponse.json({ 
        error: ghMsg, 
        code: 'GITHUB_SYNC_ERROR',
        details: ghError.response?.data 
      }, { status: ghStatus });
    }

    // 3. Update Supabase
    const { error: updateError } = await supabaseAdmin
      .from('kanban_items')
      .update({
        ...dbUpdate,
        metadata: dbMetadata
      })
      .eq('id', id);

    if (updateError) {
      console.error('DB Update Error:', updateError);
      return NextResponse.json({ error: 'Failed to update local database', code: 'DB_UPDATE_ERROR' }, { status: 500 });
    }

    // 4. Track Metric (only if status changed)
    if (targetStatus) {
      await supabaseAdmin.from('move_metrics').insert({
          item_id: item.external_id,
          to_status: targetStatus,
          triggered_by: 'api_patch',
          repository: item.repository_name
      });
    }

    return NextResponse.json({ 
      success: true, 
      status: targetStatus || item.status,
      title: dbUpdate.title || item.title,
      description: dbUpdate.description || item.description
    });

  } catch (error: any) {
    console.error('Update Task Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
