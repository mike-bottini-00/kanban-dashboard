import { supabaseAdmin } from './supabase';
import { TaskAssignee } from './types';

export type NotificationType = 'assignment' | 'status_change' | 'new_comment';

export const notificationService = {
  async createNotification(params: {
    userId: TaskAssignee;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string;
  }) {
    if (params.userId === 'unassigned') return;

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      task_id: params.taskId,
    });

    if (error) {
      console.error('Failed to create notification:', error);
    }
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
  }
};
