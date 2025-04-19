'use client';
import React from 'react';

// Define the new FAQ data in English
const faqData = [
  {
    question: "What exactly is an alternative page?",
    answer: "An alternative page is a specialized landing page that compares your product or service to a popular competitor. These pages target users who are actively searching for alternatives to that competitor, capturing high-intent traffic."
  },
  {
    question: "Are alternative pages ethical?",
    answer: "Yes, when done properly. AltPage.ai creates objective, fact-based comparison content that highlights your unique advantages without resorting to negative marketing or false claims about competitors."
  },
  {
    question: "How long does it take to see results?",
    answer: "Most customers start seeing traffic and conversions within 30-60 days, depending on the competitiveness of the keywords targeted. Our SEO optimization helps your pages rank faster for relevant search terms."
  },
  {
    question: "Can I integrate AltPage.ai with my existing website?",
    answer: "Of course, we can deploy to your subdomain or subdirectory."
  },
  {
    question: "What if I need help creating my alternative pages?",
    answer: "You can contact us via Intercom in the bottom right corner of the page or email us at contact@intelick.com. We will reply within 12 hours."
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