import client, { normalizePage, unwrapResponse } from './client';
import type { PageResult } from '@/types/api';

export type NotificationReadStatus = 'UNREAD' | 'READ';

export interface NotificationItem {
  id: number;
  receiverUserId: number;
  receiverRole?: string;
  title: string;
  content?: string;
  bizType: string;
  bizId?: number;
  actionUrl?: string;
  notificationType: string;
  priority: number;
  readStatus: NotificationReadStatus;
  readAt?: string;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
}

export const notificationsApi = {
  async unreadCount(options?: { quiet?: boolean }) {
    const res = await client.get('/notifications/unread-count', { silent: options?.quiet });
    return unwrapResponse<NotificationSummary>(res.data);
  },

  async list(params?: { readStatus?: NotificationReadStatus; pageNum?: number; pageSize?: number }, options?: { quiet?: boolean }) {
    const res = await client.get('/notifications/mine', { params, silent: options?.quiet });
    return normalizePage<NotificationItem>(res.data) as PageResult<NotificationItem>;
  },

  async markRead(id: number, options?: { quiet?: boolean }) {
    const res = await client.post(`/notifications/${id}/read`, undefined, { silent: options?.quiet });
    return unwrapResponse<NotificationItem>(res.data);
  },

  async markAllRead(options?: { quiet?: boolean }) {
    const res = await client.post('/notifications/read-all', undefined, { silent: options?.quiet });
    return unwrapResponse<{ updated: number }>(res.data);
  },

  // Backward-compatible alias used by older header code.
  async summary(options?: { quiet?: boolean }) {
    return this.unreadCount(options);
  }
};