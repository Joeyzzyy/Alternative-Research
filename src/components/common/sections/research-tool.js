'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input, Button, Spin, message, Tooltip, Avatar, Modal } from 'antd';
import { ArrowRightOutlined, InfoCircleOutlined, UserOutlined, LeftOutlined, RightOutlined, MenuOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import { EventSourcePolyfill } from 'event-source-polyfill';
import MessageHandler from '../../../utils/MessageHandler';
import HistoryCardList from './result-preview.js';

const TAG_FILTERS = {
  '\\[URL_GET\\]': '',  
  '\\[COMPETITOR_SELECTED\\]': '',  
  '\\[END\\]': '',  
  '\\[ALL_END\\]': '',  
};
const ALTERNATIVELY_LOGO = '/images/alternatively-logo.png';

const ResearchTool = ({ 
  setTargetShowcaseTab
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const [logs, setLogs] = useState([]);
  const competitorListProcessedRef = useRef(false);
  const [canProcessCompetitors, setCanProcessCompetitors] = useState(false);
  const [browserTabs, setBrowserTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [inputDisabledDueToUrlGet, setInputDisabledDueToUrlGet] = useState(false);
  const messageHandler = useMemo(() => new MessageHandler(setMessages), [setMessages]);
  const [sseConnected, setSseConnected] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const htmlStreamRef = useRef(''); 
  const isStreamingRef = useRef(false);
  const currentStreamIdRef = useRef(null); 
  const [resultIds, setResultIds] = useState([]);
  const lastLogCountRef = useRef(0);
  const [isProcessingTask, setIsProcessingTask] = useState(false);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState("Enter product website URL to get started (e.g., example.com)");
  const placeholderIntervalRef = useRef(null); 
  const placeholderTimeoutRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    
    return filteredMessage;
  };
  const [styleChangeCompleted, setStyleChangeCompleted] = useState(false);
  const hasTriggeredStep4Ref = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); 

  // --- 新增：示例数据和当前索引状态 ---
  const examples = [
    { url: 'https://alternative.nytgames.top/nyt-games-original-alternative', title: 'Play NYT Games Free: The Ultimate Word Puzzle Collection Without Subscriptions', image: '/images/preview-nytgames.png', timestamp: 'Generated 2 hours ago' },
    { url: 'https://alternative.neobund.com/doba-alternative', title: 'NeoBund: The Smarter Alternative to Doba with Guaranteed 2-Day US Shipping', image: '/images/preview-neobund.png', timestamp: 'Generated on April 26' }
  ];
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  // --- 结束新增 ---

  useEffect(() => {
    const lastInput = localStorage.getItem('urlInput');
    if (lastInput) {
      setUserInput(lastInput);
    }
    const checkLoginStatus = () => {
      const loggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
      setIsUserLoggedIn(loggedIn); 
    };
    checkLoginStatus(); 
    window.addEventListener('storage', checkLoginStatus);
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const validateDomain = (input) => {
    if (!input || !input.trim()) return false;
    let domain = input.trim();
    try {
      if (/^\d+$/.test(domain)) {
        return false;
      }
      if (!domain.match(/^https?:\/\//i)) {
        domain = 'https://' + domain;
      }
      const url = new URL(domain);
      domain = url.hostname;
      if (!domain.includes('.')) {
        return false;
      }
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return domainRegex.test(domain);
    } catch (error) {
      return false;
    }
  };
  const [shouldConnectSSE, setShouldConnectSSE] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [aborting, setAborting] = useState(false);

  useEffect(() => {
    if (rightPanelTab === 'browser' && logs.length > lastLogCountRef.current) {
      setRightPanelTab('details');
    }
    lastLogCountRef.current = logs.length;
  }, [logs, rightPanelTab]);

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

  const handleCompetitorListRequest = async (competitors) => {
    setIsMessageSending(true);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();

    try {
      const response = await apiClient.chatWithAI(JSON.stringify(competitors), currentWebsiteId);

      if (response?.code === 200 && response.data?.answer) {
        // 更新当前步骤为2，表示已完成"Find Competitors"，现在处于"Select Competitors"阶段
        setCurrentStep(2);
        const answer = filterMessageTags(response.data.answer);
        messageHandler.updateAgentMessage(answer, thinkingMessageId);
        messageHandler.addSystemMessage('If you are not satisfied with the competitors, you can put in the competitors you want to analyze!');
      } else {
        messageHandler.updateAgentMessage('Oops! The service encountered a temporary issue. Could you please try sending your message again?', thinkingMessageId);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setIsMessageSending(false);
      setInputDisabledDueToUrlGet(false); // 确保重新启用输入
    }
  };

  const linkifyDomains = (text) => {
    return text.replace(
      /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?![^<]*>)/g,
      (match) => {
        return `<a href="https://${match}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:underline;">${match}</a>`;
      }
    );
  };

  const renderChatMessage = (message, index) => {
    if (message.source === 'system') {
      return (
        <div
          key={index}
          className="flex justify-center mb-6"
          style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
        >
          <div className="max-w-[80%] w-full flex flex-col items-center">
            <div
              className="px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium flex items-center gap-2"
              style={{
                margin: '0 auto',
                minWidth: '180px',
                maxWidth: '400px',
              }}
            >
              <InfoCircleOutlined className="text-base text-yellow-500 mr-2" />
              <span>
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>
        </div>
      );
    }
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
                            rounded-tr-none transform hover:-translate-y-0.5"
                  style={{maxWidth: '350px', wordWrap: 'break-word'}}>
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
      const filteredContent = linkifyDomains(
        filterMessageTags(message.content).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      );

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
                  <span className="text-xs font-medium text-blue-300 whitespace-nowrap">AltPage.ai</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl text-sm bg-gradient-to-br from-slate-800 to-slate-900 
                            text-white shadow-xl backdrop-blur-sm
                            hover:shadow-slate-500/20 transition-all duration-300
                            rounded-tl-none transform hover:-translate-y-0.5"
                  style={{maxWidth: '350px', wordWrap: 'break-word'}}>
                <div className="relative z-10">
                  {message.isThinking ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <div>
                      {/* 用 dangerouslySetInnerHTML 渲染加粗后的内容 */}
                      <span dangerouslySetInnerHTML={{ __html: filteredContent.split('\n').join('<br />') }} />
                      {/* 添加消息后的加载动画 - 当 message.showLoading 为 true 时显示 */}
                      {message.showLoading && (
                        <div className="inline-flex items-center ml-2 mt-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce ml-1" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce ml-1" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      )}
                    </div>
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

  useEffect(() => {
    if (chatEndRef.current && messages.length > 0) {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleLoginSuccess = () => {
      setIsUserLoggedIn(true); // 更新全局登录状态 (使用新的 setter)
      if (localStorage.getItem('urlInput')) {
        // 延迟一点执行，确保登录状态已完全更新
        setTimeout(() => {
          initializeChat(localStorage.getItem('urlInput'));
          // 清除待处理的输入
          localStorage.removeItem('urlInput');
        }, 500);
      }
    };

    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);

    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, []);

  useEffect(() => {
    const handleLogoutSuccess = () => {
      setIsUserLoggedIn(false);
    };
    window.addEventListener('alternativelyLogoutSuccess', handleLogoutSuccess);
    return () => {
      window.removeEventListener('alternativelyLogoutSuccess', handleLogoutSuccess);
    };
  }, []); 

  const detailsRef = useRef(null);
  const codeContainerRef = useRef(null);
  const latestAgentContentRef = useRef(null); 
  const colorStreamRef = useRef('');
  const currentColorStreamIdRef = useRef(null);
  const isColorStreamingRef = useRef(false);

  useEffect(() => {
    if (latestAgentContentRef.current) {
      latestAgentContentRef.current.scrollTop = latestAgentContentRef.current.scrollHeight;
    }
  }, [logs]); 

  const filterLogContent = (content) => {
    if (!content) return '';
    let filteredContent = String(content);
  
    filteredContent = filteredContent.replace(
      /<details.*?>\s*<summary>\s*Thinking\.\.\.\s*<\/summary>(.*?)<\/details>/gs, 
      (match, thinkingContent) => {
        const formattedThinking = thinkingContent
          .replace(/\.([\s\u00A0]+)/g, '. <br />')
          .replace(/\n/g, '<br />')
          .trim();
        return `<div class="thinking-block p-2 my-2 bg-gray-100 rounded text-xs text-gray-600">
                  <div class="font-medium mb-1">Thinking Process:</div>
                  <div>${formattedThinking}</div>
                </div>`;
      }
    );
    
    filteredContent = filteredContent.replace(
      /Action:\s*(.*?)(?=Thought:|<details|$)/gs,
      (match, actionContent) => {
        const formattedAction = actionContent.trim();
        if (!formattedAction) return '';
        
        return `<div class="action-block p-2 my-2 bg-blue-50 rounded text-xs text-blue-600">
                  <div class="font-medium mb-1">Executing:</div>
                  <div>${formattedAction}</div>
                </div>`;
      }
    );
    
    filteredContent = filteredContent.replace(
      /Thought:\s*(.*?)(?=Action:|<details|$)/gs,
      (match, thoughtContent) => {
        const formattedThought = thoughtContent.trim();
        if (!formattedThought) return '';
        
        return `<div class="thought-block p-2 my-2 bg-purple-50 rounded text-xs text-purple-600">
                  <div class="font-medium mb-1">Thought:</div>
                  <div>${formattedThought}</div>
                </div>`;
      }
    );
    
    filteredContent = filteredContent.replace(
      /\{\s*"action":\s*"(.*?)"\s*,\s*"action_input":\s*"(.*?)"\s*\}/gs,
      (match, action, actionInput) => {
        return `<div class="json-action-block p-2 my-2 bg-green-50 rounded text-xs text-green-600">
                  <div class="font-medium mb-1">Action: ${action}</div>
                  <div>${actionInput}</div>
                </div>`;
      }
    );
    
    filteredContent = filteredContent.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    return filteredContent;
  };

  const renderDetails = () => {
    const mergedLogs = [];
    const agentMessageMap = new Map();
    logs.forEach(log => {
      if (log.type === 'Agent' && log.content) {
        try {
          const content = log.content;
          if (content.organic_data) {
            const organicData = typeof content.organic_data === 'string' 
              ? JSON.parse(content.organic_data) 
              : content.organic_data;

            if (organicData.event === 'agent_message') {
              const { message_id, answer } = organicData;
              
              const filteredAnswer = filterLogContent(answer);
              
              if (!agentMessageMap.has(message_id)) {
                agentMessageMap.set(message_id, {
                  id: message_id,
                  type: 'Agent',
                  content: filteredAnswer,
                  timestamp: log.timestamp,
                });
              } else {
                const existingLog = agentMessageMap.get(message_id);
                existingLog.content += filteredAnswer;
              }
            }
          }
        } catch (error) {
          console.error('Error processing Agent log content:', error, 'Original log:', log);
        }
      } else {
        mergedLogs.push(log);
      }
    });
    
    agentMessageMap.forEach(mergedLog => {
      mergedLog.content = filterLogContent(mergedLog.content)
      .replace(/\.([\s\u00A0]+)/g, '. <br />')
      .replace(/\n/g, '<br />');
      mergedLogs.push(mergedLog);
    });
    
    mergedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // <--- 修改为倒序排序

    const latestAgentLog = mergedLogs.find(l => l.type === 'Agent'); // 直接在倒序数组中查找第一个
    const latestAgentLogId = latestAgentLog ? latestAgentLog.id : null;

    // Helper function for status color
    const getStatusColor = (status) => {
      if (!status) return 'text-gray-400'; // Default
      status = status.toLowerCase();
      if (status === 'succeeded' || status === 'success') return 'text-green-400';
      if (status === 'failed' || status === 'error') return 'text-red-400';
      if (status === 'running' || status === 'processing') return 'text-yellow-400';
      if (status === 'skipped') return 'text-gray-500';
      return 'text-gray-400'; // Fallback
    };

    const handleImageLoad = (e) => {
      e.target.classList.remove('opacity-0');
      e.target.classList.add('opacity-100');
      
      const parentLink = e.target.closest('a');
      if (parentLink) {
        parentLink.style.backgroundImage = 'none'; 
        parentLink.style.backgroundColor = 'transparent'; 
      }
    };
    
    const handleImageError = (e) => {
      e.target.onerror = null; // 防止无限循环
      e.target.style.display = 'none'; 
    
      // 禁用父链接
      const parentLink = e.target.closest('a');
      if (parentLink) {
        parentLink.onclick = (event) => event.preventDefault();
        parentLink.style.cursor = 'default';
        parentLink.style.backgroundImage = `url('/images/image-cannot-be-displayed.png')`; 
        parentLink.style.backgroundColor = '#4A5568'; // Tailwind bg-gray-700 的颜色值
      }
    };

    return (
      <div className="h-full flex flex-col" ref={detailsRef}>
        <div className="p-3 space-y-2 overflow-y-auto flex-grow"> {/* 添加 flex-grow */}
          {mergedLogs.map((log, index) => {
            // 跳过 Info 和 Codes 类型的日志
            if (log.type === 'Info' || log.type === 'Codes') {
              return null;
            }
            // 渲染 Agent 类型的日志
            if (log.type === 'Agent') {
              return (
                <div 
                  key={index} 
                  className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="flex items-center mb-2">
                    <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-4 h-4 mr-2" />
                    <div className="text-[11px] text-gray-300 font-medium">Agent Thinking...</div>
                  </div>
                  {/* --- 修改：添加 ref={log.id === latestAgentLogId ? latestAgentContentRef : null} --- */}
                  <div 
                    ref={log.id === latestAgentLogId ? latestAgentContentRef : null} // <-- 附加 Ref
                    className="text-[10px] text-gray-400 break-words leading-relaxed agent-log-content-wrapper overflow-y-auto" // 保留 overflow
                    style={{ maxHeight: '300px' }} // 保留 maxHeight
                    dangerouslySetInnerHTML={{ __html: filterLogContent(log.content) }}
                  />
                  <div className="text-[9px] text-gray-500 mt-1.5">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              );
            }
            
            // 解析 Dify 日志的 content
            let difyContent = null;
            if (log.type === 'Dify' && typeof log.content === 'string') {
              try {
                difyContent = JSON.parse(log.content);
              } catch (e) {
                console.error('Failed to parse Dify content:', e);
              }
            } else if (log.type === 'Dify' && typeof log.content === 'object' && log.content !== null) {
              difyContent = log.content;
            }

            const latestHtmlLog = logs.filter(l => l.type === 'Html').slice(-1)[0];
            const latestHtmlLogId = latestHtmlLog ? latestHtmlLog.id : null;

            const currentColorContent = log.id === currentColorStreamIdRef.current
              ? colorStreamRef.current
              : log.content;

            // --- 修改：为新的 Crawler 类型添加图标和标题 ---
            const isCrawlerType = log.type === 'Crawler_Images' || log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers';
            const uniqueKey = `${log.id || 'log'}-${log.type}-${index}`; 
            const isEmptyCrawlerContent = log.content === null || (isCrawlerType && Array.isArray(log.content) && log.content.length === 0);

            return (
              <div
                key={uniqueKey} 
                className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn" // <-- 添加 max-h 和 overflow-y
                style={{
                  animationDelay: '0.5s'
                }}
              >
                <div className="flex items-center mb-2">
                  {log.type === 'Dify' && (
                    <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-4 h-4 mr-2" />
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
                  {log.type === 'Color' && (
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  )}
                  {/* --- 修改：为所有 Crawler 相关类型显示同一个图标 --- */}
                  {isCrawlerType && (
                     <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.09M19.938 11a2 2 0 11-4 0 2 2 0 014 0zM14 21a4 4 0 100-8 4 4 0 000 8z" /> {/* 简化的爬虫/网络图标 */}
                     </svg>
                  )}
                  <div className="text-[11px] text-gray-300 font-medium">
                    {log.type === 'Dify' && 'Running Page Content Generation Workflow'}
                    {log.type === 'Error' && 'Error Message'}
                    {log.type === 'API' && 'Agent Action Result'}
                    {log.type === 'Color' && 'Analyzing Page Style'}
                    {/* --- 修改：根据具体 Crawler 类型显示不同标题 --- */}
                    {log.type === 'Crawler_Images' && 'Crawled Images'}
                    {log.type === 'Crawler_Headers' && 'Crawled Header Links'}
                    {log.type === 'Crawler_Footers' && 'Crawled Footer Links'}
                  </div>
                </div>

                {/* Dify 日志内容渲染 - 低调高级风格 */}
                {log.type === 'Dify' && difyContent && (
                  <div className="text-[10px] text-gradient-metal break-words leading-relaxed space-y-1">
                    {/* 当前动作标题 */}
                    <div className="font-semibold text-sm text-gradient-metal mb-1">
                      Current Action
                    </div>
                    {/* 只保留文字，去除渐变色，低调显示 */}
                    <div className="flex items-center space-x-2 px-1 py-1">
                      <span
                        className="font-semibold text-gradient-metal text-xs"
                        style={{ lineHeight: '1.2' }}
                      >
                        {difyContent.data.title || ''}
                      </span>
                      {difyContent.data && difyContent.data.status !== '' && (
                        <span className={`ml-2 font-medium text-[11px] ${getStatusColor(difyContent.data.status)}`}>
                          {difyContent.data.status}
                        </span>
                      )}
                      {difyContent.data.elapsed_time !== undefined && (
                        <span className="ml-2 text-gradient-metal text-[11px]">
                          {difyContent.data.elapsed_time.toFixed(2)}s
                        </span>
                      )}
                    </div>
                    {/* 执行状态 */}
                    <div>
                      <span className="font-medium w-28 inline-block text-gradient-metal">Status:</span>
                      <span className="inline-block text-gradient-metal">{difyContent.event || ''}</span>
                    </div>
                    {/* 执行者 */}
                    <div>
                      <span className="font-medium w-28 inline-block text-gradient-metal">Executor:</span>
                      <span className="inline-block text-gradient-metal">{log.step || difyContent.step || ''}</span>
                    </div>
                    {/* Node ID */}
                    {difyContent.data && typeof difyContent.data === 'object' && (
                      <div>
                        <span className="font-medium w-28 inline-block text-gradient-metal">Node ID:</span>
                        <span className="inline-block text-gradient-metal">{difyContent.data.id || ''}</span>
                      </div>
                    )}
                    {/* Workflow ID */}
                    <div>
                      <span className="font-medium w-28 inline-block text-gradient-metal">Workflow ID:</span>
                      <span className="inline-block text-gradient-metal">{difyContent.workflow_id || ''}</span>
                    </div>
                    {/* Task ID */}
                    <div>
                      <span className="font-medium w-28 inline-block text-gradient-metal">Task ID:</span>
                      <span className="inline-block text-gradient-metal">{difyContent.task_id || ''}</span>
                    </div>
                    {/* 错误信息 */}
                    {difyContent.data?.error && (
                      <div className="mt-1 pt-1 border-t border-gray-700/50 text-gradient-metal-error">
                        <span className="font-semibold">Error:</span> {difyContent.data.error}
                      </div>
                    )}
                  </div>
                )}

                {/* HTML 日志内容渲染 - 修改这部分 */}
                {log.type === 'Html' && (
                  <div 
                    key={`${uniqueKey}-html-content`}
                    className="text-[10px] text-gray-400 break-words leading-relaxed"
                    style={{ minHeight: '420px' }}
                  >
                    <div className="mb-1">
                      <span className="font-semibold">Writing Codes Of Your Page...</span>
                      <pre 
                        ref={log.id === latestHtmlLogId ? codeContainerRef : null}
                        className="mt-1 p-2 bg-gray-700/50 rounded text-xs whitespace-pre-wrap break-words overflow-y-auto"
                        style={{ 
                          maxHeight: '400px', 
                          color: '#a5d6ff'
                        }}
                      >
                       {log.id === currentStreamIdRef.current ? htmlStreamRef.current : log.content}
                      </pre>
                    </div>
                  </div>
                )}

                {/* --- 新增：Color 日志内容渲染 --- */}
                {log.type === 'Color' && (
                  <div
                    key={index} // 添加特定后缀确保 key 唯一性
                    className="text-[10px] text-gray-400 break-words leading-relaxed"
                  >
                    <div className="mb-1">
                      <span className="font-semibold text-purple-400">Extracting Color Palette...</span>
                      <pre
                        className="mt-1 p-2 bg-gray-700/50 rounded text-xs whitespace-pre-wrap break-words overflow-y-auto"
                        style={{
                          maxHeight: '200px', // 可以设置不同的最大高度
                          color: '#e9d5ff' // 紫色调
                        }}
                      >
                        {/* 使用 Color 的累积内容 */}
                        {currentColorContent}
                      </pre>
                    </div>
                  </div>
                )}

                {/* --- 新增：Crawler 日志内容渲染 --- */}
                {isCrawlerType && (
                  <div
                    key={`${uniqueKey}-content`}
                    className="text-[10px] text-gray-400 break-words leading-relaxed mt-1"
                  >
                    {/* --- 如果内容是空字符串，显示提示信息 --- */}
                    {isEmptyCrawlerContent ? (
                      <p className="text-gray-500 italic">No relevant information retrieved.</p>
                    ) : (
                      <>
                        {/* --- 图片渲染 (仅当 content 是非空数组时) --- */}
                        {log.type === 'Crawler_Images' && Array.isArray(log.content) && (
                          <div className="flex flex-wrap gap-2">
                          {log.content.map((item, imgIndex) => (
                            item.src ? ( 
                              <a 
                                key={imgIndex} 
                                href={item.src} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                // --- 修改 className ---
                                className="group relative block cursor-pointer w-16 h-16 rounded border border-gray-600 bg-gray-700 bg-center bg-no-repeat bg-contain overflow-hidden" // 添加尺寸、背景占位符样式、overflow
                                // --- 添加 style 设置背景图 ---
                                style={{ backgroundImage: `url('/images/image-placeholder.svg')` }} // 默认显示占位符背景
                              >
                                <img
                                  src={item.src}
                                  alt={item.alt || 'Crawled image'}
                                  // --- 修改 className ---
                                  className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300" // 绝对定位、初始透明、过渡效果
                                  // --- 添加 onLoad 事件处理器 ---
                                  onLoad={handleImageLoad} 
                                  // --- 修改 onError 事件处理器 ---
                                  onError={handleImageError} 
                                />
                                {/* 悬停显示 Alt 和 Src (保持不变) */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs p-1.5 bg-gray-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none break-all">
                                  Alt: {item.alt || 'N/A'}<br/>Src: {item.src}
                                </div>
                              </a> 
                            ) : null 
                          ))}
                        </div>
                        )}

                        {/* --- 链接渲染 (Headers & Footers) (仅当 content 是数组时) --- */}
                        {(log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers') && Array.isArray(log.content) && (
                          <ul className="list-none space-y-1">
                            {log.content.map((item, linkIndex) => (
                              (item.url && item.text !== undefined) ? ( // 检查 url 和 text 是否存在
                                <li key={linkIndex}>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2"
                                    title={item.url} // 鼠标悬停显示 URL
                                  >
                                    {item.text || item.url} {/* 如果 text 为空，显示 URL */}
                                  </a>
                                </li>
                              ) : null // 如果 url 或 text 不存在则不渲染
                            ))}
                          </ul>
                        )}
                        {/* 如果 content 不是空字符串也不是数组，这里不会渲染任何东西，
                            可以根据需要添加对其他类型 content 的处理 */}
                      </>
                    )}
                  </div>
                )}

                {/* 其他日志类型的渲染逻辑 */}
                {log.type === 'Error' ? (
                  <div className="text-[10px] text-red-400 break-words leading-relaxed">
                    {log.content?.error && (
                      <div className="mb-1">
                        <span className="font-semibold">Error Message:</span> {log.content.error}
                      </div>
                    )}
                  </div>
                ) : log.type === 'API' ? (
                  <div className="text-[8px] text-gray-400 break-words leading-relaxed">
                    {log.content?.status && (
                      <div className="mb-1">
                        <span className="font-semibold">Status:</span> {log.content.status}
                      </div>
                    )}
                    {log.content?.data && (
                      <div className="mb-1">
                        <span className="font-semibold">Data:</span>
                        <pre className="mt-1 p-2 bg-gray-700/50 rounded text-[8px] overflow-auto">
                          {JSON.stringify(log.content.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) 
                : null}

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

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .agent-log-content-wrapper * {
        /* 基础样式覆盖 */
        font-size: 11px !important;       /* 强制字号 */
        line-height: 1.6 !important;     /* 强制行间距 */
        color: #bdc3c7 !important;       /* 强制文字颜色 */
        background-color: transparent !important; /* 强制透明背景 */
        margin: 0 !important;            /* 重置外边距 */
        padding: 0 !important;           /* 重置内边距 */
        border: none !important;         /* 重置边框 */
        font-weight: normal !important;  /* 强制普通字重 */
        font-family: inherit !important; /* 继承父级字体 */
        /* 可以添加更多需要强制统一的样式 */
      }

      /* 特定标签的微调 (可选) */
      .agent-log-content-wrapper p {
        margin-bottom: 0.5em !important; /* 给段落一点下边距 */
      }

      .agent-log-content-wrapper strong,
      .agent-log-content-wrapper b {
        font-weight: bold !important;
        color: #ecf0f1 !important; /* 粗体用更亮的颜色 */
      }

      .agent-log-content-wrapper a {
        color: #60a5fa !important;
        text-decoration: underline !important;
      }
      .agent-log-content-wrapper a:hover {
        color: #93c5fd !important;
      }

      /* 覆盖特定传入类的样式 */
      .agent-log-content-wrapper .thinking-block,
      .agent-log-content-wrapper .action-block,
      .agent-log-content-wrapper .json-action-block,
      .agent-log-content-wrapper .text-gray-600,
      .agent-log-content-wrapper .text-xs /* 覆盖其他可能的字号类 */ {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          border-radius: 0 !important;
          color: inherit !important; /* 继承父级颜色 */
          font-size: inherit !important; /* 继承父级字体大小 */
      }

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
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
        opacity: 0;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      /* 美化滚动条样式 */
      .h-full::-webkit-scrollbar,
      .overflow-y-auto::-webkit-scrollbar,
      .chat-messages-container::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      .h-full::-webkit-scrollbar-track,
      .overflow-y-auto::-webkit-scrollbar-track,
      .chat-messages-container::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.1);
        border-radius: 10px;
      }
      
      .h-full::-webkit-scrollbar-thumb,
      .overflow-y-auto::-webkit-scrollbar-thumb,
      .chat-messages-container::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, 0.5);
        border-radius: 10px;
        transition: all 0.3s ease;
      }
      
      .h-full::-webkit-scrollbar-thumb:hover,
      .overflow-y-auto::-webkit-scrollbar-thumb:hover,
      .chat-messages-container::-webkit-scrollbar-thumb:hover {
        background: rgba(59, 130, 246, 0.8);
      }
      
      /* 针对 Firefox 的滚动条样式 */
      .h-full, .overflow-y-auto, .chat-messages-container {
        scrollbar-width: thin;
        scrollbar-color: rgba(59, 130, 246, 0.5) rgba(15, 23, 42, 0.1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleUserInput = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!userInput.trim() || isMessageSending) return;
    let formattedInput = userInput.trim();
    messageHandler.addUserMessage(formattedInput);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();
    setUserInput('');
    setIsMessageSending(true);

    try {
      const response = await apiClient.chatWithAI(formattedInput, currentWebsiteId);
      if (response?.code === 200 && response.data?.answer) {
        const rawAnswer = response.data.answer;
        if (rawAnswer.includes('[URL_GET]')) {
          setInputDisabledDueToUrlGet(true);
          messageHandler.updateAgentMessage(rawAnswer, thinkingMessageId);
          // 在chat接口成功接收URL后，发送URL给search接口进行任务初始化
          const searchResponse = await apiClient.searchCompetitor(
            formattedInput,
            false,
            currentWebsiteId
          );
          if (searchResponse?.code === 1058) {
            messageHandler.updateAgentMessage("⚠️ Network error occurred. Please try again.", thinkingMessageId);
            return;
          }
          if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
            setShouldConnectSSE(true);
          }

          while (messageHandler.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          messageHandler.addSystemMessage('Searching for competitors. Please wait a moment...');
          setIsMessageSending(true);
          while (messageHandler.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          setCanProcessCompetitors(true);
        } else if (rawAnswer.includes('[COMPETITOR_SELECTED]')) {
          const messageBody = rawAnswer.replace(/\[COMPETITOR_SELECTED\].*$/s, '').trim();
          messageHandler.updateAgentMessage(messageBody, thinkingMessageId);
          messageHandler.addSystemMessage('System starts analyzing competitors and generating alternative pages, please wait...');
          const competitorArrayMatch = rawAnswer.match(/\[COMPETITOR_SELECTED\][^\[]*\[(.*?)\]/s);
          if (competitorArrayMatch && competitorArrayMatch[1]) {
            try {
              const cleanedString = competitorArrayMatch[1]
                .replace(/\\'/g, "'")  // 处理转义的单引号
                .replace(/\\"/g, '"')  // 处理转义的双引号
                .replace(/'/g, '"')    // 将单引号替换为双引号
                .trim();
              let competitors;
              try {
                competitors = JSON.parse(`[${cleanedString}]`);
              } catch (e) {
                competitors = cleanedString
                  .replace(/[\[\]'"`]/g, '') // 移除所有引号和方括号
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0); // 过滤空字符串
              }
              if (Array.isArray(competitors) && competitors.length > 0) {
                const domainArray = competitors.map(comp => 
                  String(comp)
                    .trim()
                    .replace(/^https?:\/\//, '')  // 移除协议
                    .replace(/\/$/, '')           // 移除末尾斜杠
                    .replace(/\s+/g, '')          // 移除所有空格
                ).filter(domain => domain.length > 0);  // 过滤掉空域名

                if (domainArray.length > 0) {
                  const generateResponse = await apiClient.generateAlternative(currentWebsiteId, domainArray);
                  if (generateResponse?.code === 200) {
                    setCurrentStep(3);
                    setInputDisabledDueToUrlGet(true);
                    setIsProcessingTask(true);
                  } else {
                    messageHandler.addSystemMessage(`⚠️ Failed to generate alternative page: Invalid server response`);
                  }
                } else {
                  throw new Error('No valid competitors found after processing');
                }
              } else {
                throw new Error('No valid competitors found in the response');
              }
            } catch (error) {
              messageHandler.addSystemMessage(`⚠️ Failed to process competitor selection: ${error.message}`);
            }
          } else {
            messageHandler.addSystemMessage(`⚠️ Failed to extract competitor information from the response, task eneded, please try again`);
          }
        } else if (rawAnswer.includes('[END]')) {
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          const styleRequirement = answer.trim();
          try {
            const styleResponse = await apiClient.changeStyle(styleRequirement, currentWebsiteId);
            if (styleResponse?.code === 200) {
              // 可以添加一个系统消息表示样式已更新
              messageHandler.addSystemMessage('I am updating the style, please wait a moment...');
              setShouldConnectSSE(true);
            } else {
              messageHandler.addSystemMessage('⚠️ Failed to update style: Invalid server response');
            }
          } catch (styleError) {
            messageHandler.addSystemMessage(`⚠️ Failed to update style: ${styleError.message}`);
          }
        } else {
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
        }
      } else {
        messageHandler.updateAgentMessage('Oops! The service encountered a temporary issue. Could you please try sending your message again?', thinkingMessageId);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setIsMessageSending(false);
    }
  };

  const initializeChat = async (userInput) => {
    let thinkingMessageId;
    try {
      setIsProcessingTask(true);
      hasTriggeredStep4Ref.current = false;
      const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
      const token = localStorage.getItem('alternativelyAccessToken');
      // Handle not logged in case
      if (!isLoggedIn || !token) {
        localStorage.setItem('urlInput', userInput);
        const showLoginEvent = new CustomEvent('showAlternativelyLoginModal');
        window.dispatchEvent(showLoginEvent);
        setIsProcessingTask(false);
        return;
      }
      // Get user package information
      try {
        const packageResponse = await apiClient.getCustomerPackage();
        if (packageResponse?.code === 200 && packageResponse.data) {
          const { pageGeneratorLimit, pageGeneratorUsage } = packageResponse.data;
          const availableCredits = pageGeneratorLimit - pageGeneratorUsage;
          if (availableCredits <= 0) {
            // --- MODIFICATION START ---
            // Instead of showing modal, scroll to subscription card
            const el = document.getElementById('pricing'); // Use the correct ID for your subscription section
            if (el) {
              messageApi.warning('You have run out of credits. Please purchase a plan to continue.', 2);
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Optional: Add a visual cue like a temporary highlight or message near the card
              // e.g., el.classList.add('highlight-subscription'); setTimeout(() => el.classList.remove('highlight-subscription'), 3000);
            } else {
              console.warn('Subscription card element not found for scrolling.');
              // Fallback: Maybe show a simple alert or log an error
            }
            setIsProcessingTask(false); // Stop processing
            return; // Exit the function
            // --- MODIFICATION END ---
          }
        } else {
          console.warn('[DEBUG] Failed to get user package information, continuing without credit check');
        }
      } catch (creditError) {
        console.error('Error checking user credit:', creditError);
        // Optionally handle this error, e.g., show a generic error message
      }

      // Check for existing processing tasks (unchanged logic)
      try {
        const historyResponse = await apiClient.getAlternativeWebsiteList(1, 3);
        if (historyResponse?.code === 200 && historyResponse.data) {
          const processingTasks = historyResponse.data.filter(item =>
            item.generatorStatus === 'processing'
          );
          for (const task of processingTasks) {
            const statusResponse = await apiClient.getAlternativeStatus(task.websiteId);
            if (statusResponse?.code === 200 && statusResponse.data) {
              const planningStatuses = statusResponse.data;
              const productComparisonStatus = planningStatuses.find(planning =>
                planning.planningName === 'PRODUCT_COMPARISON'
              );
              if (productComparisonStatus && productComparisonStatus.status !== 'init') {
                const modalContainer = document.createElement('div');
                modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm';
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-700 animate-fadeIn';
                const title = document.createElement('h3');
                title.className = 'text-xl font-semibold text-white mb-4';
                title.textContent = 'Your Task Is In Progress';
                const description = document.createElement('p');
                description.className = 'text-gray-300 mb-3';
                description.textContent = 'You already have a generation task in progress. Please wait for it to complete before starting a new one.';
                const limitNote = document.createElement('p');
                limitNote.className = 'text-gray-400 text-sm mb-2';
                limitNote.textContent = 'Our system currently allows only one active task at a time to ensure optimal performance.';
                const emailNote = document.createElement('p');
                emailNote.className = 'text-gray-400 text-sm mb-6';
                emailNote.textContent = 'You will receive an email notification when your current task is complete.';
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex justify-end';
                const closeButton = document.createElement('button');
                closeButton.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors';
                closeButton.textContent = 'Got it';
                closeButton.onclick = () => {
                  document.body.removeChild(modalContainer);
                };
                buttonContainer.appendChild(closeButton);
                modalContent.appendChild(title);
                modalContent.appendChild(description);
                modalContent.appendChild(limitNote);
                modalContent.appendChild(emailNote);
                modalContent.appendChild(buttonContainer);
                modalContainer.appendChild(modalContent);
                document.body.appendChild(modalContainer);
                setIsProcessingTask(false);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error checking task status:', error);
      }

      // Fade out initial screen (unchanged logic)
      const formElement = document.querySelector('.initial-screen-content form');
      if (formElement) {
        formElement.classList.add('form-transition', 'fade-out');
      }
      setTimeout(() => {
        const initialScreenElement = document.querySelector('.initial-screen-container');
        if (initialScreenElement) {
          initialScreenElement.classList.add('fade-out-animation');
          setTimeout(() => {
            setShowInitialScreen(false);
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
            setTimeout(() => {
              document.body.removeChild(loadingContainer);
            }, 1200);
          }, 500);
        } else {
          setShowInitialScreen(false);
        }
      }, 300);
      setLoading(true);
      const formattedInput = userInput.trim();
      let inputForAPI = '';
      try {
        // 检查是否是URL格式
        if (formattedInput.includes('://') || formattedInput.includes('.')) {
          // 尝试创建URL对象
          let url;
          try {
            // 如果没有协议，添加一个临时协议
            if (!formattedInput.includes('://')) {
              url = new URL('https://' + formattedInput);
            } else {
              url = new URL(formattedInput);
            }
            // 只提取主机名部分
            inputForAPI = 'https://' + url.hostname;
          } catch (e) {
            // 如果URL解析失败，尝试使用正则表达式提取域名
            const domainMatch = formattedInput.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
            if (domainMatch && domainMatch[1]) {
              inputForAPI = domainMatch[1];
            }
          }
        }
      } catch (error) {
        console.error('Error extracting domain:', error);
      }

      setUserInput('');
      localStorage.removeItem('urlInput');

      messageHandler.addUserMessage(formattedInput);
      while (messageHandler.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      thinkingMessageId = messageHandler.addAgentThinkingMessage();
      while (messageHandler.isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const generateIdResponse = await apiClient.generateWebsiteId();
      if (generateIdResponse?.code !== 200 || !generateIdResponse?.data?.websiteId) {
        console.error("Failed to generate websiteId:", generateIdResponse);
        return;
      }
      const websiteId = generateIdResponse.data.websiteId;
      setCurrentWebsiteId(websiteId);

      const greetingResponse = await apiClient.chatWithAI(
        inputForAPI, 
        websiteId,
      );
      if (greetingResponse?.code === 1058) {
        messageHandler.updateAgentMessage("Oops! The service encountered a temporary issue. Could you please try sending your message again?", thinkingMessageId);
        return;
      }

      if (greetingResponse?.code === 200 && greetingResponse.data?.answer) {
        const answer = filterMessageTags(greetingResponse.data.answer);
        if (greetingResponse.data.answer.includes('[URL_GET]')) {
          setInputDisabledDueToUrlGet(true);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          const searchResponse = await apiClient.searchCompetitor(
            inputForAPI, // 使用提取的 hostname
            false,
            websiteId
          );
          if (searchResponse?.code === 1058) {
            messageHandler.updateAgentMessage("Oops! The service encountered a temporary issue. Could you please try sending your message again?", thinkingMessageId);
            return;
          }
          if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
            setShouldConnectSSE(true);
          }

          while (messageHandler.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          messageHandler.addSystemMessage('Searching for competitors. Please wait a moment...');
          setIsMessageSending(true);
          while (messageHandler.isProcessing) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          setCanProcessCompetitors(true);
        } else {
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
        }
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setLoading(false);
      // --- REMOVED --- setIsProcessingTask(false) was here, moved earlier in credit check fail case
    }
  };

  useEffect(() => {
    // --- 添加 currentWebsiteId 到依赖项 ---
    if (!shouldConnectSSE || !currentWebsiteId) {
      // --- 新增：如果不需要连接，确保停止重连提示 ---
      isShowingReconnectNoticeRef.current = false;
      if (sseReconnectNoticeTimeoutRef.current) {
        clearTimeout(sseReconnectNoticeTimeoutRef.current);
        sseReconnectNoticeTimeoutRef.current = null;
      }
      // --- 结束新增 ---
      return;
    }
    const customerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';

    // 定义重试相关常量
    const MAX_RETRY_COUNT = 5;
    const BASE_RETRY_DELAY = 5000; // 基础重试延迟 5 秒
    const MAX_RETRY_DELAY = 60000; // 最大重试延迟 60 秒

    if (!isLoggedIn || !customerId || !token) {
      setSseConnected(false);
      return;
    }

    let eventSource = null;

    const showErrorModal = (errorMessage = 'An irreversible error occurred during the task.') => {
      // 确保只显示一个错误弹窗
      if (document.querySelector('.error-modal-container')) {
        return;
      }

      const modalContainer = document.createElement('div');
      modalContainer.className = 'error-modal-container fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4'; // 提高 z-index

      const modalContent = document.createElement('div');
      modalContent.className = 'bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg shadow-xl p-6 max-w-md w-full border border-red-500/50 relative animate-fadeIn'; // 使用渐变背景和红色边框

      // 添加 SVG 图标
      const iconContainer = document.createElement('div');
      iconContainer.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4';
      iconContainer.innerHTML = `
        <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      `;

      const title = document.createElement('h3');
      title.className = 'text-xl font-semibold text-white mb-3 text-center flex items-center justify-center gap-2'; // 使用 flex 布局居中并添加间距
      // 添加 😭 表情符号
      title.innerHTML = `
        <span>Oops! Something Went Wrong...</span>
        <span class="text-2xl">😭</span> 
      `;

      const description = document.createElement('p');
      description.className = 'text-gray-300 mb-2 text-center text-sm';
      // 更新描述，告知用户技术团队已知晓
      description.textContent = `We encountered a hiccup processing your request (${errorMessage}). Our tech wizards have been notified and are on the case!`; 

      const creditInfo = document.createElement('p');
      creditInfo.className = 'text-green-400 mb-4 text-center text-sm font-medium';
      creditInfo.textContent = 'Good news: Your credits have not been deducted for this task.'; // 保持不变

      const instruction = document.createElement('p');
      instruction.className = 'text-gray-400 mb-6 text-center text-sm';
      // 更新指示，鼓励用户重试
      instruction.textContent = 'Could you please try starting the task again from the homepage?'; 

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex justify-center'; // 居中按钮

      const closeButton = document.createElement('button');
      closeButton.className = 'px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900';
      closeButton.textContent = 'Return to Homepage';

      closeButton.onclick = () => {
        document.body.removeChild(modalContainer);
        // 可以选择跳转到首页
        window.location.href = '/'; // 或者你的首页路由
      };

      modalContent.appendChild(iconContainer);
      modalContent.appendChild(title);
      modalContent.appendChild(description);
      modalContent.appendChild(creditInfo);
      modalContent.appendChild(instruction);
      buttonContainer.appendChild(closeButton);
      modalContent.appendChild(buttonContainer);
      modalContainer.appendChild(modalContent);
      document.body.appendChild(modalContainer);

      // 停止 SSE 连接并重置状态
      if (eventSource) {
        eventSource.close();
      }
      setSseConnected(false);
      setIsProcessingTask(false); // 标记任务处理结束
      setInputDisabledDueToUrlGet(false); // 允许用户输入
      setShouldConnectSSE(false); // 防止自动重连
      // 清理重试逻辑
      retryCountRef.current = 0;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      const currentToken = localStorage.getItem('alternativelyAccessToken');
      if (!currentToken) {
        setSseConnected(false);
        return;
      }

      // --- 修改 SSE 连接 URL，加入 websiteId ---
      const sseUrl = `https://api.websitelm.com/events/${customerId}-${currentWebsiteId}-chat`;

      // 修复：增加错误处理和超时设置
      try {
        eventSource = new EventSourcePolyfill(sseUrl, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          // 增加超时时间，避免频繁断开重连
          heartbeatTimeout: 60000, // 60秒
          // 增加连接超时
          connectionTimeout: 15000 // 15秒连接超时
        });
      } catch (error) {
        console.error('Error creating EventSource:', error);
        setSseConnected(false);
        return;
      }

      eventSource.onopen = () => {
        setSseConnected(true);
        retryCountRef.current = 0;  // 这里在连接成功时重置了计数器

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        // --- 新增：停止重连提示并在成功时通知 ---
        isShowingReconnectNoticeRef.current = false;
        if (sseReconnectNoticeTimeoutRef.current) {
          clearTimeout(sseReconnectNoticeTimeoutRef.current);
          sseReconnectNoticeTimeoutRef.current = null;
        }
        // --- 结束新增 ---
      };

      eventSource.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          console.log('logData', logData);
          let currentStepNumber = currentStep;

          // 处理 Error 类型日志
          if (logData.type === 'Error') {
            console.error('Received Error log from SSE:', logData.content);
            const errorMessage = logData.content.description;
            showErrorModal(errorMessage); // 显示错误弹窗并停止 SSE
            return; // 停止处理后续逻辑
          }

          if (logData.type === 'Html') {
            if (!hasTriggeredStep4Ref.current && currentStep < 5) {
              setCurrentStep(4);
              hasTriggeredStep4Ref.current = true; 
            }
            // 如果是新的流式输出开始，重置累积的内容
            if (!isStreamingRef.current || currentStreamIdRef.current !== logData.id) {
              htmlStreamRef.current = '';
              currentStreamIdRef.current = logData.id;
              isStreamingRef.current = true;

              // 添加新的日志项
              setLogs(prevLogs => [...prevLogs, {
                id: logData.id,
                type: 'Html',
                content: '',
                timestamp: new Date().toISOString(),
                currentStep: currentStepNumber
              }]);
            }

            // 累积 HTML 内容
            htmlStreamRef.current += logData.content;

            // 更新对应的日志项 - ★★★ 修改这里 ★★★
            setLogs(prevLogs => prevLogs.map(log =>
              // 确保只更新 ID 匹配且类型为 Html 的日志
              (log.id === currentStreamIdRef.current && log.type === 'Html') 
                ? {...log, content: htmlStreamRef.current}
                : log
            ));
            
            // 在下一个微任务中执行滚动，确保 DOM 已更新
            setTimeout(() => {
              if (codeContainerRef.current) {
                codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
              }
            }, 0);
          }
          // --- 新增 Color 类型流式处理的逻辑 ---
          else if (logData.type === 'Color') {
            // 如果是新的流式输出开始，重置累积的内容
            if (!isColorStreamingRef.current || currentColorStreamIdRef.current !== logData.id) {
              colorStreamRef.current = '';
              currentColorStreamIdRef.current = logData.id;
              isColorStreamingRef.current = true;

              // 添加新的日志项
              setLogs(prevLogs => [...prevLogs, {
                id: logData.id,
                type: 'Color',
                content: '', // 初始内容为空
                step: logData.step,
                timestamp: logData.timestamp || new Date().toISOString(),
                currentStep: currentStepNumber
              }]);
            }

            // 累积 Color 内容
            colorStreamRef.current += logData.content;

            // 更新对应的日志项 - ★★★ 修改这里 ★★★
            setLogs(prevLogs => prevLogs.map(log =>
              // 确保只更新 ID 匹配且类型为 Color 的日志
              (log.id === currentColorStreamIdRef.current && log.type === 'Color')
                ? {...log, content: colorStreamRef.current}
                : log
            ));
          }
          // --- 修改：移除旧的 'Crawler' 处理逻辑 ---
          // --- 新增：处理 'Crawler_Images' 类型 ---
          else if (logData.type === 'Crawler_Images') {
            // ★★★ 修改：直接存储原始数组（或确保是数组）★★★
            const standardizedLog = {
              id: logData.id || `crawler-images-${Date.now()}-${Math.random()}`,
              type: logData.type,
              // 直接存储 content，确保它是一个数组
              content: Array.isArray(logData.content) ? logData.content : [], 
              step: logData.step,
              timestamp: logData.timestamp || new Date().toISOString(),
              currentStep: currentStepNumber
            };
            setLogs(prevLogs => [...prevLogs, standardizedLog]);
          }
          // --- 修改：处理 'Crawler_Headers' 类型 ---
          else if (logData.type === 'Crawler_Headers') {
             // ★★★ 修改：直接存储原始数组（或确保是数组）★★★
            const standardizedLog = {
              id: logData.id || `crawler-headers-${Date.now()}-${Math.random()}`,
              type: logData.type,
              // 直接存储 content，确保它是一个数组
              content: Array.isArray(logData.content) ? logData.content : [],
              step: logData.step,
              timestamp: logData.timestamp || new Date().toISOString(),
              currentStep: currentStepNumber
            };
            setLogs(prevLogs => [...prevLogs, standardizedLog]);
          }
          // --- 修改：处理 'Crawler_Footers' 类型 ---
          else if (logData.type === 'Crawler_Footers') {
             // ★★★ 修改：直接存储原始数组（或确保是数组）★★★
            const standardizedLog = {
              id: logData.id || `crawler-footers-${Date.now()}-${Math.random()}`,
              type: logData.type,
              // 直接存储 content，确保它是一个数组
              content: Array.isArray(logData.content) ? logData.content : [],
              step: logData.step,
              timestamp: logData.timestamp || new Date().toISOString(),
              currentStep: currentStepNumber
            };
            setLogs(prevLogs => [...prevLogs, standardizedLog]);
          }
          else if (logData.type === 'Codes') {
            // 收到 Codes 类型，表示流式输出结束
            isStreamingRef.current = false;
            currentStreamIdRef.current = null;
            const logWithStep = {
              ...logData,
              currentStep: currentStepNumber // 添加 currentStep 字段
            };
            setLogs(prevLogs => [...prevLogs, logWithStep]);
          }
          else {
            // 其他类型的日志正常添加
            setLogs(prevLogs => [...prevLogs, { ...logData, currentStep: currentStepNumber }]);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.log('SSE Connection Error:', error);
        
        // 确保在关闭连接前记录当前的重试次数
        const currentRetryCount = retryCountRef.current;
        
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        setSseConnected(false);
        
        // --- 新增：启动重连提示循环 ---
        // 先清除可能存在的旧定时器
        if (sseReconnectNoticeTimeoutRef.current) {
          clearTimeout(sseReconnectNoticeTimeoutRef.current);
          sseReconnectNoticeTimeoutRef.current = null;
        }
        isShowingReconnectNoticeRef.current = true; // 标记正在显示提示

        const showReconnectNotice = () => {
          // 如果标记为 false，则停止循环
          if (!isShowingReconnectNoticeRef.current) return;

          // 设置下一个提示的定时器
          sseReconnectNoticeTimeoutRef.current = setTimeout(showReconnectNotice, 3000); // 每 3 秒重复
        };

        // 立即显示第一个提示
        showReconnectNotice();
        // --- 结束新增 ---

        // 使用之前保存的计数值，而不是直接使用ref
        if (currentRetryCount < MAX_RETRY_COUNT) {
          // 先增加计数，再保存到ref
          const newRetryCount = currentRetryCount + 1;
          retryCountRef.current = newRetryCount;

          // 使用指数退避策略计算延迟
          const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, newRetryCount - 1), MAX_RETRY_DELAY);

          console.log(`Retrying SSE connection in ${delay}ms (Attempt ${newRetryCount}/${MAX_RETRY_COUNT})`);

          // 清除之前的超时
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            // 检查是否仍需要连接
            if (shouldConnectSSE) {
              connectSSE();
            } else {
              console.log('SSE connection no longer needed, skipping retry');
              // --- 新增：如果不再需要连接，停止重连提示 ---
              isShowingReconnectNoticeRef.current = false;
              if (sseReconnectNoticeTimeoutRef.current) {
                clearTimeout(sseReconnectNoticeTimeoutRef.current);
                sseReconnectNoticeTimeoutRef.current = null;
              }
              // --- 结束新增 ---
            }
          }, delay);
        } else {
          console.log(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Giving up.`);
          // --- 新增：达到最大重试次数时停止提示 ---
          isShowingReconnectNoticeRef.current = false;
          if (sseReconnectNoticeTimeoutRef.current) {
            clearTimeout(sseReconnectNoticeTimeoutRef.current);
            sseReconnectNoticeTimeoutRef.current = null;
          }
          // 可选：显示最终的失败消息
          messageApi.error('Failed to reconnect to the agent after multiple attempts.', 5);
          // --- 结束新增 ---
        }
      };
    };

    connectSSE();

    return () => {
      console.log('[DEBUG] Cleaning up SSE connection');
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        setSseConnected(false);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      // --- 新增：组件卸载时停止重连提示 ---
      isShowingReconnectNoticeRef.current = false;
      if (sseReconnectNoticeTimeoutRef.current) {
        clearTimeout(sseReconnectNoticeTimeoutRef.current);
        sseReconnectNoticeTimeoutRef.current = null;
      }
      // --- 结束新增 ---
      retryCountRef.current = 0;
    };
  // --- 将 currentWebsiteId 添加到依赖数组 ---
  }, [shouldConnectSSE, currentWebsiteId, messageHandler, apiClient]); // Added dependencies

  useEffect(() => {
    // 检查是否存在 GENERATION_FINISHED 日志,是的话，就可以标记第5步生成完成
    const generationFinishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_FINISHED'
    );

    if (generationFinishedLog) {
      setCurrentStep(5);
    }

    const colorChangeFinishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_CHANGE_FINISHED'
    );

    if ((colorChangeFinishedLog) && shouldConnectSSE) {
      setShouldConnectSSE(false);
      setStyleChangeCompleted(true);
    }
  }, [logs, shouldConnectSSE]);

  useEffect(() => {
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

    // 检查改色任务完成
    const styleChangeFinishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_CHANGE_FINISHED' &&
      !log.processed
    );

    if (styleChangeFinishedLog) {
      // 标记该日志已处理，避免重复添加消息
      setLogs(prevLogs => prevLogs.map(log => 
        log.id === styleChangeFinishedLog.id ? {...log, processed: true} : log
      ));
      
      setIsProcessingTask(true);
      messageHandler.addSystemMessage("Task completed! Thank you for using our service. You can find your generated page in the history records in the upper right corner of the page, where you can deploy and adjust it further.");
      
    }
    
    // 添加检测任务完成的逻辑
    const finishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_FINISHED'
    );
    
    if (finishedLog && !finishedLog.processed) {
      // 标记该日志已处理，避免重复添加消息
      setLogs(prevLogs => prevLogs.map(log => 
        log.id === finishedLog.id ? {...log, processed: true} : log
      ));
      
      // 向chat接口发送任务完成消息，带有[PAGES_GENERATED]标记
      (async () => {
        try {
          const completionMessage = "Task completed successfully! You can check the generated pages in the simulated browser and let me know if you need to change the colors and styles of those pags. [PAGES_GENERATED]";
          const response = await apiClient.chatWithAI(completionMessage, currentWebsiteId);
          
          if (response?.code === 200 && response.data?.answer) {
            const answer = filterMessageTags(response.data.answer);

            const thinkingMessageId = messageHandler.addAgentThinkingMessage();
            messageHandler.updateAgentMessage(answer, thinkingMessageId);
          } else {
            // 如果API调用失败，仍然添加系统消息
            messageHandler.addSystemMessage(
              "Oops! The service encountered a temporary issue. Could you please try sending your message again?"
            );
          }
        } catch (error) {
          console.error("Error sending completion message:", error);
          // 出错时也添加系统消息
          messageHandler.addSystemMessage(
            "Failed to send completion message. Please try again later."
          );
        } finally {
          // 确保重新启用输入
          setInputDisabledDueToUrlGet(false);
        }
      })();
    }
  }, [logs, canProcessCompetitors]); // 当日志更新时检查

  useEffect(() => {
    return () => {
      competitorListProcessedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const allCodesLogs = logs.filter(log => log.type === 'Codes' && log.content?.resultId);
    
    processedLogIdsRef.current = [];
    
    const newCodesLogs = allCodesLogs;
    
    if (newCodesLogs.length === 0) {
      return;
    }
    
    const newTabsToAdd = [];
    
    newCodesLogs.forEach(log => {
      const tabId = `result-${log.content.resultId}`;
      
      const existingTab = browserTabs.find(tab => tab.id === tabId);
      
      if (!existingTab) {
        newTabsToAdd.push({
          id: tabId,
          title: `Result ${log.content.resultId}`,
          url: `https://preview.websitelm.site/en/${log.content.resultId}`
        });
      }
      
      processedLogIdsRef.current.push(log.id);
    });
    
    if (newTabsToAdd.length > 0) {
      setBrowserTabs(prevTabs => {
        const updatedTabs = [...prevTabs, ...newTabsToAdd];
        return updatedTabs;
      });
      
      // 设置最后一个新标签页为活动标签并切换到浏览器视图
      const lastNewTab = newTabsToAdd[newTabsToAdd.length - 1];
      setActiveTab(lastNewTab.id);
      setRightPanelTab('browser'); // 替换 setShowBrowser(true)
    }
  }, [logs]); // 只依赖 logs

  const processedLogIdsRef = useRef([]);

  useEffect(() => {
    return () => {
      processedLogIdsRef.current = [];
    };
  }, []);

  const handleExampleClick = (exampleKey) => { // 参数名改为 exampleKey 以示清晰
    // 1. 调用从父组件传入的函数，设置目标 Tab Key
    if (setTargetShowcaseTab) {
      // --- 修改：传递新的 key ('ranking', 'conversion', 'sem') ---
      setTargetShowcaseTab(exampleKey);
    } else {
      console.warn("setTargetShowcaseTab prop is missing in ResearchTool");
    }

    // 2. 滚动到 showcase 组件的容器
    const showcaseSection = document.getElementById('showcase-section');
    if (showcaseSection) {
      showcaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      console.warn("Element with ID 'showcase-section' not found for scrolling.");
    }
  };
  const currentTextIndexRef = useRef(0); // Track which sentence to display
  const isDeletingRef = useRef(false); // Track if currently deleting
  const charIndexRef = useRef(0); // Track character index within the sentence
  const sseReconnectNoticeTimeoutRef = useRef(null);
  const isShowingReconnectNoticeRef = useRef(false);

  useEffect(() => {
    const placeholderTexts = [
      "Enter your product website URL to get started.",
      "eg. altpage.ai or https://altpage.ai"
    ];
    const typingSpeed = 20; // milliseconds per character
    const deletingSpeed = 10;
    const pauseBetweenSentences = 1000; // Pause after typing a sentence
    const pauseAtEnd = 1000; // Pause after deleting a sentence

    // Refs are now accessed directly, no need to declare them here

    const clearTimers = () => {
      if (placeholderIntervalRef.current) {
        clearInterval(placeholderIntervalRef.current);
        placeholderIntervalRef.current = null;
      }
      if (placeholderTimeoutRef.current) {
        clearTimeout(placeholderTimeoutRef.current);
        placeholderTimeoutRef.current = null;
      }
    };

    const type = () => {
      clearTimers();
      const currentText = placeholderTexts[currentTextIndexRef.current];
      const currentSpeed = isDeletingRef.current ? deletingSpeed : typingSpeed;

      placeholderIntervalRef.current = setInterval(() => {
        if (isDeletingRef.current) {
          // Deleting logic
          if (charIndexRef.current > 0) {
            charIndexRef.current -= 1;
            setDynamicPlaceholder(currentText.substring(0, charIndexRef.current));
          } else {
            // Finished deleting current sentence
            isDeletingRef.current = false;
            // Move to the next sentence (looping back to 0 if needed)
            currentTextIndexRef.current = (currentTextIndexRef.current + 1) % placeholderTexts.length;
            clearTimers();
            // Pause before typing the next sentence
            placeholderTimeoutRef.current = setTimeout(type, pauseAtEnd);
          }
        } else {
          // Typing logic
          if (charIndexRef.current < currentText.length) {
            charIndexRef.current += 1;
            setDynamicPlaceholder(currentText.substring(0, charIndexRef.current));
          } else {
            // Finished typing current sentence
            isDeletingRef.current = true;
            clearTimers();
            // Pause before deleting
            placeholderTimeoutRef.current = setTimeout(type, pauseBetweenSentences);
          }
        }
      }, currentSpeed);
    };

    if (showInitialScreen) {
      // Reset state before starting
      currentTextIndexRef.current = 0;
      charIndexRef.current = 0;
      isDeletingRef.current = false;
      setDynamicPlaceholder('');
      // Start the effect after a short delay
      placeholderTimeoutRef.current = setTimeout(type, 500);
    } else {
      // Clear timers and set static placeholder if not on initial screen
      clearTimers();
      // 保留原始的静态 placeholder
      setDynamicPlaceholder("Enter product website URL to get started (e.g., example.com)");
    }

    // Cleanup function
    return () => {
      clearTimers();
    };
  }, [showInitialScreen]); // Rerun effect when showInitialScreen changes

  useEffect(() => {
    const shouldWarnOnRefresh = isProcessingTask;

    const handleBeforeUnload = (e) => {
      if (shouldWarnOnRefresh) {
        e.preventDefault();
        e.returnValue = 'Task is running, refreshing may cause the task to be cleaned up, continue?';
        return e.returnValue;
      }
    };

    if (shouldWarnOnRefresh) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isProcessingTask, currentStep, canProcessCompetitors]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // --- 新增：手动切换示例的函数 ---
  const goToNextExample = () => {
    setCurrentExampleIndex(prevIndex => (prevIndex + 1) % examples.length);
  };

  const goToPrevExample = () => {
    setCurrentExampleIndex(prevIndex => (prevIndex - 1 + examples.length) % examples.length);
  };
  // --- 结束新增 ---

  // --- 自动切换示例的 useEffect (保持不变) ---
  useEffect(() => {
    if (!showInitialScreen) return;

    const intervalId = setInterval(() => {
      setCurrentExampleIndex(prevIndex => (prevIndex + 1) % examples.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [showInitialScreen, examples.length]);
  // --- 结束 ---

  if (showInitialScreen) {
    const currentExample = examples[currentExampleIndex];
    return (
      <div className={`w-full h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden`}>
          <div className="absolute top-1/4 left-0 right-0 h-1/2 -translate-y-1/2 animate-shimmer pointer-events-none z-0"></div>
          {contextHolder}
          {isUserLoggedIn && (
          <div className={`fixed top-[80px] left-4 bottom-4 z-50 bg-slate-900/60 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-12'} overflow-visible`}> {/* 修改宽度 w-12 -> w-10 */}
            <button
              onClick={toggleSidebar}
              className="absolute top-2 right-2 z-[51] bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md" // 将 left-2 改为 right-2
              title={isSidebarOpen ? "Collapse History" : "Expand History"}
              style={{ outline: 'none' }}
            >
              {/* 保持图标逻辑不变 */}
              {isSidebarOpen ? <LeftOutlined style={{ fontSize: '14px' }} /> : <MenuOutlined style={{ fontSize: '14px' }} />}
            </button>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out pointer-events-none ${
                isSidebarOpen ? 'opacity-0' : 'opacity-100'
              }`}
              aria-hidden={isSidebarOpen} // 辅助技术隐藏
            >
              <span
                className="text-xs font-semibold text-slate-400"
                style={{
                  writingMode: 'vertical-rl', // 竖排，从右到左
                  textOrientation: 'mixed',   // 保持字符正立
                  transform: 'rotate(180deg)', // 旋转180度使文字从下往上读
                  whiteSpace: 'nowrap',       // 防止文字换行
                }}
              >
                My Tasks
              </span>
            </div>

            {/* 内容容器，根据状态控制透明度和交互 */}
            <div className={`flex-1 overflow-y-auto transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {isSidebarOpen && <HistoryCardList />}
            </div>
          </div>
          )}
          {/* === 结束修改侧边栏 === */}
        {/* 添加垂直文本样式 */}
          <style jsx>{`
            .vertical-text {
              writing-mode: vertical-rl;
              text-orientation: mixed;
              transform: rotate(180deg);
            }
            @keyframes shimmer {
              0% {
                opacity: 0.6; /* 保持之前的设置 */
                transform: translateX(-100%) rotate(-12deg);
                /* 保持之前的柔和渐变 */
                background: linear-gradient(90deg,
                  transparent 0%,
                  rgba(130, 100, 255, 0.05) 20%,
                  rgba(255, 255, 255, 0.3) 50%,
                  rgba(130, 100, 255, 0.05) 80%,
                  transparent 100%
                );
              }
              50% {
                opacity: 0.8; /* 保持之前的设置 */
              }
              100% {
                opacity: 0.6; /* 保持之前的设置 */
                transform: translateX(100%) rotate(12deg);
                /* 保持渐变一致 */
                 background: linear-gradient(90deg,
                  transparent 0%,
                  rgba(130, 100, 255, 0.05) 20%,
                  rgba(255, 255, 255, 0.3) 50%,
                  rgba(130, 100, 255, 0.05) 80%,
                  transparent 100%
                );
              }
            }
            .animate-shimmer {
              animation: shimmer 7s infinite linear;
              filter: blur(100px); /* 保持强模糊 */
              transform: scale(1.1); /* ★★★ 恢复并设置缩放 ★★★ */
              /* 保持之前的遮罩 */
              mask-image: radial-gradient(ellipse at center, black 5%, transparent 75%);
              -webkit-mask-image: radial-gradient(ellipse at center, black 5%, transparent 75%);
            }
          `}</style>

        {/* Ensure content is above the effects - 保持原有布局不变 */}
        <div className={`relative z-10 w-full max-w-8xl px-8 py-12 initial-screen-content rounded-xl bg-transparent flex flex-row items-start gap-12`}>
          {/* === 左侧栏 (恢复到之前的状态) === */}
          <div className="w-1/2 flex flex-col"> {/* 设置左栏宽度并设为 flex 容器 */}
            <div className={`mb-8`}>
              {/* --- 修改：改为 items-end 实现右对齐 --- */}
              <h1 className={`text-4xl font-bold mb-6 text-right`}>
                <div className="relative inline-block"> {/* inline-block 使其宽度适应内容 */}
                  <span className="text-6xl font-bold bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent [text-shadow:0_0_10px_rgba(255,255,255,0.4)]">
                    Own 
                    <br />
                    Every
                    <br />
                    '<span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">[Competitor] Alternative</span>'
                    <br />
                    Search.
                  </span>
                </div>
              </h1>
              {/* --- 段落保持右对齐 --- */}
              <p className="text-lg text-gray-300 mt-2 mb-8 text-right">
                AI pages that outrank, out-convert, and update themselves.
              </p>
            </div>

            {/* 将表单和提示移到左栏 */}
            <div className="relative max-w-[44rem] ml-auto w-full"> {/* 父容器，定义了最大宽度 */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!validateDomain(userInput)) {
                  console.log('[DEBUG] Invalid domain:', userInput);
                  messageApi.error('Please enter a valid domain (e.g., example.com or https://example.com)');
                  return;
                }
                const formattedInput = userInput.trim();
                initializeChat(formattedInput);
              }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                      <Input
                        placeholder={dynamicPlaceholder}
                        value={userInput}
                        onChange={(e) => {
                          setUserInput(e.target.value);
                          localStorage.setItem('urlInput', e.target.value);
                        }}
                        className={`research-tool-input w-full border rounded-xl text-lg bg-white/90 border-blue-600/50 focus:border-blue-500 focus:ring focus:ring-blue-500/30 text-stone-800 placeholder-stone-500/80`}
                        style={{
                          color: '#433422',
                          height: '64px', // <-- 修改：将输入框高度调整为 64px 以匹配按钮
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                        }}
                      />
                    </div>
                    <div>
                      <button
                        type="submit"
                        // --- 修改：减少水平内边距 (px-6 -> px-4)，移除 border 类 ---
                        className={`px-4 py-4 text-base
                          bg-gradient-to-r from-blue-500 to-purple-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:from-blue-400 hover:to-purple-600
                          rounded-xl
                          transition-all duration-300 flex items-center gap-2
                          hover:scale-105 shadow-lg
                          ${isProcessingTask ? 'opacity-70 cursor-not-allowed hover:scale-100' : 'cursor-pointer'}`}
                        style={{ height: '64px' }} // 按钮高度，可调整以匹配输入框
                        disabled={!userInput.trim() || isProcessingTask}
                      >
                        {isProcessingTask ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="relative z-10">Processing...</span>
                          </>
                        ) : (
                          <>
                            <ArrowRightOutlined className="w-6 h-6" />
                            <span className="relative z-10">Start Creating!</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
              </form>
            </div>

            <div className="mt-4 mb-8 ml-auto w-fit">
              {/* --- 修改：移除 bg-yellow-50, border, border-yellow-200, 修改 text-gray-300 为 text-yellow-400 --- */}
              <div
                className="inline-flex items-center px-2.5 py-1.5 rounded text-yellow-400 text-xs"
                style={{ minWidth: 0, fontWeight: 400 }}
              >
                <svg className="w-4 h-4 mr-1 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
                </svg>
                Generate and deploy <span className="mx-1 underline decoration-wavy decoration-yellow-200">5 free alternative pages</span> – no credit card required.
              </div>
            </div>
          </div>
          {/* === 结束左侧栏 === */}

          {/* === 右侧栏 (修改标题和时间戳位置) === */}
          <div className="w-1/2 flex flex-col items-center justify-center relative">
            <p className="text-sm text-blue-300 mb-4 text-center flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="[text-shadow:0_0_8px_rgba(59,130,246,0.5)]">{currentExample.timestamp}</span>
            </p>
            <div className="relative w-full max-w-xxl px-12">
              <button
                onClick={goToPrevExample}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-1 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-label="Previous example"
              >
                <LeftOutlined />
              </button>
              <a
                key={currentExampleIndex}
                href={currentExample.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mx-auto bg-stone-900/50 border-blue-700/30 hover:border-blue-600/50 text-stone-300 backdrop-blur-sm rounded-xl border relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 animate-fadeIn"
              >
                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-700/80 flex items-center px-3 z-10 pointer-events-none">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-grow text-center">
                    <span className="text-xs text-slate-300 truncate">{currentExample.title}</span>
                  </div>
                  <div className="flex space-x-1.5 invisible"> {/* 使用 invisible 使其不显示但仍占据空间 */}
                    <div className="w-2.5 h-2.5"></div>
                    <div className="w-2.5 h-2.5"></div>
                    <div className="w-2.5 h-2.5"></div>
                  </div>
                </div>
                {/* --- 修改：给图片容器添加固定高度和 overflow-hidden --- */}
                <div className="pt-8 h-[400px] overflow-hidden"> {/* 你可以根据需要调整这个高度，例如 h-[350px] 或 h-[450px] */}
                <img
                    src={currentExample.image}
                    alt={`Preview of ${currentExample.title}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </a>

              {/* --- 修改：调整右按钮位置，移除 translate-x --- */}
              <button
                onClick={goToNextExample}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-1 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-label="Next example"
              >
                <RightOutlined />
              </button>
            </div>
            {/* --- 指示点 (保持不变) --- */}
            <div className="flex justify-center space-x-2 mt-6">
              {examples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentExampleIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentExampleIndex ? 'bg-blue-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to example ${index + 1}`}
                />
              ))}
            </div>
            {/* --- 结束指示点 --- */}
          </div>
          {/* === 结束右侧栏 === */}

        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className={`w-full min-h-screen bg-cover bg-center bg-no-repeat text-white flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black`}
           style={{
             paddingTop: "80px",
             backgroundImage: `
               radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 35%), /* 降低 alpha 值 */
               radial-gradient(circle at 80% 70%, rgba(129, 140, 248, 0.05) 0%, transparent 45%), /* 降低 alpha 值 */
               linear-gradient(to bottom right, #1e293b, #0f172a, #000000) /* 保持原有渐变 */
             `,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>

        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          <div className="w-[35%] relative flex flex-col">
            <div className="h-12 px-4 border-b border-gray-300/20 flex-shrink-0 flex items-center justify-between relative">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
              {isProcessingTask && ( // 中止按钮只在任务进行中显示
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">
                    If you want to abort the current task...
                  </span>
                  <button
                    type="button"
                    className="p-0"
                    title="Abort Task"
                    onClick={() => setShowAbortModal(true)}
                    style={{
                      height: '28px',
                      width: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
                      borderRadius: '50%',
                      boxShadow: '0 0 8px 1.5px rgba(185, 28, 28, 0.4), 0 2px 4px 0 rgba(127,29,29,0.10)',
                      border: 'none',
                      transition: 'box-shadow 0.3s ease-in-out',
                    }}
                  >
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: 'white',
                      borderRadius: '2px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                    }} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pt-12 px-4 pb-4 chat-messages-container">
              {showInitialScreen ? (
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

            <div className="p-4 border-t border-gray-300/20 flex-shrink-0"> {/* 保持这个区域不变 */}
              <div className="max-w-[600px] mx-auto">
                {styleChangeCompleted ? (
                  <div className={`flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800/60 border border-slate-700/50`}>
                    <p className={`text-center mb-3 text-sm `}>
                      The current task is complete. You can start a new task to generate more pages!
                    </p>
                    <button
                      onClick={() => window.open('https://altpage.ai', '_blank')}
                      className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg
                        bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border border-blue-600/50
                       hover:scale-105`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Start New Task
                    </button>
                  </div>
                ) : (
                  <>
                    <Tooltip
                      title={(loading || isMessageSending || inputDisabledDueToUrlGet) ? "Agent is working, please wait a sec." : ""}
                      placement="topLeft"
                    >
                      <div className="relative">
                        <style jsx>{`
                          .research-tool-input::placeholder {
                            color: #9ca3af; /* Default placeholder color */
                            opacity: 0.8;
                          }
                          /* === 新增：调整输入框右内边距 === */
                          .research-tool-input {
                            padding-right: 80px; /* 为按钮留出空间 */
                          }
                        `}</style>
                        <Input
                          autoComplete="off"
                          name="no-autofill"
                          ref={inputRef}
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          disabled={loading || isMessageSending || inputDisabledDueToUrlGet}
                          placeholder={
                            !(loading || isMessageSending || inputDisabledDueToUrlGet)
                              ? "Waiting for your answer..."
                              : ""
                          }
                          className={`research-tool-input bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm placeholder-gray-500`}
                          style={{
                            height: '48px',
                            transition: 'all 0.3s ease'
                          }}
                          onPressEnter={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (userInput.trim() && !loading && !isMessageSending && !inputDisabledDueToUrlGet) {
                              handleUserInput(e);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            if (userInput.trim() && !loading && !isMessageSending && !inputDisabledDueToUrlGet) {
                              handleUserInput(e);
                            }
                          }}
                          disabled={loading || isMessageSending || inputDisabledDueToUrlGet || !userInput.trim()} // 同时检查输入是否为空
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 text-xs font-medium rounded-md transition-all duration-300 flex items-center gap-1 shadow-sm
                            ${(loading || isMessageSending || inputDisabledDueToUrlGet || !userInput.trim())
                              ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-70'
                              : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:shadow-md'
                            }`}
                          style={{ height: '36px' }} // 按钮高度略小于输入框
                        >
                          Send
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                          </svg>
                        </button>
                        {/* === 结束新增 === */}
                      </div>
                    </Tooltip>
                    {!(loading || isMessageSending || inputDisabledDueToUrlGet) && (
                      <div
                        className="mt-2 flex items-center justify-center gap-2 animate-pulse"
                        style={{
                          background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', // Changed gradient to blue/indigo
                          color: '#fff',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '0.95rem', // 字体大小缩小
                          padding: '6px 0',    // 上下内边距也略微缩小
                          boxShadow: '0 2px 12px 0 rgba(59,130,246,0.15)' // Adjusted shadow color
                        }}
                      >
                        <svg className="w-4 h-4 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                        <span>It's your turn! Please enter your answer above 👆</span>
                      </div>
                    )}
                    <div className="flex justify-end mt-3 px-1">
                      <div className="text-xs text-gray-400">
                        Press Enter ↵ to submit
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={`w-[65%]
            bg-slate-900/10 border-blue-700/30
           backdrop-blur-lg rounded-2xl border shadow-xl flex flex-col h-full relative overflow-hidden`}>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-12 border-b border-gray-300/20 p-3 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setRightPanelTab('details')}
                      className={`text-sm ${
                        rightPanelTab === 'details'
                          ? 'text-blue-400 font-medium'
                          : 'text-gray-400 hover:'
                      }`}
                    >
                      Execution Log
                    </button>
                    <button
                      onClick={() => setRightPanelTab('browser')}
                      className={`text-sm ${
                        rightPanelTab === 'browser'
                           ? 'text-blue-400 font-medium'
                          : 'text-gray-400 hover:'
                      }`}
                    >
                      Browser
                  </button>
                </div>
                  <div className="flex items-center text-xs">
                      <div className="p-3 flex justify-end" style={{padding: 0, marginLeft: 3}}>
                          <div>
                            <Button
                              type="primary"
                              icon={<ArrowRightOutlined />}
                              onClick={() => {
                                if (browserTabs.length > 0) {
                                  // 打开新标签页，并附带查询参数和哈希
                                  window.open('https://altpage.ai?openPreviewModal=true#result-preview-section', '_blank');
                                } else {
                                  messageApi.info('Please wait until at least one page has finished generating.')
                                }
                              }}
                              className={`transition-all duration-300 ${
                                browserTabs.length == 0
                                  ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                              }`}
                              style={{
                                border: 'none',
                                fontWeight: 300,
                                fontSize: '10px',
                                padding: '3px 8px',
                                height: 'auto',
                                marginRight: '10px'
                              }}
                            >
                              Bind Your Own Domain
                            </Button>
                          </div>
                      </div>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className={'text-gray-400'}>Log Server {sseConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
          </div>
        </div>
              <div className="flex-1 overflow-y-auto">
                {rightPanelTab === 'details' && (
                  <div className="flex h-full">
                    <div className={`w-48 flex-shrink-0 border-r border-gray-300/20 p-3 overflow-y-auto bg-slate-800/30`}>
                      {!showInitialScreen && (
                        <div className="relative">
                          <div className="flex items-center space-x-2 mb-3"> {/* 调整标题和图标布局 */}
                            <svg className={`w-5 h-5 text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span className={`text-sm font-semibold text-blue-300`}>Task Progress</span>
                          </div>

                          <div className="flex flex-col space-y-2 w-full">
                            <div className={`text-xs rounded px-2 py-1.5 flex items-center justify-between transition-all duration-500 ${currentStep >= 1 // 高亮逻辑不变
                              ? 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40 text-white border border-blue-500/60 shadow-sm shadow-blue-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                              <span className={currentStep === 1 ? 'font-medium' : ''}>1. Find Competitors</span>
                              {/* --- 添加勾选图标 --- */}
                              {currentStep > 1 && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            <div className={`text-xs rounded px-2 py-1.5 flex items-center justify-between transition-all duration-500 ${currentStep >= 2 // 高亮逻辑不变
                              ? 'bg-gradient-to-r from-cyan-500/40 to-teal-500/40 text-white border border-cyan-500/60 shadow-sm shadow-cyan-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                              <span className={currentStep === 2 ? 'font-medium' : ''}>2. Select Competitor</span>
                              {/* --- 添加勾选图标 --- */}
                              {currentStep > 2 && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            <div className={`text-xs rounded px-2 py-1.5 flex items-center justify-between transition-all duration-500 ${currentStep >= 3 // 高亮逻辑不变
                              ? 'bg-gradient-to-r from-teal-500/40 to-green-500/40 text-white border border-teal-500/60 shadow-sm shadow-teal-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                              <span className={currentStep === 3 ? 'font-medium' : ''}>3. Analyze Competitor</span>
                              {/* --- 添加勾选图标 --- */}
                              {currentStep > 3 && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            <div className={`text-xs rounded px-2 py-1.5 flex items-center justify-between transition-all duration-500 ${currentStep >= 4 // 高亮逻辑不变
                              ? 'bg-gradient-to-r from-green-500/40 to-lime-500/40 text-white border border-green-500/60 shadow-sm shadow-green-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                              <span className={currentStep === 4 ? 'font-medium' : ''}>4. Page Generation</span>
                              {/* --- 添加勾选图标 --- */}
                              {currentStep > 4 && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            <div className={`text-xs rounded px-2 py-1.5 flex items-center justify-between transition-all duration-500 ${currentStep >= 5 // 高亮逻辑不变
                              ? 'bg-gradient-to-r from-lime-500/40 to-emerald-500/40 text-white border border-lime-500/60 shadow-sm shadow-lime-500/20'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                              <span className={currentStep === 5 ? 'font-medium' : ''}>5. Style Change(Optional)</span>
                              {/* --- 添加勾选图标 (特殊逻辑) --- */}
                              {(styleChangeCompleted || currentStep > 5) && ( // 如果改色完成 或 步骤已超过5
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {renderDetails()}
                    </div>
                  </div>
                )}
                {rightPanelTab === 'browser' && (
                  <div className="space-y-2">
                    {browserTabs.length === 0 ? (
                      <div className="text-gray-500 text-center py-4 text-xs">
                        No browser tabs available yet
                      </div>
                    ) : (
                      <div className="p-3">
                        <div className="flex items-center space-x-2 mb-3 overflow-x-auto">
                          {browserTabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
                                activeTab === tab.id
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-gray-500/20 text-gray-400 hover:text-gray-300'
                              }`}
                            >
                              {tab.title}
                            </button>
                          ))}
                        </div>

                        {activeTab && (
                          <div>
                            <div className={`flex items-center mb-2 rounded-lg p-2 bg-gray-800/50`}>
                              <div className={`flex-1 px-3 py-1.5 text-xs rounded mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap bg-gray-700/50 text-gray-300`}>
                                {browserTabs.find(tab => tab.id === activeTab)?.url}
                              </div>
                              <button
                                onClick={() => window.open(browserTabs.find(tab => tab.id === activeTab)?.url, '_blank')}
                                className={`p-1.5 rounded-md transition-colors duration-200 group hover:bg-gray-700/50`}
                                title="Open in new tab"
                              >
                                <svg
                                  className={`w-4 h-4 transition-colors duration-200 text-gray-400 group-hover:text-blue-400`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="bg-white rounded-lg overflow-hidden">
                              <iframe
                                src={browserTabs.find(tab => tab.id === activeTab)?.url}
                                className="w-full h-[calc(100vh-280px)]" 
                                title="Preview"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={showAbortModal}
        title="Abort Task"
        onCancel={() => setShowAbortModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowAbortModal(false)} disabled={aborting}>
            Cancel
          </Button>,
          <Button
            key="abort"
            type="primary"
            danger
            loading={aborting}
            onClick={async () => {
              if (Array.isArray(resultIds) && resultIds.length > 0) {
                // 已有结果，不执行删除，直接刷新
                setShowAbortModal(false);
                window.location.reload();
              } else {
                // 没有结果，执行删除
                setAborting(true);
                try {
                  const res = await apiClient.deletePage(currentWebsiteId);
                  if (res && res.code === 200) {
                    window.location.reload();
                  } else {
                    messageApi.error('Failed to abort the task. Please try again.');
                  }
                } catch (err) {
                  messageApi.error('Failed to abort the task. Please try again.');
                } finally {
                  setAborting(false);
                  setShowAbortModal(false);
                }
              }
            }}
          >
            Abort Anyway
          </Button>
        ]}
        zIndex={2000}
      >
        <div>
          {Array.isArray(resultIds) && resultIds.length > 0 ? (
            <>
              Are you sure you want to abort this task?<br />
              <b>
                This action will immediately terminate the current process.<br />
                <span style={{color: 'orange'}}>
                  The generated results will <u>not</u> be deleted. You can view and manually delete them from the history list on the homepage.
                </span>
              </b>
            </>
          ) : (
            <>
              Are you sure you want to abort this task?<br />
              <b>
                This action will immediately terminate the current process and <span style={{color: 'red'}}>no data will be saved</span>.<br />
                <span style={{color: 'green'}}>Since no results have been generated yet, aborting will not consume your credit.</span>
              </b>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ResearchTool;