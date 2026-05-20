import { apiFetch } from './api';

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export interface PublicUser {
  id: number;
  username: string;
  profile_picture_url: string | null;
}

export interface IncomingRequest {
  friendship_id: number;
  from: PublicUser;
  created_at: string;
}

export async function searchUsers(query: string): Promise<PublicUser[]> {
  const { ok, body } = await apiFetch<PublicUser[]>(`/api/users/search?q=${encodeURIComponent(query)}`);
  if (!ok) throw new Error('Search failed');
  return body;
}

export async function getFriends(): Promise<PublicUser[]> {
  const { ok, body } = await apiFetch<PublicUser[]>('/api/friends/');
  if (!ok) throw new Error('Failed to load friends');
  return body;
}

export async function getIncomingRequests(): Promise<IncomingRequest[]> {
  const { ok, body } = await apiFetch<IncomingRequest[]>('/api/friends/requests/incoming');
  if (!ok) throw new Error('Failed to load requests');
  return body;
}

export async function getFriendshipStatus(
  otherUserId: number,
): Promise<{ status: FriendshipStatus; friendship_id?: number }> {
  const { ok, body } = await apiFetch<{ status: FriendshipStatus; friendship_id?: number }>(
    `/api/friends/status/${otherUserId}`,
  );
  if (!ok) throw new Error('Failed to get status');
  return body;
}

export async function sendFriendRequest(addresseeId: number): Promise<void> {
  const { ok, body } = await apiFetch('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ addressee_id: addresseeId }),
  });
  if (!ok) throw new Error((body as any)?.detail ?? 'Failed to send request');
}

export async function acceptFriendRequest(friendshipId: number): Promise<void> {
  const { ok } = await apiFetch(`/api/friends/accept/${friendshipId}`, { method: 'POST' });
  if (!ok) throw new Error('Failed to accept request');
}

export async function declineFriendRequest(friendshipId: number): Promise<void> {
  const { ok } = await apiFetch(`/api/friends/decline/${friendshipId}`, { method: 'POST' });
  if (!ok) throw new Error('Failed to decline request');
}

export async function removeFriend(otherUserId: number): Promise<void> {
  const { ok } = await apiFetch(`/api/friends/remove/${otherUserId}`, { method: 'DELETE' });
  if (!ok) throw new Error('Failed to remove friend');
}
