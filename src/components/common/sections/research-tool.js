'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';

// 添加任务状态常量
const TASK_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
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
  }

  // 初始化新的研究任务流程
  async initializeResearch(domain) {
    // 清理之前的任务
    this.clearAllTasks();
    
    // 创建竞品搜索任务
    const searchTask = await this.apiClient.createCompetitorSearchTask(domain);
    this.tasks.set(TASK_TYPES.COMPETITOR_SEARCH, {
      id: searchTask.id,
      type: TASK_TYPES.COMPETITOR_SEARCH,
      status: TASK_STATUS.PENDING,
      result: null,
      details: [],
      sources: []
    });

    // 开始轮询第一个任务
    this.startPolling(TASK_TYPES.COMPETITOR_SEARCH);
  }

  // 开始轮询特定任务
  startPolling(taskType) {
    if (this.activePolling.has(taskType)) return;

    const pollTaskStatus = async () => {
      const task = this.tasks.get(taskType);
      if (!task) return;

      try {
        // 获取任务状态
        const status = await this.apiClient.getTaskStatus(task.id);
        const details = await this.apiClient.getTaskDetails(task.id);
        const sources = await this.apiClient.getTaskSources(task.id);

        // 更新任务信息
        task.status = status.status;
        task.result = status.result;
        task.details = [...task.details, ...details];
        task.sources = [...task.sources, ...sources];

        // 触发更新回调
        this.onTaskUpdate?.(taskType, task);
        this.onDetailsUpdate?.(task.details);
        this.onSourcesUpdate?.(task.sources);

        // 如果任务完成，启动下一个任务
        if (status.status === TASK_STATUS.COMPLETED) {
          this.stopPolling(taskType);
          await this.startNextTask(taskType);
        }
      } catch (error) {
        console.error(`Error polling task ${taskType}:`, error);
        task.status = TASK_STATUS.FAILED;
        this.stopPolling(taskType);
      }
    };

    // 设置轮询间隔
    const intervalId = setInterval(pollTaskStatus, POLLING_INTERVALS.TASK_STATUS);
    this.activePolling.add(taskType);
    
    // 立即执行一次
    pollTaskStatus();
  }

  // 停止特定任务的轮询
  stopPolling(taskType) {
    this.activePolling.delete(taskType);
  }

  // 启动下一个任务
  async startNextTask(currentTaskType) {
    const currentTask = this.tasks.get(currentTaskType);
    if (!currentTask || currentTask.status !== TASK_STATUS.COMPLETED) return;

    let nextTaskType;
    let nextTask;

    switch (currentTaskType) {
      case TASK_TYPES.COMPETITOR_SEARCH:
        // 创建竞品评分任务
        nextTaskType = TASK_TYPES.COMPETITOR_SCORING;
        nextTask = await this.apiClient.createCompetitorScoringTask(currentTask.result);
        break;
      case TASK_TYPES.COMPETITOR_SCORING:
        // 创建产品对比任务
        nextTaskType = TASK_TYPES.PRODUCT_COMPARISON;
        nextTask = await this.apiClient.createProductComparisonTask(currentTask.result);
        break;
      default:
        return;
    }

    if (nextTask) {
      this.tasks.set(nextTaskType, {
        id: nextTask.id,
        type: nextTaskType,
        status: TASK_STATUS.PENDING,
        result: null,
        details: [],
        sources: []
      });
      this.startPolling(nextTaskType);
    }
  }

  // 清理所有任务
  clearAllTasks() {
    this.activePolling.forEach(taskType => this.stopPolling(taskType));
    this.activePolling.clear();
    this.tasks.clear();
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
      content: 'To get started, simply enter a product domain (e.g., websitelm.com) and I\'ll immediately begin finding the best alternatives and generate a comprehensive analysis tailored just for you.\n\nPro tip: Enable Deep Research mode for even more detailed insights and comprehensive analysis! Let\'s begin! 🚀'
    }
  ];
  
  // 添加 tabs 状态
  const [tabs, setTabs] = useState([
    {
      id: 1,
      title: 'websitelm.com',
      url: 'https://websitelm.com',
      active: true
    },
    {
      id: 2,
      title: 'EASYFin.ai',
      url: 'https://easyfin.ai/',
      active: false
    }
  ]);

  // 修改右侧面板的 tab 状态
  const [rightPanelTab, setRightPanelTab] = useState('agents'); // 'agents', 'details', 或 'sources'

  // 添加浏览器显示状态
  const [showBrowser, setShowBrowser] = useState(false);

  // 添加新的状态
  const [customerId, setCustomerId] = useState(null);

  // 在组件加载时检查登录状态
  useEffect(() => {
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  // 切换 tab 的函数
  const switchTab = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
  };

  // 获取当前激活的 tab
  const activeTab = tabs.find(tab => tab.active);

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

Could you please provide a valid domain name? For example: "websitelm.com"`
        }]);
        // 消息发送完毕，重置状态
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

    taskManager.onDetailsUpdate = (details) => {
      // 更新详情面板
      setDetailsData(details);
    };

    taskManager.onSourcesUpdate = (sources) => {
      // 更新来源面板
      setSourcesData(sources);
    };

    return () => {
      taskManager.clearAllTasks();
    };
  }, []);

  // 修改 startAnalysis 函数
  const startAnalysis = async (cleanDomain) => {
    // 检查登录状态
    const token = localStorage.getItem('alternativelyAccessToken');
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    
    if (!token || !storedCustomerId) {
      // 如果未登录，显示提示并触发登出
      message.error('Please login to get access to this feature');
      // 这里需要调用您的登出函数，假设它是 logout
      localStorage.removeItem('alternativelyAccessToken');
      localStorage.removeItem('alternativelyCustomerId');
      return;
    }

    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);

    try {
      // 调用 generateAlternative 接口
      const response = await apiClient.generateAlternative(
        storedCustomerId,
        deepResearchMode,
        cleanDomain
      );

      if (response) {
        handleResearchResults(response, cleanDomain);
      } else {
        throw new Error('Failed to generate alternatives');
      }
    } catch (error) {
      console.error('Failed to start research:', error);
      message.error('Failed to start research, please try again later');
      setLoading(false);
      setWorkflowStage(null);
    }
  };
  
  // New function to handle research results
  const handleResearchResults = (data, cleanDomain) => {
    // Update workflow state
    setWorkflowStage('completed');
    setWorkflowProgress(100);
    setLoading(false);
    
    // Update previous message to end thinking state
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
    
    // Add results message after 0.5s delay for natural flow
    setTimeout(() => {
      // Use JoeyZ to provide analysis results
      const competitors = data.data.result.filter(url => url !== null);
      const message = `🎉 Great news! I've found some excellent alternatives! Here are the main competitors to ${cleanDomain}:

${competitors.slice(0, 5).map((url, index) => `${index + 1}. ${url}`).join('\n')}

I've loaded these websites for you to explore in the browser panel. Would you like to know more specific details about any of them?`;

      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 1, // Using JoeyZ
        content: message,
        isThinking: false
      }]);
      
      // Update browser tabs if API returned alternative products
      if (competitors.length > 0) {
        const newTabs = competitors.slice(0, 5).map((url, index) => ({
          id: index + 1,
          title: new URL(url).hostname.replace('www.', ''),
          url: url,
          active: index === 0
        }));
        
        setTabs(newTabs);
      }
      
      // Reset message sending state
      setIsMessageSending(false);
    }, 500);
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
    // 所有非用户消息都作为agent类型处理
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
                <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full animate-pulse">
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
                <div className="flex space-x-1 mt-1.5 justify-center">
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

  // 示例 details 数据 - 重构为处理过程
  const detailsData = [];

  // 示例 sources 数据 - 简化为URL列表
  const sourcesData = [
    {
      id: 1,
      url: 'https://example.com/pricing',
      title: 'Product Pricing Page',
      timestamp: '2024-03-20 14:23'
    },
    {
      id: 2,
      url: 'https://example.com/features',
      title: 'Product Features Overview',
      timestamp: '2024-03-20 14:24'
    },
    {
      id: 3,
      url: 'https://example.com/api-docs',
      title: 'API Documentation',
      timestamp: '2024-03-20 14:25'
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

  // 渲染 details 内容
  const renderDetails = () => (
    <div className="space-y-3">
      {detailsData.map(detail => (
        <div key={detail.id} className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xl">{detail.agentAvatar}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-100">{detail.agentName}</span>
                <span className="text-xs text-purple-300">{detail.timestamp}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-purple-200">{detail.step}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  detail.status === 'Completed' ? 'bg-green-500/20 text-green-300' :
                  detail.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {detail.status}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-200 leading-relaxed">{detail.description}</p>
        </div>
      ))}
    </div>
  );

  // 渲染 sources 内容
  const renderSources = () => (
    <div className="space-y-2">
      {sourcesData.map(source => (
        <div key={source.id} className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-purple-100 hover:text-purple-300 transition-colors truncate flex-1"
            >
              {source.title}
            </a>
            <span className="text-xs text-purple-400 ml-3">{source.timestamp}</span>
          </div>
          <div className="text-xs text-purple-400 truncate">
            {source.url}
          </div>
        </div>
      ))}
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

  // 在组件内部添加样式定义
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden" style={{ paddingTop: "80px" }}>
      {/* 添加内联样式 */}
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
          
          {/* Deep Research 开关 - 移到输入框上方 */}
          <div className="px-3 pt-2 flex items-center justify-between">
            <div 
              className={`flex items-center cursor-pointer px-2 py-1 rounded-full text-xs transition-colors ${
                deepResearchMode 
                  ? 'bg-purple-500/30 text-purple-200' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={toggleDeepResearchMode}
            >
              <span className={`w-3 h-3 rounded-full mr-1.5 transition-colors ${
                deepResearchMode ? 'bg-purple-400' : 'bg-gray-500'
              }`}></span>
              Deep Research
            </div>
            
            <div className="text-xs text-purple-300">
              {deepResearchMode ? (
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-1.5 animate-pulse"></span>
                  Comprehensive mode
                </span>
              ) : (
                <span>Standard mode</span>
              )}
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-300/20 flex-shrink-0">
            <form onSubmit={handleUserInput} className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                placeholder={deepResearchMode 
                  ? "Enter website for comprehensive analysis..." 
                  : "Enter your product's website URL (e.g., websitelm.com) to find alternatives"}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading || isMessageSending}
                className="bg-white/10 border border-gray-300/30 rounded-lg text-xs"
                style={{ 
                  color: 'black', 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  height: '40px'
                }}
              />
              <Button 
                htmlType="submit" 
                icon={<SendOutlined className="text-xs" />}
                loading={loading}
                disabled={loading || isMessageSending}
                className={`border-none ${
                  deepResearchMode 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600' 
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                }`}
                size="small"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleUserInput(e);
                }}
              />
            </form>
            <div className="text-xs text-purple-300 mt-1.5">
              Enter your product's website to discover alternatives and generate a comprehensive analysis
            </div>
          </div>
        </div>
        
        {/* 中间浏览器区域 */}
        {showBrowser && (
          <div className="w-3/5 bg-gray-800 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl flex flex-col h-full">
            <div className="h-10 flex items-center px-4 border-b border-gray-300/20">
              <div className="flex gap-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center flex-1">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`                      flex items-center h-7 px-4 text-xs cursor-pointer
                      rounded-t-md transition-colors mr-1
                      ${tab.active 
                        ? 'bg-white text-gray-800' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    <span className="truncate">{tab.title}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* iframe 内容区 */}
            <div className="flex-1 bg-white">
              <iframe
                key={activeTab?.id}
                src={activeTab?.url}
                className="w-full h-full border-none"
                title={`Tab ${activeTab?.id}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* 简化的隐藏按钮 */}
            <button
              onClick={() => setShowBrowser(false)}
              className="absolute left-4 bottom-4 bg-white/10 text-purple-100 
                        rounded-md px-2 py-1 text-xs"
            >
              Hide
            </button>
          </div>
        )}
        
        {/* 右侧分析结果栏 */}
        <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                        flex flex-col h-full relative"
        >
          {/* 简化的显示按钮 */}
          {!showBrowser && (
            <button
              onClick={() => setShowBrowser(true)}
              className="absolute left-4 bottom-4 bg-white/10 text-purple-100 
                        rounded-md px-2 py-1 text-xs"
            >
              Show
            </button>
          )}
          
          {/* Tab 切换区域 */}
          <div className="flex border-b border-gray-300/20">
            <button
              onClick={() => setRightPanelTab('agents')}
              className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                ${rightPanelTab === 'agents'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-300 hover:text-gray-200'
                }`}
            >
              Agents
            </button>
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
          
          {/* Tab 内容区域 - 移除网格布局，使用单列布局 */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'agents' && (
              <div className="p-3">
                {renderAgents()}
              </div>
            )}
            
            {rightPanelTab === 'details' && (
              <div className="p-3">
                {renderDetails()}
              </div>
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
  );
};

export default ResearchTool; 
