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
  '\\[END\\]': '',  // 过滤 [END]
  '\\[ALL_END\\]': '',  // 过滤 [COMPETITOR_SELECTED]
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

const TaskRestoreTool = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [deepResearchMode, setDeepResearchMode] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
  const [activeAgentId, setActiveAgentId] = useState(null);
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showDemo, setShowDemo] = useState(true);
  const [logs, setLogs] = useState([]);
  const competitorListProcessedRef = useRef(false);
  const [canProcessCompetitors, setCanProcessCompetitors] = useState(false);
  const [browserTabs, setBrowserTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [currentBackground, setCurrentBackground] = useState('GHIBLI');
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

  // 添加一个 ref 来跟踪最后一次看到的日志数量
  const lastLogCountRef = useRef(0);

  const [websiteId, setWebsiteId] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [chatHistory, setChatHistory] = useState([]); // 新增聊天历史状态

  const [inputDisabledDueToUrlGet, setInputDisabledDueToUrlGet] = useState(false);

  const filterMessageTags = (message) => {
    // 添加空值检查
    if (!message || typeof message !== 'string') {
      return '';
    }
    
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    return filteredMessage;
  };

  // 监听日志变化，在有新日志时自动切回 execution log
  useEffect(() => {
    if (rightPanelTab === 'browser' && logs.length > lastLogCountRef.current) {
      console.log('检测到新的日志，切回 execution log');
      setRightPanelTab('details');
    }
    lastLogCountRef.current = logs.length;
  }, [logs, rightPanelTab]);

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

  // 添加防抖处理
  const debouncedLogs = useRef([]);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      debouncedLogs.current = logs;
    }, 100); // 100ms 的防抖时间

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [logs]);

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
              <div 
                key={log.id || index} // 优先使用日志ID作为key
                className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 
                         hover:border-gray-600/50 transition-all duration-300 
                         animate-fadeIn opacity-0" // 添加初始透明度
                style={{
                  animation: 'fadeIn 0.3s ease-out forwards',
                  animationDelay: `${index * 0.05}s` // 添加渐进式动画延迟
                }}
              >
                <div className="flex items-center mb-2">
                  {/* 图标部分 */}
                  {log.type === 'Dify' && (
                    <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-4 h-4 mr-2" />
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
                  {log.type === 'Html' && (
                    <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 4l-4 4 4 4" />
                    </svg>
                  )}
                  
                  {/* 标题部分 */}
                  <div className="text-[11px] text-gray-300 font-medium">
                    {log.type === 'Dify' && 'Running Page Content Generation Workflow'}
                    {log.type === 'Error' && 'Error Message'}
                    {log.type === 'API' && 'API Request'}
                    {log.type === 'Codes' && 'Code Execution'}
                    {log.type === 'Info' && 'Information'}
                    {log.type === 'Html' && 'HTML Generation'}
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

                {/* HTML 日志内容渲染 */}
                {log.type === 'Html' && (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    <div className="mb-1">
                      <span className="font-semibold">HTML Code Generation:</span>
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
                    {log.content?.resultId && (
                      <div className="mb-1">
                        <span className="font-semibold">Result ID:</span> {log.content.resultId}
                      </div>
                    )}
                  </div>
                ) : log.type === 'Info' ? (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed">
                    {log.content?.website && (
                      <div className="mb-1">
                        <span className="font-semibold">Website:</span> {log.content.website}
                      </div>
                    )}
                    {log.content?.generatorStatus && (
                      <div className="mb-1">
                        <span className="font-semibold">Status:</span> {log.content.generatorStatus}
                      </div>
                    )}
                    {log.content?.generatedStart && (
                      <div className="mb-1">
                        <span className="font-semibold">Start Time:</span> {new Date(log.content.generatedStart).toLocaleString()}
                      </div>
                    )}
                    {log.content?.generatedEnd && (
                      <div className="mb-1">
                        <span className="font-semibold">End Time:</span> {new Date(log.content.generatedEnd).toLocaleString()}
                      </div>
                    )}
                    {log.content?.changeStyleCount !== undefined && (
                      <div className="mb-1">
                        <span className="font-semibold">Style Changes:</span> {log.content.changeStyleCount}
                      </div>
                    )}
                    {log.content?.planningId && (
                      <div className="mb-1">
                        <span className="font-semibold">Planning ID:</span> {log.content.planningId}
                      </div>
                    )}
                    {log.content?.status && (
                      <div className="mb-1">
                        <span className="font-semibold">Status:</span> {log.content.status}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* 时间戳 */}
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

  // 初始化任务状态
  const initializeTaskState = (historyData) => {
    console.log('Received historyData:', historyData); // 调试日志：打印接收到的历史数据
    if (Array.isArray(historyData)) { // 如果 historyData 是数组
      // 直接使用 historyData 作为日志数据
      const sortedLogs = [...historyData].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      console.log('Sorted logs:', sortedLogs); // 调试日志：打印排序后的日志
      setLogs(sortedLogs);
    } else if (historyData && historyData.data) { // 如果 historyData 是对象且包含 data 字段
      const sortedLogs = [...historyData.data].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      console.log('Sorted logs from historyData.data:', sortedLogs); // 调试日志：打印排序后的日志
      setLogs(sortedLogs);
    } else {
      console.log('No valid logs found in historyData:', historyData); // 调试日志：打印无效的历史数据
    }
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

          console.log('logData', logData);
          
          // 使用函数式更新来避免竞态条件
          setLogs(prevLogs => {
            // 检查是否已存在相同ID的日志
            const existingLogIndex = prevLogs.findIndex(log => log.id === logData.id);
            
            if (existingLogIndex !== -1) {
              // 如果日志已存在，更新它
              const updatedLogs = [...prevLogs];
              updatedLogs[existingLogIndex] = {
                ...updatedLogs[existingLogIndex],
                ...logData,
                content: {
                  ...updatedLogs[existingLogIndex].content,
                  ...logData.content
                }
              };
              return updatedLogs;
            } else {
              // 如果是新日志，添加到数组中
              return [...prevLogs, logData];
            }
          });
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
      
      // 处理改色任务完成 - 告知用户任务已完成
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
              "Failed to send completion message. Please try again later."
            );
          }
        } catch (error) {
          console.error("Error sending completion message:", error);
          // 出错时也添加系统消息
          messageHandler.addSystemMessage(
            "Failed to send completion message. Please try again later."
          );
        }
      })();
    }
  }, [logs, canProcessCompetitors]); // 当日志更新时检查

  // 组件卸载时重置标记
  useEffect(() => {
    return () => {
      competitorListProcessedRef.current = false;
    };
  }, []);

  // 修改标签页处理逻辑
  useEffect(() => {
    const allCodesLogs = logs.filter(log => log.type === 'Codes' && log.content?.resultId);
    const newTabsToAdd = [];

    allCodesLogs.forEach(log => {
      const tabId = `result-${log.content.resultId}`;
      const existingTab = browserTabs.find(tab => tab.id === tabId);
      
      if (!existingTab) {
        newTabsToAdd.push({
          id: tabId,
          title: `Result ${log.content.resultId}`,
          url: `https://preview.websitelm.site/en/${log.content.resultId}`
        });
      }
    });

    if (newTabsToAdd.length > 0) {
      setBrowserTabs(prevTabs => [...prevTabs, ...newTabsToAdd]);
      const lastNewTab = newTabsToAdd[newTabsToAdd.length - 1];
      setActiveTab(lastNewTab.id);
      setRightPanelTab('browser');
    }
  }, [logs]);

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

  // 新增获取聊天历史的函数
  const fetchChatHistory = async (websiteId) => {
    try {
      const response = await apiClient.getAlternativeChatHistory(websiteId);
      if (response?.code === 200) {
        // 将历史消息添加到消息列表中
        const historyMessages = response.data.flatMap(chat => [
          {
            content: chat.message,
            source: 'user',
            timestamp: chat.createdAt
          },
          {
            content: chat.answer,
            source: 'agent',
            timestamp: chat.updatedAt || chat.createdAt
          }
        ]);
        setMessages(historyMessages);
      } else {
        messageApi.error('Failed to fetch chat history');
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      messageApi.error('Failed to fetch chat history');
    }
  };

  // 修改初始化时获取websiteId的useEffect
  useEffect(() => {
    const storedWebsiteId = localStorage.getItem('restoreWebsiteId');
    if (storedWebsiteId) {
      setWebsiteId(storedWebsiteId);
      fetchTaskHistory(storedWebsiteId);
      fetchChatHistory(storedWebsiteId); // 新增获取聊天历史
      localStorage.removeItem('restoreWebsiteId');
    }
  }, []);

  // 获取任务历史
  const fetchTaskHistory = async (websiteId) => {
    try {
      const response = await apiClient.getAlternativeWebsiteHistory(websiteId);
      if (response?.code === 200) {
        setTaskDetails(response.data);
        // 根据任务历史初始化其他状态
        initializeTaskState(response.data);
      } else {
        messageApi.error('Failed to fetch task history');
      }
    } catch (error) {
      console.error('Failed to fetch task history:', error);
      messageApi.error('Failed to fetch task history');
    }
  };

  // 添加新的动画样式
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
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

      .log-item {
        transition: all 0.3s ease-out;
      }

      .log-item-enter {
        opacity: 0;
        transform: translateY(5px);
      }

      .log-item-enter-active {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 添加处理用户输入的函数
  const handleUserInput = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!userInput.trim() || isMessageSending) return;

    const formattedInput = userInput.trim();

    // Add user message
    messageHandler.addUserMessage(formattedInput);
    // Add agent thinking message
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();
    setUserInput('');
    setIsMessageSending(true);

    try {
      const response = await apiClient.chatWithAI(formattedInput, websiteId);

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
          
          // 提取竞品数组部分
          const competitorArrayMatch = rawAnswer.match(/\[COMPETITOR_SELECTED\]\s*\[(.*?)\]$/s);
          
          if (competitorArrayMatch && competitorArrayMatch[1]) {
            try {
              // 清理字符串，处理引号和转义字符
              const cleanedString = competitorArrayMatch[1]
                .replace(/\\'/g, "'")  // 处理转义的单引号
                .replace(/\\"/g, '"')  // 处理转义的双引号
                .replace(/'/g, '"')    // 将单引号替换为双引号
                .trim();
              
              let competitors;
              try {
                // 尝试解析 JSON
                competitors = JSON.parse(`[${cleanedString}]`);
              } catch (e) {
                // 如果 JSON 解析失败，使用更智能的字符串分割
                competitors = cleanedString
                  .replace(/[\[\]'"`]/g, '') // 移除所有引号和方括号
                  .split(',')
                  .map(s => s.trim())
                  .filter(s => s.length > 0); // 过滤空字符串
              }
              
              // 处理竞争对手列表
              if (Array.isArray(competitors) && competitors.length > 0) {
                const formattedCompetitors = competitors.map(comp => {
                  if (typeof comp === 'string') {
                    return {
                      name: comp,
                      url: comp.startsWith('http') ? comp : `https://${comp}`
                    };
                  }
                  return comp;
                });
                
                handleCompetitorListRequest(formattedCompetitors);
              } else {
                messageHandler.updateAgentMessage(
                  messageBody + "\n\n⚠️ Failed to parse competitor list. Please try again.",
                  thinkingMessageId
                );
                setIsMessageSending(false);
              }
            } catch (error) {
              console.error("Error processing competitor list:", error);
              messageHandler.updateAgentMessage(
                messageBody + "\n\n⚠️ Error processing competitor list. Please try again.",
                thinkingMessageId
              );
              setIsMessageSending(false);
            }
          } else {
            messageHandler.updateAgentMessage(messageBody, thinkingMessageId);
            setIsMessageSending(false);
          }
        } else if (rawAnswer.includes('[END]')) {
          // 处理结束标记
          const messageBody = rawAnswer.replace(/\[END\].*$/s, '').trim();
          messageHandler.updateAgentMessage(messageBody, thinkingMessageId);
          setIsMessageSending(false);
        } else {
          // 普通消息
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          setIsMessageSending(false);
        }
      } else {
        messageHandler.updateAgentMessage('⚠️ Failed to get response: Invalid response from server, can you please say it again?', thinkingMessageId);
        setIsMessageSending(false);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
      setIsMessageSending(false);
    }
  };

  // 添加处理竞争对手列表的函数
  const handleCompetitorListRequest = async (competitors) => {
    setIsMessageSending(true);
    const thinkingMessageId = messageHandler.addAgentThinkingMessage();

    try {
      // 清理域名格式
      const domainArray = competitors.map(comp => 
        typeof comp === 'string' 
          ? comp.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\s+/g, '')
          : comp.name.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\s+/g, '')
      ).filter(domain => domain.length > 0);  // 过滤掉空域名

      if (domainArray.length > 0) {
        // 调用generateAlternative API
        const generateResponse = await apiClient.generateAlternative(websiteId, domainArray);
        
        if (generateResponse?.code === 200) {
          messageHandler.addSystemMessage(
            `We are generating alternative solutions for ${domainArray.join(', ')}. This may take some time, please wait...`
          );
          setInputDisabledDueToUrlGet(true);
          
          // 更新agent消息
          const response = await apiClient.chatWithAI(JSON.stringify(competitors), websiteId);
          if (response?.code === 200 && response.data?.answer) {
            const answer = filterMessageTags(response.data.answer);
            messageHandler.updateAgentMessage(answer, thinkingMessageId);
          } else {
            messageHandler.updateAgentMessage('⚠️ Failed to generate alternatives: Invalid response from server', thinkingMessageId);
          }
        } else {
          messageHandler.updateAgentMessage('⚠️ Failed to generate alternatives: Invalid server response', thinkingMessageId);
        }
      } else {
        messageHandler.updateAgentMessage('⚠️ No valid competitors found after processing', thinkingMessageId);
      }
    } catch (error) {
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setIsMessageSending(false);
      // 注意：不要在这里重新启用输入框，应该等待生成任务完成后再启用
    }
  };

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
          {/* 移除 showBrowser 条件判断，直接使用固定宽度 */}
          <div className="w-[35%] relative flex flex-col">
            {/* 移除 Browser 切换按钮 */}
            <div className="h-10 px-4 border-b border-gray-300/20 flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-5 h-5 mr-1.5" />
                <h2 className="text-sm font-semibold text-gray-100">Copilot</h2>
              </div>
            </div>
            
            {/* 其他聊天区域内容 */}
            <div className="flex-1 overflow-y-auto py-6 px-4 chat-messages-container">
              {loading ? (
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
                    placeholder="Type your message here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending}
                    className={`bg-white/10 border ${getInputStyle()} rounded-xl text-sm`}
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.9)',
                      height: '48px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    onPressEnter={handleUserInput}
                    suffix={
                      <Button
                        type="text"
                        icon={<SendOutlined />}
                        loading={isMessageSending}
                        onClick={handleUserInput}
                        className="text-gray-400 hover:text-blue-400"
                      />
                    }
                  />
                </div>

                <div className="flex justify-end mt-3 px-1">
                  <div className="text-xs text-gray-400">
                    Press Enter ↵ to search
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧面板保持不变 */}
          <div className={`w-[65%] ${currentBackground === 'GHIBLI' 
            ? 'bg-amber-900/10 border-amber-700/30' 
            : 'bg-white/5 border-gray-300/20'
          } backdrop-blur-lg rounded-2xl border shadow-xl flex flex-col h-full relative`}>
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
                    Execution Log
                  </button>
                  <button 
                    onClick={() => setRightPanelTab('browser')} 
                    className={`text-sm ${
                      rightPanelTab === 'browser' 
                        ? 'text-blue-400 font-medium' 
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Browser
                  </button>
                </div>
                <div className="flex items-center text-xs">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <span>Log Server {sseConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'details' && renderDetails(detailsData)}
              {rightPanelTab === 'browser' && (
                <div className="space-y-2">
                  {browserTabs.length === 0 ? (
                    <div className="text-gray-500 text-center py-4 text-xs">
                      No browser tabs available yet
                    </div>
                  ) : (
                    <div className="p-3">
                      {/* 标签栏 */}
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

                      {/* 地址栏和预览区域 */}
                      {activeTab && (
                        <div>
                          {/* 地址栏 */}
                          <div className="flex items-center mb-2 bg-gray-800/50 rounded-lg p-2">
                            <div className="flex-1 px-3 py-1.5 text-xs text-gray-300 bg-gray-700/50 rounded mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap">
                              {browserTabs.find(tab => tab.id === activeTab)?.url}
                            </div>
                            <button
                              onClick={() => window.open(browserTabs.find(tab => tab.id === activeTab)?.url, '_blank')}
                              className="p-1.5 hover:bg-gray-700/50 rounded-md transition-colors duration-200 group"
                              title="Open in new tab"
                            >
                              <svg 
                                className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors duration-200" 
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

                          {/* iframe 预览区域 */}
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
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)'
          }
        }}
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

export default TaskRestoreTool;