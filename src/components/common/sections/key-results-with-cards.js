'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const KeyResultsWithThreeCards = ({ data, theme = 'normal' }) => {
  const title = data?.title;
  const comparisons = data?.bottomContent || [];
  
  const isChinese = (str) => {
    return /[\u4e00-\u9fa5]/.test(str);
  };
  
  const buttonText = isChinese(title) ? "查看案例" : "Read Case Study";
  
  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };

  const getCardStyle = () => {
    return `${themeConfig[theme].card.variants.primary} ${themeConfig[theme].card.padding.lg} flex flex-col h-full`;
  };

  const getButtonStyle = () => {
    return `mt-auto flex items-center ${themeConfig[theme].text.color.accent} font-medium`;
  };

  const getIconStyle = () => {
    return `w-4 h-4 ml-2 ${themeConfig[theme].text.color.accent}`;
  };
  
  return (
    <div className={`${getBgColor()} ${themeConfig[theme].section.padding.base}`}>
      <div className="max-w-6xl mx-auto px-4">
        {title && (
          <h2 className={`${themeConfig[theme].typography.h2.fontSize} ${themeConfig[theme].typography.h2.fontWeight} ${themeConfig[theme].typography.h2.color} text-center mb-16`}>
            {title}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisons.map((comparison, index) => (
            <div key={index} className={getCardStyle()}>
              <div className="mb-6 text-left">
                {comparison.competitorLogo && (
                  <img 
                    src={comparison.competitorLogo} 
                    alt={comparison.competitorLogoAlt || ''} 
                    className="h-12 w-auto mb-4 mr-auto"
                  />
                )}
                {comparison.competitorName && (
                  <h4 className={`${themeConfig[theme].typography.h4.fontSize} ${themeConfig[theme].typography.h4.fontWeight} ${themeConfig[theme].typography.h4.color} mb-2`}>
                    {comparison.competitorName}
                  </h4>
                )}
              </div>
              
              <div className="mb-6">
                <div className={`text-4xl font-bold ${themeConfig[theme].text.color.accent} mb-2`}>
                  {comparison.percentage}%
                </div>
                <div className={`${themeConfig[theme].typography.h5.fontSize} ${themeConfig[theme].typography.h5.color} mb-4`}>
                  {comparison.metric}
                </div>
                <p className={`${themeConfig[theme].typography.paragraph.fontSize} ${themeConfig[theme].typography.paragraph.color}`}>
                  {comparison.description}
                </p>
              </div>

              <button 
                className={getButtonStyle()}
                onClick={() => comparison.buttonLink && window.open(comparison.buttonLink, '_blank')}
              >
                {comparison.buttonText}
                <svg className={getIconStyle()} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyResultsWithThreeCards;