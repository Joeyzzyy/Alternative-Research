import React, { useEffect, useRef, useState } from 'react'
import apiClient from '../../../lib/api/index.js';
import { Button, Modal, Spin, Row, Col, Pagination, Popconfirm, Input, Form, message } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';

export default function HtmlPreview({ pageId }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentEdit, setCurrentEdit] = useState({
    element: null,
    content: '',
    selector: '',
    originalContent: ''
  });
  const [saving, setSaving] = useState(false);
  // Add custom notification state
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success' // 'success', 'error', or 'info'
  });
  // Image library related state
  const [imageAssets, setImageAssets] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imagePage, setImagePage] = useState(1);
  const [imagePageSize, setImagePageSize] = useState(8);
  const [imageTotal, setImageTotal] = useState(0);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mediaName, setMediaName] = useState('');
  const [mediaDesc, setMediaDesc] = useState('');
  // 新增：用于存储页面内 section 的状态
  const [sections, setSections] = useState([]);
  // --- 新增：AI 编辑相关状态 ---
  const [editingSectionId, setEditingSectionId] = useState(null); // 当前编辑的 Section ID
  const [showEditPromptModal, setShowEditPromptModal] = useState(false); // 是否显示编辑提示 Modal
  const [editPrompt, setEditPrompt] = useState(''); // 用户输入的编辑需求
  const [originalSectionHtml, setOriginalSectionHtml] = useState(''); // 原始 Section HTML 缓存
  const [proposedSectionHtml, setProposedSectionHtml] = useState(''); // AI 建议的 Section HTML
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false); // 是否正在生成编辑建议
  const [isPreviewingEdit, setIsPreviewingEdit] = useState(false); // 是否正在预览编辑建议
  // --- AI 编辑状态结束 ---

  // Show notification and set auto-hide
  const showNotification = (message, type = 'success', duration = 3000) => {
    // The type parameter now accepts 'success', 'error', or 'info'
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: '', type: 'success' });
    }, duration);
  };

  // Fetch HTML data
  useEffect(() => {
    async function fetchHtml() {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.getPageBySlug(pageId, 'en');
        if (response.notFound) {
          setError('Page not found');
          setHtml('');
        } else if (response.code === 200 && response.data?.html) {
          setHtml(response.data.html);
        } else {
          setError('Failed to load page content');
          setHtml('');
        }
      } catch (e) {
        setError('Failed to fetch page data');
        setHtml('');
      }
      setLoading(false);
    }
    fetchHtml();
  }, [pageId]);

  // Save edited content
  async function saveContent() {
    if (!currentEdit.element) {
      showNotification('No editable element selected', 'error');
      return;
    }
    setSaving(true);
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      showNotification('Iframe document not found', 'error');
      setSaving(false);
      return;
    }

    try {
      if (currentEdit.element.tagName.toLowerCase() === 'img') {
        currentEdit.element.setAttribute('src', currentEdit.content);
      } else {
        currentEdit.element.textContent = currentEdit.content;
      }

      const updatedHtml = doc.documentElement.outerHTML;

      await apiClient.editAlternativeHtml({
        html: updatedHtml,
        resultId: pageId,
      });

      setShowSidebar(false);
      showNotification('Saved successfully', 'success');
    } catch (e) {
      console.error('Save failed:', e);
      showNotification('Save failed', 'error');
    }
    setSaving(false);
  }

  // Sidebar close
  function closeSidebar() {
    setShowSidebar(false);
    setCurrentEdit({
      element: null,
      content: '',
      selector: '',
      originalContent: ''
    });
  }

  // Render HTML to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && html) {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // 写入 HTML 内容
      doc.open();
      doc.write(html);
      doc.close();

      // 等待 iframe 内容完全加载和渲染 (使用 setTimeout 是一种简单方式，更健壮的方式可能需要监听 load 事件)
      const timeoutId = setTimeout(() => {
        if (!iframe.contentDocument) return; // 检查 doc 是否仍然有效
        const doc = iframe.contentDocument;

        // 设置可编辑区域鼠标样式
        // 先移除旧的 style
        const oldStyle = doc.getElementById('page-edit-cursor-style');
        if (oldStyle) oldStyle.remove();

        // 注入样式：有canEdit属性、img、独立文字区域显示pointer
        const style = doc.createElement('style');
        style.id = 'page-edit-cursor-style';
        style.innerHTML = `
          [canEdit], img {
            cursor: pointer !important;
          }
          /* 独立文字区域：只有一个文本节点且有内容 */
          *:not([canEdit]):not(img) {
            cursor: inherit;
          }
          /* 平滑滚动 */
          html {
            scroll-behavior: smooth;
          }
        `;
        doc.head.appendChild(style);

        // 额外处理独立文字区域
        Array.from(doc.body.querySelectorAll('*')).forEach(node => {
          if (
            !node.hasAttribute?.('canEdit') &&
            node.tagName.toLowerCase() !== 'img' &&
            node.childNodes.length === 1 &&
            node.childNodes[0].nodeType === 3 && // TEXT_NODE
            node.textContent.trim().length > 0
          ) {
            node.style.cursor = 'pointer';
          }
        });

        // --- 新增：提取 Sections ---
        const sectionElements = doc.querySelectorAll('section');
        const extractedSections = Array.from(sectionElements).map((section, index) => {
          // 确保每个 section 都有一个 ID，用于后续滚动定位
          if (!section.id) {
            section.id = `page-section-${index}`;
          }
          // 尝试获取一个有意义的标签
          const label = section.getAttribute('aria-label') ||
                        section.getAttribute('data-label') ||
                        section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent ||
                        `Section ${index + 1}`;
          return {
            id: section.id,
            label: label.trim(),
          };
        });
        setSections(extractedSections);
        // --- 提取 Sections 结束 ---

      }, 100); // 延迟 100ms 确保 DOM 准备好

      // 清理 timeout
      return () => clearTimeout(timeoutId);
    }
  }, [html]); // 依赖 html

  // 新增：iframe内容加载后，绑定点击事件
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    // 先移除旧的事件监听，避免重复绑定
    doc.removeEventListener('click', handleIframeClick, true);

    // 处理iframe内的点击事件
    function handleIframeClick(e) {
      e.preventDefault();
      e.stopPropagation();

      // 优先查找canEdit属性的元素
      let el = e.target;
      let canEditEl = null;
      while (el && el !== doc.body) {
        if (el.hasAttribute && el.hasAttribute('canEdit')) {
          canEditEl = el;
          break;
        }
        el = el.parentNode;
      }

      if (canEditEl) {
        // 可编辑元素
        setCurrentEdit({
          element: canEditEl,
          content: canEditEl.tagName.toLowerCase() === 'img' ? canEditEl.getAttribute('src') : canEditEl.textContent,
          selector: '', // 可选：可生成唯一选择器
          originalContent: canEditEl.tagName.toLowerCase() === 'img' ? canEditEl.getAttribute('src') : canEditEl.textContent
        });
        setShowSidebar(true);
        return;
      }

      // 没有canEdit属性，判断是否是独立的文字或图片区域
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'img') {
        setCurrentEdit({
          element: e.target,
          content: e.target.getAttribute('src'),
          selector: '',
          originalContent: e.target.getAttribute('src')
        });
        setShowSidebar(true);
        return;
      }
      // 判断是否是独立的文字节点（无子元素，且有文本内容）
      if (
        e.target.childNodes.length === 1 &&
        e.target.childNodes[0].nodeType === 3 && // TEXT_NODE
        e.target.textContent.trim().length > 0
      ) {
        setCurrentEdit({
          element: e.target,
          content: e.target.textContent,
          selector: '',
          originalContent: e.target.textContent
        });
        setShowSidebar(true);
        return;
      }

      // 其他情况，弹出提示
      showNotification({
        message: 'All text and image areas on the page can be edited by clicking them.',
        duration: 2
      });
    }

    doc.addEventListener('click', handleIframeClick, true);

    // 清理事件
    return () => {
      doc.removeEventListener('click', handleIframeClick, true);
    };
  }, [html]);

  // Fetch image list
  async function fetchImageAssets(page = 1, pageSize = 8) {
    setImageLoading(true);
    try {
      const customerId = localStorage.getItem('currentCustomerId');
      const response = await apiClient.getMedia(customerId, 'image', null, page, pageSize);
      if (response.data) {
        setImageAssets(response.data.map(item => ({
          id: item.mediaId,
          name: item.mediaName,
          url: item.mediaUrl
        })));
        setImageTotal(response.TotalCount);
      }
    } catch (e) {
      message.error('Failed to load images');
    } finally {
      setImageLoading(false);
    }
  }

  // Load when opening the image library
  useEffect(() => {
    if (showImageLibrary) {
      fetchImageAssets(imagePage, imagePageSize);
    }
    // eslint-disable-next-line
  }, [showImageLibrary, imagePage, imagePageSize]);

  // Upload image
  async function handleUpload() {
    if (!uploadFile || !mediaName) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('customerId', localStorage.getItem('currentCustomerId'));
      formData.append('mediaType', 'image');
      formData.append('mediaName', mediaName);
      formData.append('description', mediaDesc || '');
      formData.append('categoryName', 'media');
      const response = await apiClient.uploadMedia(formData);
      if (response.code !== 200) {
        message.error(response.message || 'Upload failed');
        return;
      }
      message.success('Upload successful');
      setUploadModalVisible(false);
      setUploadFile(null);
      setPreviewUrl('');
      setMediaName('');
      setMediaDesc('');
      fetchImageAssets(imagePage, imagePageSize);
    } catch (e) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Delete image
  async function handleDeleteImage(asset) {
    try {
      await apiClient.deleteMedia(asset.id);
      setImageAssets(imageAssets.filter(item => item.id !== asset.id));
      message.success('Image deleted successfully');
    } catch (e) {
      message.error('Failed to delete image');
    }
  }

  // --- 新增：滚动到指定 Section ---
  function scrollToSection(sectionId) {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;
    const element = doc.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 可选：添加短暂高亮效果
      element.style.transition = 'outline 0.1s ease-in-out';
      element.style.outline = '3px solid #38bdf8'; // 使用主题色高亮
      setTimeout(() => {
        if (element) element.style.outline = 'none';
      }, 1500); // 1.5秒后移除高亮
    } else {
      console.warn(`Section with id "${sectionId}" not found in iframe.`);
    }
  }

  // --- 新增：处理点击 AI 编辑按钮 (提前获取原始 HTML) ---
  function handleInitiateEdit(sectionId) {
    if (isPreviewingEdit || isGeneratingEdit) return;

    // 3. 提前获取原始 HTML 以便在 Modal 中显示
    const iframe = iframeRef.current;
    let currentOriginalHtml = '';
    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument;
      const element = doc.getElementById(sectionId);
      if (element) {
        currentOriginalHtml = element.outerHTML;
      } else {
        message.error(`Section with id "${sectionId}" not found in iframe.`);
        return; // 获取失败则不打开 Modal
      }
    } else {
      message.error('Iframe content is not accessible.');
      return; // 获取失败则不打开 Modal
    }

    setEditingSectionId(sectionId);
    setEditPrompt('');
    setOriginalSectionHtml(currentOriginalHtml); // 设置原始 HTML 状态
    setProposedSectionHtml('');
    setShowEditPromptModal(true); // 打开 Modal
  }

  // --- 新增：处理取消编辑提示 Modal ---
  function handleCancelEditPrompt() {
    setShowEditPromptModal(false);
    setEditingSectionId(null); // 重置编辑中的 section
    setEditPrompt('');
    // 不需要重置 originalSectionHtml 或 proposedSectionHtml，因为它们在 initiate 时已清空
  }

  // --- 新增：处理生成编辑请求 (使用已缓存的原始 HTML) ---
  async function handleGenerateEdit() {
    // 使用新的 info 类型显示提示信息
    showNotification('AI Edit feature coming soon!', 'info', 2000); // Changed type to 'info' and duration
    return; // Keep the return here for now

    if (!editPrompt.trim() || !editingSectionId) {
      message.warn('Please enter your edit requirements.');
      return;
    }

    // 检查 originalSectionHtml 是否已成功获取
    if (!originalSectionHtml) {
        message.error('Original section HTML is missing. Cannot proceed.');
        handleCancelEditPrompt(); // 关闭 Modal 并重置
        return;
    }

    setIsGeneratingEdit(true);

    // 2. 调用 API (Mockup)
    try {
      console.log('Sending to API:');
      console.log('Prompt:', editPrompt);
      // 使用 state 中的 originalSectionHtml
      console.log('Original HTML:', originalSectionHtml.substring(0, 100) + '...');

      // --- MOCK API CALL ---
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockApiResponse = {
        success: true,
        newHtml: `<!-- AI Edit Start -->\n<div style="border: 2px dashed limegreen; padding: 10px; margin: 5px 0; background: rgba(144, 238, 144, 0.1);">\n<p style="color: limegreen; font-weight: bold; margin-bottom: 8px;">AI Generated Content based on: "${editPrompt}"</p>\n${originalSectionHtml}\n</div>\n<!-- AI Edit End -->`, // 稍微美化 mock 输出
      };
      // --- END MOCK API CALL ---

      if (mockApiResponse.success && mockApiResponse.newHtml) {
        setProposedSectionHtml(mockApiResponse.newHtml);
        setShowEditPromptModal(false);
        message.success('AI suggestion generated! Entering preview mode.');
        startPreviewingEdit(editingSectionId, mockApiResponse.newHtml);
      } else {
        throw new Error(mockApiResponse.error || 'Failed to generate edit from API.');
      }

    } catch (error) {
      console.error('Error generating AI edit:', error);
      message.error(`Error: ${error.message}`);
      // 出错时不关闭 Modal，允许用户修改提示或重试
      // handleCancelEditPrompt();
    } finally {
      setIsGeneratingEdit(false);
    }
  }

  // --- 新增：开始预览编辑 --- (后续实现具体逻辑)
  function startPreviewingEdit(sectionId, newHtml) {
    console.log(`Starting preview for section ${sectionId}`);
    // 1. 在 iframe 中找到对应元素
    // 2. 临时替换 innerHTML 或 outerHTML
    // 3. 添加高亮样式
    // 4. 显示 Accept/Discard 按钮
    setIsPreviewingEdit(true); // 设置预览状态
    // 实际的 DOM 操作将在下一个
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#18181c', display: 'flex', flexDirection: 'column', position: 'relative' /* Add relative positioning for absolutely positioned notification */ }}>
      {/* Custom Notification */}
      {notification.visible && (
        <div style={{
          position: 'fixed', // or 'absolute' if parent container is relative
          top: '70px', // Adjust position to avoid overlapping the top bar
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          // 更新背景颜色逻辑以包含 'info' 类型
          background: notification.type === 'success'
            ? '#4caf50' // Success green
            : notification.type === 'error'
              ? '#f44336' // Error red
              : '#ffc107', // Info yellow (e.g., Amber 500)
          color: notification.type === 'info' ? '#1f2937' : 'white', // Info 类型使用深色文字以提高对比度
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 9999, // Increase zIndex significantly
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {notification.message}
        </div>
      )}

      {/* Top Bar - Updated Style */}
      <div style={{
        height: 56,
        // background: 'linear-gradient(90deg, #232c5b 0%, #3a225a 100%)', // Old background
        background: '#1f2937', // Updated background (slate-800)
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: 1,
        boxShadow: '0 2px 8px #0004',
        zIndex: 10,
        justifyContent: 'space-between'
      }}>
        <div>
          Page Editor
          <span style={{ fontWeight: 400, fontSize: 16, marginLeft: 24, color: '#e0e7ef' }}>
            (PageId: {pageId})
          </span>
        </div>
      </div>
      {/* Edit Mode Hint (Always visible) - 更明显的提示 */}
      <div style={{
        background: '#f59e42', // 更亮的橙色背景
        color: '#18181c',      // 深色字体
        padding: '10px 32px',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 700,       // 加粗
        letterSpacing: 1,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        zIndex: 9,
        borderBottom: '2px solid #fbbf24', // 底部加一条亮色线
        textShadow: '0 1px 0 #fff8',       // 字体加一点点阴影提升可读性
        userSelect: 'none'
      }}>
        <span style={{ fontSize: 17, fontWeight: 900, marginRight: 8, verticalAlign: 'middle' }}>🖱️</span>
        <span>
          Click any <span style={{ textDecoration: 'underline', fontWeight: 900 }}>text</span> or <span style={{ textDecoration: 'underline', fontWeight: 900 }}>image</span> area to edit.<br />
          All clickable areas will show a <span style={{ color: '#d97706', fontWeight: 900 }}>pointer cursor</span>.<br />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginTop: 4, display: 'inline-block' }}>
            After editing, your changes will be <span style={{ textDecoration: 'underline', fontWeight: 900 }}>saved automatically</span>! No need to save manually.
          </span>
        </span>
      </div>
      {/* Page Rendering Area - 修改为 Flex 布局 */}
      <div style={{ flex: 1, background: '#18181c', display: 'flex', overflow: 'hidden' /* 防止内部滚动影响外部 */ }}>

        {/* --- 新增：左侧 Section 导航栏 --- */}
        {sections.length > 0 && (
          <div style={{
            width: 200, // 侧边栏宽度
            background: '#111827', // 深色背景 (slate-900)
            padding: '16px 8px',
            overflowY: 'auto', // 如果内容过多则允许滚动
            borderRight: '1px solid #374151', // 右边框 (slate-700)
            display: 'flex',
            flexDirection: 'column',
            gap: '8px', // 导航项之间的间距
          }}>
            <div style={{
              color: '#9ca3af', // 标题颜色 (slate-400)
              fontSize: 14,
              fontWeight: 600,
              padding: '0 8px 8px 8px', // 内边距
              borderBottom: '1px solid #374151', // 分隔线
              marginBottom: 8,
              textTransform: 'uppercase', // 大写
              letterSpacing: '0.5px', // 字间距
            }}>
              Sections
            </div>
            {sections.map(section => (
              <div key={section.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}> {/* 包裹按钮和编辑图标 */}
                <button
                  // key={section.id} // key 移到父元素
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#d1d5db', // 默认文字颜色 (slate-300)
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    // width: '100%', // 不再是 100% 宽度，让编辑按钮有空间
                    flexGrow: 1, // 占据剩余空间
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#374151'; e.currentTarget.style.color = '#fff'; }} // 悬停效果 (slate-700)
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d1d5db'; }}
                  title={section.label} // 添加 title 以显示完整标签
                  disabled={isPreviewingEdit} // 预览时禁用导航点击
                >
                  {section.label}
                </button>
                {/* --- 更新：AI 编辑按钮 --- */}
                <Button
                  type="text" // 或者 type="default" 如果想要更明显的按钮
                  // icon={<span role="img" aria-label="AI Edit">✨</span>} // 旧图标
                  icon={<EditOutlined />} // 使用 Ant Design 图标
                  size="small"
                  onClick={() => handleInitiateEdit(section.id)}
                  style={{
                    color: '#9ca3af',
                    padding: '0 6px', // 稍微调整内边距
                    // 如果使用 type="default"，可以添加背景色和边框
                    // background: '#374151',
                    // border: '1px solid #4b5563',
                  }}
                  title={`AI Edit Section: ${section.label}`}
                  disabled={isPreviewingEdit || isGeneratingEdit} // 预览或生成时禁用
                >
                  {/* 可以选择性地添加文字 */}
                  {/* AI Edit */}
                </Button>
                {/* --- AI 编辑按钮结束 --- */}
              </div>
            ))}
          </div>
        )}
        {/* --- Section 导航栏结束 --- */}

        {/* Iframe 容器 - 占据剩余空间 */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflow: 'hidden', position: 'relative' /* 为预览控件定位 */ }}>
          {loading ? (
            <div style={{ color: '#a5b4fc', fontSize: 22, fontWeight: 500 }}>Loading...</div>
          ) : error ? (
            <div style={{ color: '#f87171', fontSize: 20, fontWeight: 500 }}>{error}</div>
          ) : (
            <iframe
              ref={iframeRef}
              style={{
                width: '100%', // 宽度占满容器
                height: '100%', // 高度占满容器
                border: '1px solid #334155',
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 4px 32px #0006'
              }}
              sandbox="allow-same-origin allow-scripts"
              title="Page Preview"
              // onLoad 事件可能更适合执行 DOM 操作，但这里我们继续使用 useEffect + setTimeout
              // onLoad={() => { /* 可以在这里执行 section 提取 */ }}
            />
          )}
        </div>
        {/* Edit Sidebar - Updated Style */}
        {showSidebar && (
          <div style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 600,
              // background: '#23233a', // Old background
              background: '#1f2937', // Updated background (slate-800)
              color: '#e5e7eb', // Lighter text color for dark background
              borderRadius: 12,
              boxShadow: '0 8px 32px #0008',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16, color: '#fff' }}> {/* Ensure title is white */}
                {currentEdit.element?.tagName === 'IMG' ? 'Edit Image Source' : 'Edit Content'}
              </div>
              <div style={{ marginBottom: 16, flexGrow: 1, overflowY: 'auto' }}> {/* Allow content to scroll if needed */}
                {currentEdit.element?.tagName === 'IMG' ? (
                  <>
                    <textarea
                      value={currentEdit.content}
                      onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: '1px solid #4b5563', // Updated border (slate-600)
                        padding: 12,
                        fontSize: 16,
                        background: '#111827', // Updated background (slate-900)
                        color: '#e5e7eb', // Updated text color
                        fontFamily: 'monospace'
                      }}
                      placeholder="Enter image URL or select an image"
                    />
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        style={{
                          // background: '#38bdf8', // Old background
                          background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)', // Updated background (cyan to purple gradient)
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 18px', // Adjusted padding
                          fontWeight: 600, // Increased font weight
                          fontSize: 15,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s ease',
                          boxShadow: '0 2px 8px #38bdf899', // Added shadow
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        onClick={() => setShowImageLibrary(true)}
                      >Select/Upload Image</button>
                    </div>
                    {/* Image Preview */}
                    {currentEdit.content && (
                      <div style={{ marginTop: 16, textAlign: 'center', background: '#374151', padding: 8, borderRadius: 8 }}> {/* Added background for better contrast */}
                        <img src={currentEdit.content} alt="Preview" style={{ maxWidth: 320, maxHeight: 180, borderRadius: 4, display: 'block', margin: 'auto' }} />
                      </div>
                    )}
                    {/* Image Library Modal - Updated Style */}
                    <Modal
                      open={showImageLibrary}
                      title={<span style={{ color: '#e5e7eb' }}>Image Library</span>} // Title color
                      onCancel={() => setShowImageLibrary(false)}
                      footer={null}
                      width={800}
                      styles={{
                        body: { background: '#1f2937', minHeight: 400, color: '#e5e7eb' }, // Dark body, light text
                        header: {
                          background: '#1f2937', // Match body background
                          borderBottom: '1px solid #374151', // Keep border for separation
                          color: '#e5e7eb'
                        },
                        content: { background: '#1f2937', color: '#e5e7eb' }, // Dark content area
                      }}
                      className="dark-modal" // Add class for potential global styling
                    >
                      <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          onClick={() => setUploadModalVisible(true)}
                          style={{
                            background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)', // Gradient background
                            border: 'none',
                            boxShadow: '0 2px 8px #38bdf899',
                          }}
                        >
                          Upload Image
                        </Button>
                      </div>
                      <Spin spinning={imageLoading} tip={<span style={{ color: '#9ca3af' }}>Loading Images...</span>}> {/* Tip color */}
                        {imageAssets.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}> {/* Text color */}
                            <h3>No Images Yet</h3>
                            <p>Please upload images first</p>
                          </div>
                        ) : (
                          <>
                            <Row gutter={[16, 16]}>
                              {imageAssets.map(asset => (
                                <Col xs={24} sm={12} md={8} lg={6} key={asset.id}>
                                  <div
                                    style={{
                                      background: '#374151', // Card background (slate-700)
                                      border: '1px solid #4b5563', // Card border (slate-600)
                                      borderRadius: 12, // Rounded corners
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      transition: 'all 0.3s',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Subtle shadow
                                    }}
                                    onClick={() => {
                                      setCurrentEdit({ ...currentEdit, content: asset.url });
                                      setShowImageLibrary(false);
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#38bdf8'} // Highlight on hover
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#4b5563'} // Restore border on leave
                                  >
                                    <div style={{
                                      height: 120, // Fixed height for image container
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#1f2937', // Image area background (slate-800)
                                      position: 'relative' // For positioning delete button
                                    }}>
                                      <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                                        <Popconfirm
                                          title={<span style={{ color: '#e5e7eb' }}>Are you sure you want to delete this image?</span>} // Text color
                                          onConfirm={e => { e.stopPropagation(); handleDeleteImage(asset); }}
                                          onClick={e => e.stopPropagation()} // Prevent card click when clicking popconfirm area
                                          okButtonProps={{ danger: true, style: { background: '#dc2626' } }} // Style OK button (red)
                                          cancelButtonProps={{ style: { background: '#4b5563', color: '#fff', border: 'none' } }} // Style Cancel button (slate)
                                        >
                                          {/* Styled delete button */}
                                          <Button
                                            type="primary"
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            style={{ background: 'rgba(220, 38, 38, 0.8)', border: 'none' }} // Semi-transparent red
                                            onClick={e => e.stopPropagation()} // Prevent card click when clicking button
                                          />
                                        </Popconfirm>
                                      </div>
                                    </div>
                                    <div style={{ padding: '8px 12px' }}> {/* Padding for text below image */}
                                      <div style={{
                                        fontSize: 13,
                                        color: '#e5e7eb', // Text color (light gray)
                                        whiteSpace: 'nowrap', // Prevent wrapping
                                        overflow: 'hidden', // Hide overflow
                                        textOverflow: 'ellipsis', // Add ellipsis for long names
                                        fontWeight: 500, // Slightly bolder text
                                      }}>{asset.name}</div>
                                    </div>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                              <Pagination
                                current={imagePage}
                                total={imageTotal}
                                pageSize={imagePageSize}
                                showSizeChanger
                                onChange={(page, size) => {
                                  setImagePage(page);
                                  setImagePageSize(size);
                                }}
                                // Custom renderer for dark theme pagination
                                itemRender={(current, type, originalElement) => {
                                  const baseStyle = { border: 'none', margin: '0 4px' }; // Add margin between buttons
                                  if (type === 'prev' || type === 'next') {
                                    // Style for Prev/Next buttons
                                    return <Button style={{ ...baseStyle, background: '#374151', color: '#9ca3af' }}>{originalElement}</Button>;
                                  }
                                  if (type === 'page') {
                                    // Style for page number buttons
                                    const isActive = current === imagePage;
                                    return <Button style={{
                                      ...baseStyle,
                                      background: isActive ? '#38bdf8' : '#374151', // Active: cyan, Inactive: slate
                                      color: isActive ? '#fff' : '#9ca3af', // Active: white, Inactive: gray
                                      fontWeight: isActive ? 'bold' : 'normal' // Bold for active page
                                    }}>{current}</Button>;
                                  }
                                  // For 'jump-prev', 'jump-next' (ellipsis)
                                  return <span style={{ color: '#9ca3af', margin: '0 4px' }}>{originalElement}</span>;
                                }}
                              />
                            </div>
                          </>
                        )}
                      </Spin>
                      {/* Upload Image Modal - Styles already updated */}
                      <Modal
                        open={uploadModalVisible}
                        title={<span style={{ color: '#e5e7eb' }}>Upload Image</span>} // Title color
                        onCancel={() => setUploadModalVisible(false)}
                        onOk={handleUpload}
                        okText={uploading ? 'Uploading...' : 'Upload'} // Dynamic OK text
                        okButtonProps={{
                          disabled: !uploadFile || !mediaName || uploading,
                          loading: uploading,
                          style: {
                            background: (!uploadFile || !mediaName) ? '#4b5563' : 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)', // Conditional background
                            border: 'none',
                            boxShadow: (!uploadFile || !mediaName) ? 'none' : '0 2px 8px #38bdf899',
                          }
                        }}
                        cancelButtonProps={{
                          style: { background: '#4b5563', color: '#fff', border: 'none' } // Style Cancel button
                        }}
                        destroyOnClose
                        styles={{ // Apply dark theme to upload modal too
                          body: { background: '#1f2937', color: '#e5e7eb' },
                          header: { background: '#111827', borderBottom: '1px solid #374151', color: '#e5e7eb' },
                          content: { background: '#1f2937', color: '#e5e7eb' },
                        }}
                        className="dark-modal"
                      >
                        {!uploadFile ? (
                          <div
                            style={{
                              border: '2px dashed #4b5563', // Updated border color
                              borderRadius: 8,
                              padding: 32,
                              textAlign: 'center',
                              cursor: 'pointer',
                              background: '#111827', // Darker background for drop zone
                              color: '#9ca3af' // Text color
                            }}
                            onClick={() => document.getElementById('image-upload-input').click()}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#38bdf8'; }} // Highlight on drag over
                            onDragLeave={e => e.currentTarget.style.borderColor = '#4b5563'}
                            onDrop={e => {
                              e.preventDefault();
                              e.currentTarget.style.borderColor = '#4b5563'; // Reset border color
                              const file = e.dataTransfer.files[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  message.error('File size cannot exceed 1MB');
                                  return;
                                }
                                setUploadFile(file);
                                setPreviewUrl(URL.createObjectURL(file));
                                setMediaName(file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_'));
                              }
                            }}
                          >
                            <UploadOutlined style={{ fontSize: 32, color: '#38bdf8', marginBottom: 8 }} />
                            <p>Click or drag file to upload</p>
                            <p style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Supports JPG, PNG, WebP formats (Max 1MB)</p>
                            <input
                              type="file"
                              id="image-upload-input"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 1024 * 1024) {
                                    message.error('File size cannot exceed 1MB');
                                    return;
                                  }
                                  setUploadFile(file);
                                  setPreviewUrl(URL.createObjectURL(file));
                                  setMediaName(file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_'));
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <>
                            <div style={{ textAlign: 'center', marginBottom: 16, background: '#374151', padding: 8, borderRadius: 8 }}> {/* Added background */}
                              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
                            </div>
                            <Input
                              value={mediaName}
                              onChange={e => setMediaName(e.target.value)}
                              placeholder="Enter file name"
                              maxLength={50}
                              style={{ marginBottom: 12, background: '#111827', color: '#e5e7eb', border: '1px solid #4b5563' }} // Dark input
                              placeholderTextColor="#6b7280" // Placeholder color
                            />
                            <Input.TextArea
                              value={mediaDesc}
                              onChange={e => setMediaDesc(e.target.value)}
                              placeholder="Enter description (optional)"
                              maxLength={200}
                              rows={3}
                              style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #4b5563' }} // Dark textarea
                              placeholderTextColor="#6b7280" // Placeholder color
                            />
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                              <Button type="primary" danger onClick={() => {
                                setUploadFile(null);
                                setPreviewUrl('');
                                setMediaName('');
                                setMediaDesc('');
                              }} icon={<DeleteOutlined />} style={{ background: '#dc2626' }}> {/* Red background */}
                                Remove
                              </Button>
                            </div>
                          </>
                        )}
                      </Modal>
                    </Modal>
                  </>
                ) : (
                  <textarea
                    value={currentEdit.content}
                    onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                    rows={6}
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid #4b5563', // Updated border (slate-600)
                      padding: 12,
                      fontSize: 16,
                      background: '#111827', // Updated background (slate-900)
                      color: '#e5e7eb', // Updated text color
                      fontFamily: 'monospace'
                    }}
                    placeholder="Enter content"
                  />
                )}
              </div>
              {/* Sidebar Buttons - Updated Style */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #374151' }}> {/* Added top border */}
                <button
                  onClick={closeSidebar}
                  style={{
                    // background: '#64748b', // Old background (slate)
                    background: '#4b5563', // Updated background (slate-600)
                    color: '#e5e7eb', // Updated text color
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontWeight: 500,
                    fontSize: 16,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#6b7280'} // Hover effect
                  onMouseOut={e => e.currentTarget.style.background = '#4b5563'}
                >Cancel</button>
                <button
                  onClick={saveContent}
                  disabled={saving}
                  style={{
                    // background: '#38bdf8', // Old background
                    background: saving ? '#374151' : 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)', // Updated background (cyan to purple gradient)
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: saving ? 'not-allowed' : 'pointer', // Cursor change when disabled
                    opacity: saving ? 0.6 : 1,
                    transition: 'background-color 0.2s ease, opacity 0.2s ease',
                    boxShadow: saving ? 'none' : '0 2px 8px #38bdf899', // Added shadow
                  }}
                >{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- 更新：AI 编辑需求输入 Modal (浅色主题，更大尺寸) --- */}
      <Modal
        title={
          <span style={{ color: '#1f2937' /* 深灰色文字 (slate-800) */, fontWeight: 600 }}>
            AI Edit Section: {sections.find(s => s.id === editingSectionId)?.label || ''}
          </span>
        }
        open={showEditPromptModal}
        onCancel={handleCancelEditPrompt}
        onOk={handleGenerateEdit}
        okText="Feature Coming Soon"
        cancelText="Cancel"
        confirmLoading={isGeneratingEdit}
        okButtonProps={{
          disabled: !editPrompt.trim() || isGeneratingEdit,
          style: {
             // 保持渐变色，但禁用状态用浅灰色
             background: (!editPrompt.trim() || isGeneratingEdit) ? '#e5e7eb' : 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
             borderColor: (!editPrompt.trim() || isGeneratingEdit) ? '#d1d5db' : '#38bdf8',
             color: (!editPrompt.trim() || isGeneratingEdit) ? '#6b7280' : '#ffffff', // 禁用时文字灰色
             opacity: 1, // 不再需要透明度
          }
        }}
        cancelButtonProps={{
             // 浅色主题的取消按钮
             style: { background: '#f3f4f6' /* 更浅的灰色 (gray-100) */, color: '#374151' /* 深灰文字 (slate-700) */, border: '1px solid #d1d5db' /* 边框 (gray-300) */ }
        }}
        destroyOnClose
        width={800} // 1. 再次加大 Modal 宽度
        zIndex={1050} // Explicitly set zIndex lower than notification
        closeIcon={
          <CloseOutlined style={{ color: '#6b7280' /* 中灰色图标 (gray-500) */, fontSize: 16 }} />
        }
        styles={{
          mask: { backdropFilter: 'blur(1px)' }, // 稍微降低模糊
          header: {
            background: '#f9fafb', // 页头背景 (非常浅的灰色 gray-50)
            borderBottom: '1px solid #e5e7eb', // 分割线 (gray-200)
            padding: '16px 24px',
          },
          body: {
            background: '#ffffff', // 主体背景 (白色)
            color: '#1f2937', // 默认文字颜色 (深灰色 slate-800)
            padding: '24px',
            minHeight: '50vh', // 1. 增加最小高度，使其更高
            maxHeight: '75vh', // 允许的最大高度
            overflowY: 'auto',
          },
          content: {}, // 继承 body
          footer: {
            background: '#f9fafb', // 页脚背景 (非常浅的灰色 gray-50)
            borderTop: '1px solid #e5e7eb', // 分割线 (gray-200)
            padding: '12px 24px',
            textAlign: 'right',
          }
        }}
        // className="dark-modal" // 移除或替换为 light-modal 类
      >
        <p style={{ marginBottom: 16, color: '#374151' /* 深灰文字 (slate-700) */, fontSize: '14px' }}>
          Describe the changes you want AI to make to this section:
        </p>
        <Input.TextArea
          rows={8} // 增加行数
          placeholder="e.g., Change the background to dark blue, add a 'Learn More' button linking to #, and increase the main title font size."
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          style={{
            background: '#f9fafb', // 输入框背景 (非常浅的灰色 gray-50)
            color: '#111827', // 输入文字颜色 (接近黑色 slate-900)
            border: '1px solid #d1d5db', // 边框颜色 (gray-300)
            fontSize: '14px',
          }}
          // 对于浅色背景，placeholder 通常会自动是灰色，如果需要特定颜色:
          // className="light-textarea-placeholder"
          // CSS: .light-textarea-placeholder::placeholder { color: #9ca3af; }
          disabled={isGeneratingEdit}
        />
        {/* 3. 默认展开原始 HTML 片段预览 */}
        <details style={{ marginTop: 24 }} open> {/* 添加 open 属性 */}
          <summary style={{ cursor: 'pointer', color: '#6b7280' /* 中灰色 (gray-500) */, fontSize: '13px', userSelect: 'none', marginBottom: '8px' /* 增加与代码块间距 */ }}>
            Original HTML {/* 移除 Show */}
          </summary>
          <pre style={{
            background: '#f3f4f6', // 代码区背景 (更浅灰 gray-100)
            padding: '12px',
            borderRadius: 6,
            maxHeight: '250px', // 增加最大高度
            overflow: 'auto',
            fontSize: '13px', // 稍微增大字体
            color: '#3b82f6', // 4. 代码默认文字颜色 (浅蓝色 blue-500)
            border: '1px solid #e5e7eb', // 边框 (gray-200)
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {originalSectionHtml || 'Loading original HTML...'}
          </pre>
        </details>
      </Modal>
      {/* --- AI 编辑需求输入 Modal 结束 --- */}

    </div>
  );
}
