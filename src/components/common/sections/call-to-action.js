'use client';
import React from 'react';

const CallToAction = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      {/* Animated particles for enhanced tech feel */}
      <div className="absolute inset-0 overflow-hidden">
        {Array(8).fill(0).map((_, i) => (
          <div 
            key={i}
            className={`absolute w-1 h-1 rounded-full \${
              i % 3 === 0 ? 'bg-cyan-500/40' : 
              i % 3 === 1 ? 'bg-purple-500/40' : 
              'bg-rose-400/40'
            }`}
            style={{
              top: `\${10 + (i * 10)}%`, 
              left: `\${5 + (i * 12)}%`,
              boxShadow: '0 0 12px 2px currentColor',
              animation: `float-y \${4 + i}s ease-in-out infinite alternate, float-x \${6 + i}s ease-in-out infinite alternate`
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
          Stay Updated with the Latest AI Tool Comparisons
        </h2>
        
        <p className="text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join 5,000+ professionals receiving our weekly AI tool insights
        </p>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500"></div>
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="relative px-8 py-4 bg-slate-900 rounded-xl leading-none flex items-center justify-center font-medium text-white"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-500 via-purple-600 to-rose-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></span>
            <span className="flex items-center justify-center gap-2">
              Subscribe Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;