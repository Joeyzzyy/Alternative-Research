"use client";
import React, { useEffect } from 'react';
import { useState } from "react";
import Image from 'next/image';
import apiClient from '../../lib/api/index.js';
import { Spin, message } from 'antd';
import { useUser } from '../../contexts/UserContext';

import LoginModal from '../common/sections/login-modal.js';
import BrandAssetsModal from '../common/sections/brand-assets.js';

const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  html {
    scroll-behavior: smooth;  /* 添加全局平滑滚动 */
  }
  
  .result-ids-modal .ant-modal-content {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100, 116, 139, 0.2);
  }
  .result-ids-modal .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }
  .result-ids-modal .ant-modal-title {
    color: white;
  }
  .result-ids-modal .ant-modal-close {
    color: rgba(255, 255, 255, 0.45);
  }
  .result-ids-modal .ant-modal-close:hover {
    color: rgba(255, 255, 255, 0.85);
  }
  .result-ids-modal {
    pointer-events: auto !important;
  }
  .result-ids-modal .ant-modal-wrap {
    z-index: 1500;
  }

  /* 添加构建中弹窗样式 */
  .construction-modal .ant-modal-content {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(99, 102, 241, 0.3);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }
  
  .construction-modal .ant-modal-body {
    padding: 24px;
  }
  
  .construction-modal .ant-modal-confirm-title {
    color: white;
    text-align: center;
    font-size: 20px;
    margin-bottom: 16px;
  }
  
  .construction-modal .ant-modal-confirm-content {
    color: rgba(255, 255, 255, 0.9);
    margin-left: 0;
  }
  
  .construction-modal-button {
    background: linear-gradient(to right, #4f46e5, #7c3aed) !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
    transition: all 0.3s ease !important;
  }
  
  .construction-modal-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4) !important;
    background: linear-gradient(to right, #4338ca, #6d28d9) !important;
  }
`;

export default function Header() {
  const [messageApi, contextHolder] = message.useMessage();
  const { userCredits, loading: userCreditsLoading } = useUser();
  const [state, setState] = useState({
    isOpen: false,
    activeDropdown: null
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true); 
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBrandAssetsModal, setShowBrandAssetsModal] = useState(false);

  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn');
    const storedEmail = localStorage.getItem('alternativelyCustomerEmail');
    
    if (storedIsLoggedIn === 'true' && storedEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const customerId = urlParams.get('customerId');
    const email = urlParams.get('email');
    const isValidJWT = accessToken?.split('.').length === 3;
    if (accessToken && isValidJWT && customerId && email) {
      try {
        localStorage.removeItem('alternativelyAccessToken');
        localStorage.removeItem('alternativelyIsLoggedIn');
        localStorage.removeItem('alternativelyCustomerId');
        localStorage.removeItem('alternativelyCustomerEmail');
        const decodedEmail = decodeURIComponent(email);
        localStorage.setItem('alternativelyIsLoggedIn', 'true');
        localStorage.setItem('alternativelyAccessToken', accessToken);
        localStorage.setItem('alternativelyCustomerId', customerId);
        localStorage.setItem('alternativelyCustomerEmail', decodedEmail);
        
        setIsLoggedIn(true);
        setUserEmail(decodedEmail);
        messageApi.success({ content: 'Login successful!', duration: 2 });
        window.history.replaceState({}, document.title, window.location.pathname);
        const loginSuccessEvent = new CustomEvent('alternativelyLoginSuccess');
        window.dispatchEvent(loginSuccessEvent);
      } catch (error) {
        console.error('Login process failed:', error);
        messageApi.error({ content: 'Authentication failed', duration: 2 });
        localStorage.removeItem('alternativelyAccessToken');
        localStorage.removeItem('alternativelyIsLoggedIn');
        localStorage.removeItem('alternativelyCustomerId');
        localStorage.removeItem('alternativelyCustomerEmail');
      }
    }
  }, [messageApi]);

  const handleGoogleLogin = async () => {
    const key = 'googleLogin';
    let invitationCode = null;
    try {
      invitationCode = localStorage.getItem('invitationCode');
    } catch (e) {
      invitationCode = null;
    }
    try {
      setLoading(true);
      messageApi.loading({ content: 'Connecting to Google...', key, duration: 0 });
      const response = await apiClient.googleLogin(invitationCode);
      if (response && response.data) {
        try {
          localStorage.removeItem('invitationCode');
        } catch (e) {}
        messageApi.destroy(key);
        window.location.href = response.data;
      } else {
        messageApi.error({ content: 'Failed to get Google login URL', key, duration: 2 });
      }
    } catch (error) {
      console.error("Google login failed:", error);
      messageApi.error({ content: 'Google login request failed, please try again later', key, duration: 2 });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };
  
  const handleRegularLoginClick = () => {
    setShowLoginModal(true);
    setIsLoginForm(true);
    setIsForgotPassword(false);
  };

  const mainMenuItems = [
    {
      label: "The Problem",
      color: "#000000", 
      fontWeight: "600",
      link: "#the-problem",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('the-problem');
        if (element) {
          element.scrollIntoView();
        }
      }
    },
    {
      label: "How It Works",
      color: "#000000", 
      fontWeight: "600",
      link: "#how-it-works",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('how-it-works');
        if (element) {
          element.scrollIntoView();
        }
      }
    },
    {
      label: "Features",
      color: "#000000", 
      fontWeight: "600",
      link: "#features",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('features');
        if (element) {
          element.scrollIntoView();
        }
      }
    },
    {
      label: "Pricing",
      color: "#000000", 
      fontWeight: "600",
      link: "#pricing",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('pricing');
        if (element) {
          element.scrollIntoView();
        }
      }
    },
    {
      label: "FAQ",
      color: "#000000", 
      fontWeight: "600",
      link: "#faq",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('faq');
        if (element) {
          element.scrollIntoView();
        }
      }
    }
  ];

  // Handle login success callback
  const handleLoginSuccess = (userData) => {
    // 存储用户数据
    localStorage.setItem('alternativelyAccessToken', userData.accessToken);
    localStorage.setItem('alternativelyIsLoggedIn', 'true');
    localStorage.setItem('alternativelyCustomerEmail', userData.email);
    localStorage.setItem('alternativelyCustomerId', userData.customerId);
    
    // Update state
    setIsLoggedIn(true);
    setUserEmail(userData.email);
    
    // 使用 messageApi 显示成功消息
    messageApi.success({ content: 'Login successful!', duration: 2 });
    
    // 关闭登录模态框
    setShowLoginModal(false);
    
    // 触发登录成功事件，通知其他组件
    const loginSuccessEvent = new CustomEvent('alternativelyLoginSuccess');
    window.dispatchEvent(loginSuccessEvent);
  };

  // 添加注册成功的回调函数
  const handleRegisterSuccess = (userData) => {
    // 存储用户数据
    localStorage.setItem('alternativelyAccessToken', userData.accessToken);
    localStorage.setItem('alternativelyIsLoggedIn', 'true');
    localStorage.setItem('alternativelyCustomerEmail', userData.email);
    localStorage.setItem('alternativelyCustomerId', userData.customerId);
    
    // 更新状态
    setIsLoggedIn(true);
    setUserEmail(userData.email);
    
    // 使用 messageApi 显示成功消息
    messageApi.success({ content: 'Registration successful!', duration: 2 });
    
    // 关闭登录模态框
    setShowLoginModal(false);
    
    // 触发登录成功事件，通知其他组件
    const loginSuccessEvent = new CustomEvent('alternativelyLoginSuccess');
    window.dispatchEvent(loginSuccessEvent);
  };

  // 修改 useEffect 依赖数组，添加 showLoginModal
  useEffect(() => {
    const handleShowLoginModal = () => {
      if (!showLoginModal) {
        setShowLoginModal(true);
        setIsLoginForm(true); // 确保显示登录表单而不是注册表单
        // 使用 messageApi 显示提示信息
        // messageApi.info({ content: 'Please login to continue', duration: 2 });
      }
    };
    
    window.addEventListener('showAlternativelyLoginModal', handleShowLoginModal);
    
    return () => {
      window.removeEventListener('showAlternativelyLoginModal', handleShowLoginModal);
    };
  // 移除 showNotification 依赖，添加 messageApi
  }, [setIsLoginForm, showLoginModal, messageApi]); // 添加所有依赖项 (added showLoginModal, messageApi)

  useEffect(() => {
    const handleLoginSuccess = () => {
      // 重新获取登录信息
      const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn');
      const storedEmail = localStorage.getItem('alternativelyCustomerEmail');
      if (storedIsLoggedIn === 'true' && storedEmail) {
        setIsLoggedIn(true);
        setUserEmail(storedEmail);
      }
    };
    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, []);

  useEffect(() => {
    // 检查 URL 是否包含 invitation 参数，如果有则存入 localStorage
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const invitation = urlParams.get('invitation');
      const showGoogleLogin = urlParams.get('showGoogleLogin');
      const showLoginModalParam = urlParams.get('showLoginModal');
      const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
      
      if (invitation) {
        try {
          localStorage.setItem('invitationCode', invitation);
        } catch (e) {
        }
        urlParams.delete('invitation');
        const newUrl =
          window.location.pathname +
          (urlParams.toString() ? `?${urlParams.toString()}` : '') +
          window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }

      if (showGoogleLogin === 'true' && !storedIsLoggedIn) {
        urlParams.delete('showGoogleLogin');
        const newUrl =
          window.location.pathname +
          (urlParams.toString() ? `?${urlParams.toString()}` : '') +
          window.location.hash;
        window.history.replaceState({}, '', newUrl);
        
        setTimeout(() => {
          handleGoogleLogin();
        }, 500);
      }
      
      if (showLoginModalParam === 'true' && !storedIsLoggedIn) {
        urlParams.delete('showLoginModal');
        const newUrl =
          window.location.pathname +
          (urlParams.toString() ? `?${urlParams.toString()}` : '') +
          window.location.hash;
        window.history.replaceState({}, '', newUrl);
        
        // 延迟一小段时间后显示登录模态框，确保页面已完全加载
        setTimeout(() => {
          setShowLoginModal(true);
          setIsLoginForm(true); // 确保显示登录表单而不是注册表单
        }, 500);
      }
    }
  }, [handleGoogleLogin, setShowLoginModal, setIsLoginForm]); // 添加所有依赖项

  const toggleMobileMenu = () => {
    setState(prevState => ({ ...prevState, isOpen: !prevState.isOpen }));
  };

  return (
    <>
      {/* 在根元素渲染 contextHolder */}
      {contextHolder}
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-950 to-black border-b border-slate-800/50"
        style={{
          // 导航栏始终固定在顶部
          top: '0',
        }}
      >
        {/* 科技感背景装饰 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#22d3ee10_0%,_transparent_60%)]"></div>
        
        {/* 动态粒子效果 */}
        <div className="absolute inset-0 overflow-hidden">
          {Array(3).fill(0).map((_, i) => (
            <div 
              key={i}
              className={`absolute w-0.5 h-0.5 rounded-full ${
                i % 3 === 0 ? 'bg-cyan-500/30' : 
                i % 3 === 1 ? 'bg-purple-500/30' : 
                'bg-rose-400/30'
              }`}
              style={{
                top: `${5 + (i * 20)}%`,
                left: `${10 + (i * 15)}%`,
                boxShadow: '0 0 8px 1px currentColor',
                animation: `float-y ${6 + i}s ease-in-out infinite alternate`
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-[1450px] mx-auto px-6 relative z-10">
          <div className="flex items-center justify-between h-[4.2rem]">
            {/* Logo 添加光效 */}
            <div className="flex-shrink-0 flex items-center h-full group">
              <a href="/" className="flex items-center h-full py-2 relative">
                {/* 添加文字渐变容器 */}
                <div className="relative z-10">
                  <Image
                    src="/images/alternatively-logo-tem.png"
                    alt="Logo"
                    width={120}
                    height={30}
                    className="object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-lighten"
                    style={{ width: 'auto', height: 'auto' }}
                    quality={100}
                    priority
                  />
                </div>
                {/* 增强背景光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 opacity-70 group-hover:opacity-90 transition-opacity duration-300 rounded-full blur-[20px]"></div>
                {/* 添加动态光晕动画 */}
                <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 blur-[30px]"></div>
                {/* 添加文字描边 */}
                <div className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200 opacity-30 mix-blend-overlay"></div>
              </a>
            </div>

            {/* 右侧容器 (导航菜单 + 认证按钮) - 桌面端 */}
            <div className="hidden md:flex items-center gap-8">
              {/* Desktop Navigation */}
              <div className="flex gap-8">
                {mainMenuItems.map(item => (
                  <div
                    key={item.label}
                    className="relative group"
                  >
                    <a
                      href={item.link}
                      className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-400 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300"
                    >
                      {item.label}
                    </a>
                    <div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                ))}
              </div>

              {/* Desktop Auth Buttons */}
              <div className="flex items-center gap-4">
                {isLoggedIn ? (
                  <div className="flex items-center gap-4">
                    {/* 合并用户名和积分显示为一个可点击区域 */}
                    <div
                      className="relative flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors"
                      onClick={() => setShowCreditsTooltip(!showCreditsTooltip)}
                    >
                      {/* 用户名显示 */}
                      <div className="text-sm">
                        Hi, {userEmail ? userEmail.split('@')[0] : 'User'}
                      </div>
                      {/* 积分图标和数量 */}
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
                          <span className="text-sm font-medium">💎</span>
                        </div>
                        <span className="ml-1.5 text-sm font-medium">
                          {userCreditsLoading ? (
                            <Spin size="small" />
                          ) : (
                            `${(userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage) * 10}/${userCredits.pageGeneratorLimit * 10}`
                          )}
                        </span>
                      </div>

                      {/* 积分工具提示 */}
                      {showCreditsTooltip && (
                        <div className="absolute right-0 top-10 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50 text-xs"
                             style={{animation: 'fadeIn 0.2s ease-out forwards'}}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-purple-300">Page Generation Credits</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCreditsTooltip(false);
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold text-lg">
                              {userCreditsLoading ? (
                                <Spin size="small" />
                              ) : (
                                `${(userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage) * 10} Available`
                              )}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{
                                width: `${Math.min(100, ((userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage) / userCredits.pageGeneratorLimit) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <p className="mb-3 text-gray-300">Total Credits: {userCredits.pageGeneratorLimit * 10}</p>
                          <p className="mb-3 text-gray-300">Used: {userCredits.pageGeneratorUsage * 10}</p>
                          <p className="text-gray-400 text-xs mb-4">
                            Generating a new alternative page or changing the overall color scheme/style consumes <span className="font-bold text-white">10 credits</span>.
                          </p>

                          {/* 添加购买更多积分按钮 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = "/#pricing";
                              setShowCreditsTooltip(false);
                            }}
                            className="w-full py-2 px-4 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-md transition-all duration-300 flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Buy More Credits
                          </button>

                          {/* --- 新增：品牌颜色资产部分 --- */}
                          <div className="border-t border-gray-700 pt-3 mt-3">
                            <span className="font-medium text-cyan-300 block mb-2">Brand Color Assets</span>
                            <p className="text-gray-400 text-xs mb-3">Access your saved brand colors and palettes.</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // 修改：点击时显示 BrandAssetsModal
                                setShowBrandAssetsModal(true);
                                // 关闭积分提示框
                                setShowCreditsTooltip(false);
                              }}
                              className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-medium rounded-md transition-all duration-300 flex items-center justify-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              Manage Brand Colors
                            </button>
                          </div>
                          {/* --- 结束：品牌颜色资产部分 --- */}

                        </div>
                      )}
                    </div>

                    {/* 登出按钮 */}
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleRegularLoginClick}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-800/50 backdrop-blur-sm rounded-lg hover:bg-slate-700/60 transition-all duration-300 border border-slate-700/50 hover:border-cyan-500/30"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800/50 backdrop-blur-sm rounded-lg hover:bg-slate-700/60 transition-all duration-300 border border-slate-700/50 hover:border-purple-500/30"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Sign in with Google
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 移动端菜单按钮 (汉堡包) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-300 hover:text-white focus:outline-none focus:text-white p-2 rounded-md bg-slate-800/50 hover:bg-slate-700/60 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {state.isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动菜单 */}
        {state.isOpen && (
          <div className="md:hidden absolute top-[4.2rem] left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800/50 shadow-lg">
            <div className="py-4 px-6">
              {/* 移动端导航链接 */}
              <div className="space-y-4 mb-6">
                {mainMenuItems.map((item) => (
                  <div key={item.label} className="group">
                    <a
                      href={item.link}
                      onClick={(e) => {
                        // 在移动端点击链接后关闭菜单
                        toggleMobileMenu();
                        // 调用原有的点击处理函数（如果有）
                        if (item.onClick) {
                          item.onClick(e);
                        } else {
                          // 如果没有 onClick，执行默认滚动行为
                          e.preventDefault();
                          const element = document.getElementById(item.link.substring(1));
                          if (element) {
                            element.scrollIntoView();
                          }
                        }
                      }}
                      className="block py-2 text-gray-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium"
                    >
                      {item.label}
                    </a>
                  </div>
                ))}
              </div>

              {/* 移动端认证按钮 */}
              <div className="border-t border-slate-700/50 pt-4">
                {isLoggedIn ? (
                  <div className="space-y-4">
                    {/* 用户名和积分 */}
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Hi, {userEmail ? userEmail.split('@')[0] : 'User'}</span>
                      <div
                        className="flex items-center cursor-pointer hover:text-white transition-colors"
                        onClick={() => {
                          // 在移动端点击积分也跳转到 pricing
                          window.location.href = "/#pricing";
                          toggleMobileMenu(); // 关闭菜单
                        }}
                      >
                        <span className="mr-1.5">💎</span>
                        <span>
                          {userCreditsLoading ? (
                            <Spin size="small" />
                          ) : (
                            `${(userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage) * 10}/${userCredits.pageGeneratorLimit * 10}`
                          )} Credits
                        </span>
                      </div>
                    </div>
                    {/* 登出按钮 */}
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleMobileMenu(); // 关闭菜单
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600/80 to-blue-600/80 text-white hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg text-sm"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 登录按钮 */}
                    <button
                      onClick={() => {
                        handleRegularLoginClick();
                        toggleMobileMenu(); // 关闭菜单
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-slate-800/50 backdrop-blur-sm rounded-lg hover:bg-slate-700/60 transition-all duration-300 border border-slate-700/50"
                    >
                      Sign In
                    </button>
                    {/* Google 登录按钮 */}
                    <button
                      onClick={() => {
                        handleGoogleLogin();
                        toggleMobileMenu(); // 关闭菜单
                      }}
                      disabled={loading}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-slate-800/50 backdrop-blur-sm rounded-lg hover:bg-slate-700/60 transition-all duration-300 border border-slate-700/50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Sign in with Google
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Use encapsulated login/register modal component */}
      <LoginModal 
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        isLoginForm={isLoginForm}
        setIsLoginForm={setIsLoginForm}
        isForgotPassword={isForgotPassword}
        setIsForgotPassword={setIsForgotPassword}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        messageApi={messageApi}
        handleGoogleLogin={handleGoogleLogin}
        loading={loading}
      />

      {/* 自定义登出确认对话框 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Logout</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('alternativelyAccessToken');
                  localStorage.removeItem('alternativelyIsLoggedIn');
                  localStorage.removeItem('alternativelyCustomerEmail');
                  localStorage.removeItem('alternativelyCustomerId');
                  setIsLoggedIn(false);
                  setUserEmail('');
                  // 使用 messageApi 显示提示信息
                  messageApi.info({ content: 'Logged out successfully', duration: 2 });
                  setShowLogoutConfirm(false);
                  
                  // 添加页面刷新
                  setTimeout(() => {
                    window.location.reload();
                  }, 500); // 短暂延迟确保通知能够显示
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增：Brand Assets Modal */}
      {showBrandAssetsModal && (
        <BrandAssetsModal
          showBrandAssetsModal={showBrandAssetsModal}
          setShowBrandAssetsModal={setShowBrandAssetsModal}
        />
      )}

      <style>{animationStyles}</style>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(100, 116, 139, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.7);
        }
        
        @keyframes pulse-border {
          0% { border-color: rgba(59, 130, 246, 0.3); }
          50% { border-color: rgba(59, 130, 246, 0.6); }
          100% { border-color: rgba(59, 130, 246, 0.3); }
        }
        
        .active-preview {
          animation: pulse-border 2s infinite;
        }
      `}</style>
    </>
  );
}