'use client';
import React from 'react';
import Image from 'next/image';
import themeConfig from '../../../styles/themeConfig';

const MoreInsightsWithFourCards = ({ data, theme = 'normal' }) => {
  const insights = data.bottomContent;

  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };
  const getCardStyle = () => {
    return theme === 'tech'
      ? 'group overflow-hidden rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-sm transition-all duration-200'
      : 'group overflow-hidden rounded-lg border border-gray-100 hover:border-[#3374FF]/20 hover:shadow-sm transition-all duration-200';
  };

  const getCaptionColor = () => {
    return theme === 'tech' ? 'text-indigo-600' : 'text-[#3374FF]';
  };

  const getTitleHoverColor = () => {
    return theme === 'tech' ? 'group-hover:text-indigo-600' : 'group-hover:text-[#3374FF]';
  };

  return (
    <div className={`
      ${getBgColor()}
      ${themeConfig[theme].section.padding.base}
    `}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className={`${themeConfig[theme].typography.h2.fontSize} ${themeConfig[theme].typography.h2.fontWeight} ${themeConfig[theme].typography.h2.color} text-center mb-12`}>
          More Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.map((insight, index) => (
            <div key={index} className={getCardStyle()}>
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={insight.imageUrl}
                  alt={insight.imageAlt}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              
              <div className="p-6">
                <p className={`${themeConfig[theme].typography.h5.fontSize} ${getCaptionColor()} font-medium mb-2 uppercase`}>
                  {insight.subTitle}
                </p>
                <h3 className={`${themeConfig[theme].typography.h3.fontSize} ${themeConfig[theme].typography.h3.fontWeight} ${themeConfig[theme].typography.h3.color} ${getTitleHoverColor()} transition-colors duration-200`}>
                  {insight.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoreInsightsWithFourCards;
