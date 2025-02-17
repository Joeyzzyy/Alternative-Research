'use client';

import React from 'react';
import { Icon } from '@iconify/react';

const ProductBenefitsWithATable = ({ data }) => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="w-[85%] mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            {data.topContent.title}
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-4">
            {data.topContent.description}
          </p>
          <a 
            href={data.topContent.buttonLink?.startsWith('http') 
              ? data.topContent.buttonLink 
              : `https://${data.topContent.buttonLink}` || '#'}
            className="px-6 py-3 rounded-full bg-[#3374FF] text-white font-medium
              hover:bg-blue-700 transition-colors duration-300 inline-block"
          >
            {data.topContent.buttonText}
          </a>
        </div>

        {/* Content Section */}
        <div className="flex flex-col md:flex-row gap-16 items-center">
          {/* Left Section - Image */}
          <div className="w-full md:w-1/2">
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <img 
                src={data.leftContent.imageUrl}
                alt={data.leftContent.imageAlt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
          
          {/* Right Section - Table */}
          <div className="w-full md:w-1/2">
            <div className="grid bg-white">
              {data.rightContent.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                    {/* 添加调试信息 */}
                    {console.log('Icon identifier:', item.icon)}
                    <Icon 
                      icon={item.icon}
                      width="24"
                      height="24"
                      className="text-gray-600"
                    />
                  </div>
                  <div className="flex-1 pl-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.contentTitle}
                    </h3>
                    <p className="text-base text-gray-600">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBenefitsWithATable;