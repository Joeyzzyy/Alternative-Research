'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';

// 添加任务状态常量
const TASK_STATUS = {
  PENDING: 'init',
  RUNNING: 'processing',
  COMPLETED: 'finished',
  FAILED: 'failed'
};

// 添加任务类型常量
const TASK_TYPES = {
  COMPETITOR_SEARCH: 'COMPETITOR_SEARCH',
  COMPETITOR_SCORING: 'COMPETITOR_SCORING',
  PRODUCT_COMPARISON: 'PRODUCT_COMPARISON'
};

// 添加轮询间隔常量
const POLLING_INTERVALS = {
  TASK_STATUS: 3000,    // 3秒
  TASK_DETAILS: 5000,   // 5秒
  SOURCES: 10000        // 10秒
};

// 任务管理器类
class TaskManager {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.tasks = new Map();
    this.activePolling = new Set();
    this.onTaskUpdate = null;
    this.onDetailsUpdate = null;
    this.onSourcesUpdate = null;
    this.onMessageUpdate = null;
    this.websiteId = null;
    this.hasInitialMessage = false;
    this.hasCompletionMessage = false;
    this.hasXavierCompletionMessage = false;  // 添加 Xavier 完成消息的标志
    this.hasFailureMessage = false;  // 添加失败消息标志
    this.lastProcessedState = null;  // 添加状态追踪
    this.hasXavierStartMessage = false;  // 新增
    this.hasYoussefStartMessage = false; // 新增
    this.pollingInterval = null;
    this.detailPollingInterval = null;
    this.lastDetailCount = 0;  // 用于追踪detail数量变化
    this.currentPage = 1;
    this.pageSize = 300;
    this.sourcesPollingInterval = null;  // 添加 sources 轮询间隔
    this.lastSourceCount = 0;  // 用于追踪 sources 数量变化
    this.onBrowserUpdate = null;
    this.onLoadingUpdate = null;
    this.onMessageSendingUpdate = null;
  }

  // 初始化新的研究任务流程
  async initializeResearch(websiteId, hasInitialMessage = false) {
    this.websiteId = websiteId;
    this.clearAllTasks();
    
    // 如果已经有初始消息，就不要再添加新消息
    this.hasInitialMessage = hasInitialMessage;
    
    // 开始轮询所有任务状态
    this.startPolling();
    this.startDetailPolling();
    this.startSourcePolling();  // 添加 sources 轮询
  }

  // 检查是否所有任务都完成
  areAllTasksCompleted(plannings) {
    return plannings.every(planning => planning.status === 'finished');
  }

  // 修改轮询方法以处理所有任务
  startPolling() {
    if (this.activePolling.has('ALL_TASKS')) return;

    const pollTaskStatus = async () => {
      try {
        const response = await this.apiClient.getAlternativeStatus(this.websiteId);
        const plannings = response?.data || [];

        const currentState = plannings.map(p => `${p.planningName}:${p.status}`).join('|');
        
        if (this.lastProcessedState === currentState) {
          return;
        }
        
        this.lastProcessedState = currentState;

        // 检查所有任务完成状态
        if (this.areAllTasksCompleted(plannings) && !this.hasCompletionMessage) {
          this.hasCompletionMessage = true;
          
          try {
            const resultResponse = await this.apiClient.getAlternativeResult(this.websiteId);
            const finalResult = resultResponse?.data;
            
            // 解析结果数组
            let competitors = [];
            if (finalResult) {
              try {
                competitors = Array.isArray(finalResult) ? finalResult : JSON.parse(finalResult);
              } catch (e) {
                console.error('Failed to parse result:', e);
                competitors = [];
              }
            }
            
            this.onMessageUpdate?.(prevMessages => {
              const updatedMessages = prevMessages.map(msg => ({
                ...msg,
                isThinking: false
              }));

              return [
                ...updatedMessages,
                {
                  type: 'agent',
                  agentId: 3, // Youssef
                  content: '🎉 Analysis complete! I\'ve prepared a comprehensive comparison of all products.',
                  isThinking: false
                },
                {
                  type: 'agent',
                  agentId: 1, // Joey
                  content: competitors.length > 0 
                    ? `✨ Great! I've found ${competitors.length} relevant alternatives for you. I've opened them in the browser panel for you to explore. Would you like to know more specific details about any of them?`
                    : '❌ I apologize, but I couldn\'t find any valid alternatives at this moment. Would you like to try with a different domain?',
                  isThinking: false
                }
              ];
            });

            // 如果有竞争对手，自动展开浏览器面板并更新标签
            if (competitors.length > 0) {
              // 通知外部组件更新浏览器状态
              if (this.onBrowserUpdate) {
                this.onBrowserUpdate({
                  show: true,
                  tabs: Array(competitors.length).fill(null).map((_, index) => ({
                    id: index + 1,
                    title: `Alternative ${index + 1}`,
                    url: 'https://websitelm.com', // 临时使用固定URL
                    active: index === 0
                  }))
                });
              }
            }
          } catch (error) {
            console.error('Failed to get final results:', error);
            this.onMessageUpdate?.(prevMessages => {
              const updatedMessages = prevMessages.map(msg => ({
                ...msg,
                isThinking: false
              }));
              return [
                ...updatedMessages,
                {
                  type: 'agent',
                  agentId: 1,
                  content: '❌ I apologize, but I encountered an error while retrieving the final results. Would you like to try again?',
                  isThinking: false
                }
              ];
            });
          }

          // 所有任务完成后立即清除轮询
          this.clearAllTasks();
          if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
          }
          return;
        }

        // 检查失败状态
        const failedTask = plannings.find(p => p.status === 'failed');
        if (failedTask && !this.hasFailureMessage) {
          this.hasFailureMessage = true;
          this.clearAllTasks();  // 这里会清除轮询
          
          const failureMessage = this.getFailureMessage(failedTask.planningName, failedTask.errorMsg);
          
          this.onMessageUpdate?.(prevMessages => {
            const updatedMessages = prevMessages.map(msg => ({
              ...msg,
              isThinking: false
            }));
            return [...updatedMessages, failureMessage];
          });
          
          // 立即清除轮询间隔
          if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
          }
          return;
        }

        // 检查第一阶段完成和第二阶段开始的状态
        const competitorSearch = plannings.find(p => p.planningName === TASK_TYPES.COMPETITOR_SEARCH);
        const competitorScoring = plannings.find(p => p.planningName === TASK_TYPES.COMPETITOR_SCORING);

        if (competitorSearch?.status === 'finished' && 
            competitorScoring?.status === 'processing' && 
            !this.hasXavierStartMessage) {  // 新增标志
          
          this.hasXavierStartMessage = true;  // 设置标志
          
          this.onMessageUpdate?.(prevMessages => {
            const updatedMessages = prevMessages.map(msg => ({
              ...msg,
              isThinking: false
            }));

            return [
              ...updatedMessages,
              {
                type: 'agent',
                agentId: 1, // Joey
                content: '✨ Great! I\'ve identified the main competitors. Now I\'ll hand this over to Xavier for detailed scoring analysis.',
                isThinking: false
              },
              {
                type: 'agent',
                agentId: 2, // Xavier
                content: '📊 I\'m analyzing each competitor\'s strengths and weaknesses, evaluating their features, pricing, and market positioning...',
                isThinking: true
              }
            ];
          });
        }

        // 检查第二阶段完成和第三阶段开始的状态
        const productComparison = plannings.find(p => p.planningName === TASK_TYPES.PRODUCT_COMPARISON);

        if (competitorScoring?.status === 'finished' && 
            productComparison?.status === 'processing' && 
            !this.hasYoussefStartMessage) {  // 新增标志
          
          this.hasYoussefStartMessage = true;  // 设置标志
          
          this.onMessageUpdate?.(prevMessages => {
            const updatedMessages = prevMessages.map(msg => ({
              ...msg,
              isThinking: false
            }));

            return [
              ...updatedMessages,
              {
                type: 'agent',
                agentId: 2, // Xavier
                content: '📈 Scoring analysis complete! I\'ve evaluated all competitors. Passing this to Youssef for the final comparison.',
                isThinking: false
              },
              {
                type: 'agent',
                agentId: 3, // Youssef
                content: '🔄 Now comparing all products to identify key differentiators and unique value propositions...',
                isThinking: true
              }
            ];
          });
        }

        // 更新任务状态
        plannings.forEach(planning => {
          const taskType = planning.planningName;
          const newStatus = this.mapApiStatus(planning.status);
          
          this.tasks.set(taskType, {
            id: planning.planningId,
            type: taskType,
            status: newStatus,
            result: null,
            details: [],
            sources: []
          });
        });

      } catch (error) {
        console.error('Error polling task status:', error);
        
        const currentTaskType = this.getCurrentTaskType(); // 需要实现这个方法来获取当前任务类型
        const activeAgentId = this.getActiveAgent(currentTaskType);
        
        this.onMessageUpdate?.(prevMessages => {
          const updatedMessages = prevMessages.map(msg => ({
            ...msg,
            isThinking: false
          }));
          return [...updatedMessages, {
            type: 'agent',
            agentId: activeAgentId,
            content: this.getRetryMessage(currentTaskType),
            isThinking: true // 设置为 true 表示正在重试
          }];
        });
        
        // 实现自动重试逻辑...
      }
    };

    // 存储轮询间隔的引用
    this.pollingInterval = setInterval(pollTaskStatus, POLLING_INTERVALS.TASK_STATUS);
    this.activePolling.add('ALL_TASKS');
    
    pollTaskStatus();
  }

  // 添加获取下一个任务的辅助方法
  getNextTask(currentTaskType, plannings) {
    const taskOrder = [
      TASK_TYPES.COMPETITOR_SEARCH,
      TASK_TYPES.COMPETITOR_SCORING,
      TASK_TYPES.PRODUCT_COMPARISON
    ];
    
    const currentIndex = taskOrder.indexOf(currentTaskType);
    if (currentIndex < taskOrder.length - 1) {
      const nextTaskType = taskOrder[currentIndex + 1];
      return plannings.find(p => p.planningName === nextTaskType);
    }
    return null;
  }

  // 添加 API 状态映射方法
  mapApiStatus(apiStatus) {
    switch (apiStatus) {
      case 'init':
        return TASK_STATUS.PENDING;
      case 'processing':
        return TASK_STATUS.RUNNING;
      case 'finished':
        return TASK_STATUS.COMPLETED;
      case 'failed':
        return TASK_STATUS.FAILED;
      default:
        return TASK_STATUS.PENDING;
    }
  }

  // 清理所有任务
  clearAllTasks() {
    // 清除轮询间隔
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.activePolling.clear();
    this.tasks.clear();
    this.hasCompletionMessage = false;
    this.hasXavierStartMessage = false;
    this.hasYoussefStartMessage = false;
    this.hasFailureMessage = false;
    this.lastProcessedState = null;
    
    if (this.detailPollingInterval) {
      clearInterval(this.detailPollingInterval);
      this.detailPollingInterval = null;
    }
    
    this.lastDetailCount = 0;
    this.currentPage = 1;
    
    if (this.sourcesPollingInterval) {
      clearInterval(this.sourcesPollingInterval);
      this.sourcesPollingInterval = null;
    }
    
    this.lastSourceCount = 0;
  }

  // 获取所有任务的状态
  getAllTasksStatus() {
    const status = {};
    this.tasks.forEach((task, type) => {
      status[type] = {
        status: task.status,
        result: task.result
      };
    });
    return status;
  }

  // 获取任务消息
  getTaskMessage(taskType, status) {
    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return status === TASK_STATUS.RUNNING 
          ? { 
              type: 'agent',
              agentId: 1, // Joey
              content: '🔍 I\'m now searching for your top competitors. This involves analyzing market data and identifying companies with similar offerings...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 1,
                content: '✨ Great! I\'ve identified the main competitors. Now I\'ll hand this over to Xavier for detailed scoring analysis.',
                isThinking: false
              }
            : null;

      case TASK_TYPES.COMPETITOR_SCORING:
        return status === TASK_STATUS.RUNNING
          ? {
              type: 'agent',
              agentId: 2, // Xavier
              content: '📊 I\'m analyzing each competitor\'s strengths and weaknesses, evaluating their features, pricing, and market positioning...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 2,
                content: '📈 Scoring analysis complete! I\'ve evaluated all competitors. Passing this to Youssef for the final comparison.',
                isThinking: false
              }
            : null;

      case TASK_TYPES.PRODUCT_COMPARISON:
        return status === TASK_STATUS.RUNNING
          ? {
              type: 'agent',
              agentId: 3, // Youssef
              content: '🔄 Now comparing all products to identify key differentiators and unique value propositions...',
              isThinking: true
            }
          : status === TASK_STATUS.COMPLETED
            ? {
                type: 'agent',
                agentId: 3,
                content: '🎉 Analysis complete! I\'ve prepared a comprehensive comparison of all products. Joey will now present the final insights to you.',
                isThinking: false
              }
            : null;

      default:
        return null;
    }
  }

  // 添加获取失败消息的方法
  getFailureMessage(taskType, errorMsg) {
    // Clear all polling tasks
    this.clearAllTasks();

    // Reset loading and message sending states via callback
    if (this.onLoadingUpdate) {
      this.onLoadingUpdate(false);
    }
    if (this.onMessageSendingUpdate) {
      this.onMessageSendingUpdate(false);
    }

    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return {
          type: 'agent',
          agentId: 1, // Joey
          content: `I apologize, but I encountered an issue while searching for competitors. This might be due to:
• Invalid or inaccessible website
• Limited market data availability
• Technical difficulties

Would you please verify the URL and try again? Alternatively, you can try with a different website.`,
          isThinking: false
        };

      case TASK_TYPES.COMPETITOR_SCORING:
        return {
          type: 'agent',
          agentId: 2, // Xavier
          content: `I encountered a problem while analyzing the competitors. This could be because:
• Insufficient competitor data
• Unable to access competitor information
• Technical analysis limitations

Let's start over with a new search. Please provide the website URL again.`,
          isThinking: false
        };

      case TASK_TYPES.PRODUCT_COMPARISON:
        return {
          type: 'agent',
          agentId: 3, // Youssef
          content: `I ran into difficulties while comparing the products. This might be due to:
• Complex product structures
• Limited feature information
• Data processing issues

Please try the analysis again with the website URL.`,
          isThinking: false
        };

      default:
        return {
          type: 'agent',
          agentId: 1,
          content: 'An unexpected error occurred. Please try again with the website URL.',
          isThinking: false
        };
    }
  }

  // 添加detail轮询方法
  startDetailPolling() {
    if (this.detailPollingInterval) return;

    const pollDetails = async () => {
      try {
        const response = await this.apiClient.getAlternativeDetail(
          this.websiteId,
          {
            planningId: this.planningId,
            page: 1,
            limit: 300
          }
        );

        console.log('API Response:', response);

        // 确保正确获取数据
        const details = response?.data || [];
        const hasNewData = details.length > 0;

        console.log('Parsed details:', details);

        if (Array.isArray(details)) {
          if (hasNewData) {
            if (this.onDetailsUpdate) {
              this.onDetailsUpdate(details, hasNewData);
            }
          } else {
            if (this.onDetailsUpdate) {
              this.onDetailsUpdate(details, false);
            }
          }
        }
      } catch (error) {
        console.error('Error polling details:', error);
      }
    };

    this.detailPollingInterval = setInterval(pollDetails, 5000); // Poll every 5 seconds
    pollDetails(); // Execute immediately for first time
  }

  // 在任务完成或失败时停止detail轮询
  stopDetailPolling() {
    if (this.detailPollingInterval) {
      clearInterval(this.detailPollingInterval);
      this.detailPollingInterval = null;
    }
  }

  // 添加 sources 轮询方法
  startSourcePolling() {
    if (this.sourcesPollingInterval) return;

    const pollSources = async () => {
      try {
        const response = await this.apiClient.getAlternativeSources(this.websiteId);
        
        console.log('Sources API Response:', response);

        // 确保正确获取数据
        const sources = response?.data || [];
        const hasNewData = sources.length > this.lastSourceCount;
        this.lastSourceCount = sources.length;

        if (Array.isArray(sources)) {
          if (this.onSourcesUpdate) {
            this.onSourcesUpdate(sources, hasNewData);
          }
        }
      } catch (error) {
        console.error('Error polling sources:', error);
      }
    };

    this.sourcesPollingInterval = setInterval(pollSources, POLLING_INTERVALS.SOURCES);
    pollSources(); // 立即执行第一次
  }

  // 在 TaskManager 类中添加获取当前活动 agent 的辅助方法
  getActiveAgent(taskType) {
    switch (taskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        return 1; // Joey
      case TASK_TYPES.COMPETITOR_SCORING:
        return 2; // Xavier
      case TASK_TYPES.PRODUCT_COMPARISON:
        return 3; // Youssef
      default:
        return 1; // 默认使用 Joey
    }
  }

  // 修改错误处理消息
  getRetryMessage(taskType) {
    const messages = {
      [TASK_TYPES.COMPETITOR_SEARCH]: "🔄 I've encountered a small hiccup in the competitor search. Don't worry - I'm automatically retrying the analysis. Please hold on for a moment...",
      [TASK_TYPES.COMPETITOR_SCORING]: "🔄 The scoring analysis hit a brief snag. I'm automatically restarting the process. Just a moment while I recalibrate...",
      [TASK_TYPES.PRODUCT_COMPARISON]: "🔄 There was a slight interruption in the comparison process. I'm automatically resuming the analysis. Please wait while I reconnect..."
    };
    return messages[taskType] || "🔄 A brief interruption occurred. I'm automatically retrying the process. Please wait a moment...";
  }

  // Add callback setters for loading and message sending states
  setLoadingUpdateCallback(callback) {
    this.onLoadingUpdate = callback;
  }

  setMessageSendingUpdateCallback(callback) {
    this.onMessageSendingUpdate = callback;
  }
}

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  // 添加Deep Research模式状态
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  // 添加credits状态
  const [credits, setCredits] = useState(100);
  // 修改credits弹窗显示状态
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // 添加初始消息的状态控制
  const [initialMessagesShown, setInitialMessagesShown] = useState(0);
  
  // 修改初始消息数组，只保留两条消息
  const initialMessages = [
    { 
      type: 'agent', 
      agentId: 1,
      content: '👋 Welcome to Alternatively! I\'m Joey, your dedicated Research Specialist, ready to help you discover and analyze SaaS alternatives.'
    },
    {
      type: 'agent',
      agentId: 1,
      content: '🔍 Enter a product domain (e.g., websitelm.com) and I\'ll find the best alternatives instantly.\n\n✨ I\'ll generate SEO-friendly Alternative Pages for your instant preview!\n\n💡 Pro tip: Enable Deep Research mode for more in-depth analysis! Let\'s begin! 🚀'
    }
  ];
  
  // 添加 tabs 状态
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // 修改 rightPanelTab 的初始状态
  const [rightPanelTab, setRightPanelTab] = useState('details'); // 默认选中 details

  // 添加浏览器显示状态
  const [showBrowser, setShowBrowser] = useState(false);

  // 添加新的状态
  const [customerId, setCustomerId] = useState(null);

  // Add websiteId state
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);

  // 添加detail相关状态
  const [detailsData, setDetailsData] = useState([]);
  const [totalDetails, setTotalDetails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(300);

  // 将 expandedNodes 状态移到组件顶层
  const [expandedNodes, setExpandedNodes] = useState({});

  // 添加 sources 状态
  const [sourcesData, setSourcesData] = useState([]);

  // 添加引导弹窗状态
  const [showGuideModal, setShowGuideModal] = useState(true);

  // 在组件的最开始部分添加引导弹窗的渲染逻辑
  const renderGuideModal = () => (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${showGuideModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ transition: 'opacity 0.3s ease-in-out' }}
    >
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowGuideModal(false)}
      ></div>
      
      {/* 弹窗内容 - 更新标题和描述 */}
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl 
                      max-w-2xl w-full min-h-[700px] max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Logo 容器 - 增加上方空间确保完整显示 */}
        <div className="h-32 flex items-center justify-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-0.5 mt-6">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-14 h-14" />
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 - 更新标题和描述 */}
        <div className="px-12 pb-12">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Generate SEO-Optimized Alternative Pages
          </h2>
          <p className="text-gray-300 text-center mb-12 text-lg leading-relaxed max-w-xl mx-auto">
            Enter your website domain and our AI agents will instantly create SEO-friendly comparison pages by analyzing your top competitors. Perfect for boosting your organic traffic!
          </p>

          {/* 示例展示 - 更新文案 */}
          <div className="bg-gray-800/50 rounded-lg p-8 mb-12">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-2xl">💡</span>
              </div>
              <span className="text-lg text-gray-300">Just enter your domain</span>
            </div>
            <div className="flex items-center justify-between space-x-6">
              <code className="text-lg bg-gray-900/50 text-purple-300 px-6 py-3 rounded flex-shrink-0">websitelm.com</code>
              <ArrowRightOutlined className="text-gray-500 text-xl flex-shrink-0" />
              <div className="text-base text-gray-400">Get instant SEO pages</div>
            </div>
          </div>

          {/* AI Agents 介绍 - 更新角色描述 */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {[
              {
                id: 1,
                name: 'Joey.Z',
                avatar: '/images/zy.jpg',
                role: 'SEO Specialist',
              },
              {
                id: 2,
                name: 'Xavier.S',
                avatar: '/images/hy.jpg',
                role: 'Content Generator',
              },
              {
                id: 3,
                name: 'Youssef',
                avatar: '/images/youssef.jpg',
                role: 'Page Builder',
              }
            ].map(agent => (
              <div key={agent.id} className="text-center p-6 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-700">
                  <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-base text-gray-300 font-medium mb-2">{agent.name}</div>
                <div className="text-sm text-gray-400">{agent.role}</div>
              </div>
            ))}
          </div>

          {/* 开始按钮 - 更新文案 */}
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => {
                setShowGuideModal(false);
                inputRef.current?.focus();
              }}
              className="w-full py-5 relative group overflow-hidden rounded-xl"
            >
              {/* 渐变背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-90
                              group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* 动态光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              {/* 内容容器 */}
              <div className="relative flex items-center justify-center gap-3 text-white">
                <span className="text-xl font-medium tracking-wide">Create SEO Pages Now</span>
                <svg 
                  className="w-6 h-6 transform transition-all duration-300 
                             group-hover:translate-y-1 group-hover:scale-110" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>

              {/* 按钮边框光效 */}
              <div className="absolute inset-0 rounded-xl border border-white/20 
                              group-hover:border-white/40 transition-colors duration-300"></div>
                      
              {/* 按钮阴影效果 */}
              <div className="absolute inset-0 rounded-xl opacity-50 blur-xl 
                              bg-gradient-to-r from-blue-500/50 to-purple-500/50 
                              group-hover:opacity-75 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 在组件顶部添加 useEffect 来控制滚动
  useEffect(() => {
    if (showGuideModal) {
      // 当弹窗显示时禁用滚动
      document.body.style.overflow = 'hidden';
    } else {
      // 当弹窗关闭时恢复滚动
      document.body.style.overflow = 'unset';
    }
    
    // 清理函数
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showGuideModal]);

  // 在组件加载时检查登录状态
  useEffect(() => {
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  // 处理新消息,更新tabs
  const handleNewMessage = (message) => {
    if (message.details && message.details.length > 0) {
      const newTabs = message.details.map((detail, index) => ({
        id: detail.id || `tab-${index}`,
        title: detail.title || `Page ${index + 1}`,
        url: detail.url,
        active: index === 0,
        created_at: detail.created_at
      }));
      setTabs(newTabs);
      setActiveTabId(newTabs[0].id);
    }
  };

  // 处理标签页切换
  const handleTabChange = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
    setActiveTabId(tabId);
  };

  // 修改域名验证函数，使其更严格
  const validateDomain = (domain) => {
    // 移除 http:// 或 https:// 前缀
    const cleanDomain = domain.replace(/^https?:\/\//i, '');
    // 移除末尾的斜杠
    const trimmedDomain = cleanDomain.replace(/\/+$/, '');
    
    // 验证域名格式：
    // - 允许字母、数字、连字符
    // - 必须包含至少一个点
    // - 顶级域名至少2个字符
    // - 不允许连续的点或连字符
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(trimmedDomain);
  };

  const handleUserInput = (e) => {
    // 阻止任何可能的默认行为
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(newMessages);
    
    // Process the input as domain
    const cleanDomain = userInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    setDomain(cleanDomain);
    
    // Clear input field
    setUserInput('');
    
    // 设置消息发送状态为true
    setIsMessageSending(true);
    
    // Validate domain and start analysis
    if (!validateDomain(cleanDomain)) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          type: 'agent', 
          agentId: 1,
          content: `I notice that "${cleanDomain}" doesn't seem to be a valid domain name. Here's what I'm looking for:

• A proper domain name (e.g., "example.com", "my-site.co.uk")
• No special characters (except hyphens between words)
• Must include a valid top-level domain (.com, .org, etc.)

Could you please provide a valid domain name? For example: "websitelm.com"`,
          isThinking: false
        }]);
        setIsMessageSending(false);
      }, 500);
      return;
    }
    
    // 延迟0.5秒后开始分析过程，显得更真实
    setTimeout(() => {
      startAnalysis(cleanDomain);
    }, 500);
  };
  
  const [taskManager] = useState(() => new TaskManager(apiClient));

  useEffect(() => {
    // 设置任务更新回调
    taskManager.onTaskUpdate = (taskType, task) => {
      // 更新工作流程状态
      setWorkflowStage(task.status);
      // 根据任务类型和状态更新UI
      updateUIForTask(taskType, task);
    };

    taskManager.onDetailsUpdate = (details, hasNewData) => {
      setDetailsData(details);
      
      // 如果有新数据且不在 details tab，自动切换
      if (hasNewData && rightPanelTab !== 'details') {
        setRightPanelTab('details');
      }
    };

    taskManager.onSourcesUpdate = (sources, hasNewData) => {
      setSourcesData(sources);
      
      // 如果有新数据且不在 sources tab，自动切换
      if (hasNewData && rightPanelTab !== 'sources') {
        setRightPanelTab('sources');
      }
    };

    // 修改消息更新回调
    taskManager.onMessageUpdate = (messageUpdater) => {
      if (typeof messageUpdater === 'function') {
        setMessages(messageUpdater);
      } else {
        setMessages(prev => [...prev, messageUpdater]);
      }
    };

    // 初始化 TaskManager 时添加浏览器更新回调
    taskManager.onBrowserUpdate = ({ show, tabs }) => {
      setShowBrowser(show);
      setTabs(tabs);
    };

    // 添加 callbacks during initialization
    taskManager.setLoadingUpdateCallback(setLoading);
    taskManager.setMessageSendingUpdateCallback(setIsMessageSending);

    return () => {
      taskManager.clearAllTasks();
    };
  }, []);

  // Modify startAnalysis function
  const startAnalysis = async (cleanDomain) => {
    // 检查登录状态
    const token = localStorage.getItem('alternativelyAccessToken');
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    
    if (!token || !storedCustomerId) {
      // 不使用 message.error，而是通过消息对话的方式显示错误
      setMessages(prev => [...prev, {
        type: 'agent',
        agentId: 1,
        content: '⚠️ Please login to access this feature. Your session may have expired.',
        isThinking: false
      }]);
      
      localStorage.removeItem('alternativelyAccessToken');
      localStorage.removeItem('alternativelyCustomerId');
      return;
    }

    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);

    try {
      // 添加初始消息（带loading状态）
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '🔍 I\'m now searching for your top competitors. This involves analyzing market data and identifying companies with similar offerings...',
        isThinking: true
      }]);

      const response = await apiClient.generateAlternative(
        storedCustomerId,
        deepResearchMode,
        cleanDomain
      );

      if (response?.code === 200 && response?.data?.websiteId) {
        setCurrentWebsiteId(response.data.websiteId);
        taskManager.initializeResearch(response.data.websiteId, true);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('Failed to start research:', error);
      // 使用消息对话方式显示错误
      setMessages(prev => [...prev, {
        type: 'agent',
        agentId: 1,
        content: '❌ I apologize, but I encountered an error while starting the analysis. Please try again later.',
        isThinking: false
      }]);
      setLoading(false);
      setWorkflowStage(null);
    }
  };

  // Add status polling function
  const startPollingStatus = (websiteId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await apiClient.getAlternativeStatus(websiteId);
        
        // Update UI based on status
        if (statusResponse?.data?.status === 'COMPLETED') {
          clearInterval(pollInterval);
          handleResearchResults(statusResponse.data, domain);
        } else if (statusResponse?.data?.status === 'FAILED') {
          clearInterval(pollInterval);
          message.error('Analysis failed, please try again later');
          setLoading(false);
          setWorkflowStage(null);
        }
        // Continue polling if status is PENDING or RUNNING
        
      } catch (error) {
        console.error('Failed to get status:', error);
        clearInterval(pollInterval);
        message.error('Failed to get analysis status');
        setLoading(false);
        setWorkflowStage(null);
      }
    }, 3000); // Poll every 3 seconds

    // Return cleanup function
    return () => clearInterval(pollInterval);
  };

  // Modify handleResearchResults function to handle new data structure
  const handleResearchResults = (data, cleanDomain) => {
    setWorkflowStage('completed');
    setWorkflowProgress(100);
    setLoading(false);
    
    // 更新消息，移除思考状态
    setMessages(prev => {
      const updatedMessages = [...prev];
      if (updatedMessages.length > 0) {
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage.isThinking) {
          updatedMessages[updatedMessages.length - 1] = {
            ...lastMessage,
            isThinking: false
          };
        }
      }
      return updatedMessages;
    });
    
    // 添加数据验证
    const competitors = Array.isArray(data?.result) 
      ? data.result.filter(url => url !== null && url !== undefined)
      : [];
      
    // 添加结果消息
    setTimeout(() => {
      const message = competitors.length > 0 
        ? `🎉 Great news! I've found some excellent alternatives! Here are the main competitors to ${cleanDomain}:

${competitors.slice(0, 5).map((url, index) => `${index + 1}. ${url}`).join('\n')}

I've loaded these websites in the browser panel for you to explore. Would you like to know more specific details about any of them?`
        : `I apologize, but I couldn't find any valid alternatives for ${cleanDomain} at this moment. Would you like to try with a different domain?`;

      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: message,
        isThinking: false
      }]);
      
      // 只在有竞争对手时更新浏览器标签
      if (competitors.length > 0) {
        const newTabs = competitors.slice(0, 5).map((url, index) => ({
          id: index + 1,
          title: new URL(url).hostname.replace('www.', ''),
          url: url,
          active: index === 0
        }));
        
        setTabs(newTabs);
      }
      
      setIsMessageSending(false);
    }, 500);

    // 在任务完成时停止detail轮询
    taskManager.stopDetailPolling();
  };
  
  const formatUrl = (input) => {
    let cleanDomain = input.trim();
    if (cleanDomain.startsWith('http://')) {
      cleanDomain = cleanDomain.substring(7);
    } else if (cleanDomain.startsWith('https://')) {
      cleanDomain = cleanDomain.substring(8);
    }
    return `https://${cleanDomain}`;
  };

  const renderChatMessage = (message, index) => {
    if (message.type !== 'user') {
      const agent = agents.find(a => a.id === message.agentId) || agents[0];
      return (
        <div key={index} className="flex justify-start mb-3" style={{animation: 'fadeIn 0.5s ease-out forwards'}}>
          <div className="flex max-w-[80%] flex-row">
            <div className="flex-shrink-0 mr-2" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
              <Avatar 
                size="small"
                src={agent.avatar}
                className="bg-transparent"
              />
            </div>
            <div className="p-2 rounded-lg text-xs bg-white/10 backdrop-blur-sm text-gray-100 rounded-tl-none 
                            transform transition-all duration-300" 
                 style={{animation: 'slideInRight 0.4s ease-out forwards'}}>
              <div className="text-xs font-medium text-blue-300 mb-1 flex items-center">
                <span className="mr-1">{agent.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full animate-pulse">
                  {agent.role}
                </span>
              </div>
              {message.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              {message.isThinking && (
                <div className="flex space-x-1 mt-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // 用户消息保持不变
    return (
      <div 
        key={index} 
        className="flex justify-end mb-3"
      >
        <div className="flex max-w-[80%] flex-row-reverse">
          <div className="flex-shrink-0 ml-2">
            <Avatar 
              size="small"
              icon={<UserOutlined />} 
              className="bg-blue-500"
            />
          </div>
          <div 
            className="p-2 rounded-lg text-xs bg-blue-600 text-white rounded-tr-none transform transition-all duration-300"
            style={{animation: 'slideInLeft 0.4s ease-out forwards'}}
          >
            {message.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < message.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // 新增 agents 数据 - 将Joey提升为主要研究专家，移除Alexis
  const agents = [
    {
      id: 1,
      name: 'Joey.Z',
      avatar: '/images/zy.jpg',  // 使用指定的图片路径
      role: 'Research Specialist',
      description: 'Specialized in comprehensive competitor research and market analysis. I help identify and analyze alternative products in your market space.'
    },
    {
      id: 2,
      name: 'Xavier.S',
      avatar: '/images/hy.jpg',  // 使用指定的图片路径
      role: 'Detail Analyst',
      description: 'Focus on deep-diving into competitor features, pricing strategies, and unique selling propositions. I provide detailed comparative analysis.'
    },
    {
      id: 3,
      name: 'Youssef',
      avatar: '/images/youssef.jpg',  // 使用指定的图片路径
      role: 'Integration Specialist',
      description: 'Expert in connecting research findings with actionable insights. I help translate competitor analysis into strategic recommendations for your business.'
    }
  ];

  // 渲染 agents 卡片
  const renderAgents = () => (
    <div className="space-y-3">
      {agents.map(agent => (
        <div key={agent.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-100">{agent.name}</h4>
              <p className="text-xs text-purple-300">{agent.role}</p>
            </div>
          </div>
          <p className="text-xs text-purple-200 leading-relaxed">{agent.description}</p>
        </div>
      ))}
    </div>
  );

  // 修改 renderSources 函数,使用真实数据结构
  const renderSources = () => (
    <div className="space-y-2">
      {sourcesData.length === 0 ? (
        <div className="text-gray-500 text-center py-4 text-xs">
          No sources available yet
        </div>
      ) : (
        sourcesData.map((source, index) => (
          <div key={index} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <a 
                href={source.sourceURL}
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-purple-100 hover:text-purple-300 transition-colors truncate flex-1"
              >
                {source.sourceURL}
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // 修改 useEffect，防止任何自动滚动
  useEffect(() => {
    // 完全禁用自动滚动到底部的行为
    // 只在聊天区域内部滚动，不影响整个页面
    if (chatEndRef.current && messages.length > 1) {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  // 添加初始化加载效果
  useEffect(() => {
    // 模拟初始化加载
    const timer = setTimeout(() => {
      setInitialLoading(false);
      
      // 开始显示初始消息时，设置消息发送状态为true
      setIsMessageSending(true);
      
      // 开始逐步显示初始消息
      showInitialMessagesSequentially();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 修改逐步显示初始消息的函数
  const showInitialMessagesSequentially = () => {
    // 设置第一条消息
    setMessages([initialMessages[0]]);
    setInitialMessagesShown(1);
    
    // 设置第二条消息
    setTimeout(() => {
      setMessages(prev => [...prev, initialMessages[1]]);
      setInitialMessagesShown(2);
      setIsMessageSending(false);
    }, 1000);
  };

  // 添加新的动画样式
  const animationStyles = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes slideInRight {
      from { transform: translateX(-20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInLeft {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 500px; opacity: 1; }
    }

    @keyframes slideUp {
      from { max-height: 500px; opacity: 1; }
      to { max-height: 0; opacity: 0; }
    }
  `;

  // 如果正在初始化加载，显示加载界面
  if (initialLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
                      flex items-center justify-center" style={{ paddingTop: "80px" }}>
        <div className="text-center">
          <img 
            src="/images/alternatively-logo.png" 
            alt="Alternatively" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse" 
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Alternatively</h2>
          <p className="text-gray-300">Preparing your research environment...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 切换Deep Research模式
  const toggleDeepResearchMode = () => {
    setDeepResearchMode(!deepResearchMode);
    
    // 当用户切换模式时，添加相应的代理消息提示
    if (!deepResearchMode) {
      // 如果当前是关闭状态，切换到开启状态
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1, // 使用Joey来解释深度研究模式
        content: '🔬 Deep Research mode activated! I\'ll now perform a more comprehensive analysis, exploring additional data sources and providing more detailed insights. This may take a bit longer, but the results will be much more thorough.',
        isThinking: false
      }]);
    } else {
      // 如果当前是开启状态，切换到关闭状态
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1,
        content: '📊 Standard Research mode activated. I\'ll focus on providing quick, essential insights about alternatives. This is perfect for getting a rapid overview of your options.',
        isThinking: false
      }]);
    }
  };

  // 修改分页处理函数
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 更新TaskManager中的当前页
    if (taskManager) {
      taskManager.currentPage = page;
      // 立即触发一次数据获取
      taskManager.pollDetails();
    }
  };

  // 修改 renderDetails 函数，将 details 按照 planningId 分组并添加展开/折叠功能
  const renderDetails = (details) => {
    if (!details || details.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4 text-xs">
          No details available
        </div>
      );
    }

    // 按 planningId 对 details 进行分组，并保持顺序
    const planningIds = [...new Set(details.map(detail => detail.planningId))];
    const groupedDetails = {};
    planningIds.forEach((planningId, index) => {
      groupedDetails[planningId] = details.filter(detail => detail.planningId === planningId);
      // 设置默认展开状态
      if (!expandedNodes[`section-${index}`]) {
        setExpandedNodes(prev => ({...prev, [`section-${index}`]: true}));
      }
    });

    // 根据顺序定义阶段标题
    const stageTitles = [
      'Finding Competitors',
      'Analyzing Competitors',
      'Generating Alternative Pages'
    ];

    return planningIds.map((planningId, index) => {
      const nodeId = `section-${index}`; // 使用索引而不是 planningId
      const isExpanded = expandedNodes[nodeId] !== false; // 默认为 true
      const title = stageTitles[index] || 'Unknown Stage';
      const groupDetails = groupedDetails[planningId];

      return (
        <div key={nodeId} className="mb-4">
          {/* 分组标题和展开/折叠按钮 */}
          <div 
            className="bg-gray-700/50 p-3 rounded-lg cursor-pointer hover:bg-gray-700/70 transition-colors"
            onClick={() => setExpandedNodes(prev => ({...prev, [nodeId]: !prev[nodeId]}))}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-purple-200">{title}</span>
                <span className="text-xs text-gray-400">({groupDetails.length})</span>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 详细内容区域 */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded ? `${Math.min(groupDetails.length * 100, 400)}px` : '0',
              opacity: isExpanded ? 1 : 0
            }}
          >
            <div className="space-y-2 mt-2 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {groupDetails.map((detail, detailIndex) => {
                const { data, event, created_at } = detail;
                const { title, status, outputs } = data || {};
                
                return (
                  <div key={detailIndex} className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                    <div className="text-xs text-gray-300">{title || event}</div>
                    {status && (
                      <div className={`text-xs mt-1 ${
                        status === "succeeded" ? "text-green-500" : 
                        status === "failed" ? "text-red-500" : 
                        "text-gray-400"
                      }`}>
                        {status}
                      </div>
                    )}
                    {outputs && (
                      <div className="text-xs text-gray-400 mt-1 break-words">
                        {typeof outputs === 'string' ? outputs : JSON.stringify(outputs)}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <ConfigProvider wave={{ disabled: true }}>
      {/* 添加引导弹窗 */}
      {renderGuideModal()}
      
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
                    text-white flex items-center justify-center p-4 relative overflow-hidden" 
         style={{ paddingTop: "80px" }}>
        <style>{animationStyles}</style>
        
        <div className="absolute inset-0" style={{ paddingTop: "80px" }}>
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-gray-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          {/* 左侧对话栏 */}
          <div className={`${showBrowser ? 'w-1/5' : 'w-4/5'} transition-all duration-300 ease-in-out 
                           bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl flex flex-col h-full`}>
            <div className="h-10 px-4 border-b border-gray-300/20 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
              
              {/* 修改Credits图标和弹窗 */}
              <div className="relative">
                <div 
                  className="flex items-center cursor-pointer text-gray-300 hover:text-white transition-colors"
                  onClick={() => setShowCreditsTooltip(!showCreditsTooltip)}
                >
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                    <span className="text-xs font-medium">💎</span>
                  </div>
                </div>
                
                {showCreditsTooltip && (
                  <div 
                    className="absolute right-0 top-8 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50 text-xs"
                    style={{animation: 'fadeIn 0.2s ease-out forwards'}}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-purple-300">Account Balance</span>
                      <button 
                        onClick={() => setShowCreditsTooltip(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold text-lg">{credits} Credits</span>
                    </div>
                    
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                        style={{width: `${Math.min(100, (credits/200)*100)}%`}}
                      ></div>
                    </div>
                    
                    <p className="mb-3 text-gray-300">Each research consumes 10-20 Credits</p>
                    
                    <button className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white text-xs transition-colors">
                      Recharge Credits
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 聊天消息容器 */}
            <div className="flex-1 overflow-y-auto p-4 chat-messages-container">
              {initialLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => renderChatMessage(message, index))}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
            
            {/* 修改输入区域的样式和位置 */}
            <div className="p-4 border-t border-gray-300/20 flex-shrink-0">
              <div className="max-w-[600px] mx-auto">
                <form onSubmit={handleUserInput} className="relative">
                  <Input
                    ref={inputRef}
                    placeholder={deepResearchMode 
                      ? "Enter website for comprehensive analysis..." 
                      : "Enter your product URL (e.g., websitelm.com)"}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending}
                    className="bg-white/10 border border-gray-300/30 rounded-xl text-sm"
                    style={{ 
                      color: 'black', 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      height: '48px',
                      paddingLeft: '16px',
                      transition: 'all 0.3s ease'
                    }}
                    prefix={
                      <SearchOutlined 
                        style={{ 
                          color: 'rgba(0, 0, 0, 0.45)',
                          fontSize: '16px'
                        }} 
                      />
                    }
                  />
                </form>

                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center space-x-4">
                    {/* Deep 开关移到这里 */}
                    <button 
                      type="button"
                      className={`flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200 
                        ${loading || isMessageSending 
                          ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' 
                          : deepResearchMode
                            ? 'bg-purple-500 text-white hover:bg-purple-600' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      onClick={() => {
                        if (!loading && !isMessageSending) {
                          toggleDeepResearchMode();
                        }
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full mr-1.5 transition-colors ${
                        deepResearchMode ? 'bg-white' : 'bg-gray-500'
                      }`}></span>
                      Deep
                    </button>

                    {/* 模式说明文本 */}
                    <span className="text-xs text-purple-300/80">
                      {deepResearchMode ? (
                        <span className="flex items-center">
                          <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-1.5 animate-pulse"></span>
                          Comprehensive analysis mode
                        </span>
                      ) : (
                        "Quick search mode"
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400">
                    Press Enter ↵ to search
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 中间浏览器区域 */}
          <div className={`${showBrowser ? 'w-3/5' : 'hidden'} transition-all duration-300 ease-in-out 
                           bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl flex flex-col h-full relative`}>
            {/* 直接渲染 BrowserSimulator，移除外层的 tab 栏 */}
            <BrowserSimulator 
              url={tabs.find(tab => tab.active)?.url}
              tabs={tabs}
              onTabChange={handleTabChange}
            />
          </div>
          
          {/* 右侧分析结果栏 */}
          <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                          flex flex-col h-full relative">
            {/* 将 Show 按钮和 Agent 头像放在顶部 */}
            <div className="border-b border-gray-300/20">
              <div className="flex items-center p-3">
                {!showBrowser && (
                  <button
                    onClick={() => setShowBrowser(true)}
                    className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-colors mr-2"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                
                {/* 进一步增加头像间距，并完全移开 Working 标签 */}
                <div className="flex items-center space-x-6">
                  {agents.map(agent => (
                    <div key={agent.id} className="relative">
                      <Tooltip title={`${agent.name} - ${agent.role}`}>
                        <div 
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-300 ${
                            messages[messages.length - 1]?.agentId === agent.id && messages[messages.length - 1]?.isThinking
                              ? 'border-blue-500 scale-110'
                              : 'border-transparent hover:border-gray-400'
                          }`}
                        >
                          <img 
                            src={agent.avatar} 
                            alt={agent.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Tooltip>
                      {/* 完全移到右上角，不遮挡头像 */}
                      {messages[messages.length - 1]?.agentId === agent.id && 
                       messages[messages.length - 1]?.isThinking && (
                        <div className="absolute -top-4 -right-4">
                          <div className="px-1.5 py-0.5 bg-blue-500 rounded-full text-[8px] text-white font-medium flex items-center">
                            <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
                            Working
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Tab 切换按钮 */}
              <div className="flex">
                <button
                  onClick={() => setRightPanelTab('details')}
                  className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                    ${rightPanelTab === 'details'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-gray-200'
                    }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setRightPanelTab('sources')}
                  className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                    ${rightPanelTab === 'sources'
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-gray-300 hover:text-gray-200'
                    }`}
                >
                  Sources
                </button>
              </div>
            </div>
            
            {/* Tab 内容区域 */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && (
                <>
                  {renderDetails(detailsData)}
                </>
              )}
              
              {rightPanelTab === 'sources' && (
                <div className="p-3">
                  {renderSources()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ResearchTool; 
