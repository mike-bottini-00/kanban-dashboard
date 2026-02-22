import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications';

const DEFAULT_BATCH_SIZE = 25;

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Backward compatible: allow manual calls when secret is not configured.
  if (!cronSecret) return true;

  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

async function runDispatch(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const batchParam = Number(req.nextUrl.searchParams.get('limit') || DEFAULT_BATCH_SIZE);
  const limit = Number.isFinite(batchParam) ? Math.max(1, Math.min(batchParam, 100)) : DEFAULT_BATCH_SIZE;

  try {
    const result = await notificationService.dispatchPendingWalterTelegram(limit);

    if (result.missingConfig) {
      return NextResponse.json(
        {
          ...result,
          error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WALTER_CHAT_ID',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Dispatch failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return runDispatch(req);
}

export async function POST(req: NextRequest) {
  return runDispatch(req);
}
