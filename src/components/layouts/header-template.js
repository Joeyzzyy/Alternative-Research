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
  
  /* 改进历史记录下拉菜单样式 */
  .history-dropdown .ant-dropdown-menu {
    background: rgba(15, 23, 42, 0.95) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(99, 102, 241, 0.3) !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
  }
  
  .history-dropdown .ant-dropdown-menu-item {
    color: rgba(255, 255, 255, 0.9) !important;
  }
  
  .history-dropdown .ant-dropdown-menu-item:hover {
    background: rgba(99, 102, 241, 0.2) !important;
  }
  
  /* 改进分页器样式 */
  .history-pagination .ant-pagination-item {
    background: rgba(30, 41, 59, 0.8) !important;
    border-color: rgba(99, 102, 241, 0.3) !important;
  }
  
  .history-pagination .ant-pagination-item a {
    color: rgba(255, 255, 255, 0.8) !important;
  }
  
  .history-pagination .ant-pagination-item-active {
    background: rgba(99, 102, 241, 0.5) !important;
    border-color: rgba(99, 102, 241, 0.8) !important;
  }
  
  .history-pagination .ant-pagination-item-active a {
    color: white !important;
  }
  
  .history-pagination .ant-pagination-prev button,
  .history-pagination .ant-pagination-next button {
    color: rgba(255, 255, 255, 0.8) !important;
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
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);
  const [resultIds, setResultIds] = useState([]);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState(0);
  const [loadingResultIds, setLoadingResultIds] = useState(false);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const { currentTool, setCurrentTool } = useToolContext();
  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const initialLoadRef = useRef(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [googleOneTapInitialized, setGoogleOneTapInitialized] = useState(false);
  const tokenExpiredHandledRef = useRef(false);

  // 添加 Google One Tap 初始化函数
  const initializeGoogleOneTap = useCallback(() => {
    if (googleOneTapInitialized || isLoggedIn) return;
    
    // 确保 Google 脚本已加载
    if (typeof window !== 'undefined' && window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: '491914743416-1o5v2lv5582cvc7lrrmslg5g5b4kr6c1.apps.googleusercontent.com', 
          callback: handleGoogleOneTapResponse,
          auto_select: true,
          cancel_on_tap_outside: true,
        });
        
        // 显示 One Tap UI
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed or skipped:', notification.getNotDisplayedReason() || notification.getSkippedReason());
          }
        });
        
        setGoogleOneTapInitialized(true);
      } catch (error) {
        console.error('Google One Tap initialization failed:', error);
      }
    }
  }, [googleOneTapInitialized, isLoggedIn]);

  // 处理 Google One Tap 响应
  const handleGoogleOneTapResponse = async (response) => {
    try {
      setLoading(true);
      showNotification('Verifying Google login...', 'info');
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
        
        // 刷新页面应用新的登录状态
        window.location.reload();
      }
    } catch (error) {
      console.error("Google One Tap login failed:", error);
      showNotification('Google login failed, please try again later', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 加载 Google One Tap 脚本
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoggedIn && !googleOneTapInitialized) {
      // 检查脚本是否已加载
      if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleOneTap;
        document.body.appendChild(script);
      } else {
        initializeGoogleOneTap();
      }
    }
  }, [isLoggedIn, initializeGoogleOneTap, googleOneTapInitialized]);

  // 当用户登出时重置 One Tap 状态
  useEffect(() => {
    if (!isLoggedIn && googleOneTapInitialized) {
      setGoogleOneTapInitialized(false);
    }
  }, [isLoggedIn]);

  // 使用 useCallback 包裹 fetchHistoryList
  const fetchHistoryList = useCallback(async (page = 1, pageSize = 10) => {
    if (!isLoggedIn) return;
    
    console.log(`Fetching history: page=${page}, pageSize=${pageSize}`);
    setLoadingHistory(true);
    
    try {
      const response = await apiClient.getAlternativeWebsiteList(page, pageSize);
      console.log('History response:', response);
      
      if (response?.code === 200) {
        const historyData = response.data || [];
        const formattedHistory = historyData.map(item => ({
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
        // 只有当 code 不是 200 时才显示错误
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
            // 存储新的 websiteId
            localStorage.setItem('restoreWebsiteId', item.websiteId);
            
            // 如果当前工具已经是 restore，则触发一个自定义事件通知恢复窗口切换
            if (currentTool === 'restore') {
              const switchEvent = new CustomEvent('switchRestoreWindow', { 
                detail: { websiteId: item.websiteId } 
              });
              window.dispatchEvent(switchEvent);
              
              showNotification('Switching to selected chat window...', 'info');
            } else {
              // 如果当前不在恢复窗口，则切换到恢复工具
              setCurrentTool('restore');
            }
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
        
        // Refresh page to apply new login status
        window.location.reload();
      } catch (error) {
        console.error('Login process failed:', error);
        showNotification('Authentication failed', 'error');
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
    // 显示自定义确认对话框
    setShowLogoutConfirm(true);
  };
  
  // 显示通知的辅助函数
  const showNotification = (message, type = 'info') => {
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
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Loading Preview Data</p>
              <p className="text-xs text-gray-400 mt-1">Please wait while we prepare your preview...</p>
            </div>
          </div>
        ),
        disabled: true,
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
      // 如果历史记录为空，显示"No data available"
      !loadingResultIds && historyList.length === 0 && {
        key: 'no-data',
        label: (
          <div className="flex items-center justify-center py-6 space-y-3" style={{ minWidth: '280px', minHeight: '150px', padding: '0 20px' }}>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-12 h-12 text-blue-400/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-base font-medium text-white mb-2">No task history yet</p>
              <p className="text-sm text-blue-300">Your completed tasks will appear here</p>
              <p className="text-xs text-gray-400 mt-3 max-w-xs">Generate your first alternative page to see results</p>
            </div>
          </div>
        ),
        disabled: true,
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
              {/* 如果是 processing 状态，并且第三个 planning 是 init，显示 Restore Chat Window 按钮 */}
              {item.status === 'processing' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // 阻止事件冒泡，避免触发父级点击事件
                    try {
                      const statusResponse = await apiClient.getAlternativeStatus(item.websiteId);
                      if (statusResponse?.code === 200 && statusResponse.data) {
                        const planningStatuses = statusResponse.data;
                        if (planningStatuses[2] && planningStatuses[2].status === 'init') {
                          setCurrentTool('restore');
                          localStorage.setItem('restoreWebsiteId', item.websiteId);
                        } else {
                          // 如果不是 init 状态，显示提示
                          setNotification({
                            show: true,
                            message: 'Page Generation is in progress, window can not be restored. Please wait.',
                            type: 'info'
                          });
                        }
                      }
                    } catch (error) {
                      console.error('Failed to fetch task status:', error);
                      setNotification({
                        show: true,
                        message: 'Failed to restore chat window. Please try again.',
                        type: 'error'
                      });
                    }
                  }}
                  className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                >
                  Restore Chat Window
                </button>
              )}
            </div>
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

  // 在恢复窗口组件中
  useEffect(() => {
    const handleSwitchWindow = (event) => {
      const { websiteId } = event.detail;
      // 不直接调用 loadRestoreData，而是更新 localStorage
      localStorage.setItem('restoreWebsiteId', websiteId);
      
      // 可能需要触发一个页面刷新或其他机制来重新加载恢复窗口
      // 例如，可以触发一个新的自定义事件，让恢复窗口组件知道需要重新加载数据
      const reloadEvent = new CustomEvent('reloadRestoreWindow');
      window.dispatchEvent(reloadEvent);
      
      showNotification('Switching to selected chat window...', 'info');
    };

    window.addEventListener('switchRestoreWindow', handleSwitchWindow);
    
    return () => {
      window.removeEventListener('switchRestoreWindow', handleSwitchWindow);
    };
  }, []);

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
  };

  // 添加事件监听器来响应 research-tool 组件触发的登录弹窗请求
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
  }, []);

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
                        <p className="text-gray-400 text-xs">Note: Changing the overall color scheme or style of the page will also consume credits.</p>
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

      {/* Use encapsulated login/register modal component */}
      <LoginModal 
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        isLoginForm={isLoginForm}
        setIsLoginForm={setIsLoginForm}
        isForgotPassword={isForgotPassword}
        setIsForgotPassword={setIsForgotPassword}
        onLoginSuccess={handleLoginSuccess}
        showNotification={showNotification}
        handleGoogleLogin={handleGoogleLogin}
        loading={loading}
      />

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
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' },
          content: { 
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        <div className="flex h-[700px]">
          {/* 左侧选项卡 */}
          <div className="w-1/5 border-r border-slate-700/50 pr-4 overflow-y-auto custom-scrollbar">
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
                  href={`http://app.websitelm.com/alternatively-edit/${resultIds[activePreviewTab]}${
                    localStorage.getItem('alternativelyAccessToken') ? 
                    `?authKey=${localStorage.getItem('alternativelyAccessToken')}` : 
                    ''
                  }`}
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