'use client';
import React from 'react';

const CustomizableResearchUI = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">
            Why Alternative Pages Matter
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            In today's competitive digital landscape, traditional SEO isn't enough. See how our AI-powered alternative pages have helped businesses outrank competitors, capture untapped traffic, and dramatically increase conversions.
          </p>
        </div>

        {/* Case Study 1: HIX - Left Text, Right Image */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24" id="showcase-hix">
          <div className="py-12 space-y-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <h3 className="text-2xl font-bold text-white">HIX</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Breaking Through SEO Plateaus
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              HIX had invested heavily in traditional SEO for months with minimal results. Within just 2 weeks of implementing our AI-generated alternative pages, they jumped from page 5 to the top 3 results for their most competitive keywords. The alternative approach unlocked traffic and conversion potential that conventional methods couldn't reach.
            </p>
            
            <div className="flex items-center space-x-2 text-cyan-400 mb-8">
              <span className="font-medium">Results:</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm">+215% Traffic</span>
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm">Top 3 Ranking</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-12/tiydfa70c1_Untitled (9) (1).png"
              alt="HIX success case study" 
              className="w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 transform scale-110 origin-center"
            />  
          </div>
        </div>
        
        {/* Case Study 2: Joggai - Right Text, Left Image */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24" id="showcase-joggai">
          <div className="flex justify-center order-2 md:order-1">
            <img 
              src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-10/33kf353c26_ai detector, caricature, detectorist, detector, beach scene, coloured, sunny, sunglasses.jpeg"
              alt="Joggai success case study" 
              className="w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 transform scale-110 origin-center"
            />  
          </div>
          
          <div className="py-12 space-y-8 order-1 md:order-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Joggai</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Competing Against Industry Giants
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              As a startup, Joggai was struggling to compete with established fitness apps with massive SEO budgets. Their alternative pages created unique value propositions that major competitors weren't addressing, allowing them to capture highly targeted traffic and outrank three major competitors for niche keywords that drove qualified users.
            </p>
            
            <div className="flex items-center space-x-2 text-purple-400 mb-8">
              <span className="font-medium">Results:</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">+340% Downloads</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">Outranked Competitors</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
        </div>
        
        {/* Case Study 3: JTracking - Left Text, Right Image */}
        <div className="grid md:grid-cols-2 gap-16 items-center" id="showcase-jtracking">
          <div className="py-12 space-y-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-r from-amber-500 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <h3 className="text-2xl font-bold text-white">JTracking</h3>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-6">
              Converting Traffic That Matters
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              JTracking had decent traffic but poor conversion rates. Their alternative pages didn't just attract more visitors—they attracted the right visitors. By addressing specific pain points and offering tailored solutions through AI-generated content, they doubled their conversion rate and ranked for 12 high-value keywords that traditional content strategies had missed.
            </p>
            
            <div className="flex items-center space-x-2 text-amber-400 mb-8">
              <span className="font-medium">Results:</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm">+104% Conversions</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-sm">12 First-Page Rankings</span>
            </div>
            
            <button 
              className="px-6 py-3 rounded-full relative overflow-hidden group"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500"></span>
              <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
              <span className="relative text-white font-medium">Try 5 Free Alternative Pages</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="https://websitelm-us-east-2.s3.amazonaws.com/67a9fabf538eb88a2247b5be/2025-03-12/tiydfa70c1_Untitled (9) (1).png"
              alt="JTracking success case study" 
              className="w-full rounded-lg shadow-2xl shadow-slate-900/70 border border-slate-800/50 transform scale-110 origin-center"
            />  
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="mt-20 text-center">
          <button 
            className="px-8 py-3.5 rounded-full relative overflow-hidden group"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            }}
            type="button"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 animate-gradient-x"></span>
            <span className="absolute inset-0.5 rounded-full bg-slate-900 group-hover:bg-slate-800 transition-colors duration-300"></span>
            <span className="relative text-white font-medium">Create Your Success Story Today</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizableResearchUI;