'use client';
import React, { forwardRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const CustomizableResearchUI = forwardRef(({}, ref) => {
  // Define testimonial data (Example data, replace with real data)
  const testimonials = [
    {
      id: 1,
      image: '/images/testimonials/customer-1.jpg', // Replace with actual image path
      quote: "AltPage.ai revolutionized our SEO strategy. The alternative pages targeting competitor weaknesses gave us the edge we needed, resulting in a 45% traffic increase.",
      avatar: '/images/zy.jpg', // Updated avatar path
      name: 'Jane Doe',
      role: 'Marketing Director, Tech Startup',
    },
    {
      id: 2,
      image: '/images/testimonials/customer-2.jpg', // Replace with actual image path
      quote: "We struggled with converting comparison shoppers. AltPage.ai's tailored landing pages significantly boosted our sign-up rate by 25%. Highly recommended!",
      avatar: '/images/youssef.jpg', // Updated avatar path
      name: 'John Smith',
      role: 'Founder, E-commerce Brand',
    },
    {
      id: 3,
      image: '/images/testimonials/customer-3.jpg', // Replace with actual image path
      quote: "Our SEM campaigns saw a dramatic improvement in lead quality and ROI after using AltPage.ai for landing pages. The +15% conversion lift speaks for itself.",
      avatar: '/images/hy.jpg', // Updated avatar path
      name: 'Alex Johnson',
      role: 'PPC Manager, Marketing Agency',
    },
    // Add more testimonials as needed (remember to update their avatar path too)
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? testimonials.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === testimonials.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Define stats data
  const stats = [
    { value: '350+', label: 'Companies using AltPage.ai' },
    { value: '5,200+', label: 'Alternative pages generated' },
    { value: '14,500+', label: 'Monthly conversions' },
  ];

  return (
    <div id="showcase-section" ref={ref} className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee15_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa15_0%,_transparent_60%)]"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
            Results That Speak Volumes
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Hear directly from customers who achieved remarkable growth with AltPage.ai.
          </p>
        </div>

        {/* Testimonial Carousel Container */}
        <div className="relative max-w-3xl mx-auto">
          {/* Carousel Inner Container - Handles Sliding */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform ease-out duration-300" 
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="flex-shrink-0 w-full">
                  <div className="bg-slate-800/50 rounded-xl shadow-lg overflow-hidden border border-slate-700/50 mx-2">
                    {/* Removed the outer md:flex container as it's less necessary without the image */}
                    {/* Removed Left Side: Image div */}
                    {/* <div className="md:flex-shrink-0"> ... </div> */}
                    
                    {/* Right Side: Content - Now takes full width */}
                    <div className="p-6 md:p-8 flex flex-col justify-between"> {/* Kept padding */}
                      {/* Top: Quote */}
                      <blockquote className="text-xl text-gray-300 mb-6 italic">
                        "{testimonial.quote}"
                      </blockquote>
                      {/* Bottom: Avatar, Name, Role */}
                      <div className="flex items-center mt-4"> {/* Added top margin for spacing */}
                        <img
                          className="h-12 w-12 rounded-full mr-4 border-2 border-cyan-500/50 object-cover"
                          src={testimonial.avatar}
                          alt={testimonial.name}
                        />
                        <div>
                          <p className="font-semibold text-white">{testimonial.name}</p>
                          <p className="text-sm text-cyan-400">{testimonial.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Arrow */}
          <button 
            onClick={goToPrevious} 
            className="absolute top-1/2 left-[-20px] md:left-[-40px] transform -translate-y-1/2 bg-slate-700/50 hover:bg-slate-600/70 text-white p-2 rounded-full z-20 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={goToNext} 
            className="absolute top-1/2 right-[-20px] md:right-[-40px] transform -translate-y-1/2 bg-slate-700/50 hover:bg-slate-600/70 text-white p-2 rounded-full z-20 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>

          {/* Optional: Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full ${currentIndex === index ? 'bg-cyan-400' : 'bg-slate-600/50 hover:bg-slate-500/50'} transition-colors`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 pt-16 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-400 text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

CustomizableResearchUI.displayName = 'CustomizableResearchUI';

export default CustomizableResearchUI;