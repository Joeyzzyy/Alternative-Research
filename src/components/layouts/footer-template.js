"use client";

import { FaFacebook, FaDiscord, FaXTwitter, FaYoutube, FaLinkedin, FaInstagram, FaGithub, FaTiktok, FaPinterest, FaReddit, FaTwitch, FaWeibo, FaWhatsapp, FaTelegram, FaMedium, FaSnapchat } from 'react-icons/fa6';
import { useEffect, useState } from 'react';

export default function Footer({ data }) {
  useEffect(() => {
    console.log('Footer socialMedia data:', data?.socialMedia);
  }, [data]);

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
    return <Icon className="h-6 w-6" />;
  };

  const footerStyles = {
    container: {
      width: '80%',
      margin: '0 auto',
      padding: '3rem 0'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: data?.sections 
        ? `1fr ${data.sections.map(() => '0.8fr').join(' ')}`
        : '1fr',
      gap: '2rem',
      marginBottom: '2rem'
    },
    section: {
      padding: '0 1rem'
    }
  };

  if (!data || !data.sections) {
    return null;
  }

  return (
    <footer style={{
      backgroundColor: data.styles.backgroundType === 'gradient'
        ? `linear-gradient(${data.styles.gradientAngle}deg, ${data.styles.gradientStart}, ${data.styles.gradientEnd})`
        : data.styles.backgroundColor
    }}>
      <div style={footerStyles.container}>
        <div style={footerStyles.grid}>
          <div style={footerStyles.section}>
            <h3 style={{ color: data.colors.companyName }} className="text-xl font-semibold mb-4">
              {data.companyName}
            </h3>
            <p style={{ color: data.colors.description }} className="text-sm mb-4">
              {data.description}
            </p>
          </div>
          
          {data.sections?.map((section, sectionIndex) => (
            <div key={sectionIndex} style={footerStyles.section}>
              <h4 
                style={{ color: section.colors.title }} 
                className="text-base font-semibold mb-4"
              >
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: section.colors.links }}
                      className="text-sm hover:opacity-80 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6">
            {data.socialMedia?.links && Object.entries(data.socialMedia.links).map(([key, link]) => {
              if (link && link.platform && link.url) {
                return (
                  <a
                    key={key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: data.socialMedia?.iconColor || '#9CA3AF' }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {renderSocialIcon(link.platform)}
                  </a>
                );
              }
              return null;
            })}
          </div>
          
          <p style={{ color: data.colors.copyright }} className="text-sm">
            {data.copyright || `© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}