'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar, ConfigProvider, Pagination, Dropdown, Menu, Modal } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined, LoadingOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api/index.js';
import { EventSourcePolyfill } from 'event-source-polyfill';
import MessageHandler from '../../../utils/MessageHandler';
import LoginModal from './LoginModal';
import { useUser } from '../../../contexts/UserContext';

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
    // 添加夜间模式的样式
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
  const [customerId, setCustomerId] = useState(null);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null);
  const [detailsData, setDetailsData] = useState([]);
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
  const [currentBackground, setCurrentBackground] = useState('DAY_GHIBLI'); // 默认使用 NIGHT_GHIBLI
  const [exampleDisabled, setExampleDisabled] = useState(false); // 添加 exampleDisabled 状态
  const messageHandler = new MessageHandler(setMessages);
  const [sseConnected, setSseConnected] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const MAX_RETRY_COUNT = 5;
  const [htmlStream, setHtmlStream] = useState('');
  const htmlStreamRef = useRef('');  // 用于累积 HTML 流
  const isStreamingRef = useRef(false);
  const currentStreamIdRef = useRef(null);  // 添加一个 ref 来跟踪当前正在流式输出的日志 ID
  const [resultIds, setResultIds] = useState([]);
  const [showResultIdsModal, setShowResultIdsModal] = useState(false);
  const lastLogCountRef = useRef(0);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success', 'error', 'info'
  });
  const [pendingUserInput, setPendingUserInput] = useState('');
  // 从 UserContext 获取用户信用额度
  const { userCredits, loading: userCreditsLoading } = useUser();

  // Add necessary state variables
  const [loadingResultIds, setLoadingResultIds] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState(0);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const filterMessageTags = (message) => {
    let filteredMessage = message;
    Object.entries(TAG_FILTERS).forEach(([tag, replacement]) => {
      filteredMessage = filteredMessage.replace(new RegExp(tag, 'g'), replacement);
    });
    
    return filteredMessage;
  };

  const validateDomain = (input) => {
    let domain = input.trim();
    if (domain.startsWith('http://')) domain = domain.substring(7);
    if (domain.startsWith('https://')) domain = domain.substring(8);
    if (domain.startsWith('www.')) domain = domain.substring(4);
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return domainRegex.test(domain);
  };
  const [shouldConnectSSE, setShouldConnectSSE] = useState(false);

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
              
              // 确保结果是数组并且每个元素都是有效的
              if (Array.isArray(competitors) && competitors.length > 0) {
                // 清理域名格式
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
                    messageHandler.addSystemMessage(
                      `We are generating alternative solutions for ${domainArray.join(', ')}. This may take some time, please wait...`
                    );
                    setInputDisabledDueToUrlGet(true);
                  } else {
                    messageHandler.addSystemMessage(`⚠️ Failed to generate alternative: Invalid server response`);
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
            messageHandler.addSystemMessage(`⚠️ Failed to extract competitor information from the response`);
          }
        } else if (rawAnswer.includes('[END]')) {
          // 处理 [END] 标记
          // 1. 过滤掉 [END] 标记
          const answer = filterMessageTags(rawAnswer);
          messageHandler.updateAgentMessage(answer, thinkingMessageId);
          
          // 2. 提取样式要求（即过滤后的消息内容）
          const styleRequirement = answer.trim();
          
          // 3. 调用 changeStyle API
          try {
            const styleResponse = await apiClient.changeStyle(styleRequirement, currentWebsiteId);
            if (styleResponse?.code === 200) {
              // 可以添加一个系统消息表示样式已更新
              messageHandler.addSystemMessage('I am updating the style, please wait a moment...');
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


  // 添加监听登录成功事件的 useEffect
  useEffect(() => {
    const handleLoginSuccess = () => {
      // 检查是否有待处理的用户输入
      if (pendingUserInput) {
        // 延迟一点执行，确保登录状态已完全更新
        setTimeout(() => {
          initializeChat(pendingUserInput);
          // 清除待处理的输入
          setPendingUserInput('');
        }, 500);
      }
    };
    
    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, [pendingUserInput, setPendingUserInput]); // 添加 setPendingUserInput 到依赖数组

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
  const codeContainerRef = useRef(null);
  const filterLogContent = (content) => {
    if (!content) return '';
    
    let filteredContent = String(content);
    
    // 处理标签内容 - 将它们转换为格式化的显示内容
    // 1. 处理 details/summary 标签 - 转换为格式化的思考过程区块
    filteredContent = filteredContent.replace(
      /<details.*?>\s*<summary>\s*Thinking\.\.\.\s*<\/summary>(.*?)<\/details>/gs, 
      (match, thinkingContent) => {
        // 添加空格到思考内容中
        const formattedThinking = thinkingContent
          .replace(/([a-z])([A-Z])/g, '$1 $2')  // 在小写字母后跟大写字母之间添加空格
          .replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2')  // 在标点符号后添加空格
          .replace(/([a-zA-Z])([.,!?:;])/g, '$1$2 ')  // 在标点符号前保持不变，后面添加空格
          .trim();
        
        // 返回格式化的思考区块
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
                  <div class="font-medium mb-1">Action:</div>
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

  // 渲染日志内容
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
      mergedLogs.push(mergedLog);
    });
    
    // 按时间戳排序
    mergedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return (
      <div className="h-full flex flex-col" ref={detailsRef}>
        <div className="p-3 space-y-2 overflow-y-auto">
          {mergedLogs.map((log, index) => {
            // 渲染 Agent 类型的日志
            if (log.type === 'Agent') {
              return (
                <div 
                  key={index} 
                  className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="flex items-center mb-2">
                    <img src="/images/alternatively-logo.png" alt="Alternatively" className="w-4 h-4 mr-2" />
                    <div className="text-[11px] text-gray-300 font-medium">Agent Message</div>
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
            }

            // 获取当前日志的累积内容
            const currentHtmlContent = log.id === currentStreamIdRef.current 
              ? htmlStreamRef.current 
              : log.content;

            return (
              <div 
                key={index} 
                className="bg-gray-800/50 p-2.5 rounded border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 animate-fadeIn"
                style={{
                  animationDelay: '0.5s'
                }}
              >
                <div className="flex items-center mb-2">
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
                  <div className="text-[11px] text-gray-300 font-medium">
                    {log.type === 'Dify' && 'Running Page Content Generation Workflow'}
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
    // 使用新的主题名称
    setCurrentBackground(prev => prev === 'DAY_GHIBLI' ? 'NIGHT_GHIBLI' : 'DAY_GHIBLI');
  };

  // 获取当前背景配置
  const getBackgroundStyle = () => {
    const bg = BACKGROUNDS[currentBackground];
    // 两种模式现在都是 image
    return { backgroundImage: bg.value };
  };

  // 获取当前背景类名 - 现在不需要了，因为都是图片背景
  const getBackgroundClass = () => {
    // const bg = BACKGROUNDS[currentBackground];
    // return bg.type === 'gradient' ? bg.value : '';
    return ''; // 返回空字符串
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

  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const initializeChat = async (userInput) => {
    try {
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
      const token = localStorage.getItem('alternativelyAccessToken');

      console.log('[DEBUG] Login status check:', { isLoggedIn, hasToken: !!token });
      
      // If user is not logged in, save current input and trigger login modal
      if (!isLoggedIn || !token) {
        // Save user input to continue after login
        setPendingUserInput(userInput);
        
        // Create and dispatch custom event to notify header-template to show login modal
        const showLoginEvent = new CustomEvent('showAlternativelyLoginModal');
        window.dispatchEvent(showLoginEvent);
        return;
      }
      
      // Check user credits - directly fetch from API
      try {
        // Directly fetch user package information from API
        const packageResponse = await apiClient.getCustomerPackage();
        
        if (packageResponse?.code === 200 && packageResponse.data) {
          const { pageGeneratorLimit, pageGeneratorUsage } = packageResponse.data;
          const availableCredits = pageGeneratorLimit - pageGeneratorUsage;
          
          console.log('[DEBUG] Available credits from API:', {
            limit: pageGeneratorLimit,
            usage: pageGeneratorUsage,
            available: availableCredits
          });
          
          // If credit is 0, show subscription modal
          if (availableCredits <= 0) {
            showSubscriptionModal();
            return;
          }
        } else {
          console.warn('[DEBUG] Failed to get user package information, continuing without credit check');
        }
      } catch (creditError) {
        console.error('Error checking user credit:', creditError);
        // Continue execution on error, don't block user operation
      }

      try {
        // Get the most recent 3 tasks
        const historyResponse = await apiClient.getAlternativeWebsiteList(1, 3);
        
        console.log('[DEBUG] 历史任务检查:', historyResponse?.data);
        
        if (historyResponse?.code === 200 && historyResponse.data) {
          // Find processing tasks
          const processingTasks = historyResponse.data.filter(item => 
            item.generatorStatus === 'processing'
          );
          
          console.log('[DEBUG] 正在处理的任务:', processingTasks);
          
          // Check if any processing task has a non-init third planning
          for (const task of processingTasks) {
            const statusResponse = await apiClient.getAlternativeStatus(task.websiteId);
            
            console.log('[DEBUG] 任务状态检查 (websiteId=' + task.websiteId + '):', statusResponse?.data);
            
            if (statusResponse?.code === 200 && statusResponse.data) {
              const planningStatuses = statusResponse.data;
              const productComparisonStatus = planningStatuses.find(planning => 
                planning.planningName === 'PRODUCT_COMPARISON'
              );
              
              console.log('[DEBUG] 产品比较状态:', productComparisonStatus);
              
              if (productComparisonStatus && productComparisonStatus.status !== 'init') {
                // 创建自定义弹窗，参考 header-template.js 中的样式
                const modalContainer = document.createElement('div');
                modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-700 animate-fadeIn';
                
                const title = document.createElement('h3');
                title.className = 'text-xl font-semibold text-white mb-4';
                title.textContent = 'Task In Progress';
                
                const description = document.createElement('p');
                description.className = 'text-gray-300 mb-3';
                description.textContent = 'You already have a product comparison task in progress. Please wait for it to complete before starting a new one.';
                
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
                modalContent.appendChild(emailNote);
                modalContent.appendChild(buttonContainer);
                modalContainer.appendChild(modalContent);
                
                document.body.appendChild(modalContainer);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('[DEBUG] 检查任务状态时出错:', error);
      }
      
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

      // 检查网络错误
      if (searchResponse?.code === 1058) {
        messageHandler.updateAgentMessage("⚠️ Network error occurred. Please try again.", thinkingMessageId);
        return;
      }

      if (searchResponse?.code === 200 && searchResponse?.data?.websiteId) {
        const websiteId = searchResponse.data.websiteId;
        setCurrentWebsiteId(websiteId);

        setShouldConnectSSE(true);
        
        const greetingResponse = await apiClient.chatWithAI(
          formattedInput,
          websiteId,
        );
        
        // 检查网络错误
        if (greetingResponse?.code === 1058) {
          messageHandler.updateAgentMessage("⚠️ Network error occurred. Please try again.", thinkingMessageId);
          return;
        }
        
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
      messageHandler.handleErrorMessage(error, thinkingMessageId);
    } finally {
      setLoading(false);
    }
  };

  // Add function to show subscription modal
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
              <span class="text-gray-300 text-left">Auto AI images generation</span>
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
              <span class="text-gray-300 text-left">Auto AI images generation</span>
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
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-gray-300 text-left">Unlimited onboarding calls</span>
            </li>
            <li class="flex items-start">
              <div class="w-4 h-4 mr-2 rounded-full flex-shrink-0 flex items-center justify-center bg-purple-500/20">
                <svg class="w-2.5 h-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      window.open('/pricing?plan=standard', '_blank');
      document.body.removeChild(modalContainer);
    };
    
    proPlan.querySelector('button').onclick = () => {
      window.open('/pricing?plan=professional', '_blank');
      document.body.removeChild(modalContainer);
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

  // 修改 SSE 连接的 useEffect
  useEffect(() => {
    if (!shouldConnectSSE) {
      return;
    }
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
  }, [shouldConnectSSE]);

  useEffect(() => {
    // 检查是否有任务完成的日志
    const finishedLog = logs.find(log => 
      (log.type === 'Info' && log.step === 'GENERATION_FINISHED') ||
      (log.type === 'Info' && log.step === 'GENERATION_CHANGE_FINISHED')
    );
    
    if (finishedLog && shouldConnectSSE) {
      // 任务完成后，关闭 SSE 连接
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

  // 组件卸载时重置标记
  useEffect(() => {
    return () => {
      competitorListProcessedRef.current = false;
    };
  }, []);

  

  // 修改标签页处理逻辑
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

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      processedLogIdsRef.current = [];
    };
  }, []);

  // 获取当前主题的按钮样式
  const getButtonStyle = () => {
    return BACKGROUNDS[currentBackground].buttonStyle;
  };
  
  // 获取当前主题的输入框样式
  const getInputStyle = () => {
    return BACKGROUNDS[currentBackground].inputStyle;
  };
  
  // 获取当前主题的卡片样式
  const getCardStyle = () => {
    return BACKGROUNDS[currentBackground].cardStyle;
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

  const [exampleDropdownVisible, setExampleDropdownVisible] = useState({
    hix: false,
    pipiads: false,
    jtracking: false
  });

  const exampleUrls = {
    hix: [
      'https://preview.websitelm.site/en/12345',
      'https://preview.websitelm.site/en/67890'
    ],
    pipiads: [
      'https://preview.websitelm.site/en/54321',
      'https://preview.websitelm.site/en/09876'
    ],
    jtracking: [
      'https://preview.websitelm.site/en/11223',
      'https://preview.websitelm.site/en/34455'
    ]
  };

  const handleExampleClick = (example) => {
    const showcaseSection = document.getElementById(`showcase-${example}`);
    if (showcaseSection) {
      showcaseSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 添加历史记录状态
  const [historyList, setHistoryList] = useState([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 添加获取历史记录的函数
  const fetchHistoryData = async () => {
    try {
      setHistoryLoading(true);
      // 获取历史记录数据
      const historyResponse = await apiClient.getAlternativeWebsiteList(1, 200);
      
      if (historyResponse?.code === 200 && historyResponse.data) {
        // 创建一个数组来存储过滤后的历史记录
        let filteredHistory = [];
        
        // 处理每个历史记录项
        for (const item of historyResponse.data) {
          // 如果状态不是processing，直接添加到过滤后的列表
          if (item.generatorStatus !== 'processing') {
            filteredHistory.push(item);
            continue;
          }
          
          // 如果状态是processing，检查第三个planning的状态
          try {
            const statusResponse = await apiClient.getAlternativeStatus(item.websiteId);
            if (statusResponse?.code === 200 && statusResponse.data) {
              const planningStatuses = statusResponse.data;
              const productComparisonStatus = planningStatuses.find(planning => 
                planning.planningName === 'PRODUCT_COMPARISON'
              );
              
              // 如果第三个planning不是init状态，添加到过滤后的列表
              if (!productComparisonStatus || productComparisonStatus.status !== 'init') {
                filteredHistory.push(item);
              }
              // 如果是init状态，则不添加（过滤掉）
            }
          } catch (error) {
            console.error('Error checking planning status:', error);
            // 如果获取状态失败，仍然添加到列表中
            filteredHistory.push(item);
          }
        }
        
        // 按创建时间降序排序
        filteredHistory.sort((a, b) => new Date(b.generatedStart) - new Date(a.generatedStart));
        setHistoryList(filteredHistory);
      } else {
        console.warn('[DEBUG] Failed to get history data');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 添加加载历史记录的 useEffect
  useEffect(() => {
    // 检查用户是否登录
    const isLoggedIn = localStorage.getItem('alternativelyIsLoggedIn') === 'true';
    const token = localStorage.getItem('alternativelyAccessToken');
    
    if (isLoggedIn && token) {
      fetchHistoryData();
    }
    
    // 监听登录成功事件
    const handleLoginSuccess = () => {
      fetchHistoryData();
    };
    
    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, []);

  // 处理历史记录项点击
  const handleHistoryItemClick = async(item, event) => {  // 添加 event 参数
    // 添加删除按钮点击处理
    if (event.target.closest('.delete-btn')) {  // 使用 closest 来确保点击的是删除按钮
      event.stopPropagation();  // 阻止事件冒泡
      try {
        // 创建自定义删除确认弹窗
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl p-6 max-w-md w-full relative animate-fadeIn';
        modalContent.innerHTML = `
          <div class="relative">
            <h3 class="text-xl font-bold text-white mb-2">Delete Record</h3>
            <p class="text-gray-300 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
            
            <div class="flex space-x-3">
              <button class="cancel-btn flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
                Cancel
              </button>
              <button class="confirm-btn flex-1 py-2 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }
        `;
        document.head.appendChild(style);
        
        // 绑定事件
        const closeModal = () => {
          document.body.removeChild(modalOverlay);
          document.head.removeChild(style);
        };
        
        // 取消按钮
        const cancelBtn = modalContent.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', closeModal);
        
        // 确认删除按钮
        const confirmBtn = modalContent.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', async () => {
          try {
            console.log('Deleting website with ID:', item.websiteId); // 添加日志
            const deleteResponse = await apiClient.deletePage(item.websiteId);
            console.log('Delete response:', deleteResponse); // 添加日志
            
            // 检查响应是否成功
            if (deleteResponse?.code === 200) {
              // 更新历史记录列表
              setHistoryList(prev => prev.filter(record => record.websiteId !== item.websiteId));
              setNotification({
                show: true,
                message: 'Record deleted successfully',
                type: 'success'
              });
            } else {
              console.error('Delete API returned non-200 code:', deleteResponse);
              setNotification({
                show: true,
                message: `Failed to delete record: ${deleteResponse?.message || 'Unknown error'}`,
                type: 'error'
              });
            }
            closeModal();
          } catch (error) {
            console.error('Failed to delete record:', error);
            setNotification({
              show: true,
              message: `Failed to delete record: ${error.message || 'Unknown error'}`,
              type: 'error'
            });
            closeModal();
          }
        });
        
        // 点击背景关闭
        modalOverlay.addEventListener('click', (e) => {
          if (e.target === modalOverlay) {
            closeModal();
          }
        });
        
        modalOverlay.appendChild(modalContent);
        return;
      } catch (error) {
        console.error('Failed to delete record:', error);
        setNotification({
          show: true,
          message: 'Failed to delete record',
          type: 'error'
        });
      }
      return;
    }
  
    if (item.generatorStatus === 'failed') {
      // 创建自定义弹窗
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]';
      
      const modalContent = document.createElement('div');
      modalContent.className = 'bg-slate-900 border border-red-500/30 rounded-xl shadow-2xl p-6 max-w-md w-full relative animate-fadeIn';
      modalContent.innerHTML = `
        <div class="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 rounded-xl blur opacity-30"></div>
        <div class="relative">
          <button class="absolute top-0 right-0 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800/50 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 class="text-xl font-bold text-white mb-2">Task Failed</h3>
          <p class="text-gray-300 mb-6">This task could not be completed successfully. Would you like to restart with the same URL?</p>
          
          <div class="flex space-x-3">
            <button class="cancel-btn flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors">
              Cancel
            </button>
            <button class="restart-btn flex-1 py-2 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg transition-colors">
              Restart Task
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modalOverlay);
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
      
      // 绑定事件
      const closeModal = () => {
        document.body.removeChild(modalOverlay);
        document.head.removeChild(style);
      };
      
      // 关闭按钮
      const closeBtn = modalContent.querySelector('button');
      closeBtn.addEventListener('click', closeModal);
      
      // 取消按钮
      const cancelBtn = modalContent.querySelector('.cancel-btn');
      cancelBtn.addEventListener('click', closeModal);
      
      // 重启按钮
      const restartBtn = modalContent.querySelector('.restart-btn');
      restartBtn.addEventListener('click', () => {
        closeModal();
        initializeChat(item.website);
      });
      
      // 点击背景关闭
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal();
        }
      });
      
      modalOverlay.appendChild(modalContent);
      
      return false;
    }
  
    if (item.generatorStatus === 'finished') {
      // 创建加载中弹窗
      const loadingModalOverlay = document.createElement('div');
      loadingModalOverlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]';
      loadingModalOverlay.id = 'loading-preview-overlay';
      
      const loadingModalContent = document.createElement('div');
      loadingModalContent.className = 'bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn text-center';
      
      loadingModalContent.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 class="text-xl font-bold text-white mb-2">Loading Preview Data</h3>
          <p class="text-gray-300">Please wait while we fetch your generated results...</p>
        </div>
      `;
      
      document.body.appendChild(loadingModalOverlay);
      loadingModalOverlay.appendChild(loadingModalContent);
      
      setLoadingResultIds(true);

      if (item.websiteId) {
        setCurrentWebsiteId(item.websiteId);
        
        try {
          const historyResponse = await apiClient.getAlternativeWebsiteHistory(item.websiteId);
          
          // Remove loading modal
          const loadingOverlay = document.getElementById('loading-preview-overlay');
          if (loadingOverlay) {
            document.body.removeChild(loadingOverlay);
          }
          
          if (historyResponse?.code === 200 && historyResponse.data) {
            const codesResultIds = historyResponse.data
              .filter(record => record.type === 'Codes' && record.content?.resultId)
              .map(record => record.content.resultId);
            
            if (codesResultIds.length > 0) {
              setResultIds(codesResultIds);
              
              // 创建自定义预览弹窗
              const modalOverlay = document.createElement('div');
              modalOverlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000]';
              
              const modalContent = document.createElement('div');
              modalContent.className = 'bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl p-6 w-[90%] h-[80vh] relative animate-fadeIn';
              
              // 添加标题和关闭按钮
              modalContent.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-xl font-bold text-white">Generated Results</h3>
                  <button class="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800/50 transition-colors">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div class="flex h-[calc(100%-3rem)] gap-4">
                  <div class="w-1/5 border-r border-slate-700/50 pr-4 overflow-y-auto" id="preview-list">
                    <!-- Preview list will be added here dynamically -->
                  </div>
                  
                  <div class="w-4/5 pl-4 relative">
                    <div class="mb-3 flex items-center justify-between">
                      <h3 class="text-gray-300 text-sm font-medium">Live Preview</h3>
                      <div class="flex items-center gap-2">
                        <button id="open-new-window" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Window
                        </button>
                      </div>
                    </div>
                    
                    <div class="h-[calc(100%-3rem)] bg-white rounded-lg overflow-hidden relative">
                      <div id="loading-indicator" class="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <div class="flex flex-col items-center">
                          <div class="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <p class="text-gray-300">Loading preview...</p>
                        </div>
                      </div>
                      <iframe id="preview-iframe" src="" class="w-full h-full border-0"></iframe>
                    </div>
                  </div>
                </div>
              `;
              
              document.body.appendChild(modalOverlay);
              modalOverlay.appendChild(modalContent);
              
              // 获取DOM元素
              const closeBtn = modalContent.querySelector('button');
              const previewList = modalContent.querySelector('#preview-list');
              const previewIframe = modalContent.querySelector('#preview-iframe');
              const loadingIndicator = modalContent.querySelector('#loading-indicator');
              const openNewWindowBtn = modalContent.querySelector('#open-new-window');
              
              // 设置初始预览URL
              const initialPreviewUrl = `https://preview.websitelm.site/en/${codesResultIds[0]}`;
              previewIframe.src = initialPreviewUrl;
              
              // 添加预览列表项
              codesResultIds.forEach((id, index) => {
                const listItem = document.createElement('div');
                listItem.className = `p-3 rounded-lg cursor-pointer transition-all duration-200 ${index === 0 ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50'}`;
                listItem.innerHTML = `
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-400' : 'bg-gray-500'}"></div>
                      <span class="text-gray-200 font-medium">Preview Version #${index + 1}</span>
                    </div>
                    <button class="text-xs text-blue-400 hover:text-blue-300 open-external" data-url="https://preview.websitelm.site/en/${id}">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  <div class="mt-1.5 text-xs text-gray-400">
                    Result ID: ${id.substring(0, 8)}...${id.substring(id.length - 4)}
                  </div>
                `;
                
                // 点击预览项切换预览
                listItem.addEventListener('click', (e) => {
                  if (!e.target.closest('.open-external')) {
                    // 更新选中状态
                    previewList.querySelectorAll('div[class^="p-3"]').forEach(item => {
                      item.className = 'p-3 rounded-lg cursor-pointer transition-all duration-200 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50';
                      item.querySelector('.w-2').className = 'w-2 h-2 rounded-full bg-gray-500';
                    });
                    listItem.className = 'p-3 rounded-lg cursor-pointer transition-all duration-200 bg-blue-500/20 border border-blue-500/50';
                    listItem.querySelector('.w-2').className = 'w-2 h-2 rounded-full bg-blue-400';
                    
                    // 显示加载指示器
                    loadingIndicator.style.display = 'flex';
                    
                    // 更新iframe源
                    previewIframe.src = `https://preview.websitelm.site/en/${id}`;
                    
                    // 更新"在新窗口打开"按钮的URL
                    openNewWindowBtn.setAttribute('data-url', `https://preview.websitelm.site/en/${id}`);
                  }
                });
                
                previewList.appendChild(listItem);
              });
              
              // 绑定事件
              closeBtn.addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
              });
              
              // 点击背景关闭
              modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                  document.body.removeChild(modalOverlay);
                }
              });
              
              // iframe加载完成后隐藏加载指示器
              previewIframe.addEventListener('load', () => {
                loadingIndicator.style.display = 'none';
              });
              
              // 在新窗口打开按钮
              openNewWindowBtn.addEventListener('click', () => {
                window.open(previewIframe.src, '_blank');
              });
              
              // 外部链接按钮
              modalContent.querySelectorAll('.open-external').forEach(btn => {
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  window.open(btn.getAttribute('data-url'), '_blank');
                });
              });
              
              // 更新浏览器标签页
              const newTabs = codesResultIds.map((id, index) => ({
                id: `result-${id}`,
                title: `Result ${index + 1}`,
                url: `https://preview.websitelm.site/en/${id}`
              }));
              
              setBrowserTabs(newTabs);
              setActiveTab(`result-${codesResultIds[0]}`);
              setRightPanelTab('browser');
            } else {
              setNotification({
                show: true,
                message: 'No preview data available for this task.',
                type: 'info'
              });
            }
          }
        } catch (error) {
          // Remove loading modal in case of error
          const loadingOverlay = document.getElementById('loading-preview-overlay');
          if (loadingOverlay) {
            document.body.removeChild(loadingOverlay);
          }
          
          setNotification({
            show: true,
            message: 'Failed to load preview data. Please try again.',
            type: 'error'
          });
        } finally {
          setLoadingResultIds(false);
        }
      }
      return;
    }
  
    if (item.generatorStatus === 'processing') {
      try {
        const statusResponse = await apiClient.getAlternativeStatus(item.websiteId);
  
        if (statusResponse?.code === 200 && statusResponse.data) {
          const planningStatuses = statusResponse.data;
          const productComparisonStatus = planningStatuses.find(planning => 
            planning.planningName === 'PRODUCT_COMPARISON'
          );
  
          if (productComparisonStatus && productComparisonStatus.status !== 'init') {
            // 创建自定义弹窗，参考 header-template.js 中的样式
            const modalContainer = document.createElement('div');
            modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full border border-slate-700 animate-fadeIn';
            
            const title = document.createElement('h3');
            title.className = 'text-xl font-semibold text-white mb-4';
            title.textContent = 'Task In Progress';
            
            const description = document.createElement('p');
            description.className = 'text-gray-300 mb-3';
            description.textContent = 'You already have a product comparison task in progress. Please wait for it to complete before starting a new one.';
            
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
            modalContent.appendChild(emailNote);
            modalContent.appendChild(buttonContainer);
            modalContainer.appendChild(modalContent);
            
            document.body.appendChild(modalContainer);
            return;
          }

        }
      } catch (error) {
        console.error('Failed to fetch task status:', error);
        setNotification({
          show: true,
          message: 'Failed to check task status. Please try again.',
          type: 'error'
        });
      }
    }
  };

  // 格式化日期时间
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // 获取网站域名
  const getDomainFromUrl = (url) => {
    if (!url) return 'Unnamed Site';
    
    try {
      // 移除协议前缀
      let domain = url.replace(/^https?:\/\//, '');
      // 移除路径和查询参数
      domain = domain.split('/')[0];
      return domain;
    } catch (error) {
      return url;
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
      <div className={`w-full h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat`} // 保留原有布局
           style={getBackgroundStyle()}>
        {/* Inject contextHolder */}
        {contextHolder}

        {/* 覆盖层 */}
        <div className={`absolute inset-0 ${getOverlayClass()}`}></div>

        {/* 添加历史记录侧边栏 - 修改定位方式，使其在组件内部 */}
        <div className={`absolute left-0 top-0 bottom-0 w-56 bg-slate-900/60 backdrop-blur-[2px] border-r border-slate-700/30 z-10 overflow-y-auto overflow-x-hidden pt-20 transition-all duration-300 ${historyCollapsed ? '-translate-x-52' : 'translate-x-0'}`}>
          <div className="p-3 relative">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-gray-400 text-sm font-medium">History</h3>
              <button 
                onClick={() => setHistoryCollapsed(!historyCollapsed)}
                className="absolute -right-1 top-3 bg-slate-800/70 border border-slate-700/30 rounded-full p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {historyCollapsed ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                )}
              </button>
            </div>
            
            <button 
              onClick={fetchHistoryData}
              className="w-full py-1 mb-3 text-xs text-gray-500 hover:text-gray-300 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            {historyLoading ? (
              <div className="flex justify-center py-2">
                <Spin size="small" />
              </div>
            ) : historyList.length > 0 ? (
              <div className="space-y-1.5 pr-1">
                {historyList.map((item) => (
                <div 
                  key={item.websiteId}
                  className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 cursor-pointer transition-all duration-300"
                  onClick={(e) => handleHistoryItemClick(item, e)}  // 传递 event 参数
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400 font-medium truncate max-w-full">{getDomainFromUrl(item.website)}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5 truncate">
                        {formatDateTime(item.generatedStart)}
                      </div>
                      <div className="flex items-center mt-0.5">
                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                          item.generatorStatus === 'processing' 
                            ? 'bg-blue-900/30 text-blue-400/80' 
                            : item.generatorStatus === 'finished'
                            ? 'bg-green-900/30 text-green-400/80'
                            : 'bg-red-900/30 text-red-400/80'
                        }`}>
                          {item.generatorStatus === 'processing' ? 'Processing' : 
                          item.generatorStatus === 'finished' ? 'Completed' : 'Failed'}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="delete-btn p-1 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete this record"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-500 text-[10px]">
                No history records found
              </div>
            )}
          </div>
        </div>

        {/* 添加折叠状态下的小标签 - 更加低调 */}
        {historyCollapsed && (
          <div 
            onClick={() => setHistoryCollapsed(false)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-slate-800/70 text-gray-400 py-2 px-1 rounded-r-md cursor-pointer z-20 border-t border-r border-b border-slate-700/30 hover:text-gray-300 transition-colors"
          >
            <div className="vertical-text text-[10px] font-medium">History</div>
          </div>
        )}

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
            <h1 className={`text-4xl font-bold ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 drop-shadow-lg`}> {/* 应用 drop-shadow */}
              Welcome to <span className={currentBackground === 'DAY_GHIBLI' ? 'text-amber-400' : 'text-blue-400'}>Alternatively</span>

              <button 
                onClick={toggleBackground}
                className={`ml-4 inline-flex items-center px-3 py-1.5 text-xs ${getButtonStyle()} rounded-full
                         backdrop-blur-sm transition-all gap-1.5 border
                         shadow-lg hover:scale-105 align-middle`} // 使用 hover:scale-105 替代 hover:bg-blue-500/50
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                </svg>
                {/* 更新按钮文本 */}
                {currentBackground === 'DAY_GHIBLI' ? 'Switch to Night Ghibli' : 'Switch to Day Ghibli'}
              </button>
            </h1>
            <p className={`text-lg ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-200/90' : 'text-gray-300'} mb-8 drop-shadow-md`}> {/* 应用 drop-shadow */}
              Which product would you like to analyze and create an SEO-friendly Alternatively page for?
            </p>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <form onSubmit={(e) => {
              // ... (form submission logic remains the same) ...
              e.preventDefault();

              if (!userInput.trim()) {
                messageApi.error('Please enter a website URL');
                setValidationError('Please enter a website URL');
                return;
              }

              if (!validateDomain(userInput)) {
                messageApi.error('Please enter a valid domain (e.g., example.com)');
                setValidationError('Please enter a valid domain (e.g., example.com)');
                return;
              }
              
              setValidationError('');
              const formattedInput = userInput.trim().startsWith('http') ? userInput.trim() : `https://${userInput.trim()}`;
              initializeChat(formattedInput);
            }}>
                <div className="relative">
                <Input
                  placeholder="Enter product website URL (e.g., example.com)"
                  value={userInput}
                    onChange={(e) => {
                    setUserInput(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  // 强制使用 Day Ghibli 的边框/阴影样式，并保留 research-tool-input 类
                  className={`research-tool-input bg-white/10 border rounded-xl text-lg w-full ${validationError ? 'border-red-500' : BACKGROUNDS.DAY_GHIBLI.cardStyle} shadow-xl`}
                  style={{
                    // 强制使用 Day Ghibli 的文字和背景色
                    color: '#433422',
                    backgroundColor: 'rgba(253, 230, 190, 0.85)',
                    height: '80px',
                    paddingRight: '120px',
                    transition: 'all 0.3s ease',
                    // 强制使用 Day Ghibli 的阴影
                    boxShadow: '0 10px 25px -5px rgba(120, 80, 40, 0.3)'
                  }}
                  prefix={
                    // 强制使用 Day Ghibli 的前缀颜色
                    <span className={`font-mono text-amber-800/70`} style={{ marginLeft: '16px' }}>https://</span>
                  }
                  status={validationError ? "error" : ""}
                />
                </div>
                <button
                  type="submit"
                // 根据主题设置按钮样式
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 px-6 py-4 text-base
                         ${currentBackground === 'DAY_GHIBLI'
                           ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100 border-amber-400/50 hover:border-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.5)] hover:shadow-[0_0_25px_rgba(217,119,6,0.7)] hover:from-amber-500 hover:to-amber-600'
                           : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-400/50 hover:border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] hover:from-blue-500 hover:to-indigo-600'
                         } rounded-xl
                         transition-all duration-300 flex items-center gap-2
                         border hover:scale-105 shadow-lg
                         after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-r
                         after:from-transparent after:via-white/20 after:to-transparent
                         after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-all after:duration-1000
                         after:rounded-xl overflow-hidden`}
                style={{ height: '64px' }}
              >
                <ArrowRightOutlined className="w-6 h-6" />
                <span className="relative z-10">Analyze Now</span>
              </button>
            </form>
          </div>

          {/* 添加免费credits提示 - 样式更加醒目 */}
          <div className={`mt-4 text-center mb-8 drop-shadow-md`}> {/* 应用 drop-shadow */}
            <div className={`inline-flex items-center px-5 py-4 ${
              currentBackground === 'DAY_GHIBLI'
                ? 'bg-gradient-to-r from-amber-600/70 to-amber-700/70 text-white border-4 border-yellow-300 animate-pulse-strong'
                : 'bg-gradient-to-r from-blue-600/70 to-indigo-700/70 text-white border-4 border-yellow-300 animate-pulse-strong' // Night: blue gradient
            } rounded-lg shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden`}> {/* 应用 drop-shadow */}
              {/* ... (rest of the credits banner remains the same) ... */}
              <div className="absolute inset-0 bg-white/20 animate-shimmer-fast"></div>
              <div className="absolute -left-4 -top-4 w-16 h-16 bg-yellow-300/30 rounded-full blur-xl"></div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-yellow-300/30 rounded-full blur-xl"></div>
              <svg className="w-6 h-6 mr-3 text-yellow-300 animate-bounce-strong" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
              </svg>
              <span className="font-extrabold text-lg relative z-10">Generate And Deploy <span className="text-yellow-300 underline decoration-2 decoration-wavy decoration-yellow-300/70">5 FREE alternative pages</span> - no credit card required!</span>
              <svg className="w-6 h-6 ml-3 text-yellow-300 animate-bounce-strong" style={{animationDelay: '0.3s'}} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M13 9V3.5L18.5 9M6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V8l-6-6H6z"/>
              </svg>
            </div>
          </div>

          <div className="mt-12 max-w-4xl mx-auto">
            <h3 className={`text-xl font-semibold ${currentBackground === 'DAY_GHIBLI' ? 'text-amber-100' : 'text-white'} mb-6 text-center drop-shadow-lg`}>Some Outstanding Alternative Pages Cases Generated By Us</h3> {/* 应用 drop-shadow */}
            <div className="grid grid-cols-3 gap-6">
              {/* Example Card 1: HIX */}
              <div
                onClick={() => handleExampleClick('hix')}
                // 使用 getCardStyle 获取样式
                className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                         border cursor-pointer hover:-translate-y-1
                         transition-all duration-300
                         relative overflow-hidden group`} // Add group for hover effects
              >
                {/* 根据主题设置光晕效果 */}
                <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-400/20 group-hover:bg-amber-400/30' : 'bg-blue-400/20 group-hover:bg-blue-400/30'} rounded-full blur-xl transition-all`}></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                  {/* 根据主题设置文字颜色 */}
                  <span className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-600' : 'text-blue-600'} font-bold text-xl`}>H</span>
                </div>
                {/* 根据主题设置文字颜色 */}
                <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-300 group-hover:text-amber-200' : 'text-blue-300 group-hover:text-blue-200'} font-medium mb-2 text-base`}>HIX</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Premium fitness equipment</div>
                <div className="absolute bottom-3 right-3">
                  {/* 根据主题设置箭头颜色 */}
                  <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400/50 group-hover:text-amber-300' : 'text-blue-400/50 group-hover:text-blue-300'} transition-all`} />
                </div>
              </div>

              {/* Example Card 2: Joggai */}
              <div
                onClick={() => handleExampleClick('joggai')}
                // 使用 getCardStyle 获取样式
                 className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                         border cursor-pointer hover:-translate-y-1
                         transition-all duration-300
                         group relative overflow-hidden`}
              >
                 {/* 根据主题设置光晕效果 */}
                <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-800/20 group-hover:bg-amber-800/30' : 'bg-indigo-400/20 group-hover:bg-indigo-400/30'} rounded-full blur-xl transition-all`}></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                   {/* 根据主题设置文字颜色 */}
                  <span className={`${currentBackground === 'DAY_GHIBLI' ? 'text-purple-600' : 'text-indigo-600'} font-bold text-xl`}>J</span>
                </div>
                 {/* 根据主题设置文字颜色 */}
                <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400 group-hover:text-amber-300' : 'text-indigo-300 group-hover:text-indigo-200'} font-medium mb-2 text-base`}>Joggai</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Innovative running app</div>
                <div className="absolute bottom-3 right-3">
                   {/* 根据主题设置箭头颜色 */}
                  <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-500/50 group-hover:text-amber-400' : 'text-indigo-400/50 group-hover:text-indigo-300'} transition-all`} />
                </div>
              </div>

              {/* Example Card 3: JTracking */}
              <div
                onClick={() => handleExampleClick('jtracking')}
                // 使用 getCardStyle 获取样式
                 className={`${getCardStyle()} backdrop-blur-sm p-5 rounded-xl
                         border cursor-pointer hover:-translate-y-1
                         transition-all duration-300
                         group relative overflow-hidden`}
              >
                 {/* 根据主题设置光晕效果 */}
                <div className={`absolute -right-6 -top-6 w-16 h-16 ${currentBackground === 'DAY_GHIBLI' ? 'bg-amber-600/20 group-hover:bg-amber-600/30' : 'bg-cyan-400/20 group-hover:bg-cyan-400/30'} rounded-full blur-xl transition-all`}></div>
                <div className="w-10 h-10 mb-3 flex items-center justify-center bg-white/90 rounded-lg">
                   {/* 根据主题设置文字颜色 */}
                  <span className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-600' : 'text-cyan-600'} font-bold text-xl`}>J</span>
                </div>
                 {/* 根据主题设置文字颜色 */}
                <div className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-300 group-hover:text-amber-200' : 'text-cyan-300 group-hover:text-cyan-200'} font-medium mb-2 text-base`}>JTracking</div>
                <div className="text-xs text-gray-400 group-hover:text-gray-300">Fleet management solution</div>
                <div className="absolute bottom-3 right-3">
                   {/* 根据主题设置箭头颜色 */}
                  <ArrowRightOutlined className={`${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400/50 group-hover:text-amber-300' : 'text-cyan-400/50 group-hover:text-cyan-300'} transition-all`} />
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
            {/* ... (聊天面板内容保持不变) ... */}
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
                    placeholder="Enter your product URL (e.g., example.com)"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={loading || isMessageSending || inputDisabledDueToUrlGet}
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
                      if (userInput.trim() && !inputDisabledDueToUrlGet) {
                        handleUserInput(e);
                      }
                    }}
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

          {/* 右侧面板 */}
          <div className={`w-[65%] ${
            // 根据主题设置背景和边框
            currentBackground === 'DAY_GHIBLI'
              ? 'bg-amber-900/10 border-amber-700/30'
              : 'bg-slate-900/10 border-blue-700/30' // Night: slate bg, blue border
          } backdrop-blur-lg rounded-2xl border shadow-xl flex flex-col h-full relative`}>
            {/* ... (右侧面板内容保持不变) ... */}
             <div className="border-b border-gray-300/20 p-3">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setRightPanelTab('details')}
                    className={`text-sm ${
                      rightPanelTab === 'details'
                        ? (currentBackground === 'DAY_GHIBLI' ? 'text-amber-400' : 'text-blue-400') + ' font-medium' // Theme-based active color
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Execution Log
                  </button>
                  <button
                    onClick={() => setRightPanelTab('browser')}
                    className={`text-sm ${
                      rightPanelTab === 'browser'
                         ? (currentBackground === 'DAY_GHIBLI' ? 'text-amber-400' : 'text-blue-400') + ' font-medium' // Theme-based active color
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
                                ? (currentBackground === 'DAY_GHIBLI' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300') // Theme-based active tab
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
                                className={`w-4 h-4 text-gray-400 group-hover:${currentBackground === 'DAY_GHIBLI' ? 'text-amber-400' : 'text-blue-400'} transition-colors duration-200`} // Theme-based hover color
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
        }}
        footer={null}
        width={400}
        className="result-ids-modal"
        zIndex={1500}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
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
      
      {/* 通知组件（如果还没有的话） */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-6 h-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            <p className="text-white font-medium">{notification.message}</p>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="ml-4 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>
            </div>
      )}
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
  
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.03); }
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
  
  @keyframes pulse-strong {
    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 15px rgba(253, 224, 71, 0.5); }
    50% { opacity: 1; transform: scale(1.05); box-shadow: 0 0 30px rgba(253, 224, 71, 0.8); }
  }
  
  .animate-pulse-strong {
    animation: pulse-strong 2s ease-in-out infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
  }
  
  @keyframes shimmer-fast {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-shimmer-fast {
    animation: shimmer-fast 1.5s infinite;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
  }
  
  @keyframes bounce-strong {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-bounce-strong {
    animation: bounce-strong 1s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

// 添加样式来强制设置 placeholder 颜色 (保留，因为 Day Ghibli 背景也是浅色)
const placeholderStyle = document.createElement('style');
placeholderStyle.innerHTML = `
  .research-tool-input::placeholder {
    color: #d1d5db !important; /* text-gray-300 */
    opacity: 1 !important; /* 确保不透明度为 1 */
  }

  /* 针对 Ant Design 可能使用的特定选择器 (以防万一) */
  .research-tool-input.ant-input::placeholder {
     color: #d1d5db !important; /* text-gray-300 */
     opacity: 1 !important;
  }
`;
document.head.appendChild(placeholderStyle);

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