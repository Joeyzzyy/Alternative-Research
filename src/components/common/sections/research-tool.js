'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  
  // 添加初始消息的状态控制
  const [initialMessagesShown, setInitialMessagesShown] = useState(0);
  
  // 初始消息数组
  const initialMessages = [
    { 
      type: 'system', 
      content: 'Welcome to Alternatively! Our research team is ready to help you discover and analyze SaaS alternatives.'
    },
    {
      type: 'system',
      content: 'First, our competitor research specialist will help you find alternatives to your product.'
    },
    {
      type: 'agent',
      agentId: 1,
      content: '👋 Hello there! I\'m Joey, your dedicated Research Specialist! I\'m excited to help you discover the perfect alternatives for your product!\n\nJust enter a product domain (e.g., websitelm.com) and I\'ll immediately get to work finding the best alternatives and generating a comprehensive analysis tailored just for you. Let\'s get started! 🚀'
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

  // 切换 tab 的函数
  const switchTab = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
  };

  // 获取当前激活的 tab
  const activeTab = tabs.find(tab => tab.active);

  // 验证域名格式
  const validateDomain = (domain) => {
    // 简单验证域名格式 (xx.xx)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
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
    const cleanDomain = userInput.replace(/^https?:\/\//, '');
    setDomain(cleanDomain);
    
    // Clear input field
    setUserInput('');
    
    // Validate domain and start analysis
    if (!validateDomain(cleanDomain)) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          type: 'system', 
          content: 'Please enter a valid domain format (e.g., example.com)' 
        }]);
      }, 500);
      return;
    }
    
    // Start analysis process
    startAnalysis(cleanDomain);
  };
  
  const startAnalysis = (cleanDomain) => {
    // Clear previous results
    setWorkflowStage(null);
    
    const fullUrl = formatUrl(cleanDomain);
    
    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);
    
    // Add system thinking message
    setMessages(prev => [...prev, { 
      type: 'system', 
      content: `Starting analysis for ${cleanDomain}...`,
      isThinking: true
    }]);
    
    // 使用apiClient调用竞争对手研究方法
    apiClient.getCompetitorResearch(fullUrl)
      .then(data => {
        if (data) {
          // Process API response data
          handleResearchResults(data, cleanDomain);
        } else {
          // API call failed, show error message
          setMessages(prev => [...prev.slice(0, -1), { 
            type: 'system', 
            content: `Error analyzing ${cleanDomain}. Please try again later.`,
            isThinking: false
          }]);
          setLoading(false);
          setWorkflowStage(null);
        }
      })
      .catch(error => {
        console.error('Competitor research API call failed:', error);
        setMessages(prev => [...prev.slice(0, -1), { 
          type: 'system', 
          content: `Error analyzing ${cleanDomain}: ${error.message}`,
          isThinking: false
        }]);
        setLoading(false);
        setWorkflowStage(null);
      });
  };
  
  // New function to handle research results
  const handleResearchResults = (data, cleanDomain) => {
    // Update workflow state
    setWorkflowStage('completed');
    setWorkflowProgress(100);
    setLoading(false);
    
    // 直接使用API返回的数据更新消息
    setMessages(prev => [...prev.slice(0, -1), { 
      type: 'system', 
      content: data.message,
      isThinking: false
    }]);
    
    // 如果API返回了替代产品数据，则更新浏览器标签
    if (data.alternatives && data.alternatives.length > 0) {
      const newTabs = data.alternatives.slice(0, 5).map((alt, index) => ({
        id: index + 1,
        title: alt.name || `Alternative ${index + 1}`,
        url: alt.website || `https://${alt.domain}`,
        active: index === 0
      }));
      
      setTabs(newTabs);
      setShowBrowser(true);
    }
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
    // 为agent类型消息添加特殊处理
    if (message.type === 'agent') {
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
    
    return (
      <div 
        key={index} 
        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
        style={{animation: message.type === 'system' ? 'fadeIn 0.5s ease-out forwards' : ''}}
      >
        <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}
               style={{animation: message.type === 'system' ? 'bounceIn 0.6s ease-out forwards' : ''}}>
            {message.type === 'user' ? (
              <Avatar 
                size="small"
                icon={<UserOutlined />} 
                className="bg-blue-500"
              />
            ) : (
              <Avatar 
                size="small"
                src="/images/alternatively-favicon.png"
                className="bg-transparent"
              />
            )}
          </div>
          <div 
            className={`p-2 rounded-lg text-xs ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white/10 backdrop-blur-sm text-gray-100 rounded-tl-none'
            } ${message.isThinking ? 'border border-gray-400/30 animate-pulse' : ''} 
            transform transition-all duration-300`}
            style={{animation: message.type === 'user' ? 'slideInLeft 0.4s ease-out forwards' : 'slideInRight 0.4s ease-out forwards'}}
          >
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
  };
  
  // 新增 agents 数据
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
      name: 'Alexis.L',
      avatar: '/images/by.jpg',  // 使用指定的图片路径
      role: 'Verification Expert',
      description: 'Responsible for fact-checking and verifying information accuracy. I ensure all analyses are based on reliable and up-to-date data.'
    },
    {
      id: 4,
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
      
      // 开始逐步显示初始消息
      showInitialMessagesSequentially();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // 添加逐步显示初始消息的函数
  const showInitialMessagesSequentially = () => {
    // 设置第一条消息
    setMessages([initialMessages[0]]);
    setInitialMessagesShown(1);
    
    // 设置第二条消息
    setTimeout(() => {
      setMessages(prev => [...prev, initialMessages[1]]);
      setInitialMessagesShown(2);
      
      // 设置第三条消息
      setTimeout(() => {
        setMessages(prev => [...prev, initialMessages[2]]);
        setInitialMessagesShown(3);
      }, 1000);
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
            src="/images/alternatively-favicon.png" 
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
          <div className="h-10 px-4 border-b border-gray-300/20 flex items-center flex-shrink-0">
            <img src="/images/alternatively-favicon.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
            <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
          </div>
          
          <div className="flex-grow overflow-y-auto chat-messages-container" style={{ height: "calc(100% - 140px)" }}>
            <div className="p-4 pb-6">
              {messages.map((message, index) => renderChatMessage(message, index))}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-300/20 flex-shrink-0">
            <form onSubmit={handleUserInput} className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                placeholder="Enter your product's website URL (e.g., websitelm.com) to find alternatives"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={loading}
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
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 border-none"
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
                    className={`
                      flex items-center h-7 px-4 text-xs cursor-pointer
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