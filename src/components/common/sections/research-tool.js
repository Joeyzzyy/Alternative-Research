'use client';
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination, Dropdown, Menu, Modal } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined, LoadingOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import { EventSourcePolyfill } from 'event-source-polyfill';
import MessageHandler from '../../../utils/MessageHandler';
const TAG_FILTERS = {
  '\\[URL_GET\\]': '',  // 过滤 [URL_GET]
  '\\[COMPETITOR_SELECTED\\]': '',  // 过滤 [COMPETITOR_SELECTED]
  '\\[END\\]': '',  // 过滤 [END]
  '\\[ALL_END\\]': '',  // 过滤 [COMPETITOR_SELECTED]
};
const ALTERNATIVELY_LOGO = '/images/alternatively-logo.png'; // 假设这是Alternatively的logo路径
const BACKGROUNDS = {
  NIGHT_GHIBLI: { // 重命名 DEFAULT 为 NIGHT_GHIBLI
    type: 'image', // 类型改为 image
    value: 'url("/images/GHIBLI-NIGHT.png")', // 使用夜间图片
    overlay: 'bg-slate-950/60', // 统一覆盖层样式
    buttonStyle: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30 hover:border-blue-400/60',
    inputStyle: 'border-blue-400/30 focus:border-blue-300/50 shadow-blue-700/20',
    cardStyle: 'border-blue-500/30 hover:border-blue-400/50 shadow-blue-700/20'
  },
  DAY_GHIBLI: { // 重命名 GHIBLI 为 DAY_GHIBLI
    type: 'image',
    value: 'url("/images/GHIBLI-BEST.png")',
    overlay: 'bg-slate-950/60',
    buttonStyle: 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border-amber-500/40 hover:border-amber-400/60',
    inputStyle: 'border-amber-400/30 focus:border-amber-300/50 shadow-amber-700/20',
    cardStyle: 'border-amber-500/30 hover:border-amber-400/50 shadow-amber-700/20'
  }
};

const ResearchTool = ({ 
  setTargetShowcaseTab
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('details');
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
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
  const [currentBackground, setCurrentBackground] = useState('DAY_GHIBLI'); // 默认使用 NIGHT_GHIBLI
  const messageHandler = new MessageHandler(setMessages);
  const [sseConnected, setSseConnected] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const htmlStreamRef = useRef('');  // 用于累积 HTML 流
  const isStreamingRef = useRef(false);
  const currentStreamIdRef = useRef(null);  // 添加一个 ref 来跟踪当前正在流式输出的日志 ID
  const [resultIds, setResultIds] = useState([]);
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);
  const lastLogCountRef = useRef(0);
  const [isProcessingTask, setIsProcessingTask] = useState(false);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState(''); // 新增状态
  const placeholderIntervalRef = useRef(null); // Ref for interval ID
  const placeholderTimeoutRef = useRef(null); // Ref for pause timeout
  const [currentStep, setCurrentStep] = useState(1); // 添加这一行来跟踪当前步骤
  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    
    return filteredMessage;
  };

  // 页面加载时读取 localStorage 的 urlInput
  useEffect(() => {
    const lastInput = localStorage.getItem('urlInput');
    if (lastInput) {
      setUserInput(lastInput);
    }
  }, []);

  const validateDomain = (input) => {
    if (!input || !input.trim()) return false;
    let domain = input.trim();
    try {
      // 首先检查是否是纯数字，如果是则直接拒绝
      if (/^\d+$/.test(domain)) {
        return false;
      }
      // 尝试将输入解析为URL
      // 如果输入不包含协议，添加临时协议以便解析
      if (!domain.match(/^https?:\/\//i)) {
        domain = 'https://' + domain;
      }
      // 使用URL API解析域名
      const url = new URL(domain);
      domain = url.hostname;
      // 验证域名格式 - 必须至少包含一个点，表示有顶级域名
      if (!domain.includes('.')) {
        return false;
      }
      // 验证域名格式
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      return domainRegex.test(domain);
    } catch (error) {
      // URL解析失败
      return false;
    }
  };
  const [shouldConnectSSE, setShouldConnectSSE] = useState(false);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [aborting, setAborting] = useState(false);

  // 监听日志变化，在有新日志时自动切回 execution log
  useEffect(() => {
    if (rightPanelTab === 'browser' && logs.length > lastLogCountRef.current) {
      setRightPanelTab('details');
    }
    lastLogCountRef.current = logs.length;
  }, [logs, rightPanelTab]);

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

  // 在 renderChatMessage 里，定义一个函数用于将域名变成可点击链接
  const linkifyDomains = (text) => {
    // 匹配类似 surferseo.com、frase.io 这样的域名
    return text.replace(
      /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?![^<]*>)/g,
      (match) => {
        // 忽略已经在标签里的内容
        // 这里默认 http 协议，你也可以用 https
        return `<a href="https://${match}" target="_blank" rel="noopener noreferrer" style="color:#60a5fa;text-decoration:underline;">${match}</a>`;
      }
    );
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
    const handleLoginSuccess = () => {
      // 检查是否有待处理的用户输入
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
    const storedCustomerId = localStorage.getItem('alternativelyCustomerId');
    const token = localStorage.getItem('alternativelyAccessToken');
    if (storedCustomerId && token) {
      setCustomerId(storedCustomerId);
    }
  }, []);

  const detailsRef = useRef(null);
  const codeContainerRef = useRef(null);

  // --- 新增 Color 类型流式处理的 Refs ---
  const colorStreamRef = useRef('');
  const currentColorStreamIdRef = useRef(null);
  const isColorStreamingRef = useRef(false);

  const filterLogContent = (content) => {
    if (!content) return '';
    let filteredContent = String(content);
  
    // 先处理 details/summary 标签
    filteredContent = filteredContent.replace(
      /<details.*?>\s*<summary>\s*Thinking\.\.\.\s*<\/summary>(.*?)<\/details>/gs, 
      (match, thinkingContent) => {
        const formattedThinking = thinkingContent
          // ... 你的其它 replace ...
          .replace(/\.([\s\u00A0]+)/g, '. <br />')
          .replace(/\n/g, '<br />') // ★★★ 关键：换行符转为 <br />
          .trim();
        return `<div class="thinking-block p-2 my-2 bg-gray-100 rounded text-xs text-gray-600">
                  <div class="font-medium mb-1">Thinking Process:</div>
                  <div>${formattedThinking}</div>
                </div>`;
      }
    );
    
    // 2. 处理 Action: 标签 - 转换为格式化的动作区块
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
    
    // 3. 处理 Thought: 标签 - 转换为格式化的思考区块
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
    
    // 4. 处理 JSON 格式的 action 指令
    filteredContent = filteredContent.replace(
      /\{\s*"action":\s*"(.*?)"\s*,\s*"action_input":\s*"(.*?)"\s*\}/gs,
      (match, action, actionInput) => {
        return `<div class="json-action-block p-2 my-2 bg-green-50 rounded text-xs text-green-600">
                  <div class="font-medium mb-1">Action: ${action}</div>
                  <div>${actionInput}</div>
                </div>`;
      }
    );
    
    // 5. 修复单词之间缺少空格的问题
    filteredContent = filteredContent.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    return filteredContent;
  };

  const renderDetails = (details) => {
    // 首先，合并相同 message_id 的 Agent 消息
    const mergedLogs = [];
    const agentMessageMap = new Map();
    
    // 第一步：收集所有 Agent 消息，按 message_id 分组
    logs.forEach(log => {
      if (log.type === 'Agent' && log.content) {
        try {
          // 不再需要解析 log.content，因为它已经是对象
          const content = log.content;
          
          // 检查 organic_data 是否存在
          if (content.organic_data) {
            // 如果 organic_data 是字符串，则需要解析；如果已经是对象，则直接使用
            const organicData = typeof content.organic_data === 'string' 
              ? JSON.parse(content.organic_data) 
              : content.organic_data;

            if (organicData.event === 'agent_message') {
              const { message_id, answer } = organicData;
              
              // 过滤日志内容
              const filteredAnswer = filterLogContent(answer);
              
              if (!agentMessageMap.has(message_id)) {
                agentMessageMap.set(message_id, {
                  id: message_id,
                  type: 'Agent',
                  content: filteredAnswer,
                  timestamp: log.timestamp
                });
              } else {
                // 追加内容
                const existingLog = agentMessageMap.get(message_id);
                existingLog.content += filteredAnswer;
              }
            }
          }
        } catch (error) {
          // 保留 try-catch 以处理可能的错误，例如 organic_data 仍然是字符串但格式不正确
          console.error('Error processing Agent log content:', error, 'Original log:', log);
        }
      } else {
        // 非 Agent 消息直接添加
        mergedLogs.push(log);
      }
    });
    
    // 第二步：将合并后的 Agent 消息添加到结果中
    agentMessageMap.forEach(mergedLog => {
      mergedLog.content = filterLogContent(mergedLog.content)
      .replace(/\.([\s\u00A0]+)/g, '. <br />')
      .replace(/\n/g, '<br />');
      mergedLogs.push(mergedLog);
    });
    
    // 按时间戳排序
    mergedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
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

    return (
      <div className="h-full flex flex-col" ref={detailsRef}>
        <div className="p-3 space-y-2 overflow-y-auto">
          {/* 添加加载动画 - 更酷炫的进度指示器 */}
          
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
                  <div 
                    className="text-[10px] text-gray-400 break-words leading-relaxed"
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

            // 获取当前日志的累积内容
            const currentHtmlContent = log.id === currentStreamIdRef.current 
              ? htmlStreamRef.current 
              : log.content;

            const latestHtmlLog = logs.filter(l => l.type === 'Html').slice(-1)[0];
            const latestHtmlLogId = latestHtmlLog ? latestHtmlLog.id : null;

            const currentColorContent = log.id === currentColorStreamIdRef.current
              ? colorStreamRef.current
              : log.content;

            // --- 修改：为新的 Crawler 类型添加图标和标题 ---
            const isCrawlerType = log.type === 'Crawler_Images' || log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers';
            const uniqueKey = `${log.id || 'log'}-${log.type}-${index}`; 

            return (
              <div
                key={uniqueKey} 
                className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn"
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

                {/* Dify 日志内容渲染 - 优化布局和重点 */}
                {log.type === 'Dify' && difyContent && (
                  <div className="text-[10px] text-gray-400 break-words leading-relaxed space-y-1">
                    {/* Current Action - 高亮显示，标题和内容分行 */}
                    <div className="font-semibold text-blue-400 text-xs mb-1">
                      Current Action
                    </div>
                    {/* 简约版：只保留文字，title 渐变色加粗，status 紧跟其后 */}
                    <div className="flex items-center space-x-2 px-1 py-1">
                      <span
                        className="font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                        style={{ lineHeight: '1.2' }}
                      >
                        {difyContent.data.title || ''}
                      </span>
                      {difyContent.data && difyContent.data.status !== '' && (
                        <span className={`ml-2 font-semibold text-xs ${getStatusColor(difyContent.data.status)}`}>
                          {difyContent.data.status}
                        </span>
                      )}
                      {difyContent.data.elapsed_time !== undefined && (
                        <span className="ml-2 text-gray-400 text-xs">
                          {difyContent.data.elapsed_time.toFixed(2)}s
                        </span>
                      )}
                    </div>
                    {/* Execution Status（原Event） */}
                    <div>
                      <div className="font-semibold w-28 inline-block whitespace-nowrap">Execution Status:</div>
                      <div className="inline-block">{difyContent.event || ''}</div>
                    </div>
                    {/* Executor（原Step Name） */}
                    <div>
                      <div className="font-semibold w-28 inline-block whitespace-nowrap">Executor:</div>
                      <div className="inline-block">{log.step || difyContent.step || ''}</div>
                    </div>
                    {/* Node ID */}
                    {difyContent.data && typeof difyContent.data === 'object' && (
                      <div>
                        <div className="font-semibold w-28 inline-block whitespace-nowrap">Node ID:</div>
                        <div className="inline-block">{difyContent.data.id || ''}</div>
                      </div>
                    )}
                    {/* Workflow ID */}
                    <div>
                      <div className="font-semibold w-28 inline-block whitespace-nowrap">Workflow ID:</div>
                      <div className="inline-block">{difyContent.workflow_id || ''}</div>
                    </div>
                    {/* Task ID */}
                    <div>
                      <div className="font-semibold w-28 inline-block whitespace-nowrap">Task ID:</div>
                      <div className="inline-block">{difyContent.task_id || ''}</div>
                    </div>
                    {/* 错误信息 */}
                    {difyContent.data?.error && (
                      <div className="mt-1 pt-1 border-t border-gray-700/50 text-red-400">
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
                {isCrawlerType && Array.isArray(log.content) && (
                  <div
                    key={`${uniqueKey}-content`} 
                    className="text-[10px] text-gray-400 break-words leading-relaxed mt-1"
                  >
                    {/* --- 图片渲染 --- */}
                    {log.type === 'Crawler_Images' && (
                      <div className="flex flex-wrap gap-2">
                        {log.content.map((item, imgIndex) => (
                          item.src ? ( // 检查 src 是否存在
                            <div key={imgIndex} className="group relative">
                              <img 
                                src={item.src} 
                                alt={item.alt || 'Crawled image'} 
                                className="w-16 h-16 object-contain rounded border border-gray-600 bg-gray-700 hover:border-blue-400 transition-all"
                                // 添加错误处理，如果图片加载失败显示占位符或隐藏
                                onError={(e) => { e.target.style.display = 'none'; /* 或显示占位符 */ }} 
                              />
                              {/* 悬停显示 Alt 和 Src */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs p-1.5 bg-gray-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none break-all">
                                Alt: {item.alt || 'N/A'}<br/>Src: {item.src}
                              </div>
                            </div>
                          ) : null // 如果 src 不存在则不渲染
                        ))}
                      </div>
                    )}

                    {/* --- 链接渲染 (Headers & Footers) --- */}
                    {(log.type === 'Crawler_Headers' || log.type === 'Crawler_Footers') && (
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

  const toggleBackground = () => {
    setCurrentBackground(prev => prev === 'DAY_GHIBLI' ? 'NIGHT_GHIBLI' : 'DAY_GHIBLI');
  };

  const getBackgroundStyle = () => {
    const bg = BACKGROUNDS[currentBackground];
    return { backgroundImage: bg.value };
  };

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
      
      @keyframes pulse-slow {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.3; }
      }
      
      @keyframes float-slow {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-10px) translateX(5px); opacity: 0; }
      }
      
      @keyframes progress {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0); }
        100% { transform: translateX(100%); }
      }
      
      .animate-pulse-slow {
        animation: pulse-slow 3s ease-in-out infinite;
      }
      
      .animate-float-slow {
        animation: float-slow 4s ease-in-out infinite;
      }
      
      .animate-progress {
        animation: progress 2s ease-in-out infinite;
      }
      
      .delay-0 {
        animation-delay: 0s;
      }
      
      .delay-100 {
        animation-delay: 0.2s;
      }
      
      .delay-200 {
        animation-delay: 0.4s;
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
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          messageHandler.addSystemMessage('Searching for competitors. Please wait a moment...');
        } else if (rawAnswer.includes('[COMPETITOR_SELECTED]')) {
          const messageBody = rawAnswer.replace(/\[COMPETITOR_SELECTED\].*$/s, '').trim();
          messageHandler.updateAgentMessage(messageBody, thinkingMessageId);
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
        messageHandler.updateAgentMessage('⚠️ Failed to get valid response from server', thinkingMessageId);
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
      // 处理未登录情况
      if (!isLoggedIn || !token) {
        localStorage.setItem('urlInput', userInput);
        const showLoginEvent = new CustomEvent('showAlternativelyLoginModal');
        window.dispatchEvent(showLoginEvent);
        setIsProcessingTask(false); 
        return;
      }
      // 获取用户套餐信息
      try {
        const packageResponse = await apiClient.getCustomerPackage();
        if (packageResponse?.code === 200 && packageResponse.data) {
          const { pageGeneratorLimit, pageGeneratorUsage } = packageResponse.data;
          const availableCredits = pageGeneratorLimit - pageGeneratorUsage;
          if (availableCredits <= 0) {
            showSubscriptionModal();
            setIsProcessingTask(false); 
            return;
          }
        } else {
          console.warn('[DEBUG] Failed to get user package information, continuing without credit check');
        }
      } catch (creditError) {
        console.error('Error checking user credit:', creditError);
      }

      // 获取历史任务列表
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

      // 淡出初始页面
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
      // 抽取url中的host
      let inputForAPI = formattedInput;
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
            inputForAPI = url.hostname;
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
      // 生成websiteId
      const generateIdResponse = await apiClient.generateWebsiteId();
      if (generateIdResponse?.code !== 200 || !generateIdResponse?.data?.websiteId) {
        console.error("Failed to generate websiteId:", generateIdResponse);
        return;
      }
      const websiteId = generateIdResponse.data.websiteId;
      setCurrentWebsiteId(websiteId); 
      // 把用户在初始界面输入的url作为第一句话给chat接口
      const greetingResponse = await apiClient.chatWithAI(
        formattedInput,
        websiteId,
      );
      if (greetingResponse?.code === 1058) {
        messageHandler.updateAgentMessage("⚠️ Network error occurred. Please try again.", thinkingMessageId);
        return;
      }
      
      if (greetingResponse?.code === 200 && greetingResponse.data?.answer) {
        const answer = filterMessageTags(greetingResponse.data.answer);
        if (greetingResponse.data.answer.includes('[URL_GET]')) {
          setInputDisabledDueToUrlGet(true);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          // 在chat接口成功接收URL后，发送URL给search接口进行任务初始化
          const searchResponse = await apiClient.searchCompetitor(
            inputForAPI,
            false,
            websiteId
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

  const showSubscriptionModal = () => {
    // 创建模态容器
    const modalContainer = document.createElement('div');
    modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm';
    
    // 创建模态内容 - 缩小整体尺寸
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl p-4 max-w-3xl w-full border border-purple-500/30 relative overflow-hidden';
    
    // 添加背景装饰
    const bgDecoration1 = document.createElement('div');
    bgDecoration1.className = 'absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]';
    
    const bgDecoration2 = document.createElement('div');
    bgDecoration2.className = 'absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]';
    
    // 添加标题 - 更有吸引力的文案
    const title = document.createElement('h2');
    title.className = 'text-3xl sm:text-4xl font-bold mb-4 text-white leading-tight text-center';
    title.innerHTML = 'Oops! <span class="text-rose-400">You\'ve Run Out of Credits</span> 🚀';
    
    // 添加描述 - 缩小字体和间距
    const description = document.createElement('p');
    description.className = 'text-lg text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed text-center';
    description.textContent = 'Upgrade now to continue creating amazing alternative pages and stay ahead of your competition!';
    
    // 创建计费周期切换 - 减少上边距
    const billingToggleContainer = document.createElement('div');
    billingToggleContainer.className = 'mt-8 flex justify-center';
    
    const billingToggle = document.createElement('div');
    billingToggle.className = 'relative bg-slate-800/50 backdrop-blur-sm p-1 rounded-full flex border border-slate-700/50';
    
    // 年付选项
    const yearlyButton = document.createElement('button');
    yearlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 text-white shadow-inner shadow-cyan-500/10';
    yearlyButton.innerHTML = '<span class="absolute inset-0 rounded-full bg-slate-700/50 backdrop-blur-sm"></span><span class="relative">Annual · Save 20%</span>';
    
    // 月付选项
    const monthlyButton = document.createElement('button');
    monthlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-400 hover:text-gray-200';
    monthlyButton.innerHTML = '<span class="relative">Monthly</span>';
    
    billingToggle.appendChild(yearlyButton);
    billingToggle.appendChild(monthlyButton);
    billingToggleContainer.appendChild(billingToggle);
    
    // 创建计划卡片容器 - 减少上边距
    const plansContainer = document.createElement('div');
    plansContainer.className = 'mt-8 grid gap-6 lg:grid-cols-2 max-w-3xl mx-auto';
    
    // 标准计划 - 减小内边距
    const standardPlan = document.createElement('div');
    standardPlan.className = 'relative flex flex-col rounded-2xl p-6 transition-all duration-500 text-center backdrop-blur-sm bg-slate-900/70 border border-slate-700/50 shadow-lg shadow-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/10 hover:translate-y-[-4px]';
    
    // 专业计划 - 减小内边距
    const proPlan = document.createElement('div');
    proPlan.className = 'relative flex flex-col rounded-2xl p-6 transition-all duration-500 text-center backdrop-blur-sm bg-gradient-to-b from-slate-800/95 to-slate-900/95 border-2 border-purple-500/50 ring-4 ring-purple-500/10 scale-[1.02] shadow-xl shadow-purple-500/20 hover:translate-y-[-4px]';
    
    // 添加热门标签 - 调整位置和大小
    const popularTag = document.createElement('div');
    popularTag.className = 'absolute -top-4 left-1/2 -translate-x-1/2';
    popularTag.innerHTML = '<div class="bg-gradient-to-r from-purple-500 to-rose-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg shadow-purple-500/20">MOST POPULAR ✨</div>';
    proPlan.appendChild(popularTag);
    
    // 设置初始价格为年付
    let currentBilling = 'yearly';
    
    // 标准计划内容 - 减小字体和间距，高亮页面生成数量
    standardPlan.innerHTML += `
      <h3 class="text-xl font-bold text-white mt-3">Standard</h3>
      <div class="mt-3 flex items-baseline justify-center">
        <div class="flex items-baseline">
          <span class="text-4xl font-bold tracking-tight text-white">$36</span>
          <span class="text-lg text-gray-400 ml-1">/mo</span>
        </div>
      </div>
      <div class="mt-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5h2v2H9v-2zm0-6h2v4H9V5z"/>
          </svg>
          Save 20%
        </span>
      </div>
      <p class="mt-3 text-sm text-gray-300">Everything you need to start creating alternative pages</p>
      <div class="mt-6 relative group">
        <div class="absolute -inset-0.5 rounded-xl blur-sm bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50 group-hover:opacity-70 transition duration-300"></div>
        <button class="relative w-full py-3 px-4 rounded-xl text-white text-sm font-medium bg-slate-900 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
          Choose This Plan
        </button>
      </div>
      <div class="mt-6 space-y-4">
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide mb-3 text-cyan-400">
            Features include:
          </h4>
          <ul class="space-y-3 text-xs">
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">
                <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-bold">30 alternative pages</span> generation & style change/month
              </span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Auto AI images grabbing and generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Auto internal links insertion</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">AI page design and generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Standard support</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-cyan-500/20">
                <svg class="w-2.5 h-2.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">1 Free onboarding call</span>
            </li>
          </ul>
        </div>
      </div>
    `;
    
    // 专业计划内容 - 减小字体和间距，高亮页面生成数量
    proPlan.innerHTML += `
      <h3 class="text-xl font-bold text-white mt-3">Professional</h3>
      <div class="mt-3 flex items-baseline justify-center">
        <div class="flex items-baseline">
          <span class="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent">$99</span>
          <span class="text-lg text-gray-400 ml-1">/mo</span>
        </div>
      </div>
      <div class="mt-2">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5h2v2H9v-2zm0-6h2v4H9V5z"/>
          </svg>
          Save 23%
        </span>
      </div>
      <p class="mt-3 text-sm text-gray-300">Perfect for teams scaling alternative page production</p>
      <div class="mt-6 relative group">
        <div class="absolute -inset-0.5 rounded-xl blur-sm bg-gradient-to-r from-purple-500 via-fuchsia-500 to-rose-500 opacity-70 group-hover:opacity-100 transition duration-300"></div>
        <button class="relative w-full py-3 px-4 rounded-xl text-white text-sm font-medium bg-slate-900 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0">
          Choose This Plan
        </button>
      </div>
      <div class="mt-6 space-y-4">
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide mb-3 text-purple-400">
            Everything in Standard, plus:
          </h4>
          <ul class="space-y-3 text-xs">
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">
                <span class="bg-gradient-to-r from-purple-400 to-rose-400 bg-clip-text text-transparent font-bold text-base animate-pulse">100 alternative pages</span> generation/month
              </span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Auto AI images grabbing and generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Auto internal links insertion</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">AI page design and generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Priority page generation</span>
            </li>
          </ul>
        </div>
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wide mb-3 text-purple-400">
            Pro features:
          </h4>
          <ul class="space-y-3 text-xs">
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">More alternative pages generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Unlimited Page Section Re-generation</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBodangerouslySetInnerHTMLx="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Priority support</span>
            </li>
          </ul>
        </div>
      </div>
    `;
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-3 right-3 text-gray-400 hover:text-white transition-colors cursor-pointer';
    closeButton.innerHTML = `
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    
    closeButton.onclick = () => {
      document.body.removeChild(modalContainer);
    };
    
    // 添加底部文本 - 减小字体和上边距
    const bottomText = document.createElement('p');
    bottomText.className = 'text-center text-gray-400 text-xs mt-6';
    bottomText.textContent = 'You will receive credits immediately after purchasing a subscription';
    
    // 组装模态框
    modalContent.appendChild(bgDecoration1);
    modalContent.appendChild(bgDecoration2);
    modalContent.appendChild(title);
    modalContent.appendChild(description);
    modalContent.appendChild(billingToggleContainer);
    plansContainer.appendChild(standardPlan);
    plansContainer.appendChild(proPlan);
    modalContent.appendChild(plansContainer);
    modalContent.appendChild(bottomText);
    modalContent.appendChild(closeButton);
    modalContainer.appendChild(modalContent);
    
    // 添加点击事件处理程序
    standardPlan.querySelector('button').onclick = () => {
      document.body.removeChild(modalContainer);
      // ★★★ 新增：滚动到订阅卡片 ★★★
      setTimeout(() => {
        const el = document.getElementById('subscription-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };
    
    proPlan.querySelector('button').onclick = () => {
      document.body.removeChild(modalContainer);
      // ★★★ 新增：滚动到订阅卡片 ★★★
      setTimeout(() => {
        const el = document.getElementById('subscription-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };
    
    // 添加月付/年付切换功能
    yearlyButton.onclick = () => {
      if (currentBilling !== 'yearly') {
        currentBilling = 'yearly';
        
        // 更新按钮样式
        yearlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 text-white shadow-inner shadow-cyan-500/10';
        yearlyButton.innerHTML = '<span class="absolute inset-0 rounded-full bg-slate-700/50 backdrop-blur-sm"></span><span class="relative">Annual · Save 20%</span>';
        
        monthlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-400 hover:text-gray-200';
        monthlyButton.innerHTML = '<span class="relative">Monthly</span>';
        
        // 更新价格
        standardPlan.querySelector('.text-4xl').textContent = '$36';
        proPlan.querySelector('.text-4xl').textContent = '$99';
        
        // 显示折扣标签
        const standardDiscount = standardPlan.querySelector('.inline-flex');
        const proDiscount = proPlan.querySelector('.inline-flex');
        if (standardDiscount) standardDiscount.style.display = 'inline-flex';
        if (proDiscount) proDiscount.style.display = 'inline-flex';
      }
    };
    
    monthlyButton.onclick = () => {
      if (currentBilling !== 'monthly') {
        currentBilling = 'monthly';
        
        // 更新按钮样式
        monthlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 text-white shadow-inner shadow-cyan-500/10';
        monthlyButton.innerHTML = '<span class="absolute inset-0 rounded-full bg-slate-700/50 backdrop-blur-sm"></span><span class="relative">Monthly</span>';
        
        yearlyButton.className = 'relative py-1.5 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 text-gray-400 hover:text-gray-200';
        yearlyButton.innerHTML = '<span class="relative">Annual · Save 20%</span>';
        
        // 更新价格
        standardPlan.querySelector('.text-4xl').textContent = '$45';
        proPlan.querySelector('.text-4xl').textContent = '$129';
        
        // 隐藏折扣标签
        const standardDiscount = standardPlan.querySelector('.inline-flex');
        const proDiscount = proPlan.querySelector('.inline-flex');
        if (standardDiscount) standardDiscount.style.display = 'none';
        if (proDiscount) proDiscount.style.display = 'none';
      }
    };
    
    // 显示模态框
    document.body.appendChild(modalContainer);
  };

  useEffect(() => {
    // --- 添加 currentWebsiteId 到依赖项 ---
    if (!shouldConnectSSE || !currentWebsiteId) {
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
      title.className = 'text-xl font-semibold text-white mb-3 text-center';
      title.textContent = 'Task Error';

      const description = document.createElement('p');
      description.className = 'text-gray-300 mb-2 text-center text-sm';
      description.textContent = errorMessage; // 显示具体的错误信息或通用信息

      const creditInfo = document.createElement('p');
      creditInfo.className = 'text-green-400 mb-4 text-center text-sm font-medium';
      creditInfo.textContent = 'Your credits have not been deducted for this task.';

      const instruction = document.createElement('p');
      instruction.className = 'text-gray-400 mb-6 text-center text-sm';
      instruction.textContent = 'Please return to the homepage and start a new task.';

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
      };

      eventSource.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          console.log('logData', logData);

          // 处理 Error 类型日志
          if (logData.type === 'Error') {
            console.error('Received Error log from SSE:', logData.content);
            const errorMessage = logData.content?.error || 'An irreversible error occurred during the task.';
            showErrorModal(errorMessage); // 显示错误弹窗并停止 SSE
            return; // 停止处理后续逻辑
          }

          if (logData.type === 'Html') {
            // 如果是新的流式输出开始，重置累积的内容
            setCurrentStep(4);
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
            setCurrentStep(4); 
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
                timestamp: logData.timestamp || new Date().toISOString()
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
            };
            setLogs(prevLogs => [...prevLogs, standardizedLog]);
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
        console.log('SSE Connection Error:', error);
        
        // 确保在关闭连接前记录当前的重试次数
        const currentRetryCount = retryCountRef.current;
        
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        
        setSseConnected(false);
        
        // 使用之前保存的计数值，而不是直接使用ref
        if (currentRetryCount < MAX_RETRY_COUNT) {
          // 先增加计数，再保存到ref
          const newRetryCount = currentRetryCount + 1;
          retryCountRef.current = newRetryCount;
          
          console.log('Retry count after increment:', newRetryCount);
          
          // 使用指数退避策略计算延迟
          const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, newRetryCount - 1), MAX_RETRY_DELAY);
          
          console.log(`Retrying SSE connection in ${delay}ms (attempt ${newRetryCount}/${MAX_RETRY_COUNT})`);
          
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
            }
          }, delay);
        } else {
          console.log(`Maximum retry attempts (${MAX_RETRY_COUNT}) reached. Giving up.`);
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
      retryCountRef.current = 0;
    };
  // --- 将 currentWebsiteId 添加到依赖数组 ---
  }, [shouldConnectSSE, currentWebsiteId]);

  useEffect(() => {
    // 检查是否有任务完成的日志
    const finishedLog = logs.find(log => 
      (log.type === 'Info' && log.step === 'GENERATION_FINISHED') ||
      (log.type === 'Info' && log.step === 'GENERATION_CHANGE_FINISHED')
    );

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
    }
  }, [logs, shouldConnectSSE]);

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
      setIsProcessingTask(false);
      messageHandler.addSystemMessage("Task completed! Thank you for using our service. You can find your generated page in the history records in the upper right corner of the page, where you can deploy and adjust it further.");
      // 保持输入框禁用
      // setInputDisabledDueToUrlGet(false); - 移除这行代码，保持输入框禁用
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
    
    // 重置已处理日志ID列表
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

  // 确保 processedLogIdsRef 被正确初始化
  const processedLogIdsRef = useRef([]);

  useEffect(() => {
    return () => {
      processedLogIdsRef.current = [];
    };
  }, []);

  // 获取当前主题的按钮样式
  const getButtonStyle = () => {
    return BACKGROUNDS[currentBackground].buttonStyle;
  };
  
  // 获取当前主题的卡片样式
  const getCardStyle = () => {
    return BACKGROUNDS[currentBackground].cardStyle;
  };

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

  // Typewriter effect refs (moved outside useEffect)
  const currentTextIndexRef = useRef(0); // Track which sentence to display
  const isDeletingRef = useRef(false); // Track if currently deleting
  const charIndexRef = useRef(0); // Track character index within the sentence

  // Typewriter effect for placeholder
  useEffect(() => {
    const placeholderTexts = [
      "Enter product website URL to get started.",
      "For example: altpage.ai or https://altpage.ai"
    ];
    const typingSpeed = 50; // milliseconds per character
    const deletingSpeed = 20;
    const pauseBetweenSentences = 1500; // Pause after typing a sentence
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

  // 在组件的顶部，与其他 useState 声明一起添加这两个状态
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  useEffect(() => {
    // 判断是否进入竞品分析阶段
    const shouldWarnOnRefresh = isProcessingTask;
    // currentStep >= 3 假设为竞品分析阶段，请根据你的实际逻辑调整

    const handleBeforeUnload = (e) => {
      if (shouldWarnOnRefresh) {
        e.preventDefault();
        // 标准写法，部分浏览器需要 returnValue
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

  if (initialLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 
                    flex items-center justify-center" style={{ paddingTop: "80px" }}>
        <div className="text-center">
          <img 
            src="/images/alternatively-logo.png" 
            alt="AltPage.ai" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse" 
          />
          <h2 className="text-xl font-semibold text-white mb-2">Loading</h2>
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
      <div className={`w-full h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat`} // 保留原有布局
             style={getBackgroundStyle()}>
          {/* Inject contextHolder */}
          {contextHolder}

          {/* 覆盖层 */}
          <div className={`absolute inset-0 ${getOverlayClass()}`}></div>

        {/* 添加垂直文本样式 */}
          <style jsx>{`
            .vertical-text {
              writing-mode: vertical-rl;
              text-orientation: mixed;
              transform: rotate(180deg);
            }
          `}</style>

        {/* Ensure content is above the effects - 保持原有布局不变 */}
        <div className={`relative z-10 w-full max-w-4xl px-8 py-12 initial-screen-content rounded-xl bg-transparent`}> {/* 移除背景和模糊 */}
          <div className={`text-center mb-8 text-shadow`}> {/* 应用 text-shadow */}
            {/* 修改 h1 以使用 Flexbox 进行对齐 */}
            <h1 className={`text-4xl font-bold ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 drop-shadow-lg flex items-center justify-center gap-3`}> {/* 应用 drop-shadow, 添加 flex, items-center, justify-center, gap */}
              <span> {/* 将文本包裹在 span 中 */}
                Turn Competitors'<span className={currentBackground === 'DAY_GHIBLI' ? 'text-amber-400' : 'text-blue-400'}>&nbsp;Popularity&nbsp;</span>
                Into Your Success
              </span>
              {/* 修改切换背景按钮 */}
              <Tooltip title={currentBackground === 'DAY_GHIBLI' ? "Switch to Night Mode" : "Switch to Day Mode"}>
                <button
                  onClick={toggleBackground}
                  // 调整 padding, 移除 gap, 保持其他样式
                  // 移除 ml-4, 因为 gap 已经提供了间距
                  // 移除 align-middle，因为它在 flex 布局中是多余的
                  className={`inline-flex items-center justify-center p-2 text-xs ${getButtonStyle()} rounded-full
                           backdrop-blur-sm transition-all border
                           shadow-lg hover:scale-105`} 
                >
                  {/* 根据状态显示不同图标 */}
                  {currentBackground === 'DAY_GHIBLI'
                    // 添加 flex-shrink-0 确保图标不收缩
                    ? <BulbOutlined className="w-4 h-4 flex-shrink-0" /> 
                    // 添加 flex-shrink-0 确保图标不收缩
                    : <BulbFilled className="w-4 h-4 flex-shrink-0" />   
                  }
                </button>
              </Tooltip>
              </h1>
            <p className={`text-lg ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-200/90' : 'text-gray-300'} mb-8 drop-shadow-md`}> {/* 应用 drop-shadow */}

                Create strategic alternative pages that capture high-intent traffic and convert browsers into customers.
              </p>
            </div>

            <div className="relative max-w-3xl mx-auto">
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
                <div className="relative">
                <Input
                  placeholder={dynamicPlaceholder} // 使用动态 placeholder
                  value={userInput}
                  onChange={(e) => {
                    setUserInput(e.target.value);
                    // 保存输入值到 localStorage
                    localStorage.setItem('urlInput', e.target.value);
                  }}
                  // 强制使用 Day Ghibli 的边框/阴影样式，并保留 research-tool-input 类
                  className={`research-tool-input bg-white/10 border rounded-xl text-lg w-full`}
                  style={{
                    backgroundColor: 'white',
                    color: '#fff',  
                    color: '#2d1a06',
                    height: '80px',
                    paddingRight: '220px', // 增加右侧内边距，容纳两个按钮
                    // 新增以下样式，防止 placeholder 溢出
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: '100%',
                  }}
                />
                {/* 按钮区：用flex包裹两个按钮，绝对定位到输入框右侧 */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 flex gap-2">
                  <button
                    type="submit"
                    className={`px-6 py-4 text-base
                      ${currentBackground === 'DAY_GHIBLI'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 border-amber-400/50 hover:border-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.5)] hover:shadow-[0_0_25px_rgba(217,119,6,0.7)] hover:from-amber-500 hover:to-amber-600'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:from-blue-500 hover:to-indigo-600'
                      } rounded-xl
                      transition-all duration-300 flex items-center gap-2
                      border hover:scale-105 shadow-lg
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
                        <span className="relative z-10">Start Generating!</span>
                      </>
                    )}
                  </button>
                  {/* 新增 History 按钮 */}
                  <button
                    type="button"
                    className="px-6 py-4 text-base bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl border border-gray-400/50 hover:border-gray-300 shadow-lg transition-all duration-300 flex items-center gap-2"
                    style={{ height: '64px' }}
                    onClick={() => {
                      const el = document.getElementById('result-preview-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <span className="relative z-10">History</span>
                  </button>
                </div>
                </div>
              </form>
              
            </div>

          {/* 添加免费credits提示 - 样式更加醒目 */}
          <div className={`mt-4 text-center mb-8 drop-shadow-md`}> {/* 应用 drop-shadow */}
          <div className="mt-4 text-center mb-8">
            <div
              className="inline-flex items-center px-4 py-3 rounded-lg shadow-lg border-2 border-yellow-400 bg-yellow-100 text-yellow-900 font-bold text-base justify-center"
              style={{ minWidth: 0 }}
            >
              <svg className="w-5 h-5 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
              </svg>
              Generate and deploy <span className="mx-1 underline decoration-wavy decoration-yellow-400">5 FREE alternative pages</span> – no credit card required!
            </div>
          </div>
            </div>

            <div className="mt-12 max-w-4xl mx-auto">
            <h3 className={`text-xl font-semibold ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 text-center drop-shadow-lg`}>Some Outstanding Alternative Pages Cases Generated By Us</h3> {/* 应用 drop-shadow */}
              <div className="grid grid-cols-3 gap-6">
              {/* Example Card 1: Page Ranking */}
              <div
                onClick={() => handleExampleClick('ranking')}
                className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                           border cursor-pointer hover:-translate-y-1
                           transition-all duration-300
                         relative overflow-hidden group flex flex-col justify-between`} 
              >
                <div> {/* Group top content */}
                  <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-400/20 group-hover:bg-amber-400/30' : 'bg-blue-400/20 group-hover:bg-blue-400/30'} rounded-full blur-xl transition-all`}></div>
                  <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                    <svg className={`w-6 h-6 ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-300 group-hover:text-amber-200' : 'text-blue-300 group-hover:text-blue-200'} font-medium mb-1 text-base`}>Improve Search Ranking</div>
                  {/* --- 修改：匿名化描述 --- */}
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 mb-2">SEO-focused pages designed to rank higher.</div>
                </div>
                <div> {/* Group bottom content including results and arrow */}
                  {/* Result 保持不变 */}
                  <div className={`mt-1 text-xs ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400/90' : 'text-cyan-400/90'} group-hover:text-opacity-100 transition-opacity`}>
                    <span className="font-semibold">Result:</span> +45% Traffic, Page 1 Ranking
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400/50 group-hover:text-amber-300' : 'text-blue-400/50 group-hover:text-blue-300'} transition-all`} />
                  </div>
                </div>
              </div>

              {/* Example Card 2: Conversion Rate */}
              <div
                onClick={() => handleExampleClick('conversion')}
                className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                           border cursor-pointer hover:-translate-y-1
                           transition-all duration-300
                         relative overflow-hidden group flex flex-col justify-between`} 
              >
                 <div> {/* Group top content */}
                  <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-purple-400/20 group-hover:bg-purple-400/30' : 'bg-pink-400/20 group-hover:bg-pink-400/30'} rounded-full blur-xl transition-all`}></div> 
                  <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                    <svg className={`w-6 h-6 ${currentBackground === 'DAY_GHIBLI' ? 'text-purple-600' : 'text-pink-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-purple-300 group-hover:text-purple-200' : 'text-pink-300 group-hover:text-pink-200'} font-medium mb-1 text-base`}>Maximize Conversion Rates</div> 
                  {/* --- 修改：匿名化描述 --- */}
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 mb-2">Targeted content to boost user engagement.</div>
                </div>
                <div> {/* Group bottom content including results and arrow */}
                  {/* Result 保持不变 */}
                  <div className={`mt-1 text-xs ${currentBackground === 'DAY_GHIBLI' ? 'text-purple-400/90' : 'text-pink-400/90'} group-hover:text-opacity-100 transition-opacity`}> 
                    <span className="font-semibold">Result:</span> +25% Conversion, Niche Ranking Up
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-purple-400/50 group-hover:text-purple-300' : 'text-pink-400/50 group-hover:text-pink-300'} transition-all`} /> 
                  </div>
                </div>
              </div>

              {/* Example Card 3: PPC Landing Pages */}
              <div
                onClick={() => handleExampleClick('sem')}
                className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                           border cursor-pointer hover:-translate-y-1
                           transition-all duration-300
                         relative overflow-hidden group flex flex-col justify-between`} 
              >
                <div> {/* Group top content */}
                  <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-rose-400/20 group-hover:bg-rose-400/30' : 'bg-orange-400/20 group-hover:bg-orange-400/30'} rounded-full blur-xl transition-all`}></div> 
                  <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                    <svg className={`w-6 h-6 ${currentBackground === 'DAY_GHIBLI' ? 'text-rose-600' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"> 
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-rose-300 group-hover:text-rose-200' : 'text-orange-300 group-hover:text-orange-200'} font-medium mb-1 text-base`}>Effective PPC Landing Pages</div> 
                  {/* --- 修改：匿名化描述 --- */}
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 mb-2">Optimized pages for paid campaigns.</div>
                </div>
                <div> {/* Group bottom content including results and arrow */}
                  {/* Result 保持不变 */}
                  <div className={`mt-1 text-xs ${currentBackground === 'DAY_GHIBLI' ? 'text-rose-400/90' : 'text-amber-400/90'} group-hover:text-opacity-100 transition-opacity`}> 
                    <span className="font-semibold">Result:</span> +15% Lead Conversion, 8 Keywords Ranked
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-rose-400/50 group-hover:text-rose-300' : 'text-orange-400/50 group-hover:text-orange-300'} transition-all`} /> 
                  </div>
                </div>
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
          colorPrimary: currentBackground === 'DAY_GHIBLI' ? '#d97706' : '#3b82f6',
        },
      }}
      wave={{ disabled: true }}
    >
      {contextHolder}
      <div className={`w-full min-h-screen bg-cover bg-center bg-no-repeat text-white flex items-center justify-center p-4 relative overflow-hidden`}
           style={{
             paddingTop: "80px",
             ...getBackgroundStyle()
           }}>

        {/* 背景覆盖层 */}
        <div className={`absolute inset-0 ${getOverlayClass()}`} style={{ paddingTop: "80px" }}></div>

        {/* 添加漂浮元素 - 仅在 DAY_GHIBLI 模式下 */}
        {currentBackground === 'DAY_GHIBLI' && (
          <>
            <div className="absolute top-[15%] left-[10%] w-8 h-8 rounded-full bg-amber-400/20 animate-float" style={{animationDuration: '8s'}}></div>
            <div className="absolute top-[30%] right-[15%] w-6 h-6 rounded-full bg-amber-300/30 animate-float" style={{animationDuration: '12s', animationDelay: '2s'}}></div>
            <div className="absolute bottom-[20%] left-[20%] w-10 h-10 rounded-full bg-amber-500/20 animate-float" style={{animationDuration: '10s', animationDelay: '1s'}}></div>
          </>
        )}

        <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
          {/* 左侧聊天面板 */}
          <div className="w-[35%] relative flex flex-col">
            {/* ... (聊天面板顶部和消息区域保持不变) ... */}
            <div className="h-10 px-4 border-b border-gray-300/20 flex-shrink-0">
              <div className="flex items-center">
                <img src="/images/alternatively-logo.png" alt="AltPage.ai" className="w-5 h-5 mr-1.5" />
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

            {/* --- 修改：将进度指示器移到这里 --- */}
            {!showInitialScreen && ( // 只在非初始屏幕显示进度
              <div className={`p-3 relative backdrop-blur-sm overflow-hidden shadow-md border-t border-gray-300/20 bg-slate-800/80 mx-2 mb-2 rounded-lg`}> {/* 调整 padding, margin, background, add border-t */}
                {/* 背景装饰效果 (可选，如果觉得太拥挤可以移除) */}
                {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#6366f115,transparent_50%)]"></div> */}
                {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#a855f715,transparent_50%)]"></div> */}

                <div className="flex items-center space-x-3 relative z-10"> {/* 缩小 space */}
                  {/* 更小的加载指示器 */}
                  <div className="relative w-5 h-5 flex-shrink-0"> {/* 缩小尺寸 */}
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-1 rounded-full border-2 border-purple-500 border-b-transparent animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                  </div>

                  <div className="text-slate-200 text-xs font-medium flex flex-col z-10 w-full"> {/* 缩小字体 */}
                    <div className="flex items-center justify-between mb-1.5"> {/* 缩小 margin */}
                      <span className={`font-semibold text-sm text-white`}>Progress</span> {/* 缩小字体, 简化标题 */}
                    </div>

                    {/* 保持5列，但内容更紧凑 */}
                    <div className="grid grid-cols-5 gap-1 w-full"> {/* 缩小 gap */}
                      {/* 调整样式使其更小 */}
                      <div className={`text-[10px] rounded px-1.5 py-1 flex items-center justify-center transition-all duration-500 ${currentStep >= 1
                        ? 'bg-gradient-to-r from-indigo-500/40 to-blue-500/40 text-white border border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                        {/* --- 修改：移除 animate-pulse --- */}
                        <span className={currentStep === 1 ? 'font-medium' : ''}>1. Find Competitors</span> {/* 简化文本 */}
                      </div>
                      <div className={`text-[10px] rounded px-1.5 py-1 flex items-center justify-center transition-all duration-500 ${currentStep >= 2
                        ? 'bg-gradient-to-r from-indigo-500/40 to-blue-500/40 text-white border border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                        {/* --- 修改：移除 animate-pulse --- */}
                        <span className={currentStep === 2 ? 'font-medium' : ''}>2. Select Competitor</span> {/* 简化文本 */}
                      </div>
                      <div className={`text-[10px] rounded px-1.5 py-1 flex items-center justify-center transition-all duration-500 ${currentStep >= 3
                        ? 'bg-gradient-to-r from-indigo-500/40 to-blue-500/40 text-white border border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                        {/* --- 修改：移除 animate-pulse --- */}
                        <span className={currentStep === 3 ? 'font-medium' : ''}>3. Analyze Competitor</span> {/* 简化文本 */}
                      </div>
                      <div className={`text-[10px] rounded px-1.5 py-1 flex items-center justify-center transition-all duration-500 ${currentStep >= 4
                        ? 'bg-gradient-to-r from-indigo-500/40 to-blue-500/40 text-white border border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'}`}>
                        {/* --- 修改：移除 animate-pulse --- */}
                        <span className={currentStep === 4 ? 'font-medium' : ''}>4. Codes Generation</span> {/* 简化文本 */}
                      </div>
                      <div className={`text-[10px] rounded px-1.5 py-1 flex items-center justify-center transition-all duration-500 ${
                          currentStep >= 5
                            ? 'bg-gradient-to-r from-green-500/40 to-emerald-500/40 text-white border border-green-500/60 shadow-sm shadow-green-500/20'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                        }`}>
                        {/* --- 修改：移除 animate-pulse --- */}
                        <span className={currentStep === 5 ? 'font-medium' : ''}>5. Style Change</span> {/* 简化文本 */}
                      </div>
                    </div>
                    {currentStep >= 5 && (
                    <div className="flex items-center mt-1.5 space-x-1"> {/* 缩小 margin 和 space */}
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* 缩小图标 */}
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`font-semibold text-xs text-green-400`}>Your pages are ready! You can continue to update the styles</span> {/* 缩小字体, 简化文本 */}
                    </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 输入框区域 */}
            <div className="p-4 border-t border-gray-300/20 flex-shrink-0"> {/* 保持这个区域不变 */}
              <div className="max-w-[600px] mx-auto">
                <Tooltip
                  title={(loading || isMessageSending || inputDisabledDueToUrlGet) ? "Agent is working, please wait a sec." : ""}
                  placement="topLeft" // 可以根据需要调整位置
                >
                  <div className="relative">
                    {/* --- 添加 JSX 样式块来定义占位符样式 --- */}
                    <style jsx>{`
                      .research-tool-input::placeholder {
                        color: #a1887f; /* 调整为 Ghibli 主题下更可见的颜色 */
                        opacity: 0.8; /* 确保可见性 */
                      }
                    `}</style>
                    <Input
                      autoComplete="off"
                      name="no-autofill"
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={loading || isMessageSending || inputDisabledDueToUrlGet}
                      // --- 修改：根据禁用状态设置 placeholder ---
                      placeholder={
                        !(loading || isMessageSending || inputDisabledDueToUrlGet)
                          ? "Waiting for your answer..."
                          : "" // 禁用时无 placeholder
                      }
                      // 强制使用 Day Ghibli 的边框/阴影样式，并保留 research-tool-input 类
                      className={`research-tool-input bg-white/10 border rounded-xl text-sm ${BACKGROUNDS.DAY_GHIBLI.inputStyle}`}
                      style={{
                        // 强制使用 Day Ghibli 的文字和背景色
                        color: '#433422',
                        backgroundColor: 'rgba(253, 230, 190, 0.85)',
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
                    {/* 仅在任务进行中时显示中止按钮 */}
                    {isProcessingTask && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-0"
                        title="Abort Task"
                        onClick={() => setShowAbortModal(true)}
                        style={{
                          height: '32px',
                          width: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px 0 rgba(255,65,108,0.15)',
                          border: 'none',
                          transition: 'box-shadow 0.2s',
                        }}
                      >
                        {/* 白色方块 */}
                        <div style={{
                          width: '16px',
                          height: '16px',
                          background: 'white',
                          borderRadius: '3px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                        }} />
                      </button>
                    )}
                  </div>
                </Tooltip>
                <div className="flex justify-end mt-3 px-1">
                  <div className="text-xs text-gray-400">
                    Press Enter ↵ to submit
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧面板 */}
          <div className={`w-[65%] ${
            // 根据主题设置背景和边框
            currentBackground === 'DAY_GHIBLI'
              ? 'bg-amber-900/10 border-amber-700/30'
              : 'bg-slate-900/10 border-blue-700/30' // Night: slate bg, blue border
          } backdrop-blur-lg rounded-2xl border shadow-xl flex flex-col h-full relative overflow-hidden`}>
            {/* --- 修改：移除这里的进度指示器 --- */}
            {/* 独立出来的进度指示器区域 (已被移除) */}

            {/* 包裹 Tab 和 内容区域的容器 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tab 切换区域 */}
              <div className="border-b border-gray-300/20 p-3 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setRightPanelTab('details')}
                      className={`text-sm ${
                        rightPanelTab === 'details'
                          ? (currentBackground === 'DAY_GHIBLI' ? 'text-amber-600' : 'text-blue-400') + ' font-medium'
                          : (currentBackground === 'DAY_GHIBLI' ? 'text-amber-700/70 hover:text-amber-600' : 'text-gray-400 hover:text-gray-200')
                      }`}
                    >
                      Execution Log
                    </button>
                    <button
                      onClick={() => setRightPanelTab('browser')}
                      className={`text-sm ${
                        rightPanelTab === 'browser'
                           ? (currentBackground === 'DAY_GHIBLI' ? 'text-amber-600' : 'text-blue-400') + ' font-medium'
                          : (currentBackground === 'DAY_GHIBLI' ? 'text-amber-700/70 hover:text-amber-600' : 'text-gray-400 hover:text-gray-200')
                      }`}
                    >
                      Browser
                  </button>
                </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className={currentBackground === 'DAY_GHIBLI' ? 'text-amber-800/80' : 'text-gray-400'}>Log Server {sseConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

              {/* 内容区域 */}
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
                                  ? (currentBackground === 'DAY_GHIBLI' ? 'bg-amber-500/20 text-amber-700' : 'bg-blue-500/20 text-blue-300')
                                  : (currentBackground === 'DAY_GHIBLI' ? 'bg-amber-200/30 text-amber-700/80 hover:text-amber-600' : 'bg-gray-500/20 text-gray-400 hover:text-gray-300')
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
                            <div className={`flex items-center mb-2 rounded-lg p-2 ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-100/50' : 'bg-gray-800/50'}`}>
                              <div className={`flex-1 px-3 py-1.5 text-xs rounded mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-50/70 text-amber-900' : 'bg-gray-700/50 text-gray-300'}`}>
                                {browserTabs.find(tab => tab.id === activeTab)?.url}
                              </div>
                              <button
                                onClick={() => window.open(browserTabs.find(tab => tab.id === activeTab)?.url, '_blank')}
                                className={`p-1.5 rounded-md transition-colors duration-200 group ${currentBackground === 'DAY_GHIBLI' ? 'hover:bg-amber-200/50' : 'hover:bg-gray-700/50'}`}
                                title="Open in new tab"
                              >
                                <svg
                                  className={`w-4 h-4 transition-colors duration-200 ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-700 group-hover:text-amber-600' : 'text-gray-400 group-hover:text-blue-400'}`}
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
                                className="w-full h-[calc(100vh-280px)]" // --- 修改：调整回 iframe 高度 ---
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

      {/* 添加 Modal 组件 */}
      <Modal
        title="Generated Results"
        open={showResultIdsModal}
        onCancel={() => {
          setShowResultIdsModal(false);
        }}
        footer={null}
        width={400}
        className="result-ids-modal"
        zIndex={1500}
        // 将 maskStyle 替换为 styles.mask
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' } }}
      >
        <div className="space-y-3">
          {resultIds.map((id, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <span className="text-gray-300">Result #{index + 1}</span>
              <Button
                type="primary"
                onClick={() => window.open(`https://preview.websitelm.site/en/${id}`, '_blank')}
                // 根据主题设置按钮颜色
                className={`${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                View Preview
              </Button>
            </div>
          ))}
        </div>
      </Modal>
      {/* 弹窗和终止逻辑 */}
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
      
    </ConfigProvider>
  );
};

export default ResearchTool;