'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const CallToAction = ({ data, theme = 'normal' }) => {
  const getBgColor = () => {
    return theme === 'tech' 
      ? themeConfig[theme].section.background.secondary
      : themeConfig[theme].section.background.primary;
  };

  const getButtonStyle = () => {
    const baseStyles = themeConfig[theme].button.base;
    const variantStyles = themeConfig[theme].button.variants.secondary;
    return `${baseStyles} ${variantStyles}`;
  };

  return (
    <div className={`
      ${getBgColor()} 
      ${themeConfig[theme].section.padding.wide}
    `}>
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 
          to-purple-600 bg-clip-text text-transparent">
          {data.title}
        </h2>
        <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} mb-6`}>
          {data.subTitle}
        </p>
        <a 
          href={data.bottomContent.buttonLink}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 
            to-purple-600 text-white font-medium hover:from-blue-700 
            hover:to-purple-700 transition-all duration-300 inline-block"
        >
          {data.bottomContent.buttonText}
        </a>
      </div>
    </div>
  );
};

export default CallToAction;