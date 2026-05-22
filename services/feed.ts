import { apiFetch } from './api';
import { PublicUser } from './friends';

export interface Reaction {
  id: number;
  reactor: PublicUser;
  emoji: string;
  created_at: string;
}

export interface FeedSession {
  session_id: number;
  user: PublicUser;
  title: string;
  summary: string | null;
  intensity: string | null;
  estimated_duration_minutes: number | null;
  completed_at: string;
  reactions: Reaction[];
  my_reaction: string | null;
}

export async function getFeed(): Promise<FeedSession[]> {
  // After 3 attempts (apiFetch retries), give up gracefully and return [].
  // Showing an empty feed > throwing a toast every 30s on flaky networks.
  // The caller can show the empty state and the user can pull-to-refresh.
  const { ok, body, status } = await apiFetch<FeedSession[]>('/api/feed/');
  if (!ok) {
    console.warn(`Feed unavailable (status ${status}) — showing empty state`);
    return [];
  }
  return Array.isArray(body) ? body : [];
}

export async function reactToSession(sessionId: number, emoji: string = '💪'): Promise<void> {
  const { ok, body } = await apiFetch(`/api/feed/${sessionId}/react`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
  if (!ok) throw new Error((body as any)?.detail ?? 'Failed to react');
}

export async function removeReaction(sessionId: number): Promise<void> {
  const { ok } = await apiFetch(`/api/feed/${sessionId}/react`, { method: 'DELETE' });
  if (!ok) throw new Error('Failed to remove reaction');
}
