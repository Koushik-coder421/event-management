import axios from 'axios';

const normalizeBaseUrl = (value) => (value ? value.replace(/\/$/, '') : '');
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '');
const defaultBaseUrl = isLocalHost ? `http://${window.location.hostname}:3000` : '';
const baseUrl = configuredBaseUrl || defaultBaseUrl;

const api = axios.create({
    baseURL: baseUrl ? `${baseUrl}/api` : '/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
