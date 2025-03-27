'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';
import Typewriter from 'typewriter-effect';

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

const CodeTypingEffect = ({ code, speed = 3 }) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < code.length) {
      const timer = setTimeout(() => {
        const nextChunk = code.substring(currentIndex, currentIndex + 10);
        setDisplayedCode(prev => prev + nextChunk);
        setCurrentIndex(prev => Math.min(prev + 10, code.length));
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [code, currentIndex, speed]);
  
  return (
    <pre className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap leading-relaxed overflow-auto" 
         style={{ maxHeight: '300px' }}>
      {displayedCode}
      <span className="animate-pulse">▋</span>
    </pre>
  );
};

const CodeDisplay = () => {
  const [htmlCode, setHtmlCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/mock-data/html-codes.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load HTML code');
        }
        return response.text();
      })
      .then(data => {
        const normalizedHtml = data.replace(/\\n/g, '\n');
        
        const unescapedHtml = normalizedHtml
          .replace(/\\"/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
          
        setHtmlCode(unescapedHtml);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading HTML code:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);
  
  return (
    <div className="p-3">
      <div className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
        <div className="relative">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-blue-300 text-sm">Loading code...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error: {error}</div>
          ) : (
            <CodeTypingEffect code={htmlCode} speed={3} />
          )}
          <div className="absolute bottom-0 right-0 bg-gradient-to-t from-gray-800/50 to-transparent h-8 w-full pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

const ResearchTool = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [showBrowser, setShowBrowser] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [sourcesData, setSourcesData] = useState([]);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showDemo, setShowDemo] = useState(true);
  const [showInitialScreen, setShowInitialScreen] = useState(true);

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

      const announcement = `🎉 As a professional competitive analyst, I have found some potential competitors for you. I will share the list shortly and guide you through the next steps. Please hold on!`;

      setMessages(prev => [
        ...prev,
        {
          type: 'agent',
          agentId: 2,
          content: announcement,
          isThinking: false,
          source: 'agent'
        }
      ]);

      const response = await apiClient.chatWithAI(
        JSON.stringify(competitors),
        currentWebsiteId
      );

      if (response?.code === 200 && response.data?.answer) {
        const answer = filterMessageTags(response.data.answer);
        setMessages(prev => [
          ...prev,
          {
            type: 'agent',
            agentId: 2,
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
          agentId: 2,
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
      return <CodeDisplay />;
    }

    return (
      <div className="h-full flex flex-col">
        <CodeOutputDemo />
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
      </div>
    );
  };

  const initializeChat = async (userInput) => {
    try {
      setShowInitialScreen(false);
      setLoading(true);

      const searchResponse = await apiClient.searchCompetitor(
        userInput,
        deepResearchMode
      );

      if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
        const websiteId = searchResponse.data.websiteId;
        setCurrentWebsiteId(websiteId);
        
        const greetingResponse = await apiClient.chatWithAI(
          userInput,
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
    } finally {
      setLoading(false);
    }
  };

  const renderInitialScreen = () => {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-2xl w-full px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-6">
              Welcome to <span className="text-blue-400">Alternatively</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Which product would you like to analyze and create an SEO-friendly Alternatively Page for?
            </p>
          </div>
          <div className="relative">
            <Input
              placeholder="Enter product website URL (e.g., example.com)"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="bg-white/10 border border-gray-300/30 rounded-xl text-lg"
              style={{ 
                color: 'black', 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                height: '64px',
                paddingLeft: '24px',
                paddingRight: '120px',
                transition: 'all 0.3s ease'
              }}
              prefix={
                <SearchOutlined 
                  style={{ 
                    color: 'rgba(0, 0, 0, 0.45)',
                    fontSize: '20px'
                  }} 
                />
              }
              onPressEnter={(e) => {
                e.preventDefault();
                if (userInput.trim()) {
                  initializeChat(userInput);
                }
              }}
            />
            <button
              onClick={() => {
                if (userInput.trim()) {
                  initializeChat(userInput);
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-3 text-base bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl 
                       backdrop-blur-sm transition-all flex items-center gap-2 border border-blue-500/30 hover:shadow-blue-500/20"
            >
              <ArrowRightOutlined className="w-5 h-5" />
              Start Analysis
            </button>
          </div>
          <div className="mt-6 text-center text-gray-400 text-sm">
            Enter your product website URL, and we'll help you find the best competitors and create an SEO-optimized page
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!initialLoading) {
      // 移除自动初始化
      // initializeChat(); // 注释掉这行
    }
  }, [initialLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemo(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

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

  if (showInitialScreen) {
    return renderInitialScreen();
  }

  return (
    <ConfigProvider wave={{ disabled: true }}>
      {contextHolder}
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
                    text-white flex items-center justify-center p-4 relative overflow-hidden" 
           style={{ paddingTop: "80px" }}>
        
        <div className="absolute inset-0" style={{ paddingTop: "80px" }}>
          <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          <div className={`${showBrowser ? 'hidden' : 'w-[70%]'} relative flex flex-col`}>
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

            <div className="h-10 px-4 border-b border-gray-300/20 flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
            </div>

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

                    <button
                    onClick={handleCompetitorListRequest}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-full 
                             backdrop-blur-sm transition-all flex items-center gap-1.5 border border-green-500/30"
                    disabled={isMessageSending}
                  >
                    <SendOutlined className="w-3.5 h-3.5" />
                    Mock Getting Competitors
                  </button>

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
          
          <div className={`${showBrowser ? 'flex-1' : 'hidden'} relative flex flex-col`}>
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
              style={{ height: '600px' }}
            />
          </div>
          
          <div className="w-[30%] bg-white/5 backdrop-blur-lg rounded-2xl border border-gray-300/20 shadow-xl 
                          flex flex-col h-full relative">
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