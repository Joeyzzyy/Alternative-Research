'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const CallToAction = ({ data, theme = 'normal' }) => {
  const getBgColor = () => {
    return theme === 'tech' 
      ? themeConfig[theme].section.background.secondary
      : themeConfig[theme].section.background.primary;
  };

  return (
    <div className={`
      relative py-24 overflow-hidden bg-white
    `}>
      {/* 优雅的背景效果 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#f0f7ff_0%,_transparent_70%)]"></div>
      
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
          {data.title}
        </h2>
        
        <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
          {data.subTitle}
        </p>
        
        <a 
          href={data.bottomContent.buttonLink}
          className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-300 inline-block"
        >
          {data.bottomContent.buttonText}
        </a>
      </div>
    </div>
  );
};

export default CallToAction;