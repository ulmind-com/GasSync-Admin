import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminPermission');
      window.location.href = '/login';
    }
    // Read-only admins get a clear message instead of a silent failure.
    if (error.response?.status === 403 && error.response?.data?.code === 'READ_ONLY_ADMIN') {
      toast.error(error.response.data.message || 'Read-only access — action not permitted');
    }
    return Promise.reject(error);
  }
);

export default api;
