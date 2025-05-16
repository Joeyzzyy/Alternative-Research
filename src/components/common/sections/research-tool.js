'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Input, Button, Spin, message, Tooltip, Avatar, Modal } from 'antd';
import { ArrowRightOutlined, InfoCircleOutlined, UserOutlined, LeftOutlined, RightOutlined, MenuOutlined, EditOutlined, ExportOutlined, LinkOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import { EventSourcePolyfill } from 'event-source-polyfill';
import MessageHandler from '../../../utils/MessageHandler';
import HistoryCardList from './result-preview.js';
import { useMediaQuery } from 'react-responsive';
import BrandAssetsModal from './brand-assets';

const TAG_FILTERS = {
  '\\[URL_GET\\]': '',  
  '\\[COMPETITOR_SELECTED\\]': '',  
  '\\[PAGES_GENERATED_END\\]': '',  
  '\\[FIRST_TIME_USER\\]': '',
  '\\[FIRST_TIME_USER_END\\]': '',
};
const ALTERNATIVELY_LOGO = '/images/alternatively-logo.png';

const ResearchTool = () => {
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
  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    return filteredMessage;
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); 
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const sidebarRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [taskSteps, setTaskSteps] = useState([
    { id: 1, name: "Find Competitors", gradient: "from-blue-500/40 to-cyan-500/40", borderColor: "border-blue-500/60", shadowColor: "shadow-blue-500/20" },
    { id: 2, name: "Select Competitor", gradient: "from-cyan-500/40 to-teal-500/40", borderColor: "border-cyan-500/60", shadowColor: "shadow-cyan-500/20" },
    { id: 3, name: "Analyze Competitor", gradient: "from-teal-500/40 to-green-500/40", borderColor: "border-teal-500/60", shadowColor: "shadow-teal-500/20" },
    { id: 4, name: "Page Generation", gradient: "from-green-500/40 to-lime-500/40", borderColor: "border-green-500/60", shadowColor: "shadow-green-500/20" },
  ]);
  const examples = [
    { url: 'https://alternative.nytgames.top/nyt-games-original-alternative', title: 'Play NYT Games Free: The Ultimate Word Puzzle Collection Without Subscriptions', image: '/images/preview-nytgames.png', timestamp: 'Generated 2 hours ago' },
    { url: 'https://alternative.neobund.com/doba-alternative', title: 'NeoBund: The Smarter Alternative to Doba with Guaranteed 2-Day US Shipping', image: '/images/preview-neobund.png', timestamp: 'Generated on April 26' },
    { url: 'https://www.dreambrand.studio/luxury-jewelry-influencer-ai-platform', title: 'Turn Your Influence into a Luxury Jewelry Empire with Al-Powered Design & Zero Hassle', image: '/images/preview-dreambrand.png', timestamp: 'Generated on April 30' }
  ];
  const processedStepLogIdsRef = useRef(new Set());
  const startedTaskCountRef = useRef(0);
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showBrandAssetsModal, setShowBrandAssetsModal] = useState(false);
  const [isTaskActiveForLogs, setIsTaskActiveForLogs] = useState(false);
  const [isBrowserSidebarOpen, setIsBrowserSidebarOpen] = useState(true);

  const latestLog = logs && logs.length > 0
    ? logs[logs.length - 1]
    : null;
  const latestLogPreview = latestLog
    ? `Agent is working, current step: ${latestLog.step || ''}, click for details`
    : 'Agent is ready to work for you';

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
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.source !== 'system' && !lastMessage.isThinking) {
      }
    }
  }, [messages]);

  const handleFirstTimeUsers = async (competitors) => {
    setCurrentStep(2);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();
    const competitorsStringMessage = 'I am a new user, choose the first competitor of the following list and directly start the generation process: ' 
      + JSON.stringify(competitors) + '[FIRST_TIME_USER]';
    try {
      const response = await apiClient.chatWithAI(competitorsStringMessage, currentWebsiteId);
      if (response?.code === 200 && response.data?.answer) {
        const answer = filterMessageTags(response.data.answer);
        messageHandler.updateAgentMessage(answer, thinkingMessageId);
        messageHandler.addSystemMessage('System starts analyzing competitors and generating alternative pages, please wait...');
        console.log('competitors', competitors);
        let firstCompetitorArray = [competitors[0].url];
        const generateResponse = await apiClient.generateAlternative(currentWebsiteId, firstCompetitorArray);
        if (generateResponse?.code === 200) {
          setCurrentStep(3);
          setIsProcessingTask(true);
          startedTaskCountRef.current += firstCompetitorArray.length;
        } else {
          messageHandler.addSystemMessage(`⚠️ Failed to generate alternative page: Invalid server response`);
        }
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    }
  }

  const handleCompetitorListRequest = async (competitors) => {
    setIsMessageSending(true);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();

    try {
      const response = await apiClient.chatWithAI(JSON.stringify(competitors), currentWebsiteId);

      if (response?.code === 200 && response.data?.answer) {
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
          className="flex justify-start mb-10" // mb-6 改为 mb-10，增加下方间距
          style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
        >
          <div className="max-w-[90%] w-full flex flex-col items-start ml-12">
            <div
              className="px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-medium flex items-center gap-2"
              style={{
                margin: 0,
                minWidth: '180px',
                maxWidth: '600px',
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
            <div className="flex-shrink-0" style={{animation: 'bounceIn 0.6s ease-out forwards'}}>
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
                  style={{maxWidth: '800px', wordWrap: 'break-word'}}>
                <div className="relative z-10">
                  {message.isThinking ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  ) : (
                    <div>
                      <span dangerouslySetInnerHTML={{ __html: filteredContent.split('\n').join('<br />') }} />
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
      setIsUserLoggedIn(true);
      if (localStorage.getItem('urlInput') && !isMobile) {
        setTimeout(() => {
          initializeChat(localStorage.getItem('urlInput'));
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

  const typeRefs = useRef({});
  const executionLogRef = useRef(null);
  useEffect(() => {
    if (executionLogRef.current) {
      executionLogRef.current.scrollTop = executionLogRef.current.scrollHeight;
    }
  }, [logs]);

  const renderDetails = () => {
    const typeNameMap = {
      Agent: 'Find Competitors',
      API: 'Get Competitor List',
      Info: 'Competitor List Check',
      Dify: 'Competitor Analysis',
      Color: 'Get Page Color Style',
      Html: 'Writing Codes',
    };

    // 1. 统计日志类型和每种类型的第一个索引
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
  
    mergedLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); // 正序，递增插入
  
    // 统计类型和第一个索引
    const typeIndexMap = {};
    const typeCountMap = {};
    mergedLogs.forEach((log, idx) => {
      if (typeIndexMap[log.type] === undefined) typeIndexMap[log.type] = idx;
      typeCountMap[log.type] = (typeCountMap[log.type] || 0) + 1;
    });
  
    // 为每种类型的第一个日志加 ref
    Object.keys(typeIndexMap).forEach(type => {
      if (!typeRefs.current[type]) {
        typeRefs.current[type] = React.createRef();
      }
    });
  
    // 目录点击滚动
    const handleTypeClick = (type) => {
      const ref = typeRefs.current[type];
      if (ref && ref.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  
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
      e.target.onerror = null;
      e.target.style.display = 'none';
      const parentLink = e.target.closest('a');
      if (parentLink) {
        parentLink.onclick = (event) => event.preventDefault();
        parentLink.style.cursor = 'default';
        parentLink.style.backgroundImage = `url('/images/image-cannot-be-displayed.png')`;
        parentLink.style.backgroundColor = '#4A5568';
      }
    };
  
    const latestHtmlLog = logs.filter(l => l.type === 'Html').slice(-1)[0];
    const latestHtmlLogId = latestHtmlLog ? latestHtmlLog.id : null;
  
    const latestAgentLog = mergedLogs.filter(l => l.type === 'Agent').slice(-1)[0];
    const latestAgentLogId = latestAgentLog ? latestAgentLog.id : null;
  
    const currentColorContent = (log) =>
      log.id === currentColorStreamIdRef.current
        ? colorStreamRef.current
        : log.content;
  
    return (
      <div className="h-full flex flex-row">
        {/* 左侧目录 */}
        <div className="w-66 flex-shrink-0 border-r border-gray-700/40 bg-gray-900/60 p-2">
          <div className="font-bold text-xs text-gray-300 mb-2">Deep Research</div>
          <ul className="space-y-1">
            {Object.keys(typeCountMap).map(type => (
              <li key={type}>
                <button
                  className="text-left w-full text-xs px-2 py-1 rounded hover:bg-blue-500/20 text-gray-200"
                  onClick={() => handleTypeClick(type)}
                >
                  {typeNameMap[type] || type} <span className="text-gray-400">({typeCountMap[type] + ' actions'})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* 右侧日志内容 */}
        <div className="flex-1 flex flex-col" ref={detailsRef}>
          <div className="p-3 space-y-2 overflow-y-auto flex-grow chat-messages-container"
            ref={executionLogRef}
            style={{ overflowX: 'hidden' }}
            >
            {mergedLogs.map((log, index) => {
              if (log.type === 'Info' || log.type === 'Codes') {
                return null;
              }
              // 在每种类型的第一个日志加 ref
              const logRef = typeIndexMap[log.type] === index ? typeRefs.current[log.type] : null;
  
              // ... 下面内容与原 renderDetails 保持一致 ...
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
  
              const isCrawlerType = log.type === 'Crawler_Images' || log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers';
              const uniqueKey = `${log.id || 'log'}-${log.type}-${index}`;
              const isEmptyCrawlerContent = log.content === null || (isCrawlerType && Array.isArray(log.content) && log.content.length === 0);
  
              if (log.type === 'Agent') {
                return (
                  <div
                    key={log.id || index}
                    ref={logRef}
                    className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn max-w-full break-words"
                    style={{ animationDelay: '0.5s' }}
                  >
                    <div className="flex items-center mb-2">
                      <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-4 h-4 mr-2" />
                      <div className="text-[11px] text-gray-300 font-medium">Agent Thinking...</div>
                    </div>
                    <div
                      ref={log.id === latestAgentLogId ? latestAgentContentRef : null}
                      className="text-[10px] text-gray-400 break-words leading-relaxed agent-log-content-wrapper overflow-y-auto"
                      style={{ maxHeight: '300px' }}
                      dangerouslySetInnerHTML={{ __html: filterLogContent(log.content) }}
                    />
                    <div className="text-[9px] text-gray-500 mt-1.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                );
              }
  
              return (
                <div
                  key={uniqueKey}
                  ref={logRef}
                  className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: '0.5s' }}
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
                    {isCrawlerType && (
                      <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.09M19.938 11a2 2 0 11-4 0 2 2 0 014 0zM14 21a4 4 0 100-8 4 4 0 000 8z" />
                      </svg>
                    )}
                    <div className="text-[11px] text-gray-300 font-medium">
                      {log.type === 'Dify' && 'Running Page Content Generation Workflow'}
                      {log.type === 'Error' && 'Error Message'}
                      {log.type === 'API' && 'Agent Action Result'}
                      {log.type === 'Color' && 'Analyzing Page Style'}
                      {log.type === 'Crawler_Images' && 'Crawled Images'}
                      {log.type === 'Crawler_Headers' && 'Crawled Header Links'}
                      {log.type === 'Crawler_Footers' && 'Crawled Footer Links'}
                    </div>
                  </div>
  
                  {log.type === 'Dify' && difyContent && (
                    <div className="text-[10px] text-gradient-metal break-words leading-relaxed space-y-1 max-w-full">
                      <div className="font-semibold text-sm text-gradient-metal mb-1">
                        Current Action
                      </div>
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
                      <div>
                        <span className="font-medium w-28 inline-block text-gradient-metal">Status:</span>
                        <span className="inline-block text-gradient-metal">{difyContent.event || ''}</span>
                      </div>
                      <div>
                        <span className="font-medium w-28 inline-block text-gradient-metal">Executor:</span>
                        <span className="inline-block text-gradient-metal">{log.step || difyContent.step || ''}</span>
                      </div>
                      {difyContent.data && typeof difyContent.data === 'object' && (
                        <div>
                          <span className="font-medium w-28 inline-block text-gradient-metal">Node ID:</span>
                          <span className="inline-block text-gradient-metal">{difyContent.data.id || ''}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium w-28 inline-block text-gradient-metal">Workflow ID:</span>
                        <span className="inline-block text-gradient-metal">{difyContent.workflow_id || ''}</span>
                      </div>
                      <div>
                        <span className="font-medium w-28 inline-block text-gradient-metal">Task ID:</span>
                        <span className="inline-block text-gradient-metal">{difyContent.task_id || ''}</span>
                      </div>
                      {difyContent.data?.error && (
                        <div className="mt-1 pt-1 border-t border-gray-700/50 text-gradient-metal-error">
                          <span className="font-semibold">Error:</span> {difyContent.data.error}
                        </div>
                      )}
                    </div>
                  )}
  
                  {log.type === 'Html' && (
                    <div
                      key={`${uniqueKey}-html-content`}
                      className="text-[10px] text-gray-400 break-words leading-relaxed max-w-full"
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
  
                  {log.type === 'Color' && (
                    <div
                      key={index}
                      className="text-[10px] text-gray-400 break-words leading-relaxed max-w-full"
                    >
                      <div className="mb-1">
                        <span className="font-semibold text-purple-400">Extracting Color Palette...</span>
                        <pre
                          className="mt-1 p-2 bg-gray-700/50 rounded text-xs whitespace-pre-wrap break-words overflow-y-auto"
                          style={{
                            maxHeight: '200px',
                            color: '#e9d5ff'
                          }}
                        >
                          {currentColorContent}
                        </pre>
                      </div>
                    </div>
                  )}
  
                  {isCrawlerType && (
                    <div
                      key={`${uniqueKey}-content`}
                      className="text-[10px] text-gray-400 break-words leading-relaxed mt-1 max-w-full"
                    >
                      {isEmptyCrawlerContent ? (
                        <p className="text-gray-500 italic">No relevant information retrieved.</p>
                      ) : (
                        <>
                          {log.type === 'Crawler_Images' && Array.isArray(log.content) && (
                            <div className="flex flex-wrap gap-2 max-w-full">
                              {log.content.map((item, imgIndex) => (
                                item.src ? (
                                  <a
                                    key={imgIndex}
                                    href={item.src}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block cursor-pointer w-16 h-16 rounded border border-gray-600 bg-gray-700 bg-center bg-no-repeat bg-contain overflow-hidden"
                                    style={{ backgroundImage: `url('/images/image-placeholder.svg')` }}
                                  >
                                    <img
                                      src={item.src}
                                      alt={item.alt || 'Crawled image'}
                                      className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity duration-300"
                                      onLoad={handleImageLoad}
                                      onError={handleImageError}
                                    />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs p-1.5 bg-gray-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none break-all">
                                      Alt: {item.alt || 'N/A'}<br />Src: {item.src}
                                    </div>
                                  </a>
                                ) : null
                              ))}
                            </div>
                          )}
  
                          {(log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers') && Array.isArray(log.content) && (
                            <ul className="list-none space-y-1 max-w-full">
                              {log.content.map((item, linkIndex) => (
                                (item.url && item.text !== undefined) ? (
                                  <li key={linkIndex}>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2"
                                      title={item.url}
                                    >
                                      {item.text || item.url}
                                    </a>
                                  </li>
                                ) : null
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
  
                  {log.type === 'Error' ? (
                    <div className="text-[10px] text-red-400 break-words leading-relaxed max-w-full">
                      {log.content?.error && (
                        <div className="mb-1">
                          <span className="font-semibold">Error Message:</span> {log.content.error}
                        </div>
                      )}
                    </div>
                  ) : log.type === 'API' ? (
                    <div className="text-[8px] text-gray-400 break-words leading-relaxed max-w-full">
                      {log.content?.status && (
                        <div className="mb-1">
                          <span className="font-semibold">Status:</span> {log.content.status}
                        </div>
                      )}
                      {log.content?.data && (
                        <div className="mb-1">
                          <span className="font-semibold">Data:</span>
                          <pre className="mt-1 p-2 bg-gray-700/50 rounded text-[8px] overflow-auto whitespace-pre-wrap break-words" style={{ maxWidth: '100%' }}>
                            {JSON.stringify(log.content.data, null, 2)}
                          </pre>
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
          messageHandler.updateAgentMessage(rawAnswer, thinkingMessageId);
          const searchResponse = await apiClient.searchCompetitor(
            formattedInput,
            false,
            currentWebsiteId
          );
          // 新增：处理 code 1075 的情况
          if (searchResponse?.code === 1075) {
            messageHandler.updateAgentMessage("⚠️ There are already tasks in progress. Please wait for the current task to finish or delete it before starting a new one.", thinkingMessageId);
            return;
          }
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
                .replace(/\\'/g, "'")  
                .replace(/\\"/g, '"')  
                .replace(/'/g, '"')    
                .trim();
              let competitors;
              try {
                competitors = JSON.parse(`[${cleanedString}]`);
              } catch (e) {
                competitors = cleanedString
                  .replace(/[\[\]'"`]/g, '') 
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0); 
              }
              if (Array.isArray(competitors) && competitors.length > 0) {
                const domainArray = competitors.map(comp => 
                  String(comp)
                    .trim()
                    .replace(/^https?:\/\//, '')  
                    .replace(/\/$/, '')           
                    .replace(/\s+/g, '')          
                ).filter(domain => domain.length > 0);  

                if (domainArray.length > 0) {
                  const generateResponse = await apiClient.generateAlternative(currentWebsiteId, domainArray);
                  if (generateResponse?.code === 200) {
                    setCurrentStep(3);
                    setIsProcessingTask(true);
                    startedTaskCountRef.current += domainArray.length;
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
            const el = document.getElementById('pricing'); // Use the correct ID for your subscription section
            if (el) {
              messageApi.warning('You have run out of credits. Please purchase a plan to continue.', 2);
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              console.warn('Subscription card element not found for scrolling.');
            }
            setIsProcessingTask(false);
            return; 
          } else if (availableCredits === pageGeneratorLimit && availableCredits > 0) {
            setIsFirstTimeUser(true);
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
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          const searchResponse = await apiClient.searchCompetitor(
            inputForAPI, // 使用提取的 hostname
            false,
            websiteId
          );
          // 新增：处理 code 1075 的情况
          if (searchResponse?.code === 1075) {
            messageHandler.updateAgentMessage("⚠️ There are already tasks in progress. Please wait for the current task to finish or delete it before starting a new one.", thinkingMessageId);
            return;
          }
          if (searchResponse?.code === 1058) {
            messageHandler.updateAgentMessage("Oops! The service encountered a temporary issue. Could you please try sending your message again?", thinkingMessageId);
            return;
          }
          if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
            setShouldConnectSSE(true);
            setIsTaskActiveForLogs(true);
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
      if (document.querySelector('.error-modal-container')) {
        return;
      }

      const modalContainer = document.createElement('div');
      modalContainer.className = 'error-modal-container fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4'; // 提高 z-index

      const modalContent = document.createElement('div');
      modalContent.className = 'bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg shadow-xl p-6 max-w-md w-full border border-red-500/50 relative animate-fadeIn'; // 使用渐变背景和红色边框

      const iconContainer = document.createElement('div');
      iconContainer.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4';
      iconContainer.innerHTML = `
        <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      `;

      const title = document.createElement('h3');
      title.className = 'text-xl font-semibold text-white mb-3 text-center flex items-center justify-center gap-2'; // 使用 flex 布局居中并添加间距
      title.innerHTML = `
        <span>Oops! Something Went Wrong...</span>
        <span class="text-2xl">😭</span> 
      `;

      const description = document.createElement('p');
      description.className = 'text-gray-300 mb-2 text-center text-sm';
      description.textContent = `We encountered an irreversible error. Any pages already generated will be saved.`; 

      const creditInfo = document.createElement('p');
      creditInfo.className = 'text-green-400 mb-4 text-center text-sm font-medium';
      creditInfo.textContent = 'Credits for unfinished pages will not be deducted.'; 

      const instruction = document.createElement('p');
      instruction.className = 'text-gray-400 mb-6 text-center text-sm';
      instruction.textContent = 'Could you please try starting the task again from the homepage?'; 

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex justify-center'; // 居中按钮

      const closeButton = document.createElement('button');
      closeButton.className = 'px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900';
      closeButton.textContent = 'Return to Homepage';

      closeButton.onclick = () => {
        document.body.removeChild(modalContainer);
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
              setCurrentStep(4);
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

          console.log(`Retrying SSE connection in ${delay}ms`);

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
          isShowingReconnectNoticeRef.current = false;
          if (sseReconnectNoticeTimeoutRef.current) {
            clearTimeout(sseReconnectNoticeTimeoutRef.current);
            sseReconnectNoticeTimeoutRef.current = null;
          }
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
      isShowingReconnectNoticeRef.current = false;
      if (sseReconnectNoticeTimeoutRef.current) {
        clearTimeout(sseReconnectNoticeTimeoutRef.current);
        sseReconnectNoticeTimeoutRef.current = null;
      }
      retryCountRef.current = 0;
    };
  }, [shouldConnectSSE, currentWebsiteId, messageHandler, apiClient]); // Added dependencies

  useEffect(() => {
    const generationFinishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_FINISHED' &&
      !processedStepLogIdsRef.current.has(log.id)
    );

    let logToProcess = null;
    if (generationFinishedLog) {
      logToProcess = generationFinishedLog;
    }

    if (logToProcess) {
      processedStepLogIdsRef.current.add(logToProcess.id);

      const nextStepId = currentStep + 1;
      setCurrentStep(nextStepId); 

      if (isFirstTimeUser && browserTabs.length >= 6) {
        setTaskSteps(prevSteps => {
          const newStep = {
            id: nextStepId,
            name: "Current Task Finished",
            gradient: "from-gray-500/40 to-slate-500/40",
            borderColor: "border-gray-500/60",
            shadowColor: "shadow-gray-500/20",
          };
          return [...prevSteps, newStep];
        });
        if (shouldConnectSSE) {
          setShouldConnectSSE(false);
        }
      } else if (!isFirstTimeUser && browserTabs.length >= 5) {
        setTaskSteps(prevSteps => {
          const newStep = {
            id: nextStepId,
            name: "Current Task Finished",
            gradient: "from-gray-500/40 to-slate-500/40",
            borderColor: "border-gray-500/60",
            shadowColor: "shadow-gray-500/20",
          };
          return [...prevSteps, newStep];
        });
        if (shouldConnectSSE) {
          setShouldConnectSSE(false);
        }
      }
    }
  }, [logs, shouldConnectSSE, setCurrentStep, setTaskSteps, setShouldConnectSSE]);

  useEffect(() => {
    const apiLog = logs.find(log => 
      log.type === 'API' && 
      log.step === 'GET_RESULT_COMPETITORS_SEMRUSH_API' &&
      log.content?.status === 'finished'
    );

    if (apiLog && apiLog.content?.data && !competitorListProcessedRef.current && canProcessCompetitors) {
      competitorListProcessedRef.current = true; 
      const competitors = apiLog.content.data;

      if (isFirstTimeUser) {
        handleFirstTimeUsers(competitors);
      } else {
        handleCompetitorListRequest(competitors);
      }
    }

    const finishedLog = logs.find(log => 
      log.type === 'Info' && 
      log.step === 'GENERATION_FINISHED'
    );
    
    if (finishedLog && isProcessingTask && browserTabs.length === startedTaskCountRef.current && startedTaskCountRef.current > 0) {
      setIsProcessingTask(false);
      (async () => {
        try {
          const completionMessage = "Current page generation is finished, move me to next step, tell me what i can do next [PAGES_GENERATED]";
          const response = await apiClient.chatWithAI(completionMessage, currentWebsiteId);
          
          if (response?.code === 200 && response.data?.answer) {
            const answer = filterMessageTags(response.data.answer);

            const thinkingMessageId = messageHandler.addAgentThinkingMessage();
            messageHandler.updateAgentMessage(answer, thinkingMessageId);
            
          } else {
            messageHandler.addSystemMessage(
              "Oops! The service encountered a temporary issue. Could you please try sending your message again?"
            );
          }
        } catch (error) {
          messageHandler.addSystemMessage(
            "Failed to send completion message. Please try again later."
          );
        } finally {
          setIsMessageSending(false);
        }
      })();
    }
  }, [logs, canProcessCompetitors, currentWebsiteId, messageHandler, apiClient, isProcessingTask]);

  useEffect(() => {
    return () => {
      competitorListProcessedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const allCodesLogs = logs.filter(log => log.type === 'Codes' && log.content?.resultId);

    // 过滤掉那些已经为其创建了标签页的日志，防止重复添加
    const newCodesLogs = allCodesLogs.filter(log =>
      !browserTabs.some(tab => tab.id === `result-${log.content.resultId}`)
    );

    if (newCodesLogs.length === 0) {
      return;
    }

    // 获取添加前已有的标签页数量
    const currentTabCount = browserTabs.length;
    const newTabsToAdd = [];

    newCodesLogs.forEach((log, index) => {
      const tabId = `result-${log.content.resultId}`;
      const pageNumber = currentTabCount + index + 1;

      newTabsToAdd.push({
        id: tabId,
        // --- 修改：使用递增的页码作为标题 ---
        title: `Page ${pageNumber}`,
        // --- 结束修改 ---
        url: `https://preview.websitelm.site/en/${log.content.resultId}`
      });

      // processedLogIdsRef.current.push(log.id); // 这行现在可能不是必需的，因为我们基于 browserTabs 过滤
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

  }, [logs, browserTabs, setBrowserTabs, setActiveTab, setRightPanelTab]);

  useEffect(() => {
    return () => {
      processedLogIdsRef.current = [];
    };
  }, []);

  const processedLogIdsRef = useRef([]);
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

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.ant-modal-root')) {
        return; // 如果点击在 Modal 内，则不执行关闭侧边栏的操作
      }

      // 检查侧边栏是否打开，ref 是否已绑定，以及点击的目标是否不在侧边栏内部
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar(); // 调用收起侧边栏的函数
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen, toggleSidebar]); 

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openHistoryList') === 'true') {
      setIsSidebarOpen(true);
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.delete('openHistoryList');
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [setIsSidebarOpen]);

  const renderMobileInitialScreen = () => {
    const currentExample = examples[currentExampleIndex];
    return (
      <div className={`w-full min-h-screen flex flex-col items-center justify-center relative bg-cover bg-center bg-no-repeat bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-y-auto px-4 py-16`}>
        <div className="absolute top-1/4 left-0 right-0 h-1/2 -translate-y-1/2 animate-shimmer pointer-events-none z-0 opacity-50"></div>
        {contextHolder}

        <div className="w-full flex flex-col items-center mb-8 mt-8">
          <div className={`mb-6 text-center`}>
            <h1 className={`text-3xl font-bold mb-4`}>
              <div className="relative inline-block">
                <span className="text-5xl font-bold bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent [text-shadow:0_0_10px_rgba(255,255,255,0.4)]">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Get Found</span> <br /> When People Search <br /> Your Competitor
                </span>
              </div>
            </h1>
            <p className="text-base text-gray-300 mt-1 mb-6">
            Own all your competitor's brand search traffic with AI-generated pages that outrank.
            </p>
          </div>

          <div className="relative max-w-md w-full mx-auto">
            <form onSubmit={(e) => {
              e.preventDefault();
              // 1. 首先验证域名
              if (!validateDomain(userInput)) {
                messageApi.error('Please enter a valid domain (e.g., example.com or https://example.com)');
                return;
              }
              // 2. 检查登录状态
              if (!isUserLoggedIn) {
                // 3. 未登录，触发 'showAlternativelyLoginModal' 事件来显示登录弹窗
                const showLoginEvent = new CustomEvent('showAlternativelyLoginModal');
                window.dispatchEvent(showLoginEvent);
                return;
              } else {
                // 4. 已登录，显示提示信息
                const formattedInput = userInput.trim();
                initializeChat(formattedInput); // 调用 initializeChat 来启动任务
                return; // 结束执行
              }
            }}>
              <div className="flex flex-col items-stretch gap-2">
                <div className="w-full">
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
                <div className="w-full">
                  <button
                    type="submit"
                    className={`px-4 py-4 text-base
                      bg-gradient-to-r from-blue-500 to-purple-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:from-blue-400 hover:to-purple-600
                      rounded-xl
                      transition-all duration-300 flex items-center justify-center gap-2 w-full {/* <-- 修改：添加 w-full 和 justify-center */}
                      hover:scale-105 shadow-lg
                      ${isProcessingTask ? 'opacity-70 cursor-not-allowed hover:scale-100' : 'cursor-pointer'}`}
                    style={{ height: '64px' }} 
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

          <div className="mb-6 mx-auto w-fit">
            <div className="inline-flex items-center px-2.5 py-1.5 rounded text-yellow-400 text-xs" style={{ minWidth: 0, fontWeight: 400 }}>
              <svg className="w-4 h-4 mr-1 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/> </svg>
              Generate and deploy 6 free alternative pages – no credit card required.
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-center relative"> {/* 移除 mb-8 */}
          <p className="text-sm text-blue-300 mb-3 text-center flex items-center justify-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="[text-shadow:0_0_8px_rgba(59,130,246,0.5)]">{currentExample.timestamp}</span>
          </p>
          <div className="relative w-full max-w-md"> {/* 调整最大宽度 */}
            <button
              onClick={goToPrevExample}
              className="absolute left-1 top-1/2 transform -translate-y-1/2 z-20 p-0.5 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Previous example"
            >
              <LeftOutlined style={{ fontSize: '16px' }} />
            </button>
            <a
              key={currentExampleIndex}
              href={currentExample.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mx-auto bg-stone-900/50 border-blue-700/30 hover:border-blue-600/50 text-stone-300 backdrop-blur-sm rounded-xl border relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group animate-fadeIn"
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
                 <div className="flex space-x-1.5 invisible">
                   <div className="w-2.5 h-2.5"></div><div className="w-2.5 h-2.5"></div><div className="w-2.5 h-2.5"></div>
                 </div>
              </div>
              <div className="pt-8 h-[250px] overflow-hidden"> {/* 移动端高度 */}
                <img
                  src={currentExample.image}
                  alt={`Preview of ${currentExample.title}`}
                  className="w-full h-full object-cover" /* 移动端使用 cover */
                  loading="lazy"
                />
              </div>
            </a>
            <button
              onClick={goToNextExample}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20 p-0.5 bg-slate-700/50 hover:bg-slate-600/70 rounded-full text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Next example"
            >
              <RightOutlined style={{ fontSize: '16px' }} />
            </button>
          </div>
          <div className="flex justify-center space-x-2 mt-4">
            {examples.map((_, index) => (
              <button key={index} onClick={() => setCurrentExampleIndex(index)} className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentExampleIndex ? 'bg-blue-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`} aria-label={`Go to example ${index + 1}`} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- 桌面端布局 ---
  const renderDesktopInitialScreen = () => {
    const currentExample = examples[currentExampleIndex];
    return (
      <div className={`w-full h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat bg-gradient-to-br from-slate-900 via-slate-950 to-black overflow-hidden`}>
          <div className="absolute top-1/4 left-0 right-0 h-1/2 -translate-y-1/2 animate-shimmer pointer-events-none z-0"></div>
          {contextHolder}
          {isUserLoggedIn && (
            <>
              {/* 折叠时只显示小按钮，icon为两条杠且靠左 */}
              {!isSidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="fixed top-20 left-4 z-50 bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md"
                  title="Expand History"
                  style={{ outline: 'none' }}
                >
                  {/* 两条杠靠左的SVG图标 */}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    {/* 上面一条长，靠左 */}
                    <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                    {/* 下面一条短，靠左 */}
                    <rect x="2" y="12" width="6" height="2" rx="1" fill="currentColor" />
                  </svg>
                </button>
              )}
              {isSidebarOpen && (
                <div
                  ref={sidebarRef}
                  className="fixed top-[72px] left-4 bottom-4 z-50 w-72 bg-slate-900/60 backdrop-blur-md rounded-lg shadow-xl border border-slate-700/50 flex flex-col transition-all duration-300 ease-in-out overflow-visible max-h-[80vh]" 
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSidebar();
                    }}
                    className="absolute top-2 right-2 z-[51] bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-md"
                    title="Collapse History"
                    style={{ outline: 'none' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor" />
                      <rect x="2" y="12" width="6" height="2" rx="1" fill="currentColor" />
                    </svg>
                  </button>
                  <div
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out pointer-events-none opacity-100"
                    aria-hidden={!isSidebarOpen}
                  >
                    <span
                      className="text-xs font-semibold text-slate-400"
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                    </span>
                  </div>
                  {/* 内容容器 */}
                  <div className="flex-1 overflow-y-auto transition-opacity duration-200 opacity-100 h-full">
                    <HistoryCardList />
                  </div>
                </div>
              )}
            </>
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
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Get Found</span> 
                    <br/>
                    When People Search 
                    <br/>
                    Your Competitor
                  </span>
                </div>
              </h1>
              {/* --- 段落保持右对齐 --- */}
              <p className="text-lg text-gray-300 mt-2 mb-8 text-right">
                Own all your competitor's brand search traffic with AI-generated pages that outrank.
              </p>
            </div>

            {/* 将表单和提示移到左栏 */}
            <div className="relative max-w-[44rem] ml-auto w-full"> {/* 父容器，定义了最大宽度 */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!userInput.trim()) {
                  messageApi.error('Please enter your product website URL.');
                  return;
                }
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
                        className={`px-4 py-4 text-base
                          bg-gradient-to-r from-blue-500 to-purple-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:from-blue-400 hover:to-purple-600
                          rounded-xl
                          transition-all duration-300 flex items-center justify-center gap-2 w-full {/* <-- 修改：添加 w-full 和 justify-center */}
                          hover:scale-105 shadow-lg
                          ${isProcessingTask ? 'opacity-70 cursor-not-allowed hover:scale-100' : 'cursor-pointer'}`}
                        style={{ height: '64px' }} 
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
            <div className="relative max-w-xxl px-12">
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
          </div>
        </div>
      </div>
    );
  };

  if (showInitialScreen) {
    return isMobile ? renderMobileInitialScreen() : renderDesktopInitialScreen();
  }

  return (
    <>
      {contextHolder}
      <div className={`w-full min-h-screen bg-cover bg-center bg-no-repeat text-white flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black`}
           style={{
             paddingTop: "40px",
             backgroundImage: `
               radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 35%), /* 降低 alpha 值 */
               radial-gradient(circle at 80% 70%, rgba(129, 140, 248, 0.05) 0%, transparent 45%), /* 降低 alpha 值 */
               linear-gradient(to bottom right, #1e293b, #0f172a, #000000) /* 保持原有渐变 */
             `,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
           }}>

        <div className={`relative z-10 w-full flex ${isMobile ? 'flex-col' : 'flex-row'} gap-6 h-[calc(100vh-140px)] px-4 text-sm`}>
          <div className={`${isMobile
                ? 'w-full h-full'
                : isBrowserSidebarOpen
                  ? 'w-1/2'
                  : 'w-[95%]'
              } relative flex flex-col`}>
            <div className="h-12 px-4 border-b border-gray-300/20 flex-shrink-0 flex items-center relative">
              <div className="flex items-center flex-shrink-0">
                <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                {isProcessingTask && (
                  <div className="flex items-center gap-2">
                    <Tooltip title="Cancel Current Task" placement="top">
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
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>

            {/* 移动端提示横幅 */}
            {isMobile && (
              <div className="bg-gradient-to-r from-red-600 to-pink-700 text-white px-4 py-2.5 text-xs font-medium shadow-md rounded-md my-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>For a better experience viewing execution process and generated pages, please visit on desktop.
                    You will be notified through email when the task is complete.
                  </span>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto pt-4 px-4 pb-4 chat-messages-container">
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
                {(!isFirstTimeUser && browserTabs.length >= 5) || (isFirstTimeUser && browserTabs.length >= 6) ? (
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
                      title={(loading || isMessageSending) ? "Agent is working, please wait a sec." : ""}
                      placement="bottomLeft"
                    >
                      <div className="relative">
                        <style jsx>{`
                          .research-tool-input::placeholder {
                            color: #9ca3af; /* Default placeholder color */
                            opacity: 0.8;
                          }
                        `}</style>
                        <div className="w-full max-w-xxl mx-auto">
                          {/* === 进度条 Progress 移动到这里 === */}
                          {!showInitialScreen && (
                            <div className="flex-1 flex justify-center mb-3">
                              <div className="flex flex-row items-center space-x-2 text-xs max-w-xl w-full"> 
                                <div className="flex items-center space-x-1 mr-2 flex-shrink-0">
                                  <span className="text-xs font-semibold text-blue-300">Progress</span>
                                </div>
                                <div className="flex flex-row space-x-1 w-full">
                                  {taskSteps.map((step) => (
                                    <div
                                      key={step.id}
                                      className={`text-xs rounded px-1 py-0.5 flex flex-1 items-center justify-between transition-all duration-500 ${
                                        currentStep >= step.id
                                          ? `bg-gradient-to-r ${step.gradient} text-white border ${step.borderColor} shadow-xs ${step.shadowColor}`
                                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                                      }`}
                                    >
                                      <span className={`${currentStep === step.id ? 'font-medium' : ''} truncate mr-0.5`}>{`${step.name}`}</span>
                                      {currentStep === step.id ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                                      ) : currentStep > step.id ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <div className="w-3 h-3 flex-shrink-0"></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {/* === 进度条 Progress 结束 === */}
                          <div className="rounded-2xl shadow-lg px-5 py-4 flex flex-col gap-2"
                            style={{
                              border: '1.5px solid #e0e7ef', // 只保留边框
                              background: 'transparent',      // 背景透明
                              boxShadow: '0 2px 16px 0 rgba(30,41,59,0.08)',
                              backdropFilter: 'blur(2px)',
                            }}
                          >
                            <Input
                              autoComplete="off"
                              name="no-autofill"
                              ref={inputRef}
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              disabled={loading || isMessageSending}
                              placeholder={
                                !(loading || isMessageSending)
                                  ? "Waiting for your answer..."
                                  : ""
                              }
                              className="bg-transparent border-none shadow-none text-base text-white placeholder-gray-400"
                              style={{
                                minHeight: '48px',
                                background: 'transparent',
                                color: '#fff',
                                boxShadow: 'none',
                                outline: 'none',
                                border: 'none',
                                paddingLeft: 0,
                                paddingRight: 0,
                                caretColor: '#fff',
                              }}
                              onFocus={e => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#fff';
                                e.target.style.outline = 'none';
                                e.target.style.boxShadow = 'none';
                                e.target.style.border = 'none';
                              }}
                              onBlur={e => {
                                e.target.style.background = 'transparent';
                                e.target.style.color = '#fff';
                                e.target.style.outline = 'none';
                                e.target.style.boxShadow = 'none';
                                e.target.style.border = 'none';
                              }}
                              onPressEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (userInput.trim() && !loading && !isMessageSending) {
                                  handleUserInput(e);
                                }
                              }}
                            />
                            <div className="flex justify-between items-end mt-1">
                              {/* 左侧：品牌色+统计+Check Pages */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowBrandAssetsModal(true)}
                                  className="w-auto px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-700 shadow-sm"
                                  style={{ height: '32px', minWidth: '90px' }}
                                >
                                  Set Brand Color
                                </button>
                                <div className="flex flex-col items-start" style={{ fontSize: '10px', minWidth: '100px' }}>
                                  <span className="text-[10px] text-blue-300 mb-0">Generated Pages</span>
                                  <span className="text-[13px] font-semibold text-white leading-none">{browserTabs.length}</span>
                                </div>
                                {browserTabs.length > 0 && (
                                  <button
                                    onClick={() => {
                                      setRightPanelTab('browser');
                                      if (browserTabs.length > 0 && !activeTab) {
                                        setActiveTab(browserTabs[0].id);
                                      }
                                    }}
                                    className={`ml-2 px-3 py-0.5 text-[10px] font-medium rounded transition-all duration-300 flex items-center justify-center gap-1
                                      bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700 border border-teal-600/50
                                      hover:scale-105 shadow-sm hover:shadow-md whitespace-nowrap`} 
                                    style={{ minWidth: '90px', height: '28px', lineHeight: '1.2' }} 
                                  >
                                    Check Pages
                                  </button>
                                )}
                              </div>
                              {/* 右侧：Send */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  if (userInput.trim() && !loading && !isMessageSending) {
                                    handleUserInput(e);
                                  }
                                }}
                                disabled={loading || isMessageSending || !userInput.trim()}
                                className={`w-auto px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-300 flex items-center gap-1 shadow-sm
                                  ${(loading || isMessageSending || !userInput.trim())
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-70'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:shadow-md'
                                  }`}
                                style={{ height: '32px', minWidth: '70px' }}
                              >
                                Send
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 12h14" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tooltip>
                  </>
                )}
              </div>
            </div>
          </div>
          {!isMobile && (
            <div className={`transition-all duration-300
              ${isBrowserSidebarOpen
                ? 'w-1/2 min-w-[160px]'
                : 'w-[5%] min-w-[80px]'
              }
              bg-slate-900/10 border-blue-700/30
              backdrop-blur-lg rounded-2xl border shadow-xl flex flex-col h-full relative overflow-hidden`}>
                {isBrowserSidebarOpen ? (
                  <>
                    <button
                      onClick={() => setIsBrowserSidebarOpen(open => !open)}
                      className="absolute top-2 right-2 z-20 bg-slate-700 hover:bg-slate-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-md"
                      title="Collapse"
                      style={{ outline: 'none' }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                  </>
                ) : (
                  <div
                    className="
                      absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none
                    "
                  >
                    <button
                      onClick={() => setIsBrowserSidebarOpen(open => !open)}
                      className="mb-3 bg-slate-700 hover:bg-slate-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-md pointer-events-auto"
                      title="Expand"
                      style={{ outline: 'none' }}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 20 20"><path d="M13 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                    <div
                      className="
                        flex flex-col items-center
                        text-xs font-bold text-blue-300
                        bg-slate-900/70 rounded-xl px-4 py-3 shadow-lg
                        tracking-wide
                      "
                      style={{
                        lineHeight: '2.2',
                        letterSpacing: '0.04em',
                        boxShadow: '0 2px 12px 0 rgba(59,130,246,0.10)',
                        backdropFilter: 'blur(2px)',
                      }}
                    >
                      <span>Expand</span>
                      <span>for</span>
                      <span>execution</span>
                      <span>logs</span>
                      <span>&</span>
                      <span>browser</span>
                      <span>preview</span>
                    </div>
                  </div>
                )}
                {isBrowserSidebarOpen && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="h-12 border-b border-gray-300/20 p-3 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setRightPanelTab('details')}
                          className={`text-sm ${
                            rightPanelTab === 'details'
                              ? 'text-blue-400 font-medium'
                              : 'text-gray-400 hover:text-blue-300' // 修改 hover 颜色
                          }`}
                        >
                          Execution Log
                        </button>
                        <button
                          onClick={() => setRightPanelTab('browser')}
                          className={`text-sm ${
                            rightPanelTab === 'browser'
                              ? 'text-blue-400 font-medium'
                              : 'text-gray-400 hover:text-blue-300'
                          }`}
                        >
                          Browser
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                      {rightPanelTab === 'details' && (
                      <div className="flex h-full">
                        <div className="flex-1 overflow-y-auto">
                          {logs.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-400 text-base">
                              Waiting for agent to execute...
                            </div>
                          ) : (
                            renderDetails()
                          )}
                        </div>
                      </div>
                    )}
                    {rightPanelTab === 'browser' && (
                      <div className="space-y-2">
                        {browserTabs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="flex items-center justify-center mb-4">
                              <svg className="w-7 h-7 text-blue-400 animate-bounce mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow">
                                No Pages Generated Yet
                              </span>
                            </div>
                            <div className="text-base text-blue-200 bg-blue-900/40 rounded-lg px-6 py-4 shadow-md border border-blue-700/30 text-center">
                              Your generated pages will appear here once the task is complete!
                            </div>
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
                                {/* --- 修改：将 URL 显示和按钮放在同一行，并调整布局 --- */}
                                <div className={`flex items-center justify-between mb-2 rounded-lg p-2 bg-gray-800/50`}>
                                  {/* URL 显示 */}
                                  <div className={`flex-1 px-3 py-1.5 text-xs rounded mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap bg-gray-700/50 text-gray-300`}>
                                    {browserTabs.find(tab => tab.id === activeTab)?.url}
                                  </div>
                                  {/* --- 新增：按钮组 --- */}
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        if (browserTabs.length > 0) {
                                          window.open('https://altpage.ai?openPreviewModal=true&openHistoryList=true&action=edit', '_blank');
                                        } else {
                                          messageApi.info('Please wait until at least one page has finished generating.')
                                        }
                                      }}
                                      className="bg-yellow-600 hover:bg-yellow-500 border-yellow-700 hover:border-yellow-600"
                                      style={{ fontSize: '10px', padding: '0 8px', height: '24px' }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      type="default"
                                      size="small"
                                      icon={<ExportOutlined />}
                                      onClick={() => window.open(browserTabs.find(tab => tab.id === activeTab)?.url, '_blank')}
                                      className="bg-slate-600 hover:bg-slate-500 text-white border-slate-700 hover:border-slate-600"
                                      style={{ fontSize: '10px', padding: '0 8px', height: '24px' }}
                                    >
                                      Preview
                                    </Button>
                                    <Button
                                      type="primary"
                                      size="small"
                                      icon={<LinkOutlined />}
                                      onClick={() => {
                                        if (browserTabs.length > 0) {
                                          window.open('https://altpage.ai?openPreviewModal=true&openHistoryList=true&action=bind', '_blank');
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
                                        padding: '0 8px',
                                        height: '24px',
                                      }}
                                    >
                                      Bind With Your Domain
                                    </Button>
                                  </div>
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
                )}
            </div>
          )}
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

      {/* 在这里添加 BrandAssetsModal */}
      {showBrandAssetsModal && (
        <BrandAssetsModal
          showBrandAssetsModal={showBrandAssetsModal}
          setShowBrandAssetsModal={setShowBrandAssetsModal}
        />
      )}
    </>
  );
};

export default ResearchTool;