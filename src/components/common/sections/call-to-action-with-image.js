'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

const CallToActionWithImage = ({ data, theme = 'normal' }) => {
  const { leftContent, rightContent } = data;
  
  const getBgColor = () => {
    return theme === 'tech' 
      ? themeConfig[theme].section.background.secondary
      : themeConfig[theme].section.background.primary;
  };

  const getButtonStyle = () => {
    const buttonTheme = themeConfig[theme].button;
    return `${buttonTheme.base} ${buttonTheme.variants.primary}`;
  };

  const getImageContainerStyle = () => {
    return theme === 'tech'
      ? 'relative w-full aspect-video rounded-lg overflow-hidden border border-blue-100'
      : 'relative w-full aspect-video rounded-lg overflow-hidden border border-gray-100';
  };

  return (
    <div className={`${getBgColor()} ${themeConfig[theme].section.padding.base}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          <div className="w-full md:w-1/2">
            <h2 className={`${themeConfig[theme].typography.h2.fontSize} ${themeConfig[theme].typography.h2.fontWeight} ${themeConfig[theme].typography.h2.color} mb-4`}>
              {leftContent.title}
            </h2>
            <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color} mb-6`}>
              {leftContent.subTitle}
            </p>
            <button className={getButtonStyle()}>
              {rightContent.buttonText}
            </button>
          </div>
          
          <div className="w-full md:w-1/2">
            <div className={getImageContainerStyle()}>
              {rightContent.imageUrl && (
                <Image 
                  src={rightContent.imageUrl}
                  alt={rightContent.imageAlt || ''}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallToActionWithImage;