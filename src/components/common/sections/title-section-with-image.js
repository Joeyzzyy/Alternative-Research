'use client';
import React from 'react';
import Image from 'next/image';

const TitleSectionWithImage = ({ data }) => {
  return (
    <div className="relative z-10 bg-[#E6EEFF] py-16 flex items-center">
      <header className="w-full">
        <div className="w-[85%] mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="w-full md:w-1/2 flex items-center">
              <div className="max-w-[90%]">
                <div className="mb-6">
                  <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-2">
                      {data?.leftContent?.breadcrumbs?.map((item, index) => (
                        <React.Fragment key={index}>
                          <li>
                            <a 
                              href={item.link} 
                              className="text-xs text-gray-400 hover:text-blue-600"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item.text}
                            </a>
                          </li>
                          {index < data.leftContent.breadcrumbs.length - 1 && (
                            <span className="text-xs text-gray-400">&gt;</span>
                          )}
                        </React.Fragment>
                      ))}
                    </ol>
                  </nav>
                </div>

                {data?.title && (
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {data.title}
                  </h1>
                )}
                
                {data?.subTitle && (
                  <h2 className="text-xl text-normal text-gray-700 mb-16">
                    {data.subTitle}
                  </h2>
                )}
                
                <div className="flex items-center">
                  {data?.leftContent.author && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1 font-medium">
                        Written by
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.leftContent.author}
                      </span>
                    </div>
                  )}
                  <span className="mx-6 text-gray-300 h-8 w-[1px] bg-gray-300"></span>
                  {data?.leftContent.publishDate && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1 font-medium">
                        Published on
                      </span>
                      <span className="text-sm text-gray-600">
                        {data.leftContent.publishDate}
                      </span>
                    </div>
                  )}
                  <span className="mx-6 text-gray-300 h-8 w-[1px] bg-gray-300"></span>
                  <div>
                    <span className="text-sm text-gray-600 block mb-1 font-medium">
                      Time to read
                    </span>
                    <span className="text-sm text-gray-600">
                      4 mins
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex items-center">
              <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-white">
                {data?.rightContent?.imageUrl && (
                  <Image 
                    src={data.rightContent.imageUrl}
                    alt={data.rightContent.imageAlt || ''}
                    fill
                    className="object-contain"
                    priority
                  />
                )}
              </div>  
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};

export default TitleSectionWithImage;