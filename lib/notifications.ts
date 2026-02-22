import { supabaseAdmin } from './supabase';
import { TaskAssignee } from './types';

export type NotificationType = 'assignment' | 'status_change' | 'new_comment';

type NotificationRow = {
  id: string;
  user_id: TaskAssignee;
  type: NotificationType;
  title: string;
  message: string;
  task_id: string | null;
  read: boolean;
  created_at: string;
};

const TELEGRAM_ALLOWED_TYPES: NotificationType[] = ['assignment', 'status_change', 'new_comment'];

function formatTelegramMessage(notification: Pick<NotificationRow, 'title' | 'message' | 'task_id'>) {
  const title = notification.title ? `🔔 ${notification.title}` : '🔔 Task update';
  const taskPart = notification.task_id ? `\nTask ID: ${notification.task_id}` : '';
  return `${title}\n${notification.message}${taskPart}`;
}

async function sendTelegramMessage(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const walterChatId = process.env.TELEGRAM_WALTER_CHAT_ID;

  if (!botToken || !walterChatId) {
    return { ok: false as const, reason: 'missing_config' as const };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: walterChatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false as const, reason: `telegram_${response.status}: ${body}` };
  }

  return { ok: true as const };
}

export const notificationService = {
  async createNotification(params: {
    userId: TaskAssignee;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string;
  }) {
    if (params.userId === 'unassigned') return;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        task_id: params.taskId,
      })
      .select('id, user_id, type, title, message, task_id, read, created_at')
      .single<NotificationRow>();

    if (error) {
      console.error('Failed to create notification:', error);
      return;
    }

    // Best-effort immediate delivery for Walter.
    // If delivery fails, row stays unread and can be retried by dispatcher endpoint/cron.
    if (data.user_id === 'walter' && TELEGRAM_ALLOWED_TYPES.includes(data.type)) {
      const delivery = await sendTelegramMessage(formatTelegramMessage(data));
      if (delivery.ok) {
        const { error: markError } = await supabaseAdmin
          .from('notifications')
          .update({ read: true })
          .eq('id', data.id)
          .eq('read', false);

        if (markError) {
          console.error('Failed to mark notification as delivered:', markError);
        }
      } else if (delivery.reason !== 'missing_config') {
        console.error('Failed to deliver Telegram notification:', delivery.reason);
      }
    }
  },

  async dispatchPendingWalterTelegram(limit = 25) {
    const batchSize = Math.max(1, Math.min(limit, 100));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, type, title, message, task_id, read, created_at')
      .eq('user_id', 'walter')
      .eq('read', false)
      .in('type', TELEGRAM_ALLOWED_TYPES)
      .order('created_at', { ascending: true })
      .limit(batchSize)
      .returns<NotificationRow[]>();

    if (error) {
      throw new Error(error.message);
    }

    const items = data ?? [];
    const failures: Array<{ id: string; error: string }> = [];
    let sent = 0;

    for (const item of items) {
      const delivery = await sendTelegramMessage(formatTelegramMessage(item));

      if (!delivery.ok) {
        if (delivery.reason === 'missing_config') {
          break;
        }
        failures.push({ id: item.id, error: delivery.reason });
        continue;
      }

      const { error: markError } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', item.id)
        .eq('read', false);

      if (markError) {
        failures.push({ id: item.id, error: markError.message });
        continue;
      }

      sent += 1;
    }

    return {
      scanned: items.length,
      sent,
      failed: failures.length,
      failures,
      missingConfig: !process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WALTER_CHAT_ID,
    };
  },

  async markAsRead(id: string) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  async getUserNotifications(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }

    return data;
  },
};
