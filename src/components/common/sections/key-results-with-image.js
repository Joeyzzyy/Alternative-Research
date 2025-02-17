'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

const KeyResultsWithImage = ({ data, theme = 'normal' }) => {
  const dataSet = data?.leftContent || [];
  const image = data?.rightContent || {};
  const title = data?.title;

  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };

  const getNumberColor = () => {
    return themeConfig[theme].text.color.accent;
  };

  return (
    <div className={`
      ${getBgColor()} 
      ${themeConfig[theme].section.padding.base}
    `}>
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {title && (
          <h2 className={`${themeConfig[theme].typography.h2.fontSize} ${themeConfig[theme].typography.h2.fontWeight} ${themeConfig[theme].typography.h2.color} text-center mb-16`}>
            {title}
          </h2>
        )}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 lg:gap-20">
          <div className="w-full md:w-1/2">
            <div className="grid grid-cols-2 gap-8 md:gap-10">
              {dataSet.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className={`text-4xl md:text-5xl xl:text-6xl font-bold ${getNumberColor()} mb-4`}>
                    {item.percentage}
                  </div>
                  <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} max-w-[280px]`}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full md:w-1/2 relative" style={{ height: '500px' }}>
            {image.imageUrl && (
              <Image 
                src={image.imageUrl}
                alt={image.imageAlt || ''}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyResultsWithImage;