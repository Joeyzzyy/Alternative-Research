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
  const [packageType, setPackageType] = useState(null);
  const [packageInfo, setPackageInfo] = useState({
    packageName: null,
    packageStartTime: null,
    packageEndTime: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取用户套餐信息
  const fetchUserPackage = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCustomerPackage();
      console.log('UserContext - getCustomerPackage response:', response);
      
      if (response?.code === 200 && response.data) {
        const { 
          pageGeneratorLimit, 
          pageGeneratorUsage, 
          packageType: pkgType,
          packageName,
          packageStartTime,
          packageEndTime
        } = response.data;
        console.log('UserContext - packageType from API:', pkgType);
        
        setUserCredits({
          pageGeneratorLimit,
          pageGeneratorUsage
        });
        setPackageType(pkgType);
        setPackageInfo({
          packageName,
          packageStartTime,
          packageEndTime
        });
      } else {
        setError('Unable to get user package information');
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
      // 如果未登录，重置用户积分信息
      setUserCredits({
        pageGeneratorLimit: 0,
        pageGeneratorUsage: 0
      });
      setPackageType(null);
      setPackageInfo({
        packageName: null,
        packageStartTime: null,
        packageEndTime: null
      });
      setLoading(false);
    }
    
    // 只监听登录事件
    const handleLogin = () => {
      fetchUserPackage();
    };
    
    // 确保使用正确的事件名称
    window.addEventListener('alternativelyLoginSuccess', handleLogin);
    
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLogin);
    };
  }, []);

  // 提供的上下文值
  const value = {
    userCredits,
    packageType,
    packageInfo,
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