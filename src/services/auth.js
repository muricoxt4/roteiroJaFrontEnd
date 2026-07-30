import { api, session } from './api.js';

export async function login(credentials) {
  const data = await api.post('/auth/login', credentials);
  session.set(data.token, data.user);
  return data.user;
}

export async function register(payload) {
  const data = await api.post('/auth/register', payload);
  session.set(data.token, data.user);
  return data.user;
}

export function logout() {
  session.clear();
}

export async function me() {
  const data = await api.get('/auth/me');
  return data.user;
}
