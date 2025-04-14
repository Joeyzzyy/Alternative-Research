'use client';
import React from 'react';

const HowToUseGuide = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          Why Alternative Pages Matter
        </h2>
        
        <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
          Alternative pages deliver exceptional ROI by capturing high-intent traffic and boosting your conversion rates.
        </p>
        
        <div className="grid md:grid-cols-3 gap-12 items-start">
          {/* Benefits Section (Replaced Steps) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left h-full">
              <h3 className="text-lg font-medium text-cyan-400 mb-2">Capture High-Intent Traffic</h3>
              <p className="text-gray-300 text-sm">Users searching for alternatives are actively looking for new solutions and have high purchase intent.</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left h-full">
              <h3 className="text-lg font-medium text-purple-400 mb-2">Leverage Competitor Popularity</h3>
              <p className="text-gray-300 text-sm">The more popular your competitors become, the more traffic your alternative pages can capture.</p>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg p-5 text-left h-full">
              <h3 className="text-lg font-medium text-rose-400 mb-2">Boost Trust & Credibility</h3>
              <p className="text-gray-300 text-sm">Position your brand alongside established competitors to increase trust and credibility with new prospects.</p>
            </div>
          </div>

          {/* ROI Section (Replaced Image/Video) */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-slate-700/50 shadow-xl shadow-purple-500/10 bg-slate-900/60 backdrop-blur-sm p-8 text-left h-full flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Alt Page Potential ROI</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Monthly Alternative Traffic</span>
                  <span className="text-lg font-semibold text-green-400">Significant Growth</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Conversion Rate</span>
                  <span className="text-lg font-semibold text-green-400">High Level</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">New Customers Per Month</span>
                  <span className="text-lg font-semibold text-green-400">Substantial Acquisition</span>
                </div>
                 <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <span className="text-gray-300">Average Customer Value</span>
                  <span className="text-lg font-semibold text-green-400">Considerable</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 rounded-lg mt-4">
                  <span className="text-white font-medium">Estimated Monthly Revenue</span>
                  <span className="text-xl font-bold text-white">High Potential</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16">
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
  );
};

export default HowToUseGuide;