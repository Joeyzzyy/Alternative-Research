'use client';
import React from 'react';
import themeConfig from '../../../styles/themeConfig';

const JobListNormal = ({ data, theme = 'normal' }) => {
  const { typography, section } = themeConfig[theme];

  return (
    <div className={`${section.background.primary} ${section.padding.base} min-h-screen`}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className={`${typography.h1.fontSize} ${typography.h1.fontWeight} ${typography.h1.color} mb-4`}>
            {data.topContent.title}
          </h1>
          <p className={`${typography.paragraph.color} text-lg mb-2`}>
            {data.topContent.subTitle}
          </p>
        </div>

        <div className={`${section.background.secondary} rounded-lg shadow-sm`}>
          <div className="space-y-6">
            {data.bottomContent.map((job, index) => (
              <div 
                key={index} 
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`${typography.h3.fontSize} ${typography.h3.fontWeight} ${typography.h3.color} mb-1 hover:text-blue-600`}>
                      {job.position}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <p className={`${typography.paragraph.color} flex items-center gap-1`}>{job.location}</p>
                      <p className={`${typography.paragraph.color} flex items-center gap-1`}>{job.type}</p>
                      <p className={`${typography.paragraph.color} flex items-center gap-1`}>{job.salary}</p>
                    </div>
                  </div>
                  <button 
                    className={`${themeConfig[theme].button.base} ${themeConfig[theme].button.variants.primary} hover:scale-105 transition-all duration-200`}
                    onClick={() => window.open(job.buttonLink, '_blank')}
                  >
                    {job.buttonText || 'Apply Now'}
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.tags.map((tag, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition-colors duration-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className={`${typography.h4.fontSize} ${typography.h4.fontWeight} ${typography.h4.color} mb-2`}>
                      Responsibilities
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {job.responsibilities.map((item, idx) => (
                        <li key={idx} className={typography.paragraph.color}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className={`${typography.h4.fontSize} ${typography.h4.fontWeight} ${typography.h4.color} mb-2`}>
                      Requirements
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {job.requirements.map((item, idx) => (
                        <li key={idx} className={typography.paragraph.color}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobListNormal;

