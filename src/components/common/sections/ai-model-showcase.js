'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';
import Image from 'next/image';

const AIImageToVideoShowcase = ({ data, theme = 'normal' }) => {
  // SEO and AI tools data with icons
  const aiModels = [
    { name: 'Semrush', icon: '/images/semrush.png' },
    { name: 'Ahrefs', icon: '/images/ahrefs.png' },
    { name: 'Google Trends', icon: '/images/googletrends.png' },
    { name: 'Dify', icon: '/images/dify.png' },
    { name: 'Claude', icon: '/images/claude.png' },
    { name: 'OpenAI', icon: '/images/openai.png' },
    { name: 'Next.js', icon: '/images/nextjs.png' },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
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
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-6">
            {aiModels.map((model, index) => (
              <div key={index} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-md shadow-slate-900/70">
                  <Image 
                    src={model.icon}
                    alt={`${model.name} icon`}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-gray-300 text-xs">{model.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-rose-400 hover:text-rose-300 font-medium text-sm transition-colors duration-200 flex items-center gap-1 mx-auto"
            >
              Try Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIImageToVideoShowcase;