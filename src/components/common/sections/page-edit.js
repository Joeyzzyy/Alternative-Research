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

  // Clean up styles and edit buttons for all editable elements
  function clearEditableElements(doc) {
    if (!doc) return;
    const editableElements = [
      ...doc.querySelectorAll('[canedit]'),
      ...doc.querySelectorAll('img'),
      ...doc.querySelectorAll('a')
    ];
    editableElements.forEach(el => {
      el.style.outline = '';
      el.style.cursor = '';
      el.style.position = '';
      // Remove edit button
      Array.from(el.childNodes).forEach(child => {
        if (
          child.nodeType === 1 &&
          child.textContent === 'EDIT' &&
          child.style &&
          child.style.position === 'absolute'
        ) {
          el.removeChild(child);
        }
      });
      el.onclick = null;
    });
  }

  // Setup editable elements
  function setupEditableElements(doc) {
    const editableElements = [
      ...doc.querySelectorAll('[canedit]'),
      ...doc.querySelectorAll('img'),
      ...doc.querySelectorAll('a')
    ];
    editableElements.forEach(el => {
      el.style.outline = '2px solid #1890ff';
      el.style.cursor = 'pointer';
      el.style.position = 'relative';
      // Add edit button
      const editBtn = doc.createElement('div');
      editBtn.innerHTML = `
        <div style="
          position: absolute;
          right: 0;
          top: 0;
          background: linear-gradient(135deg, #1890ff, #0050b3);
          color: white;
          padding: 2px 8px;
          font-size: 12px;
          border-radius: 0 0 0 6px;
          cursor: pointer;
          z-index: 100;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        ">EDIT</div>
      `;
      el.appendChild(editBtn.firstChild);

      el.onclick = (e) => {
        e.stopPropagation();
        if (el.tagName.toLowerCase() === 'a') {
          e.preventDefault();
        }
        setCurrentEdit({
          element: el,
          content: el.tagName.toLowerCase() === 'img'
            ? el.getAttribute('src') || ''
            : el.textContent.trim(),
          selector: el.getAttribute('canedit') || '',
          originalContent: el.tagName.toLowerCase() === 'img'
            ? el.getAttribute('src') || ''
            : el.textContent.trim()
        });
        setShowSidebar(true);
      };
    });
  }

  // Save edited content
  async function saveContent() {
    if (!currentEdit.element) {
      // Use custom notification to display error
      showNotification('No editable element selected', 'error');
      return;
    }
    setSaving(true);
    const doc = iframeRef.current?.contentDocument; // Get doc
    if (!doc) {
      // Use custom notification to display error
      showNotification('Iframe document not found', 'error');
      setSaving(false);
      return;
    }

    try {
      // Update content in the iframe
      if (currentEdit.element.tagName.toLowerCase() === 'img') {
        currentEdit.element.setAttribute('src', currentEdit.content);
      } else {
        // Note: Directly setting textContent will remove all child elements, if the element has complex structure (like <span>), it might be lost
        // If internal structure needs to be preserved, more complex update logic might be required
        currentEdit.element.textContent = currentEdit.content;
      }

      // Before extracting HTML, clean up all editing-related styles and buttons
      clearEditableElements(doc);

      // Extract the cleaned HTML
      const updatedHtml = doc.documentElement.outerHTML;

      // Reset editing state
      setupEditableElements(doc);

      await apiClient.editAlternativeHtml({
        html: updatedHtml,
        resultId: pageId,
      });

      // Update local state to reflect the saved HTML (theoretically should be consistent with updatedHtml)
      // But to ensure the iframe displays the latest saved version, you can reset the html state
      // setHtml(updatedHtml); // Or consider re-fetching data after successful save

      setShowSidebar(false);
      // Use custom notification to display success message
      showNotification('Saved successfully', 'success');
    } catch (e) {
      console.error('Save failed:', e); // Add log for easier debugging
      // Use custom notification to display error
      showNotification('Save failed', 'error');
      // If save fails, editing state should also be reapplied
      setupEditableElements(doc);
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
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(html);
      doc.close();

      // Function to handle clicks within the iframe
      const handleIframeClick = (e) => {
        // Find the nearest ancestor anchor tag or the element itself if it's an anchor
        let targetElement = e.target;
        while (targetElement && targetElement.tagName !== 'A') {
          targetElement = targetElement.parentElement;
        }

        // If an anchor tag was clicked or is an ancestor of the clicked element
        if (targetElement && targetElement.tagName === 'A') {
          console.log('Anchor click intercepted:', targetElement.href); // For debugging
          e.preventDefault(); // Prevent navigation
          e.stopPropagation(); // Stop the event from propagating further

          // Optional: Still trigger the edit sidebar for the anchor
          // Find the original element that has the onclick handler attached by setupEditableElements
          // Note: findEditableElement might not be strictly necessary now if we base logic on e.target
          const editableAnchor = targetElement; // We already found the anchor

          // --- Start Edit ---
          // Determine content based on the actual clicked element (e.target)
          let contentToEdit = '';
          let originalContentToEdit = '';
          let elementToEdit = editableAnchor; // Default to anchor

          if (e.target.tagName === 'IMG') {
            // If the direct click target was an image within the anchor
            contentToEdit = e.target.getAttribute('src') || '';
            originalContentToEdit = e.target.getAttribute('src') || '';
            elementToEdit = e.target; // Set element to the image itself for context
             console.log('Editing image src via anchor intercept:', contentToEdit);
          } else {
            // Otherwise, edit the anchor's text content
            contentToEdit = editableAnchor.textContent.trim();
            originalContentToEdit = editableAnchor.textContent.trim();
             console.log('Editing anchor text via anchor intercept:', contentToEdit);
          }

          // Manually trigger the logic to open the sidebar
          setCurrentEdit({
            element: elementToEdit, // Use the determined element (IMG or A)
            content: contentToEdit,
            selector: elementToEdit.getAttribute('canedit') || (editableAnchor ? editableAnchor.getAttribute('canedit') : '') || '', // Get selector from image or anchor
            originalContent: originalContentToEdit
          });
          // --- End Edit ---
          setShowSidebar(true);

          return false; // Explicitly indicate the event is handled
        }
      };

      // Helper function to find the element setupEditableElements attached the handler to
      // This might become less critical with the direct e.target check above, but kept for now.
      const findEditableElement = (startElement, document) => {
         let current = startElement;
         while (current && current !== document.body) {
            if (current.hasAttribute('canedit') || current.tagName === 'IMG' || current.tagName === 'A') {
               if (current.tagName === 'A') return current;
               // If the start element itself is the image, return it
               if (startElement.tagName === 'IMG' && current === startElement) return startElement;
            }
            current = current.parentElement;
         }
         return null;
      }


      // Add the click listener to the iframe document in the capture phase
      doc.addEventListener('click', handleIframeClick, true); // true for capture phase

      // Setup editable elements (highlighting, edit buttons, sidebar trigger)
      clearEditableElements(doc);
      setupEditableElements(doc);


      // Cleanup function to remove the listener when the component unmounts or html changes
      return () => {
        if (doc) { // Check if doc still exists on cleanup
           doc.removeEventListener('click', handleIframeClick, true);
        }
      };
    }
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

      {/* Top Bar */}
      <div style={{
        height: 56,
        background: 'linear-gradient(90deg, #232c5b 0%, #3a225a 100%)',
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
          Page Editor Preview
          <span style={{ fontWeight: 400, fontSize: 16, marginLeft: 24, color: '#e0e7ef' }}>
            (PageId: {pageId})
          </span>
        </div>
        <button
          onClick={() => window.open(`https://preview.websitelm.site/en/${pageId}`, '_blank')}
          style={{
            background: '#10b981', // Emerald green color
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#059669'}
          onMouseOut={e => e.currentTarget.style.background = '#10b981'}
        >
          Preview
        </button>
      </div>
      {/* Edit Mode Hint (Always visible) */}
      <div style={{
        background: '#1e40af', // Blue background
        color: '#e0f2fe', // Light blue text
        padding: '8px 32px',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        zIndex: 9
      }}>
        Editing mode is active. Link clicks are disabled. All elements highlighted with a blue border are editable and replaceable.
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
        {/* Edit Sidebar */}
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
              background: '#23233a',
              color: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 32px #0008',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>
                {currentEdit.element?.tagName === 'IMG' ? 'Edit Image Source' : 'Edit Content'}
              </div>
              <div style={{ marginBottom: 16 }}>
                {currentEdit.element?.tagName === 'IMG' ? (
                  <>
                    <textarea
                      value={currentEdit.content}
                      onChange={e => setCurrentEdit({ ...currentEdit, content: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        borderRadius: 8,
                        border: '1px solid #334155',
                        padding: 12,
                        fontSize: 16,
                        background: '#18181c',
                        color: '#fff',
                        fontFamily: 'monospace'
                      }}
                      placeholder="Enter image URL or select an image"
                    />
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        style={{
                          background: '#38bdf8',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 16px',
                          fontWeight: 500,
                          fontSize: 15,
                          cursor: 'pointer'
                        }}
                        onClick={() => setShowImageLibrary(true)}
                      >Select/Upload Image</button>
                    </div>
                    {/* Image Preview */}
                    {currentEdit.content && (
                      <div style={{ marginTop: 12, textAlign: 'center' }}>
                        <img src={currentEdit.content} alt="Preview" style={{ maxWidth: 320, maxHeight: 180, borderRadius: 8, background: '#fff' }} />
                      </div>
                    )}
                    {/* Image Library Modal */}
                    <Modal
                      open={showImageLibrary}
                      title="Image Library"
                      onCancel={() => setShowImageLibrary(false)}
                      footer={null}
                      width={800}
                      styles={{ body: { background: '#f9fafb' } }}
                    >
                      <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                          Upload Image
                        </Button>
                      </div>
                      <Spin spinning={imageLoading}>
                        {imageAssets.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
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
                                      background: '#fff',
                                      border: '1px solid #E5E7EB',
                                      borderRadius: 12,
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      transition: 'all 0.3s'
                                    }}
                                    onClick={() => {
                                      setCurrentEdit({ ...currentEdit, content: asset.url });
                                      setShowImageLibrary(false);
                                    }}
                                  >
                                    <div style={{
                                      height: 120,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#F3F4F6',
                                      position: 'relative'
                                    }}>
                                      <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                                        <Popconfirm
                                          title="Are you sure you want to delete this image?"
                                          onConfirm={e => { e.stopPropagation(); handleDeleteImage(asset); }}
                                          onClick={e => e.stopPropagation()}
                                        >
                                          <Button type="text" danger icon={<DeleteOutlined />} />
                                        </Popconfirm>
                                      </div>
                                    </div>
                                    <div style={{ padding: 8 }}>
                                      <div style={{
                                        fontSize: 13,
                                        color: '#1a1a1a',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
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
                              />
                            </div>
                          </>
                        )}
                      </Spin>
                      {/* Upload Image Modal */}
                      <Modal
                        open={uploadModalVisible}
                        title="Upload Image"
                        onCancel={() => setUploadModalVisible(false)}
                        onOk={handleUpload}
                        okButtonProps={{
                          disabled: !uploadFile || !mediaName,
                          loading: uploading
                        }}
                        destroyOnClose
                      >
                        {!uploadFile ? (
                          <div
                            style={{
                              border: '2px dashed #d9d9d9',
                              borderRadius: 8,
                              padding: 32,
                              textAlign: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => document.getElementById('image-upload-input').click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                              e.preventDefault();
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
                            <UploadOutlined style={{ fontSize: 32, color: '#3B82F6', marginBottom: 8 }} />
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
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                              <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                            </div>
                            <Input
                              value={mediaName}
                              onChange={e => setMediaName(e.target.value)}
                              placeholder="Enter file name"
                              maxLength={50}
                              style={{ marginBottom: 12 }}
                            />
                            <Input.TextArea
                              value={mediaDesc}
                              onChange={e => setMediaDesc(e.target.value)}
                              placeholder="Enter description (optional)"
                              maxLength={200}
                              rows={3}
                            />
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                              <Button type="primary" danger onClick={() => {
                                setUploadFile(null);
                                setPreviewUrl('');
                                setMediaName('');
                                setMediaDesc('');
                              }} icon={<DeleteOutlined />}>
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
                      border: '1px solid #334155',
                      padding: 12,
                      fontSize: 16,
                      background: '#18181c',
                      color: '#fff',
                      fontFamily: 'monospace'
                    }}
                    placeholder="Enter content"
                  />
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  onClick={closeSidebar}
                  style={{
                    background: '#64748b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontWeight: 500,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                >Cancel</button>
                <button
                  onClick={saveContent}
                  disabled={saving}
                  style={{
                    background: '#38bdf8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 24px',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: 'pointer',
                    opacity: saving ? 0.6 : 1
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
