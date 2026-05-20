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
  const { ok, body } = await apiFetch<FeedSession[]>('/api/feed/');
  if (!ok) throw new Error('Failed to load feed');
  return body;
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
