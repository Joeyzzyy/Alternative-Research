'use client';
import React, { useEffect, useRef } from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

// 添加解析HTML字符串的辅助函数
const parseHtmlContent = (text) => {
  if (!text) return [];
  
  // 对于纯文本，直接返回一个文本节点
  return [{
    type: 'text',
    content: text
  }];
};

const WhyChooseUsWithStory = ({ data, theme = 'normal' }) => {
  const { leftContent, rightContent } = data;
  const containerRef = useRef(null);

  console.log('intro', data);
  const stickyRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const sticky = stickyRef.current;
    
    const handleScroll = () => {
      if (!container || !sticky) return;
      
      const containerRect = container.getBoundingClientRect();
      const stickyRect = sticky.getBoundingClientRect();
      const topOffset = 128;
      
      const containerTop = window.pageYOffset + containerRect.top;
      const containerBottom = containerTop + containerRect.height;
      
      const currentScroll = window.pageYOffset;

      if (currentScroll + topOffset < containerTop) {
        sticky.style.position = 'absolute';
        sticky.style.top = '0';
        sticky.style.bottom = 'auto';
      } else if (currentScroll + topOffset + stickyRect.height > containerBottom) {
        sticky.style.position = 'absolute';
        sticky.style.top = `${containerRect.height - stickyRect.height}px`;
        sticky.style.bottom = 'auto';
      } else {
        sticky.style.position = 'fixed';
        sticky.style.top = `${topOffset}px`;
        sticky.style.bottom = 'auto';
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };

  const getHighlightStyle = () => {
    return themeConfig[theme].text.color.accent;
  };

  const getListItemStyle = () => {
    return themeConfig[theme].text.color.primary;
  };

  const renderContent = (content) => {
    if (typeof content === 'string') {
      return (
        <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color}`}>
          {content}
        </p>
      );
    }

    const parsedContent = parseHtmlContent(content);
    return parsedContent.map((item, index) => {
      switch (item.type) {
        case 'text':
          return (
            <p key={index} className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} mb-4`}>
              {item.content}
            </p>
          );
        case 'list':
          return (
            <ul key={index} className="space-y-2 mb-4">
              {item.items.map((listItem, i) => (
                <li key={i} className={getListItemStyle()}>
                  <svg className="w-5 h-5 mt-0.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{listItem}</span>
                </li>
              ))}
            </ul>
          );
        case 'highlight':
          return (
            <span key={index} className={getHighlightStyle()}>
              {item.content}
            </span>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className={`
      ${themeConfig[theme].section.background.primary}
      ${themeConfig[theme].section.padding.base}
    `}>
      <div className="max-w-6xl mx-auto px-4">
        {data.title && (
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${themeConfig[theme].typography.h2.color}`}>
              {data.title}
            </h2>
            {data.description && (
              <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} max-w-3xl mx-auto`}>
                {data.description}
              </p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-[350px_1fr] gap-20" ref={containerRef}>
          <div className="relative w-[350px]">
            <div ref={stickyRef} className="sticky top-128 inline-block" style={{ width: '350px' }}>
              <div className="bg-gray-50 p-8 rounded-lg">
                <div className="text-center mb-6">
                  {leftContent.avatarUrl && (
                    <Image 
                      src={leftContent.avatarUrl}
                      alt={leftContent.avatarAlt || ''}
                      width={128}
                      height={128}
                      className="rounded-full mx-auto mb-4 object-cover"
                    />
                  )}
                  <h3 className="text-xl font-bold mb-2">{leftContent.name}</h3>
                  <p className="text-gray-600 text-sm">{leftContent.title}</p>
                </div>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line whitespace-pre-line">
                  {leftContent.introduction}
                </div>
              </div>
            </div>
          </div>

          <div>
            <main className="main-content">
              <article className="article max-w-[800px] pr-4">
                {rightContent.map((content, index) => (
                  <div key={index} className="mb-10 last:mb-0">
                    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">
                      {content.contentTitle}
                    </h3>
                    <div className="text-lg md:text-xl leading-[1.8] text-gray-700 whitespace-pre-line whitespace-pre-line">
                      {content.contentText}
                    </div>
                  </div>
                ))}
              </article>            
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseUsWithStory;