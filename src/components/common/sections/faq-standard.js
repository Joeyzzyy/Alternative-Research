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
    <div className="bg-gradient-to-b from-white via-slate-50/80 to-white py-24 relative overflow-hidden">
      {/* AI风格的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#818cf820_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#6366f120_0%,_transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.015]"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900">
            Frequently asked questions
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 gap-y-6">
          {data.topContent.map((faq, index) => (
            <div 
              key={index} 
              className="backdrop-blur-sm bg-white/80 rounded-2xl p-8 
                shadow-[0_4px_24px_-12px_rgba(99,102,241,0.1)] 
                hover:shadow-[0_24px_48px_-12px_rgba(99,102,241,0.25)]
                transition-all duration-500 group
                hover:translate-y-[-4px] hover:bg-gradient-to-b hover:from-white hover:to-slate-50/80
                border border-slate-100 hover:border-slate-200"
            >
              <div className="flex flex-col md:flex-row md:gap-16">
                <div className="md:w-2/5">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-medium mb-2.5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 md:mb-0 leading-snug">
                    {faq.question}
                  </h3>
                </div>
                <div className="md:w-3/5">
                  <p className="text-gray-600/90 whitespace-pre-line leading-relaxed">
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
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 text-white font-medium px-8 py-3.5 rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-purple-500/30 transition-all duration-300 inline-block backdrop-blur-sm"
            >
              Get it now
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQTwoColumnsWithSmallTitle;