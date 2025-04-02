"use client";

import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../lib/api/index.js';

// 创建上下文
export const UserContext = createContext();

// 创建提供者组件
export const UserProvider = ({ children }) => {
  const [userCredits, setUserCredits] = useState({
    pageGeneratorLimit: 0,
    pageGeneratorUsage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取用户套餐信息
  const fetchUserPackage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCustomerPackage();
      if (response?.code === 200 && response.data) {
        const { pageGeneratorLimit, pageGeneratorUsage } = response.data;
        setUserCredits({
          pageGeneratorLimit,
          pageGeneratorUsage
        });
      } else {
        setError('Unable to get user package information  ');
      }
    } catch (err) {
      console.error('Failed to get user package:', err);
      setError('Failed to get user package');
    } finally {
      setLoading(false);
    }
  };

  // 刷新用户套餐信息
  const refreshUserPackage = () => {
    fetchUserPackage();
  };

  // 组件挂载时获取用户套餐信息
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    if (isLoggedIn) {
      fetchUserPackage();
    } else {
      setLoading(false);
    }
    
    // 监听登录事件
    const handleLogin = () => {
      fetchUserPackage();
    };
    
    // 监听登出事件
    const handleLogout = () => {
      setUserCredits({
        pageGeneratorLimit: 0,
        pageGeneratorUsage: 0
      });
    };
    
    window.addEventListener('userLoggedIn', handleLogin);
    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  // 提供的上下文值
  const value = {
    userCredits,
    loading,
    error,
    refreshUserPackage
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 自定义钩子，方便使用上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};