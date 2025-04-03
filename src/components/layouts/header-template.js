"use client";
import React, { useRef, useEffect, useCallback } from 'react';
import { useState } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiClient from '../../lib/api/index.js';
import { Dropdown, Modal, Button, Spin, Menu, Pagination } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useUser } from '../../contexts/UserContext';
import { useToolContext } from '../../contexts/ToolContext';
import DeviceManager from '../../utils/DeviceManager';

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
  
  // 添加登录弹窗状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(true); // true为登录表单，false为注册表单
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [resetForm, setResetForm] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  // 添加提示消息状态
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success', 'error', 'info'
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);

  // 添加历史记录相关状态
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);
  const [resultIds, setResultIds] = useState([]);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState(0);

  // 添加点击任务时的加载状态
  const [loadingResultIds, setLoadingResultIds] = useState(false);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);

  const { currentTool, setCurrentTool } = useToolContext();

  const [deviceInfo, setDeviceInfo] = useState(null);

  // Add pagination state
  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 添加一个 ref 来跟踪初始加载
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Check if user is logged in with alternatively prefix
    const loggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    const email = localStorage.getItem('alternativelyCustomerEmail');
    setIsLoggedIn(loggedIn);
    if (email) {
      setUserEmail(email);
    }
    
    // Clear timer
    return () => {
      if (cooldownTimer) {
        clearInterval(cooldownTimer);
      }
    };
  }, []);

  useEffect(() => {
    // 添加token过期事件监听
    const handleTokenExpired = () => {
      setIsLoggedIn(false);
      setUserEmail('');
      setShowLoginModal(true);
      setIsLoginForm(true);
      showNotification('Session expired. Please login again.', 'info');
    };

    window.addEventListener('tokenExpired', handleTokenExpired);

    // 清理事件监听
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // 使用 useCallback 包裹 fetchHistoryList
  const fetchHistoryList = useCallback(async (page = 1, pageSize = 10) => {
    if (!isLoggedIn) return;
    
    console.log(`Fetching history: page=${page}, pageSize=${pageSize}`);
    setLoadingHistory(true);
    
    try {
      const response = await apiClient.getAlternativeWebsiteList(page, pageSize);
      console.log('History response:', response);
      
      if (response?.code === 200 && response.data) {
        const formattedHistory = response.data.map(item => ({
          websiteId: item.websiteId,
          domain: item.website || 'Unknown website',
          createdAt: item.generatedStart || new Date().toISOString(),
          status: item.generatorStatus || 'unknown',
        }));
        
        // Sort by creation time in descending order
        formattedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryList(formattedHistory);
        
        // Update pagination information
        setHistoryPagination({
          current: page,
          pageSize: pageSize,
          total: response.totalCount || 0
        });
        
        console.log('Formatted history:', formattedHistory);
      } else {
        showNotification('Failed to load history', 'error');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      showNotification('Error loading history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [isLoggedIn]);

  // 修改 useEffect
  useEffect(() => {
    console.log('isLoggedIn changed:', isLoggedIn);
    if (isLoggedIn && !initialLoadRef.current) {
      console.log('Initial history load triggered');
      initialLoadRef.current = true;
      fetchHistoryList();
    }
  }, [isLoggedIn, fetchHistoryList]);

  // Handle pagination change
  const handleHistoryPageChange = (page, pageSize) => {
    fetchHistoryList(page, pageSize);
  };

  // 处理历史记录点击
  const handleHistoryItemClick = async (item) => {
    if (item.status === 'failed') {
      setNotification({
        show: true,
        message: 'Task failed, unable to view details.',
        type: 'error'
      });
      return false;
    }

    if (item.status === 'finished') {
      // Show loading state in dropdown
      setLoadingResultIds(true);

      if (item.websiteId) {
        setCurrentWebsiteId(item.websiteId);
        
        try {
          const historyResponse = await apiClient.getAlternativeWebsiteHistory(item.websiteId);
          
          if (historyResponse?.code === 200 && historyResponse.data) {
            const codesResultIds = historyResponse.data
              .filter(record => record.type === 'Codes' && record.content?.resultId)
              .map(record => record.content.resultId);
            
            if (codesResultIds.length > 0) {
              setResultIds(codesResultIds);
              if (codesResultIds[0]) {
                setSelectedPreviewUrl(`https://preview.websitelm.site/en/${codesResultIds[0]}`);
                setActivePreviewTab(0);
              }
              setTimeout(() => {
                setShowResultIdsModal(true);
              }, 0);
            } else {
              setNotification({
                show: true,
                message: 'No preview data available for this task.',
                type: 'info'
              });
            }
          }
        } catch (error) {
          setNotification({
            show: true,
            message: 'Failed to load preview data. Please try again.',
            type: 'error'
          });
        } finally {
          setLoadingResultIds(false);
        }
      }
      return;
    }

    if (item.status === 'processing') {
      try {
        const statusResponse = await apiClient.getAlternativeStatus(item.websiteId);

        if (statusResponse?.code === 200 && statusResponse.data) {
          const planningStatuses = statusResponse.data;
          const productComparisonStatus = planningStatuses.find(planning => planning.planningName === 'PRODUCT_COMPARISON');

          if (productComparisonStatus && productComparisonStatus.status !== 'init') {
            setNotification({
              show: true,
              message: 'Task is still in progress. Please wait.',
              type: 'info'
            });
            return;
          }

          if (productComparisonStatus && productComparisonStatus.status === 'init') {
            setCurrentTool('restore');
            localStorage.setItem('restoreWebsiteId', item.websiteId);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch task status:', error);
        setNotification({
          show: true,
          message: 'Failed to check task status. Please try again.',
          type: 'error'
        });
      }
    }
  };

  // 处理预览选择
  const handlePreviewSelect = (resultId, index) => {
    setIsPreviewLoading(true);
    setSelectedPreviewUrl(`https://preview.websitelm.site/en/${resultId}`);
    setActivePreviewTab(index);
  };

  useEffect(() => {
    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const customerId = urlParams.get('customerId');
    const email = urlParams.get('email');
    const onboarding = urlParams.get('onboarding') === 'true';
    const firstLogin = urlParams.get('firstLogin') === 'true';

    // 验证JWT token的格式
    const isValidJWT = accessToken?.split('.').length === 3;

    if (accessToken && isValidJWT && customerId && email) {
      try {
        // 清除现有存储
        localStorage.clear();
        
        // 存储新的登录信息
        const decodedEmail = decodeURIComponent(email);
        localStorage.setItem('alternativelyIsLoggedIn', 'true');
        localStorage.setItem('alternativelyAccessToken', accessToken);
        localStorage.setItem('alternativelyCustomerId', customerId);
        localStorage.setItem('alternativelyCustomerEmail', decodedEmail);
        
        setIsLoggedIn(true);
        setUserEmail(decodedEmail);
        showNotification('Login successful!', 'success');
        
        // 清除 URL 参数
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // 刷新页面以应用新的登录状态
        window.location.reload();
      } catch (error) {
        console.error('Login process failed:', error);
        showNotification('Authentication Failed', 'error');
        localStorage.clear();
      }
    }
  }, []);

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
    localStorage.removeItem('alternativelyAccessToken');
    localStorage.removeItem('alternativelyIsLoggedIn');
    localStorage.removeItem('alternativelyCustomerEmail');
    localStorage.removeItem('alternativelyCustomerId');
    setIsLoggedIn(false);
    setUserEmail('');
    showNotification('Logged out successfully', 'info');
  };
  
  // 处理登录表单输入变化
  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };
  
  // 处理注册表单输入变化
  const handleRegisterInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };
  
  // 显示通知的辅助函数
  const showNotification = (message, type = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto close notification after 3 seconds
    const timer = setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 3000);

    // 返回 timer 以便在需要时清除
    return timer;
  };

  // 处理关闭通知
  const handleCloseNotification = () => {
    setNotification(prev => ({...prev, show: false}));
  };

  // History menu
  const historyMenu = {
    items: [
      // Loading state
      loadingResultIds && {
        key: 'loading',
        label: (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2">
              <Spin size="small" />
              <span className="text-gray-400">Loading preview data...</span>
            </div>
          </div>
        ),
      },
      // History items (only show when not loading)
      !loadingResultIds && {
        key: 'history-header',
        label: (
          <div className="flex items-center justify-between py-2 px-3">
            <span className="text-sm font-medium text-gray-300">Recent Tasks</span>
          </div>
        ),
      },
      // All history items
      ...historyList.map(item => ({
        key: item.websiteId,
        label: (
          <div className="flex items-center justify-between py-2 px-3 hover:bg-slate-700/50 rounded-md transition-colors">
            <div className="flex items-center max-w-[180px]">
              <div className="flex-shrink-0 mr-2.5">
                {item.status === 'finished' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                ) : item.status === 'failed' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Failed
                  </span>
                ) : item.status === 'processing' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {item.status || 'Unknown'}
                  </span>
                )}
              </div>
              <span className="truncate text-sm text-gray-200">{item.domain}</span>
            </div>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        ),
        onClick: () => handleHistoryItemClick(item),
      })),
      // Add pagination component
      {
        key: 'history-pagination',
        label: (
          <div className="py-2 px-3 border-t border-slate-700/50 mt-2">
            {historyPagination.total > 0 && (
              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                <Pagination 
                  size="small"
                  current={historyPagination.current}
                  pageSize={historyPagination.pageSize}
                  total={historyPagination.total}
                  onChange={(page, pageSize) => {
                    // Stop event propagation to prevent dropdown from closing
                    fetchHistoryList(page, pageSize);
                  }}
                  showSizeChanger={false}
                  className="history-pagination"
                />
              </div>
            )}
          </div>
        ),
      }
    ].filter(Boolean), // Remove null/undefined items
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    if (!registerForm.email) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    
    try {
      setLoading(true);
      // Call API to send verification code
      await apiClient.sendEmailCode(registerForm.email, 'register');
      
      // Set cooldown timer
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setCooldownTimer(timer);
      
      showNotification('Verification code sent to your email', 'success');
    } catch (error) {
      console.error('Failed to send verification code:', error);
      showNotification('Failed to send verification code', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理登录提交
  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await apiClient.login(loginForm.email, loginForm.password);
      
      // Check if response contains error code despite 200 status
      if (response && response.code === 1047) {
        showNotification('Password is incorrect. Please try again.', 'error');
        return;
      }
      
      if (response && response.accessToken) {
        // Store user data in localStorage with alternatively prefix
        localStorage.setItem('alternativelyAccessToken', response.accessToken);
        localStorage.setItem('alternativelyIsLoggedIn', 'true');
        localStorage.setItem('alternativelyCustomerEmail', response.data.email);
        localStorage.setItem('alternativelyCustomerId', response.data.customerId);
        
        // Update state
        setIsLoggedIn(true);
        setUserEmail(response.data.email);
        
        // Close login modal
        setShowLoginModal(false);
        
        showNotification('Login successful!', 'success');

        // 添加页面刷新
        window.location.reload();
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Handle error response
      if (error.response && error.response.data) {
        const { code, message } = error.response.data;
        if (code === 1047) {
          showNotification('Password is incorrect. Please try again.', 'error');
        } else {
          showNotification(message || 'Login failed. Please check your credentials.', 'error');
        }
      } else {
        showNotification('Login failed. Please check your credentials.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 处理注册提交
  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      showNotification('Password does not match', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.register({
        email: registerForm.email,
        password: registerForm.password,
        code: registerForm.code
      });
      
      // 检查响应中是否包含错误码，即使状态码是 200
      if (response && response.code) {
        showNotification(response.message || 'Registration failed. Please try again.', 'error');
        return;
      }
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        setShowLoginModal(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Registration failed:", error);
      if (error.response && error.response.data) {
        showNotification(error.response.data.message || 'Registration failed. Please try again.', 'error');
      } else {
        showNotification('Registration failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.resetPassword({
        email: resetForm.email,
        code: resetForm.code,
        newPassword: resetForm.newPassword,
        confirmPassword: resetForm.confirmPassword
      });
      
      // 处理密码不匹配的错误
      if (response && response.code === 1041) {
        showNotification(response.message || 'Passwords do not match. Please re-enter your password.', 'error');
        return;
      }
      
      showNotification('Password reset successful. Please login with your new password.', 'success');
      setIsForgotPassword(false);
      setIsLoginForm(true);
    } catch (error) {
      console.error("Password reset failed:", error);
      if (error.response && error.response.data && error.response.data.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Password reset failed. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Send verification code
  const sendCode = async (type) => {
    const email = type === 'reset' ? resetForm.email : registerForm.email;
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }
    
    try {
      const response = await apiClient.sendEmailCode(email, type === 'reset' ? 'forgot_password' : 'register');
      
      // 专门处理邮箱已存在的情况
      if (response && response.code === 1001) {
        showNotification('Email already exists. Please use a different email address.', 'error');
        return;
      }
      
      // Start cooldown
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      showNotification('Verification code sent to your email', 'success');
    } catch (error) {
      console.error("Failed to send verification code:", error);
      if (error.response && error.response.data && error.response.data.message) {
        showNotification(error.response.data.message, 'error');
      } else {
        showNotification('Failed to send verification code. Please try again.', 'error');
      }
    }
  };
  
  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
    setIsForgotPassword(false);
  };
  
  // Show forgot password form
  const showForgotPassword = () => {
    setIsForgotPassword(true);
    setIsLoginForm(false);
  };
  
  // Back to login form
  const backToLogin = () => {
    setIsForgotPassword(false);
    setIsLoginForm(true);
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

  const renderMenuItem = (item) => {
    if (!item?.label) return null;

    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const menuItemStyles = {
      color: item.color || 'text-gray-600',
      fontWeight: item.fontWeight || 'normal'
    };
    
    return (
      <div 
        key={item.key || item.label}
        className="relative group"
      >
        {hasChildren ? (
          <a
            href={item.link || '#'}
            style={menuItemStyles}
            className="text-[15px] hover:text-[#1890ff] transition-all duration-300 flex items-center gap-1"
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.label}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        ) : (
          <a
            href={item.link}
            onClick={item.onClick}
            style={menuItemStyles}
            className="text-[15px] hover:text-[#1890ff] transition-all duration-300 cursor-pointer"
          >
            {item.label}
          </a>
        )}
      </div>
    );
  };

  // 检查免费额度
  const checkFreeCredits = async (deviceId) => {
    try {
      const response = await apiClient.checkFreeCredits(deviceId);
      if (response?.code === 200 && response.data?.freeCredits) {
        showNotification(`您有 ${response.data.freeCredits} 次免费使用机会`, 'info');
      }
    } catch (error) {
      console.error('Error checking free credits:', error);
    }
  };

  // 初始化设备信息
  useEffect(() => {
    if (!isLoggedIn) {
      const info = DeviceManager.getDeviceInfo();
      if (info) {
        setDeviceInfo(info);
        checkFreeCredits(info.deviceId);
      }
    }
  }, [isLoggedIn]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-950 to-black border-b border-slate-800/50">
        {/* 科技感背景装饰 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#22d3ee10_0%,_transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[url('/circuit-grid.svg')] opacity-[0.03]"></div>
        
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
                          <span className="font-medium text-purple-300">Generation Credits</span>
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
                      </div>
                    )}
                  </div>

                  {/* 历史记录按钮 */}
                  <Dropdown 
                    menu={historyMenu}
                    trigger={['click']} 
                    placement="bottomRight"
                    overlayClassName="history-dropdown"
                    onOpenChange={(open) => {
                      if (!open && loadingResultIds) {
                        return false; // 如果正在加载，阻止 Dropdown 关闭
                      }
                      return true; // 否则允许 Dropdown 关闭
                    }}
                    open={loadingResultIds ? true : undefined} // 如果正在加载，保持 Dropdown 打开
                  >
                    <button className="px-4 py-2.5 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 rounded-full backdrop-blur-sm transition-all flex items-center gap-2 border shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-300">
                      <HistoryOutlined style={{ fontSize: '16px' }} />
                      <span className="font-medium">History</span>
                    </button>
                  </Dropdown>

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

      {/* 登录/注册弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm modal-overlay">
          <div className="w-full max-w-md p-8 mx-auto bg-gray-900 rounded-xl shadow-2xl modal-content border border-indigo-500/30 text-white">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                {isForgotPassword ? 'Reset Password' : (isLoginForm ? 'Sign In' : 'Create Account')}
              </h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Login Form */}
            {isLoginForm && !isForgotPassword && (
              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    onClick={showForgotPassword}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Sign In'}
                </button>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={toggleForm}
                      className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Register now
                    </button>
                  </p>
                </div>
              </form>
            )}
            
            {/* Register Form */}
            {!isLoginForm && !isForgotPassword && (
              <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                  <div className="flex">
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                      placeholder="Enter your email"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => sendCode('register')}
                      disabled={cooldown > 0}
                      className="px-4 py-2 text-white bg-indigo-600 border border-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      {cooldown > 0 ? `${cooldown}s` : 'Send'}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Verification Code</label>
                  <input
                    type="text"
                    value={registerForm.code}
                    onChange={(e) => setRegisterForm({...registerForm, code: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Enter verification code"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Register'}
                </button>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={toggleForm}
                      className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
            
            {/* Forgot Password Form */}
            {isForgotPassword && (
              <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
                  <div className="flex">
                    <input
                      type="email"
                      value={resetForm.email}
                      onChange={(e) => setResetForm({...resetForm, email: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                      placeholder="Enter your email"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => sendCode('reset')}
                      disabled={cooldown > 0}
                      className="px-4 py-2 text-white bg-indigo-600 border border-indigo-600 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                      {cooldown > 0 ? `${cooldown}s` : 'Send'}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Verification Code</label>
                  <input
                    type="text"
                    value={resetForm.code}
                    onChange={(e) => setResetForm({...resetForm, code: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    placeholder="Enter verification code"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({...resetForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                      placeholder="Create a new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({...prev, newPassword: !prev.newPassword}))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.newPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({...resetForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white pr-10"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({...prev, confirmPassword: !prev.confirmPassword}))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                    >
                      {showPasswords.confirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : 'Reset Password'}
                </button>
                
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
            
            {/* 装饰性元素 - 添加科幻感 */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-500 opacity-70"></div>
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-500 opacity-70"></div>
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-purple-500 opacity-70"></div>
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-purple-500 opacity-70"></div>
            
            {/* 背景光效 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* 结果弹窗 - 更新尺寸 */}
      <Modal
        title={
          <div className="flex items-center text-white">
            <span className="text-lg font-medium">Preview Your Alternative Pages</span>
          </div>
        }
        open={showResultIdsModal}
        onCancel={() => {
          setShowResultIdsModal(false);
          console.log('弹窗关闭，showResultIdsModal 状态:', false);
        }}
        footer={null}
        width={1200}
        className="result-ids-modal"
        zIndex={1500}
        styles={{
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }
        }}
      >
        <div className="flex h-[700px]">
          {/* 左侧选项卡 */}
          <div className="w-1/5 border-r border-slate-700/50 pr-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-gray-300 text-sm font-medium mb-3">Available Previews</h3>
            <div className="space-y-2">
              {resultIds.map((id, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    activePreviewTab === index 
                      ? 'bg-blue-500/20 border border-blue-500/50' 
                      : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'
                  }`}
                  onClick={() => handlePreviewSelect(id, index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activePreviewTab === index ? 'bg-blue-400' : 'bg-gray-500'}`}></div>
                      <span className="text-gray-200 font-medium">Preview Version #{index + 1}</span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://preview.websitelm.site/en/${id}`, '_blank');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-400">
                    Result ID: {id.substring(0, 8)}...{id.substring(id.length - 4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 右侧预览区域 */}
          <div className="w-4/5 pl-4 relative">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-gray-300 text-sm font-medium">Live Preview</h3>
              <div className="flex items-center gap-2">
                <a 
                  href={selectedPreviewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Open in New Window
                </a>
                <a 
                  href={`http://app.websitelm.com/alternatively-edit/${resultIds[activePreviewTab]}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </a>
              </div>
            </div>
            
            {/* 预览框架 */}
            <div className="relative h-[620px] bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
              {isPreviewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                  <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-3 text-gray-300">Loading preview...</p>
                  </div>
                </div>
              )}
              
              {selectedPreviewUrl && (
                <iframe 
                  src={selectedPreviewUrl}
                  className="w-full h-full border-0"
                  onLoad={() => setIsPreviewLoading(false)}
                  title="Website Preview"
                />
              )}
              
              {!selectedPreviewUrl && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400">Please select a preview version</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

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
        
        /* 添加历史记录下拉菜单的样式 */
        .ant-dropdown .ant-dropdown-menu {
          max-height: 400px;
          overflow-y: auto;
          background-color: rgb(15, 23, 42);
          border: 1px solid rgba(100, 116, 139, 0.2);
          backdrop-filter: blur(12px);
          padding: 8px;
        }
        
        .ant-dropdown .ant-dropdown-menu::-webkit-scrollbar {
          width: 6px;
        }
        
        .ant-dropdown .ant-dropdown-menu::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
        }
        
        .ant-dropdown .ant-dropdown-menu::-webkit-scrollbar-thumb {
          background-color: rgba(100, 116, 139, 0.5);
          border-radius: 20px;
        }
        
        .ant-dropdown .ant-dropdown-menu::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 116, 139, 0.7);
        }
      `}</style>
    </>
  );
}