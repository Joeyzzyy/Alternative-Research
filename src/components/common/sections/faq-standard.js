'use client';
import React from 'react';

// Define the new FAQ data in English
const faqData = [
  {
    question: "How accurate is the AI content?",
    answer: "Our AI generates factual, data-backed comparisons using verified product information. All content is review-ready before publishing, ensuring maximum accuracy."
  },
  {
    question: "How quickly will my alternative pages start ranking?",
    answer: "Most clients see first-page rankings within 4-6 weeks for mid-competition keywords. Our SEO-optimized structure accelerates indexing and ranking."
  },
  {
    question: "Do I need technical skills to use AltPage.ai?",
    answer: "No technical skills required. Our platform handles everything from research to publishing. Simple integrations available for all major CMS platforms."
  },
  {
    question: "How do you ensure the content is unique?",
    answer: "Every page is generated with unique, original content tailored to your specific product. Our AI avoids template language and creates truly custom comparisons."
  },
  {
    question: "Can I customize the page designs?",
    answer: "Yes, you can choose from multiple templates and customize colors, fonts, and layouts to match your brand. Pro plans include advanced customization options."
  }
];

// The theme prop is no longer used, can be removed
// const FAQTwoColumnsWithSmallTitle = ({ data, theme = 'normal' }) => {
const FAQTwoColumnsWithSmallTitle = ({ data }) => { // Remove the theme prop
  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Frequently asked questions
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 gap-y-6">
          {faqData.map((faq, index) => (
            <div 
              key={index} 
              className="backdrop-blur-sm bg-slate-900/80 rounded-2xl p-8 
                border border-slate-700/30
                shadow-lg shadow-cyan-500/5
                hover:shadow-xl hover:shadow-purple-500/10
                transition-all duration-500 group
                hover:translate-y-[-4px] hover:bg-gradient-to-b hover:from-slate-800/90 hover:to-slate-900/95"
            >
              <div className="flex flex-col md:flex-row md:gap-16">
                <div className="md:w-2/5">
                  <div className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium mb-2.5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-6 md:mb-0 leading-snug">
                    {faq.question}
                  </h3>
                </div>
                <div className="md:w-3/5">
                  <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <a 
            href="#" 
            onClick={scrollToTop}
            className="px-8 py-3 rounded-full relative overflow-hidden inline-flex items-center group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
            <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
            <span className="relative text-white font-medium flex items-center gap-2">
              Back to Top
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQTwoColumnsWithSmallTitle;