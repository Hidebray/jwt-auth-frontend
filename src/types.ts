// src/types.ts

// 1. Định nghĩa kiểu User
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// 2. Định nghĩa phản hồi từ API Login/Refresh
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// 3. Định nghĩa dữ liệu gửi lên khi Login
export interface LoginCredentials {
  username: string;
  password?: string;
}

// 4. Định nghĩa lỗi API
export interface ApiError {
  message: string;
  status: number;
}