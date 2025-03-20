'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const CallToAction = ({ data, theme = 'normal' }) => {
  const getBgColor = () => {
    return 'bg-gradient-to-b from-white via-slate-50/80 to-white';
  };

  return (
    <div className={`
      ${getBgColor()}
      ${themeConfig[theme].section.padding.wide}
      relative overflow-hidden
    `}>
      {/* AI风格的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#818cf820_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#6366f120_0%,_transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.015]"></div>
      
      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
          {data.title}
        </h2>
        
        <p className={`${themeConfig[theme].typography.paragraph.fontSize} text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed`}>
          {data.subTitle}
        </p>
        
        <a 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 text-white font-medium px-8 py-3.5 rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-purple-500/30 transition-all duration-300 inline-block backdrop-blur-sm"
        >
          Get it now
        </a>
      </div>
    </div>
  );
};

export default CallToAction;