import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAgentToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing token', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAgentToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { task_name, status, payload: logPayload, started_at, ended_at } = body;

    const { data, error } = await supabaseAdmin.from('agent_run_logs').insert({
      agent_id: payload.agentId,
      task_name,
      status,
      payload: logPayload || {},
      started_at: started_at || new Date().toISOString(),
      ended_at: ended_at
    }).select().single();

    if (error) {
      console.error('Log Insert Error:', error);
      return NextResponse.json({ error: 'Failed to save log', code: 'DB_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');

  let query = supabaseAdmin.from('agent_run_logs').select('*').order('started_at', { ascending: false }).limit(20);

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
