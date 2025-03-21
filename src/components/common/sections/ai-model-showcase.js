'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const AIImageToVideoShowcase = ({ data, theme = 'normal' }) => {
  // AI model data with icons represented as colored shapes
  const aiModels = [
    { name: 'Kling AI', icon: 'circle', color: 'from-cyan-400 to-blue-500' },
    { name: 'Runway', icon: 'square', color: 'from-emerald-400 to-green-500' },
    { name: 'Hailuo AI', icon: 'circle', color: 'from-pink-500 to-rose-600' },
    { name: 'Vidu AI', icon: 'square', color: 'from-blue-400 to-cyan-300' },
    { name: 'Luma AI', icon: 'triangle', color: 'from-teal-400 to-cyan-500' },
    { name: 'PIXverse', icon: 'square', color: 'from-fuchsia-500 to-purple-600' },
    { name: 'Pika AI', icon: 'cloud', color: 'from-slate-200 to-slate-400' },
    { name: 'Wanx AI', icon: 'hexagon', color: 'from-violet-500 to-purple-600' },
    { name: 'Hunyuan', icon: 'circle', color: 'from-blue-400 to-blue-600' },
    { name: 'Veo 2', icon: 'circle', color: 'from-blue-500 to-indigo-600' },
    { name: 'Seaweed', icon: 'diamond', color: 'from-emerald-400 to-teal-500' },
  ];

  // Helper function to render icon based on shape
  const renderIcon = (shape, colorClass) => {
    switch(shape) {
      case 'circle':
        return <div className={`w-8 h-8 rounded-full bg-gradient-to-br \${colorClass}`}></div>;
      case 'square':
        return <div className={`w-8 h-8 rounded-sm bg-gradient-to-br \${colorClass}`}></div>;
      case 'triangle':
        return (
          <div className="w-8 h-8 flex items-center justify-center">
            <div className={`w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent bg-gradient-to-br \${colorClass}`} style={{borderBottomColor: 'currentColor'}}></div>
          </div>
        );
      case 'hexagon':
        return <div className={`w-8 h-8 rounded-md bg-gradient-to-br \${colorClass}`}></div>;
      case 'diamond':
        return <div className={`w-8 h-8 rotate-45 rounded-sm bg-gradient-to-br \${colorClass}`}></div>;
      case 'cloud':
        return <div className={`w-8 h-8 rounded-full bg-gradient-to-br \${colorClass}`}></div>;
      default:
        return <div className={`w-8 h-8 rounded-md bg-gradient-to-br \${colorClass}`}></div>;
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/circuit-grid.svg')] opacity-[0.05]"></div>
      
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-bold mb-6 text-white">
          {data?.title || "All-in-One AI Image to Video Generator"}
        </h2>
        
        <p className="text-gray-300 mb-12 max-w-3xl mx-auto">
          {data?.description || "Pollo AI is an ultimate, all-in-one AI video platform. In addition to our flagship Pollo 1.5, we offer access to multiple industry-leading image-to-video models, all at one single place. Experiment with these models and choose the right one for your video creation!"}
        </p>
        
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800/90 p-8 backdrop-blur-sm border border-slate-700/30 shadow-xl shadow-cyan-500/5">
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-11 gap-6">
            {aiModels.map((model, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-md shadow-slate-900/70">
                  {renderIcon(model.icon, model.color)}
                </div>
                <span className="text-gray-300 text-xs">{model.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <button className="text-rose-400 hover:text-rose-300 font-medium text-sm transition-colors duration-200 flex items-center gap-1 mx-auto">
              More Models
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageToVideoShowcase;