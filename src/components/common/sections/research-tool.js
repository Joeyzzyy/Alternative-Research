'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip, Avatar } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined, SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [competitors, setCompetitors] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
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
    setCompetitors([]);
    setComparisonResults([]);
    
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
            
            // 生成假的竞品数据
            const fakeCompetitors = generateFakeCompetitors();
            setCompetitors(fakeCompetitors);
            setWorkflowStage('comparing');
            
            setMessages(prev => [...prev.slice(0, -1), { 
              type: 'system', 
              content: `Found ${fakeCompetitors.length} relevant alternatives for ${cleanDomain}.
              
Now performing detailed comparison with each alternative...`,
              isThinking: true
            }]);
            
            // 第四阶段：1v1对比
            let comparisonIndex = 0;
            const comparisonResults = [];
            
            const comparisonInterval = setInterval(() => {
              if (comparisonIndex < fakeCompetitors.length) {
                const newResult = {
                  ...fakeCompetitors[comparisonIndex],
                  comparisonScore: Math.floor(Math.random() * 40) + 60,
                  strengths: generateRandomStrengths(),
                  weaknesses: generateRandomWeaknesses()
                };
                
                comparisonResults.push(newResult);
                setComparisonResults([...comparisonResults]);
                comparisonIndex++;
                setWorkflowProgress(60 + (comparisonIndex / fakeCompetitors.length) * 40);
                
                setMessages(prev => [...prev.slice(0, -1), { 
                  type: 'system', 
                  content: `Comparing alternatives: ${comparisonIndex} of ${fakeCompetitors.length} completed
                  
Currently analyzing: ${fakeCompetitors[comparisonIndex-1].name} (${fakeCompetitors[comparisonIndex-1].domain})
• Crawling website and product pages
• Extracting feature list
• Analyzing pricing structure
• Collecting user reviews
• Comparing with ${cleanDomain}
• Generating strengths and weaknesses analysis

Overall progress: ${Math.round(60 + (comparisonIndex / fakeCompetitors.length) * 40)}%`,
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
  
  // 生成假的竞品数据
  const generateFakeCompetitors = () => {
    const competitors = [];
    const realCompetitorNames = [
      { name: 'Zendesk', domain: 'zendesk.com' },
      { name: 'Intercom', domain: 'intercom.com' },
      { name: 'Freshdesk', domain: 'freshdesk.com' },
      { name: 'HelpScout', domain: 'helpscout.com' },
      { name: 'Drift', domain: 'drift.com' },
      { name: 'Crisp', domain: 'crisp.chat' },
      { name: 'Olark', domain: 'olark.com' },
      { name: 'LiveChat', domain: 'livechat.com' },
      { name: 'Tidio', domain: 'tidio.com' },
      { name: 'Tawk.to', domain: 'tawk.to' },
      { name: 'HubSpot Service Hub', domain: 'hubspot.com/service' },
      { name: 'Front', domain: 'front.com' }
    ];
    
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    for (let i = 0; i < Math.min(12, realCompetitorNames.length); i++) {
      competitors.push({
        id: i + 1,
        name: realCompetitorNames[i].name,
        domain: realCompetitorNames[i].domain,
        description: `A powerful alternative solution for ${cleanDomain} with unique features and capabilities.`,
        features: generateRandomFeatures(),
        pricing: generateRandomPricing()
      });
    }
    
    return competitors;
  };
  
  // 生成随机功能列表
  const generateRandomFeatures = () => {
    const allFeatures = [
      'Analytics Dashboard', 'User Management', 'API Integration', 
      'Custom Reports', 'Automation', 'Mobile App',
      'Team Collaboration', 'Data Export', 'Third-party Integrations',
      'White Labeling', 'Multi-language Support', 'Advanced Security'
    ];
    
    const shuffled = [...allFeatures].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 5) + 3);
  };
  
  // 生成随机价格
  const generateRandomPricing = () => {
    const plans = ['Free', 'Basic', 'Pro', 'Enterprise'];
    const pricing = {};
    
    plans.forEach(plan => {
      if (Math.random() > 0.3) {
        pricing[plan] = plan === 'Free' ? 
          '$0/month' : 
          `$${Math.floor(Math.random() * 100) + 10}/month`;
      }
    });
    
    return pricing;
  };
  
  // 生成随机优势
  const generateRandomStrengths = () => {
    const allStrengths = [
      'Better UI/UX', 'More affordable', 'Advanced features', 
      'Better customer support', 'More integrations', 'Open API',
      'Better documentation', 'Active community', 'Regular updates'
    ];
    
    const shuffled = [...allStrengths].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 3) + 2);
  };
  
  // 生成随机劣势
  const generateRandomWeaknesses = () => {
    const allWeaknesses = [
      'Limited free plan', 'Steeper learning curve', 'Fewer integrations', 
      'Less customization', 'Newer in market', 'Smaller community',
      'Limited support hours', 'Missing key features', 'Higher enterprise pricing'
    ];
    
    const shuffled = [...allWeaknesses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
  };
  
  // 格式化URL，确保以https://开头
  const formatUrl = (input) => {
    // 移除可能存在的协议前缀
    let cleanDomain = input.trim();
    if (cleanDomain.startsWith('http://')) {
      cleanDomain = cleanDomain.substring(7);
    } else if (cleanDomain.startsWith('https://')) {
      cleanDomain = cleanDomain.substring(8);
    }
    
    // 添加https://前缀
    return `https://${cleanDomain}`;
  };

  // Render chat message
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
  
  // Render comparison results
  const renderComparisonResults = () => {
    if (comparisonResults.length === 0) return null;
    
    return (
      <div id="comparison-results">
        <h3 className="text-2xl font-bold text-purple-100 mb-6">Alternative Products Analysis Results</h3>
        
        {/* Competitor cards display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {comparisonResults.map((result, index) => (
            <Card 
              key={index}
              className="bg-white/10 backdrop-blur-sm border border-purple-300/20 hover:border-purple-300/40 transition-all h-full"
              hoverable
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h4 className="text-xl font-semibold text-white mb-2">{result.name}</h4>
                  <p className="text-purple-200 text-sm">{result.domain}</p>
                </div>
                
                <p className="text-purple-100 mb-4 flex-grow">{result.description}</p>
                
                <div className="mb-4">
                  <div className="text-sm text-purple-300 mb-1 flex items-center">
                    <span>Alternative Match Score</span>
                    <Tooltip title="Higher score indicates better match as an alternative based on features, pricing, and market position">
                      <InfoCircleOutlined className="ml-1" />
                    </Tooltip>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        result.comparisonScore > 80 ? 'bg-green-500' : 
                        result.comparisonScore > 70 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${result.comparisonScore}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-purple-300 text-xs mt-1">{result.comparisonScore}% match</div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-purple-300 mb-1">Key Features</div>
                  <div className="flex flex-wrap gap-1 min-h-[60px]">
                    {result.features.slice(0, 3).map((feature, i) => (
                      <Tag key={i} color="blue" className="h-7 flex items-center">{feature}</Tag>
                    ))}
                    {result.features.length > 3 && (
                      <Tooltip title={result.features.slice(3).join(', ')}>
                        <Tag color="processing" className="h-7 flex items-center">+{result.features.length - 3} more</Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-purple-300 mb-1">Strengths</div>
                  <div className="flex flex-wrap gap-1 min-h-[60px]">
                    {result.strengths.map((strength, i) => (
                      <Tag key={i} color="green" className="h-7 flex items-center">{strength}</Tag>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-purple-300 mb-1">Weaknesses</div>
                  <div className="flex flex-wrap gap-1 min-h-[40px]">
                    {result.weaknesses.map((weakness, i) => (
                      <Tag key={i} color="orange" className="h-7 flex items-center">{weakness}</Tag>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-purple-300/20">
                  <Button type="primary" size="small" className="bg-indigo-600 border-none">
                    View Comparison
                  </Button>
                  <div className="text-purple-300 text-sm">
                    {Object.keys(result.pricing).length > 0 ? 
                      `From ${Object.values(result.pricing)[0]}` : 
                      'Pricing unavailable'}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pt-24 min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pt-24">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 w-full flex flex-row gap-6 h-[calc(100vh-140px)] px-4 text-sm">
        {/* 左侧对话栏 */}
        <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl flex flex-col h-full">
          <div className="p-2 border-b border-purple-300/20 flex items-center flex-shrink-0">
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
        
        {/* 中间 Chrome 浏览器模拟区 */}
        <div className="w-[60%] bg-gray-800 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl flex flex-col h-full text-xs">
          {/* 控制按钮区 */}
          <div className="h-8 flex items-center px-4 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          
          {/* 标签页区域 */}
          <div className="flex items-center px-2 border-b border-gray-700">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 h-9 text-sm cursor-pointer
                  border-t border-x rounded-t-md transition-colors
                  ${tab.active 
                    ? 'bg-white text-gray-800 border-gray-300' 
                    : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }
                  mx-1
                `}
              >
                <span className="truncate">{tab.title}</span>
              </div>
            ))}
          </div>
          
          {/* 地址栏 */}
          <div className="flex items-center h-10 px-4 py-1">
            <div className="flex-1 bg-gray-700 rounded-md h-8 flex items-center px-3">
              <span className="text-gray-400 text-sm truncate">
                {activeTab?.url || 'about:blank'}
              </span>
            </div>
          </div>
          
          {/* iframe 内容区 */}
          <div className="flex-1 bg-white">
            <iframe
              key={activeTab?.id} // 添加 key 以确保切换时重新加载
              src={activeTab?.url}
              className="w-full h-full border-none"
              title={`Tab ${activeTab?.id}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        {/* 右侧分析结果栏 */}
        <div className="w-1/5 bg-white/5 backdrop-blur-lg rounded-2xl border border-purple-300/20 shadow-xl flex flex-col h-full">
          {/* Tab 切换区域 */}
          <div className="flex border-b border-purple-300/20">
            <button
              onClick={() => setRightPanelTab('agents')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
                ${rightPanelTab === 'agents'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
                }`}
            >
              Agents
            </button>
            <button
              onClick={() => setRightPanelTab('details')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
                ${rightPanelTab === 'details'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
                }`}
            >
              Details
            </button>
            <button
              onClick={() => setRightPanelTab('sources')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors
                ${rightPanelTab === 'sources'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-purple-300 hover:text-purple-200'
                }`}
            >
              Sources
            </button>
          </div>

          {/* Tab 内容区域 */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'agents' && (
              <div className="p-3">
                {comparisonResults.length > 0 ? (
                  renderComparisonResults()
                ) : (
                  <div className="text-center text-purple-200 mt-8">
                    <p>Page outline will appear here</p>
                  </div>
                )}
              </div>
            )}

            {rightPanelTab === 'details' && (
              <div className="p-3">
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-purple-200 mb-2">Meta Information</h4>
                    <div className="text-xs text-purple-300">
                      <p>Title: Example Page</p>
                      <p>Description: Page description here</p>
                      <p>Keywords: example, page, keywords</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-purple-200 mb-2">Content Analysis</h4>
                    <div className="text-xs text-purple-300">
                      <p>Word count: 1,234</p>
                      <p>Reading time: 5 mins</p>
                      <p>Last updated: 2024-03-20</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightPanelTab === 'sources' && (
              <div className="p-3">
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-purple-200 mb-2">External Links</h4>
                    <div className="text-xs text-purple-300">
                      <p className="mb-2">• example.com/reference1</p>
                      <p className="mb-2">• example.com/reference2</p>
                      <p className="mb-2">• example.com/reference3</p>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-purple-200 mb-2">Citations</h4>
                    <div className="text-xs text-purple-300">
                      <p className="mb-2">1. Citation example one</p>
                      <p className="mb-2">2. Citation example two</p>
                      <p className="mb-2">3. Citation example three</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchTool; 