// client/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosClient, setAccessToken } from '../api/axiosClient';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khi F5 trang, thử khôi phục phiên đăng nhập bằng Refresh Token
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axiosClient.post('/auth/refresh', { refreshToken });
          setAccessToken(data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          const profile = await axiosClient.get('/user/profile');
          setUser(profile.data);
        } catch (error) {
          console.log('Session expired');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const { data } = await axiosClient.post('/auth/login', credentials);
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  };

  const logout = async () => {
    try {
        await axiosClient.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
    } catch (e) {}
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);