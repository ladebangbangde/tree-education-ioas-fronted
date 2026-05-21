import client, { unwrapResponse } from './client';

export interface NotificationSummary {
  unreadCount: number;
  activeTaskCount: number;
}

export const notificationsApi = {
  async summary(options?: { quiet?: boolean }) {
    const res = await client.get('/notifications/summary', { silent: options?.quiet });
    return unwrapResponse<NotificationSummary>(res.data);
  }
};
