'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import themeConfig from '../../../styles/themeConfig';

const PageListCard = ({ data, theme = 'normal' }) => {
  const [imageLibraryVisible, setImageLibraryVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  
  const insights = data.bottomContent;

  // Theme related functions
  const getBgColor = () => {
    return themeConfig[theme].section.background.primary;
  };

  const getCardStyle = () => {
    return theme === 'tech'
      ? 'group flex flex-col bg-white rounded-lg border border-indigo-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 cursor-pointer'
      : 'group flex flex-col bg-white rounded-lg border border-gray-200 hover:border-[#3374FF]/20 hover:shadow-lg transition-all duration-200 cursor-pointer';
  };

  const getCaptionColor = () => {
    return theme === 'tech' ? 'text-indigo-600' : 'text-[#3374FF]';
  };

  const getCaptionBgColor = () => {
    return theme === 'tech' ? 'bg-indigo-50' : 'bg-[#3374FF]/10';
  };

  const getTitleHoverColor = () => {
    return theme === 'tech' ? 'group-hover:text-indigo-600' : 'group-hover:text-[#3374FF]';
  };

  const getTypographyStyles = () => {
    const typography = themeConfig[theme].typography;
    return {
      title: `${typography.h2.fontSize} ${typography.h2.fontWeight} ${typography.h2.color}`,
      subtitle: `${typography.h3.fontSize} ${typography.h3.fontWeight} ${typography.h3.color} mt-2 mb-8`
    };
  };

  // 添加分组逻辑
  const groupedInsights = React.useMemo(() => {
    const groups = {};
    insights.forEach(insight => {
      if (!groups[insight.tag]) {
        groups[insight.tag] = [];
      }
      groups[insight.tag].push(insight);
    });
    return groups;
  }, [insights]);

  return (
    <div className={`w-full ${getBgColor()} py-12 md:py-16`}>
      <div className="max-w-6xl mx-auto px-4">
        {data.title && (
          <h2 className={`${getTypographyStyles().title} text-center`}>
            {data.title}
          </h2>
        )}
        {data.subTitle && (
          <h3 className={`${getTypographyStyles().subtitle} text-center`}>
            {data.subTitle}
          </h3>
        )}
        
        {/* 替换原来的卡片列表为分组显示 */}
        {Object.entries(groupedInsights).map(([tag, groupInsights]) => (
          <div key={tag} className="mb-12">
            <div className="flex items-center mb-6 group">
              <div className="relative">
                <h3 className={`text-base font-medium ${getCaptionColor()} px-4 py-2 bg-gradient-to-r from-${getCaptionBgColor()} to-white rounded-lg border border-${theme === 'tech' ? 'indigo' : '[#3374FF]'}/20 shadow-sm backdrop-blur-sm`}>
                  {tag}
                </h3>
                <div className={`absolute inset-0 ${getCaptionBgColor()} blur-lg rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
              <div className="ml-4 flex-grow">
                <div className={`h-px bg-gradient-to-r from-${theme === 'tech' ? 'indigo' : '[#3374FF]'}/20 via-gray-200 to-transparent`}></div>
              </div>
            </div>
            
            {/* 添加分隔线 */}
            <div className={`w-full h-px bg-${theme === 'tech' ? 'indigo' : '[#3374FF]'}/10 mb-6`}></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupInsights.map((insight, index) => (
                <a 
                  key={index}
                  href={insight.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={getCardStyle()}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={insight.imageUrl}
                      alt={insight.imageAlt}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  
                  <div className="flex flex-col flex-grow p-5">
                    <div className="mb-3">
                      <span className={`inline-block px-3 py-1 text-xs font-medium ${getCaptionColor()} ${getCaptionBgColor()} rounded-full`}>
                        {insight.tag}
                      </span>
                    </div>
                    
                    <h3 className={`text-lg font-semibold text-gray-900 ${getTitleHoverColor()} transition-colors duration-200 line-clamp-2`}>
                      {insight.title}
                    </h3>
                    
                    {insight.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                        {insight.description}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal implementation will depend on your UI library choice */}
      {imageLibraryVisible && (
        <ImageLibrary
          visible={imageLibraryVisible}
          onSelect={(image) => setSelectedImage(image)}
          onClose={() => {
            setImageLibraryVisible(false);
            setSelectedImage(null);
            setCurrentEditingIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default PageListCard;
