'use client';

import React from 'react';
import { Icon } from '@iconify/react';

const ProductBenefitsWithFourBlocks = ({ data }) => {
  console.log('current data', data);
  return (
    <div className="bg-white py-16">
      <div className="w-[85%] mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {data.leftContent.title}
          </h2>
          <p className="text-lg text-gray-600 mb-6 whitespace-pre-line max-w-3xl mx-auto">
            {data.leftContent.description}
          </p>
          <a 
            href={data.leftContent.buttonLink?.startsWith('http') 
            ? data.leftContent.buttonLink 
            : `https://${data.leftContent.buttonLink}` || '#'}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
              text-white font-medium hover:from-blue-700 hover:to-purple-700 
              transition-all duration-300 inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            {data.leftContent.buttonText}
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {data.rightContent.map((module, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-6 border border-gray-200"
            >
              {module.icon && (
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-r 
                  from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                  <Icon 
                    icon={module.icon}
                    width="16"
                    height="16"
                    className="text-gradient-to-r from-blue-600 to-purple-600"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
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