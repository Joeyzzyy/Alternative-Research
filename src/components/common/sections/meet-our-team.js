'use client';
import React from 'react';
import { LinkedinOutlined, TwitterOutlined, GlobalOutlined } from '@ant-design/icons';
import themeConfig from '../../../styles/themeConfig';

const MeetOurTeam = ({ data, theme = 'normal' }) => {
  const { typography, section } = themeConfig[theme];

  return (
    <div className={`
      ${section.background.primary} 
      ${section.padding.base}
    `}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className={`${typography.caption.color} ${typography.caption.fontSize} mb-2`}>
            {data.topContent.subtitle}
          </p>
          <h1 className={`${typography.h1.fontSize} ${typography.h1.fontWeight} ${typography.h1.color} mb-4`}>
            {data.topContent.title}
          </h1>
          <p className={`${typography.paragraph.color} text-xl max-w-2xl mx-auto`}>
            {data.topContent.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 mt-12">
          {data.bottomContent.map((member, index) => (
            <div 
              key={index} 
              className={`${section.background.secondary} rounded-lg shadow-sm overflow-hidden hover:bg-blue-50/50 transition-colors duration-200`}
            >
              <div className="aspect-w-1 aspect-h-1 relative">
                <img
                  src={member.avatarUrl}
                  alt={member.avatarAlt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 text-center">
                <h3 className={`${typography.h3.fontSize} ${typography.h3.fontWeight} ${typography.h3.color} mb-2 hover:text-primary`}>
                  {member.name}
                </h3>
                <p className={`${typography.caption.fontSize} ${typography.caption.color} mb-4`}>
                  {member.title}
                </p>
                <p className={`${typography.paragraph.color} mb-6 text-sm leading-relaxed whitespace-pre-line text-left`}>
                  {member.description}
                </p>
                <div className="flex justify-center space-x-6">
                  {member.socials.linkedin && (
                    <a
                      href={member.socials.linkedin}
                      className={`${typography.link.color} hover:${typography.link.hoverColor} transition-colors`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkedinOutlined className="text-xl" />
                    </a>
                  )}
                  {member.socials.twitter && (
                    <a
                      href={member.socials.twitter}
                      className={`${typography.link.color} hover:${typography.link.hoverColor} transition-colors`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <TwitterOutlined className="text-xl" />
                    </a>
                  )}
                  {member.socials.website && (
                    <a
                      href={member.socials.website}
                      className={`${typography.link.color} hover:${typography.link.hoverColor} transition-colors`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <GlobalOutlined className="text-xl" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetOurTeam;

