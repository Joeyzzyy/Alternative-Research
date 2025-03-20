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
    <footer className="bg-white relative overflow-hidden">
      {/* AI风格的背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#818cf810_0%,_transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#6366f110_0%,_transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.015]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              {data.companyName}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md">
              {data.description}
            </p>
          </div>
          
          {/* Footer Sections */}
          {data.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
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
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Icons */}
          <div className="flex flex-wrap justify-center gap-4">
            {data.socialMedia?.links && data.socialMedia.links.map((link, index) => {
              if (link && link.platform && link.url) {
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-900 transition-colors duration-200"
                  >
                    {renderSocialIcon(link.platform)}
                  </a>
                );
              }
              return null;
            })}
          </div>
          
          {/* Copyright */}
          <p className="text-sm text-gray-600">
            {data.copyright || `© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}