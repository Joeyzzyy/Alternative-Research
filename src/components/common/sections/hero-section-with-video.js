'use client';
import React, { useState, useRef } from 'react';
import themeConfig from '../../../styles/themeConfig';

const HeroSectionWithVideo = ({ data, theme = 'normal', buttonLink = '#' }) => {
  const videoRef = useRef(null);
  const topContent = data.topContent;
  const currentTheme = themeConfig[theme];

  // 组件加载时设置音量和处理视频加载
  React.useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      video.muted = true; // 初始设置为静音以支持自动播放
      video.volume = 0.3;
      
      // 处理视频加载完成事件
      video.addEventListener('loadeddata', () => {
        video.play().catch(error => {
          console.log('Failed to play video:', error);
        });
      });
    }
  }, []);

  return (
    <div className={`relative w-full ${currentTheme.section.background.primary}`}>
      <div className="w-[95%] mx-auto relative">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            src={topContent.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            controls // 添加控制条便于调试
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <h1 className="text-white mb-4 text-4xl font-bold">
              {topContent.title}
            </h1>
            <p className="text-white mb-6 max-w-2xl whitespace-pre-line">
              {topContent.description}
            </p>
            <a 
              href={topContent.buttonLink?.startsWith('http') 
                ? topContent.buttonLink 
                : `https://${topContent.buttonLink}` || buttonLink}
              className={`${currentTheme.button.base} ${currentTheme.button.variants.primary}`}
            >
              {topContent.buttonText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSectionWithVideo;
