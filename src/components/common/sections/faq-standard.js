'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const FAQTwoColumnsWithSmallTitle = ({ data, theme = 'normal' }) => {
  const styles = themeConfig[theme];
  
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white py-24 relative overflow-hidden">
      {/* 自然优雅的背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_#f5f9ff_0%,_transparent_70%)]"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <div className="w-16 h-0.5 bg-blue-600 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 gap-y-6">
          {data.topContent.map((faq, index) => (
            <div 
              key={index} 
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <div className="flex flex-col md:flex-row md:gap-16">
                <div className="md:w-2/5">
                  <div className="text-blue-600 font-medium mb-2.5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 md:mb-0 leading-snug">
                    {faq.question}
                  </h3>
                </div>
                <div className="md:w-3/5">
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.bottomContent.showButton && (
          <div className="flex justify-center mt-16">
            <a 
              href="#"
              onClick={scrollToTop}
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3.5 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-300 inline-block"
            >
              Try it now
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQTwoColumnsWithSmallTitle;