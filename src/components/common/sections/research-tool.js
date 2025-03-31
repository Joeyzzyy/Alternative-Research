'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination, Dropdown, Menu, Modal } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined, LoadingOutlined } from '@ant-design/icons';
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
  const codeContainerRef = useRef(null);
  const previousCodeRef = useRef('');

  useEffect(() => {
    // 如果是新的代码内容，只追加新增部分
    if (code !== previousCodeRef.current) {
      const newContent = code.slice(previousCodeRef.current.length);
      previousCodeRef.current = code;
      setDisplayedCode(prev => prev + newContent);
      return;
    }

    // 正常打字效果
    if (currentIndex < code.length) {
      const timer = setTimeout(() => {
        if (code[currentIndex] === '<') {
          const tagEndIndex = code.indexOf('>', currentIndex);
          if (tagEndIndex !== -1) {
            // 一次性打印整个 HTML 标签
            setDisplayedCode(prev => prev + code.slice(currentIndex, tagEndIndex + 1));
            setCurrentIndex(tagEndIndex + 1);
          } else {
            setDisplayedCode(prev => prev + code[currentIndex]);
            setCurrentIndex(prev => prev + 1);
          }
        } else {
          setDisplayedCode(prev => prev + code[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [code, currentIndex, speed]);

  return (
    <pre 
      ref={codeContainerRef}
      className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap leading-relaxed overflow-auto" 
      style={{ maxHeight: '600px' }}
    >
      <div>{displayedCode}</div>
      {currentIndex < code.length && (
        <span className="animate-blink">▋</span>
      )}
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
  const [inputDisabledDueToUrlGet, setInputDisabledDueToUrlGet] = useState(false);
  const [validationError, setValidationError] = useState('');
  const lastProcessedLogIdRef = useRef(null);
  const [currentBackground, setCurrentBackground] = useState('GHIBLI');
  const [exampleDisabled, setExampleDisabled] = useState(false); // 添加 exampleDisabled 状态
  const messageHandler = new MessageHandler(setMessages);

  // 添加 SSE 连接状态和重试相关变量
  const [sseConnected, setSseConnected] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const MAX_RETRY_COUNT = 5;

  const [htmlStream, setHtmlStream] = useState('');
  const htmlStreamRef = useRef('');  // 用于累积 HTML 流
  const isStreamingRef = useRef(false);
  const currentStreamIdRef = useRef(null);  // 添加一个 ref 来跟踪当前正在流式输出的日志 ID

  // 添加一个新的 state 来存储 resultIds
  const [resultIds, setResultIds] = useState([]);
  // 添加一个新的 state 来控制弹窗的显示
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);

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
            // Parse JSON array - 修改这部分来处理单引号
            const competitorArrayString = competitorArrayMatch[1]
              .trim()
              .replace(/'/g, '"'); // 将单引号替换为双引号
            
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
    if (chatEndRef.current && messages.length > 0) {
      // 使用更精确的选择器找到聊天消息容器
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        // 设置滚动位置到底部
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]); // 当消息数组变化时触发

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

  const detailsRef = useRef(null);
  const htmlCodeRef = useRef(null);

  // 添加一个 ref 来引用代码容器
  const codeContainerRef = useRef(null);

  const renderDetails = (details) => {
    const reversedLogs = [...logs].reverse();
    
    return (
      <div className="h-full flex flex-col" ref={detailsRef}>
        <div className="p-3 space-y-2 overflow-y-auto">
          {reversedLogs.map((log, index) => {
            // 解析 Dify 日志的 content
            let difyContent = null;
            if (log.type === 'Dify' && typeof log.content === 'string') {
              try {
                difyContent = JSON.parse(log.content);
              } catch (e) {
                console.error('Failed to parse Dify content:', e);
              }
            }

            // 获取当前日志的累积内容
            const currentHtmlContent = log.id === currentStreamIdRef.current 
              ? htmlStreamRef.current 
              : log.content;

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

                {/* Dify 日志内容渲染 */}
                {log.type === 'Dify' && difyContent && (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    <div className="mb-1">
                      <span className="font-semibold">Workflow ID:</span> {difyContent.workflow_id}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Task ID:</span> {difyContent.task_id}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Step:</span> {difyContent.step}
                    </div>
                    <div className="mb-1">
                      <span className="font-semibold">Status:</span> {difyContent.event}
                    </div>
                    {difyContent.data && (
                      <div className="mb-1">
                        <span className="font-semibold">Node Info:</span>
                        <pre className="mt-1 p-2 bg-gray-700/50 rounded text-xs overflow-auto">
                          {JSON.stringify({
                            id: difyContent.data.id,
                            title: difyContent.data.title,
                            status: difyContent.data.status,
                            elapsed_time: difyContent.data.elapsed_time
                          }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* HTML 日志内容渲染 - 修改这部分 */}
                {log.type === 'Html' && (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    <div className="mb-1">
                      <span className="font-semibold">HTML Code:</span>
                      <pre 
                        ref={log.id === currentStreamIdRef.current ? codeContainerRef : null}
                        className="mt-1 p-2 bg-gray-700/50 rounded text-xs whitespace-pre-wrap break-words"
                        style={{ 
                          maxHeight: '400px', 
                          overflowY: 'auto',
                          color: '#a5d6ff' // 使用浅蓝色显示代码
                        }}
                      >
                        {currentHtmlContent}
                      </pre>
                    </div>
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
                        <span className="font-semibold">Result ID:</span>
                        {log.content.resultId}
                      </div>
                    )}
                  </div>
                ) : log.type === 'Info' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    {log.content?.planningId && (
                      <div className="mb-1">
                        <span className="font-semibold">Planning ID:</span> {log.content.planningId}
                      </div>
                    )}
                    <div className="mb-1">
                      <span className="font-semibold">Status:</span> {log.content.status}
                    </div>
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
    
    if (!isLoggedIn || !customerId || !token) {
      setSseConnected(false);
      return;
    }
    
    let eventSource = null;
    
    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }
      
      const currentToken = localStorage.getItem('alternativelyAccessToken');
      if (!currentToken) {
        setSseConnected(false);
        return;
      }
      
      eventSource = new EventSourcePolyfill(`https://api.websitelm.com/events/${customerId}-chat`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        heartbeatTimeout: 15 * 45000
      });

      eventSource.onopen = () => {
        setSseConnected(true);
        retryCountRef.current = 0;
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          
          // 打印每个数据包
          console.log('logData', logData);
          
          if (logData.type === 'Html') {
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
                timestamp: new Date().toISOString()
              }]);
            }
            
            // 累积 HTML 内容
            htmlStreamRef.current += logData.content;
            
            // 更新对应的日志项
            setLogs(prevLogs => prevLogs.map(log => 
              log.id === currentStreamIdRef.current 
                ? {...log, content: htmlStreamRef.current} 
                : log
            ));
          } 
          else if (logData.type === 'Codes') {
            // 收到 Codes 类型，表示流式输出结束
            isStreamingRef.current = false;
            currentStreamIdRef.current = null;
            // 正常添加 Codes 日志
            setLogs(prevLogs => [...prevLogs, logData]);
          }
          else {
            // 其他类型的日志正常添加
            setLogs(prevLogs => [...prevLogs, logData]);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        setSseConnected(false);
        console.error('SSE Connection Error:', {
          error,
          status: error.status,
          statusText: error.statusText,
          readyState: eventSource.readyState,
          timestamp: new Date().toISOString()
        });
        
        // 关闭当前连接
        eventSource.close();
        
        // 检查是否是401错误
        if (error.status === 401) {
          console.log('SSE connection unauthorized, token may be invalid');
          return;
        }
        
        // 实现指数退避重试策略
        if (retryCountRef.current < MAX_RETRY_COUNT) {
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
          console.log(`Retrying SSE connection in ${delay}ms (attempt ${retryCountRef.current + 1}/${MAX_RETRY_COUNT})`);
          
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryTimeoutRef.current = setTimeout(() => {
            retryCountRef.current += 1;
            connectSSE();
          }, delay);
        } else {
          console.log(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Giving up.`);
        }
      };
    };
    
    connectSSE();
    
    return () => {
      if (eventSource) {
        eventSource.close();
        setSseConnected(false);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      retryCountRef.current = 0;
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

  // 完全重写标签页创建逻辑
  useEffect(() => {
    console.log('useEffect 触发 - 当前日志数量:', logs.length);
    console.log('当前标签页:', browserTabs);
    console.log('当前已处理日志IDs:', processedLogIdsRef.current);
    
    // 获取所有 Codes 类型日志，无论是否处理过
    const allCodesLogs = logs.filter(log => log.type === 'Codes' && log.content?.resultId);
    console.log('所有 Codes 日志:', allCodesLogs);
    
    // 打印每个Codes日志的ID和resultId，帮助调试
    allCodesLogs.forEach((log, index) => {
      console.log(`Codes日志 ${index+1}:`, {
        id: log.id,
        resultId: log.content.resultId,
        已处理: processedLogIdsRef.current.includes(log.id)
      });
    });
    
    // 重置已处理日志ID列表，强制重新处理所有Codes日志
    processedLogIdsRef.current = [];
    
    // 现在所有Codes日志都会被视为未处理
    const newCodesLogs = allCodesLogs;
    console.log('将处理的 Codes 日志:', newCodesLogs);
    
    if (newCodesLogs.length === 0) {
      console.log('没有 Codes 日志需要处理');
      return;
    }
    
    // 收集所有需要添加的新标签页
    const newTabsToAdd = [];
    
    newCodesLogs.forEach(log => {
      const tabId = `result-${log.content.resultId}`;
      console.log(`处理 resultId: ${log.content.resultId}`);
      
      // 检查是否已经有相同 ID 的标签页
      const existingTab = browserTabs.find(tab => tab.id === tabId);
      
      if (!existingTab) {
        console.log(`为 resultId ${log.content.resultId} 创建新标签页`);
        newTabsToAdd.push({
          id: tabId,
          title: `Result ${log.content.resultId}`,
          url: `https://preview.websitelm.site/en/${log.content.resultId}`
        });
      } else {
        console.log(`标签页已存在，resultId: ${log.content.resultId}`);
      }
      
      // 标记这个日志为已处理
      processedLogIdsRef.current.push(log.id);
    });
    
    if (newTabsToAdd.length > 0) {
      console.log(`添加 ${newTabsToAdd.length} 个新标签页:`, newTabsToAdd);
      
      // 使用函数式更新，确保基于最新状态
      setBrowserTabs(prevTabs => {
        const updatedTabs = [...prevTabs, ...newTabsToAdd];
        console.log('更新后的标签页:', updatedTabs);
        return updatedTabs;
      });
      
      // 设置最后一个新标签页为活动标签
      const lastNewTab = newTabsToAdd[newTabsToAdd.length - 1];
      setActiveTab(lastNewTab.id);
      setShowBrowser(true);
    }
  }, [logs]); // 只依赖 logs

  // 确保 processedLogIdsRef 被正确初始化
  const processedLogIdsRef = useRef([]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      processedLogIdsRef.current = [];
    };
  }, []);

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

  const handlePreview = (data) => {
    // 找到 type 为 "Codes" 的项
    const codesData = data.find(item => item.type === "Codes");

    if (codesData) {
      // 提取 resultId
      const resultId = codesData.content.resultId;

      // 拼接预览 URL
      const previewUrl = `https://preview.websitelm.site/en/${resultId}`;

      // 展示预览 URL 在弹窗中
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert("未找到 Codes 类型的数据");
    }
  };

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
                  if (!exampleDisabled) {
                    setExampleDisabled(true);
                    setUserInput("hix.ai");
                    initializeChat("https://hix.ai");
                  }
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-400/40 to-amber-300/20 border-amber-400/30 hover:border-amber-300/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-green-400/40 to-green-300/20 border-green-400/30 hover:border-green-300/50 hover:shadow-[0_0_15px_rgba(74,222,128,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border ${exampleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'} 
                         transition-all duration-300 
                         relative overflow-hidden`}
              >
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-amber-400/20 rounded-full blur-xl hover:bg-amber-400/30 transition-all"></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                  <img src="/images/hix.png" alt="HIX" className="w-7 h-7" />
                </div>
                <div className="text-amber-300 font-medium mb-2 hover:text-amber-200 text-base">HIX</div>
                <div className="text-xs text-gray-400 hover:text-gray-300">Analyze HIX alternatives</div>
                <div className="absolute bottom-3 right-3">
                  <ArrowRightOutlined className="text-amber-400/50 hover:text-amber-300 transition-all" />
                </div>
              </div>
              
              <div 
                onClick={() => {
                  if (!exampleDisabled) {
                    setExampleDisabled(true);
                    setUserInput("pipiads.com");
                    initializeChat("https://pipiads.com");
                  }
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-800/40 to-amber-700/20 border-amber-600/30 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-emerald-800/40 to-emerald-700/20 border-emerald-600/30 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(5,150,105,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border ${exampleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'} 
                         transition-all duration-300 
                         group relative overflow-hidden`}
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
                  if (!exampleDisabled) {
                    setExampleDisabled(true);
                    setUserInput("jtracking.io");
                    initializeChat("https://jtracking.io");
                  }
                }}
                className={`${currentBackground === 'GHIBLI' 
                  ? 'bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(217,119,6,0.3)]' 
                  : 'bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                } backdrop-blur-sm p-5 rounded-xl 
                         border ${exampleDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1'} 
                         transition-all duration-300 
                         group relative overflow-hidden`}
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
                {exampleDisabled ? 
                  "Processing your request..." : 
                  "Click any card to view alternative page performance of that product"}
              </div>
            </div>
          </div>
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
                    sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span>SSE {sseConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && renderDetails(detailsData)}
              {rightPanelTab === 'sources' && renderSources()}
            </div>
          </div>
        </div>
      </div>

      {/* 添加 Modal 组件 */}
      <Modal
        title="Generated Results"
        open={showResultIdsModal}
        onCancel={() => {
          setShowResultIdsModal(false);
          console.log('弹窗关闭，showResultIdsModal 状态:', false);
        }}
        footer={null}
        width={400}
        className="result-ids-modal"
        zIndex={1500}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
      >
        {console.log('弹窗状态:', showResultIdsModal)}
        <div className="space-y-3">
          {resultIds.map((id, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-gray-300">Result #{index + 1}</span>
              <Button 
                type="primary"
                onClick={() => window.open(`https://preview.websitelm.site/en/${id}`, '_blank')}
                className="bg-blue-500 hover:bg-blue-600"
              >
                View Preview
              </Button>
            </div>
          ))}
        </div>
      </Modal>
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

// 添加样式
const modalStyle = document.createElement('style');
modalStyle.innerHTML = `
  .result-ids-modal .ant-modal-content {
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(100, 116, 139, 0.2);
  }
  .result-ids-modal .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgba(100, 116, 139, 0.2);
  }
  .result-ids-modal .ant-modal-title {
    color: white;
  }
  .result-ids-modal .ant-modal-close {
    color: rgba(255, 255, 255, 0.45);
  }
  .result-ids-modal .ant-modal-close:hover {
    color: rgba(255, 255, 255, 0.85);
  }
  .result-ids-modal {
    pointer-events: auto !important;
  }
  .result-ids-modal .ant-modal-wrap {
    z-index: 1500;
  }
`;
document.head.appendChild(modalStyle);

export default ResearchTool;