'use client';
import React, { useState, forwardRef } from 'react';
import { ArrowPathIcon, MagnifyingGlassIcon, CogIcon, ChartBarIcon, BoltIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline'; // Example icons

const advantagesData = [
  {
    id: 1,
    icon: MagnifyingGlassIcon, // Example icon
    title: 'Dynamic Tables',
    description: 'Auto-highlight why you win.',
    flipTitle: 'Feature comparisons that emphasize your strengths',
    flipItems: ['Auto-updates', 'Feature tracking', 'Price monitoring'],
  },
  {
    id: 2,
    icon: CogIcon, // Example icon
    title: 'Built-in SEO',
    description: 'Titles, URLs, metas—done.',
    flipTitle: 'Optimized for search from day one',
    flipItems: ['Keyword research', 'Schema markup', 'Internal linking'],
  },
  {
    id: 3,
    icon: ArrowPathIcon, // Example icon
    title: 'Auto-Updates',
    description: 'Competitor shifts? Pages refresh.',
    flipTitle: 'Never worry about outdated content',
    flipItems: ['Weekly scans', 'Price updates', 'Feature changes'],
  },
  {
    id: 4,
    icon: ChartBarIcon, // Example icon
    title: 'A/B Optimization',
    description: 'Tests running while you sleep.',
    flipTitle: 'Continuous conversion improvement',
    flipItems: ['Layout testing', 'CTA optimization', 'Content variants'],
  },
];

const KeyAdvantages = forwardRef((props, ref) => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Use smooth scrolling
        });
    };
  const [flippedCards, setFlippedCards] = useState({});

  const handleMouseEnter = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: true }));
  };

  const handleMouseLeave = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div id="key-advantages-section" ref={ref} className="bg-slate-900 py-24 relative overflow-hidden">
      {/* Optional: Add similar gradient overlays if desired */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div> */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div> */}
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Key Advantages
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Our AI-driven platform delivers more than just static pages - it creates a dynamic competitive advantage.
          </p>
        </div>

        {/* Advantages Grid (Flip Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {advantagesData.map((advantage) => (
            <div 
              key={advantage.id} 
              className="perspective"
              onMouseEnter={() => handleMouseEnter(advantage.id)}
              onMouseLeave={() => handleMouseLeave(advantage.id)}
            >
              <div 
                className={`relative w-full h-56 transition-transform duration-700 transform-style-preserve-3d ${flippedCards[advantage.id] ? 'rotate-y-180' : ''}`}
              >
                {/* Front Side */}
                <div className="absolute w-full h-full backface-hidden bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center text-center justify-center shadow-lg">
                  <div>
                    <advantage.icon className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">{advantage.title}</h3>
                    <p className="text-gray-400 text-sm">{advantage.description}</p>
                  </div>
                  <span className="absolute bottom-4 right-4 text-xs text-cyan-400/70 font-medium">
                    Flip for more →
                  </span>
                </div>

                {/* Back Side */}
                <div className="absolute w-full h-full backface-hidden bg-slate-800 border border-cyan-500/50 rounded-xl p-6 flex flex-col items-center text-center justify-center shadow-lg rotate-y-180">
                  <div>
                    <h4 className="text-base font-semibold text-white mb-2">{advantage.flipTitle}</h4>
                    <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside">
                      {advantage.flipItems.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16 pt-16 border-t border-slate-700/50">
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/30">
            <BoltIcon className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast Implementation</h3>
            <p className="text-sm text-gray-400">
              Deploy your first alternative page in under 10 minutes. Our platform handles everything from research to publishing, with no coding or design work required.
            </p>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700/30">
            <PresentationChartLineIcon className="h-8 w-8 text-purple-400 mb-3" />
            <h3 className="text-xl font-semibold text-white mb-2">Results-Driven Analytics</h3>
            <p className="text-sm text-gray-400">
              Track rankings, traffic, and conversions with our built-in analytics dashboard. See exactly how your alternative pages are performing and generating ROI.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
        <button 
            onClick={scrollToTop} // Add onClick handler
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Generate Your First Page
          </button>
          <p className="text-gray-400 text-sm mt-3">
            No credit card required to start
          </p>
        </div>

      </div>
      {/* Add global styles for flip card effect */}
      <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden; /* Safari */
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
});

KeyAdvantages.displayName = 'KeyAdvantages';

export default KeyAdvantages;
