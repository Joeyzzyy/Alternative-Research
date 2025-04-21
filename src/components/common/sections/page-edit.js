import React, { useEffect, useRef, useState } from 'react'
import apiClient from '../../../lib/api/index.js';
import { Button, Modal, Spin, Row, Col, Pagination, Popconfirm, Input, Form, message } from 'antd';
import { UploadOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

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
    type: 'success' // 'success' or 'error'
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

  // Show notification and set auto-hide
  const showNotification = (message, type = 'success', duration = 3000) => {
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
      `;
      doc.head.appendChild(style);

      // 额外处理独立文字区域
      Array.from(doc.body.querySelectorAll('*')).forEach(node => {
        if (
          !node.hasAttribute?.('canEdit') &&
          node.tagName.toLowerCase() !== 'img' &&
          node.childNodes.length === 1 &&
          node.childNodes[0].nodeType === 3 &&
          node.textContent.trim().length > 0
        ) {
          node.style.cursor = 'pointer';
        }
      });
    }
  }, [html]);

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
      message.info('All text and image areas on the page can be edited by clicking them.');
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
          background: notification.type === 'success' ? '#4caf50' : '#f44336', // Success green, error red
          color: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1050, // Ensure it's on the top layer
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
      {/* Page Rendering Area */}
      <div style={{ flex: 1, background: '#18181c', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <div style={{ color: '#a5b4fc', fontSize: 22, fontWeight: 500 }}>Loading...</div>
        ) : error ? (
          <div style={{ color: '#f87171', fontSize: 20, fontWeight: 500 }}>{error}</div>
        ) : (
          <iframe
            ref={iframeRef}
            style={{
              width: '95%',
              height: '90%',
              border: '1px solid #334155',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 4px 32px #0006'
            }}
            sandbox="allow-same-origin allow-scripts"
            title="Page Preview"
          />
        )}
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
    </div>
  );
}
