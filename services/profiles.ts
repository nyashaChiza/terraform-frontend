import { apiFetch } from './api';

export async function getProfile() {
  return apiFetch('/api/profiles/', { method: 'GET' });
}

export async function createProfile(payload: any) {
  return apiFetch('/api/profiles/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(payload: any) {
  return apiFetch('/api/profiles/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export default { getProfile, createProfile, updateProfile };
