'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined, InfoCircleOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflowStage, setWorkflowStage] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [competitors, setCompetitors] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  
  const inputRef = useRef(null);

  // 验证域名格式
  const validateDomain = (domain) => {
    // 简单验证域名格式 (xx.xx)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  const handleSearch = () => {
    if (!domain) {
      message.warning('Please enter a product domain');
      return;
    }
    
    // 清除之前的结果
    setWorkflowStage(null);
    setCompetitors([]);
    setComparisonResults([]);
    
    // 构建完整URL并验证
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    
    if (!validateDomain(cleanDomain)) {
      message.error('Please enter a valid domain format (e.g., example.com)');
      return;
    }
    
    const fullUrl = formatUrl(cleanDomain);
    
    setLoading(true);
    setWorkflowStage('collecting');
    setWorkflowProgress(0);
    
    // 模拟工作流程
    simulateWorkflow(fullUrl);
  };
  
  // 模拟整个工作流程
  const simulateWorkflow = (url) => {
    // 第一阶段：收集站点信息
    setTimeout(() => {
      setWorkflowProgress(10);
      setWorkflowStage('analyzing');
      
      // 第二阶段：分析关键词
      setTimeout(() => {
        setWorkflowProgress(20);
        setWorkflowStage('searching');
        
        // 第三阶段：搜索竞品
        let progress = 20;
        const searchInterval = setInterval(() => {
          progress += 2;
          setWorkflowProgress(progress);
          
          if (progress >= 60) {
            clearInterval(searchInterval);
            
            // 生成假的竞品数据
            const fakeCompetitors = generateFakeCompetitors();
            setCompetitors(fakeCompetitors);
            setWorkflowStage('comparing');
            
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
              } else {
                clearInterval(comparisonInterval);
                setWorkflowStage('completed');
                setLoading(false);
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

  // 渲染工作流程状态
  const renderWorkflowStatus = () => {
    if (!workflowStage) return null;
    
    const stages = {
      collecting: {
        title: 'Collecting Site Information',
        description: `Crawling ${domain} to gather product information...`
      },
      analyzing: {
        title: 'Analyzing Content',
        description: 'Extracting keywords and identifying product category...'
      },
      searching: {
        title: 'Searching for Alternatives',
        description: 'Scanning 48 potential competitors across the web...'
      },
      comparing: {
        title: 'Comparing Alternatives',
        description: 'Performing 1-on-1 comparisons with identified competitors...'
      },
      completed: {
        title: 'Analysis Complete',
        description: 'Alternative page preview is ready! Scroll down to view the results.'
      }
    };
    
    return (
      <div className="mt-8 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-purple-300/20">
        <h3 className="text-xl font-semibold text-purple-100 mb-2">{stages[workflowStage].title}</h3>
        <p className="text-purple-200 mb-4">{stages[workflowStage].description}</p>
        
        <div className="w-full bg-white/10 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${workflowProgress}%` }}
          ></div>
        </div>
        
        <div className="text-right text-purple-300 text-sm">{Math.round(workflowProgress)}% Complete</div>
        
        {workflowStage === 'searching' && workflowProgress >= 40 && (
          <div className="mt-4">
            <p className="text-green-300 font-medium">Found {Math.min(Math.floor((workflowProgress - 40) / 2) + 1, 12)} potential alternatives so far...</p>
            <p className="text-purple-200 text-sm mt-2">
              Scanned {Math.min(Math.floor(workflowProgress - 20), 48)} of 48 websites
              <br />
              Analyzed content from {Math.min(Math.floor((workflowProgress - 20) * 0.7), 32)} websites
              <br />
              Filtered {Math.min(Math.floor((workflowProgress - 40) / 2) + 1, 12)} relevant competitors
            </p>
          </div>
        )}
        
        {workflowStage === 'completed' && (
          <div className="mt-4">
            <p className="text-green-300 font-medium">Alternative page preview has been generated successfully!</p>
            <Button 
              type="primary" 
              size="middle"
              icon={<ArrowRightOutlined />} 
              className="mt-3 bg-gradient-to-r from-green-500 to-teal-500 border-none"
              onClick={() => {
                // 滚动到结果部分
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: 'smooth'
                });
              }}
            >
              View Alternative Page Preview
            </Button>
          </div>
        )}
        
        {workflowStage === 'comparing' && competitors.length > 0 && (
          <div className="mt-4">
            <p className="text-indigo-300 font-medium mb-2">Identified {competitors.length} alternatives for detailed comparison:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {competitors.map((competitor, index) => (
                <Tag key={index} color={index < comparisonResults.length ? "success" : "processing"}>
                  {competitor.name}
                </Tag>
              ))}
            </div>
            
            {comparisonResults.length > 0 && comparisonResults.length <= competitors.length && (
              <div className="bg-white/5 p-3 rounded-lg mb-4 border border-indigo-300/20">
                <p className="text-indigo-200 font-medium">
                  Currently analyzing: <span className="text-white">{competitors[comparisonResults.length - 1].name}</span>
                </p>
                <div className="text-purple-200 text-sm mt-2">
                  <p>• Crawling homepage and product pages</p>
                  <p>• Extracting feature list from {competitors[comparisonResults.length - 1].domain}/features</p>
                  <p>• Analyzing pricing structure from {competitors[comparisonResults.length - 1].domain}/pricing</p>
                  <p>• Collecting user reviews from G2, Capterra, and TrustPilot</p>
                  <p>• Comparing feature set with {domain.replace(/^https?:\/\//, '')}</p>
                  <p>• Generating strengths and weaknesses analysis</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (workflowProgress - 60) * 2.5)}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {comparisonResults.length > 0 && (
              <div className="mt-3">
                <p className="text-green-300 text-sm font-medium mb-2">Completed analyses:</p>
                <div className="grid grid-cols-2 gap-2">
                  {comparisonResults.slice(0, -1).map((result, index) => (
                    <div key={index} className="bg-green-900/20 p-2 rounded border border-green-500/20 text-xs">
                      <p className="text-white font-medium">{result.name}</p>
                      <p className="text-green-200">Match score: {result.comparisonScore}%</p>
                      <p className="text-green-200">Key features: {result.features.slice(0, 2).join(', ')}{result.features.length > 2 ? '...' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-purple-200 text-sm mt-3">
              Scanned 48 websites • Analyzed 32 websites • Selected 12 competitors
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // 渲染竞品对比结果
  const renderComparisonResults = () => {
    if (comparisonResults.length === 0) return null;
    
    return (
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-purple-100 mb-6">Alternative Products Analysis Results</h3>
        
        {/* 保留分析过程摘要 */}
        <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-purple-300/20 mb-6">
          <h4 className="text-lg font-semibold text-purple-100 mb-3">Analysis Process Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-indigo-900/30 p-3 rounded border border-indigo-300/20">
              <p className="text-indigo-200 font-medium mb-2">Site Information</p>
              <p className="text-purple-200 text-sm">• Analyzed {domain.replace(/^https?:\/\//, '')}</p>
              <p className="text-purple-200 text-sm">• Extracted product category and keywords</p>
              <p className="text-purple-200 text-sm">• Identified target audience and use cases</p>
            </div>
            <div className="bg-indigo-900/30 p-3 rounded border border-indigo-300/20">
              <p className="text-indigo-200 font-medium mb-2">Competitor Research</p>
              <p className="text-purple-200 text-sm">• Scanned 48 potential competitors</p>
              <p className="text-purple-200 text-sm">• Analyzed content from 32 websites</p>
              <p className="text-purple-200 text-sm">• Selected {comparisonResults.length} relevant alternatives</p>
            </div>
          </div>
          
          <h4 className="text-lg font-semibold text-purple-100 mb-3">Analyzed Competitors</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {comparisonResults.map((result, index) => (
              <Tag key={index} color="success">
                {result.name} ({result.comparisonScore}% match)
              </Tag>
            ))}
          </div>
          
          <div className="bg-green-900/20 p-3 rounded border border-green-500/20 mt-4">
            <p className="text-green-300 font-medium">Analysis completed successfully</p>
            <p className="text-purple-200 text-sm mt-1">
              The following alternatives have been analyzed and compared to {domain.replace(/^https?:\/\//, '')}. 
              Each competitor has been evaluated based on features, pricing, and market position.
            </p>
          </div>
        </div>
        
        {/* 竞品卡片展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <Tag key={i} color="blue">{feature}</Tag>
                    ))}
                    {result.features.length > 3 && (
                      <Tooltip title={result.features.slice(3).join(', ')}>
                        <Tag color="processing">+{result.features.length - 3} more</Tag>
                      </Tooltip>
                    )}
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-purple-300 mb-1">Strengths</div>
                  <div className="flex flex-wrap gap-1 min-h-[60px]">
                    {result.strengths.map((strength, i) => (
                      <Tag key={i} color="green">{strength}</Tag>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-purple-300 mb-1">Weaknesses</div>
                  <div className="flex flex-wrap gap-1 min-h-[40px]">
                    {result.weaknesses.map((weakness, i) => (
                      <Tag key={i} color="orange">{weakness}</Tag>
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
    <div className="w-full min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="text-center relative z-10 max-w-6xl w-full">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-purple-100 to-indigo-200 animate-gradient">
          The Best SaaS Alternative Research Tool
        </h1>
        <p className="text-purple-100 text-xl mb-8 leading-relaxed">
          A powerful space ready for your next-generation solution
        </p>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 mx-auto rounded-full mb-8"></div>
        
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-purple-300/20 shadow-xl">
          <p className="text-purple-100 mb-6">
            Enter your product domain to discover alternatives, analyze competitors, and generate a comprehensive alternative page
          </p>
          
          <div className="flex items-center space-x-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center bg-white/5 border border-purple-300/30 rounded-lg overflow-hidden">
              <span className="text-purple-300 px-3 border-r border-purple-300/30">https://</span>
              <Input
                ref={inputRef}
                placeholder="yourproduct.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                size="large"
                variant="borderless"
                className="bg-transparent text-white flex-1"
                onPressEnter={handleSearch}
              />
            </div>
            <Button 
              type="primary" 
              size="large" 
              icon={<ArrowRightOutlined />} 
              onClick={handleSearch}
              loading={loading}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 border-none hover:from-purple-600 hover:to-indigo-600"
            >
              Getting Alternative Page
            </Button>
          </div>
          
          {loading && renderWorkflowStatus()}
          {!loading && comparisonResults.length > 0 && renderComparisonResults()}
        </div>
      </div>
    </div>
  );
};

export default ResearchTool; 