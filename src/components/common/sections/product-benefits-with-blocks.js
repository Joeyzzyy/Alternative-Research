'use client';

import React from 'react';
import { Icon } from '@iconify/react';

const ProductBenefitsWithFourBlocks = ({ data }) => {
  return (
    <div className="bg-white py-24 relative">
      {/* 精致微妙的背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#f0f7ff_0%,_transparent_50%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#f5f0ff_0%,_transparent_50%)] opacity-70"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-gray-900 leading-tight">
            {data.leftContent.title}
          </h2>
          <p className="text-xl text-gray-600 mb-12 whitespace-pre-line max-w-3xl mx-auto leading-relaxed">
            {data.leftContent.description}
          </p>
          <a 
            href={data.leftContent.buttonLink?.startsWith('http') 
              ? data.leftContent.buttonLink 
              : `https://\${data.leftContent.buttonLink}` || '#'}
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-300 inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.leftContent.buttonText}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {data.rightContent.map((module, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-8 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_32px_-12px_rgba(0,0,0,0.15)] 
                transition-all duration-300 flex flex-col group"
            >
              <div className="mb-6">
                {module.icon && (
                  <Icon 
                    icon={module.icon}
                    width="36"
                    height="36"
                    className="text-blue-600 group-hover:text-indigo-600 transition-colors duration-300"
                  />
                )}
                {!module.icon && (
                  <svg className="w-9 h-9 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">
                {module.title}
              </h3>
              <p className="text-base text-gray-600 whitespace-pre-line leading-relaxed flex-grow">
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