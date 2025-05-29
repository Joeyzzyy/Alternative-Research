import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../lib/api/index.js';
import { Modal, Button, Spin, message, Tooltip, Radio } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, ExportOutlined, LeftOutlined, CopyOutlined, RightOutlined, CloseOutlined, ClearOutlined, EditOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
import HtmlPreview from './page-edit';
import PublishSettingsModal from './publish-setting-modal';

const HistoryCardList = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [resultDetail, setResultDetail] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);
  const [failedModal, setFailedModal] = useState({ open: false, id: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [selectedPublishUrl, setSelectedPublishUrl] = useState('');
  const [deployPreviewUrl, setDeployPreviewUrl] = useState('');
  const scrollRef = useRef(null);
  const [hasToken, setHasToken] = useState(true);
  const [slugInput, setSlugInput] = useState('');
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null); // 新增：存储 Customer ID
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // 新增：控制详情弹窗侧边栏可见性
  const [isPublishSettingsModalVisible, setIsPublishSettingsModalVisible] = useState(false); // 新增：控制发布设置弹窗
  const currentItem = resultDetail?.data?.find(item => item.resultId === selectedPreviewId) || {};
  const [retryConfirm, setRetryConfirm] = useState({ open: false, website: null }); // 新增：重试确认弹窗状态
  const [deletePageConfirm, setDeletePageConfirm] = useState({ open: false, resultId: null });

  // === 新增：统一样式的确认弹窗 ===
  const confirmationModalStyles = {
    mask: {
      backdropFilter: 'blur(5px)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    content: {
      backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900 with opacity
      border: '1px solid rgba(51, 65, 85, 0.7)', // slate-700 with opacity
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
    },
    // body 样式由 Tailwind class 控制，默认 padding 即可
  };

  // === 修改：扩展函数用于检查URL参数并执行相应操作 ===
  const checkUrlAndOpenModal = (list) => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenModal = urlParams.get('openPreviewModal') === 'true';
    const actionType = urlParams.get('action');
    
    if (shouldOpenModal && list && list.length > 0) {
      const firstValidItem = list.find(item => item.generatorStatus === 'finished') || list[0];
      
      if (firstValidItem) {
        // 仅设置状态，不执行额外操作
        handleCardClick(firstValidItem, async () => {
          try {
            const res = await apiClient.getAlternativeWebsiteResultList(firstValidItem.websiteId);
            
            if (res?.data?.[0]?.resultId) {
              setSelectedPreviewId(res.data[0].resultId);
              // 移除这里的直接操作，让状态更新后通过 useEffect 处理
            }
          } catch (error) {
          }
        });
      }
    }
  };

  // 获取历史数据
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('alternativelyAccessToken');
      if (!token) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      setHasToken(true);
      const customerId = localStorage.getItem('alternativelyCustomerId');
      setCurrentCustomerId(customerId);
      const res = await apiClient.getAlternativeWebsiteList(1, 200);
      let list = [];
      if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res.list)) {
        list = res.list;
      }

      // === 修改：直接设置历史列表，不再分批查询 status，也不再过滤 init 状态 ===
      setHistoryList(list);
      checkUrlAndOpenModal(list);
    } catch (e) {
      setHistoryList([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('alternativelyAccessToken');
    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }
    setHasToken(true);
    // 新增：获取 Customer ID
    const customerId = localStorage.getItem('alternativelyCustomerId');
    setCurrentCustomerId(customerId);

    fetchHistory();
    // === 新增：每隔1分钟自动刷新任务列表 ===
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 60000); // 60,000 毫秒 = 1分钟

    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  // === 新增：监听登录成功事件，自动刷新历史数据 ===
  useEffect(() => {
    const handleLoginSuccess = () => {
      // 检查 token 是否存在
      const token = localStorage.getItem('alternativelyAccessToken');
      if (token) {
        setHasToken(true);
        fetchHistory();
      }
    };
    window.addEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('alternativelyLoginSuccess', handleLoginSuccess);
    };
  }, []);

  // 删除历史记录
  const handleDelete = async (id, closeModalOnSuccess = false) => {
    setDeletingId(id);
    try {
      const res = await apiClient.deletePage?.(id);
      if (res && res.code === 200) {
        messageApi.success('Deleted successfully');
        await fetchHistory(); 
        if (closeModalOnSuccess) {
          handleModalClose();
        }
      } else {
        messageApi.error('Failed to delete');
      }
    } catch (e) {
      messageApi.error('Failed to delete');
    }
    setDeletingId(null);
  };

  const executeClearAll = async () => {
    setIsClearingAll(true);
    setClearAllConfirmOpen(false); // 关闭确认弹窗
    const idsToDelete = historyList.map(item => item.websiteId);

    if (idsToDelete.length === 0) {
      messageApi.info('No history records to clear.');
      setIsClearingAll(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const totalCount = idsToDelete.length;

    for (let i = 0; i < totalCount; i++) {
      const id = idsToDelete[i];
      try {
        // 显示进度（可选）
        messageApi.loading({
          content: `Deleting ${i + 1} of ${totalCount}...`,
          key: 'clearing',
          duration: 0 // 持续显示直到手动关闭或替换
        });
        const res = await apiClient.deletePage?.(id);
        if (res && res.code === 200) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to delete item with ID: ${id}`, res);
        }
      } catch (e) {
        failCount++;
        console.error(`Error deleting item with ID: ${id}`, e);
      }
      // 控制删除速度：每删除一个后等待 500ms (1秒删除2个)
      if (i < totalCount - 1) { // 最后一个不需要等待
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 清除 loading 提示
    messageApi.destroy('clearing');

    // 显示最终结果
    if (failCount === 0) {
      messageApi.success(`Successfully cleared all ${successCount} records.`);
    } else {
      messageApi.warning(`Finished clearing. ${successCount} succeeded, ${failCount} failed.`);
    }

    await fetchHistory(); // 刷新列表
    setIsClearingAll(false);
  };

  // 暗色+浅色+低透明度卡片背景
  const cardColors = [
    'rgba(30, 41, 59, 0.7)',   // dark blue-gray
    'rgba(71, 85, 105, 0.6)',  // slate
    'rgba(203, 213, 225, 0.5)',// light slate
    'rgba(255, 255, 255, 0.4)',// white low opacity
    'rgba(100, 116, 139, 0.5)' // blue-gray
  ];

  // 点击卡片时，默认选中第一个 resultId
  const handleCardClick = async (item, callback) => {
    
    if (item.generatorStatus === 'failed') {
      setFailedModal({ open: true, id: item.websiteId });
      return;
    }
    
    if (item.generatorStatus === 'processing') {
      // === 修改开始：触发recover模式，参考layout的实现 ===
      // 构建带有taskId和status参数的URL
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('taskId', item.websiteId);
      currentUrl.searchParams.set('status', 'processing');
      
      // 更新URL并刷新页面以触发recover模式
      window.location.href = currentUrl.toString();
      return;
      // === 修改结束 ===
    }
    
    setSelectedItem(item);
    setResultLoading(true);
    setResultDetail(null);
    setSelectedPreviewId(null);
    
    try {
      const res = await apiClient.getAlternativeWebsiteResultList(item.websiteId);
      
      setResultDetail(res);
      
      // 使用 Promise 确保状态更新完成
      await new Promise(resolve => {
        if (Array.isArray(res?.data) && res.data.length > 0) {
          setSelectedPreviewId(res.data[0].resultId);
          setSlugInput(res.data[0].slug || '');
        }
        // 给状态更新一些时间
        setTimeout(resolve, 200);
      });
      
      // 在确保状态更新完成后执行回调
      if (typeof callback === 'function') {
        callback();
      }
    } catch (e) {
      console.error('处理卡片点击 - 错误:', e);
      setResultDetail({ error: 'Failed to load details.' });
    }
    
    setResultLoading(false);
    setSelectedPublishUrl('');
    setDeployPreviewUrl('');
  };

  const handleModalClose = () => {
    setSelectedItem(null);
    setResultDetail(null);
    setSelectedPreviewId(null);
    setIsSidebarVisible(true); // 新增：关闭弹窗时重置侧边栏状态
  };

  useEffect(() => {
    if (
      selectedPublishUrl &&
      resultDetail &&
      Array.isArray(resultDetail.data) &&
      selectedPreviewId
    ) {
      const previewItem = resultDetail.data.find(i => i.resultId === selectedPreviewId);
      if (previewItem) {
        setDeployPreviewUrl(`https://${selectedPublishUrl}/en/${previewItem.slug}`);
      } else {
        setDeployPreviewUrl('');
      }
    } else {
      setDeployPreviewUrl('');
    }
  }, [selectedPublishUrl, resultDetail, selectedPreviewId]);

  useEffect(() => {
    if (
      resultDetail &&
      Array.isArray(resultDetail.data) &&
      selectedPreviewId
    ) {
      const current = resultDetail.data.find(i => i.resultId === selectedPreviewId);
      setSlugInput(current?.slug || '');
    }
  }, [selectedPreviewId, resultDetail]);

  // === 新增：useEffect 监听 verifiedDomains 变化并设置默认选中项 ===
  useEffect(() => {
    // 仅当 verifiedDomains 数组更新且包含元素时执行
    if (Array.isArray(verifiedDomains) && verifiedDomains.length > 0) {
      // 默认选中列表中的第一个 URL
      setSelectedPublishUrl(verifiedDomains[0]);
    } else {
      // 如果 verifiedDomains 为空（例如加载失败或确实没有），确保 selectedPublishUrl 也为空
      setSelectedPublishUrl('');
    }
    // 这个 effect 依赖于 verifiedDomains 状态
  }, [verifiedDomains]);

  // === 新增：函数用于渲染任务状态标签 ===
  const renderStatusBadge = (status) => {
    let statusColor = "text-blue-400 bg-blue-900/50 border-blue-700";
    let statusText = "Processing";
    if (status === "finished") {
      statusColor = "text-green-400 bg-green-900/50 border-green-700";
      statusText = "Finished";
    } else if (status === "failed") {
      statusColor = "text-red-400 bg-red-900/50 border-red-700";
      statusText = "Failed";
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xxs font-bold border ${statusColor}`}>
        {statusText}
      </span>
    );
  };


  // === 新增：发布成功后的回调函数 ===
  const handlePublishSuccess = async () => {
    messageApi.info('Refreshing task details...');
    // 重新获取当前选中任务的详情
    if (selectedItem?.websiteId) {
      setResultLoading(true); // 显示加载状态
      try {
        const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
        setResultDetail(res);
        // 保持当前选中的 previewId，如果它仍然存在
        if (Array.isArray(res?.data) && res.data.some(d => d.resultId === selectedPreviewId)) {
          // 不需要改变 selectedPreviewId
        } else if (Array.isArray(res?.data) && res.data.length > 0) {
          // 如果之前的 previewId 不存在了，默认选中第一个
          setSelectedPreviewId(res.data[0].resultId);
          setSlugInput(res.data[0].slug || '');
        } else {
          // 如果没有结果了
          setSelectedPreviewId(null);
          setSlugInput('');
        }
      } catch (e) {
        setResultDetail({ error: 'Failed to reload details after publish.' });
        messageApi.error('Failed to reload task details.');
      } finally {
        setResultLoading(false); // 结束加载状态
      }
    }
    // 可选：也可以刷新整个列表，如果发布状态影响列表显示
    // await fetchHistory();
  };

  // === 新增：域名更改后的回调函数 ===
  const handleDomainChange = async () => {
    messageApi.info('Domain settings changed, refreshing product info...');
    // 重新获取产品信息，这会更新传递给 Modal 的 currentProductInfo
    // await fetchProductInfo(); // 删除：不再调用获取产品信息
  };

  // 新增：使用 useEffect 监听 URL 参数和选中状态的变化
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const actionType = urlParams.get('action');
    
    // 仅当有选中的预览ID且URL中包含action参数时执行操作
    if (selectedPreviewId) {
      if (actionType === 'edit') {
        window.open(`/page-edit/${selectedPreviewId}`, '_blank');
      } else if (actionType === 'bind') {
        // 打开绑定域名弹窗
        setIsPublishSettingsModalVisible(true);
      }
      
      // 清除 URL 参数
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('openPreviewModal');
      newUrl.searchParams.delete('action');
      newUrl.searchParams.delete('openHistoryList');
      window.history.replaceState({}, '', newUrl);
    }
  }, [selectedPreviewId]); // 依赖于 selectedPreviewId

  // === 新增：替代方案：使用自定义事件 ===
  const handleRetryTask = async (website) => {
    try {
      messageApi.loading({ content: 'Restarting task...', key: 'retryTask', duration: 0 });
      
      // 发送自定义事件
      const retryEvent = new CustomEvent('retryTask', { 
        detail: { website } 
      });
      window.dispatchEvent(retryEvent);
      
      // 监听任务启动成功事件
      const handleTaskStarted = () => {
        messageApi.destroy('retryTask');
        messageApi.success('Task restarted successfully');
        setRetryConfirm({ open: false, website: null });
        setTimeout(() => {
          fetchHistory();
        }, 2000);
        window.removeEventListener('taskStarted', handleTaskStarted);
      };
      
      window.addEventListener('taskStarted', handleTaskStarted);
      
      // 设置超时，防止无限等待
      setTimeout(() => {
        window.removeEventListener('taskStarted', handleTaskStarted);
        messageApi.destroy('retryTask');
        messageApi.error('Task restart timeout. Please try again.');
      }, 10000); // 10秒超时
      
    } catch (error) {
      console.error('Failed to restart task:', error);
      messageApi.destroy('retryTask');
      messageApi.error('Failed to restart task');
    }
  };

  if (!hasToken) {
    return null;
  }

  return (
    <div id="result-preview-section" className="h-full flex flex-col from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee20_0%,_transparent_50%)] opacity-70 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse pointer-events-none"></div>
      <div className="relative z-10 w-full flex flex-col">
        {contextHolder}
        <div className="w-full max-w-7xl px-4 mt-4 mb-2 flex justify-center items-center mx-auto">
          <div
            className="text-base font-semibold tracking-wide text-transparent bg-clip-text mr-3"
            style={{
              backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)'
            }}
          >
            My Tasks
          </div>
          {/* 刷新按钮 */}
          <button
            className="flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-2 transition border border-slate-700 mr-2"
            style={{ width: 32, height: 32 }}
            onClick={fetchHistory}
            disabled={loading || isClearingAll}
            title="Refresh"
          >
            {loading ? (
              <Spin size="small" />
            ) : (
              <ReloadOutlined style={{ fontSize: 18, color: '#38bdf8' }} />
            )}
          </button>
          {/* === 新增：全部清除按钮 === */}
          <button
            className="flex items-center justify-center bg-red-800/70 hover:bg-red-700/80 rounded-full p-2 transition border border-red-700 mr-2"
            style={{ width: 32, height: 32 }}
            onClick={() => setClearAllConfirmOpen(true)}
            disabled={loading || isClearingAll || historyList.length === 0}
            title="Clear All"
          >
            {isClearingAll ? (
              <Spin size="small" />
            ) : (
              <ClearOutlined style={{ fontSize: 18, color: '#fca5a5' }} />
            )}
          </button>
        </div>
        <div
          className={`
            w-full max-w-4xl px-4 py-2 relative mx-auto
            transition-opacity duration-300 ease-in-out opacity-100
          `}
        >
          <div
            className="overflow-y-auto"
            ref={scrollRef}
            style={{
              scrollBehavior: 'smooth',
              maxHeight: 'calc(100vh - 180px)'
            }}
          >
            <div className="space-y-3 py-2">
              {loading ? (
                <div className="flex items-center justify-center w-full h-[120px]">
                  <Spin />
                </div>
              ) : historyList.length === 0 ? (
                <div className="flex items-center justify-center w-full text-gray-400 text-lg h-[120px]">
                  No history available
                </div>
              ) : (
                historyList.map((item, idx) => {
                  // 状态颜色
                  let statusColor = "text-blue-400";
                  let statusText = "Processing";
                  if (item.generatorStatus === "finished") {
                    statusColor = "text-green-400";
                    statusText = "Finished";
                  } else if (item.generatorStatus === "failed") {
                    statusColor = "text-red-400";
                    statusText = "Failed";
                  }
                  return (
                    <div
                      key={item.websiteId}
                      className={`
                        group relative rounded-lg bg-white/5 hover:bg-white/10 transition
                        shadow-md p-1.5 flex flex-col items-start justify-between
                        min-h-[48px] w-full max-w-md mx-auto
                        border border-white/10 hover:border-primary-500
                        cursor-pointer
                        pl-2 pr-2
                      `}
                      style={{paddingTop: 6, paddingBottom: 6}} // 保持紧凑
                      onClick={() => handleCardClick(item)}
                    >
                      <div className="w-full flex flex-col items-start">
                        <div className="flex w-full justify-between items-center mb-0.5">
                          <div className="font-semibold text-[10px] text-gray-300">
                            Target Website
                          </div>
                        </div>
                        <div className="font-semibold text-xs text-white mb-0.5 truncate w-full text-left">
                          {item.website}
                        </div>
                        <div className="mb-0.5">
                          <span className={`text-[10px] font-bold ${statusColor}`}>{statusText}</span>
                        </div>
                        <div className="flex w-full justify-between items-center text-[10px] text-gray-400 mb-0.5">
                          <span>ID: <span className="text-gray-300 font-mono">{item.websiteId}</span></span>
                          {item.created_at && (
                            <span>Created: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                        <div className="flex w-full justify-between items-center text-[10px] text-gray-500 mb-0.5">
                          <span>Start: {item.generatedStart ? new Date(item.generatedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                          <span>End: {item.generatedEnd ? new Date(item.generatedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                        </div>
                        {item.generatorStatus === 'finished' && item.resultId && (
                          <div className="w-full h-8 rounded-md overflow-hidden border border-white/10 mb-1">
                            <iframe
                              src={`https://preview.websitelm.site/en/${item.resultId}`}
                              title="Preview"
                              className="w-full h-full"
                              frameBorder="0"
                            />
                          </div>
                        )}
                      </div>
                      {/* Delete button */}
                      <button
                        className="absolute top-1 right-1 bg-red-700/60 hover:bg-red-800/70 text-white rounded-full p-1 shadow transition"
                        title="Delete"
                        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, id: item.websiteId });
                        }}
                        disabled={deletingId === item.websiteId || isClearingAll}
                      >
                        <DeleteOutlined style={{ fontSize: 10 }} />
                      </button>
                      {/* === 新增：失败任务的重新开始按钮 === */}
                      {item.generatorStatus === 'failed' && (
                        <Tooltip title="Restart Task" placement="left">
                          <button
                            className="absolute top-1 right-7 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white rounded-full p-1 shadow-lg transition-all duration-200 border border-orange-400/50 hover:border-orange-300"
                            title="Restart Task"
                            style={{ 
                              width: 20, 
                              height: 20, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(251, 146, 60, 0.4)' // 橙色阴影
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setRetryConfirm({ open: true, website: item.website });
                            }}
                            disabled={deletingId === item.websiteId || isClearingAll}
                          >
                            <ReloadOutlined style={{ fontSize: 10 }} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* Delete confirmation modal */}
        <Modal
          open={deleteConfirm.open}
          onCancel={() => setDeleteConfirm({ open: false, id: null })}
          footer={[
            <Button
              key="delete"
              type="primary"
              danger
              loading={deletingId === deleteConfirm.id}
              onClick={async () => {
                const shouldCloseModal = !!selectedItem && selectedItem.websiteId === deleteConfirm.id;
                await handleDelete(deleteConfirm.id, shouldCloseModal);
                setDeleteConfirm({ open: false, id: null });
              }}
            >
              Delete
            </Button>,
            <Button key="cancel" onClick={() => setDeleteConfirm({ open: false, id: null })} className="ant-btn-modal-cancel-dark">
              Cancel
            </Button>
          ]}
          centered
          title={null}
          styles={confirmationModalStyles}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Are you sure you want to delete this task, this action will remove all the pages under this task?</div>
            <div className="mt-2 text-slate-300 text-center">
              This action cannot be undone.
            </div>
          </div>
        </Modal>
        {/* Clear All confirmation modal */}
        <Modal
          open={clearAllConfirmOpen}
          onCancel={() => setClearAllConfirmOpen(false)}
          footer={[
            <Button
              key="confirm"
              type="primary"
              danger
              loading={isClearingAll}
              onClick={executeClearAll}
            >
              Confirm Delete All
            </Button>,
            <Button key="cancel" onClick={() => setClearAllConfirmOpen(false)} disabled={isClearingAll} className="ant-btn-modal-cancel-dark">
              Cancel
            </Button>
          ]}
          centered
          title={null}
          closable={!isClearingAll}
          maskClosable={!isClearingAll}
          styles={confirmationModalStyles}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Are you sure you want to delete ALL records?</div>
            <div className="mt-2 text-slate-300 text-center">
              This action cannot be undone. All history items will be permanently removed.
            </div>
          </div>
        </Modal>
        {/* failed status modal */}
        <Modal
          open={failedModal.open}
          onCancel={() => setFailedModal({ open: false, id: null })}
          footer={[
            <Button
              key="delete"
              type="primary"
              danger
              onClick={() => {
                handleDelete(failedModal.id);
                setFailedModal({ open: false, id: null });
              }}
            >
              Delete
            </Button>,
            <Button key="cancel" onClick={() => setFailedModal({ open: false, id: null })} className="ant-btn-modal-cancel-dark">
              Cancel
            </Button>
          ]}
          centered
          title={null}
          styles={confirmationModalStyles}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Task failed</div>
            <div className="mt-2 text-slate-300 text-center">
              No details are available for this task.<br />
              Would you like to delete it?
            </div>
          </div>
        </Modal>
        {/* === 新增：重试确认弹窗 === */}
        <Modal
          open={retryConfirm.open}
          onCancel={() => setRetryConfirm({ open: false, website: null })}
          footer={[
            <Button
              key="retry"
              type="primary"
              onClick={() => handleRetryTask(retryConfirm.website)}
            >
              Yes, Restart
            </Button>,
            <Button key="cancel" onClick={() => setRetryConfirm({ open: false, website: null })} className="ant-btn-modal-cancel-dark">
              Cancel
            </Button>
          ]}
          centered
          title={null}
          styles={confirmationModalStyles}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ReloadOutlined style={{ fontSize: 40, color: '#3b82f6' }} />
            <div className="mt-4 text-lg font-semibold text-blue-400">Restart Task</div>
            <div className="mt-2 text-slate-300 text-center">
              Do you want to restart the task with <span className="text-cyan-400 font-semibold">{retryConfirm.website}</span> as the target URL?
            </div>
          </div>
        </Modal>

        <Modal
          open={deletePageConfirm.open}
          onCancel={() => setDeletePageConfirm({ open: false, resultId: null })}
          footer={[
            <Button
              key="delete"
              type="primary"
              danger
              onClick={async () => {
                try {
                  console.log('Delete confirmed, calling API with resultId:', deletePageConfirm.resultId);
                  messageApi.loading({ content: 'Deleting page...', key: 'deletePage', duration: 0 });
                  
                  // 检查 API 方法是否存在
                  if (!apiClient.deleteAlternativeResult) {
                    throw new Error('deleteAlternativeResult method not found in apiClient');
                  }
                  
                  // 调用删除API
                  const result = await apiClient.deleteAlternativeResult(deletePageConfirm.resultId);
                  console.log('Delete API response:', result);
                  
                  messageApi.destroy('deletePage');
                  messageApi.success('Page deleted successfully');
                  
                  // 关闭确认弹窗
                  setDeletePageConfirm({ open: false, resultId: null });
                  
                  // 刷新任务详情
                  if (selectedItem?.websiteId) {
                    const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
                    setResultDetail(res);
                    
                    // 如果还有其他页面，选中第一个；否则关闭弹窗
                    if (Array.isArray(res?.data) && res.data.length > 0) {
                      setSelectedPreviewId(res.data[0].resultId);
                      setSlugInput(res.data[0].slug || '');
                    } else {
                      // 没有页面了，关闭弹窗
                      handleModalClose();
                    }
                  }
                } catch (error) {
                  console.error('Delete operation failed:', error);
                  messageApi.destroy('deletePage');
                  messageApi.error('Failed to delete page: ' + error.message);
                }
              }}
            >
              Delete
            </Button>,
            <Button key="cancel" onClick={() => setDeletePageConfirm({ open: false, resultId: null })} className="ant-btn-modal-cancel-dark">
              Cancel
            </Button>
          ]}
          centered
          title={null}
          styles={confirmationModalStyles}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Confirm Delete</div>
            <div className="mt-2 text-slate-300 text-center">
              Are you sure you want to delete this page? This action cannot be undone.
            </div>
          </div>
        </Modal>

        {/* Detailed Modal */}
        {selectedItem && (
          <Modal
            title={
              <span className="text-lg font-semibold text-slate-100">
                Generated Alternative Pages For: <span className="text-cyan-400">{selectedItem.website}</span>
              </span>
            }
            open={!!selectedItem}
            onCancel={handleModalClose}
            footer={null}
            width="90vw"
            destroyOnClose
            maskClosable={true}
            centered
            closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 20 }} />}
            styles={{
              mask: {
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
              },
              wrapper: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              header: {
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
                padding: '12px 20px',
                backdropFilter: 'blur(5px)',
              },
              body: {
                padding: 0,
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(3, 7, 18, 0.95) 100%)',
                height: '80vh',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
              },
              content: {
                padding: 0,
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
                backgroundColor: 'transparent',
                maxHeight: '90vh',
              },
            }}
          >
            {resultLoading ? (
              <div className="flex h-[80vh] items-center justify-center w-full"> {/* Ensure loading takes full width */}
                <Spin size="large" />
              </div>
            ) : resultDetail && Array.isArray(resultDetail.data) && resultDetail.data.length > 0 ? (
              <>
                {/* Left Sidebar - Task Details */}
                <div className="w-[280px] p-4 flex flex-col gap-4 overflow-y-auto border-r border-slate-700/40 bg-slate-950/50 backdrop-blur-md scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 text-xs flex-shrink-0">
                  {/* Task Details Title */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/60 mb-2">
                    <div className="text-base font-semibold text-cyan-300 tracking-wide">
                      Task Details
                    </div>
                  </div>

                  {/* Basic Task Info */}
                  <div className="space-y-1.5 text-slate-300">
                     <div className="font-medium text-cyan-400 text-sm pt-2 mb-1">Task ID:</div>
                     <div className="text-xs font-mono text-slate-100 select-all">{selectedItem.websiteId}</div>
                     {selectedItem.generatedStart && (
                       <>
                         <div className="font-medium text-cyan-400 text-sm pt-2 mb-1">Start Time:</div>
                         <div className="text-xs text-slate-100">
                           {new Date(selectedItem.generatedStart).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                         </div>
                       </>
                     )}
                     {selectedItem.generatedEnd && (
                       <>
                         <div className="font-medium text-cyan-400 text-sm pt-2 mb-1">End Time:</div>
                         <div className="text-xs text-slate-100">
                           {new Date(selectedItem.generatedEnd).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                         </div>
                       </>
                     )}
                     <>
                       <div className="font-medium text-cyan-400 text-sm pt-2 mb-1">Pages Generated:</div>
                       <div className="text-xs text-slate-100">
                         {resultDetail.data.length}
                       </div>
                     </>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-cyan-400 mb-1 pl-1 pt-3">Deploy Status</div>
                    {currentItem.deploymentStatus === 'publish' ? (
                      <div className="flex flex-col gap-2 items-start">
                        <span className="text-green-300 font-semibold text-xs">Published</span>
                        {currentItem.siteUrl && currentItem.slug && (
                          <div className="text-cyan-400 text-xxs mt-0.5 break-all">
                            View:&nbsp;
                            <a
                              href={`${currentItem.siteUrl.replace(/\/$/, '')}/${currentItem.slug}`}
                              className="underline hover:text-cyan-300 transition"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {`${currentItem.siteUrl.replace(/\/$/, '')}/${currentItem.slug}`}
                            </a>
                          </div>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              setResultLoading(true);
                              const resp = await apiClient.updateAlternativePublishStatus(
                                currentItem.resultId,
                                'unpublish',
                                '', // 取消发布时不需要URL
                                ''  // 取消发布时不需要slug
                              );
                              
                              if (resp?.code === 200) {
                                messageApi.success('Unpublished successfully!');
                                handlePublishSuccess(); // 刷新数据
                              } else {
                                messageApi.error(resp?.message || 'Unpublish failed');
                              }
                            } catch (e) {
                              messageApi.error(e.message || 'Unpublish failed');
                            } finally {
                              setResultLoading(false);
                            }
                          }}
                          className="px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center gap-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 border border-red-500/50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                          title="Unpublish this page"
                          disabled={!selectedPreviewId || resultLoading}
                        >
                          <CloseOutlined /> Unpublish
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 items-start">
                        <span className="text-slate-400 text-xs">Not Published</span>
                        <button
                          onClick={() => setIsPublishSettingsModalVisible(true)}
                          className="px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700"
                          title="Bind with your domain"
                          disabled={!selectedPreviewId || resultLoading}
                        >
                          <LinkOutlined /> Bind With Your Domain
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col bg-black/40 overflow-hidden p-1">
                  {(() => {
                    const previewItem = resultDetail.data.find(i => i.resultId === selectedPreviewId);
                    if (!previewItem) {
                      if (resultDetail.data.length > 0) {
                        setSelectedPreviewId(resultDetail.data[0].resultId);
                        return <div className="flex items-center justify-center h-full"><Spin/></div>;
                      }
                      return (
                        <div className="flex items-center justify-center h-full text-slate-500 text-lg">
                          No pages available for preview.
                        </div>
                      );
                    }
                    const isPublished = previewItem.deploymentStatus === 'publish' && previewItem.siteUrl && previewItem.slug;
                    const previewUrl = isPublished
                      ? `${previewItem.siteUrl.replace(/\/$/, '')}/${previewItem.slug}`
                      : `https://preview.websitelm.site/en/${previewItem.resultId}`;

                    return (
                      <div className="w-full h-full bg-slate-950 rounded-lg shadow-inner flex flex-col border border-slate-800/70 overflow-hidden">
                        {/* --- 新增：标签栏 --- */}
                        <div className="flex items-end bg-slate-900/80 border-b border-slate-700/60 px-2 pt-1.5 flex-shrink-0 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                          {resultDetail.data.map((item, idx) => (
                            <button
                              key={item.resultId}
                              onClick={() => setSelectedPreviewId(item.resultId)}
                              className={`
                                px-3 py-1.5 text-xs font-medium rounded-t-md mr-1 transition duration-200 ease-in-out border-t border-l border-r flex items-center gap-1.5 whitespace-nowrap
                                ${selectedPreviewId === item.resultId
                                  ? 'bg-slate-800/90 border-slate-700/70 text-cyan-300 shadow-inner' // Active tab style
                                  : 'bg-slate-950/70 border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' // Inactive tab style
                                }
                              `}
                              title={`View Page ${idx + 1} (ID: ${item.resultId})`}
                            >
                              {/* 可以加个小图标 */}
                              {/* <FileTextOutlined /> */}
                              Page {idx + 1}
                            </button>
                          ))}
                          {/* Optional: Add a small spacer or "+" button if needed */}
                          <div className="flex-grow border-b border-slate-700/60 h-[1px] self-end"></div> {/* Fills remaining space */}
                        </div>
                        {/* --- 结束新增：标签栏 --- */}

                        {/* Header Bar (地址栏和按钮) */}
                        {/* --- 修改：背景色和边框，使其与新标签栏协调 --- */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/50 flex-shrink-0 backdrop-blur-sm">
                          {/* --- 内容保持不变 --- */}
                          <div className="flex items-center flex-1 min-w-0 mr-4">
                            {/* Traffic Lights */}
                            <div className="flex space-x-1.5 mr-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-80"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-80"></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-80"></div>
                            </div>
                            {/* URL Display (现在会根据 selectedPreviewId 自动更新) */}
                            <div className="flex-1 bg-slate-900/70 text-slate-300 text-[11px] px-2 py-1 rounded border border-slate-700 truncate shadow-inner">
                              {previewUrl}
                            </div>
                          </div>
                          {/* Action Buttons (现在会根据 selectedPreviewId 自动更新 currentItem) */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              console.log('Delete button clicked, selectedPreviewId:', selectedPreviewId);
                              if (selectedPreviewId) {
                                console.log('Opening delete page confirmation modal');
                                setDeletePageConfirm({ open: true, resultId: selectedPreviewId });
                              } else {
                                console.log('No selectedPreviewId, button should be disabled');
                              }
                            }}
                              className={`
                                px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center gap-1
                                bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600
                                border border-red-500/50 hover:border-red-400
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                              `}
                              title="Delete This Page"
                              disabled={!selectedPreviewId || resultLoading}
                            >
                              <DeleteOutlined /> Delete Page
                            </button>
                            <button
                              onClick={() => { if (previewUrl) window.open(previewUrl, '_blank'); }}
                              className={`
                                px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center gap-1
                                bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                                border border-cyan-500/50 hover:border-cyan-400
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                              `}
                              title="Preview Page in New Tab"
                              disabled={!selectedPreviewId || resultLoading || !previewUrl}
                            >
                              <ExportOutlined /> Preview
                            </button>
                            <button
                              onClick={() => { 
                                if (selectedPreviewId) {
                                  // 修改：直接使用 /page-edit 路径，不包含语言参数
                                  window.open(`/page-edit/${selectedPreviewId}`, '_blank');
                                }
                              }}
                              className={`
                                px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center gap-1
                                bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
                                border border-purple-500/50 hover:border-purple-400
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                              `}
                              title="Edit This Page"
                              disabled={!selectedPreviewId || resultLoading}
                            >
                              <EditOutlined /> Edit
                            </button>
                            <button
                              onClick={() => setIsPublishSettingsModalVisible(true)}
                              className={`
                                px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center gap-1
                                bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                                border border-blue-500/50 hover:border-blue-400
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                              `}
                              title="Bind with your domain"
                              disabled={!selectedPreviewId || resultLoading}
                            >
                              <LinkOutlined /> Bind With Your Domain
                            </button>
                          </div>
                          {/* --- 结束修改：Header Bar --- */}
                        </div>

                        {/* Iframe Preview (key 确保在 selectedPreviewId 变化时刷新) */}
                        <div className="flex-1 overflow-hidden bg-slate-900">
                          <iframe
                            key={selectedPreviewId} // Re-render iframe when ID changes
                            src={previewUrl}
                            title="Preview"
                            className="w-full h-full border-none"
                            sandbox="allow-scripts allow-same-origin"
                            onError={(e) => console.error("Iframe loading error:", e)}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="flex h-[80vh] items-center justify-center text-slate-500 w-full"> {/* Ensure error takes full width */}
                {resultDetail?.error || 'No data available for this task.'}
              </div>
            )}
          </Modal>
        )}
        {/* === 新增：渲染 PublishSettingsModal === */}
        {isPublishSettingsModalVisible && currentItem && currentCustomerId && (
          <PublishSettingsModal
            open={isPublishSettingsModalVisible}
            onClose={() => setIsPublishSettingsModalVisible(false)}
            apiClient={apiClient}
            messageApi={messageApi}
            currentItem={currentItem} // 传递当前选中的页面项
            currentCustomerId={currentCustomerId} // 传递 Customer ID
            onPublishSuccess={handlePublishSuccess} // 传递发布成功回调
            onDomainChange={handleDomainChange} // 传递域名变更回调
          />
        )}
      </div>
    </div>
  );
};

// 隐藏滚动条样式
// 可以放到全局 CSS，也可以放到组件底部
<style jsx global>{`
  .scrollbar-hide {
    scrollbar-width: none !important;         /* Firefox */
    -ms-overflow-style: none !important;      /* IE/Edge */
    overflow: -moz-scrollbars-none;           /* Firefox 老版本 */
  }
  .scrollbar-hide::-webkit-scrollbar {
    width: 0 !important;                      /* Chrome/Safari/Opera */
    height: 0 !important;
    display: none !important;
    background: transparent !important;
  }
  /* 进一步隐藏横向滚动条 */
  .scrollbar-hide::-webkit-scrollbar:horizontal {
    height: 0 !important;
    display: none !important;
  }
  .text-xxs {
    font-size: 0.65rem; /* 约 10.4px */
    line-height: 0.9rem;
  }
  /* === 新增：覆盖 antd Modal 的默认样式以实现全屏 === */
  .fullscreen-modal .ant-modal {
    top: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100vw !important;
    height: 100vh !important; /* 确保 Modal 容器本身也撑满 */
  }
  .fullscreen-modal .ant-modal-content {
    height: 100vh !important; /* 确保内容区域撑满 */
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important; /* 移除圆角 */
    display: flex; /* 使用 flex 布局 */
    flex-direction: column; /* 垂直排列 */
  }
  .fullscreen-modal .ant-modal-body {
    flex-grow: 1; /* 让 body 区域填充剩余空间 */
    overflow: hidden; /* 防止 body 内部滚动 */
  }

  /* === 新增：覆盖 antd Select 样式以适配深色主题 === */
  /* 选中项文字颜色和背景 */
  .domain-select-override .ant-select-selector {
    background-color: #334155 !important; /* 深一点的背景 */
    border-color: #475569 !important;
  }
  .domain-select-override .ant-select-selection-item, /* 选中项文字 */
  .domain-select-override .ant-select-selection-placeholder { /* Placeholder 文字 */
    color: #e2e8f0 !important; /* 浅灰色文字 */
  }
  /* 移除选中项的默认背景色（如果需要） */
  .domain-select-override .ant-select-selection-item {
     background-color: transparent !important;
  }

  /* 下拉菜单选项 */
  .domain-select-option-override {
    color: #e2e8f0 !important; /* 确保选项文字颜色 */
    background-color: #2a3a50 !important; /* 选项背景 */
  }
  /* 下拉菜单 - 鼠标悬停 */
  .ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled).domain-select-option-override {
    background-color: #3b82f6 !important; /* 悬停时蓝色背景 */
    color: #ffffff !important; /* 悬停时白色文字 */
  }
  /* 下拉菜单 - 已选中 */
  .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled).domain-select-option-override {
    background-color: #1e40af !important; /* 选中时深蓝色背景 */
    color: #ffffff !important; /* 选中时白色文字 */
    font-weight: 600; /* 加粗选中的选项 */
  }
  /* === 新增：覆盖 antd Radio.Group 和 Radio.Button 样式 === */
  .publish-mode-radio-group .ant-radio-button-wrapper {
    background-color: #334155 !important; /* 未选中背景 */
    border-color: #475569 !important;
    color: #cbd5e1 !important; /* 未选中文字 */
    box-shadow: none !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper:hover {
    background-color: #475569 !important; /* 悬停背景 */
    color: #e2e8f0 !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
    background-color: #0ea5e9 !important; /* 选中背景 (青色) */
    border-color: #0284c7 !important;
    color: #ffffff !important; /* 选中文字 */
  }
  .publish-mode-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
     background-color: #0369a1 !important; /* 选中悬停背景 */
     border-color: #075985 !important;
  }
  /* 移除按钮间的间距（如果需要更紧凑） */
  .publish-mode-radio-group .ant-radio-button-wrapper:not(:first-child)::before {
    width: 0; /* 隐藏分隔线 */
  }

  /* === 新增：自定义暗色主题弹窗取消按钮 === */
  .ant-btn-modal-cancel-dark,
  .ant-btn-modal-cancel-dark:focus { /* AntD 默认按钮（非 primary, 非 danger） */
    background-color: #334155 !important; /* slate-700 */
    border-color: #4b5563 !important;     /* slate-600 */
    color: #d1d5db !important;           /* slate-300 */
  }
  .ant-btn-modal-cancel-dark:hover {
    background-color: #4b5563 !important; /* slate-600 */
    border-color: #6b7280 !important;     /* slate-500 */
    color: #f3f4f6 !important;           /* slate-100 */
  }
`}</style>

export default HistoryCardList;