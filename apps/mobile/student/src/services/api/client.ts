import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants/config';
import { getSecureItem, setSecureItem, deleteSecureItem } from '@/utils/storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return apiClient(originalRequest);
        } catch {
          await deleteSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
          await deleteSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
