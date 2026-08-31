import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('siteguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('siteguard_token');
      localStorage.removeItem('siteguard_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    if (
      error.response &&
      error.response.status === 403 &&
      error.response.data?.detail === 'PASSWORD_CHANGE_REQUIRED' &&
      window.location.pathname !== '/change-password'
    ) {
      window.location.href = '/change-password';
    }

    return Promise.reject(error);
  }
);

export default api;
