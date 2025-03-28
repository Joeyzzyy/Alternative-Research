'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination, Dropdown, Menu } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined, HistoryOutlined, LoadingOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import BrowserSimulator from '../BrowserSimulator';
import Typewriter from 'typewriter-effect';
import { EventSourcePolyfill } from 'event-source-polyfill';
import MessageHandler from '../../../utils/MessageHandler';

// 修改 TAG_FILTERS 字典
const TAG_FILTERS = {
  '\\[URL_GET\\]': '',  // 过滤 [URL_GET]
  '\\[COMPETITOR_SELECTED\\]': '',  // 过滤 [COMPETITOR_SELECTED]
};

const ALTERNATIVELY_LOGO = '/images/alternatively-logo.png'; // 假设这是Alternatively的logo路径

// 修改背景配置，增强吉卜力风格
const BACKGROUNDS = {
  DEFAULT: {
    type: 'gradient',
    value: 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
    overlay: 'bg-transparent'
  },
  GHIBLI: {
    type: 'image',
    value: 'url("/images/GHIBLI.png")',
    overlay: 'bg-slate-950/60 backdrop-blur-sm',
    buttonStyle: 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border-amber-500/40 hover:border-amber-400/60',
    inputStyle: 'border-amber-400/30 focus:border-amber-300/50 shadow-amber-700/20',
    cardStyle: 'border-amber-500/30 hover:border-amber-400/50 shadow-amber-700/20'
  }
};

const CodeTypingEffect = ({ code, speed = 3 }) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < code.length) {
      const timer = setTimeout(() => {
        if (code[currentIndex] === '<') {
          const tagEndIndex = code.indexOf('>', currentIndex);
          if (tagEndIndex !== -1) {
            const tag = code.substring(currentIndex, tagEndIndex + 1);
            setDisplayedCode(prev => prev + tag);
            setCurrentIndex(tagEndIndex + 1);
            return;
          }
        }
        
        setDisplayedCode(prev => prev + code[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [code, currentIndex, speed]);

  return (
    <pre className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap leading-relaxed overflow-auto" 
         style={{ maxHeight: '600px' }}>
      <div>{displayedCode}</div>
      <span className="animate-blink">▋</span>
    </pre>
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
  const [logs, setLogs] = useState([]);
  const competitorListProcessedRef = useRef(false);
  const [canProcessCompetitors, setCanProcessCompetitors] = useState(false);
  const [browserTabs, setBrowserTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Add a state to track if input should be disabled due to URL_GET
  const [inputDisabledDueToUrlGet, setInputDisabledDueToUrlGet] = useState(false);

  // Add a state for validation error
  const [validationError, setValidationError] = useState('');

  // Add a ref to store the last processed log ID
  const lastProcessedLogIdRef = useRef(null);

  const [currentBackground, setCurrentBackground] = useState('GHIBLI'); // 默认使用普通背景
  
  const messageHandler = new MessageHandler(setMessages);

  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    return filteredMessage;
  };

  // Function to validate domain format
  const validateDomain = (input) => {
    // Remove https:// or http:// if present
    let domain = input.trim();
    if (domain.startsWith('http://')) domain = domain.substring(7);
    if (domain.startsWith('https://')) domain = domain.substring(8);
    
    // Remove www. if present
    if (domain.startsWith('www.')) domain = domain.substring(4);
    
    // Basic domain validation regex
    // This checks for at least one character, followed by a dot, followed by at least two characters
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    return domainRegex.test(domain);
  };

  // Add a useEffect to reset inputDisabledDueToUrlGet when messages are updated
  useEffect(() => {
    // Only reset if there are messages and input is currently disabled
    if (messages.length > 0 && inputDisabledDueToUrlGet) {
      // Check if the last message is not from the system and not a thinking message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.source !== 'system' && !lastMessage.isThinking) {
        setInputDisabledDueToUrlGet(false);
      }
    }
  }, [messages]);

  const handleUserInput = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!userInput.trim() || isMessageSending) return;

    const formattedInput = showInitialScreen && !userInput.trim().startsWith('http') 
      ? `https://${userInput.trim()}`
      : userInput.trim();

    // Add user message
    messageHandler.addUserMessage(formattedInput);
    // Add agent thinking message
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();
    setUserInput('');
    setIsMessageSending(true);

    try {
      const response = await apiClient.chatWithAI(formattedInput, currentWebsiteId);

      if (response?.code === 200 && response.data?.answer) {
        const rawAnswer = response.data.answer;

        if (rawAnswer.includes('[URL_GET]')) {
          setInputDisabledDueToUrlGet(true);
          // Update agent message
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          // Add system message
          messageHandler.addSystemMessage('Searching for competitors. Please wait a moment...');
        } else if (rawAnswer.includes('[COMPETITOR_SELECTED]')) {
          const messageBody = rawAnswer.replace(/\[COMPETITOR_SELECTED\].*$/s, '').trim();
          
          messageHandler.updateAgentMessage(messageBody, thinkingMessageId);
          
          const competitorArrayMatch = rawAnswer.match(/\[COMPETITOR_SELECTED\]\s*(\[.*?\])$/s);
          
          if (competitorArrayMatch && competitorArrayMatch[1]) {
            // Parse JSON array
            const competitorArrayString = competitorArrayMatch[1].trim();
            
            try {
              // Parse the competitor array
              let competitors = JSON.parse(competitorArrayString);
              
              // Ensure competitors is an array of strings (domains only)
              if (!Array.isArray(competitors)) {
                competitors = [competitors];
              }
              
              // Extract domain names only (no objects)
              const domainArray = competitors.map(comp => {
                if (typeof comp === 'string') {
                  // Remove http/https and trailing slashes if present
                  return comp.replace(/^https?:\/\//, '').replace(/\/$/, '');
                }
                return comp;
              });
              
              // Call generate API with domain array
              const generateResponse = await apiClient.generateAlternative(currentWebsiteId, domainArray);
              
              if (generateResponse?.code === 200) {
                messageHandler.addSystemMessage(`We are generating alternative solutions for ${domainArray.join(', ')}. This may take some time, please wait...`);
              } else {
                messageHandler.addSystemMessage(`⚠️ Failed to generate alternative: Invalid server response`);
              }
            } catch (parseError) {
              messageHandler.addSystemMessage(`⚠️ Failed to process competitor selection: ${parseError.message}`);
            }
          } else {
            throw new Error('Could not extract competitor array from response');
          }
        } else {
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
        }
      } else {
        messageHandler.updateAgentMessage('⚠️ Failed to get valid response from server', thinkingMessageId);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setIsMessageSending(false);
    }
  };

  const handleCompetitorListRequest = async (competitors) => {
    setIsMessageSending(true);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();

    try {
      const response = await apiClient.chatWithAI(JSON.stringify(competitors), currentWebsiteId);

      if (response?.code === 200 && response.data?.answer) {
        const answer = filterMessageTags(response.data.answer);
        messageHandler.updateAgentMessage(answer, thinkingMessageId);
      } else {
        messageHandler.updateAgentMessage('⚠️ Failed to generate alternatives: Invalid response from server', thinkingMessageId);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setIsMessageSending(false);
      setInputDisabledDueToUrlGet(false); // 确保重新启用输入
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
      const filteredContent = filterMessageTags(message.content);

      return (
        <div key={index} className="flex justify-start mb-8" style={{animation: 'fadeIn 0.5s ease-out forwards'}}>
          <div className="flex max-w-[80%] flex-row group">
            <div className="flex-shrink-0 mr-4" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
              <div className="relative">
                <Avatar 
                  size={40}
                  src={ALTERNATIVELY_LOGO}
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
              <div className="absolute -top-6 left-0 w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-blue-300 whitespace-nowrap">Alternatively</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-slate-800 to-slate-900 
                            text-white shadow-xl backdrop-blur-sm
                            hover:shadow-slate-500/20 transition-all duration-300
                            rounded-tl-none transform hover:-translate-y-0.5">
                <div className="relative z-10">
                  {message.isThinking ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    filteredContent.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < filteredContent.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
              <div className="absolute -left-1 top-0 w-2 h-2 bg-slate-800 transform rotate-45"></div>
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
    const reversedLogs = [...logs].reverse();

    return (
      <div className="h-full flex flex-col">
        <div className="p-3 space-y-2 overflow-y-auto">
          {reversedLogs.map((log, index) => {
            // 解析Dify类型的content
            const difyContent = log.type === 'Dify' ? JSON.parse(log.content) : null;
            
            return (
              <div key={index} className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                <div className="flex items-center mb-2">
                  {log.type === 'Dify' && (
                    <img src="/images/dify.png" alt="Dify" className="w-4 h-4 mr-2" />
                  )}
                  {log.type === 'Error' && (
                    <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {log.type === 'API' && (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                  {log.type === 'Codes' && (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 4l-4 4 4 4" />
                    </svg>
                  )}
                  {log.type === 'Info' && (
                    <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div className="text-[11px] text-gray-300 font-medium">
                    {log.type === 'Dify' && 'Dify Workflow'}
                    {log.type === 'Error' && 'Error Message'}
                    {log.type === 'API' && 'API Request'}
                    {log.type === 'Codes' && 'Code Execution'}
                    {log.type === 'Info' && 'Information'}
                  </div>
                </div>

                {/* 显示step字段 */}
                {log.step && (
                  <div className="mb-1 text-[10px] text-gray-400">
                    <span className="font-semibold">Step:</span> {log.step}
                  </div>
                )}

                {log.type === 'Info' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    {log.content.planningId && (
                      <div className="mb-1">
                        <span className="font-semibold">Planning ID:</span> {log.content.planningId}
                      </div>
                    )}
                    <div className="mb-1">
                      <span className="font-semibold">Status:</span> {log.content.status}
                    </div>
                  </div>
                ) : log.type === 'Dify' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    <div className="mb-1">
                      <span className="font-semibold">Workflow ID:</span> {difyContent.workflow_id}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Task ID:</span> {difyContent.task_id}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Status:</span> {difyContent.data?.status || 'Started'}
                    </div>
                    {difyContent.data?.outputs && (
                      <div className="mb-1">
                        <span className="font-semibold">Outputs:</span>
                        <pre className="mt-1 p-2 bg-gray-700/50 rounded text-xs overflow-auto">
                          {JSON.stringify(difyContent.data.outputs, null, 2)}
                        </pre>
                      </div>
                    )}
                    {difyContent.data?.elapsed_time > 0 && (
                      <div className="mb-1">
                        <span className="font-semibold">Elapsed Time:</span> {difyContent.data.elapsed_time}s
                      </div>
                    )}
                  </div>
                ) : log.type === 'API' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    {log.content?.status && (
                      <div className="mb-1">
                        <span className="font-semibold">Status:</span> {log.content.status}
                      </div>
                    )}
                    {log.content?.data && (
                      <div className="mb-1">
                        <span className="font-semibold">Data:</span>
                        <pre className="mt-1 p-2 bg-gray-700/50 rounded text-xs overflow-auto">
                          {JSON.stringify(log.content.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : log.type === 'Codes' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    {log.content?.html && (
                      <div className="mb-1">
                        <span className="font-semibold">Code:</span>
                        <div className="mt-1 p-2 bg-gray-700/50 rounded text-xs overflow-auto">
                          <CodeTypingEffect 
                            code={log.content.html} 
                            speed={3}
                            language="html"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="text-[9px] text-gray-500 mt-1.5">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 切换背景函数
  const toggleBackground = () => {
    setCurrentBackground(prev => prev === 'GHIBLI' ? 'DEFAULT' : 'GHIBLI');
  };

  // 获取当前背景配置
  const getBackgroundStyle = () => {
    const bg = BACKGROUNDS[currentBackground];
    if (bg.type === 'image') {
      return { backgroundImage: bg.value };
    }
    return {};
  };

  // 获取当前背景类名
  const getBackgroundClass = () => {
    const bg = BACKGROUNDS[currentBackground];
    return bg.type === 'gradient' ? bg.value : '';
  };

  // 获取覆盖层类名
  const getOverlayClass = () => {
    return BACKGROUNDS[currentBackground].overlay;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemo(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 添加CSS动画样式
    const style = document.createElement('style');
    style.innerHTML = `
      .fade-out-animation {
        animation: fadeOut 0.6s ease-out forwards;
      }
      
      @keyframes fadeOut {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.98); }
      }
      
      .chat-messages-container {
        opacity: 0;
        animation: fadeIn 0.6s ease-out forwards;
      }
      
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .form-transition {
        transition: all 0.4s ease-out;
      }
      
      .form-transition.fade-out {
        opacity: 0;
        transform: translateY(20px);
      }
      
      .loading-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(to bottom, #0f172a, #1e293b, #0f172a);
        z-index: 9999;
        opacity: 0;
        animation: fadeInOut 1.2s ease-out forwards;
      }
      
      @keyframes fadeInOut {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
      
      .loading-spinner {
        width: 60px;
        height: 60px;
        border: 3px solid rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        border-top-color: rgba(59, 130, 246, 0.8);
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        margin-top: 20px;
        color: white;
        font-size: 16px;
      }
      
      .text-shadow {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
      
      /* 修复历史面板的样式问题 */
      .history-dropdown .ant-dropdown-menu {
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      
      .history-dropdown .ant-dropdown-menu-item {
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }
      
      .history-dropdown .ant-dropdown-menu-item:hover {
        background: transparent !important;
      }
      
      .history-dropdown .ant-dropdown-menu-item-active {
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const initializeChat = async (userInput) => {
    try {
      // 1. Fade out form
      const formElement = document.querySelector('.initial-screen-content form');
      if (formElement) {
        formElement.classList.add('form-transition', 'fade-out');
      }
      
      // 2. Fade out initial screen
      setTimeout(() => {
        const initialScreenElement = document.querySelector('.initial-screen-container');
        if (initialScreenElement) {
          initialScreenElement.classList.add('fade-out-animation');
          
          setTimeout(() => {
            setShowInitialScreen(false);
            
            // 3. Show loading animation
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'loading-container';
            
            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            loadingContainer.appendChild(loadingSpinner);
            
            const loadingText = document.createElement('div');
            loadingText.className = 'loading-text';
            loadingText.textContent = 'Analyzing your product...';
            loadingContainer.appendChild(loadingText);
            
            document.body.appendChild(loadingContainer);
            
            // 4. Remove loading animation, enter chat interface
            setTimeout(() => {
              document.body.removeChild(loadingContainer);
            }, 1200);
          }, 500);
        } else {
          setShowInitialScreen(false);
        }
      }, 300);
      
      setLoading(true);

      const formattedInput = showInitialScreen && !userInput.trim().startsWith('http') 
        ? `https://${userInput.trim()}`
        : userInput.trim();
      
      // 保存用户输入的内容用于API请求
      const inputForAPI = formattedInput;
      
      // 清除输入框
      setUserInput('');
      
      // 添加用户消息
      messageHandler.addUserMessage(formattedInput);
      
      // 等待用户消息处理完成
      while (messageHandler.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 添加思考消息
      const thinkingMessageId = messageHandler.addAgentThinkingMessage();
      
      // 等待思考消息处理完成
      while (messageHandler.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const searchResponse = await apiClient.searchCompetitor(
        inputForAPI,
        deepResearchMode
      );

      if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
        const websiteId = searchResponse.data.websiteId;
        setCurrentWebsiteId(websiteId);
        
        const greetingResponse = await apiClient.chatWithAI(
          formattedInput,
          websiteId,
        );
        
        if (greetingResponse?.code === 200 && greetingResponse.data?.answer) {
          const answer = filterMessageTags(greetingResponse.data.answer);
          
          if (greetingResponse.data.answer.includes('[URL_GET]')) {
            setInputDisabledDueToUrlGet(true);
            messageHandler.updateAgentMessage(answer, thinkingMessageId);

            while (messageHandler.isProcessing) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            messageHandler.addSystemMessage('Searching for competitors. Please wait a moment...');

            while (messageHandler.isProcessing) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            setCanProcessCompetitors(true);
          } else {
            messageHandler.updateAgentMessage(answer, thinkingMessageId);
          }
        }
      }
    } catch (error) {
      messageHandler.updateAgentMessage(`⚠️ Failed to initialize chat: ${error.message}`, thinkingMessageId);
    } finally {
      setLoading(false);
    }
  };

  // 修改 SSE 连接的 useEffect
  useEffect(() => {
    const customerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    
    // 只有在用户登录且有token和customerId时才连接
    if (!isLoggedIn || !customerId || !token) {
      return;
    }
    
    let eventSource = null;
    let retryCount = 0;
    let retryTimeout = null;
    const MAX_RETRY_COUNT = 5;
    
    const connectSSE = () => {
      // 关闭现有连接
      if (eventSource) {
        eventSource.close();
      }
      
      // 获取最新token
      const currentToken = localStorage.getItem('alternativelyAccessToken');
      if (!currentToken) return;
      
      eventSource = new EventSourcePolyfill(`https://api.websitelm.com/events/${customerId}-chat`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        heartbeatTimeout: 15 * 45000
      });

      eventSource.onopen = () => {
        console.log('SSE connection established');
        // 连接成功后重置重试计数
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          console.log('Received log from server:', logData);
          setLogs(prevLogs => [...prevLogs, logData]);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        
        // 关闭当前连接
        eventSource.close();
        
        // 检查是否是401错误
        if (error.status === 401) {
          console.log('SSE connection unauthorized, token may be invalid');
          // 不需要额外处理，因为API拦截器会清除token
          return;
        }
        
        // 实现指数退避重试策略
        if (retryCount < MAX_RETRY_COUNT) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // 最大30秒
          console.log(`Retrying SSE connection in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRY_COUNT})`);
          
          clearTimeout(retryTimeout);
          retryTimeout = setTimeout(() => {
            retryCount++;
            connectSSE();
          }, delay);
        } else {
          console.log(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Giving up.`);
        }
      };
    };
    
    // 初始连接
    connectSSE();
    
    // 监听token过期事件
    const handleTokenExpired = () => {
      console.log('Token expired, closing SSE connection');
      if (eventSource) {
        eventSource.close();
      }
    };
    
    // 添加网络状态监听，在网络恢复时重连
    const handleNetworkChange = () => {
      if (navigator.onLine) {
        console.log('Network connection restored, reconnecting SSE');
        connectSSE();
      } else {
        console.log('Network connection lost, SSE will reconnect when online');
        if (eventSource) {
          eventSource.close();
        }
      }
    };
    
    window.addEventListener('tokenExpired', handleTokenExpired);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    
    return () => {
      console.log('Closing SSE connection');
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(retryTimeout);
      window.removeEventListener('tokenExpired', handleTokenExpired);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    // 检查是否有符合条件的 API 请求
    const apiLog = logs.find(log => 
      log.type === 'API' && 
      log.step === 'GET_RESULT_COMPETITORS_SEMRUSH_API' &&
      log.content?.status === 'finished'
    );

    if (apiLog && apiLog.content?.data && !competitorListProcessedRef.current && canProcessCompetitors) {
      competitorListProcessedRef.current = true; 
      const competitors = apiLog.content.data.map(domain => ({
        name: domain,
        url: `https://${domain}`
      }));

      handleCompetitorListRequest(competitors);
    }
  }, [logs, canProcessCompetitors]);
  // 组件卸载时重置标记
  useEffect(() => {
    return () => {
      competitorListProcessedRef.current = false;
    };
  }, []);

  // 修改 useEffect 来检查日志中的 resultId
  useEffect(() => {
    // 找到最新的包含 resultId 的 Codes 类型日志
    const codesLog = logs.find(log => 
      log.type === 'Codes' && 
      log.content?.resultId &&
      log.id !== lastProcessedLogIdRef.current // 确保不是已处理的日志
    );

    if (codesLog && codesLog.content?.resultId) {
      // 记录这个日志 ID 已经被处理过
      lastProcessedLogIdRef.current = codesLog.id;
      
      console.log('Opening result page for log ID:', codesLog.id, 'with resultId:', codesLog.content.resultId);
      
      // 使用您原有的 URL 拼接方法
      const resultPageUrl = `https://preview.websitelm.site/en/${codesLog.content.resultId}`;
      
      // 检查是否已经有相同 URL 的标签页
      const existingTab = browserTabs.find(tab => tab.url === resultPageUrl);
      if (existingTab) {
        // 如果已存在，只切换到该标签页
        setActiveTab(existingTab.id);
        setShowBrowser(true);
        return;
      }
      
      // 创建新标签页
      const newTab = {
        id: `result-${Date.now()}`,
        title: `Result Page`,
        url: resultPageUrl
      };
      
      // 添加新标签页并设置为活动标签
      setBrowserTabs(prev => [...prev, newTab]);
      setActiveTab(newTab.id);
      
      // 自动切换到浏览器界面
      setShowBrowser(true);
    }
  }, [logs, browserTabs]);

  // 获取当前主题的按钮样式
  const getButtonStyle = () => {
    return currentBackground === 'GHIBLI' 
      ? BACKGROUNDS.GHIBLI.buttonStyle 
      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30';
  };
  
  // 获取当前主题的输入框样式
  const getInputStyle = () => {
    return currentBackground === 'GHIBLI'
      ? BACKGROUNDS.GHIBLI.inputStyle
      : 'border-gray-300/30';
  };
  
  // 获取当前主题的卡片样式
  const getCardStyle = () => {
    return currentBackground === 'GHIBLI'
      ? BACKGROUNDS.GHIBLI.cardStyle
      : '';
  };

  // 修改 fetchHistoryList 函数来处理新的数据格式
  const fetchHistoryList = async () => {
    setLoadingHistory(true);
    try {
      const response = await apiClient.getAlternativeWebsiteList();
      if (response?.code === 200 && response.data) {
        // 转换数据格式以适配新的API响应
        const formattedHistory = response.data.map(item => ({
          websiteId: item.websiteId,
          domain: item.website || 'Unknown website',
          createdAt: item.generatedStart || new Date().toISOString(),
          status: item.generatorStatus || 'unknown',
          // 其他可能需要的字段
        }));
        
        // 按创建时间倒序排列
        formattedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setHistoryList(formattedHistory);
      } else {
        messageApi.error('Failed to load history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      messageApi.error('Error loading history');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // 选择历史记录项
  const handleHistoryItemClick = async (item) => {
    if (item.websiteId) {
      setCurrentWebsiteId(item.websiteId);
      messageApi.success(`Loading history for ${item.domain || 'website'}...`);
      
      try {
        // Fetch history details for this website
        const historyResponse = await apiClient.getAlternativeWebsiteHistory(item.websiteId);
        
        if (historyResponse?.code === 200 && historyResponse.data) {
          // Clear current messages to display history
          setMessages([]);
          
          // Add system message indicating we're viewing history
          messageHandler.addSystemMessage(`Viewing historical analysis for ${item.domain || 'website'}`);
          
          // Process history data
          if (Array.isArray(historyResponse.data) && historyResponse.data.length > 0) {
            // Sort history records by timestamp
            const sortedHistory = [...historyResponse.data].sort((a, b) => 
              new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
            );
            
            // Process and display conversation history
            sortedHistory.forEach(record => {
              if (record.role === 'user' && record.content) {
                messageHandler.addUserMessage(record.content);
              } else if (record.role === 'assistant' && record.content) {
                messageHandler.addAgentMessage(record.content);
              }
            });
            
            // Optionally fetch additional data like sources or details
            if (item.websiteId) {
              try {
                const sourcesResponse = await apiClient.getAlternativeSources(item.websiteId);
                if (sourcesResponse?.code === 200 && sourcesResponse.data) {
                  setSourcesData(sourcesResponse.data);
                }
              } catch (error) {
                console.error('Failed to fetch sources for history item:', error);
              }
            }
          } else {
            messageHandler.addAgentMessage("No conversation history found for this website.");
          }
        } else {
          messageApi.error('Failed to load history details');
        }
      } catch (error) {
        console.error('Error fetching history details:', error);
        messageApi.error('Error loading history details');
      }
    }
  };
  
  // 完全重新设计的历史记录下拉菜单
  const historyMenu = {
    items: [
      {
        key: 'history-content',
        label: (
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/70 rounded-xl shadow-2xl p-4 max-h-[500px] overflow-y-auto" 
               style={{ minWidth: '380px' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700/70">
              <div className="flex items-center">
                <HistoryOutlined className="text-blue-400 mr-2" style={{ fontSize: '18px' }} />
                <span className="text-gray-200 font-medium text-base">Recent Analyses</span>
              </div>
              <Button 
                type="text" 
                size="small"
                icon={loadingHistory ? <LoadingOutlined spin /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchHistoryList();
                }}
              />
            </div>
            
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mb-4"></div>
                <span className="text-gray-400">Loading your history...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-center mb-2">No history found</p>
                <p className="text-gray-500 text-sm text-center">Your analyzed websites will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item, index) => (
                  <div 
                    key={item.websiteId || index} 
                    onClick={() => handleHistoryItemClick(item)}
                    className="flex items-center p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-all group border border-transparent hover:border-slate-600/70"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mr-4 shadow-lg group-hover:shadow-blue-500/10 transition-all">
                      {item.favicon ? (
                        <img src={item.favicon} alt="" className="w-7 h-7 rounded" />
                      ) : (
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-200 font-medium truncate group-hover:text-blue-300 transition-colors">
                        {item.domain || 'Unknown website'}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(item.createdAt || Date.now()).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                        {item.status && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                            item.status === 'success' || item.status === 'finished' ? 'bg-green-500/20 text-green-300' :
                            item.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {historyList.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700/70 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {historyList.length} {historyList.length === 1 ? 'item' : 'items'} found
                </span>
                <button 
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchHistoryList();
                  }}
                >
                  Refresh
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ),
      },
    ],
  };
  
  // 在组件加载时获取历史记录
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    if (isLoggedIn) {
      fetchHistoryList();
    }
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
    return (
      <div className={`w-full h-screen flex items-center justify-center ${
        currentBackground === 'GHIBLI' ? 'bg-cover bg-center bg-no-repeat' : getBackgroundClass()
      }`} 
           style={getBackgroundStyle()}>
        <div className={`w-full max-w-4xl px-8 py-12 initial-screen-content rounded-xl ${
          currentBackground === 'GHIBLI' ? 'bg-transparent' : 'bg-slate-900/80 backdrop-blur-md'
        }`}>
          <div className={`text-center mb-8 ${currentBackground === 'GHIBLI' ? 'text-shadow' : ''}`}>
            <h1 className={`text-4xl font-bold ${currentBackground === 'GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 ${currentBackground === 'GHIBLI' ? 'drop-shadow-lg' : ''}`}>
              Welcome to <span className={currentBackground === 'GHIBLI' ? 'text-amber-400' : 'text-blue-400'}>Alternatively</span>
              
              <button 
                onClick={toggleBackground}
                className={`ml-4 inline-flex items-center px-3 py-1.5 text-xs ${getButtonStyle()} rounded-full 
                         backdrop-blur-sm transition-all gap-1.5 border
                         shadow-lg hover:bg-blue-500/50 align-middle`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                </svg>
                {currentBackground === 'GHIBLI' ? 'Switch to Default' : 'Switch to Ghibli'}
              </button>
            </h1>
            <p className={`text-lg ${currentBackground === 'GHIBLI' ? 'text-amber-200/90' : 'text-gray-300'} mb-8 ${currentBackground === 'GHIBLI' ? 'drop-shadow-md' : ''}`}>
              Which product would you like to analyze and create an SEO-friendly Alternatively page for?
            </p>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <form onSubmit={(e) => {
              e.preventDefault();
              
              if (!userInput.trim()) {
                setValidationError('Please enter a website URL');
                return;
              }
              
              if (!validateDomain(userInput)) {
                setValidationError('Please enter a valid domain (e.g., example.com)');
                return;
              }
              
              // Clear any previous validation errors
              setValidationError('');
              
              // Ensure input contains https://
              const formattedInput = userInput.trim().startsWith('http') ? userInput.trim() : `https://${userInput.trim()}`;
              initializeChat(formattedInput);
            }}>
              <div className="relative">
                <Input
                  placeholder="Enter product website URL (e.g., example.com)"
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    // Clear validation error when user types
                    if (validationError) setValidationError('');
                  }}
                  className={`bg-white/10 border rounded-xl text-lg w-full ${validationError ? 'border-red-500' : getInputStyle()} ${currentBackground === 'GHIBLI' ? 'shadow-xl' : ''}`}
                  style={{ 
                    color: currentBackground === 'GHIBLI' ? '#433422' : 'black', 
                    backgroundColor: currentBackground === 'GHIBLI' ? 'rgba(253, 230, 190, 0.85)' : 'rgba(255, 255, 255, 0.8)',
                    height: '80px',
                    paddingRight: '120px',
                    transition: 'all 0.3s ease',
                    boxShadow: currentBackground === 'GHIBLI' ? '0 10px 25px -5px rgba(120, 80, 40, 0.3)' : ''
                  }}
                  prefix={
                    <span className={`font-mono ${currentBackground === 'GHIBLI' ? 'text-amber-800/70' : 'text-gray-500'}`} style={{ marginLeft: '16px' }}>https://</span>
                  }
                  status={validationError ? "error" : ""}
                />
                
                {validationError && (
                  <div className={`absolute -bottom-6 left-0 text-red-500 text-sm ${currentBackground === 'GHIBLI' ? 'drop-shadow-md' : ''}`}>
                    {validationError}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 px-6 py-4 text-base 
                         ${currentBackground === 'GHIBLI' 
                           ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 border-amber-400/50 hover:border-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.5)] hover:shadow-[0_0_25px_rgba(217,119,6,0.7)]' 
                           : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)]'
                         } rounded-xl 
                         transition-all duration-300 flex items-center gap-2 
                         border hover:scale-105 
                         ${currentBackground === 'GHIBLI' 
                           ? 'hover:from-amber-500 hover:to-amber-600' 
                           : 'hover:from-blue-500 hover:to-indigo-600'
                         }
                         after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r 
                         after:from-transparent after:via-white/20 after:to-transparent 
                         after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-all after:duration-1000
                         after:rounded-xl overflow-hidden ${currentBackground === 'GHIBLI' ? 'shadow-lg' : ''}`}
                style={{ height: '64px' }}
              >
                <ArrowRightOutlined className="w-6 h-6" />
                <span className="relative z-10">Analyze Now</span>
              </button>
            </form>
          </div>
          
          {validationError ? (
            <div className="mt-10 text-center text-gray-400 text-sm mb-6">
              {/* Space for error message */}
            </div>
          ) : (
            <div className={`mt-6 text-center text-gray-400 text-sm mb-10 ${currentBackground === 'GHIBLI' ? 'drop-shadow-md' : ''}`}>
              Enter your product website URL and we'll help you find the best competitors and create an SEO-optimized page
            </div>
          )}
          
          <div className="mt-12 max-w-4xl mx-auto">
            <h3 className={`text-xl font-semibold ${currentBackground === 'GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 text-center ${currentBackground === 'GHIBLI' ? 'drop-shadow-lg' : ''}`}>Popular Product Analysis Examples</h3>
            <div className="grid grid-cols-3 gap-6">
              <div 
                onClick={() => {
                  setUserInput("hix.ai");
                  initializeChat("https://hix.ai");
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-400/40 to-amber-300/20 border-amber-400/30 hover:border-amber-300/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-green-400/40 to-green-300/20 border-green-400/30 hover:border-green-300/50 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border cursor-pointer 
                         transition-all duration-300 
                         hover:-translate-y-1 group relative overflow-hidden`}
              >
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-400/20 rounded-full blur-xl group-hover:bg-amber-400/30 transition-all"></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                  <img src="/images/hix.png" alt="HIX" className="w-7 h-7" />
                </div>
                <div className="text-amber-300 font-medium mb-2 group-hover:text-amber-200 text-base">HIX</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Analyze HIX alternatives</div>
                <div className="absolute bottom-3 right-3">
                  <ArrowRightOutlined className="text-amber-400/50 group-hover:text-amber-300 transition-all" />
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setUserInput("pipiads.com");
                  initializeChat("https://pipiads.com");
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-800/40 to-amber-700/20 border-amber-600/30 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-emerald-800/40 to-emerald-700/20 border-emerald-600/30 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(5,150,105,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border cursor-pointer 
                         transition-all duration-300 
                         hover:-translate-y-1 group relative overflow-hidden`}
              >
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-800/20 rounded-full blur-xl group-hover:bg-amber-800/30 transition-all"></div>
                <img src="/images/pipiads.png" alt="PiPiAds" className="w-10 h-10 mb-3 rounded-lg" />
                <div className="text-amber-400 font-medium mb-2 group-hover:text-amber-300 text-base">PiPiAds</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Explore PiPiAds alternatives</div>
                <div className="absolute bottom-3 right-3">
                  <ArrowRightOutlined className="text-amber-500/50 group-hover:text-amber-400 transition-all" />
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setUserInput("jtracking.io");
                  initializeChat("https://jtracking.io");
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border cursor-pointer 
                         transition-all duration-300 
                         hover:-translate-y-1 group relative overflow-hidden`}
              >
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-900/20 rounded-full blur-xl group-hover:bg-amber-900/30 transition-all"></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                  {/* Inline SVG for J icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" className="w-7 h-7">
                    <path d="M16 4h-2v12c0 1.1-.9 2-2 2H8v2h4c2.21 0 4-1.79 4-4V4z"/>
                  </svg>
                </div>
                <div className="text-amber-300 font-medium mb-2 group-hover:text-amber-200 text-base">JTracking</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">View JTracking alternatives</div>
                <div className="absolute bottom-3 right-3">
                  <ArrowRightOutlined className="text-amber-400/50 group-hover:text-amber-300 transition-all" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className={`inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-xs text-gray-300 ${currentBackground === 'GHIBLI' ? 'shadow-md' : ''}`}>
                <InfoCircleOutlined className="mr-2 text-blue-400" />
                Click any card to view alternative page performance of that product
              </div>
            </div>
          </div>
        </div>
        
        {/* 添加历史按钮到左下角 */}
        <div className="fixed bottom-6 left-6 z-50">
          <Dropdown 
            menu={historyMenu} 
            trigger={['click']} 
            placement="topLeft"
            overlayClassName="history-dropdown"
          >
            <button
              className={`px-4 py-2.5 text-sm ${
                currentBackground === 'GHIBLI' 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30' 
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30'
              } rounded-full backdrop-blur-sm transition-all flex items-center gap-2 border shadow-lg hover:shadow-xl`}
            >
              <HistoryOutlined style={{ fontSize: '16px' }} />
              <span>History</span>
            </button>
          </Dropdown>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider 
      theme={{
        token: {
          colorPrimary: currentBackground === 'GHIBLI' ? '#d97706' : '#3b82f6',
        },
      }}
      wave={{ disabled: true }}
    >
      {contextHolder}
      <div className={`w-full min-h-screen ${
        currentBackground === 'GHIBLI' ? 'bg-cover bg-center bg-no-repeat' : getBackgroundClass()
      } text-white flex items-center justify-center p-4 relative overflow-hidden`} 
           style={{ 
             paddingTop: "80px",
             ...getBackgroundStyle()
           }}>
        
        {/* 背景覆盖层 */}
        <div className={`absolute inset-0 ${getOverlayClass()}`} style={{ paddingTop: "80px" }}></div>
        
        {/* 添加吉卜力风格的漂浮元素 */}
        {currentBackground === 'GHIBLI' && (
          <>
            <div className="absolute top-[15%] left-[10%] w-8 h-8 rounded-full bg-amber-400/20 animate-float" style={{animationDuration: '8s'}}></div>
            <div className="absolute top-[30%] right-[15%] w-6 h-6 rounded-full bg-amber-300/30 animate-float" style={{animationDuration: '12s', animationDelay: '2s'}}></div>
            <div className="absolute bottom-[20%] left-[20%] w-10 h-10 rounded-full bg-amber-500/20 animate-float" style={{animationDuration: '10s', animationDelay: '1s'}}></div>
          </>
        )}
        
        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          <div className={`${showBrowser ? 'hidden' : 'w-[70%]'} relative flex flex-col`}>
            <div className="absolute top-0 right-8 z-50 flex gap-2 mt-2">
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
                      : "Enter your product URL (e.g., example.com)"}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending || inputDisabledDueToUrlGet}
                    className="bg-white/10 border border-gray-300/30 rounded-xl text-sm"
                    style={{ 
                      color: 'black', 
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      height: '48px',
                      transition: 'all 0.3s ease'
                    }}
                    onPressEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (userInput.trim() && !inputDisabledDueToUrlGet) {
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
            <div className="absolute top-0 right-8 z-50 flex gap-2 mt-2">
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
              tabs={browserTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          
          <div className={`w-[30%] ${currentBackground === 'GHIBLI' 
            ? 'bg-amber-900/10 border-amber-700/30' 
            : 'bg-white/5 border-gray-300/20'
          } backdrop-blur-lg rounded-2xl border shadow-xl 
                          flex flex-col h-full relative`}>
            <div className="border-b border-gray-300/20 p-3">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
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
                <div className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    logs.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span>SSE {logs.length > 0 ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && renderDetails(detailsData)}
              {rightPanelTab === 'sources' && renderSources()}
            </div>
          </div>
        </div>
        
        {/* 添加历史按钮到左下角 */}
        <div className="fixed bottom-6 left-6 z-50">
          <Dropdown 
            menu={historyMenu} 
            trigger={['click']} 
            placement="topLeft"
            overlayClassName="history-dropdown"
          >
            <button
              className={`px-4 py-2.5 text-sm ${
                currentBackground === 'GHIBLI' 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30' 
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30'
              } rounded-full backdrop-blur-sm transition-all flex items-center gap-2 border shadow-lg hover:shadow-xl`}
            >
              <HistoryOutlined style={{ fontSize: '16px' }} />
              <span>History</span>
            </button>
          </Dropdown>
        </div>
      </div>
    </ConfigProvider>
  );
};

// 添加浮动动画
const style = document.createElement('style');
style.innerHTML = `
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  
  .animate-float {
    animation: float 8s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default ResearchTool;