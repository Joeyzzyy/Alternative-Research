import React, { useState, useRef } from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

const BrowserSimulator = ({ url, tabs = [], onTabChange }) => {
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
                    ${tab.active
                      ? 'text-white bg-gray-700/30 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/20'
                    }`}
                >
                  <span className="truncate">{tab.title}</span>
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

      {/* URL 栏 */}
      <div className="h-10 flex items-center px-4 border-b border-gray-300/20">
        <div className="w-full bg-gray-700/50 rounded px-3 py-1.5 text-xs text-gray-300 select-all">
          {url || 'https://websitelm.com'}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 bg-white">
        <iframe
          src={url || 'https://websitelm.com'}
          className="w-full h-full"
          title="browser-content"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};

export default BrowserSimulator; 