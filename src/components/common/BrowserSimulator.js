import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const BrowserSimulator = ({ tabs = [], activeTab, onTabChange }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const tabsContainerRef = useRef(null);

  const scrollTabs = (direction) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 200; // 每次滚动的像素数
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    setScrollPosition(newPosition);
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = tabsContainerRef.current 
    ? scrollPosition < tabsContainerRef.current.scrollWidth - tabsContainerRef.current.clientWidth
    : false;

  // 获取当前激活标签的URL
  const activeUrl = tabs.find(t => t.id === activeTab)?.url || 'https://websitelm.com';

  return (
    <div className="h-full flex flex-col">
      {/* 顶栏 - 高度与其他面板保持一致 */}
      <div className="h-10 flex items-center border-b border-gray-300/20">
        {/* 浏览器控制按钮 */}
        <div className="flex items-center space-x-2 px-4 border-r border-gray-300/20">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
        </div>

        {/* Tab 滚动区域 */}
        <div className="w-[1000px] flex items-center">
          {/* 左滚动按钮 */}
          <Button 
            type="text"
            icon={<LeftOutlined className="text-gray-400" />}
            disabled={!canScrollLeft}
            onClick={() => scrollTabs('left')}
            className="w-6 flex-none flex items-center justify-center h-10"
          />

          {/* Tabs 容器 */}
          <div 
            ref={tabsContainerRef}
            className="flex-1 overflow-x-hidden"
          >
            <div className="flex">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`flex items-center px-3 h-10 text-xs cursor-pointer 
                    border-r border-gray-300/20 transition-colors
                    ${activeTab === tab.id
                      ? 'text-white bg-gray-700/30 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                    }`}
                >
                  <span className="truncate">{tab.title}</span>
                  {tab.id === activeTab && (
                    <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 右滚动按钮 */}
          <Button 
            type="text"
            icon={<RightOutlined className="text-gray-400" />}
            disabled={!canScrollRight}
            onClick={() => scrollTabs('right')}
            className="w-6 flex-none flex items-center justify-center h-10"
          />
        </div>
      </div>

      {/* 动态内容区域 */}
      <div className="flex-1 bg-white relative">
        {tabs.length === 0 ? (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center space-y-8 p-8">
            {/* 全屏动画背景 */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 left-1/3 w-[400px] h-[400px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-spin-slow" />
              <div className="absolute top-1/4 -right-20 w-[300px] h-[300px] bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-full blur-2xl animate-spin-slow-delayed" />
            </div>

            {/* 中心内容 */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              {/* 动态图标 */}
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl transform rotate-45 animate-pulse-slow" />
                <svg 
                  className="w-20 h-20 absolute top-6 left-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>

              {/* 文字内容 */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300">
                  Ready for Exploration
                </h2>
                <p className="text-slate-300/90 text-lg leading-relaxed max-w-2xl">
                  Begin your competitive analysis journey with Copilot. <br />
                  Our AI agents will help you discover and craft SEO-optimized alternative pages.
                </p>
              </div>

              {/* 交互按钮 */}
              <button
                onClick={() => window.parent.postMessage('closeBrowser', '*')}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl transition-all 
                         transform hover:scale-105 shadow-xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="flex items-center gap-3 text-lg font-medium text-white">
                  <svg 
                    className="w-6 h-6 animate-bounce-horizontal" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  Start with Copilot
                </span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 当有内容时显示URL地址栏 */}
            <div className="h-10 flex items-center px-4 border-b border-gray-300/20">
              <div className="w-full bg-gray-700/50 rounded px-3 py-1.5 text-xs text-gray-300 select-all">
                {activeUrl}
              </div>
            </div>
            {tabs.map(tab => (
              <iframe
                key={tab.id}
                src={tab.url}
                className={`w-full h-full absolute top-0 left-0 ${
                  activeTab === tab.id ? 'z-10 opacity-100' : 'z-0 opacity-0'
                } transition-opacity duration-300`}
                title={`preview-${tab.id}`}
                sandbox="allow-same-origin allow-scripts"
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowserSimulator; 