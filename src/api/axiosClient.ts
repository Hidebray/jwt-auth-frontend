// client/src/api/axiosClient.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Biến lưu Access Token trong bộ nhớ
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// 1. Request Interceptor: Gắn Token vào Header
axiosClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Xử lý Refresh Token tự động
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa từng thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang có tiến trình refresh khác chạy, xếp hàng chờ
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        // Gọi API Refresh Token
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        
        // Cập nhật Token mới
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data;
        setAccessToken(newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Xử lý hàng đợi đang chờ
        processQueue(null, newAccessToken);
        
        // Gọi lại request ban đầu
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);

      } catch (err) {
        processQueue(err, null);
        // Refresh thất bại -> Logout người dùng
        localStorage.removeItem('refreshToken');
        setAccessToken(null);
        window.location.href = '/login'; 
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);