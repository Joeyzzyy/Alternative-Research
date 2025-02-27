'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Tag, Tooltip } from 'antd';
import { SearchOutlined, ClearOutlined, ArrowRightOutlined } from '@ant-design/icons';

const ResearchTool = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef(null);

  const handleSearch = () => {
    if (!domain) {
      message.warning('Please enter a product domain');
      return;
    }
    
    // 构建完整URL
    const fullUrl = formatUrl(domain);
    
    setLoading(true);
    // 这里添加API调用逻辑，使用fullUrl
    console.log('Analyzing URL:', fullUrl);
    setTimeout(() => {
      setLoading(false);
      message.success('Analysis completed!');
    }, 2000);
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse delay-1000"></div>
      </div>
      
      <div className="text-center relative z-10 max-w-4xl">
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
          
          {loading && (
            <div className="mt-8 flex flex-col items-center">
              <Spin size="large" />
              <p className="mt-4 text-purple-200">Scanning the digital universe for alternatives...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchTool; 