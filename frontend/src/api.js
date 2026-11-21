/**
 * api.js - axios client for the Django backend.
 *  - adds the JWT access token to every request
 *  - on a 401, gets a new access token with the refresh token and retries once
 *  - if that fails, ends the session ("auth:expired" event, handled by SessionWatcher)
 */
import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null; // one refresh at a time, shared by all failed requests

async function refreshAccess() {
  const stored = JSON.parse(localStorage.getItem('user') || 'null');
  if (!stored?.refresh) throw new Error('No refresh token');
  const { data } = await axios.post(`${API_BASE_URL}/api/token/refresh/`, { refresh: stored.refresh });
  localStorage.setItem('access', data.access);
  localStorage.setItem('user', JSON.stringify({ ...stored, access: data.access }));
  return data.access;
}

function endSession() {
  if (!localStorage.getItem('user')) return; // already ended: notify only once
  localStorage.removeItem('user');
  localStorage.removeItem('access');
  window.dispatchEvent(new Event('auth:expired'));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      try {
        refreshing = refreshing || refreshAccess().finally(() => { refreshing = null; });
        original.headers.Authorization = `Bearer ${await refreshing}`;
        return api(original);
      } catch (e) {
        endSession();
      }
    }
    return Promise.reject(error);
  },
);

export default api;