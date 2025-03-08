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
  
  // 修改初始消息数组，添加Deep Research提示
  const initialMessages = [
    { 
      type: 'agent', 
      agentId: 1,
      content: 'Welcome to Alternatively! Our research team is ready to help you discover and analyze SaaS alternatives.'
    },
    {
      type: 'agent',
      agentId: 1,
      content: 'I\'m Joey, your dedicated Research Specialist. I\'ll help you find alternatives to your product.'
    },
    {
      type: 'agent',
      agentId: 1,
      content: '👋 Hello there! I\'m excited to help you discover the perfect alternatives for your product!\n\nJust enter a product domain (e.g., websitelm.com) and I\'ll immediately get to work finding the best alternatives and generating a comprehensive analysis tailored just for you.\n\nPro tip: You can enable Deep Research mode for more comprehensive analysis and detailed insights! Let\'s get started! 🚀'
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
    
    // 设置消息发送状态为true
    setIsMessageSending(true);
    
    // Validate domain and start analysis
    if (!validateDomain(cleanDomain)) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          type: 'agent', 
          agentId: 1, // 使用Joey来提示错误
          content: 'Please enter a valid domain format (e.g., example.com). I need to verify a proper website address to proceed with our analysis.' 
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
  
  const startAnalysis = (cleanDomain) => {
    // Clear previous results
    setWorkflowStage(null);
    
    const fullUrl = formatUrl(cleanDomain);
    
    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);
    
    // 添加Joey的热情响应消息，追加到现有消息中，并根据模式调整内容
    setMessages(prev => [...prev, { 
      type: 'agent', 
      agentId: 1,
      content: deepResearchMode 
        ? `🔍 Fantastic! I'm launching a deep analysis of ${cleanDomain}! This comprehensive research will explore multiple data sources and provide detailed insights on alternatives, features, pricing, and market positioning. This might take a little longer, but the depth of analysis will be worth it! 💫`
        : `🔍 Fantastic! I'm on it! Analyzing ${cleanDomain} right now! I'll find the best alternatives and create a detailed comparison for you. This will only take a moment... 💫`,
      isThinking: true
    }]);
    
    // 使用apiClient调用竞争对手研究方法，传递deepResearchMode参数
    apiClient.getCompetitorResearch(fullUrl, deepResearchMode)
      .then(data => {
        if (data) {
          // Process API response data
          handleResearchResults(data, cleanDomain);
        } else {
          // API call failed, show error message
          // 先更新前一条消息，结束思考状态
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
          
          // 然后添加新的错误消息
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              type: 'agent', 
              agentId: 1,
              content: `😕 I'm sorry, but I encountered an issue while analyzing ${cleanDomain}. Could we try again? Sometimes these things happen with complex websites.`,
              isThinking: false
            }]);
            setLoading(false);
            setWorkflowStage(null);
            // 消息发送完毕，重置状态
            setIsMessageSending(false);
          }, 500);
        }
      })
      .catch(error => {
        console.error('Competitor research API call failed:', error);
        
        // 先更新前一条消息，结束思考状态
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
        
        // 然后添加新的错误消息
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            type: 'agent', 
            agentId: 1,
            content: `😓 Oh no! I ran into a technical problem while analyzing ${cleanDomain}: ${error.message}. Let's try again in a moment - I'm eager to help you find those alternatives!`,
            isThinking: false
          }]);
          setLoading(false);
          setWorkflowStage(null);
          // 消息发送完毕，重置状态
          setIsMessageSending(false);
        }, 500);
      });
  };
  
  // New function to handle research results
  const handleResearchResults = (data, cleanDomain) => {
    // Update workflow state
    setWorkflowStage('completed');
    setWorkflowProgress(100);
    setLoading(false);
    
    // 先更新前一条消息，结束思考状态
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
    
    // 延迟0.5秒后添加结果消息，显得更真实
    setTimeout(() => {
      // 使用Xavier作为详细分析专家来提供结果
      setMessages(prev => [...prev, { 
        type: 'agent', 
        agentId: 2, // Xavier作为Detail Analyst
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
      
      // 消息发送完毕，重置状态
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
  
  // 修改逐步显示初始消息的函数，在完成后重置消息发送状态
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
        
        // 所有初始消息显示完毕，重置消息发送状态
        setIsMessageSending(false);
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