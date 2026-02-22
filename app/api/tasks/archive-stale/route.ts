import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const ARCHIVE_AFTER_DAYS = 15;
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is not configured, keep endpoint callable (backward compatible).
  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

async function runArchive(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ARCHIVE_AFTER_MS).toISOString();

  const { data, error } = await supabaseAdmin
    .from('tasks')
    .update({ status: 'archived' })
    .eq('status', 'done')
    .lt('updated_at', cutoff)
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    archived_count: data?.length ?? 0,
    archived_task_ids: (data ?? []).map((t: any) => t.id),
    archived_before: cutoff,
  });
}

export async function GET(req: NextRequest) {
  return runArchive(req);
}

export async function POST(req: NextRequest) {
  return runArchive(req);
}
