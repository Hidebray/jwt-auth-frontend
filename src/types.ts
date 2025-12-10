export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface ApiError {
  message: string;
  status: number;
}