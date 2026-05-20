import { apiFetch } from './api';
import { PublicUser } from './friends';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'reaction_received';

export interface AppNotification {
  id: number;
  type: NotificationType;
  actor: PublicUser | null;
  meta: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const { ok, body } = await apiFetch<AppNotification[]>('/api/notifications/');
  if (!ok) throw new Error('Failed to load notifications');
  return body;
}

export async function getUnreadCount(): Promise<number> {
  const { ok, body } = await apiFetch<{ unread_count: number }>('/api/notifications/unread-count');
  if (!ok) return 0;
  return body.unread_count;
}

export async function markAllRead(): Promise<void> {
  await apiFetch('/api/notifications/mark-read', { method: 'POST' });
}

export async function markOneRead(notificationId: number): Promise<void> {
  await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
}
