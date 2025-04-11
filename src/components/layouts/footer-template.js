"use client";

import { FaFacebook, FaDiscord, FaXTwitter, FaYoutube, FaLinkedin, FaInstagram, FaGithub, FaTiktok, FaPinterest, FaReddit, FaTwitch, FaWeibo, FaWhatsapp, FaTelegram, FaMedium, FaSnapchat } from 'react-icons/fa6';
import { useEffect } from 'react';

export default function Footer({ data }) {
  const socialIcons = {
    twitter: FaXTwitter,
    youtube: FaYoutube,
    linkedin: FaLinkedin,
    discord: FaDiscord,
    facebook: FaFacebook,
    instagram: FaInstagram,
    github: FaGithub,
    tiktok: FaTiktok,
    pinterest: FaPinterest,
    reddit: FaReddit,
    twitch: FaTwitch,
    whatsapp: FaWhatsapp,
    telegram: FaTelegram,
    medium: FaMedium,
    snapchat: FaSnapchat
  };

  const renderSocialIcon = (platform) => {
    const Icon = socialIcons[platform];
    if (!Icon) return null;
    return <Icon className="w-5 h-5" />;
  };

  if (!data || !data.sections) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-b from-slate-950 to-black relative overflow-hidden">
      {/* AI-style background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee10_0%,_transparent_60%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa10_0%,_transparent_60%)]"></div>

      {/* Animated particles for enhanced tech feel */}
      <div className="absolute inset-0 overflow-hidden">
        {Array(5).fill(0).map((_, i) => (
          <div 
            key={i}
            className={`absolute w-0.5 h-0.5 rounded-full \${
              i % 3 === 0 ? 'bg-cyan-500/30' : 
              i % 3 === 1 ? 'bg-purple-500/30' : 
              'bg-rose-400/30'
            }`}
            style={{
              top: `\${5 + (i * 20)}%`, 
              left: `\${10 + (i * 15)}%`,
              boxShadow: '0 0 8px 1px currentColor',
              animation: `float-y \${6 + i}s ease-in-out infinite alternate, float-x \${8 + i}s ease-in-out infinite alternate`
            }}
          ></div>
        ))}
      </div>

      {/* Top Border with Gradient */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              {data.companyName}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              {data.description}
            </p>
          </div>
          
          {/* Footer Sections */}
          {data.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Icons */}
          <div className="flex flex-wrap justify-center gap-5">
            {data.socialMedia?.links && data.socialMedia.links.map((link, index) => {
              if (link && link.platform && link.url) {
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white hover:scale-110 transition-all duration-200 group"
                    aria-label={`Follow us on \${link.platform}`}
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 blur-md bg-gradient-to-r from-cyan-500 to-purple-500 transition-opacity duration-300"></div>
                      <div className="relative">
                        {renderSocialIcon(link.platform)}
                      </div>
                    </div>
                  </a>
                );
              }
              return null;
            })}
          </div>
          
          {/* Copyright */}
          <p className="text-sm text-gray-500">
            {data.copyright || `© \${new Date().getFullYear()} \${data.companyName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}