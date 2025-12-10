import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginCredentials, AuthResponse } from '../types';
import { axiosClient, setAccessToken } from '../api/axiosClient';

// Định nghĩa kiểu dữ liệu cho Context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Logic khôi phục phiên đăng nhập khi F5 trang
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Gọi API lấy Access Token mới
          const { data } = await axiosClient.post<AuthResponse>('/auth/refresh', { refreshToken });
          
          // Cập nhật Token
          setAccessToken(data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Lấy thông tin User
          const profileResponse = await axiosClient.get<User>('/user/profile');
          setUser(profileResponse.data);

        } catch (error) {
          console.log('Phiên đăng nhập hết hạn:', error);
          setAccessToken(null);
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 2. Hàm Đăng Nhập
  const login = async (credentials: LoginCredentials) => {
    const { data } = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  // 3. Hàm Đăng Xuất
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
         await axiosClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};