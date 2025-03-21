'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const ImageToVideoFeature = ({ data, theme = 'normal' }) => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-grid.svg')] opacity-[0.05]"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6 text-white">
          {data?.title || "Create Any Video Based on Any Image"}
        </h2>
        
        <p className="text-gray-300 mb-10 max-w-3xl mx-auto">
          {data?.description || "Whether you want to animate a cartoon picture, or create a funny dance video with the photo of your two close friends, our image to video AI generator will turn any type of images into videos of your specified styles while maintaining the image context."}
        </p>
        
        <div className="mb-12 flex justify-center">
          <button className="px-8 py-3.5 rounded-full relative overflow-hidden group">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
            <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
            <span className="relative text-white font-medium">Turn Photo to Video</span>
          </button>
        </div>
        
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10 border border-slate-800/50 max-w-4xl mx-auto">
          <div className="aspect-w-16 aspect-h-9 relative">
            {/* I'll describe the image content rather than naming individuals */}
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
              {/* Placeholder for the image */}
              <div className="w-full h-full overflow-hidden">
                <div className="relative w-full h-full">
                  {/* This is a placeholder for the image showing people celebrating with confetti */}
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-slate-900/0 to-cyan-500/10">
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <span className="text-sm opacity-60">Image showing people celebrating with colorful confetti</span>
                    </div>
                  </div>
                  
                  {/* Confetti effect overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array(20).fill(0).map((_, i) => (
                      <div 
                        key={i}
                        className={`absolute w-2 h-2 rounded-full \${
                          i % 3 === 0 ? 'bg-cyan-500' : 
                          i % 3 === 1 ? 'bg-rose-500' : 
                          'bg-yellow-400'
                        }`}
                        style={{
                          top: `\${Math.random() * 100}%`, 
                          left: `\${Math.random() * 100}%`,
                          opacity: 0.7 + (Math.random() * 0.3)
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideoFeature;