'use client';
import React from 'react';

const ImageToVideoFeature = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6 text-white">
          Automated Competitive Research at Scale
        </h2>
        
        <p className="text-gray-300 mb-10 max-w-3xl mx-auto">
          Transform your competitive research process with our AI-powered platform. Input any URL, and our intelligent agents will automatically analyze competitors, identify key features, pricing strategies, and market positioning, then generate comprehensive alternative pages optimized for search engines.
        </p>
        
        <div className="mb-12 flex justify-center">
          <button className="px-8 py-3.5 rounded-full relative overflow-hidden group">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
            <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
            <span className="relative text-white font-medium">Start Research Now</span>
          </button>
        </div>
        
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-800/50 max-w-4xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 relative">
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="w-full h-full overflow-hidden">
                <img 
                  src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-14/mlxk8a94f7_clipboard-image-1741933081.png" 
                  alt="Alternatively" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideoFeature;