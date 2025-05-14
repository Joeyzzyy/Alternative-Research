"use client";

import Image from 'next/image'; // 导入 Image 组件
import { useSearchParams } from 'next/navigation'; // 新增：用于读取URL参数

// 邀请页面组件
export default function InvitationPage() {
  const searchParams = useSearchParams(); // 新增
  const code = searchParams.get('c') || 'ZH1-LBYALTPAGE'; // 优先取URL参数，否则用默认

  // code和姓名的映射
  const inviterMap = {
    'ZH1-LBYALTPAGE': '朱鹤',
    'ZYALTPAGE': '朱越',
    'YFALTPAGE': 'Youssef', // 新增 Youssef 的邀请码和姓名
    'ALTPAGE-TEAM': 'Team altpage.ai',
  };
  const inviterName = inviterMap[code] || '朱鹤'; 

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#181C20',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
      padding: 0,
      margin: 0,
      position: 'relative', // 允许背景叠加
      overflow: 'hidden',
    }}>
      {/* 背景光晕装饰 */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '120vw',
        height: '120vh',
        background: 'radial-gradient(circle at 60% 40%, rgba(106,130,251,0.25) 0%, rgba(233,69,96,0.10) 60%, transparent 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%',
        maxWidth: '640px',
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1, // 保证内容在光晕之上
      }}>
        <Image
          src="/images/alternatively-logo-tem.png"
          alt="Alternatively Logo"
          width={220}
          height={74}
          priority
          style={{ margin: '0 auto 48px auto', display: 'block' }}
        />
        <div style={{
          width: '100%',
          background: 'linear-gradient(120deg, #f8fafc 60%, #e3e8f0 100%)',
          borderRadius: '32px',
          boxShadow: `
            0 8px 32px 0 rgba(37,99,235,0.10),      /* 主阴影蓝色调 */
            0 1.5px 0 0 #fff inset,                 /* 顶部高光 */
            0 0 0 1.5px #e0e7ef inset,              /* 内边框高光 */
            0 0 32px 0 rgba(106,130,251,0.10)       /* 外部柔光 */
          `,
          padding: '60px 56px 48px 56px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 顶部柔光装饰 */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '120px',
            background: 'radial-gradient(ellipse at center, rgba(106,130,251,0.18) 0%, rgba(255,255,255,0.08) 80%, transparent 100%)',
            filter: 'blur(8px)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          {/* 底部柔光装饰 */}
          <div style={{
            position: 'absolute',
            bottom: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '120px',
            background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.10) 0%, transparent 100%)',
            filter: 'blur(12px)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
          {/* 内容区 zIndex 2 保证在柔光之上 */}
          <div style={{ width: '100%', zIndex: 2, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{
              fontSize: '2em',
              fontWeight: 800,
              color: '#181C20',
              margin: 0,
              marginBottom: '18px',
              letterSpacing: '0.5px',
              lineHeight: 1.1,
            }}>
              Welcome!
            </h1>
            <div style={{
              fontSize: '1em',
              color: '#222',
              fontWeight: 500,
              textAlign: 'center',
              marginBottom: '24px',
              lineHeight: 1.7,
            }}>
              <span style={{ fontWeight: 700, color: '#181C20' }}>{inviterName}</span>
              <span> invites you to experience altpage.ai and enjoy </span>
              <span style={{
                color: '#2563eb',
                fontWeight: 800,
                fontSize: '1em',
              }}>200 credits</span>
              <span> for generating Alternative Pages for your product.</span>
              <span style={{ fontSize: '0.9em', color: '#4A5568', marginLeft: '4px' }}>
                (Can be used for approximately 20 alternative pages generation)
              </span>
            </div>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              marginBottom: '28px',
              width: '100%',
              color: '#444',
              fontSize: '0.95em',
              fontWeight: 400,
              textAlign: 'left',
              lineHeight: 1.7,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f6fa',
                border: '1.5px solid #dbeafe',
                borderRadius: '12px',
                padding: '14px 18px',
                fontWeight: 600,
                fontSize: '1em',
                boxShadow: '0 1px 4px 0 rgba(37,99,235,0.04)',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.2em',
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                    <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2"/>
                    <line x1="14.2" y1="14.2" x2="19" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                Automatically search for your competitors across the web
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f6fa',
                border: '1.5px solid #dbeafe',
                borderRadius: '12px',
                padding: '14px 18px',
                fontWeight: 600,
                fontSize: '1em',
                boxShadow: '0 1px 4px 0 rgba(37,99,235,0.04)',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.2em',
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                    <polygon points="11,2 3,12 10,12 9,18 17,8 10,8" fill="white"/>
                  </svg>
                </span>
                AI DeepResearch generates SEO-friendly altpages for your product and competitors
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f3f6fa',
                border: '1.5px solid #dbeafe',
                borderRadius: '12px',
                padding: '14px 18px',
                fontWeight: 600,
                fontSize: '1em',
                boxShadow: '0 1px 4px 0 rgba(37,99,235,0.04)',
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1.2em',
                  marginRight: 14,
                  flexShrink: 0,
                }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                    <path d="M6 15H15a3 3 0 0 0 0-6 4 4 0 1 0-7.9 1.5A3 3 0 0 0 6 15z" stroke="white" strokeWidth="2" fill="none"/>
                  </svg>
                </span>
                One-click hosting & deployment, zero manual operation
              </li>
            </ul>
            <button
              style={{
                width: '100%',
                padding: '15px 0',
                fontSize: '1em',
                color: '#fff',
                background: '#2563eb',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 700,
                letterSpacing: '0.2px',
                boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
              }}
              onClick={() => {
                window.open(`https://altpage.ai?invitation=${code}`, '_blank');
              }}
            >
              Claim Your 200 Credits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}