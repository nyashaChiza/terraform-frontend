import api, { BASE_URL } from './api';

export type Credentials = { email: string; password: string };

export async function login(credentials: Credentials) {
  // FastAPI OAuth2PasswordRequestForm expects form-encoded fields:
  // username and password (plus optional grant_type, scope)
  const params = new URLSearchParams();
  params.append('username', credentials.email);
  params.append('password', credentials.password);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown;
  }
}

export async function register(payload: { name?: string; email: string; password: string }) {
  return api.post('/auth/register', payload);
}
