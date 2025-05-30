"use client";
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const { userCredits, loading: userCreditsLoading, packageType, packageInfo } = useUser();
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
  const [isOneTapShown, setIsOneTapShown] = useState(false);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [taskNotificationEmail, setTaskNotificationEmail] = useState(false);

  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    isLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

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

        if (response.data.firstLogin) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            'event': 'custom_event_signup_success', // 自定义事件名，用于GTM触发器
            'registration_method': 'google',        // 描述注册方式
            'user_id': response.data.customerId,    // 用户ID
          });
        }

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

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'custom_event_signup_success', // 自定义事件名，用于GTM触发器
      'registration_method': 'email',         // (可选) 描述注册方式
      'user_id': userData.customerId,      // 如果需要可以加上用户ID
    });
    
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

  // 添加Google One Tap处理函数
  const handleGoogleOneTapSuccess = useCallback(async (response) => {
    const key = 'googleOneTap';
    try {
      messageApi.loading({ content: 'Authenticating...', key, duration: 0 });
      
      // 调用后端接口
      const res = await apiClient.googleOneTapLogin(response.credential);

      // 存储用户信息
      localStorage.setItem('alternativelyAccessToken', res.accessToken);
      localStorage.setItem('alternativelyIsLoggedIn', 'true');
      localStorage.setItem('alternativelyCustomerEmail', res.data.email);
      localStorage.setItem('alternativelyCustomerId', res.data.customerId);

      if (res.data.firstLogin) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'event': 'custom_event_signup_success', // 自定义事件名，用于GTM触发器
          'registration_method': 'google',        // 描述注册方式
          'user_id': response.data.customerId,    // 用户ID
        });
      }

      // 更新状态
      setIsLoggedIn(true);
      setUserEmail(res.email);
      messageApi.success({ content: 'Login successful!', duration: 2 });

      // 关闭可能打开的登录模态框
      setShowLoginModal(false);
      window.dispatchEvent(new CustomEvent('alternativelyLoginSuccess'));
    } catch (error) {
      console.error('Google One Tap login failed:', error);
      messageApi.error({ 
        content: error.response?.data?.error || 'Authentication failed',
        duration: 2 
      });
    } finally {
      messageApi.destroy(key);
    }
  }, [messageApi, setShowLoginModal]);

  // 添加Google One Tap初始化逻辑
  useEffect(() => {
    let googleScript = null;

    console.log('[OneTap] useEffect触发, isLoggedIn:', isLoggedIn, 'isOneTapShown:', isOneTapShown);

    const initializeOneTap = () => {
      console.log('[OneTap] 尝试初始化 One Tap, isLoggedInRef.current:', isLoggedInRef.current, 'isOneTapShown:', isOneTapShown, 'window.google:', !!window.google);
      if (!window.google || isLoggedInRef.current || isOneTapShown) {
        console.log('[OneTap] 初始化终止（已登录/已弹出/无google）');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleOneTapSuccess,
        cancel_on_tap_outside: false,
        prompt_parent_id: "google-one-tap-button"
      });

      window.google.accounts.id.prompt(notification => {
        console.log('[OneTap] prompt回调, notification:', notification);
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsOneTapShown(true);
          console.log('[OneTap] One Tap未显示或被跳过，设置isOneTapShown为true');
        } else {
          console.log('[OneTap] One Tap已弹出');
        }
      });
    };

    const loadGoogleScript = () => {
      if (isLoggedInRef.current) {
        console.log('[OneTap] 已登录，不加载Google脚本');
        return;
      }
      if (!document.querySelector('#google-one-tap-script')) {
        console.log('[OneTap] 加载Google One Tap脚本');
        googleScript = document.createElement('script');
        googleScript.id = 'google-one-tap-script';
        googleScript.src = 'https://accounts.google.com/gsi/client';
        googleScript.async = true;
        googleScript.defer = true;
        googleScript.onload = () => {
          console.log('[OneTap] Google脚本加载完成, isLoggedInRef.current:', isLoggedInRef.current);
          if (!isLoggedInRef.current) {
            initializeOneTap();
          } else {
            console.log('[OneTap] onload时已登录，不初始化');
          }
        };
        document.head.appendChild(googleScript);
      } else {
        console.log('[OneTap] Google脚本已存在，直接初始化');
        initializeOneTap();
      }
    };

    if (!isLoggedInRef.current) {
      loadGoogleScript();
    } else {
      console.log('[OneTap] 已登录，不执行loadGoogleScript');
    }

    return () => {
      if (googleScript) {
        console.log('[OneTap] 清理，移除Google脚本');
        googleScript.remove();
      }
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('[OneTap] 清理，取消One Tap');
        window.google.accounts.id.cancel();
      }
    };
  }, [isLoggedIn, isOneTapShown, handleGoogleOneTapSuccess]);

  // 修改积分弹窗点击处理函数
  const handleCreditsTooltipClick = async () => {
    setShowCreditsTooltip(!showCreditsTooltip);
    
    // 每次打开弹窗时调用接口获取用户信息
    if (!showCreditsTooltip) { // 只在打开弹窗时调用
      try {
        console.log('正在获取用户信息...');
        console.log('当前 packageType:', packageType); // 添加调试信息
        
        // 只获取customer信息来获取removeWatermark状态
        const customerInfo = await apiClient.getCustomerInfo();
        console.log('用户信息:', customerInfo);
        console.log('用户信息字段:', Object.keys(customerInfo || {}));
        
        // 获取removeWatermark字段从customer接口
        if (customerInfo && customerInfo.data) {
          const watermarkStatus = customerInfo.data.removeWatermark;
          console.log('removeWatermark状态:', watermarkStatus);
          setRemoveWatermark(watermarkStatus);
          
          // 获取任务完成通知邮件状态
          const emailNotificationStatus = customerInfo.data.notificationReference?.preferences?.page_task_finished?.email;
          console.log('任务完成邮件通知状态:', emailNotificationStatus);
          setTaskNotificationEmail(emailNotificationStatus || false);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    }
  };

  // 添加点击外部关闭弹窗的处理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCreditsTooltip) {
        // 检查点击是否在弹窗外部
        const tooltipElement = document.querySelector('[data-tooltip="credits"]');
        const triggerElement = event.target.closest('[data-trigger="credits"]');
        
        if (tooltipElement && !tooltipElement.contains(event.target) && !triggerElement) {
          setShowCreditsTooltip(false);
        }
      }
    };

    if (showCreditsTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showCreditsTooltip]);

  // 修改：切换水印状态的函数
  const handleToggleWatermark = async (e) => {
    // 阻止事件冒泡，防止关闭popup
    e.stopPropagation();
    
    // 只有付费用户(packageType 1或2)才能切换
    if (packageType !== 1 && packageType !== 2) {
      return;
    }

    try {
      const newWatermarkStatus = !removeWatermark;
      console.log('切换水印状态到:', newWatermarkStatus);
      
      // 调用新的水印设置接口
      const response = await apiClient.setWatermark(newWatermarkStatus);
      console.log('水印设置响应:', response);
      
      // 更新本地状态
      setRemoveWatermark(newWatermarkStatus);
      
      // 显示成功提示
      messageApi.success({ 
        content: `Watermark ${newWatermarkStatus ? 'hidden' : 'shown'} successfully`, 
        duration: 2 
      });
      
    } catch (error) {
      console.error('切换水印状态失败:', error);
      messageApi.error({ 
        content: 'Failed to update watermark setting', 
        duration: 2 
      });
    }
  };

  // 修改：切换任务通知邮件状态的函数
  const handleToggleTaskNotification = async (e) => {
    // 阻止事件冒泡，防止关闭popup
    e.stopPropagation();
    
    try {
      const newNotificationStatus = !taskNotificationEmail;
      console.log('切换任务通知邮件状态到:', newNotificationStatus);
      
      // 使用正确的接口格式调用通知设置接口
      const response = await apiClient.updateNotificationPreferences({
        channel: "email",
        enabled: newNotificationStatus,
        notificationType: "page_task_finished"
      });
      console.log('通知设置响应:', response);
      
      // 更新本地状态
      setTaskNotificationEmail(newNotificationStatus);
      
      // 显示成功提示
      messageApi.success({ 
        content: `Task completion email ${newNotificationStatus ? 'enabled' : 'disabled'} successfully`, 
        duration: 2 
      });
      
    } catch (error) {
      console.error('切换任务通知邮件状态失败:', error);
      messageApi.error({ 
        content: 'Failed to update notification setting', 
        duration: 2 
      });
    }
  };

  return (
    <>
      {/* 在页面顶部添加Google One Tap容器 */}
      <div 
        id="google-one-tap-button"
        className="fixed top-24 right-4 z-[9999]"
        style={{ 
          display: isLoggedIn ? 'none' : 'block',
          width: '400px', // 确保足够宽度显示完整提示
          height: '50px'  // 防止布局抖动
        }}
      ></div>

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
              <div className="flex items-center h-full py-2 relative cursor-default select-none">
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
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 opacity-70 group-hover:opacity-90 transition-opacity duration-300 rounded-full blur-[20px]"></div>
                <div className="absolute inset-0 animate-pulse-slow opacity-30 bg-gradient-to-r from-cyan-400/30 to-purple-400/30 blur-[30px]"></div>
                <div className="absolute inset-0 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200 opacity-30 mix-blend-overlay"></div>
              </div>
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
                      onClick={handleCreditsTooltipClick}
                      data-trigger="credits"
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
                        <div 
                          className="absolute right-0 top-10 w-[620px] bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden z-50"
                          style={{animation: 'fadeIn 0.2s ease-out forwards'}}
                          onClick={(e) => e.stopPropagation()}
                          data-tooltip="credits"
                        >
                          
                          {/* 顶部标题栏 */}
                          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 flex items-center justify-center mr-3">
                                  <span className="text-lg">⚡</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white text-lg">Account Dashboard</h3>
                                  <p className="text-gray-300 text-sm">Manage your subscription and settings</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCreditsTooltip(false);
                                }}
                                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* 主要内容区域 - 左右布局 */}
                          <div className="flex">
                            {/* 左侧 - 套餐信息区域 */}
                            <div className="flex-1 p-5 border-r border-gray-700">
                              <div className="space-y-4">
                                {/* 套餐状态卡片 */}
                                <div className={`p-4 rounded-lg border ${
                                  packageType === 1 ? 'bg-blue-500/10 border-blue-500/30' :
                                  packageType === 2 ? 'bg-purple-500/10 border-purple-500/30' :
                                  'bg-gray-500/10 border-gray-500/30'
                                }`}>
                                  <div className="flex items-center mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                      packageType === 1 ? 'bg-blue-500/30' :
                                      packageType === 2 ? 'bg-purple-500/30' :
                                      'bg-gray-500/30'
                                    }`}>
                                      <span className="text-xl">
                                        {packageType === 1 ? '📅' : packageType === 2 ? '👑' : '🆓'}
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-white text-base">
                                        {packageInfo?.packageName || 
                                         (packageType === 1 ? 'Monthly Plan' : 
                                          packageType === 2 ? 'Annual Plan' : 
                                          'Free Plan')}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                          packageType === 1 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                          packageType === 2 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                          'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                        }`}>
                                          {packageType === 1 ? 'Monthly' : packageType === 2 ? 'Annual' : 'Free'}
                                        </span>
                                        <span className={`text-xs font-medium ${
                                          packageType === 1 || packageType === 2 ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                          {packageType === 1 || packageType === 2 ? '● Active' : '● Limited'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 套餐详细信息 */}
                                  {(packageType === 1 || packageType === 2) && packageInfo?.packageStartTime && packageInfo?.packageEndTime ? (
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-black/20 p-3 rounded-lg">
                                          <p className="text-gray-400 text-xs mb-1">Start Date</p>
                                          <p className="text-white font-medium text-sm">{packageInfo.packageStartTime}</p>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-lg">
                                          <p className="text-gray-400 text-xs mb-1">End Date</p>
                                          <p className="text-white font-medium text-sm">{packageInfo.packageEndTime}</p>
                                        </div>
                                      </div>
                                      
                                      {/* 续费提醒 */}
                                      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-3">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          <span className="text-orange-300 text-xs font-medium">Auto-renewal enabled</span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                                      <div className="text-center">
                                        <p className="text-blue-300 text-sm font-medium mb-2">🚀 Upgrade to unlock premium features</p>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = "/#pricing";
                                            setShowCreditsTooltip(false);
                                          }}
                                          className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-medium rounded-lg transition-all duration-300"
                                        >
                                          View Plans
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Brand Assets 控制区域 */}
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-600/30 mt-4">
                                <div className="flex items-center mb-2">
                                  <svg className="w-4 h-4 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                  </svg>
                                  <span className="font-medium text-cyan-300 text-sm">Brand Assets</span>
                                </div>
                                <p className="text-gray-400 text-xs mb-3">
                                  Customize color schemes and styling for generated websites
                                </p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowBrandAssetsModal(true);
                                    setShowCreditsTooltip(false);
                                  }}
                                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-cyan-500/25"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" />
                                  </svg>
                                  Edit Brand Settings
                                </button>
                              </div>

                              {/* 水印控制 */}
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-600/30 mt-4">
                                <div className="flex items-center mb-2">
                                  <svg className="w-4 h-4 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <span className="font-medium text-orange-300 text-sm">Watermark</span>
                                  {packageType === 3 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                                      PRO
                                    </span>
                                  )}
                                </div>

                                {packageType === 1 || packageType === 2 ? (
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="text-xs text-white mr-2">Hide Footer</span>
                                      <span className={`text-xs font-medium ${
                                        removeWatermark ? 'text-green-400' : 'text-gray-400'
                                      }`}>
                                        {removeWatermark ? '✅ Hidden' : '👁️ Visible'}
                                      </span>
                                    </div>
                                    <button
                                      onClick={handleToggleWatermark}
                                      className={`relative w-10 h-5 rounded-full transition-colors ${
                                        removeWatermark ? 'bg-green-600' : 'bg-gray-600'
                                      }`}
                                    >
                                      <div className={`absolute top-[2px] bg-white rounded-full h-4 w-4 transition-transform ${
                                        removeWatermark ? 'translate-x-[20px]' : 'translate-x-[2px]'
                                      }`}></div>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <span className="text-red-400 text-xs font-medium">🔒 Upgrade Required</span>
                                    <p className="text-red-300 text-xs mt-1">Remove branding from pages</p>
                                  </div>
                                )}
                              </div>

                              {/* 新增：任务完成邮件通知控制 */}
                              <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-600/30 mb-4">
                                <div className="flex items-center mb-2">
                                  <svg className="w-4 h-4 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium text-blue-300 text-sm">Email Notifications</span>
                                </div>
                                <p className="text-gray-400 text-xs mb-3">
                                  Get notified when your page generation is complete
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="text-xs text-white mr-2">Task Completion</span>
                                    <span className={`text-xs font-medium ${
                                      taskNotificationEmail ? 'text-green-400' : 'text-gray-400'
                                    }`}>
                                      {taskNotificationEmail ? '📧 Enabled' : '🔕 Disabled'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={handleToggleTaskNotification}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${
                                      taskNotificationEmail ? 'bg-blue-600' : 'bg-gray-600'
                                    }`}
                                  >
                                    <div className={`absolute top-[2px] bg-white rounded-full h-4 w-4 transition-transform ${
                                      taskNotificationEmail ? 'translate-x-[20px]' : 'translate-x-[2px]'
                                    }`}></div>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 右侧 - 积分和功能区域 */}
                            <div className="w-64 p-5 space-y-4">
                              {/* 积分显示 */}
                              <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/30 to-blue-500/30 flex items-center justify-center mx-auto mb-3 border-2 border-purple-500/20">
                                  <span className="text-2xl">💎</span>
                                </div>
                                <div className="text-3xl font-bold text-white mb-1">
                                  {userCreditsLoading ? (
                                    <Spin size="small" />
                                  ) : (
                                    `${(userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage) * 10}`
                                  )}
                                </div>
                                <p className="text-gray-300 text-sm">Available Credits</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Total: {userCredits.pageGeneratorLimit * 10}
                                </p>
                                {/* 新增：显示可生成页面数 */}
                                <p className="text-cyan-400 text-xs mt-2 font-medium">
                                  ≈ {Math.floor((userCredits.pageGeneratorLimit - userCredits.pageGeneratorUsage))} pages left
                                </p>
                              </div>

                              {/* 使用提示 */}
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="flex items-start">
                                  <svg className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-blue-300 text-xs leading-relaxed">
                                    Each generation costs <span className="font-semibold text-white">10 credits</span>
                                  </p>
                                </div>
                              </div>

                              {/* 快速操作按钮 */}
                              <div className="space-y-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = "/#pricing";
                                    setShowCreditsTooltip(false);
                                  }}
                                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-purple-500/25"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Get Credits
                                </button>
                              </div>
                            </div>
                          </div>
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