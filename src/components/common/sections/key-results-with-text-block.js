'use client';
import React, { useEffect, useRef, useState } from 'react';
import themeConfig from '../../../styles/themeConfig';

// 修改提取标题的函数，处理被 strong 标签包裹的情况
const extractContentTitle = (contentText) => {
  if (!contentText) return [];
  
  // 先将各种形式的 content-subtitle 转换为 h2
  let convertedContent = contentText
    // 处理普通的 content-subtitle
    .replace(
      /<p><span class="content-subtitle">(.*?)<\/span><\/p>/g, 
      '<h2>$1</h2>'
    )
    // 处理被 strong 包裹的 content-subtitle
    .replace(
      /<p>\s*<strong>\s*<span class="content-subtitle">(.*?)<\/span>\s*<\/strong>\s*<\/p>/g,
      '<h2>$1</h2>'
    );
  
  const subtitleRegex = /<h2[^>]*>(.*?)<\/h2>/g;
  const titles = [];
  let match;
  
  while ((match = subtitleRegex.exec(convertedContent)) !== null) {
    // 移除可能存在的HTML标签
    const cleanTitle = match[1].replace(/<\/?[^>]+(>|$)/g, '');
    if (cleanTitle.trim()) {
      titles.push(cleanTitle.trim());
    }
  }
  
  return titles;
};

// 修改 parseHtmlContent 函数以支持链接标签
const parseContent = (content) => {
  if (!content) return [];
  
  // 更新转换逻辑，处理被 strong 包裹的情况
  content = content
    .replace(
      /<p><span class="content-subtitle">(.*?)<\/span><\/p>/g, 
      '<h2>$1</h2>'
    )
    .replace(
      /<p>\s*<strong>\s*<span class="content-subtitle">(.*?)<\/span>\s*<\/strong>\s*<\/p>/g,
      '<h2>$1</h2>'
    );
  
  const cleanContent = content.replace(/\r\n/g, '\n');
  
  const result = [];
  let currentIndex = 0;
  let isFirstParagraph = true;
  
  const tagRegex = /<(\/?)(\w+)(?:\s+[^>]*)?>/g;
  let match;
  let stack = [];
  
  while ((match = tagRegex.exec(cleanContent)) !== null) {
    const [fullMatch, isClosing, tagName] = match;
    
    if (match.index > currentIndex) {
      const text = cleanContent.slice(currentIndex, match.index);
      if (text.trim()) {
        result.push({
          type: 'text',
          content: text.trim()
        });
      }
    }
    
    const tag = tagName.toLowerCase();
    if (!isClosing) {
      switch (tag) {
        case 'p':
          // 检查是否是空段落（即紧跟着就是结束标签）
          const nextMatch = cleanContent.slice(match.index + fullMatch.length).match(/^\s*<\/p>/);
          if (nextMatch) {
            console.log('Empty paragraph content:', '\n'.split('').map(c => c.charCodeAt(0))); // 这会显示换行符的 ASCII 码
            result.push({
              type: 'text',
              content: '\n\n'
            });
            currentIndex = match.index + fullMatch.length + nextMatch[0].length;
            continue;
          }
          
          if (!isFirstParagraph) {
            result.push({
              type: 'text',
              content: ''
            });
          }
          isFirstParagraph = false;
          stack.push({
            type: 'p',
            startIndex: result.length
          });
          break;
          
        case 'h2':
          stack.push({
            type: 'h2',
            startIndex: result.length
          });
          break;
          
        case 'br':
          result.push({
            type: 'text',
            content: '\n'
          });
          break;
          
        case 'img':
          const src = fullMatch.match(/src="([^"]*)"/)?.[1] || '';
          const alt = fullMatch.match(/alt="([^"]*)"/)?.[1] || '';
          result.push({
            type: 'image',
            src,
            alt
          });
          break;
          
        case 'span':
          const classMatch = fullMatch.match(/class="([^"]*)"/);
          const className = classMatch ? classMatch[1] : '';
          if (className === 'content-subtitle') {
            // 子标题前添加额外的换行
            if (!isFirstParagraph) {
              result.push({
                type: 'text',
                content: '\n'
              });
            }
          }
          stack.push({
            type: 'span',
            className,
            startIndex: result.length
          });
          break;
          
        case 'video':
          const videoSrc = fullMatch.match(/src="([^"]*)"/)?.[1] || '';
          result.push({
            type: 'video',
            src: videoSrc,
            controls: true,
            preload: 'metadata'
          });
          break;
          
        case 'a':
          stack.push({
            type: 'link',
            href: fullMatch.match(/href="([^"]*)"/)?.[1] || '',
            startIndex: result.length
          });
          break;
          
        case 'strong':
        case 'b':
          stack.push({
            type: 'bold',
            startIndex: result.length
          });
          break;
          
        case 'i':
          stack.push({
            type: 'italic',
            startIndex: result.length
          });
          break;
        
        case 'ul':
        case 'ol':
          stack.push({
            type: 'list',
            startIndex: result.length
          });
          break;
          
        case 'li':
          break;
          
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result.push({
            type: 'text',
            content: '\n\n'
          });
          stack.push({
            type: 'heading',
            level: parseInt(tag[1]),
            startIndex: result.length
          });
          break;
      }
    } else {
      const openTag = stack.pop();
      if (openTag) {
        const content = result.slice(openTag.startIndex);
        result.length = openTag.startIndex;
        
        switch (tag) {
          case 'p':
            result.push(...content);
            break;
            
          case 'h2':
            result.push({
              type: 'text',
              content: content.map(item => item.content).join(''),
              className: 'content-subtitle'
            });
            break;
            
          case 'span':
            const textContent = content.map(item => item.content).join('');
            result.push({
              type: 'text',
              content: textContent,
              className: openTag.className
            });
            break;
            
          case 'a':
            result.push({
              type: 'link',
              href: openTag.href,
              content: content.map(item => item.content).join('')
            });
            break;
            
          case 'strong':
          case 'b':
            result.push({
              type: 'bold',
              nested: content.length > 1,
              children: content,
              content: content.map(item => item.content).join('')
            });
            break;
            
          case 'i':
            result.push({
              type: 'italic',
              nested: content.length > 1,
              children: content,
              content: content.map(item => item.content).join('')
            });
            break;
          
          case 'ul':
          case 'ol':
            result.push({
              type: 'text',
              content: '\n'
            });
            break;
          
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            result.push({
              type: 'text',
              content: '\n\n'
            });
            break;
          
          case 'li':
            result.push(...content);
            break;
        }
      }
    }
    
    currentIndex = match.index + fullMatch.length;
  }
  
  // 处理剩余文本
  if (currentIndex < cleanContent.length) {
    const remainingText = cleanContent.slice(currentIndex).trim();
    if (remainingText) {
      result.push({
        type: 'text',
        content: remainingText
      });
    }
  }
  
  return result;
};

const KeyResultsWithTextBlock = ({ data, theme = 'normal' }) => {
  const { rightContent } = data;
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };

  const getBlockStyle = () => {
    return theme === 'tech'
      ? `${themeConfig[theme].card.variants.primary}`
      : `${themeConfig[theme].card.variants.primary}`;
  };

  const getHighlightStyle = () => {
    return themeConfig[theme].text.color.accent;
  };

  const getListItemStyle = () => {
    return themeConfig[theme].text.color.primary;
  };

  const ImageModal = ({ src, alt, onClose }) => {
    if (!src) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="relative max-w-[90vw] max-h-[90vh]">
          <button
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  // 修改 renderContent 函数以支持链接渲染
  const renderContent = (content) => {
    let sectionIndex = -1;  // 用于追踪标题序号

    return content.map((part, index) => {
      if (part.type === 'text') {
        if (part.className === 'content-subtitle') {
          sectionIndex++;  // 每遇到标题就增加序号
          return (
            <h2 
              key={index}
              id={`section-${sectionIndex}`}  // 添加 id 用于导航
              className="text-xl font-bold text-gray-900 block mb-4"
            >
              {part.content}
            </h2>
          );
        }
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part.content}
          </span>
        );
      }
      switch (part.type) {
        case 'image':
          return (
            <img
              key={`image-${index}`}
              src={part.src}
              alt={part.alt}
              className="max-w-full h-auto my-4 rounded-lg shadow-sm"
              onClick={() => setSelectedImage({ src: part.src, alt: part.alt })}
            />
          );
        
        case 'link':
          return (
            <React.Fragment key={`link-wrapper-${index}`}>
              {' '}
              <a
                href={part.href}
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {part.content}
              </a>
              {' '}
            </React.Fragment>
          );
        
        case 'video':
          return (
            <div key={`video-${index}`} className="video-container my-4">
              <video
                src={part.src}
                controls={part.controls}
                preload={part.preload}
                className="embedded-video w-full rounded-lg"
              />
            </div>
          );
        
        case 'bold':
          return (
            <React.Fragment key={`bold-wrapper-${index}`}>
              {' '}
              <b key={`bold-${index}`} className="font-bold">
                {part.nested ? 
                  part.children.map((child, childIndex) => renderContent([child])[0]) : 
                  part.content}
              </b>
              {' '}
            </React.Fragment>
          );
        
        case 'italic':
          return (
            <React.Fragment key={`italic-wrapper-${index}`}>
              {' '}
              <i key={`italic-${index}`} className="italic">
                {part.nested ? 
                  part.children.map((child, childIndex) => renderContent([child])[0]) : 
                  part.content}
              </i>
              {' '}
            </React.Fragment>
          );
        
        default:
          return null;
      }
    });
  };

  return (
    <>
      <div className={`${getBgColor()} ${themeConfig[theme].section.padding.base}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-[350px_1fr] gap-20" ref={containerRef}>
            <div className="relative w-[350px]">
              <div ref={stickyRef} className="sticky top-128 inline-block" style={{ width: '350px' }}>
                <div className="bg-white shadow rounded-lg p-8 mb-4 border border-gray-100">
                  <h3 className="text-xl font-bold mb-4 text-gray-800 border-b border-gray-100 pb-4">
                    Table of Contents
                  </h3>
                  <ul className="space-y-2">
                    {extractContentTitle(rightContent).map((title, index) => (
                      <li key={`toc-${index}`}>
                        <button
                          onClick={() => scrollToSection(`section-${index}`)}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 text-sm text-left py-2 px-3 w-full rounded-md transition-all duration-200"
                        >
                          {title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <main className="main-content">
                <article className="article max-w-[800px] pr-4">
                  <div className="text-lg md:text-xl leading-[1.8] text-gray-700 space-y-1">
                    {renderContent(parseContent(rightContent))}
                  </div>
                </article>            
              </main>
            </div>
          </div>
        </div>
      </div>
      <ImageModal
        src={selectedImage?.src}
        alt={selectedImage?.alt}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default KeyResultsWithTextBlock;