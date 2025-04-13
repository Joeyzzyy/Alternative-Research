"use client";
import React, { useRef, useEffect, useCallback } from 'react';
import { useState } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api/index.js';
import { Dropdown, Modal, Button, Spin, Menu, Pagination } from 'antd';
import { useUser } from '../../contexts/UserContext';
import { useToolContext } from '../../contexts/ToolContext';

// Add import for the login modal component
import LoginModal from '../common/sections/LoginModal';

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
  const { userCredits, loading: userCreditsLoading } = useUser();
  const router = useRouter();
  const [state, setState] = useState({
    isOpen: false,
    activeDropdown: null
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true); // true for login form, false for register form
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success', 'error', 'info'
  });
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);
  const [resultIds, setResultIds] = useState([]);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState(0);
  const [loadingResultIds, setLoadingResultIds] = useState(false);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const { currentTool, setCurrentTool } = useToolContext();
  const [loading, setLoading] = useState(false);
  const initialLoadRef = useRef(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [googleOneTapInitialized, setGoogleOneTapInitialized] = useState(false);
  const tokenExpiredHandledRef = useRef(false);
  const [showConstructionModal, setShowConstructionModal] = useState(false);

  // 显示通知的辅助函数 (Moved Up)
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto close notification after 2 seconds (changed from 3 seconds)
    const timer = setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 2000);

    // 返回 timer 以便在需要时清除
    return timer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies for showNotification (if any, like setNotification)

  // 处理 Google One Tap 响应 (Moved Up)
  const handleGoogleOneTapResponse = useCallback(async (response) => {
    try {
      setLoading(true);
      showNotification('Verifying Google login...', 'info'); // showNotification is defined
      console.log('Google One Tap response:', response);
      // 发送 ID 令牌到后端进行验证
      const apiResponse = await apiClient.googleOneTapLogin(response.credential);
      
      if (apiResponse && apiResponse.data) {
        // 存储用户数据
        localStorage.setItem('alternativelyAccessToken', apiResponse.data.accessToken);
        localStorage.setItem('alternativelyIsLoggedIn', 'true');
        localStorage.setItem('alternativelyCustomerEmail', apiResponse.data.email);
        localStorage.setItem('alternativelyCustomerId', apiResponse.data.customerId);
        
        // 更新状态
        setIsLoggedIn(true);
        setUserEmail(apiResponse.data.email);
        
        showNotification('Login successful!', 'success');
        
        // 触发登录成功事件，通知其他组件
        const loginSuccessEvent = new CustomEvent('alternativelyLoginSuccess');
        window.dispatchEvent(loginSuccessEvent);
      }
    } catch (error) {
      console.error("Google One Tap login failed:", error);
      showNotification('Google login failed, please try again later', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]); // Keep showNotification dependency, ensure apiClient is stable or added if needed

  // 添加 Google One Tap 初始化函数
  const initializeGoogleOneTap = useCallback(() => {
    // 增加检查，确保只在未登录且未初始化时执行
    if (googleOneTapInitialized || isLoggedIn || typeof window === 'undefined' || !window.google?.accounts?.id) {
      console.log('Skipping One Tap initialization (already initialized, logged in, or GSI not ready).');
      return;
    }
    
    try {
      console.log('Initializing Google One Tap...'); // 添加日志
      window.google.accounts.id.initialize({
        client_id: '491914743416-1o5v2lv5582cvc7lrrmslg5g5b4kr6c1.apps.googleusercontent.com', 
        callback: handleGoogleOneTapResponse, // Now handleGoogleOneTapResponse is defined
        // auto_select: true, // Temporarily disable auto_select
        // cancel_on_tap_outside: true, // Temporarily disable cancel_on_tap_outside
        use_fedcm_for_prompt: false // Explicitly disable FedCM for testing
      });
      
      console.log('Google One Tap Initialized. Calling prompt...'); // 添加日志
      
      // 使用更详细的日志记录 prompt notification
      window.google.accounts.id.prompt((notification) => {
        console.log('Google One Tap Prompt Notification:', notification); // Log the raw notification object
        
        // Log specific reasons if available
        if (notification.isNotDisplayed?.()) {
          console.log('One Tap prompt not displayed. Reason:', notification.getNotDisplayedReason?.());
        } else if (notification.isSkippedMoment?.()) {
          console.log('One Tap prompt skipped. Reason:', notification.getSkippedReason?.());
        } else if (notification.isDismissedMoment?.()) {
           console.log('One Tap prompt dismissed. Reason:', notification.getDismissedReason?.());
        } else if (notification.isDisplayed?.()) {
           console.log('One Tap prompt displayed successfully (non-FedCM check).');
        } else {
           console.log('One Tap prompt notification received, but state is unclear or FedCM-specific.');
        }
      });
      
      setGoogleOneTapInitialized(true);
      console.log('googleOneTapInitialized set to true'); // 添加日志
    } catch (error) {
      console.error('Google One Tap initialization failed:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleOneTapInitialized, isLoggedIn, handleGoogleOneTapResponse]); // Keep handleGoogleOneTapResponse dependency

  // 加载 Google One Tap 脚本
  useEffect(() => {
    console.log('Checking One Tap script load. isLoggedIn:', isLoggedIn, 'googleOneTapInitialized:', googleOneTapInitialized); // 添加日志
    if (typeof window !== 'undefined' && !isLoggedIn && !googleOneTapInitialized) {
      // 检查脚本是否已加载
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        console.log('Google GSI script not found. Appending script...'); // 添加日志
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google GSI script loaded via onload.'); // 添加日志
          // 确保 google.accounts.id 可用后再初始化
          if (window.google?.accounts?.id) {
            initializeGoogleOneTap();
          } else {
            console.warn('GSI script loaded, but google.accounts.id not immediately available. Retrying initialization shortly.');
            // 可以选择稍作延迟重试，或依赖 initializeGoogleOneTap 内部的检查
            setTimeout(initializeGoogleOneTap, 100); 
          }
        };
        script.onerror = () => {
          console.error('Failed to load Google GSI script.'); // 添加错误处理
        };
        document.body.appendChild(script);
      } else {
        console.log('Google GSI script already exists. Attempting to initialize One Tap...'); // 添加日志
        // 即使脚本存在，也需要确保 google.accounts.id 可用
        if (window.google?.accounts?.id) {
          initializeGoogleOneTap();
        } else {
           console.warn('GSI script tag exists, but google.accounts.id not available. Waiting for potential late initialization.');
           // GSI 库可能仍在初始化，稍等片刻
           setTimeout(initializeGoogleOneTap, 500);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, googleOneTapInitialized]); // 移除 initializeGoogleOneTap，因为它现在是 useCallback 包裹的稳定函数

  // 当用户登出时重置 One Tap 状态
  useEffect(() => {
    if (!isLoggedIn && googleOneTapInitialized) {
      setGoogleOneTapInitialized(false);
    }
  }, [isLoggedIn]);

  // 处理预览选择
  const handlePreviewSelect = (resultId, index) => {
    setIsPreviewLoading(true);
    setSelectedPreviewUrl(`https://preview.websitelm.site/en/${resultId}`);
    setActivePreviewTab(index);
  };

  useEffect(() => {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const customerId = urlParams.get('customerId');
    const email = urlParams.get('email');
    
    // Validate JWT token format
    const isValidJWT = accessToken?.split('.').length === 3;

    if (accessToken && isValidJWT && customerId && email) {
      try {
        // Clear existing storage
        localStorage.clear();
        
        // Store new login information
        const decodedEmail = decodeURIComponent(email);
        localStorage.setItem('alternativelyIsLoggedIn', 'true');
        localStorage.setItem('alternativelyAccessToken', accessToken);
        localStorage.setItem('alternativelyCustomerId', customerId);
        localStorage.setItem('alternativelyCustomerEmail', decodedEmail);
        
        setIsLoggedIn(true);
        setUserEmail(decodedEmail);
        showNotification('Login successful!', 'success');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 触发登录成功事件，通知其他组件
        const loginSuccessEvent = new CustomEvent('alternativelyLoginSuccess');
        window.dispatchEvent(loginSuccessEvent);
      } catch (error) {
        console.error('Login process failed:', error);
        showNotification('Authentication failed', 'error');
        localStorage.clear();
      }
    }
  }, [showNotification]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      showNotification('Connecting to Google...', 'info');
      
      const response = await apiClient.googleLogin();
      
      if (response && response.data) {
        window.location.href = response.data;
      } else {
        showNotification('Failed to get Google login URL', 'error');
      }
    } catch (error) {
      console.error("Google login failed:", error);
      showNotification('Google login request failed, please try again later', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // 显示自定义确认对话框
    setShowLogoutConfirm(true);
  };
  
  // 处理关闭通知
  const handleCloseNotification = () => {
    setNotification(prev => ({...prev, show: false}));
  };

  // Handle regular login button click
  const handleRegularLoginClick = () => {
    setShowLoginModal(true);
    setIsLoginForm(true);
    setIsForgotPassword(false);
  };

  const mainMenuItems = [
    {
      label: "Generate Alternative Pages Now!",
      color: "#000000",
      fontWeight: "600",
      link: "#",
      onClick: (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    },
    {
      label: "Pricing",
      color: "#000000", 
      fontWeight: "600",
      link: "#pricing-1",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('pricing-1');
        if (element) {
          element.scrollIntoView();
        }
      }
    },
    {
      label: "FAQ",
      color: "#000000", 
      fontWeight: "600",
      link: "#faq-1",
      onClick: (e) => {
        e.preventDefault();
        const element = document.getElementById('faq-1');
        if (element) {
          element.scrollIntoView();
        }
      }
    }
  ];

  // Handle login success callback
  const handleLoginSuccess = (userData) => {
    // Store user data
    localStorage.setItem('alternativelyAccessToken', userData.accessToken);
    localStorage.setItem('alternativelyIsLoggedIn', 'true');
    localStorage.setItem('alternativelyCustomerEmail', userData.email);
    localStorage.setItem('alternativelyCustomerId', userData.customerId);
    
    // Update state
    setIsLoggedIn(true);
    setUserEmail(userData.email);
    
    showNotification('Login successful!', 'success');
    
    // Close login modal
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
    
    showNotification('Registration successful!', 'success');
    
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
        showNotification('Please login to continue', 'info');
      }
    };
    
    window.addEventListener('showAlternativelyLoginModal', handleShowLoginModal);
    
    return () => {
      window.removeEventListener('showAlternativelyLoginModal', handleShowLoginModal);
    };
  }, [showNotification, setIsLoginForm, showLoginModal]); // 添加所有依赖项 (added showLoginModal)

  useEffect(() => {
    // 检查本地存储中的登录信息
    const storedIsLoggedIn = localStorage.getItem('alternativelyIsLoggedIn');
    const storedEmail = localStorage.getItem('alternativelyCustomerEmail');
    
    if (storedIsLoggedIn === 'true' && storedEmail) {
      setIsLoggedIn(true);
      setUserEmail(storedEmail);
    }
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-950 to-black border-b border-slate-800/50">
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
                    width={160}
                    height={40}
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

            {/* Desktop Navigation 更新样式 */}
            <div className="hidden md:flex items-center justify-center flex-1 px-8">
              <div className="flex gap-8">
                {mainMenuItems.map(item => (
                  <div 
                    key={item.label}
                    className="relative group"
                  >
                    <a
                      href={item.link}
                      className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-400 hover:from-cyan-400 hover:to-purple-400 transition-all duration-300"
                    >
                      {item.label}
                    </a>
                    <div className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 group-hover:w-full"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* 更新按钮样式 */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  {/* 积分显示 */}
                  <div className="relative flex items-center gap-2">
                    {/* 添加用户名显示 */}
                    <div className="mr-3 text-gray-300">
                      <span className="text-sm">Hi, {userEmail ? userEmail.split('@')[0] : 'User'}</span>
                    </div>
                    <div 
                      className="flex items-center cursor-pointer text-gray-300 hover:text-white transition-colors"
                      onClick={() => setShowCreditsTooltip(!showCreditsTooltip)}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
                        <span className="text-sm font-medium">💎</span>
                      </div>
                      <span className="ml-1.5 text-sm font-medium">
                        {userCreditsLoading ? (
                          <Spin size="small" />
                        ) : (
                          `${userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage}/${userCredits.pageGeneratorLimit}`
                        )}
                      </span>
                    </div>

                    {/* 积分工具提示 */}
                    {showCreditsTooltip && (
                      <div className="absolute right-0 top-10 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50 text-xs"
                           style={{animation: 'fadeIn 0.2s ease-out forwards'}}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-purple-300">Page Generation Credits</span>
                          <button 
                            onClick={() => setShowCreditsTooltip(false)}
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
                              `${userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage} Available`
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
                        <p className="mb-3 text-gray-300">Total Limit: {userCredits.pageGeneratorLimit}</p>
                        <p className="mb-3 text-gray-300">Used: {userCredits.pageGeneratorUsage}</p>
                        <p className="text-gray-400 text-xs mb-4">Note: Changing the overall color scheme or style of the page will also consume credits.</p>
                        
                        {/* 添加购买更多积分按钮 */}
                        <button 
                          onClick={() => {
                            window.location.href = "/#pricing-1";
                            setShowCreditsTooltip(false);
                          }}
                          className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-md transition-all duration-300 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Buy More Credits
                        </button>
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

            {/* 移动菜单样式更新 */}
            {state.isOpen && (
              <div className="md:hidden absolute top-[4.2rem] left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800/50">
                <div className="py-4 px-6">
                  <div className="space-y-4">
                    {mainMenuItems.map((item) => (
                      <div key={item.label} className="group">
                        <a
                          href={item.link}
                          className="text-gray-300 hover:text-cyan-400 transition-colors duration-300 text-sm font-medium"
                        >
                          {item.label}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
        showNotification={showNotification}
        handleGoogleLogin={handleGoogleLogin}
        loading={loading}
      />

      {/* 通知组件 */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center">
            {/* 通知类型图标（左边） */}
            {notification.type === 'success' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}

            {/* 通知消息 */}
            <p className="text-white font-medium">{notification.message}</p>

            {/* 关闭按钮（右边的叉） */}
            <button 
              onClick={handleCloseNotification}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
                  showNotification('Logged out successfully', 'info');
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