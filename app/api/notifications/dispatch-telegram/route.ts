import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const DEFAULT_BATCH_SIZE = 25;
const ALLOWED_TYPES = ['assignment', 'status_change', 'new_comment'];

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Backward compatible: allow manual calls when secret is not configured.
  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

function formatTelegramMessage(notification: any) {
  const title = notification?.title ? `🔔 ${notification.title}` : '🔔 Task update';
  const message = notification?.message ?? 'Nuovo aggiornamento task';
  const taskPart = notification?.task_id ? `\nTask ID: ${notification.task_id}` : '';
  return `${title}\n${message}${taskPart}`;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API ${response.status}: ${body}`);
  }
}

async function runDispatch(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const walterChatId = process.env.TELEGRAM_WALTER_CHAT_ID;

  if (!botToken || !walterChatId) {
    return NextResponse.json(
      {
        error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WALTER_CHAT_ID',
      },
      { status: 500 }
    );
  }

  const batchParam = Number(req.nextUrl.searchParams.get('limit') || DEFAULT_BATCH_SIZE);
  const limit = Number.isFinite(batchParam) ? Math.max(1, Math.min(batchParam, 100)) : DEFAULT_BATCH_SIZE;

  const { data: notifications, error: fetchError } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, title, message, task_id, read, created_at')
    .eq('user_id', 'walter')
    .eq('read', false)
    .in('type', ALLOWED_TYPES)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const items = notifications ?? [];

  let sent = 0;
  let failed = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const notification of items) {
    try {
      await sendTelegramMessage(botToken, walterChatId, formatTelegramMessage(notification));

      const { error: markError } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
        .eq('read', false);

      if (markError) {
        failed += 1;
        failures.push({ id: notification.id, error: markError.message });
        continue;
      }

      sent += 1;
    } catch (error: any) {
      failed += 1;
      failures.push({
        id: notification.id,
        error: error?.message || 'Unknown send error',
      });
    }
  }

  return NextResponse.json({
    scanned: items.length,
    sent,
    failed,
    failures,
  });
}

export async function GET(req: NextRequest) {
  return runDispatch(req);
}

export async function POST(req: NextRequest) {
  return runDispatch(req);
}
