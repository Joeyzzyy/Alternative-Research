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
        <h2 className={`${themeConfig[theme].typography.h2.fontSize} ${themeConfig[theme].typography.h2.fontWeight} ${themeConfig[theme].typography.h2.color} mb-4`}>
          {data.title}
        </h2>
        <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} mb-6`}>
          {data.subTitle}
        </p>
        <a 
          href={data.bottomContent.buttonLink}
          className={getButtonStyle()}
        >
          {data.bottomContent.buttonText}
        </a>
      </div>
    </div>
  );
};

export default CallToAction;