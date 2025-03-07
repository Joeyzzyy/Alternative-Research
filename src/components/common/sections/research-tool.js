'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [messages, setMessages] = useState([
    { 
      type: 'system', 
      content: 'Welcome to the SaaS Alternative Research Tool. Enter a product domain to discover alternatives and generate a comprehensive analysis.'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

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

  const handleUserInput = () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const newMessages = [...messages, { type: 'user', content: userInput }];
    setMessages(newMessages);
    
    // Process the input as domain
    const cleanDomain = userInput.replace(/^https?:\/\//, '');
    setDomain(cleanDomain);
    
    // Clear input field
    setUserInput('');
    
    // Validate domain and start analysis
    if (!validateDomain(cleanDomain)) {
      setTimeout(() => {
        setMessages([...newMessages, { 
          type: 'system', 
          content: 'Please enter a valid domain format (e.g., example.com)' 
        }]);
      }, 500);
      return;
    }
    
    // Start analysis process
    startAnalysis(cleanDomain);
  };
  
  const startAnalysis = (cleanDomain) => {
    // Clear previous results
    setWorkflowStage(null);
    
    const fullUrl = formatUrl(cleanDomain);
    
    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);
    
    // Add system thinking message
    setMessages(prev => [...prev, { 
      type: 'system', 
      content: `Starting analysis for ${cleanDomain}...`,
      isThinking: true
    }]);
    
    // Start the workflow simulation
    simulateWorkflow(fullUrl);
  };
  
  // 模拟整个工作流程
  const simulateWorkflow = (url) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    // 第一阶段：收集站点信息
    setTimeout(() => {
      setWorkflowProgress(10);
      setWorkflowStage('analyzing');
      
      setMessages(prev => [...prev.slice(0, -1), { 
        type: 'system', 
        content: `Collecting information from ${cleanDomain}...
        
Crawling homepage and product pages...
Extracting metadata and keywords...
Identifying product category...`,
        isThinking: true
      }]);
      
      // 第二阶段：分析关键词
      setTimeout(() => {
        setWorkflowProgress(20);
        setWorkflowStage('searching');
        
        setMessages(prev => [...prev.slice(0, -1), { 
          type: 'system', 
          content: `Analyzing ${cleanDomain}...
          
Product category identified: Customer Support Software
Target audience: B2B, SaaS companies, e-commerce
Core features: live chat, ticketing, knowledge base, automation
Price range: $15-$99/month/user

Now searching for alternatives...`,
          isThinking: true
        }]);
        
        // 第三阶段：搜索竞品
        let progress = 20;
        const searchInterval = setInterval(() => {
          progress += 2;
          setWorkflowProgress(progress);
          
          if (progress % 10 === 0) {
            setMessages(prev => [...prev.slice(0, -1), { 
              type: 'system', 
              content: `Searching for alternatives...
              
Scanned ${Math.min(Math.floor(progress - 20), 48)} of 48 websites
Analyzed content from ${Math.min(Math.floor((progress - 20) * 0.7), 32)} websites
Found ${Math.min(Math.floor((progress - 40) / 2) + 1, 12)} potential alternatives so far`,
              isThinking: true
            }]);
          }
          
          if (progress >= 60) {
            clearInterval(searchInterval);
            
            setWorkflowStage('comparing');
            
            setMessages(prev => [...prev.slice(0, -1), { 
              type: 'system', 
              content: `Found ${Math.min(Math.floor((progress - 40) / 2) + 1, 12)} potential alternatives for ${cleanDomain}.
              
Now performing detailed comparison with each alternative...`,
              isThinking: true
            }]);
            
            // 第四阶段：1v1对比
            let comparisonIndex = 0;
            const comparisonResults = [];
            
            const comparisonInterval = setInterval(() => {
              if (comparisonIndex < Math.min(Math.floor((progress - 40) / 2) + 1, 12)) {
                const newResult = {
                  ...comparisonResults[comparisonIndex],
                  comparisonScore: Math.floor(Math.random() * 40) + 60,
                  strengths: generateRandomStrengths(),
                  weaknesses: generateRandomWeaknesses()
                };
                
                comparisonResults.push(newResult);
                setWorkflowProgress(60 + (comparisonIndex / Math.min(Math.floor((progress - 40) / 2) + 1, 12)) * 40);
                
                setMessages(prev => [...prev.slice(0, -1), { 
                  type: 'system', 
                  content: `Comparing alternatives: ${comparisonIndex + 1} of ${Math.min(Math.floor((progress - 40) / 2) + 1, 12)} completed
                  
Currently analyzing: ${comparisonResults[comparisonIndex].name} (${comparisonResults[comparisonIndex].domain})
• Crawling website and product pages
• Extracting feature list
• Analyzing pricing structure
• Collecting user reviews
• Comparing with ${cleanDomain}
• Generating strengths and weaknesses analysis

Overall progress: ${Math.round(60 + (comparisonIndex / Math.min(Math.floor((progress - 40) / 2) + 1, 12)) * 40)}%`,
                  isThinking: true
                }]);
              } else {
                clearInterval(comparisonInterval);
                setWorkflowStage('completed');
                setLoading(false);
                
                setMessages(prev => [...prev.slice(0, -1), { 
                  type: 'system', 
                  content: `Analysis completed successfully!
                  
I've analyzed ${comparisonResults.length} alternatives for ${cleanDomain}:
${comparisonResults.map(r => `• ${r.name} (${r.comparisonScore}% match)`).join('\n')}

The results are displayed on the right panel. You can view detailed information about each alternative, including features, strengths, weaknesses, and pricing.`,
                  isThinking: false
                }]);
              }
            }, 1500);
          }
        }, 300);
      }, 2000);
    }, 1500);
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
    return (
      <div 
        key={index} 
        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-2' : 'mr-2'}`}>
            <Avatar 
              size="small"
              icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />} 
              className={message.type === 'user' ? 'bg-indigo-500' : 'bg-purple-600'}
            />
          </div>
          <div 
            className={`p-2 rounded-lg text-xs ${
              message.type === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white/10 backdrop-blur-sm text-purple-100 rounded-tl-none'
            } ${message.isThinking ? 'border border-purple-400/30 animate-pulse' : ''}`}
          >
            {message.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < message.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
            {message.isThinking && (
              <div className="flex space-x-1 mt-1.5 justify-center">
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // 新增 agents 数据
  const agents = [
    {
      id: 1,
      name: 'Atlas',
      avatar: '🦊',  // 可以替换为实际的图片路径
      role: 'Research Specialist',
      description: 'Specialized in comprehensive competitor research and market analysis. I help identify and analyze alternative products in your market space.'
    },
    {
      id: 2,
      name: 'Nova',
      avatar: '🦉',  // 可以替换为实际的图片路径
      role: 'Detail Analyst',
      description: 'Focus on deep-diving into competitor features, pricing strategies, and unique selling propositions. I provide detailed comparative analysis.'
    },
    {
      id: 3,
      name: 'Sage',
      avatar: '🐢',  // 可以替换为实际的图片路径
      role: 'Verification Expert',
      description: 'Responsible for fact-checking and verifying information accuracy. I ensure all analyses are based on reliable and up-to-date data.'
    }
  ];

  // 示例 details 数据 - 重构为处理过程
  const detailsData = [
    {
      id: 1,
      agentName: 'Atlas',
      agentAvatar: '🦊',
      step: 'Initial Research',
      status: 'Completed',
      timestamp: '2024-03-20 14:23',
      description: 'Analyzing main product features and market positioning'
    },
    {
      id: 2,
      agentName: 'Nova',
      agentAvatar: '🦉',
      step: 'Competitor Analysis',
      status: 'In Progress',
      timestamp: '2024-03-20 14:25',
      description: 'Deep diving into competitor pricing strategies and feature sets'
    },
    {
      id: 3,
      agentName: 'Sage',
      agentAvatar: '🐢',
      step: 'Data Verification',
      status: 'Queued',
      timestamp: '2024-03-20 14:26',
      description: 'Waiting to verify gathered information and sources'
    }
  ];

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
            <div className="text-2xl">{agent.avatar}</div>
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

  return (
    <div className="w-full pt-24 min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pt-24">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
        {/* 左侧对话栏 */}
        <div className={`${showBrowser ? 'w-1/5' : 'w-4/5'} transition-all duration-300 ease-in-out 
                         bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl flex flex-col h-full`}>
          <div className="h-10 px-4 border-b border-purple-300/20 flex items-center flex-shrink-0">
            <RobotOutlined className="text-purple-300 mr-1.5 text-sm" />
            <h2 className="text-sm font-semibold text-purple-100">Copilot</h2>
          </div>
          
          <div className="flex-grow overflow-y-auto" style={{ height: "calc(100% - 140px)" }}>
            <div className="p-4 pb-6">
              {messages.map((message, index) => renderChatMessage(message, index))}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          <div className="p-3 border-t border-purple-300/20 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter a product domain (e.g., zendesk.com)"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onPressEnter={handleUserInput}
                disabled={loading}
                className="bg-white/10 border border-purple-300/30 rounded-lg text-xs placeholder:text-purple-300/70"
                style={{ color: 'white' }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined className="text-xs" />} 
                onClick={handleUserInput}
                loading={loading}
                disabled={loading}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 border-none"
                size="small"
              />
            </div>
            <div className="text-xs text-purple-300 mt-1.5">
              Enter a product domain to discover alternatives and generate a comprehensive analysis
            </div>
          </div>
        </div>
        
        {/* 中间浏览器区域 */}
        {showBrowser && (
          <div className="w-3/5 bg-gray-800 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl flex flex-col h-full">
            <div className="h-10 flex items-center px-4 border-b border-purple-300/20">
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
        <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl 
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
          <div className="flex border-b border-purple-300/20">
            <button
              onClick={() => setRightPanelTab('agents')}
              className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                ${rightPanelTab === 'agents'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
                }`}
            >
              Agents
            </button>
            <button
              onClick={() => setRightPanelTab('details')}
              className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                ${rightPanelTab === 'details'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setRightPanelTab('sources')}
              className={`flex-1 h-10 flex items-center justify-center text-xs font-medium transition-colors
                ${rightPanelTab === 'sources'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
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