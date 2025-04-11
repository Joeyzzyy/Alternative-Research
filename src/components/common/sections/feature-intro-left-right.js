'use client';
import React from 'react';

const CustomizableResearchUI = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="flex justify-center">
            <img 
              src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-12/tiydfa70c1_Untitled (9) (1).png"
              alt="AI-powered research parameters configuration" 
              className="w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 transform scale-110 origin-center"
            />  
          </div>
          
          {/* Right side - Description */}
          <div className="py-12 space-y-8">
            <h2 className="text-4xl font-bold text-white mb-6">
              Customizable Research Parameters
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              Take full control of your competitive analysis workflow. Set focus areas, analysis depth, and SEO requirements to generate tailored insights and content with our AI-powered platform.
            </p>
            
            <button 
              className="px-8 py-3.5 rounded-full relative overflow-hidden group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 滚动到页面顶部
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth' // 可选平滑滚动效果
                });
              }}
              type="button"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Start Customizing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizableResearchUI;