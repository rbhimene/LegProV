import axios from 'axios';
import api from '../api';
import { API_BASE_URL } from '../config';

/** Log in: stores the access and refresh tokens. */
const login = async (credentials) => {
  const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/jwt/create/`, credentials);
  localStorage.setItem('user', JSON.stringify(data));
  localStorage.setItem('access', data.access);
  return data;
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('access');
};

/** The logged-in user: id, email, names, is_staff. */
const getUserInfo = async () => (await api.get('/api/v1/auth/users/me/')).data;

const authService = { login, logout, getUserInfo };

export default authService;