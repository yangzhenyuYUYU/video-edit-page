import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(() => {
    // 从localStorage初始化用户信息
    const savedUserInfo = localStorage.getItem('userInfo');
    return savedUserInfo ? JSON.parse(savedUserInfo)?.user : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });

  // 登录方法
  const login = (userData) => {
    // 确保在状态更新和本地存储写入之前，数据格式是一致的
    const userDataToStore = {
      ...userData.user,
      token: userData.token
    };
    setIsLoggedIn(true);
    setUserInfo(userDataToStore);
    localStorage.setItem('userInfo', JSON.stringify(userDataToStore));
    localStorage.setItem('token', userData.token);
  };

  // 登出方法
  const logout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        setUserInfo(JSON.parse(savedUserInfo));
        setIsLoggedIn(true);
      } else {
        setUserInfo(null);
        setIsLoggedIn(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ userInfo, isLoggedIn, login, logout, setUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 