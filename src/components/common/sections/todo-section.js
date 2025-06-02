import React, { useState, useEffect } from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, RocketOutlined, GlobalOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import apiClient from '../../../lib/api/index.js';
import PublishSettingsModal from './publish-setting-modal';

const TodoSection = ({ isInHeader = false, onOpenPublishModal, onOpenResultPreview }) => {
  const [isExpanded, setIsExpanded] = useState(!isInHeader); // 在header中默认收起
  const [loading, setLoading] = useState(true);
  const [isPublishSettingsModalVisible, setIsPublishSettingsModalVisible] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);

  // 添加调试用的 useEffect 来监听状态变化
  useEffect(() => {
    console.log('Modal visibility changed:', isPublishSettingsModalVisible);
    // 添加堆栈跟踪来查看是什么触发了状态变化
    console.trace('Modal state change trace');
  }, [isPublishSettingsModalVisible]);

  const [todoItems, setTodoItems] = useState([
    {
      id: 'task',
      title: 'Create Your First Page',
      description: 'Generate alternative pages for your website',
      completed: false,
      icon: <RocketOutlined />,
      action: () => window.location.href = '/'
    },
    {
      id: 'domain',
      title: 'Bind Your Domain',
      description: 'Connect your custom domain for publishing',
      completed: false,
      icon: <GlobalOutlined />,
      action: (e) => {
        console.log('Domain action clicked');
        // 阻止事件冒泡，防止其他点击处理器干扰
        e?.stopPropagation();
        e?.preventDefault();
        
        console.log('Before setState:', isPublishSettingsModalVisible);
        setIsPublishSettingsModalVisible(true);
        console.log('After setState call');
      }
    },
    {
      id: 'publish',
      title: 'Publish Your Pages',
      description: 'Go live with subdomain or subfolder',
      completed: false,
      icon: <DeploymentUnitOutlined />,
      action: () => {
        console.log('Publish action clicked');
        if (onOpenResultPreview) {
          onOpenResultPreview();
        }
      }
    }
  ]);

  // 检查任务状态
  const checkTaskStatus = async () => {
    try {
      const historyResponse = await apiClient.getAlternativeWebsiteList();
      const historyList = historyResponse?.data || [];
      
      // 检查是否有processing或finished的任务
      const hasValidTask = historyList.some(item => 
        item.generatorStatus === 'processing' || item.generatorStatus === 'finished'
      );

      return hasValidTask;
    } catch (error) {
      console.error('Failed to check task status:', error);
      return false;
    }
  };

  // 检查域名绑定状态
  const checkDomainStatus = async () => {
    try {
      // 获取 customerId
      const customerId = localStorage.getItem('alternativelyCustomerId');
      if (!customerId) {
        console.log('[checkDomainStatus] No customerId found');
        return false;
      }

      // 修改：使用与 publish-setting-modal 相同的 API
      const domainRes = await apiClient.getDomain(customerId);
      
      // 修改：使用与 ResultPreview 相同的判断逻辑
      if (domainRes?.code === 200 && domainRes.data && domainRes.data.verifiedStatus === 'SUCCESS' && domainRes.data.domainName) {
        console.log('[checkDomainStatus] Root domain verified:', domainRes.data.domainName);
        return true;
      } else {
        console.log('[checkDomainStatus] No verified root domain found. Response:', domainRes);
        return false;
      }
    } catch (error) {
      console.error('Failed to check domain status:', error);
      return false;
    }
  };

  // 检查发布状态
  const checkPublishStatus = async () => {
    try {
      const historyResponse = await apiClient.getAlternativeWebsiteList();
      const historyList = historyResponse?.data || [];
      
      // 检查所有任务的页面是否有已发布的
      for (const task of historyList) {
        if (task.generatorStatus === 'finished') {
          try {
            const resultResponse = await apiClient.getAlternativeWebsiteResultList(task.websiteId);
            const pages = resultResponse?.data || [];
            
            // 修改：更精确的发布状态判断
            const hasPublishedPage = pages.some(page => {
              // 检查是否有 siteUrl，这表示页面已经发布
              const hasPublishedUrl = page.siteUrl && page.siteUrl.trim() !== '';
              // 或者检查 deploymentStatus
              const isDeploymentPublished = page.deploymentStatus === 'published';
              
              console.log(`[checkPublishStatus] Page ${page.resultId}:`, {
                siteUrl: page.siteUrl,
                deploymentStatus: page.deploymentStatus,
                hasPublishedUrl,
                isDeploymentPublished
              });
              
              return hasPublishedUrl || isDeploymentPublished;
            });
            
            if (hasPublishedPage) {
              console.log(`[checkPublishStatus] Found published page in task ${task.websiteId}`);
              return true;
            }
          } catch (error) {
            console.error(`Failed to check publish status for task ${task.websiteId}:`, error);
          }
        }
      }
      
      console.log('[checkPublishStatus] No published pages found');
      return false;
    } catch (error) {
      console.error('Failed to check publish status:', error);
      return false;
    }
  };

  // 初始化检查所有状态
  const initializeStatus = async () => {
    setLoading(true);
    
    try {
      const [taskCompleted, domainCompleted, publishCompleted] = await Promise.all([
        checkTaskStatus(),
        checkDomainStatus(),
        checkPublishStatus()
      ]);

      setTodoItems(prev => prev.map(item => {
        switch (item.id) {
          case 'task':
            return { ...item, completed: taskCompleted };
          case 'domain':
            return { ...item, completed: domainCompleted };
          case 'publish':
            return { 
              ...item, 
              completed: publishCompleted,
              description: publishCompleted 
                ? 'Your pages are live!' 
                : 'Go Publish Your Pages With Subdomain or Subfolder Now!'
            };
          default:
            return item;
        }
      }));
    } catch (error) {
      console.error('Failed to initialize todo status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    if (isLoggedIn) {
      const customerId = localStorage.getItem('alternativelyCustomerId');
      console.log('Current customerId:', customerId);
      setCurrentCustomerId(customerId);
      initializeStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const completedCount = todoItems.filter(item => item.completed).length;
  const totalCount = todoItems.length;
  const allCompleted = completedCount === totalCount;

  // 检查是否已登录
  const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
  
  if (!isLoggedIn) {
    return null;
  }

  // 在组件渲染时输出当前状态
  console.log('Current render state:', {
    isPublishSettingsModalVisible,
    isExpanded,
    loading
  });

  // 添加一个简单的测试渲染
  console.log('About to check modal render condition:', isPublishSettingsModalVisible);

  // 在header中的渲染方式
  if (isInHeader) {
    return (
      <div className="relative">
        {/* 折叠状态的按钮 - 在header中显示 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg
            hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105
            flex items-center gap-1 sm:gap-2 font-medium text-xs border border-purple-500/30
            ${!allCompleted ? 'animate-pulse' : ''}
          `}
        >
          <span className="text-xs sm:text-sm">📋</span>
          <span className={`hidden sm:inline ${!allCompleted ? 'animate-pulse' : ''}`}>TODO List</span>
          <div className="bg-white/20 rounded-full px-1 sm:px-1.5 py-0.5 text-xs">
            {completedCount}/{totalCount}
          </div>
        </button>

        {/* 展开状态的面板 - 绝对定位浮层 */}
        {isExpanded && (
          <div className="absolute top-full right-0 sm:left-0 mt-2 z-50 bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl overflow-hidden w-80 max-w-[calc(100vw-2rem)]">
            {/* 头部 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-pulse"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm sm:text-lg">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base sm:text-lg">Quick Start</h3>
                    <p className="text-purple-100 text-xs">Get your pages live in 3 steps</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 touch-manipulation"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 进度条 */}
            <div className="px-3 sm:px-4 py-3 bg-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-300">Progress</span>
                <span className="text-xs sm:text-sm font-bold text-cyan-400">{completedCount}/{totalCount}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                ></div>
              </div>
              {allCompleted && (
                <div className="mt-2 text-center">
                  <span className="text-green-400 text-xs sm:text-sm font-medium">🎉 All done! You're ready to go!</span>
                </div>
              )}
            </div>

            {/* 任务列表 */}
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 bg-slate-900">
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Spin size="small" />
                  <span className="ml-2 text-slate-400 text-xs sm:text-sm">Checking status...</span>
                </div>
              ) : (
                todoItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`
                      group relative p-2 sm:p-3 rounded-xl border transition-all duration-300 cursor-pointer touch-manipulation
                      ${item.completed 
                        ? 'bg-green-800/40 border-green-500/50 hover:bg-green-800/60' 
                        : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-purple-500/70'
                      }
                    `}
                    onClick={item.action}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`
                        w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm sm:text-lg transition-all duration-300
                        ${item.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-slate-700 text-slate-400 group-hover:bg-purple-600 group-hover:text-white'
                        }
                      `}>
                        {item.completed ? <CheckCircleOutlined /> : item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`
                          font-medium text-xs sm:text-sm transition-colors
                          ${item.completed ? 'text-green-300' : 'text-white group-hover:text-purple-300'}
                        `}>
                          {item.title}
                        </h4>
                        <p className={`                          text-xs mt-1 transition-colors
                          ${item.completed ? 'text-green-400' : 'text-slate-300 group-hover:text-slate-200'}
                        `}>
                          {item.description}
                        </p>
                      </div>
                      {!item.completed && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* 步骤编号 */}
                    <div className={`
                      absolute -top-1 -left-1 sm:-top-2 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${item.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-purple-600 text-white'
                      }
                    `}>
                      {index + 1}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 底部 */}
            {!loading && !allCompleted && (
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-slate-900">
                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-purple-300 text-xs font-medium">
                    💡 Complete all steps to unlock the full potential of AltPage.ai
                  </p>
                </div>
              </div>
            )}

            {/* 使用真正的 PublishSettingsModal */}
            {isPublishSettingsModalVisible && (
              <>
                {console.log('Rendering PublishSettingsModal in header mode')}
                <PublishSettingsModal
                  open={isPublishSettingsModalVisible}
                  onClose={() => {
                    console.log('Closing PublishSettingsModal from header');
                    setIsPublishSettingsModalVisible(false);
                  }}
                  apiClient={apiClient}
                  messageApi={{ 
                    success: (msg) => console.log('Success:', msg), 
                    error: (msg) => console.log('Error:', msg), 
                    warning: (msg) => console.log('Warning:', msg) 
                  }}
                  currentItem={null}
                  currentCustomerId={currentCustomerId || localStorage.getItem('alternativelyCustomerId')}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // 原来的固定定位渲染方式（用于非header场景）
  return (
    <div className="fixed top-20 right-4 z-50">
      {/* 折叠状态的按钮 */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`
            bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg
            hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105
            flex items-center gap-2 font-medium text-sm
            ${!allCompleted ? 'animate-pulse' : ''}
          `}
        >
          <span className="animate-bounce">📋</span>
          <span className={!allCompleted ? 'animate-pulse' : ''}>TODO!</span>
          <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
            {completedCount}/{totalCount}
          </div>
        </button>
      )}

      {/* 展开状态的面板 */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden w-80">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 animate-pulse"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Quick Start</h3>
                  <p className="text-purple-100 text-xs">Get your pages live in 3 steps</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="px-4 py-3 bg-slate-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Progress</span>
              <span className="text-sm font-bold text-cyan-400">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              ></div>
            </div>
            {allCompleted && (
              <div className="mt-2 text-center">
                <span className="text-green-400 text-sm font-medium">🎉 All done! You're ready to go!</span>
              </div>
            )}
          </div>

          {/* 任务列表 */}
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spin size="small" />
                <span className="ml-2 text-slate-400 text-sm">Checking status...</span>
              </div>
            ) : (
              todoItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`
                    group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer
                    ${item.completed 
                      ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30' 
                      : 'bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-purple-500/50'
                    }
                  `}
                  onClick={item.action}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300
                      ${item.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-700 text-slate-400 group-hover:bg-purple-600 group-hover:text-white'
                      }
                    `}>
                      {item.completed ? <CheckCircleOutlined /> : item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`
                        font-medium text-sm transition-colors
                        ${item.completed ? 'text-green-300' : 'text-white group-hover:text-purple-300'}
                      `}>
                        {item.title}
                      </h4>
                      <p className={`
                        text-xs mt-1 transition-colors
                        ${item.completed ? 'text-green-400/80' : 'text-slate-400 group-hover:text-slate-300'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                    {!item.completed && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* 步骤编号 */}
                  <div className={`
                    absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${item.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-purple-600 text-white'
                    }
                  `}>
                    {index + 1}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 底部 */}
          {!loading && !allCompleted && (
            <div className="px-4 pb-4">
              <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <p className="text-purple-300 text-xs font-medium">
                  💡 Complete all steps to unlock the full potential of AltPage.ai
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 使用真正的 PublishSettingsModal */}
      {isPublishSettingsModalVisible && (
        <>
          <PublishSettingsModal
            open={isPublishSettingsModalVisible}
            onClose={() => {
              setIsPublishSettingsModalVisible(false);
            }}
            apiClient={apiClient}
            messageApi={{ 
              success: (msg) => console.log('Success:', msg), 
              error: (msg) => console.log('Error:', msg), 
              warning: (msg) => console.log('Warning:', msg) 
            }}
            currentCustomerId={currentCustomerId || localStorage.getItem('alternativelyCustomerId')}
          />
        </>
      )}
    </div>
  );
};

export default TodoSection;
