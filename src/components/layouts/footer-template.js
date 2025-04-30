"use client";

import Image from 'next/image';
import { FaFacebook, FaDiscord, FaXTwitter, FaYoutube, FaLinkedin, FaInstagram, FaGithub, FaTiktok, FaPinterest, FaReddit, FaTwitch, FaWeibo, FaWhatsapp, FaTelegram, FaMedium, FaSnapchat } from 'react-icons/fa6';

export default function Footer() {
  // 硬编码公司信息和版权
  const description = "AI pages that outrank, out-convert, and update themselves.";
  const copyright = "© 2025 AltPage.ai. All rights reserved.";

  // 硬编码社交媒体链接
  const socialMediaLinks = [
    { platform: "twitter", url: "https://x.com/YueZhu0719" }
    // 如果需要，可以在这里添加更多社交媒体链接
  ];

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
    // 添加其他需要的图标映射
  };

  const renderSocialIcon = (platform) => {
    const Icon = socialIcons[platform];
    if (!Icon) return null;
    return <Icon className="w-5 h-5" />;
  };

  // 新增：处理页内链接平滑滚动的函数
  const handleInternalLinkClick = (e, targetId) => {
    // 检查 targetId 是否是有效的锚点链接
    if (targetId && targetId.startsWith('#')) {
      e.preventDefault(); // 阻止默认的哈希跳转行为
      
      if (targetId === '#') {
        // 如果是 '#'，则滚动到页面顶部
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        // 尝试查找 ID 对应的元素
        const elementId = targetId.substring(1); // 移除 '#'
        const element = document.getElementById(elementId);
        if (element) {
          // 如果找到元素，平滑滚动到该元素
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // 如果未找到元素，可以在控制台输出警告，或者选择回退到默认行为
          console.warn(`Footer link target element with ID "${elementId}" not found.`);
          // 可选：如果希望在找不到元素时仍然跳转，可以取消注释下一行
          // window.location.hash = targetId; 
        }
      }
    }
    // 如果不是以 '#' 开头的链接，则不执行任何操作，允许默认行为（例如打开新标签页）
  };

  // 修改：使用硬编码的数据构建页脚链接部分
  // 结合了之前的 staticFooterSections 结构和 page.js 中的数据
  const footerSections = [
    {
      title: "Navigation", // Section Title
      links: [
        { label: "Back to Top", url: "#" }, // Internal link
        { label: "The Problem", url: "#the-problem" }, // 修改：改为内部锚点链接
        { label: "How It Works", url: "#how-it-works" }, // 修改：改为内部锚点链接
        { label: "Features", url: "#features" }, // 修改：改为内部锚点链接
        { label: "Pricing", url: "#pricing" }, // 修改：改为内部锚点链接
        { label: "FAQ", url: "#faq" }, // 修改：改为内部锚点链接
      ],
    },
    {
      title: "Resources", // Section Title from page.js
      links: [
        { label: "Generate SEO Blogs", url: "https://websitelm.com/" }, // External link
      ],
    }
    // 如果需要，可以在这里添加更多 section
  ];

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
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
          <a href="/" className="inline-block group mb-2"> {/* 添加 mb-2 调整与下方描述的间距 */}
              <Image
                src="/images/alternatively-logo-tem.png" // 使用与顶部相同的 Logo
                alt="Altpage.ai" // 使用公司名称作为 alt 文本
                width={120} // 调整 Logo 尺寸
                height={30} // 保持宽高比
                className="object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
            </a>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              {description}
            </p>
          </div>
          
          {/* Footer Sections (使用更新后的 footerSections) */}
          {footerSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => {
                  const isInternal = link.url && link.url.startsWith('#');
                  return (
                    <li key={linkIndex}>
                      <a 
                        href={link.url} 
                        onClick={isInternal ? (e) => handleInternalLinkClick(e, link.url) : undefined}
                        target={!isInternal ? "_blank" : undefined}
                        rel={!isInternal ? "noopener noreferrer" : undefined}
                        className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Social Icons (使用硬编码数据) */}
          <div className="flex flex-wrap justify-center gap-5">
            {socialMediaLinks.map((link, index) => {
              if (link && link.platform && link.url) {
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white hover:scale-110 transition-all duration-200 group"
                    aria-label={`Follow us on ${link.platform}`} // 修正模板字符串语法
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
          
          {/* Copyright (使用硬编码数据) */}
          <p className="text-sm text-gray-500">
            {copyright} {/* 直接使用硬编码的版权信息 */}
          </p>
        </div>
      </div>
    </footer>
  );
}