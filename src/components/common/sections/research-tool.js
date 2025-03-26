'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';

const AGENTS = [
  {
    id: 1,
    name: 'Joey.Z',
    avatar: '/images/zy.jpg',
    role: 'Program Manager',
    description: 'Responsible for project management, resource allocation, and overall project coordination.'
  },
  {
    id: 2,
    name: 'Youssef',
    avatar: '/images/youssef.jpg',
    role: 'Competitor Analyst',
    description: 'Specializes in competitor discovery and scoring analysis. Responsible for market research and competitor evaluation.'
  }
];

// 修改 TAG_FILTERS 字典
const TAG_FILTERS = {
  '\\[URL_GET\\]': '',  // 过滤 [URL_GET]
};

const ResearchTool = () => {
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [showBrowser, setShowBrowser] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [totalDetails, setTotalDetails] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(300);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [sourcesData, setSourcesData] = useState([]);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const [currentTaskType, setCurrentTaskType] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isStyleOperationActive, setStyleOperationActive] = useState(false);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleTabChange = (tabId) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      active: tab.id === tabId
    })));
    setActiveTabId(tabId);
  };

  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    return filteredMessage;
  };

  const handleUserInput = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!userInput.trim()) return;
    
    const newMessages = [...messages, { 
      type: 'user', 
      content: userInput,
      source: 'user'
    }];
    setMessages(newMessages);
    setUserInput('');
    setIsMessageSending(true);

    try {
      const response = await apiClient.chatWithAI(
        userInput,
        currentWebsiteId
      );

      if (response?.code === 200 && response.data?.answer) {
        const answer = filterMessageTags(response.data.answer);
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            agentId: 1,
            content: answer,
            isThinking: false,
            source: 'agent'
          }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          agentId: 1,
          content: `⚠️ Failed to get response: ${error.message}`,
          isThinking: false,
          source: 'agent'
        }
      ]);
    } finally {
      setIsMessageSending(false);
    }
  };
  
  const handleCompetitorListRequest = async () => {
    setIsMessageSending(true);
    
    try {
      const competitors = [
        { name: 'seo.ai', url: 'https://surferseo.com' },
        { name: 'aiseo.ai', url: 'https://writesonic.com' }
      ];

      // 生成友好的公告信息
      const announcement = `🎉 As a professional competitive analyst, I have found some potential competitors for you. I will share the list shortly and guide you through the next steps. Please hold on!`;

      // 使用 Youssef 发送消息
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          agentId: 2,  // 使用 Youssef 的 ID
          content: announcement,
          isThinking: false,
          source: 'agent'
        }
      ]);

      // 将竞品列表通过 message 传递
      const response = await apiClient.chatWithAI(
        JSON.stringify(competitors), // 将竞品列表作为消息内容
        currentWebsiteId
      );

      if (response?.code === 200 && response.data?.answer) {
        const answer = filterMessageTags(response.data.answer);
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            agentId: 2,  // 使用 Youssef 的 ID
            content: answer,
            isThinking: false,
            source: 'agent'
          }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          agentId: 2,  // 使用 Youssef 的 ID
          content: `Sorry, I encountered an error: ${error.message}`,
          isThinking: false,
          source: 'agent'
        }
      ]);
    } finally {
      setIsMessageSending(false);
    }
  };

  const renderChatMessage = (message, index) => {
    if (message.source === 'user') {
      return (
        <div 
          key={index} 
          className="flex justify-end mb-8"
          style={{animation: 'fadeIn 0.5s ease-out forwards'}}
        >
          <div className="flex max-w-[80%] flex-row-reverse group">
            <div className="flex-shrink-0 ml-4">
              <div className="relative" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
                <Avatar 
                  size={40}
                  icon={<UserOutlined />} 
                  className="bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-transparent
                           group-hover:border-blue-300/50 transition-colors duration-300"
                />
              </div>
            </div>
            <div className="relative">
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-blue-500 to-blue-600 
                            text-white shadow-xl backdrop-blur-sm
                            hover:shadow-blue-500/20 transition-all duration-300
                            rounded-tr-none transform hover:-translate-y-0.5">
                <div className="relative z-10">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="absolute -right-1 top-0 w-2 h-2 bg-blue-500 transform rotate-45"></div>
            </div>
          </div>
        </div>
      );
    } else {
      const agent = AGENTS.find(a => a.id === message.agentId) || AGENTS[0];
      const hasUrlGet = message.content.includes('[URL_GET]');
      const filteredContent = filterMessageTags(message.content);

      // 修复URL_GET动画显示问题
      const showUrlGetAnimation = hasUrlGet && (message.isThinking || message.content.includes('Processing'));

      return (
        <div key={index} className="flex justify-start mb-8" style={{animation: 'fadeIn 0.5s ease-out forwards'}}>
          <div className="flex max-w-[80%] flex-row group">
            <div className="flex-shrink-0 mr-4" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
              <div className="relative">
                <Avatar 
                  size={40}
                  src={agent.avatar}
                  className="border-2 border-transparent group-hover:border-blue-400/50 transition-colors duration-300"
                />
                {message.isThinking && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 left-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-blue-300">{agent.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
                    {agent.role}
                  </span>
                </div>
              </div>
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-gray-800/95 to-gray-900/95 
                            text-gray-100 shadow-xl backdrop-blur-sm border border-white/10 
                            hover:border-blue-500/30 transition-all duration-300
                            rounded-tl-none transform hover:-translate-y-0.5">
                <div className="relative z-10">
                  {filteredContent.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < filteredContent.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {showUrlGetAnimation && (
                  <div className="flex space-x-1.5 mt-3 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
              <div className="absolute -left-1 top-0 w-2 h-2 bg-gradient-to-br from-gray-800 to-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      );
    }
  };

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

  useEffect(() => {
    if (chatEndRef.current && messages.length > 1) {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  const toggleDeepResearchMode = () => {
    setDeepResearchMode(!deepResearchMode);
  };

  const renderDetails = (details) => {
    if (!details || details.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4 text-xs">
          No details available
        </div>
      );
    }

    return (
      <div className="p-3 space-y-2">
        {details.map((detail, index) => {
          const { data, event, created_at } = detail;
          const { title, status, outputs } = data || {};
          
          return (
            <div 
              key={index} 
              className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
            >
              <div className="text-[11px] text-gray-300 font-medium">{title || event}</div>
              {status && (
                <div className={`text-[10px] mt-1.5 ${
                  status === "succeeded" ? "text-green-500" : 
                  status === "failed" ? "text-red-500" : 
                  "text-gray-400"
                }`}>
                  {status}
                </div>
              )}
              {outputs && (
                <div className="text-[10px] text-gray-400 mt-1.5 break-words leading-relaxed">
                  {typeof outputs === 'string' ? outputs : JSON.stringify(outputs)}
                </div>
              )}
              <div className="text-[9px] text-gray-500 mt-1.5">
                {new Date(created_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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

  const initializeChat = async () => {
    try {
      // 如果已经有websiteId，直接返回
      if (currentWebsiteId) return;

      // 执行搜索获取websiteId
      const searchResponse = await apiClient.searchCompetitor(
        'default', // 使用默认搜索词
        deepResearchMode
      );

      if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
        const websiteId = searchResponse.data.websiteId;
        setCurrentWebsiteId(websiteId);
        
        // 发送空消息获取招呼消息
        const greetingResponse = await apiClient.chatWithAI(
          ' ',
          websiteId,
        );
        
        if (greetingResponse?.code === 200 && greetingResponse.data?.answer) {
          const answer = filterMessageTags(greetingResponse.data.answer);
          setMessages([
            {
              type: 'agent',
              agentId: 1,
              content: answer,
              isThinking: false
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Initialize chat failed:', error);
      setMessages([
        {
          type: 'agent',
          agentId: 1,
          content: `⚠️ Failed to initialize chat: ${error.message}`,
          isThinking: false
        }
      ]);
    }
  };

  useEffect(() => {
    // 在组件加载时执行初始化
    if (!initialLoading) {
      initializeChat();
    }
  }, [initialLoading]);

  if (initialLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
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

  return (
    <ConfigProvider wave={{ disabled: true }}>
      {contextHolder}
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
                    text-white flex items-center justify-center p-4 relative overflow-hidden" 
           style={{ paddingTop: "80px" }}>
        <style>{animationStyles}</style>
        
        <div className="absolute inset-0" style={{ paddingTop: "80px" }}>
          <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
        </div>
        
        {/* Chat container */}
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          {/* Left panel - Chat */}
          <div className={`${showBrowser ? 'hidden' : 'flex-1'} relative flex flex-col`}>
            {/* Open Browser button */}
            <div className="absolute top-3 right-4 z-50 flex gap-2">
              <button
                onClick={() => setShowBrowser(true)}
                className="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full 
                         backdrop-blur-sm transition-all flex items-center gap-1.5 border border-purple-500/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 4l-4 4 4 4"/>
                </svg>
                Open Browser
              </button>
            </div>

            {/* Header */}
            <div className="h-10 px-4 border-b border-gray-300/20 flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto pt-12 px-4 pb-4 chat-messages-container">
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

            {/* Input area */}
            <div className="p-4 border-t border-gray-300/20 flex-shrink-0">
              <div className="max-w-[600px] mx-auto">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    placeholder={deepResearchMode 
                      ? "Enter website for comprehensive analysis..." 
                      : "Enter your product URL (e.g., websitelm.com)"}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending || isStyleOperationActive}
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
                    onPressEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (userInput.trim()) {
                        handleUserInput(e);
                      }
                    }}
                  />
                  
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <div className="flex items-center space-x-4">
                    {/* Deep research toggle */}
                    <button 
                      type="button"
                      className={`flex items-center px-2 py-1 rounded-full text-xs transition-all duration-200 
                        ${loading || isMessageSending || isStyleOperationActive 
                          ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-600' 
                          : deepResearchMode
                            ? 'bg-purple-500 text-white hover:bg-purple-600' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      onClick={() => {
                        if (!loading && !isMessageSending && !isStyleOperationActive) {
                          toggleDeepResearchMode();
                        }
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full mr-1.5 transition-colors ${
                        deepResearchMode ? 'bg-white' : 'bg-gray-500'
                      }`}></span>
                      Deep
                    </button>

                    <button
                    onClick={handleCompetitorListRequest}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-full 
                             backdrop-blur-sm transition-all flex items-center gap-1.5 border border-green-500/30"
                    disabled={isMessageSending}
                  >
                    <SendOutlined className="w-3.5 h-3.5" />
                    Mock Getting Competitors
                  </button>

                    {/* Mode description */}
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
          
          {/* Middle panel - Browser */}
          <div className={`${showBrowser ? 'flex-1' : 'hidden'} relative flex flex-col`}>
            {/* Keep existing Back to Chat button */}
            <div className="absolute top-3 right-4 z-50 flex gap-2">
              <button
                onClick={() => setShowBrowser(false)}
                className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-full 
                         backdrop-blur-sm transition-all flex items-center gap-1.5 border border-blue-500/30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v0M3 10l6 6m-6-6l6-6"/>
                </svg>
                Back to Chat
              </button>
            </div>
            <BrowserSimulator 
              tabs={tabs}
              activeTab={activeTabId}
              onTabChange={handleTabChange}
              style={{ height: '600px' }}
            />
          </div>
          
          {/* Right panel - Analysis */}
          <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                          flex flex-col h-full relative">
            {/* 面板头部保持不变 */}
            <div className="border-b border-gray-300/20 p-3">
              <div className="flex justify-between">
                <button 
                  onClick={() => setRightPanelTab('details')} 
                  className={`text-sm ${
                    rightPanelTab === 'details' 
                      ? 'text-blue-400 font-medium' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Details
                </button>
                <button 
                  onClick={() => setRightPanelTab('sources')} 
                  className={`text-sm ${
                    rightPanelTab === 'sources' 
                      ? 'text-blue-400 font-medium' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sources
                </button>
              </div>
            </div>
            
            {/* 内容区域保持不变 */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && renderDetails(detailsData)}
              {rightPanelTab === 'sources' && renderSources()}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ResearchTool;