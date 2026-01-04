import api from './api';

export type Credentials = { email: string; password: string };

export async function login(credentials: Credentials) {
  // Replace with real endpoint
  return api.post('/api/auth/login', credentials);
}

export async function register(payload: { name?: string; email: string; password: string }) {
  return api.post('/api/auth/register', payload);
}
