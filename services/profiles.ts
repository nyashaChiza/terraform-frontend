import { BASE_URL } from './api';
import { authStore } from '../store/auth';

export async function getProfile() {
  const token = authStore.get().token;
  const token_type = authStore.get().token_type ?? 'Bearer';
  const authHeader = token
    ? token.toLowerCase().startsWith('bearer ') || token_type.toLowerCase() !== 'bearer'
      ? `${token_type} ${token}`.trim()
      : `Bearer ${token}`
    : undefined;

  const res = await fetch(`${BASE_URL}/api/profiles/`, {
    method: 'GET',
    headers: authHeader ? { Authorization: authHeader } : {},
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) return { ok: false, status: res.status, body: json };
    return { ok: true, status: res.status, body: json };
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
}

export async function createProfile(payload: any) {
  const token = authStore.get().token;
  const authHeader = token
    ? token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`
    : undefined;

  const res = await fetch(`${BASE_URL}/api/profiles/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) return { ok: false, status: res.status, body: json };
    return { ok: true, status: res.status, body: json };
  } catch {
    return { ok: res.ok, status: res.status, body: text };
  }
}

export default { getProfile, createProfile };
