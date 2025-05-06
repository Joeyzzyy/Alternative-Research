"use client";

import { useEffect, useState } from 'react'; // 为将来可能的动态内容或动画预留
// import Image from 'next/image'; // 如果需要logo，可以取消注释

// 产品更新页面组件
export default function UpdatesPage() {
  const updates = [
    {
      date: { en: "May 16, 2024", zh: "2024年5月16日" },
      title: {
        en: "Enhanced First-Time User Experience & Credit System Adjustment",
        zh: "首次用户体验增强与积分系统调整"
      },
      points: [
        {
          en: "For new users, we now automatically select a relevant competitor and generate one alternative page to showcase our capabilities. Post-generation, users are guided to customize brand colors, ensuring all future content aligns perfectly with their brand identity.",
          zh: "针对新用户，我们现在会自动选择一个相关的竞品并生成一个替代页面以展示我们的能力。生成后，用户将被引导自定义品牌颜色，确保所有未来的内容都与他们的品牌形象完美对齐。"
        },
        {
          en: "The credit system has been updated: page generation now consumes 10 credits per page. This change is reflected on the invitation page and throughout the frontend. Backend systems remain unchanged for now, as this adjustment prepares for future AIGC features and their respective credit costs.",
          zh: "积分系统已更新：现在每生成一个页面将消耗10个积分。此更改已在邀请页面和整个前端反映出来。后端系统暂时保持不变，因为此调整是为未来的AIGC功能及其各自的积分成本做准备。"
        }
      ]
    },
    // 未来可以在这里添加更多更新日志 (同样需要中英双语结构)
    // {
    //   date: { en: "YYYY-MM-DD", zh: "年-月-日" },
    //   title: { en: "Another Cool Feature", zh: "另一个很酷的功能" },
    //   points: [
    //     { en: "Details about another feature.", zh: "关于另一个功能的详细信息。" },
    //     { en: "More details.", zh: "更多详情。" }
    //   ]
    // }
  ];

  return (
    // 主容器样式 - 深色主题，全高全宽
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#101317', // 深色背景，参考 research-tool 风格
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start', // 内容顶部对齐
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif', // 现代字体
      padding: '60px 24px 40px 24px', // 内容区域内边距
      color: '#E0E0E0', // 深色背景下的浅色文字
      overflowY: 'auto', // 内容超出视口时允许滚动
    }}>
      {/* 可选: Logo */}
      {/* <Image src="/images/alternatively-logo-tem.png" alt="Alternatively Logo" width={180} height={60} style={{ marginBottom: '40px' }} /> */}

      <h1 style={{
        fontSize: '2.8em', // 大号标题
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '12px',
        textAlign: 'center',
        letterSpacing: '0.5px',
        background: 'linear-gradient(90deg, #6DD5FA, #FF758C)', // 科技感渐变色标题
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textFillColor: 'transparent',
        textShadow: '0 0 15px rgba(109, 213, 250, 0.3), 0 0 25px rgba(255, 117, 140, 0.2)',
      }}>
        Product Updates
        <br />
        <span style={{ fontSize: '0.6em', fontWeight: 'normal', letterSpacing: '0.3px', color: '#C0C0C0' }}>产品更新</span>
      </h1>
      <p style={{
        fontSize: '1.1em',
        color: '#A0AEC0', // 副标题使用较浅的灰色
        marginBottom: '48px',
        textAlign: 'center',
        maxWidth: '700px',
        lineHeight: 1.6,
      }}>
        Stay informed about the latest features, improvements, and changes to altpage.ai.
        <br />
        <span style={{ fontSize: '0.9em', color: '#909AB0', display: 'inline-block', marginTop: '4px' }}>了解 altpage.ai 的最新功能、改进和变更。</span>
      </p>

      {/* 更新日志容器 */}
      <div style={{
        width: '100%',
        maxWidth: '800px', // 内容最大宽度，保证可读性
        display: 'flex',
        flexDirection: 'column',
        gap: '32px', // 更新条目之间的间距
      }}>
        {updates.map((update, index) => (
          <div key={index} style={{
            background: 'rgba(30, 35, 42, 0.85)', // 轻微透明的深色卡片
            border: '1px solid rgba(56, 66, 80, 0.7)', // 细微边框
            borderRadius: '16px', // 圆角
            padding: '28px 32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(255, 255, 255, 0.03) inset', // 科技感阴影
            backdropFilter: 'blur(8px)', // 毛玻璃效果 (可能需要浏览器前缀)
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center', // 垂直居中对齐标题和日期
              marginBottom: '18px',
              borderBottom: '1px solid rgba(56, 66, 80, 0.5)',
              paddingBottom: '16px',
            }}>
              <h2 style={{
                fontSize: '1.5em', // 更新条目标题字号
                fontWeight: 700,
                color: '#C7D2FE', // 标题使用淡紫色/蓝色
                margin: 0,
                lineHeight: 1.4,
              }}>
                {update.title.en}
                <br />
                <span style={{ fontSize: '0.75em', color: '#A0AEC0', fontWeight: 500 }}>{update.title.zh}</span>
              </h2>
              <span style={{
                fontSize: '0.8em',
                fontWeight: 500,
                color: '#8A9BB1', // 日期使用柔和的颜色
                background: 'rgba(45, 55, 72, 0.7)',
                padding: '6px 12px', // 略微增加内边距以适应两行文字
                borderRadius: '6px',
                flexShrink: 0,
                marginLeft: '16px',
                textAlign: 'center', // 日期文本居中
                lineHeight: 1.3, // 调整行高
              }}>
                {update.date.en}
                <br />
                <span style={{ fontSize: '0.9em' }}>{update.date.zh}</span>
              </span>
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              color: '#BCCCDC', // 更新点主要文本颜色
              fontSize: '1em',
              lineHeight: 1.75,
            }}>
              {update.points.map((point, pIndex) => (
                <li key={pIndex} style={{
                  marginBottom: pIndex === update.points.length - 1 ? 0 : '16px', // 略微增加点之间的间距
                  display: 'flex',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    marginRight: '12px',
                    color: '#6DD5FA', // 项目符号使用强调色
                    fontSize: '1.1em',
                    lineHeight: 1.75, // 确保与文本对齐
                    userSelect: 'none',
                    paddingTop: '1px', // 微调项目符号对齐
                  }}>
                    › {/* 使用简单的尖括号作为项目符号 */}
                  </span>
                  <div>
                    <span>{point.en}</span>
                    <br />
                    <span style={{ color: '#A0AEC0', fontSize: '0.95em', display: 'block', marginTop: '6px', lineHeight: 1.65 }}>
                      {point.zh}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 页脚或返回链接 */}
      <div style={{ marginTop: '60px', textAlign: 'center' }}>
        <a
          href="https://altpage.ai" // 根据实际情况修改链接
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#82AAFF',
            textDecoration: 'none',
            fontWeight: 600,
            padding: '12px 24px',
            border: '1.5px solid #82AAFF',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            fontSize: '0.95em',
            display: 'inline-block',
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(130, 170, 255, 0.1)'; e.currentTarget.style.color = '#A2C2FF'; e.currentTarget.style.borderColor = '#A2C2FF';}}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#82AAFF'; e.currentTarget.style.borderColor = '#82AAFF';}}
        >
          Back to altpage.ai
          <br />
          <span style={{ fontSize: '0.85em' }}>返回 altpage.ai</span>
        </a>
      </div>
    </div>
  );
}