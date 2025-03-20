'use client';

import React from 'react';
import { Icon } from '@iconify/react';

const ProductBenefitsWithFourBlocks = ({ data }) => {
  return (
    <div className="bg-gradient-to-b from-white via-slate-50/80 to-white py-24 relative overflow-hidden">
      {/* AI风格的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#818cf820_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#6366f120_0%,_transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.015]"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 leading-tight">
            {data.leftContent.title}
          </h2>
          <p className="text-xl text-gray-600 mb-12 whitespace-pre-line max-w-3xl mx-auto leading-relaxed">
            {data.leftContent.description}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.rightContent.map((module, index) => (
            <div 
              key={index} 
              className="backdrop-blur-sm bg-white/80 rounded-2xl p-8 
                shadow-[0_4px_24px_-12px_rgba(99,102,241,0.1)] 
                hover:shadow-[0_24px_48px_-12px_rgba(99,102,241,0.25)] 
                transition-all duration-500 flex flex-col group
                hover:translate-y-[-4px] hover:bg-gradient-to-b hover:from-white hover:to-slate-50/80
                border border-slate-100 hover:border-slate-200"
            >
              <div className="mb-6 relative">
                {module.icon && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full group-hover:bg-purple-500/20 transition-all duration-500"></div>
                    <Icon 
                      icon={module.icon}
                      width="36"
                      height="36"
                      className="text-indigo-600 group-hover:text-purple-600 transition-colors duration-500 relative"
                    />
                  </div>
                )}
                {!module.icon && (
                  <svg className="w-9 h-9 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4 group-hover:from-purple-600 group-hover:to-indigo-600 transition-all duration-500">
                {module.title}
              </h3>
              <p className="text-base text-gray-600/90 whitespace-pre-line leading-relaxed flex-grow">
                {module.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductBenefitsWithFourBlocks;