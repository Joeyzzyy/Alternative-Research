'use client';
import React from 'react';

const HowToUseGuide = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-grid.svg')] opacity-[0.05]"></div>
      
      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-4 text-white">
          How to Use Our AI Research Platform
        </h2>
        
        <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
          Transform your competitive analysis in three simple steps. Input a URL, let our AI analyze competitors, and generate SEO-optimized alternative pages automatically.
        </p>
        
        <div className="grid md:grid-cols-3 gap-12 items-center">
          {/* Steps Section */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left">
              <h3 className="text-lg font-medium text-white mb-2">Step 1</h3>
              <p className="text-gray-300 text-sm">Enter competitor URL in dashboard</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left">
              <h3 className="text-lg font-medium text-white mb-2">Step 2</h3>
              <p className="text-gray-300 text-sm">Configure analysis parameters and SEO requirements</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left">
              <h3 className="text-lg font-medium text-white mb-2">Step 3</h3>
              <p className="text-gray-300 text-sm">Generate and publish optimized alternative page</p>
            </div>
          </div>

          {/* Video Tutorial Section - 修改为静态图片展示 */}
          <div className="md:col-span-2">
            <div className="rounded-xl overflow-hidden border border-slate-700/50 shadow-xl shadow-cyan-500/10 bg-black/30 backdrop-blur-sm transform scale-110 origin-center mx-auto w-[90%]">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img 
                  src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-11/3az2448c11_An overview of digital marketing packages. (1).png"
                  alt="Digital Marketing Packages"
                  className="w-full h-full object-cover"
                />
                
                {/* 保留右下角Logo */}
                <div className="absolute bottom-4 right-4 h-12 w-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <button 
            className="px-8 py-3.5 rounded-full relative overflow-hidden group"
            onClick={(e) => {
              e.preventDefault(); // 阻止默认行为
              window.open('https://app.alternatively.websitelm.com', '_blank');
            }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
            <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
            <span className="relative text-white font-medium">Start Customizing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUseGuide;