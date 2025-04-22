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
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [isPreviewingEdit, setIsPreviewingEdit] = useState(false);
  const [originalSectionHtmlForPreview, setOriginalSectionHtmlForPreview] = useState(''); // 存储预览前的原始HTML
  const [isPreviewingOriginal, setIsPreviewingOriginal] = useState(false); // 新增：是否正在预览原始版本
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
      showNotification(
        'All text and image areas on the page can be edited by clicking them.', // 第一个参数：字符串消息
        'info', // 第二个参数：类型
        2000 // 第三个参数：持续时间 (毫秒)
      );
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

  // --- 更新：处理生成编辑请求 (使用已缓存的原始 HTML) ---
  async function handleGenerateEdit() {
    if (!editPrompt.trim() || !editingSectionId) {
      message.warn('Please enter your edit requirements.');
      return;
    }
    if (!originalSectionHtml) {
        message.error('Original section HTML is missing. Cannot proceed.');
        handleCancelEditPrompt();
        return;
    }

    setIsGeneratingEdit(true);
    setProposedSectionHtml('');
    setOriginalSectionHtmlForPreview(''); // 清空旧的预览原始HTML

    try {
      console.log('Sending to API:');
      console.log('Prompt:', editPrompt);
      console.log('Original HTML:', originalSectionHtml.substring(0, 100) + '...');

      const response = await apiClient.regenerateSection({
        instructions: editPrompt,
        sectionHtml: originalSectionHtml,
      });

      // --- 更新：根据实际 API 返回结构处理 ---
      if (response && response.code === 200 && response.data) {
        const newHtml = response.data; // 从 data 字段获取 HTML
        setProposedSectionHtml(newHtml); // 存储建议的 HTML
        setShowEditPromptModal(false);
        message.success('AI suggestion generated! Review the changes below.');
        // 调用预览函数，传入新的 HTML
        startPreviewingEdit(editingSectionId, newHtml);
      } else {
        // 处理 API 成功但 code 不是 200 或 data 为空的情况
        throw new Error(response?.message || 'API did not return the expected HTML content.');
      }

    } catch (error) {
      console.error('Error generating AI edit:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate AI edit.';
      message.error(`Error: ${errorMessage}`);
      // 出错时不关闭 Modal
    } finally {
      setIsGeneratingEdit(false);
    }
  }

  // --- 新增：从 Modal 触发预览 ---
  function handlePreviewFromModal() {
    if (!editingSectionId || !proposedSectionHtml) {
      message.warn("Cannot start preview: Missing data.");
      return;
    }
    setShowEditPromptModal(false); // 关闭 Modal
    startPreviewingEdit(editingSectionId, proposedSectionHtml); // 开始 iframe 预览
  }

  // --- 新增：从 Modal 丢弃建议 ---
  function handleDiscardFromModal() {
    setProposedSectionHtml(''); // 清空建议
    // 可选：清空输入框，让用户重新输入
    // setEditPrompt('');
    message.info("Suggestion discarded. You can modify your request and generate again.");
  }

  // --- 更新：开始预览编辑 ---
  function startPreviewingEdit(sectionId, newHtml) {
    console.log(`Starting preview for section ${sectionId}`);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      message.error('Iframe content not accessible for preview.');
      return;
    }
    const doc = iframe.contentDocument;
    const element = doc.getElementById(sectionId);

    if (element) {
      // 1. 保存原始 outerHTML 以便取消和切换
      setOriginalSectionHtmlForPreview(element.outerHTML);

      // 2. 尝试解析并替换为新的 HTML (AI 建议的)
      const newElement = parseHtmlString(newHtml, doc, sectionId);

      if (newElement && element.parentNode) {
        element.parentNode.replaceChild(newElement, element);

        // 3. 滚动到预览区域中间
        const previewElement = doc.getElementById(sectionId); // 重新获取替换后的元素
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
           console.warn("Could not find the replaced element after initial preview setup.");
        }

        // 4. 设置状态并显示控件
        setIsPreviewingOriginal(false); // 初始显示的是 AI 建议版本
        setIsPreviewingEdit(true); // 激活预览模式
        showNotification('Preview mode: Review the AI suggestion. Use toggle to compare.', 'info', 6000); // 更新提示

      } else {
        console.error("Error replacing element for preview:", newHtml);
        message.error("Failed to apply preview. Please check the generated HTML structure.");
        setOriginalSectionHtmlForPreview(''); // 清空，因为没有成功进入预览
      }

    } else {
      console.warn(`Element with id "${sectionId}" not found in iframe for preview.`);
      message.warn(`Could not find section ${sectionId} to preview.`);
    }
  }

  // --- 更新：取消预览编辑 ---
  function cancelPreviewEdit() {
    console.log('Discarding edit...');
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !editingSectionId || !originalSectionHtmlForPreview) {
      console.warn("Cannot discard: Missing iframe, sectionId, or original HTML for preview.");
      // 即使无法恢复，也要退出预览状态
      setIsPreviewingEdit(false);
      setEditingSectionId(null);
      setProposedSectionHtml('');
      setOriginalSectionHtmlForPreview('');
      return;
    }
    const doc = iframe.contentDocument;
    const element = doc.getElementById(editingSectionId);

    if (element && originalSectionHtmlForPreview) { // 确保有原始 HTML 可以恢复
      const originalElement = parseHtmlString(originalSectionHtmlForPreview, doc, editingSectionId);
      if (originalElement && element.parentNode) {
         // 替换回原始元素
         element.parentNode.replaceChild(originalElement, element);
         // 移除高亮
         const restoredElement = doc.getElementById(editingSectionId);
         if (restoredElement) {
           restoredElement.style.outline = 'none';
         }
         showNotification('AI edit discarded.', 'info');
      } else {
         console.error("Error restoring element during discard:", originalSectionHtmlForPreview);
         message.error("Failed to fully restore original content. You might need to refresh.");
      }
    } else if (!originalSectionHtmlForPreview && element) {
       // 如果没有缓存的原始 HTML，至少移除预览样式
       element.style.outline = 'none';
       console.warn("Original HTML for preview was missing, only removed highlight.");
    } else {
      console.warn(`Element with id "${editingSectionId}" not found in iframe for discarding preview.`);
    }

    // 重置状态
    setIsPreviewingEdit(false);
    setIsPreviewingOriginal(false); // 重置切换状态
    setEditingSectionId(null);
    setProposedSectionHtml('');
    setOriginalSectionHtmlForPreview('');
  }

  // --- 新增：接受预览编辑 ---
  async function acceptPreviewEdit() {
    console.log('Accepting edit...');
    if (!editingSectionId || !proposedSectionHtml) {
      message.error("Cannot accept: Missing sectionId or proposed HTML.");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      message.error('Iframe content not accessible to save changes.');
      setIsPreviewingEdit(false); // 退出预览状态
      setEditingSectionId(null);
      setProposedSectionHtml('');
      setOriginalSectionHtmlForPreview('');
      return;
    }
    const doc = iframe.contentDocument;
    let element = doc.getElementById(editingSectionId);

    // **关键：确保当前显示的是 AI 建议的版本**
    if (isPreviewingOriginal) {
      console.log("Switching back to proposed version before accepting...");
      const proposedElement = parseHtmlString(proposedSectionHtml, doc, editingSectionId);
      if (element && element.parentNode && proposedElement) {
        element.parentNode.replaceChild(proposedElement, element);
        element = proposedElement; // 更新 element 引用到当前正确的节点
        setIsPreviewingOriginal(false); // 更新状态
      } else {
        message.error("Failed to switch to proposed version before saving. Aborting.");
        // 不重置状态，让用户可以手动取消或重试
        return;
      }
    }

    // 移除预览高亮
    if (element) {
      element.style.outline = 'none';
    } else {
      console.warn(`Element with id "${editingSectionId}" not found for removing highlight before saving.`);
      // 即使找不到元素也要尝试保存，因为 HTML 可能已经更新
    }

    // 获取包含已接受更改的完整 HTML
    const updatedFullHtml = doc.documentElement.outerHTML;

    // 设置保存状态，类似 saveContent
    setSaving(true); // 可以复用现有的 saving 状态或创建一个新的
    showNotification('Applying changes...', 'info', 1500); // 短暂提示

    try {
      // 调用保存整个页面 HTML 的 API
      await apiClient.editAlternativeHtml({
        html: updatedFullHtml,
        resultId: pageId,
      });

      // 更新组件内部的 html 状态，以便重新渲染 iframe (如果需要的话)
      // 或者依赖于页面的自动刷新机制
      // setHtml(updatedFullHtml); // 可选：如果希望立即反映在内部状态

      showNotification('AI edit accepted and applied!', 'success');
    } catch (e) {
      console.error('Save failed after accepting AI edit:', e);
      showNotification('Failed to save accepted changes', 'error');
      // 注意：此时 iframe 中的内容是修改后的，但保存失败了。
      // 可能需要提示用户手动保存或提供重试机制。
    } finally {
      setSaving(false);
      // 重置预览状态
      setIsPreviewingEdit(false);
      setIsPreviewingOriginal(false);
      setEditingSectionId(null);
      setProposedSectionHtml('');
      setOriginalSectionHtmlForPreview('');
    }
  }

  // --- 新增：辅助函数 - 解析HTML字符串并在iframe中创建元素 ---
  function parseHtmlString(htmlString, doc, targetId) {
    try {
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = htmlString.trim();
      // API 返回的可能是一个完整的 section，也可能只是内容片段
      // 我们需要确保获取的是一个 Element Node
      let newElement = tempDiv.firstChild;
      // 如果第一个子节点是文本节点或注释节点，尝试获取下一个元素节点
      while (newElement && newElement.nodeType !== 1 /* ELEMENT_NODE */) {
        newElement = newElement.nextSibling;
      }

      if (!newElement || newElement.nodeType !== 1) {
        // 如果解析后没有有效的元素节点，可能需要包裹一下
        // 例如，如果API只返回了 `<h1>Title</h1><p>Text</p>`
        // 这种情况比较复杂，暂时假设API返回的是单个根元素（如 <section>...</section>）
        // 或者我们可以总是创建一个新的 section 并将内容放进去
        console.warn("Parsed HTML string does not seem to be a single root element. Attempting to use the container.");
        // 如果 tempDiv 只有一个子元素，就用它，否则可能需要更复杂的处理
        if (tempDiv.childNodes.length === 1 && tempDiv.firstChild.nodeType === 1) {
           newElement = tempDiv.firstChild;
        } else {
           // 如果有多个子节点，或者不是元素节点，创建一个新的 section 包裹它们
           console.log("Wrapping parsed content in a new section tag.");
           const wrapperSection = doc.createElement('section');
           // 移动所有子节点到新的 section
           while (tempDiv.firstChild) {
             wrapperSection.appendChild(tempDiv.firstChild);
           }
           newElement = wrapperSection;
           // 尝试从原始元素复制一些属性？这可能不安全
        }
      }

      if (newElement && newElement.nodeType === 1) {
        newElement.id = targetId; // 强制设置正确的 ID
        // 确保预览样式应用
        newElement.style.outline = '3px dashed #38bdf8';
        newElement.style.transition = 'outline 0.3s ease-in-out';
        return newElement;
      } else {
         throw new Error("Could not parse HTML string into a valid element node.");
      }
    } catch (e) {
      console.error("Error parsing HTML string:", e, htmlString);
      message.error("Error processing HTML content for preview.");
      return null;
    }
  }
  // --- 辅助函数结束 ---

  // --- 新增：切换预览版本 (原始/建议) ---
  function togglePreviewVersion() {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !editingSectionId) {
      message.warn("Cannot toggle: Preview context is missing.");
      return;
    }
    const doc = iframe.contentDocument;
    const currentElement = doc.getElementById(editingSectionId);

    if (!currentElement || !currentElement.parentNode) {
      message.error(`Cannot toggle: Section element with ID "${editingSectionId}" not found in iframe.`);
      // 尝试退出预览状态？
      cancelPreviewEdit(); // 调用取消可能更安全
      return;
    }

    // 确定要切换到的 HTML 内容
    const targetHtml = isPreviewingOriginal ? proposedSectionHtml : originalSectionHtmlForPreview;
    const newElement = parseHtmlString(targetHtml, doc, editingSectionId);

    if (newElement) {
      console.log(`Toggling preview to: ${isPreviewingOriginal ? 'Proposed' : 'Original'}`);
      currentElement.parentNode.replaceChild(newElement, currentElement);
      setIsPreviewingOriginal(!isPreviewingOriginal); // 更新状态

      // 可选：切换后滚动到视图，确保用户看到变化
      const replacedElement = doc.getElementById(editingSectionId);
      if (replacedElement) {
        replacedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

    } else {
      message.error("Failed to switch preview version due to HTML parsing error.");
      // 如果切换失败，可能需要考虑恢复到某个已知状态或提示用户
    }
  }
  // --- 切换预览版本结束 ---

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
        // background: '#f59e42', // 旧的橙色背景
        background: '#14b8a6', // 新的青色背景 (Tailwind Teal 500)
        color: '#f0fdfa',      // 浅青色字体 (Teal 50) 以提高对比度
        padding: '10px 32px',
        textAlign: 'center',
        fontSize: 15,
        fontWeight: 700,       // 加粗
        letterSpacing: 1,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        zIndex: 9,
        // borderBottom: '2px solid #fbbf24', // 旧的亮黄色边框
        borderBottom: '2px solid #0f766e', // 匹配背景的深青色边框 (Teal 700)
        // textShadow: '0 1px 0 #fff8',       // 旧的白色阴影，在新背景下可能不需要
        userSelect: 'none'
      }}>
        <span style={{ fontSize: 17, fontWeight: 900, marginRight: 8, verticalAlign: 'middle' }}>🖱️</span>
        <span>
          Click any <span style={{ textDecoration: 'underline', fontWeight: 900 }}>text</span> or <span style={{ textDecoration: 'underline', fontWeight: 900 }}>image</span> area to edit.<br />
          All clickable areas will show a <span style={{ /* color: '#d97706', */ color: '#115e59', fontWeight: 900 }}>pointer cursor</span>.<br /> {/* 更新指针颜色 (Teal 800) */}
          <span style={{ fontSize: 13, fontWeight: 600, /* color: '#92400e', */ color: '#134e4a', marginTop: 4, display: 'inline-block' }}> {/* 更新提示文字颜色 (Teal 900) */}
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
          <span style={{ color: '#1f2937', fontWeight: 600 }}>
            AI Edit Section: {sections.find(s => s.id === editingSectionId)?.label || ''}
          </span>
        }
        open={showEditPromptModal}
        onCancel={handleCancelEditPrompt}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {/* 取消按钮始终显示，但在生成时禁用 */}
            <Button
              key="cancel"
              onClick={handleCancelEditPrompt}
              disabled={isGeneratingEdit}
              style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
            >
              Cancel
            </Button>

            {/* 根据状态显示不同的确认按钮 */}
            {!proposedSectionHtml ? (
              // 状态一：还未生成建议
              <Button
                key="generate"
                type="primary"
                onClick={handleGenerateEdit}
                loading={isGeneratingEdit}
                disabled={!editPrompt.trim() || isGeneratingEdit}
                style={{
                  background: (!editPrompt.trim() || isGeneratingEdit) ? '#e5e7eb' : 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
                  borderColor: (!editPrompt.trim() || isGeneratingEdit) ? '#d1d5db' : '#38bdf8',
                  color: (!editPrompt.trim() || isGeneratingEdit) ? '#6b7280' : '#ffffff',
                }}
              >
                {isGeneratingEdit ? 'Generating...' : 'Generate Edit'}
              </Button>
            ) : (
              // 状态二：已生成建议
              <>
                <Button
                  key="discard"
                  onClick={handleDiscardFromModal}
                  style={{ background: '#fee2e2' /* 浅红色背景 (red-100) */, color: '#dc2626' /* 深红色文字 (red-600) */, border: '1px solid #fecaca' /* 红色边框 (red-200) */ }}
                >
                  Discard Suggestion
                </Button>
                <Button
                  key="preview"
                  type="primary"
                  onClick={handlePreviewFromModal}
                  style={{
                    background: 'linear-gradient(90deg, #22c55e 0%, #10b981 100%)', // 绿色渐变
                    borderColor: '#16a34a', // 深绿色边框
                    color: '#ffffff',
                  }}
                >
                  Preview Changes
                </Button>
              </>
            )}
          </div>
        }
        destroyOnClose
        width={800}
        zIndex={1050}
        closeIcon={<CloseOutlined style={{ color: '#6b7280', fontSize: 16 }} />}
        styles={{
          mask: { backdropFilter: 'blur(1px)' },
          header: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' },
          body: { background: '#ffffff', color: '#1f2937', padding: '24px', minHeight: '50vh', maxHeight: '75vh', overflowY: 'auto' },
          content: {},
          footer: { background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '12px 24px', textAlign: 'right' }
        }}
      >
        <Spin spinning={isGeneratingEdit} tip="Generating suggestion...">
          <p style={{ marginBottom: 16, color: '#374151', fontSize: '14px' }}>
            Describe the changes you want AI to make to this section:
          </p>
          <Input.TextArea
            rows={6} // 可以稍微减少行数，为对比留空间
            placeholder="e.g., Change the background to dark blue, add a 'Learn More' button linking to #, and increase the main title font size."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            style={{ background: '#f9fafb', color: '#111827', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '24px' }}
            disabled={isGeneratingEdit || !!proposedSectionHtml} // 生成后也禁用输入框，鼓励先处理建议
          />

          {/* 对比区域 */}
          <div style={{ display: 'flex', gap: '16px', maxHeight: '45vh' /* 限制对比区域高度 */ }}>
            {/* 原始 HTML */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ color: '#4b5563' /* 中灰色 (slate-600) */, marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>Original HTML</h4>
              <pre style={{
                background: '#f3f4f6', padding: '12px', borderRadius: 6,
                overflow: 'auto', fontSize: '12px', /* 稍小字体 */
                color: '#6b7280', /* 默认灰色 */
                border: '1px solid #e5e7eb', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                flexGrow: 1 /* 占据剩余空间 */
              }}>
                {originalSectionHtml || 'Loading original HTML...'}
              </pre>
            </div>

            {/* AI 生成的建议 HTML - 仅在生成后显示 */}
            {proposedSectionHtml && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ color: '#1d4ed8' /* 蓝色 (blue-700) */, marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>AI Generated Suggestion</h4>
                <pre style={{
                  background: '#eff6ff', /* 非常浅的蓝色 (blue-50) */
                  padding: '12px', borderRadius: 6,
                  overflow: 'auto', fontSize: '12px',
                  color: '#1e40af', /* 深蓝色 (blue-800) */
                  border: '1px solid #bfdbfe', /* 浅蓝色边框 (blue-200) */
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  flexGrow: 1
                }}>
                  {proposedSectionHtml}
                </pre>
              </div>
            )}
          </div>
        </Spin>
      </Modal>
      {/* --- AI 编辑需求输入 Modal 结束 --- */}

      {/* --- 更新：AI 编辑预览控件 --- */}
      {isPreviewingEdit && editingSectionId && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(31, 41, 55, 0.9)',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backdropFilter: 'blur(3px)', // 添加模糊背景效果
        }}>
          <span style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500, marginRight: '8px' /* 增加右边距 */ }}>
             Previewing AI Edit for "{sections.find(s => s.id === editingSectionId)?.label || 'Section'}"
          </span>
          {/* 新增：切换预览按钮 */}
          <Button
            // icon={isPreviewingOriginal ? <EyeOutlined /> : <UndoOutlined />} // 可选：使用图标
            onClick={togglePreviewVersion}
            size="small"
            style={{
              background: '#4b5563', // slate-600
              color: 'white',
              border: '1px solid #6b7280', // slate-500 border
             }}
             disabled={saving} // 保存时禁用切换
          >
            {isPreviewingOriginal ? 'Show New Generation' : 'Show Original'}
          </Button>
          {/* Discard 按钮 */}
          <Button
            icon={<CloseOutlined />}
            onClick={cancelPreviewEdit}
            size="small"
            style={{ background: '#ef4444', color: 'white', border: 'none' }} // red-500
            disabled={saving}
          >
            Discard
          </Button>
          {/* Accept 按钮 */}
          <Button
            icon={<CheckOutlined />}
            onClick={acceptPreviewEdit}
            size="small"
            style={{ background: '#22c55e', color: 'white', border: 'none' }} // green-500
            loading={saving}
            disabled={saving}
          >
            Accept
          </Button>
        </div>
      )}
      {/* --- AI 编辑预览控件结束 --- */}

    </div>
  );
}
