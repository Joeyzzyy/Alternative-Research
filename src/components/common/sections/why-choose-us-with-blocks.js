'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

const WhyChooseUsWithBlocks = ({ data, author }) => {
  const router = useRouter();

  const { topContent, bottomContent } = data;
  return (
    <div className="bg-white py-12 md:py-16">
      <div className="max-w-[85%] mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            {topContent.title}
          </h2>
          <p className="text-base text-[#2f3337] max-w-2xl mx-auto">
            {topContent.description}
          </p>
        </div>

        {bottomContent.map((content, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-8 md:gap-24 mb-16 md:mb-24 last:mb-0 items-center">
            {index % 2 === 0 ? (
              <>
                <div className="w-full md:w-1/2 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      {content.title}
                    </h3>
                    <p className="text-base text-[#2f3337] mb-24">
                      {content.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => window.open(content.buttonLink, '_blank')}
                    className="w-fit px-6 py-3 rounded-full bg-[#3374FF] text-white font-medium hover:bg-blue-700 transition-colors duration-300"
                  >
                    {content.buttonText}
                  </button>
                </div>
                <div className="w-full md:w-1/2">
                  <img 
                    src={content.imageUrl || '/images/placeholder.png'}
                    alt={content.imageAlt || content.title}
                    className="w-auto h-auto object-contain rounded-xl"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-full md:w-1/2">
                  <img 
                    src={content.imageUrl || '/images/placeholder.png'}
                    alt={content.imageAlt || content.title}
                    className="w-auto h-auto object-contain rounded-xl"
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      {content.title}
                    </h3>
                    <p className="text-base text-[#2f3337] mb-24">
                      {content.content}
                    </p>
                  </div>
                  <button 
                    onClick={() => window.open(content.buttonLink, '_blank')}
                    className="w-fit px-6 py-3 rounded-full bg-[#3374FF] text-white font-medium hover:bg-blue-700 transition-colors duration-300"
                  >
                    {content.buttonText}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhyChooseUsWithBlocks;