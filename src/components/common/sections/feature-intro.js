'use client';
import React from 'react';
// Import an icon library if you want to add icons, e.g., react-icons
// import { FiArrowRightCircle, FiXCircle } from 'react-icons/fi';

const AlternativePageFeature = () => {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-black py-24 sm:py-32 relative overflow-hidden">
      {/* Enhanced AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee20_0%,_transparent_50%)] opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa25_0%,_transparent_55%)] opacity-70"></div>
      {/* Optional: Add more subtle background elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
          What is an Alternative Page?
        </h2>

        <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
          An alternative page strategically compares your product or service to popular competitors, capturing users actively looking for better options.
        </p>

        <div className="flex flex-col md:flex-row gap-8 mb-16 text-left text-gray-300">
          {/* "From This" Card with enhanced styling */}
          <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-500/20 hover:border-cyan-600/70">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              {/* Optional Icon: <FiXCircle className="text-red-500" /> */}
              From This:
            </h3>
            <p className="font-medium mb-2 text-cyan-400">Searching for options</p>
            {/* Refined mock Google search bar - closer to reality */}
            <div className="mb-4 px-4 py-2 bg-white rounded-full border border-gray-300 flex items-center text-sm shadow-sm hover:shadow-md transition-shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-700">Competitor Name alternatives</span>
              {/* Optional: Add mock icons for mic/camera if desired at the end */}
            </div>
            {/* Mock Google Search Result Snippet - Generic */}
            <div className="p-4 bg-white rounded-lg shadow text-left">
              {/* Google-like URL color (adjusted for light bg) */}
              <span className="text-sm text-green-700 block mb-1">www.genericreviews.com › best-alternatives</span>
              {/* Google-like Title color and size (adjusted for light bg) */}
              <h4 className="text-lg text-blue-700 hover:underline cursor-pointer mb-1 font-medium">
                Top 10 Best [Competitor Name] Alternatives for 2024
              </h4>
              {/* Google-like Description color (adjusted for light bg) */}
              <p className="text-sm text-gray-700">
                Looking for options beyond [Competitor Name]? We reviewed dozens of tools. See our list of the top alternatives, pros, cons, and pricing... Often biased or outdated.
              </p>
            </div>
          </div>

          {/* "To This" Card with enhanced styling */}
          <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-purple-500/10 transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-600/70">
            <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
              {/* Optional Icon: <FiArrowRightCircle className="text-green-500" /> */}
              To This:
            </h3>
            <p className="font-medium mb-2 text-purple-400">Direct conversions</p>
            {/* Mock Google Search Result Snippet - Your Page */}
            <div className="mb-4 px-4 py-2 bg-white rounded-full border border-gray-300 flex items-center text-sm shadow-sm hover:shadow-md transition-shadow">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
               <span className="text-gray-700">Competitor Name alternatives</span>
             </div>
            <div className="p-4 bg-white rounded-lg shadow text-left">
               {/* Google-like URL color (adjusted for light bg) */}
               <span className="text-sm text-green-700 block mb-1">www.yourproduct.com › compare › competitor-alternative</span>
               {/* Google-like Title color and size (adjusted for light bg) */}
               <h4 className="text-lg text-blue-700 hover:underline cursor-pointer mb-1 font-medium">
                 [Your Product] vs [Competitor]: Why We're the Better Choice
               </h4>
               {/* Google-like Description color (adjusted for light bg) */}
               <p className="text-sm text-gray-700">
                 See a direct comparison between [Your Product] and [Competitor Name]. Discover key advantages in features, pricing, and support. Make the switch today...
               </p>
             </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-left text-gray-300 mt-16">
          <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Differences in Conversion Rates
          </h3>
          <p className="text-lg mb-8 text-center">
            Conversion rates can vary considerably across these page types due to the stage of the customer journey they cater to:
          </p>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Informational Pages - Standard Styling */}
            <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-slate-900/30 transition-all duration-300 hover:border-cyan-500/80 hover:shadow-xl hover:shadow-cyan-500/20">
              <h4 className="text-xl font-semibold mb-4 text-cyan-400">Informational Pages</h4>
              <p className="mb-3">
                <strong className="block text-sm font-medium text-white mb-1">Conversion Behavior:</strong>
                Since the primary goal here is education rather than immediate conversion, users may spend more time reading without taking a direct action.
              </p>
              <p>
                <strong className="block text-sm font-medium text-white mb-1">Typical Conversion Rates:</strong>
                These pages tend to have lower immediate conversion rates (often in the range of{' '}
                <span className="inline-block bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-md font-semibold text-sm">
                  1–3%
                </span>
                ). However, they play a critical role in funneling high-quality leads over time by building trust and informing the purchase decision.
              </p>
            </div>

            {/* Transactional Pages - Enhanced Highlighting */}
            <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-slate-900/30 transition-all duration-300 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-400/40 hover:scale-[1.03] hover:bg-slate-700/80 ring-2 ring-transparent hover:ring-purple-500/50">
              <h4 className="text-xl font-semibold mb-4 text-purple-400">Transactional Pages ✨</h4>
              <p className="mb-3">
                <strong className="block text-sm font-medium text-white mb-1">Conversion Behavior:</strong>
                Optimized for clarity, reduced distractions, and prompt CTAs, these pages tend to convert visitors who are ready to act. <strong className='text-purple-300'>(This is what we help you build!)</strong>
              </p>
              <p>
                <strong className="block text-sm font-medium text-white mb-1">Typical Conversion Rates:</strong>
                They may see conversion rates ranging from{' '}
                <span className="inline-block bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md font-semibold text-sm">
                  3–10%
                </span>{' '}
                or even higher, depending on industry norms, user experience, and offer competitiveness. The direct alignment between ad copy and on-page messaging can boost these numbers.
              </p>
            </div>

            {/* Navigational/Brand-Specific Pages - Standard Styling */}
            <div className="flex-1 p-6 bg-slate-800/60 rounded-xl border border-slate-700 shadow-lg shadow-slate-900/30 transition-all duration-300 hover:border-gray-500/80 hover:shadow-xl hover:shadow-gray-500/20">
              <h4 className="text-xl font-semibold mb-4 text-gray-400">Navigational/Brand-Specific Pages</h4>
              <p className="mb-3">
                <strong className="block text-sm font-medium text-white mb-1">Conversion Behavior:</strong>
                This type strikes a middle ground. While they incorporate both educational content and conversion elements, the conversion action might be less immediate compared to a pure transactional page, but more direct than an in-depth research page.
              </p>
              <p>
                <strong className="block text-sm font-medium text-white mb-1">Typical Conversion Rates:</strong>
                These pages often yield moderate conversion rates, reflecting a user's readiness to engage after a brand-focused reassurance. They might convert in the mid-range, say around{' '}
                <span className="inline-block bg-gray-500/20 text-gray-300 px-2 py-0.5 rounded-md font-semibold text-sm">
                  2–5%
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativePageFeature;