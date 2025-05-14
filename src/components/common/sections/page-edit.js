import React, { useEffect, useRef, useState, useCallback } from 'react'
import apiClient from '../../../lib/api/index.js';
import { Button, Modal, Spin, Row, Col, Pagination, Popconfirm, Input, Form, message, Drawer, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined, EditOutlined, CloseOutlined, CheckCircleFilled, LoadingOutlined, SaveOutlined } from '@ant-design/icons';

// --- 新增：定义常用提示 ---
const commonPrompts = [
  "Increase the heading size by 10%",
  "Increase all text size by 10%",
  "Decrease all text size by 10%",
  "Increase the image size by 10%",
  "Decrease the image size by 10%",
  "Rewrite this to be more concise",
  "Improve the call to action",
  "Change the tone to be more professional",
  "Change the tone to be more casual",
];

export default function HtmlPreview({ pageId }) {
  // === 新增：获取 message API 和 contextHolder ===
  const [messageApi, contextHolder] = message.useMessage();

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
  const [imagePageSize, setImagePageSize] = useState(20);
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
  const [selectedStructureInstruction, setSelectedStructureInstruction] = useState(''); // 新增：选中的结构指令
  // --- AI 编辑状态结束 ---
  // --- 新增：直接代码编辑状态 ---
  const [isEditingSectionCode, setIsEditingSectionCode] = useState(false); // 是否正在编辑 Section 代码
  const [sectionCodeContent, setSectionCodeContent] = useState(''); // 当前编辑的 Section 代码内容
  const [codeEditingSectionId, setCodeEditingSectionId] = useState(null); // 正在编辑代码的 Section ID
  // --- 直接代码编辑状态结束 ---
  // --- 新增：页面标题状态 ---
  const [pageTitle, setPageTitle] = useState('');
  // --- 页面标题状态结束 ---
  // --- 新增：用于标题保存的状态 ---
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  // --- 状态结束 ---

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
      // --- 新增：重置标题 ---
      setPageTitle('');
      // --- 重置标题结束 ---
      try {
        const response = await apiClient.getPageBySlug(pageId, 'en');
        if (response.notFound) {
          setError('Page not found');
          setHtml('');
        } else if (response.code === 200 && response.data?.html) {
          const fetchedHtml = response.data.html;
          setHtml(fetchedHtml);
          // --- 新增：尝试从获取的 HTML 中提取标题 ---
          try {
            const titleMatch = fetchedHtml.match(/<title>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              setPageTitle(titleMatch[1]);
            } else {
              // 如果没有找到 title 标签，可以设置一个默认值或留空
              setPageTitle('Untitled Page'); // 或者 pageId
              console.warn("Could not find <title> tag in fetched HTML.");
            }
          } catch (parseError) {
             console.error("Error parsing title from HTML:", parseError);
             setPageTitle('Untitled Page'); // 解析出错时的回退
          }
          // --- 提取标题结束 ---
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

  // --- 新增：更新 iframe 中的 title 标签 ---
  const updateIframeTitle = (newTitle) => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument) {
      const doc = iframe.contentDocument;
      let titleElement = doc.querySelector('head > title');
      if (!titleElement) {
        // 如果 <head> 或 <title> 不存在，则创建它们
        let headElement = doc.querySelector('head');
        if (!headElement) {
          headElement = doc.createElement('head');
          // 将新 head 插入到 html 元素的开头
          doc.documentElement.insertBefore(headElement, doc.documentElement.firstChild);
        }
        titleElement = doc.createElement('title');
        headElement.appendChild(titleElement);
        console.log("Created missing <head> or <title> element.");
      }
      titleElement.textContent = newTitle;
      console.log("Updated iframe title to:", newTitle);
    } else {
      console.warn("Cannot update iframe title: iframe or document not ready.");
    }
  };
  // --- 更新 iframe title 结束 ---

  // --- 新增：处理保存标题的函数 ---
  async function handleSaveTitle() {
    if (!pageTitle.trim()) {
      message.warn('Page title cannot be empty.');
      return;
    }
    if (!iframeRef.current || !iframeRef.current.contentDocument) {
      message.error('Preview content is not ready to save the title.');
      return;
    }

    setIsSavingTitle(true);
    showNotification('Saving title...', 'info', 1500); // 短暂提示

    try {
      // 1. 确保 iframe 中的 title 是最新的
      updateIframeTitle(pageTitle);

      // 2. 获取包含更新后 title 的完整 HTML
      const doc = iframeRef.current.contentDocument;
      const updatedFullHtml = doc.documentElement.outerHTML;

      // 3. 调用 API 保存
      await apiClient.editAlternativeHtml({
        html: updatedFullHtml,
        resultId: pageId,
      });

      showNotification('Page title saved successfully!', 'success');

    } catch (e) {
      console.error('Failed to save title:', e);
      showNotification('Failed to save page title', 'error');
      // 可以考虑是否需要错误处理，比如恢复旧标题？
    } finally {
      setIsSavingTitle(false);
    }
  }
  // --- 保存标题函数结束 ---

  // Save edited content
  async function saveContent() {
    if (!currentEdit || !currentEdit.element) return;

    setSaving(true);
    const { element, content, originalContent, elementType, linkHref, originalLinkHref } = currentEdit;

    try {
      // --- 修改：根据 elementType 更新 DOM ---
      if (elementType === 'img') {
        // 更新图片 src
        if (content !== originalContent) {
          element.setAttribute('src', content);
        }
      } else if (elementType === 'a') {
        // 更新链接文本和 href
        let changed = false;
        if (content !== originalContent) {
          element.textContent = content;
          changed = true;
        }
        // 如果 href 有变化 (包括从无到有，从有到无，或值改变)
        if (linkHref !== originalLinkHref) {
          element.setAttribute('href', linkHref || '#'); // 如果为空则设置为 '#'，避免无效链接
          changed = true;
        }
        if (!changed) {
          // 如果文本和链接都没变，则不保存
          closeSidebar();
          return;
        }
      } else { // 默认为 'text' 类型
        // 更新文本内容
        if (content !== originalContent) {
          element.textContent = content;
        } else {
          // 如果内容没变，则不保存
          closeSidebar();
          return;
        }
      }

      // --- 新增：在保存前，确保 iframe 中的 title 与状态同步 ---
      updateIframeTitle(pageTitle);
      // --- title 同步结束 ---

      // 获取更新后的整个页面 HTML
      const updatedHtml = iframeRef.current.contentDocument.documentElement.outerHTML;

      // 调用 API 保存
      await apiClient.editAlternativeHtml({
        html: updatedHtml,
        resultId: pageId,
      });

      // 更新内部状态（可选，取决于是否需要立即重渲染 iframe）
      // setHtml(updatedHtml);

      showNotification('Content saved successfully!', 'success');
      closeSidebar();

    } catch (e) {
      console.error('Save failed:', e);
      showNotification('Failed to save content', 'error');
      // 可选：恢复原始内容？
      // if (elementType === 'img') {
      //   element.setAttribute('src', originalContent);
      // } else if (elementType === 'a') {
      //   element.textContent = originalContent;
      //   element.setAttribute('href', originalLinkHref || '#');
      // } else {
      //   element.textContent = originalContent;
      // }
    } finally {
      setSaving(false);
    }
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
        const structuralElements = doc.querySelectorAll('header, section, footer');
        const extractedSections = Array.from(structuralElements).map((element, index) => {
          // 确保每个元素都有一个 ID，用于后续滚动定位
          const elementType = element.tagName.toLowerCase();
          if (!element.id) {
            // 为 header, section, footer 提供不同的默认 ID 前缀
            element.id = `page-${elementType}-${index}`;
          }
          // --- 修改：根据元素类型确定标签 ---
          let label = '';
          if (elementType === 'header') {
            label = 'Header'; // 直接使用 "Header"
          } else if (elementType === 'footer') {
            label = 'Footer'; // 直接使用 "Footer"
          } else {
            // 对于 section，仍然尝试获取具体标签，最后回退到默认值
            label = element.getAttribute('aria-label') ||
                    element.getAttribute('data-label') ||
                    element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent ||
                    `Section ${index + 1}`; // 回退到 "Section X"
            // 注意：这里的 index 仍然是所有结构元素的索引，如果希望 Section 序号独立计算，需要额外逻辑
          }
          // --- 标签确定逻辑结束 ---

          return {
            id: element.id,
            label: label.trim(), // 移除可能的前后空格
            // 可以选择性地存储元素类型，以便将来进行区分
            // type: elementType
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

    // --- 修改：提取 Header, Sections, Footer ---
    // 使用更广泛的选择器来同时获取 header, section, 和 footer
    const structuralElements = doc.querySelectorAll('header, section, footer');
    const extractedSections = Array.from(structuralElements).map((element, index) => {
      // 确保每个元素都有一个 ID，用于后续滚动定位
      const elementType = element.tagName.toLowerCase();
      if (!element.id) {
        // 为 header, section, footer 提供不同的默认 ID 前缀
        element.id = `page-${elementType}-${index}`;
      }
      // 尝试获取一个有意义的标签
      // 增加对 header/footer 的默认标签处理
      let label = element.getAttribute('aria-label') ||
                  element.getAttribute('data-label') ||
                  element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent;

      if (!label) {
        if (elementType === 'header') {
          label = 'Header';
        } else if (elementType === 'footer') {
          label = 'Footer';
        } else {
          // section 的默认标签保持不变
          label = `Section ${index + 1}`; // 注意：这里的 index 包含了 header 和 footer
          // 或者可以过滤掉 header/footer 再计算 section 的序号，会更复杂一些
        }
      }

      return {
        id: element.id,
        label: label.trim(),
        // 可以选择性地存储元素类型，以便将来进行区分
        // type: elementType
      };
    });
    setSections(extractedSections);
    // --- 提取结构元素结束 ---


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
        // 可编辑元素 (带有 canEdit 属性)
        const isImage = canEditEl.tagName.toLowerCase() === 'img';
        const isLink = canEditEl.tagName.toLowerCase() === 'a'; // 检查 canEdit 元素是否是 a 标签
        setCurrentEdit({
          element: canEditEl,
          // --- 修改：处理 canEdit 元素是 a 标签的情况 ---
          elementType: isImage ? 'img' : (isLink ? 'a' : 'text'),
          content: isImage ? canEditEl.getAttribute('src') : canEditEl.textContent,
          selector: '',
          originalContent: isImage ? canEditEl.getAttribute('src') : canEditEl.textContent,
          // --- 如果是链接，获取 href ---
          linkHref: isLink ? (canEditEl.getAttribute('href') || '') : null,
          originalLinkHref: isLink ? (canEditEl.getAttribute('href') || '') : null,
        });
        setShowSidebar(true);
        return;
      }

      // 没有canEdit属性，判断是否是独立的文字、图片或链接区域
      const targetElement = e.target; // 使用一个变量存储 e.target
      const tag = targetElement.tagName.toLowerCase();

      if (tag === 'img') {
        // 图片元素
        setCurrentEdit({
          element: targetElement,
          elementType: 'img',
          content: targetElement.getAttribute('src'),
          selector: '',
          originalContent: targetElement.getAttribute('src'),
          linkHref: null,
          originalLinkHref: null,
        });
        setShowSidebar(true);
        return;
      }
      // --- 修改：判断是否是链接 (<a> 标签)，不再强制要求有文本 ---
      if (tag === 'a') {
        setCurrentEdit({
          element: targetElement,
          elementType: 'a', // 标记类型为链接
          content: targetElement.textContent, // 链接的文本 (可能为空)
          linkHref: targetElement.getAttribute('href') || '', // 链接的 URL
          selector: '',
          originalContent: targetElement.textContent, // 原始文本
          originalLinkHref: targetElement.getAttribute('href') || '', // 原始 URL
        });
        setShowSidebar(true);
        return;
      }
      // --- 修改：判断是否是独立的文字节点 (排除 <a> 和 <img> 标签) ---
      if (
        tag !== 'a' && tag !== 'img' && // 确保不是上面已经处理过的 <a> 或 <img> 标签
        targetElement.childNodes.length === 1 &&
        targetElement.childNodes[0].nodeType === 3 && // TEXT_NODE
        targetElement.textContent.trim().length > 0
      ) {
        // 独立的文本节点
        setCurrentEdit({
          element: targetElement,
          elementType: 'text',
          content: targetElement.textContent,
          selector: '',
          originalContent: targetElement.textContent,
          linkHref: null,
          originalLinkHref: null,
        });
        setShowSidebar(true);
        return;
      }

      // 其他情况，弹出提示
      showNotification(
        'All text, image, and link areas on the page can be edited by clicking them.',
        'info',
        2000
      );
    }

    doc.addEventListener('click', handleIframeClick, true);

    // 清理事件
    return () => {
      doc.removeEventListener('click', handleIframeClick, true);
    };
  }, [html]);

  // --- 修改：使用 useCallback 包裹 fetchImageAssets ---
  const fetchImageAssets = useCallback(async (page = 1, pageSize = 20) => {
    console.log('Fetching images - page:', page, 'pageSize:', pageSize);
    setImageLoading(true);
    try {
      // --- 修改：调用正确的 API 函数并传递独立参数 ---
      const customerId = localStorage.getItem('alternativeCustomerId');
      const mediaType = 'image';
      const categoryId = null; // API 需要 categoryId，暂时传递 null，因为我们只有 categoryName='media'
      const limit = pageSize; // API 需要 limit 参数

      // 调用 apiClient.getMedia 而不是 getMediaList
      const response = await apiClient.getMedia(
        customerId,
        mediaType,
        categoryId, // 传递 categoryId (null)
        page,       // 传递 page
        limit       // 传递 limit (pageSize 的值)
      );
      // --- API 调用修改结束 ---

      console.log('API Response:', response);

      // --- 修改：根据实际 API 响应结构设置状态 (这里假设 getMedia 返回的结构与之前 getMediaList 预期的一致) ---
      // 注意：如果 getMedia 返回的结构不同 (例如直接是 { data: [...] } 而不是 { code: 200, data: [...], TotalCount: ... })，则需要调整下面的逻辑
      if (response && response.data && Array.isArray(response.data)) { // 假设 response.data 是列表
        setImageAssets(response.data);
        // 注意：原始 getMedia 定义没有返回 TotalCount，这里可能需要调整分页逻辑
        // 暂时假设 response 结构中包含 TotalCount 或类似字段，如果实际没有，Pagination 会有问题
        setImageTotal(response.TotalCount || response.total || response.data.length); // 尝试获取总数
      } else if (response && response.code && response.code !== 200) { // 处理可能的错误码
         message.error(response.message || 'Failed to load images');
         setImageAssets([]);
         setImageTotal(0);
      }
       else {
        // 如果 response 为 null 或结构不符合预期
        // message.error('Failed to load images or invalid response structure'); // 可以取消注释以获得更明确的错误
        setImageAssets([]);
        setImageTotal(0);
      }
    } catch (e) {
      console.error('Failed to fetch images:', e);
      message.error('Failed to load images');
      setImageAssets([]);
      setImageTotal(0);
    } finally {
      setImageLoading(false);
    }
  }, []); // 依赖项为空

  // Load when opening the image library
  useEffect(() => {
    console.log('Image Library Effect Triggered. showImageLibrary:', showImageLibrary); // 添加日志
    if (showImageLibrary) {
      fetchImageAssets(imagePage, imagePageSize);
    }
    // --- 修改：将 fetchImageAssets 添加到依赖数组，并移除 eslint-disable 注释 ---
  }, [showImageLibrary, imagePage, imagePageSize, fetchImageAssets]);

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
      fetchImageAssets(imagePage, imagePageSize); // Refresh list
    } catch (e) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // --- 修改：Delete image 函数以使用正确的 ID 字段 ---
  async function handleDeleteImage(asset) {
    try {
      // 使用 asset.mediaId 调用删除 API
      await apiClient.deleteMedia(asset.mediaId);
      // 使用 mediaId 过滤列表
      setImageAssets(imageAssets.filter(item => item.mediaId !== asset.mediaId));
      message.success('Image deleted successfully');
      // Optionally refetch to ensure pagination is correct if an item is deleted
      // fetchImageAssets(imagePage, imagePageSize);
    } catch (e) {
      message.error('Failed to delete image');
    }
  }

  // --- 新增：滚动到指定 Section ---
  function scrollToSection(sectionId, highlight = false) {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentDocument && sectionId) {
      const doc = iframe.contentDocument;
      const element = doc.getElementById(sectionId);
      if (element) {
        // --- 新增：检查元素的定位方式 ---
        const computedStyle = doc.defaultView.getComputedStyle(element);
        const isFixedOrSticky = computedStyle.position === 'fixed' || computedStyle.position === 'sticky';

        if (isFixedOrSticky) {
          // 对于 fixed 或 sticky 定位的元素，滚动到页面顶部
          iframe.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
          // --- 修改：日志信息改为英文 ---
          console.log(`Element ${sectionId} is fixed/sticky, scrolling window to top.`);
        } else {
          // 对于其他元素，正常滚动到元素位置
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // --- 修改：日志信息改为英文 ---
          console.log(`Scrolling element ${sectionId} into view.`);
        }
      } else {
        // --- 修改：日志信息改为英文 ---
        console.warn(`Element with id "${sectionId}" not found in iframe for scrolling.`);
      }
    } else {
      // --- 修改：日志信息改为英文 ---
      console.warn("Iframe content not accessible or sectionId missing for scrolling.");
    }
  }

  function handleInitiateEdit(sectionId) {
    // --- 修改：日志信息改为英文 ---
    console.log(`Initiating AI edit for section: ${sectionId}`);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      // --- 修改：提示信息改为英文 ---
      message.error('Iframe content not ready.');
      return;
    }
    const doc = iframe.contentDocument;
    const element = doc.getElementById(sectionId);

    if (element) {
      // 1. 先滚动到区域并临时高亮
      scrollToSection(sectionId, true);

      // 2. 延迟 500ms 后再设置状态和打开 Modal
      setTimeout(() => {
        // 确保元素仍然存在 (以防万一在延迟期间发生变化)
        const currentElement = iframe?.contentDocument?.getElementById(sectionId);
        if (currentElement) {
          setEditingSectionId(sectionId);
          setOriginalSectionHtml(currentElement.outerHTML); // 获取当前HTML作为原始版本
          setProposedSectionHtml(''); // 清空之前的建议
          setEditPrompt(''); // 清空之前的提示
          setSelectedStructureInstruction(''); // 清空结构选择
          setShowEditPromptModal(true); // 打开编辑 Modal
        } else {
           // --- 修改：日志和提示信息改为英文 ---
           console.warn(`Section ${sectionId} disappeared before modal could open.`);
           message.error(`Could not find section "${sectionId}" to edit after delay.`);
           setEditingSectionId(null); // 重置状态以防万一
        }
      }, 500); // 延迟 500 毫秒

    } else {
      // --- 修改：提示信息改为英文 ---
      message.error(`Could not find section "${sectionId}" in the preview to edit.`);
      setEditingSectionId(null); // 重置状态
    }
  }

  // --- 新增：处理结构选择 ---
  function handleStructureSelect(instruction) {
    // 如果再次点击同一个，则取消选择
    if (selectedStructureInstruction === instruction) {
      setSelectedStructureInstruction('');
    } else {
      setSelectedStructureInstruction(instruction);
    }
  }

  // --- 更新：预设结构选项 (分类并增加更多选项) ---
  const structureOptions = [
    // --- Hero Sections ---
    {
      id: 'hero-image-left',
      category: 'Hero',
      label: 'Hero: Image Left',
      instruction: 'Create a hero section with a prominent image on the left, and headline, subtext, and a CTA button on the right.',
      wireframe: (
        <div style={{ display: 'flex', gap: '8px', height: '60px', border: '1px dashed #ccc', padding: '4px', alignItems: 'center' }}>
          <div style={{ flex: 0.4, background: '#e0e0e0', borderRadius: '2px', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>IMG</div>
          <div style={{ flex: 0.6, background: '#f0f0f0', borderRadius: '2px', height: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '4px' }}>
             <div style={{height: '8px', background: '#d1d5db', margin: '2px 4px', borderRadius: '2px'}}></div> {/* Headline */}
             <div style={{height: '4px', background: '#e5e7eb', margin: '2px 4px'}}></div> {/* Subtext */}
             <div style={{height: '4px', background: '#e5e7eb', margin: '2px 4px', width: '80%'}}></div> {/* Subtext */}
             <div style={{height: '10px', width: '40%', background: '#a0c4ff', borderRadius: '4px', marginTop: '4px', fontSize: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}>BTN</div> {/* Button */}
          </div>
        </div>
      )
    },
    {
      id: 'hero-text-center',
      category: 'Hero',
      label: 'Hero: Centered Text',
      instruction: 'Create a hero section with a large centered headline, supporting subtext below it, and a prominent CTA button.',
      wireframe: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px 8px', background: '#f9fafb' }}>
          <div style={{ width: '80%', height: '10px', background: '#d1d5db', borderRadius: '2px' }}></div> {/* Headline */}
          <div style={{ width: '60%', height: '6px', background: '#e5e7eb', borderRadius: '2px' }}></div> {/* Subtext */}
          <div style={{ width: '70%', height: '6px', background: '#e5e7eb', borderRadius: '2px' }}></div> {/* Subtext */}
          <div style={{ width: '30%', height: '12px', background: '#a0c4ff', borderRadius: '4px', marginTop: '4px', fontSize: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BTN</div> {/* Button */}
        </div>
      )
    },
    {
      id: 'hero-background-image',
      category: 'Hero',
      label: 'Hero: Background Image',
      instruction: 'Create a hero section using a full-width background image with centered text (headline, subtext, button) overlaid on top.',
      wireframe: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px 8px', background: '#d1d5db', position: 'relative' }}>
           <div style={{position: 'absolute', top: 2, left: 2, fontSize: '8px', color: '#6b7280'}}>BG IMG</div>
           <div style={{ width: '70%', height: '10px', background: 'rgba(240, 240, 240, 0.8)', borderRadius: '2px', zIndex: 1 }}></div> {/* Headline */}
           <div style={{ width: '50%', height: '6px', background: 'rgba(240, 240, 240, 0.8)', borderRadius: '2px', zIndex: 1 }}></div> {/* Subtext */}
           <div style={{ width: '30%', height: '12px', background: '#a0c4ff', borderRadius: '4px', marginTop: '4px', fontSize: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>BTN</div> {/* Button */}
        </div>
      )
    },
    // --- Feature/Benefit Sections ---
    {
      id: 'feature-icon-grid-3',
      category: 'Features',
      label: 'Features: Icon Grid (3 Col)',
      instruction: 'Display key features or benefits in a three-column grid layout. Each item should have an icon, a title, and a short description.',
      wireframe: (
        <div style={{ display: 'flex', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px', justifyContent: 'space-between' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, background: '#f0f0f0', borderRadius: '2px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px', gap: '4px' }}>
              <div style={{ width: '15px', height: '15px', background: '#c0c0c0', borderRadius: '50%' }}></div> {/* Icon */}
              <div style={{ width: '80%', height: '6px', background: '#d1d5db' }}></div> {/* Title */}
              <div style={{ width: '90%', height: '4px', background: '#e5e7eb' }}></div> {/* Desc line 1 */}
              <div style={{ width: '70%', height: '4px', background: '#e5e7eb' }}></div> {/* Desc line 2 */}
            </div>
          ))}
        </div>
      )
    },
     {
      id: 'feature-image-list-alt',
      category: 'Features',
      label: 'Features: Image List (Alt.)',
      instruction: 'Present features as a list, alternating the position of an image (left/right) with the corresponding text description (title, details).',
      wireframe: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px', overflow: 'hidden' }}>
          {/* Item 1: Image Left */}
          <div style={{ display: 'flex', gap: '4px', height: '45%', alignItems: 'center' }}>
            <div style={{ flex: 0.3, background: '#e0e0e0', height: '90%', borderRadius: '2px' }}></div> {/* Img */}
            <div style={{ flex: 0.7, background: '#f0f0f0', height: '90%', borderRadius: '2px', padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
               <div style={{height: '5px', background: '#d1d5db', width: '60%'}}></div> {/* Title */}
               <div style={{height: '3px', background: '#e5e7eb'}}></div> {/* Text */}
            </div>
          </div>
           {/* Item 2: Image Right */}
          <div style={{ display: 'flex', gap: '4px', height: '45%', alignItems: 'center' }}>
             <div style={{ flex: 0.7, background: '#f0f0f0', height: '90%', borderRadius: '2px', padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
               <div style={{height: '5px', background: '#d1d5db', width: '60%'}}></div> {/* Title */}
               <div style={{height: '3px', background: '#e5e7eb'}}></div> {/* Text */}
            </div>
            <div style={{ flex: 0.3, background: '#e0e0e0', height: '90%', borderRadius: '2px' }}></div> {/* Img */}
          </div>
        </div>
      )
    },
     {
      id: 'feature-numbered-list',
      category: 'Features',
      label: 'Features: Numbered List',
      instruction: 'Outline steps or sequential benefits using a numbered list format, each with a title and description.',
      wireframe: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px' }}>
          {[1, 2].map(i => (
             <div key={i} style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
               <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'bold', width: '15px' }}>{i}.</div>
               <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '2px', padding: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                 <div style={{height: '5px', background: '#d1d5db', width: '50%'}}></div> {/* Title */}
                 <div style={{height: '3px', background: '#e5e7eb'}}></div> {/* Text */}
                 <div style={{height: '3px', background: '#e5e7eb', width: '80%'}}></div> {/* Text */}
               </div>
             </div>
          ))}
        </div>
      )
    },
    // --- CTA Sections ---
    {
      id: 'cta-simple-center',
      category: 'CTA',
      label: 'CTA: Simple Centered',
      instruction: 'Create a straightforward call-to-action section with a centered headline, brief text, and a single button below.',
      wireframe: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', border: '1px dashed #ccc', padding: '4px 8px', background: '#f9fafb' }}>
          <div style={{ width: '70%', height: '8px', background: '#d1d5db', borderRadius: '2px' }}></div> {/* Headline */}
          <div style={{ width: '50%', height: '5px', background: '#e5e7eb', borderRadius: '2px' }}></div> {/* Text */}
          <div style={{ width: '30%', height: '12px', background: '#a0c4ff', borderRadius: '4px', marginTop: '4px', fontSize: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BTN</div> {/* Button */}
        </div>
      )
    },
    {
      id: 'cta-split',
      category: 'CTA',
      label: 'CTA: Split Text/Button',
      instruction: 'Design a call-to-action section with text (headline and/or description) on the left side and a button aligned to the right.',
      wireframe: (
        <div style={{ display: 'flex', gap: '8px', height: '60px', border: '1px dashed #ccc', padding: '4px', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ flex: 0.7, background: '#f0f0f0', borderRadius: '2px', height: '80%', padding: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
             <div style={{height: '8px', background: '#d1d5db', width: '70%'}}></div> {/* Headline/Text */}
             <div style={{height: '5px', background: '#e5e7eb', width: '90%'}}></div> {/* Text */}
          </div>
           <div style={{ flex: 0.3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
             <div style={{height: '15px', width: '80%', background: '#a0c4ff', borderRadius: '4px', fontSize: '8px', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BTN</div> {/* Button */}
          </div>
        </div>
      )
    },
     {
      id: 'cta-banner',
      category: 'CTA',
      label: 'CTA: Banner Style',
      instruction: 'Create a banner-like call-to-action, typically with a background color or image, placing text and a button inline horizontally.',
      wireframe: (
        <div style={{ display: 'flex', gap: '16px', height: '60px', border: '1px dashed #ccc', padding: '4px 16px', alignItems: 'center', background: '#e0e7ff' }}> {/* Light blue background */}
          <div style={{ flex: 1, background: 'transparent', display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{height: '8px', background: '#a5b4fc', width: '70%'}}></div> {/* Headline/Text */}
             <div style={{height: '5px', background: '#c7d2fe', width: '90%'}}></div> {/* Text */}
          </div>
           <div style={{ width: '80px' /* Fixed width for button area */ }}>
             <div style={{height: '15px', width: '100%', background: '#6366f1', borderRadius: '4px', fontSize: '8px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>BTN</div> {/* Button */}
          </div>
        </div>
      )
    },
  ];
  // --- 预设结构选项结束 ---

  // --- 更新：处理取消编辑提示 Modal ---
  function handleCancelEditPrompt() {
    setShowEditPromptModal(false);
    setEditingSectionId(null);
    setEditPrompt('');
    setProposedSectionHtml(''); // 清空建议
    setOriginalSectionHtml(''); // 清空原始HTML
    setSelectedStructureInstruction(''); // 清空结构选择
  }

  // --- 更新：处理生成编辑请求 ---
  async function handleGenerateEdit() {
    const userPrompt = editPrompt.trim();
    if (!selectedStructureInstruction && !userPrompt) {
      // --- 修改：提示信息改为英文 ---
      message.warn('Please select a structure change or describe your edit requirements.');
      return;
    }
    if (!editingSectionId || !originalSectionHtml) {
        // --- 修改：提示信息改为英文 ---
        message.error('Cannot generate edit: Missing section ID or original HTML.');
        handleCancelEditPrompt(); // 关闭并重置
        return;
    }

    setIsGeneratingEdit(true);
    setProposedSectionHtml(''); // 清空旧建议
    setOriginalSectionHtmlForPreview(''); // 清空旧的预览原始HTML

    // 组合指令 (逻辑不变)
    let combinedInstructions = '';
    if (selectedStructureInstruction) {
      combinedInstructions += `Structural requirement: "${selectedStructureInstruction}"\n`;
    }
    if (userPrompt) {
      combinedInstructions += `Additional details: "${userPrompt}"`;
    }
    if (selectedStructureInstruction && !userPrompt) {
        combinedInstructions = `Apply this structure change: "${selectedStructureInstruction}"`;
    }
    if (!selectedStructureInstruction && userPrompt) {
        combinedInstructions = userPrompt;
    }

    try {
      // --- 修改：日志信息改为英文 ---
      console.log('Sending combined instructions to API:', combinedInstructions);
      const response = await apiClient.regenerateSection({
        instructions: combinedInstructions.trim(),
        sectionHtml: originalSectionHtml,
      });

      if (response && response.code === 200 && response.data) {
        const newHtml = response.data;
        // 1. 存储建议 (仍然需要传递给预览函数)
        setProposedSectionHtml(newHtml);
        // 2. 关闭 Modal
        setShowEditPromptModal(false);
        // --- 调用预览函数，预览函数内部会处理滚动 ---
        startPreviewingEdit(editingSectionId, newHtml);
        // 预览函数内部会显示通知，这里不再重复显示 message.success

      } else {
        // --- 修改：错误信息改为英文 ---
        throw new Error(response?.message || 'API did not return the expected HTML content.');
      }

    } catch (error) {
      // --- 修改：日志和提示信息改为英文 ---
      console.error('Error generating AI edit:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate AI edit.';
      message.error(`Error: ${errorMessage}`);
      // 失败时保持 Modal 打开，不清空 proposedSectionHtml
    } finally {
      // 无论成功失败，生成过程结束
      setIsGeneratingEdit(false);
      // 注意：成功时 proposedSectionHtml 已被设置，不清空
      // 成功时 editingSectionId 等状态在 startPreviewingEdit 后由 cancel/accept 清理
      // 失败时不清空，以便用户重试或修改
    }
  }

  // --- 新增：开始预览编辑 ---
  function startPreviewingEdit(sectionId, newHtml) {
    // --- 修改：日志信息改为英文 ---
    console.log(`Starting preview for section ${sectionId}`);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      // --- 修改：提示信息改为英文 ---
      message.error('Iframe content not accessible for preview.');
      // 如果无法预览，需要重置状态，否则用户可能卡住
      handleCancelEditPrompt(); // 使用取消逻辑来重置状态
      return;
    }
    const doc = iframe.contentDocument;
    const element = doc.getElementById(sectionId);

    if (element) {
      setOriginalSectionHtmlForPreview(element.outerHTML);
      const newElement = parseHtmlString(newHtml, doc, sectionId);

      if (newElement && element.parentNode) {
        element.parentNode.replaceChild(newElement, element);
        // --- 替换后滚动到新元素 ---
        scrollToSection(sectionId); // 调用滚动函数
        setIsPreviewingOriginal(false);
        setIsPreviewingEdit(true); // 激活预览模式
        // 显示预览通知
        // --- 修改：通知信息改为英文 ---
        showNotification('Previewing AI suggestion. Use toggle to compare or accept/discard.', 'info', 6000);

      } else {
        // --- 修改：日志和提示信息改为英文 ---
        console.error("Error replacing element for preview:", newHtml);
        message.error("Failed to apply preview. Please check the generated HTML structure.");
        setOriginalSectionHtmlForPreview('');
        // 预览失败，重置相关状态
        setIsPreviewingEdit(false);
        setEditingSectionId(null); // 重置当前编辑的 section
        setProposedSectionHtml(''); // 清空失败的建议
      }
    } else {
      // --- 修改：日志和提示信息改为英文 ---
      console.warn(`Element with id "${sectionId}" not found in iframe for preview.`);
      message.warn(`Could not find section ${sectionId} to preview.`);
       // 找不到元素，重置相关状态
       setIsPreviewingEdit(false);
       setEditingSectionId(null);
       setProposedSectionHtml('');
    }
  }

  // --- 更新：取消预览编辑 ---
  function cancelPreviewEdit() {
    // --- 修改：日志信息改为英文 ---
    console.log('Discarding edit...');
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument || !editingSectionId || !originalSectionHtmlForPreview) {
      // --- 修改：日志信息改为英文 ---
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
           // --- 恢复后滚动到元素 ---
           scrollToSection(editingSectionId);
         }
         // --- 修改：通知信息改为英文 ---
         showNotification('AI edit discarded.', 'info');
      } else {
         // --- 修改：日志和提示信息改为英文 ---
         console.error("Error restoring element during discard:", originalSectionHtmlForPreview);
         message.error("Failed to fully restore original content. You might need to refresh.");
      }
    } else if (!originalSectionHtmlForPreview && element) {
       // 如果没有缓存的原始 HTML，至少移除预览样式
       element.style.outline = 'none';
       // --- 修改：日志信息改为英文 ---
       console.warn("Original HTML for preview was missing, only removed highlight.");
    } else {
      // --- 修改：日志信息改为英文 ---
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
    // --- 修改：日志和提示信息改为英文 ---
    console.log('Accepting edit...');
    if (!editingSectionId || !proposedSectionHtml) {
      message.error("Cannot accept: Missing sectionId or proposed HTML.");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      // --- 修改：提示信息改为英文 ---
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
      // --- 修改：日志信息改为英文 ---
      console.log("Switching back to proposed version before accepting...");
      const proposedElement = parseHtmlString(proposedSectionHtml, doc, editingSectionId);
      if (element && element.parentNode && proposedElement) {
        element.parentNode.replaceChild(proposedElement, element);
        element = proposedElement; // 更新 element 引用到当前正确的节点
        setIsPreviewingOriginal(false); // 更新状态
      } else {
        // --- 修改：提示信息改为英文 ---
        message.error("Failed to switch to proposed version before saving. Aborting.");
        // 不重置状态，让用户可以手动取消或重试
        return;
      }
    }

    // 移除预览高亮
    if (element) {
      element.style.outline = 'none';
      // --- 移除高亮后，保存前，滚动到元素 ---
      scrollToSection(editingSectionId);
    } else {
      // --- 修改：日志信息改为英文 ---
      console.warn(`Element with id "${editingSectionId}" not found for removing highlight before saving.`);
      // 即使找不到元素也要尝试保存，因为 HTML 可能已经更新
    }

    // --- 移除：不再在此处更新 title ---
    // updateIframeTitle(pageTitle);
    // --- 移除结束 ---

    // 获取包含已接受更改的完整 HTML
    const updatedFullHtml = doc.documentElement.outerHTML;

    setSaving(true);
    showNotification('Applying changes...', 'info', 1500);

    try {
      await apiClient.editAlternativeHtml({
        html: updatedFullHtml,
        resultId: pageId,
      });
      showNotification('AI edit accepted and applied!', 'success');
    } catch (e) {
      console.error('Save failed after accepting AI edit:', e);
      showNotification('Failed to save accepted changes', 'error');
      // 注意：此时 iframe 中的内容是修改后的，但保存失败了。
      // 可能需要提示用户手动保存或提供重试机制。
      if (element) {
          element.style.outline = '3px dashed #ef4444';
          // --- 出错时也滚动到问题区域 ---
          scrollToSection(editingSectionId);
      }
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
           // --- 修改：日志信息改为英文 ---
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
      // --- 修改：提示信息改为英文 ---
      message.warn("Cannot toggle: Preview context is missing.");
      return;
    }
    const doc = iframe.contentDocument;
    const currentElement = doc.getElementById(editingSectionId);

    if (!currentElement || !currentElement.parentNode) {
      // --- 修改：提示信息改为英文 ---
      message.error(`Cannot toggle: Section element with ID "${editingSectionId}" not found in iframe.`);
      // 尝试退出预览状态？
      cancelPreviewEdit(); // 调用取消可能更安全
      return;
    }

    // 确定要切换到的 HTML 内容
    const targetHtml = isPreviewingOriginal ? proposedSectionHtml : originalSectionHtmlForPreview;
    const newElement = parseHtmlString(targetHtml, doc, editingSectionId);

    if (newElement) {
      // --- 修改：日志信息改为英文 ---
      console.log(`Toggling preview to: ${isPreviewingOriginal ? 'Proposed' : 'Original'}`);
      currentElement.parentNode.replaceChild(newElement, currentElement);
      setIsPreviewingOriginal(!isPreviewingOriginal); // 更新状态

      // --- 切换后滚动到视图 ---
      scrollToSection(editingSectionId); // 调用滚动函数

    } else {
      // --- 修改：提示信息改为英文 ---
      message.error("Failed to switch preview version due to HTML parsing error.");
      // 如果切换失败，可能需要考虑恢复到某个已知状态或提示用户
    }
  }
  // --- 切换预览版本结束 ---

  // --- 新增：处理常用提示点击事件 ---
  const handleCommonPromptClick = (prompt) => {
    setEditPrompt(prev => {
      // 如果当前输入框为空，直接设置；否则，在前面加一个空格再追加
      return prev.trim() === '' ? prompt : `${prev.trim()} ${prompt}`;
    });
  };

  // --- 新增：开始直接编辑 Section 代码 ---
  function handleInitiateCodeEdit(sectionId) {
    console.log(`Initiating code edit for section: ${sectionId}`);
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      message.error('Iframe content not ready.');
      return;
    }
    const doc = iframe.contentDocument;
    const element = doc.getElementById(sectionId);

    if (element) {
      // 滚动到区域
      scrollToSection(sectionId);
      // 设置状态并打开 Modal
      setCodeEditingSectionId(sectionId);
      setSectionCodeContent(element.outerHTML); // 获取当前 HTML
      setIsEditingSectionCode(true); // 打开代码编辑 Modal
    } else {
      message.error(`Could not find section "${sectionId}" in the preview to edit.`);
      setCodeEditingSectionId(null);
    }
  }

  // --- 新增：取消代码编辑 ---
  function handleCancelCodeEdit() {
    setIsEditingSectionCode(false);
    setSectionCodeContent('');
    setCodeEditingSectionId(null);
  }

  // --- 新增：保存代码编辑 ---
  async function handleSaveCodeEdit() {
    if (!codeEditingSectionId || !sectionCodeContent) {
      message.error("Cannot save: Missing section ID or code content.");
      return;
    }

    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentDocument) {
      message.error('Iframe content not accessible to save changes.');
      handleCancelCodeEdit(); // 关闭 Modal 并重置
      return;
    }
    const doc = iframe.contentDocument;
    const originalElement = doc.getElementById(codeEditingSectionId);

    if (!originalElement || !originalElement.parentNode) {
       message.error(`Cannot save: Original section element with ID "${codeEditingSectionId}" not found.`);
       handleCancelCodeEdit();
       return;
    }

    // 尝试解析并替换
    try {
      // 使用 parseHtmlString (或类似逻辑) 创建新元素
      // 注意：parseHtmlString 可能会添加预览样式，我们可能需要移除或调整
      const tempDiv = doc.createElement('div');
      tempDiv.innerHTML = sectionCodeContent.trim();
      let newElement = tempDiv.firstChild;
      while (newElement && newElement.nodeType !== 1) {
        newElement = newElement.nextSibling;
      }

      if (!newElement || newElement.nodeType !== 1) {
         // 尝试包裹
         const wrapper = doc.createElement('div'); // 用 div 包裹，避免引入 section 标签
         while(tempDiv.firstChild) {
            wrapper.appendChild(tempDiv.firstChild);
         }
         if (wrapper.childNodes.length === 1 && wrapper.firstChild.nodeType === 1) {
             newElement = wrapper.firstChild;
         } else {
             // 如果还是不行，可能需要更复杂的处理或报错
             throw new Error("Parsed HTML did not result in a single root element.");
         }
      }

      if (newElement && newElement.nodeType === 1) {
        newElement.id = codeEditingSectionId; // 确保 ID 正确
        // 移除 parseHtmlString 可能添加的样式 (如果用了的话)
        newElement.style.outline = '';
        newElement.style.transition = '';

        // 替换 DOM 中的元素
        originalElement.parentNode.replaceChild(newElement, originalElement);
        console.log(`Section ${codeEditingSectionId} updated with new code.`);

        // --- 移除：不再在此处更新 title ---
        // updateIframeTitle(pageTitle);
        // --- 移除结束 ---

        const updatedFullHtml = doc.documentElement.outerHTML;

        setSaving(true);
        showNotification('Applying code changes...', 'info', 1500);

        await apiClient.editAlternativeHtml({
          html: updatedFullHtml,
          resultId: pageId,
        });

        showNotification('Code changes applied successfully!', 'success');
        handleCancelCodeEdit(); // 关闭 Modal

      } else {
        throw new Error("Could not parse edited code into a valid element.");
      }

    } catch (error) {
      console.error('Error saving code edit:', error);
      message.error(`Failed to save code changes: ${error.message}`);
      // 保存失败，不关闭 Modal，让用户可以复制或重试
    } finally {
      setSaving(false);
    }
  }

  // --- Render Logic ---
  if (loading && !html) { // Show initial loading spinner
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        {/* === 确保 contextHolder 在这里也渲染，以防 message 在加载时弹出 === */}
        {contextHolder}
        <Spin size="large" tip="Loading Editor..." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f172a' /* slate-950 */ }}>
      {/* === 渲染 contextHolder === */}
      {contextHolder}
      {/* --- 顶部 Header --- */}
      <div style={{
        height: 60,
        background: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
        backdropFilter: 'blur(4px)',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
        zIndex: 10,
        // justifyContent: 'space-between', // Remove space-between, let items flow left
        gap: '24px', // Add gap between main sections
        flexShrink: 0,
      }}>
        {/* Page Editor Title and ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1' }}>Page Editor</span>
          <span style={{ fontWeight: 400, fontSize: 14, color: '#64748b' }}>
            (PageId: {pageId})
          </span>
        </div>

        {/* Page Title Input Area */}
        {/* === 修改：靠左放置，限制最大宽度 === */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          // marginLeft: 'auto', // 移除，不再推到右边
          // marginRight: '32px', // 移除
          gap: '12px',
          maxWidth: '600px', // 保持最大宽度限制
          width: '100%', // 允许缩小
          flexShrink: 1, // Allow shrinking if needed, but less prioritized than others
        }}>
          <span style={{ color: '#94a3b8', fontSize: '13px', marginRight: '8px', fontWeight: 500, flexShrink: 0 }}>Title:</span>
          <Input
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="Enter page title"
            style={{
              flexGrow: 1,
              background: 'rgba(15, 23, 42, 0.7)',
              borderColor: '#334155',
              color: '#e2e8f0',
            }}
            disabled={loading || saving || isPreviewingEdit || isEditingSectionCode || isSavingTitle}
          />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveTitle}
            loading={isSavingTitle}
            disabled={loading || saving || isPreviewingEdit || isEditingSectionCode || isSavingTitle || !pageTitle.trim()}
            title="Save Page Title"
            style={{ background: '#2563eb', borderColor: '#2563eb', flexShrink: 0 }}
          >
            Save Title
          </Button>
        </div>

        {/* Right Aligned Controls Placeholder */}
        {/* === 修改：使用 marginLeft: 'auto' 将其推到最右边 === */}
        <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
          {/* Future global buttons like Save All, Exit etc. */}
        </div>
      </div>
      {/* --- 更新：编辑模式提示条样式 --- */}
      <div style={{
        // 使用更深的背景和柔和的文字颜色
        background: 'rgba(15, 23, 42, 0.8)', // slate-900/80
        color: '#94a3b8', // slate-400
        padding: '6px 24px', // 调整内边距
        textAlign: 'center',
        fontSize: 13, // 调整字体大小
        fontWeight: 500, // 调整字重
        zIndex: 9,
        borderBottom: '1px solid rgba(51, 65, 85, 0.4)', // 更细的边框 (slate-700/40)
        userSelect: 'none',
        flexShrink: 0, // 防止提示条被压缩
      }}>
        <span>
          🖱️ Click <span style={{ fontWeight: 600, color: '#cbd5e1' /* slate-300 */ }}>text</span> or <span style={{ fontWeight: 600, color: '#cbd5e1' /* slate-300 */ }}>images</span> to edit. Changes save automatically.
        </span>
      </div>
      {/* Page Rendering Area - Flex Layout */}
      <div style={{ flex: 1, background: '#020617', /* 更深的背景 (slate-950/near black) */ display: 'flex', overflow: 'hidden' }}>

        {/* Left Section Navigation (will be styled next) */}
        {sections.length > 0 && (
          <div
            className="section-nav-scrollbar" // Keep class for scrollbar styling
            style={{
              width: 320,
              background: '#0f172a', // Default background (slate-950) - will refine
              padding: '24px 8px 24px 16px',
              overflowY: 'auto',
              borderRight: '1px solid #1e293b', // Default border (slate-800) - will refine
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
              flexShrink: 0, // Prevent shrinking
            }}>
            {/* --- 更新：导航栏标题 --- */}
            <div style={{
              color: '#94a3b8', // 标题颜色 (slate-400)
              fontSize: 14, // 稍小的字体
              fontWeight: 600, // 稍细的字重
              padding: '0 8px 16px 8px', // 调整内边距
              borderBottom: '1px solid #1e293b', // 分隔线 (slate-800)
              marginBottom: 12, // --- 修改：减少底部外边距 ---
              textTransform: 'uppercase',
              letterSpacing: '0.5px', // 调整字间距
            }}>
              Page Sections {/* <--- 修改标题 */}
            </div>
            {sections.map((section, index) => (
              // --- 更新：导航项容器样式 - 增加分隔线和悬停效果 ---
              <div
                key={section.id || index}
                style={{
                  padding: '12px 8px', // 增加垂直内边距
                  borderRadius: '6px',
                  transition: 'background-color 0.2s ease',
                  borderBottom: index < sections.length - 1 ? '1px solid #1e293b' : 'none', // slate-800 分隔线
                  cursor: 'pointer',
                  marginRight: '8px',
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#1e293b'; }} // slate-800 hover 背景
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => !isPreviewingEdit && scrollToSection(section.id)}
              >
                {/* --- 更新：Section 标签按钮 (保持悬停指示) --- */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPreviewingEdit) scrollToSection(section.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1', // slate-300
                    padding: '0', // 移除内边距
                    textAlign: 'left',
                    borderRadius: 4,
                    cursor: isPreviewingEdit ? 'not-allowed' : 'pointer', // 根据状态改变指针
                    fontSize: 15,
                    fontWeight: 500,
                    width: '100%',
                    transition: 'color 0.2s ease, border-left-color 0.2s ease',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: '1.4',
                    marginBottom: '10px', // 与 AI 按钮的间距
                    // 保持悬停时出现的左侧边框
                    borderLeft: '3px solid transparent', // 默认透明
                    paddingLeft: '8px', // 为边框留出空间并增加文本缩进
                  }}
                  onMouseOver={e => {
                     if (!isPreviewingEdit) {
                       e.currentTarget.style.color = '#f1f5f9'; // slate-100 hover 文字颜色
                       e.currentTarget.style.borderLeftColor = '#38bdf8'; // 悬停时显示亮蓝色边框 (cyan-500)
                     }
                    }}
                  onMouseOut={e => {
                     e.currentTarget.style.color = '#cbd5e1'; // slate-300 默认文字颜色
                     e.currentTarget.style.borderLeftColor = 'transparent'; // 鼠标移开时隐藏边框
                    }}
                  title={`Scroll to: ${section.label}`} // 更新 title
                  disabled={isPreviewingEdit}
                >
                  {section.label}
                </button>
                {/* --- "AI Regenerate" 按钮 (保持样式，确保对齐) --- */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '11px' /* 与标题对齐 */ }}>
                  <Button
                    type="primary"
                    size="small"
                    onClick={(e) => {
                       e.stopPropagation(); // 阻止事件冒泡
                       handleInitiateEdit(section.id);
                    }}
                    disabled={isPreviewingEdit || isGeneratingEdit || isEditingSectionCode} // 增加 isEditingSectionCode 禁用条件
                    style={{
                      background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 12px',
                      color: '#ffffff',
                      boxShadow: '0 2px 5px rgba(56, 189, 248, 0.3)',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      // 移除左边距，由父 div 控制
                      // marginLeft: '11px',
                    }}
                    onMouseOver={e => {
                      if (!isPreviewingEdit && !isGeneratingEdit && !isEditingSectionCode) { // 增加 isEditingSectionCode 条件
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(56, 189, 248, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(56, 189, 248, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title={`AI Regenerate Section: ${section.label}`}
                  >
                    AI Regenerate
                  </Button>
                  {/* --- 新增：编辑代码按钮 --- */}
                  <Button
                    // type="default" // 使用默认样式或自定义
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInitiateCodeEdit(section.id);
                    }}
                    disabled={isPreviewingEdit || isGeneratingEdit || isEditingSectionCode} // 禁用条件
                    style={{
                      // background: '#475569', // slate-600
                      // color: '#e2e8f0', // slate-200
                      // border: '1px solid #64748b', // slate-500
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px', // 调整 padding
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                     onMouseOver={e => {
                      if (!isPreviewingEdit && !isGeneratingEdit && !isEditingSectionCode) {
                        // e.currentTarget.style.background = '#64748b'; // slate-500
                        // e.currentTarget.style.borderColor = '#94a3b8'; // slate-400
                      }
                    }}
                    onMouseOut={e => {
                      // e.currentTarget.style.background = '#475569'; // slate-600
                      // e.currentTarget.style.borderColor = '#64748b'; // slate-500
                    }}
                    title={`Edit Code for Section: ${section.label}`}
                  >
                    Edit Code
                  </Button>
                </div>
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
        {/* Edit Sidebar - Updated Style for Right Sidebar */}
        {showSidebar && (
          <Drawer
            // --- 修改：根据类型动态设置标题 ---
            title={
              currentEdit.elementType === 'img' ? 'Edit Image Source' :
              currentEdit.elementType === 'a' ? 'Edit Link' :
              'Edit Content'
            }
            placement="right"
            closable={true} // 显示关闭按钮
            onClose={closeSidebar}
            open={showSidebar}
            width={350} // 保持宽度
            maskClosable={true}
            footer={
              <div style={{ textAlign: 'right' }}>
                <Button onClick={closeSidebar} style={{ marginRight: 8 }} size="large">
                  Cancel
                </Button>
                <Button onClick={saveContent} type="primary" loading={saving} size="large">
                  Save Changes
                </Button>
              </div>
            }
            // --- 新增：为 Drawer Body 添加内边距 ---
            styles={{ body: { padding: '16px 24px' } }} // 调整内边距
          >
            {/* --- 修改：根据 elementType 渲染不同内容 --- */}
            {currentEdit.elementType === 'img' ? (
              <>
                {/* 图片编辑相关 UI (保持不变) */}
                <Input.TextArea
                  value={currentEdit.content}
                  onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                  style={{
                    width: '100%',
                    marginBottom: 12,
                    fontFamily: 'monospace',
                    height: '150px', // 调整高度
                    resize: 'none',
                  }}
                  placeholder="Enter image URL or select an image"
                />
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <Button
                    type="primary"
                    onClick={() => setShowImageLibrary(true)}
                  >
                    Select/Upload Image
                  </Button>
                </div>
                {/* Image Preview (保持不变) */}
                {currentEdit.content && (
                  <div style={{ textAlign: 'center', background: '#f0f0f0', padding: 8, borderRadius: 8, marginBottom: 16 }}>
                    <img src={currentEdit.content} alt="Preview" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 4, display: 'block', margin: 'auto' }} />
                  </div>
                )}
                {/* Image Library Modal (保持不变) */}
                <Modal
                  open={showImageLibrary}
                  title="Image Library"
                  onCancel={() => setShowImageLibrary(false)}
                  footer={null}
                  width={1800} // 保持宽度 1200px (如果需要更宽请告知)
                  destroyOnClose={true}
                  // --- 修改：使用 styles.body 替代 bodyStyle ---
                  styles={{
                    body: {
                      maxHeight: '65vh', // 保持最大高度
                      overflowY: 'auto', // 保持垂直滚动
                    }
                  }}
                >
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                    >
                      Upload Image
                    </Button>
                  </div>
                  <Spin spinning={imageLoading} tip="Loading images...">
                    {imageAssets.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <h3>No Images Yet</h3>
                        <p>Please upload some images first.</p>
                      </div>
                    ) : (
                      <>
                        <Row gutter={[16, 16]}>
                          {imageAssets.map(asset => (
                            <Col xs={24} sm={12} md={8} lg={6} key={asset.mediaId}>
                              <div
                                style={{
                                  border: '1px solid #d9d9d9',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  transition: 'border-color 0.3s',
                                  background: '#fff', // 确保有背景色
                                }}
                                onClick={() => {
                                  setCurrentEdit({ ...currentEdit, content: asset.mediaUrl });
                                  setShowImageLibrary(false);
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1890ff'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#d9d9d9'}
                              >
                                <div style={{
                                  position: 'relative',
                                  width: '100%',
                                  // Maintain aspect ratio (e.g., 16:9)
                                  paddingTop: '56.25%', // 16:9 aspect ratio (9 / 16 * 100)
                                  background: '#f0f0f0', // Placeholder background
                                }}>
                                  {/* 使用 mediaUrl 作为 src, mediaName 作为 alt */}
                                  <img
                                    src={asset.mediaUrl}
                                    alt={asset.mediaName}
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover' // Ensure image covers the area
                                    }}
                                    // Optional: Add error handling for broken images
                                    onError={(e) => { e.target.style.display = 'none'; /* Hide broken image icon */ }}
                                  />
                                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                                    <Popconfirm
                                      title="Are you sure you want to delete this image?"
                                      onConfirm={e => { e.stopPropagation(); handleDeleteImage(asset); }}
                                      onClick={e => e.stopPropagation()}
                                      okButtonProps={{ danger: true }}
                                    >
                                      <Button
                                        type="primary"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </Popconfirm>
                                  </div>
                                </div>
                                <div style={{ padding: '8px 12px' }}>
                                  <div style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: 13,
                                    color: '#333'
                                  }}>{asset.mediaName}</div>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                        {/* Pagination */}
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
                            style={{ display: imageTotal > 0 ? 'flex' : 'none' }}
                          />
                        </div>
                      </>
                    )}
                  </Spin>
                  {/* Upload Image Modal (移除深色样式) */}
                  <Modal
                    open={uploadModalVisible}
                    title="Upload New Image"
                    onCancel={() => setUploadModalVisible(false)}
                    footer={[
                      <Button key="back" onClick={() => setUploadModalVisible(false)}>
                        Cancel
                      </Button>,
                      <Button key="submit" type="primary" loading={uploading} onClick={handleUpload} disabled={!uploadFile || !mediaName}>
                        Upload
                      </Button>,
                    ]}
                    // --- 新增：确保上传弹窗关闭时清空状态 ---
                    destroyOnClose
                  >
                    {!uploadFile ? (
                      <div
                        style={{
                          border: '2px dashed #d9d9d9', // --- 默认虚线边框色 ---
                          borderRadius: 8,
                          padding: 32,
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: '#fafafa', // --- 浅灰背景 ---
                          // color: '#9ca3af' // --- 移除颜色 ---
                        }}
                        onClick={() => document.getElementById('image-upload-input').click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#1890ff'; }} // 拖拽悬停高亮
                        onDragLeave={e => e.currentTarget.style.borderColor = '#d9d9d9'}
                        onDrop={e => {
                          e.preventDefault();
                          e.currentTarget.style.borderColor = '#d9d9d9';
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            if (file.size > 1024 * 1024) {
                              // --- 修改：提示信息改为英文 ---
                              message.error('File size cannot exceed 1MB');
                              return;
                            }
                            setUploadFile(file);
                            setPreviewUrl(URL.createObjectURL(file));
                            setMediaName(file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_'));
                          }
                        }}
                      >
                        <UploadOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} /> {/* Ant Design 主色 */}
                        <p>Click or drag file to this area to upload</p>
                        <p style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 12, marginTop: 8 }}> {/* 默认提示文字颜色 */}
                          Support for JPG, PNG, WebP format (Max 1MB)
                        </p>
                        <input
                          type="file"
                          id="image-upload-input"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 1024 * 1024) {
                                // --- 修改：提示信息改为英文 ---
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
                        <div style={{ textAlign: 'center', marginBottom: 16, background: '#f0f0f0', padding: 8, borderRadius: 8 }}> {/* 浅灰背景 */}
                          <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
                        </div>
                        <Input
                          value={mediaName}
                          onChange={e => setMediaName(e.target.value)}
                          placeholder="Enter file name"
                          maxLength={50}
                          style={{ marginBottom: 12 }} // --- 移除深色样式 ---
                          // placeholderTextColor="#6b7280"
                        />
                        <Input.TextArea
                          value={mediaDesc}
                          onChange={e => setMediaDesc(e.target.value)}
                          placeholder="Enter description (optional)"
                          maxLength={200}
                          rows={3}
                          // --- 移除深色样式 ---
                          // style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #4b5563' }}
                          // placeholderTextColor="#6b7280"
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                          <Button type="primary" danger onClick={() => {
                            setUploadFile(null);
                            setPreviewUrl('');
                            setMediaName('');
                            setMediaDesc('');
                          }} icon={<DeleteOutlined />}> {/* --- 移除背景色 --- */}
                            Remove
                          </Button>
                        </div>
                      </>
                    )}
                  </Modal>
                </Modal>
              </>
            ) : currentEdit.elementType === 'a' ? (
              // --- 新增：链接编辑区域 ---
              <>
                {/* --- 修改：仅当 content 不为空时显示 Link Text 编辑 --- */}
                {currentEdit.content && currentEdit.content.trim().length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#4b5563' }}>Link Text</label>
                    <Input.TextArea
                      value={currentEdit.content}
                      onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                      style={{
                        width: '100%',
                        height: '100px',
                        resize: 'none',
                      }}
                      placeholder="Enter link text"
                    />
                  </div>
                )}
                {/* --- Link URL 编辑 (始终显示) --- */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#4b5563' }}>Link URL (href)</label>
                  <Input
                    value={currentEdit.linkHref}
                    onChange={e => setCurrentEdit({ ...currentEdit, linkHref: e.target.value })}
                    style={{ width: '100%' }}
                    placeholder="e.g., https://example.com or /page"
                  />
                </div>
              </>
            ) : (
              // --- 修改：普通文本编辑区域 ---
              <>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#4b5563' }}>Text Content</label>
                <Input.TextArea
                  value={currentEdit.content}
                  onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                  style={{
                    width: '100%',
                    height: '300px', // 保持较大高度
                    resize: 'none',
                  }}
                />
              </>
            )}
          </Drawer>
        )}

      <Drawer
        title={`AI Edit Section: ${sections.find(s => s.id === editingSectionId)?.label || ''}`}
        placement="right"
        closable={true} // 显示关闭按钮
        onClose={handleCancelEditPrompt} // 关闭时调用取消函数
        open={showEditPromptModal} // 使用相同的 state 控制显示
        width={750} // --- 修改：增加 Drawer 宽度 ---
        maskClosable={true} 
        footer={ // 将原 Modal 的 footer 内容移到这里
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {/* --- 修改：增大按钮尺寸 --- */}
            <Button key="cancel" onClick={handleCancelEditPrompt} disabled={isGeneratingEdit} size="large">
              Cancel
            </Button>
            {/* --- 修改：增大按钮尺寸 --- */}
            <Button
              key="generate"
              type="primary"
              onClick={handleGenerateEdit}
              loading={isGeneratingEdit}
              disabled={(!selectedStructureInstruction && !editPrompt.trim()) || isGeneratingEdit}
              style={{ /* 样式逻辑不变 */
                background: (!selectedStructureInstruction && !editPrompt.trim() || isGeneratingEdit) ? '#e5e7eb' : 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
                borderColor: (!selectedStructureInstruction && !editPrompt.trim() || isGeneratingEdit) ? '#d1d5db' : '#38bdf8',
                color: (!selectedStructureInstruction && !editPrompt.trim() || isGeneratingEdit) ? '#6b7280' : '#ffffff',
              }}
              size="large" // --- 新增：增大按钮尺寸 ---
            >
              {isGeneratingEdit ? 'Generating...' : 'Generate & Preview'}
            </Button>
          </div>
        }
        // --- 新增：为 Drawer Body 添加内边距 ---
        styles={{ body: { padding: '24px' } }}
      >
        {/* 将原 Modal 的内容移到 Drawer 内部 */}
        <Spin spinning={isGeneratingEdit} tip="Regenerating...">

          {/* --- 更新：结构选择区域 --- */}
          {!isGeneratingEdit && ( // 仅在未生成中时显示
            <div style={{ marginBottom: '24px' }}>
              {/* --- 修改：使用彩色高亮提示文本 --- */}
              <p style={{ color: '#2563eb', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>
                Maybe you want to change the layout? (click to select/deselect)
              </p>
              {/* --- 按类别分组渲染 (Comparison 分类已移除) --- */}
              {Object.entries(
                // Group options by category
                structureOptions.reduce((acc, option) => {
                  const category = option.category || 'Other';
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(option);
                  return acc;
                }, {})
              ).map(([category, optionsInCategory]) => (
                 // ... (category rendering logic remains the same) ...
                 <div key={category} style={{ marginBottom: '24px' }}> {/* Add margin between categories */}
                  {/* Category Title (样式不变) */}
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#1f2937', // slate-800
                    borderBottom: '1px solid #e5e7eb', // gray-200
                    paddingBottom: '8px',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {category} Sections
                  </h4>
                  {/* Options within the category */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}> {/* Increased gap */}
                    {optionsInCategory.map(option => {
                      const isSelected = selectedStructureInstruction === option.instruction;
                      return (
                        <div
                          key={option.id}
                          onClick={() => handleStructureSelect(option.instruction)}
                          style={{
                            border: `2px solid ${isSelected ? '#38bdf8' : '#d1d5db'}`,
                            borderRadius: '8px',
                            padding: '12px', // Increased padding
                            cursor: 'pointer',
                            textAlign: 'center',
                            width: 'calc(33.33% - 11px)', // 3 columns
                            minWidth: '150px',
                            background: isSelected ? '#f0f9ff' : '#fff',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            boxShadow: isSelected ? '0 0 0 2px rgba(56, 189, 248, 0.3)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minHeight: '130px', // Reduced min height
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#9ca3af'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#d1d5db'; }}
                          title={option.instruction}
                        >
                          {isSelected && (
                            <CheckCircleFilled style={{ color: '#0ea5e9', fontSize: '16px', position: 'absolute', top: '6px', right: '6px' }} />
                          )}
                          <div style={{ marginBottom: '8px', width: '100%', height: '60px' /* Reduced wireframe height */, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {option.wireframe}
                          </div>
                          <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 500, lineHeight: '1.3', marginTop: 'auto' }}>
                            {option.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分隔线 (可选) */}
          {!isGeneratingEdit && (selectedStructureInstruction || editPrompt) && <div style={{ borderTop: '1px solid #e5e7eb', margin: '24px 0' }}></div>}

          {/* 提示输入区域 */}
          <div style={{ marginBottom: '16px' }}>
             {/* --- 修改：使用彩色高亮提示文本 --- */}
            <p style={{ color: '#2563eb', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>
              {selectedStructureInstruction ? 'Optional: Add specific instructions' : 'Or describe the changes you want?'}
            </p>
            <Input.TextArea
              rows={6}
              placeholder={selectedStructureInstruction ? "e.g., 'Focus on the benefits for small businesses'" : "e.g., 'Make the tone more professional', 'Add a sentence about our new service', 'Rewrite this to be shorter'"}
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              disabled={isGeneratingEdit}
              style={{ resize: 'none' }}
            />
          </div>

          {/* 提示：如果选择了结构，可以不输入文字 (逻辑不变) */}
          {selectedStructureInstruction && !editPrompt.trim() && !isGeneratingEdit && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '-8px', marginBottom: '16px' }}>
              You can generate based on the selected structure alone, or add more details above.
            </p>
          )}

          {/* --- 新增：常用提示区域 --- */}
          {!isGeneratingEdit && ( // 仅在未生成时显示
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                Quick prompts (click to add):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {commonPrompts.map(prompt => (
                  <Tag
                    key={prompt}
                    onClick={() => handleCommonPromptClick(prompt)}
                    style={{
                      cursor: 'pointer',
                      background: '#f3f4f6', // 浅灰色背景 (gray-100)
                      borderColor: '#e5e7eb', // 边框颜色 (gray-200)
                      color: '#4b5563', // 文字颜色 (gray-600)
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e5e7eb'; // 悬停背景 (gray-200)
                      e.currentTarget.style.borderColor = '#d1d5db'; // 悬停边框 (gray-300)
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f3f4f6'; // 默认背景
                      e.currentTarget.style.borderColor = '#e5e7eb'; // 默认边框
                    }}
                  >
                    {prompt}
                  </Tag>
                ))}
              </div>
            </div>
          )}

        </Spin>
      </Drawer>
      {/* --- AI 编辑 Drawer 结束 --- */}

      {/* AI 编辑预览控件 (逻辑不变) */}
      {isPreviewingEdit && editingSectionId && (
         // ... JSX for preview controls ...
         <div style={{ /* 样式不变 */
           position: 'absolute',
           bottom: '40px',
           left: '50%',
           transform: 'translateX(-50%)',
           background: 'rgba(31, 41, 55, 0.9)', // slate-800 with opacity
           padding: '12px 20px',
           borderRadius: '8px',
           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
           zIndex: 1000,
           display: 'flex',
           alignItems: 'center',
           gap: '16px', // 增加按钮间距
           backdropFilter: 'blur(3px)', // 添加模糊背景效果
         }}>
           <span style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500, marginRight: '8px' /* 增加右边距 */ }}>
              Previewing AI Edit for "{sections.find(s => s.id === editingSectionId)?.label || 'Section'}"
           </span>
           {/* 切换预览按钮 */}
           <Button
             onClick={togglePreviewVersion}
             size="small"
             style={{ /* 样式不变 */
               background: '#4b5563', // slate-600
               color: 'white',
               border: '1px solid #6b7280', // slate-500 border
              }}
              disabled={saving} // 保存时禁用切换
           >
             {isPreviewingOriginal ? 'Show Suggestion' : 'Show Original'}
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
      </div>
      {/* --- 新增：代码编辑 Modal --- */}
      <Modal
        title={`Edit Code for Section: ${codeEditingSectionId || ''}`}
        open={isEditingSectionCode}
        onCancel={handleCancelCodeEdit}
        width="80vw" // 使用视口宽度的 80%
        // height="70vh" // 可以设置高度，但通常 Modal 会自适应内容
        destroyOnClose // 关闭时销毁内部状态
        footer={[
          <Button key="back" onClick={handleCancelCodeEdit}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" loading={saving} onClick={handleSaveCodeEdit}>
            Save Code Changes
          </Button>,
        ]}
        styles={{ // 使用 styles 来自定义 body 样式
          body: {
             height: '65vh', // 设置 Modal Body 的固定高度
             overflowY: 'hidden', // 隐藏 Modal Body 的滚动条
             padding: '0', // 移除内边距，让 TextArea 占满
          }
        }}
      >
        <Input.TextArea
          value={sectionCodeContent}
          onChange={e => setSectionCodeContent(e.target.value)}
          placeholder="Enter HTML code for the section..."
          style={{
            height: '100%', // 占满 Modal Body 高度
            width: '100%', // 占满 Modal Body 宽度
            fontFamily: 'monospace', // 使用等宽字体
            fontSize: '14px',
            lineHeight: '1.6',
            border: 'none', // 移除边框
            resize: 'none', // 禁止调整大小
            outline: 'none', // 移除聚焦时的轮廓
            padding: '16px', // 添加内边距
            overflowY: 'auto', // 允许文本域内部滚动
            background: '#1e293b', // 深色背景 (slate-800)
            color: '#e2e8f0', // 亮色文字 (slate-200)
          }}
        />
      </Modal>
      {/* --- 代码编辑 Modal 结束 --- */}
    </div>
  );
}
