import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../lib/api/index.js';
import { Modal, Button, Spin, message } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';
import HtmlPreview from './page-edit'; // 新增：引入HtmlPreview组件

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
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployPreviewUrl, setDeployPreviewUrl] = useState('');
  const [domainLoading, setDomainLoading] = useState(false);
  const scrollRef = useRef(null);
  const [hasToken, setHasToken] = useState(true);
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [processingModal, setProcessingModal] = useState(false);
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [editPageId, setEditPageId] = useState(null); // 新增：用于控制全屏编辑页面

  const currentItem = resultDetail?.data?.find(item => item.resultId === selectedPreviewId) || {};

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
      const res = await apiClient.getAlternativeWebsiteList(1, 200);
      let list = [];
      if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res && Array.isArray(res.list)) {
        list = res.list;
      }

      // === 新增：分批查询 status ===
      const batchSize = 5; // 每批查5个
      const delayMs = 3000; // 每批间隔3秒
      let statusResults = [];
      for (let i = 0; i < list.length; i += batchSize) {
        const batch = list.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async item => {
            try {
              const statusRes = await apiClient.getAlternativeStatus(item.websiteId);
              const arr = statusRes.data;
              const keep = !(Array.isArray(arr) && arr.length > 0 && arr[arr.length - 1].status === 'init');
              return { item, keep };
            } catch {
              return { item, keep: true };
            }
          })
        );
        statusResults = statusResults.concat(batchResults);
        if (i + batchSize < list.length) {
          // 不是最后一批才延时
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      const filteredList = statusResults
        .filter(({ keep }) => keep)
        .map(({ item }) => item);
      setHistoryList(filteredList);
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
    fetchHistory();
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
      // 假设有 deleteHistory API
      const res = await apiClient.deletePage?.(id);
      if (res && res.code === 200) {
        messageApi.success('Deleted successfully');
        await fetchHistory(); // 删除成功后刷新列表
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

  // === 新增：执行全部清除 ===
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
  const handleCardClick = async (item) => {
    if (item.generatorStatus === 'failed') {
      setFailedModal({ open: true, id: item.websiteId });
      return;
    }
    if (item.generatorStatus === 'processing') {
      setProcessingModal(true);
      return;
    }
    setSelectedItem(item);
    setResultLoading(true);
    setResultDetail(null);
    setSelectedPreviewId(null);
    try {
      const res = await apiClient.getAlternativeWebsiteResultList(item.websiteId);
      setResultDetail(res);
      // 默认选中第一个
      if (Array.isArray(res?.data) && res.data.length > 0) {
        setSelectedPreviewId(res.data[0].resultId);
        setSlugInput(res.data[0].slug || '');
      }
    } catch (e) {
      setResultDetail({ error: 'Failed to load details.' });
    }
    setResultLoading(false);
    // 选中卡片后，加载可用域名
    if (item) {
      await loadVerifiedDomains(setVerifiedDomains, setDomainLoading);
    }
    setSelectedPublishUrl(''); 
    setDeployPreviewUrl('');
  };

  const handleModalClose = () => {
    setSelectedItem(null);
    setResultDetail(null);
    setSelectedPreviewId(null);
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

  // 滚动到左/右
  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

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

  // === 新增：获取可导航的已完成任务列表 ===
  const finishedTasks = historyList.filter(task => task.generatorStatus === 'finished');
  const currentTaskIndex = finishedTasks.findIndex(task => task.websiteId === selectedItem?.websiteId);

  // === 新增：导航到下一个/上一个已完成任务 ===
  const navigateTask = (direction) => {
    if (finishedTasks.length <= 1) return; // 如果只有一个或没有已完成任务，则不导航

    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentTaskIndex + 1) % finishedTasks.length;
    } else {
      nextIndex = (currentTaskIndex - 1 + finishedTasks.length) % finishedTasks.length;
    }

    const nextTask = finishedTasks[nextIndex];
    if (nextTask && nextTask.websiteId !== selectedItem?.websiteId) {
      handleCardClick(nextTask); // 使用 handleCardClick 加载新任务的数据
    }
  };

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
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColor}`}>
        {statusText}
      </span>
    );
  };

  if (!hasToken) {
    return null;
  }

  return (
    <div id="result-preview-section" className="min-h-[320px] flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#22d3ee20_0%,_transparent_50%)] opacity-70 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_#a78bfa25_0%,_transparent_55%)] opacity-70 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-600/10 rounded-full filter blur-3xl opacity-40 animate-pulse pointer-events-none"></div>
      <div className="relative z-10 w-full flex flex-col items-center">
        {contextHolder}
        <div className="w-full max-w-7xl px-4 mt-4 mb-2 flex justify-center items-center">
          <div
            className="text-base font-semibold tracking-wide text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)'
            }}
          >
            My tasks
          </div>
          {/* 刷新按钮 */}
          <button
            className="ml-3 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-2 transition border border-slate-700"
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
            className="ml-2 flex items-center justify-center bg-red-800/70 hover:bg-red-700/80 rounded-full p-2 transition border border-red-700"
            style={{ width: 32, height: 32 }}
            onClick={() => setClearAllConfirmOpen(true)}
            disabled={loading || isClearingAll || historyList.length === 0}
            title="Clear All"
          >
            {isClearingAll ? (
              <Spin size="small" />
            ) : (
              <DeleteOutlined style={{ fontSize: 18, color: '#fca5a5' }} />
            )}
          </button>
        </div>
        {/* 左右滚动按钮 */}
        <button
          className="absolute left-64 top-1/2 -translate-y-1/2 z-20 bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-2 shadow border border-slate-700 transition disabled:opacity-40"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => scrollBy(-360)}
          aria-label="left scroll"
        >
          <span className="flex items-center justify-center w-full h-full">
            <LeftOutlined style={{ fontSize: 20, color: '#38bdf8' }} />
          </span>
        </button>
        <button
          className="absolute right-64 top-1/2 -translate-y-1/2 z-20 bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-2 shadow border border-slate-700 transition disabled:opacity-40"
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => scrollBy(360)}
          aria-label="right scroll"
        >
          <span className="flex items-center justify-center w-full h-full">
            <RightOutlined style={{ fontSize: 20, color: '#38bdf8' }} />
          </span>
        </button>
        <div
          ref={scrollRef}
          className="w-full max-w-7xl px-4 py-2 overflow-x-scroll scrollbar-hide relative"
          style={{
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        >
          <div className="inline-flex flex-row flex-nowrap gap-x-6 gap-y-8 justify-center min-w-full">
            {loading ? (
              <div className="flex items-center justify-center w-full h-[120px] min-w-full">
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
                      group relative rounded-xl bg-white/5 hover:bg-white/10 transition
                      shadow-lg p-6 flex flex-col items-center justify-between
                      min-h-[120px] w-[340px] max-w-[340px]
                      border border-white/10 hover:border-primary-500
                      cursor-pointer
                    `}
                    onClick={() => handleCardClick(item)}
                  >
                    <div className="w-full flex flex-col items-center">
                      <div className="font-semibold text-base text-gray-300 mb-1">
                        Task Origin Website
                      </div>
                      <div className="font-semibold text-lg text-white mb-2">{item.website}</div>
                      <div className={`text-xs font-bold mb-2 ${statusColor}`}>
                        {statusText}
                      </div>
                      <div className="text-xs text-gray-400 mb-1">
                        ID: <span className="text-gray-300">{item.websiteId}</span>
                      </div>
                      {item.created_at && (
                        <div className="text-xs text-gray-500 mb-1">
                          Created: {new Date(item.created_at).toLocaleString()}
                        </div>
                      )}
                      {/* 新增：生成开始和结束时间 */}
                      <div className="text-xs text-gray-500 mb-1">
                        Start Time: {item.generatedStart ? new Date(item.generatedStart).toLocaleString() : '-'}
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        End Time: {item.generatedEnd ? new Date(item.generatedEnd).toLocaleString() : '-'}
                      </div>
                      {/* finished 状态小预览 */}
                      {item.generatorStatus === 'finished' && item.resultId && (
                        <div className="w-full h-16 rounded-md overflow-hidden border border-white/10 mb-2">
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
                      className="absolute top-3 right-3 bg-red-700/70 hover:bg-red-800/80 text-white rounded-full p-2 shadow transition"
                      title="Delete"
                      style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteConfirm({ open: true, id: item.websiteId });
                      }}
                      disabled={deletingId === item.websiteId || isClearingAll}
                    >
                      <DeleteOutlined style={{ fontSize: 18 }} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* 删除确认弹窗 */}
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
                // === 修改：调用 handleDelete 时，告知其成功后需要关闭详情弹窗（如果当前弹窗是打开的） ===
                const shouldCloseModal = !!selectedItem && selectedItem.websiteId === deleteConfirm.id;
                await handleDelete(deleteConfirm.id, shouldCloseModal);
                setDeleteConfirm({ open: false, id: null }); // 关闭确认弹窗
              }}
            >
              Delete
            </Button>,
            <Button key="cancel" onClick={() => setDeleteConfirm({ open: false, id: null })}>
              Cancel
            </Button>
          ]}
          centered
          title={null}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Are you sure you want to delete this record?</div>
            <div className="mt-2 text-gray-300 text-center">
              This action cannot be undone.
            </div>
          </div>
        </Modal>
        {/* === 新增：全部清除确认弹窗 === */}
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
            <Button key="cancel" onClick={() => setClearAllConfirmOpen(false)} disabled={isClearingAll}>
              Cancel
            </Button>
          ]}
          centered
          title={null}
          closable={!isClearingAll}
          maskClosable={!isClearingAll}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Are you sure you want to delete ALL records?</div>
            <div className="mt-2 text-gray-300 text-center">
              This action cannot be undone. All history items will be permanently removed.
            </div>
          </div>
        </Modal>
        {/* failed 状态弹窗 */}
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
            <Button key="cancel" onClick={() => setFailedModal({ open: false, id: null })}>
              Cancel
            </Button>
          ]}
          centered
          title={null}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Task failed</div>
            <div className="mt-2 text-gray-300 text-center">
              No details are available for this task.<br />
              Would you like to delete it?
            </div>
          </div>
        </Modal>
        {/* processing 状态弹窗 */}
        <Modal
          open={processingModal}
          onCancel={() => setProcessingModal(false)}
          footer={[
            <Button 
              key="ok" 
              type="primary" 
              onClick={() => setProcessingModal(false)}
              style={{
                background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
                border: 'none',
                fontWeight: 600,
                letterSpacing: 1,
                boxShadow: '0 2px 8px #38bdf899',
              }}
            >
              Got it
            </Button>
          ]}
          centered
          title={null}
          styles={{
            body: {
              background: 'linear-gradient(135deg, #18181c 60%, #23233a 100%)',
              borderRadius: 16,
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            }
          }}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <ExclamationCircleOutlined style={{ fontSize: 48, color: '#38bdf8', filter: 'drop-shadow(0 0 8px #38bdf8aa)' }} />
            <div className="mt-6 text-xl font-bold text-cyan-200 text-center" style={{ textShadow: '0 2px 8px #0008' }}>
              Your Alternative Page is Being Generated
            </div>
            <div className="mt-4 text-base text-gray-300 text-center max-w-md" style={{ lineHeight: 1.8 }}>
              You cannot view the details at this moment.<br />
              Once the generation is complete, you will receive an email notification.<br />
              This usually takes <span className="text-cyan-300 font-semibold">5-10 minutes</span>. Please wait patiently!
            </div>
          </div>
        </Modal>
        {/* Detailed Modal */}
        {selectedItem && (
          <Modal
            open={true}
            onCancel={handleModalClose}
            footer={null}
            width={'100vw'}
            style={{ top: 0, padding: 0, margin: 0, maxWidth: '100vw' }}
            styles={{
              body: {
                padding: 0,
                background: '#18181c',
                minHeight: '100vh',
                maxHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              },
            }}
            wrapClassName="fullscreen-modal"
            title={null}
            centered={false}
            closable={false}
            maskClosable={true}
          >
            {/* === 左右导航按钮 === */}
            {finishedTasks.length > 1 && selectedItem.generatorStatus === 'finished' && (
              <>
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-slate-800/80 hover:bg-slate-700/90 rounded-full p-2 shadow border border-slate-700 transition disabled:opacity-40 flex items-center justify-center"
                  style={{ width: 40, height: 40 }}
                  onClick={() => navigateTask('prev')}
                  aria-label="Previous Task"
                  title="Previous Task"
                >
                  <LeftOutlined style={{ fontSize: 22, color: '#38bdf8' }} />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-slate-800/80 hover:bg-slate-700/90 rounded-full p-2 shadow border border-slate-700 transition disabled:opacity-40 flex items-center justify-center"
                  style={{ width: 40, height: 40 }}
                  onClick={() => navigateTask('next')}
                  aria-label="Next Task"
                  title="Next Task"
                >
                  <RightOutlined style={{ fontSize: 22, color: '#38bdf8' }} />
                </button>
              </>
            )}
            {/* === 修改：将删除按钮、编辑按钮和新的关闭按钮放在一个容器中 === */}
            <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
              {/* === 新增：编辑按钮 === */}
              <button
                onClick={() => {
                  // 使用 selectedPreviewId，因为它在当前作用域可用
                  if (selectedPreviewId) {
                    setEditPageId(selectedPreviewId);
                  }
                }}
                className="p-1.5 rounded-full text-cyan-300 bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
                title="Edit Page"
                // 禁用条件可以根据需要调整，例如当没有选中预览项时
                disabled={!selectedPreviewId || resultLoading}
              >
                {/* 可以使用 antd 的 EditOutlined 图标，如果已引入 */}
                {/* <EditOutlined style={{ fontSize: 16, display: 'block' }} /> */}
                {/* 或者使用文字 */}
                <span style={{ fontSize: 14, display: 'block', lineHeight: '1' }}>Edit</span>
              </button>

              {/* 弹窗内删除按钮 */}
              <button
                onClick={() => setDeleteConfirm({ open: true, id: selectedItem.websiteId })} // 确认使用 selectedItem.websiteId
                className="p-1.5 rounded-full text-red-400 bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
                title="Delete Task"
                disabled={deletingId === selectedItem.websiteId || isClearingAll}
              >
                <DeleteOutlined style={{ fontSize: 16, display: 'block' }} />
              </button>

              {/* 自定义关闭按钮 */}
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-full text-white bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
                title="Close"
              >
                <CloseOutlined style={{ fontSize: 16, display: 'block' }} />
              </button>
            </div>

            {resultLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : Array.isArray(resultDetail?.data) && resultDetail.data.length > 0 ? (
              <div className="flex flex-col flex-1 min-h-0 text-sm">
                <div className="text-center text-lg font-bold text-cyan-300 pt-3 pb-1 tracking-wide flex-shrink-0">
                  Task Preview
                </div>
                <div className="flex-shrink-0 px-4 pb-2 border-b border-slate-800">
                  <div className="overflow-x-auto scrollbar-hide pb-1">
                    <div className="inline-flex flex-row flex-nowrap gap-3">
                      {historyList
                        .filter(task => task.generatorStatus === 'finished')
                        .map((item) => (
                        <div
                          key={item.websiteId}
                          className={`
                            group relative rounded-md bg-white/5 hover:bg-white/10 transition
                            shadow-sm p-1.5 flex flex-col items-center justify-between
                            min-h-[70px] w-[240px] max-w-[240px] flex-shrink-0
                            border hover:border-primary-500
                            cursor-pointer text-xxs
                            ${selectedItem.websiteId === item.websiteId
                              ? 'border-cyan-500 ring-1 ring-cyan-500/60 bg-white/10'
                              : 'border-white/10'}
                          `}
                          onClick={() => {
                            if (selectedItem.websiteId !== item.websiteId) {
                              handleCardClick(item);
                            }
                          }}
                        >
                          <div className="w-full flex flex-col items-center">
                            <div className="font-semibold text-xs text-white mb-0 truncate w-full text-center">{item.website}</div>
                            <div className="mt-0.5">
                              {renderStatusBadge(item.generatorStatus)}
                            </div>
                            <div className="text-gray-400 mt-0.5">
                              ID: <span className="text-gray-300 font-mono">{item.websiteId.substring(0, 8)}...</span>
                            </div>
                            {item.generatedStart && (
                              <div className="text-gray-500">
                                Start: {new Date(item.generatedStart).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                            )}
                            {item.generatedEnd && (
                              <div className="text-gray-500">
                                End: {new Date(item.generatedEnd).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row flex-1 min-h-0 overflow-hidden p-4">
                  <div className="flex flex-row flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-lg shadow-xl overflow-hidden border border-slate-800">
                    <div className="w-[300px] p-3 flex flex-col gap-3 overflow-y-auto border-r border-slate-800 bg-slate-900/80 scrollbar-hide text-xs flex-shrink-0">
                      <div>
                        <div className="mb-1 text-sm font-bold text-cyan-300 tracking-wide pl-1">All Results</div>
                        <div className="flex flex-col gap-1.5">
                          {resultDetail.data.map((item, idx) => (
                            <div
                              key={item.resultId || idx}
                              className={`
                                group rounded px-2 py-1.5 cursor-pointer transition
                                border
                                ${selectedPreviewId === item.resultId
                                  ? 'bg-gradient-to-r from-cyan-900/60 to-slate-800/80 border-cyan-500 shadow-md'
                                  : 'bg-slate-800/40 hover:bg-slate-800/60 border-slate-700'}
                              `}
                              onClick={() => setSelectedPreviewId(item.resultId)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-xs text-white truncate max-w-[140px]">{item.slug || item.websiteId}</div>
                                {selectedPreviewId === item.resultId && (
                                  <span className="ml-2 text-cyan-400 text-xs font-bold">Selected</span>
                                )}
                              </div>
                              <div className="text-xxs text-gray-400 break-all mt-0.5">Result ID: {item.resultId}</div>
                              <div className="text-xxs text-gray-500 mt-0.5">
                                {item.created_at ? new Date(item.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-slate-700 my-1.5"></div>
                      <div>
                        <div className="text-xs font-semibold text-cyan-300 mb-0.5">Deploy Status</div>
                        {currentItem.deploymentStatus === 'publish' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-green-400 font-semibold text-xs">Published</span>
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
                              className="mt-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-xxs font-semibold transition w-fit"
                              disabled={deployLoading}
                              onClick={async () => {
                                setDeployLoading(true);
                                try {
                                  const resp = await apiClient.updateAlternativePublishStatus(selectedPreviewId, 'unpublish');
                                  if (resp?.code === 200) {
                                    messageApi.success('Unpublished successfully!');
                                    setResultDetail(prev => {
                                      if (!prev || !Array.isArray(prev.data)) return prev;
                                      return {
                                        ...prev,
                                        data: prev.data.map(item =>
                                          item.resultId === selectedPreviewId
                                            ? { ...item, deploymentStatus: 'unpublish' }
                                            : item
                                        )
                                      };
                                    });
                                  } else {
                                    messageApi.error(resp?.message || 'Unpublish failed');
                                  }
                                } catch (e) {
                                  messageApi.error(e.message || 'Unpublish failed');
                                } finally {
                                  setDeployLoading(false);
                                }
                              }}
                            >
                              {deployLoading ? 'Unpublishing...' : 'Unpublish'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold text-xs">Not Published</span>
                        )}
                      </div>
                      {currentItem.deploymentStatus !== 'publish' && (
                        <>
                          <div>
                            <div className="text-xs font-semibold text-cyan-300 mb-0.5">Publish URL</div>
                            {domainLoading ? (
                              <div className="flex items-center gap-2 py-2">
                                <Spin size="small" />
                                <span className="text-gray-400 text-xxs">Loading available URLs...</span>
                              </div>
                            ) : verifiedDomains.length === 0 ? (
                              <div className="flex flex-col items-start gap-1">
                                <div className="text-gray-400 mb-1 text-xxs">No available URL</div>
                                <button
                                  className="px-2 py-0.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xxs font-semibold transition"
                                  onClick={() => {
                                    const accessToken = localStorage.getItem('alternativelyAccessToken') || '';
                                    const customerEmail = localStorage.getItem('alternativelyCustomerEmail') || '';
                                    const customerId = localStorage.getItem('alternativelyCustomerId') || '';
                                    let url = 'https://app.websitelm.com/dashboard';
                                    const params = [];
                                    if (accessToken) params.push(`authKey=${encodeURIComponent(accessToken)}`);
                                    if (customerEmail) params.push(`currentCustomerEmail=${encodeURIComponent(customerEmail)}`);
                                    if (customerId) params.push(`currentCustomerId=${encodeURIComponent(customerId)}`);
                                    if (params.length > 0) {
                                      url += '?' + params.join('&');
                                    }
                                    window.open(url, '_blank');
                                  }}
                                >
                                  Go to verify domain
                                </button>
                              </div>
                            ) : (
                              <>
                                <select
                                  value={selectedPublishUrl}
                                  onChange={e => setSelectedPublishUrl(e.target.value)}
                                  className="w-full bg-slate-800/80 text-gray-100 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition text-xs"
                                >
                                  {verifiedDomains.map(domain => (
                                    <option key={domain} value={domain}>{domain}</option>
                                  ))}
                                </select>
                              </>
                            )}
                          </div>
                          {deployPreviewUrl && (
                            <div>
                              <div className="text-xs font-semibold text-cyan-300 mb-0.5">Preview URL</div>
                              <div className="text-cyan-400 underline break-all hover:text-cyan-300 transition cursor-default text-xxs">
                                {deployPreviewUrl}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 mt-1.5">
                            {verifiedDomains.length > 0 && (
                              <button
                                disabled={!selectedPublishUrl || deployLoading}
                                onClick={async () => {
                                  setDeployLoading(true);
                                  try {
                                    const resp = await apiClient.updateAlternativePublishStatus(
                                      selectedPreviewId,
                                      'publish',
                                      selectedPublishUrl
                                    );
                                    if (resp?.code === 200) {
                                      messageApi.success('Published successfully!');
                                      setResultDetail(prev => {
                                        if (!prev || !Array.isArray(prev.data)) return prev;
                                        return {
                                          ...prev,
                                          data: prev.data.map(item =>
                                            item.resultId === selectedPreviewId
                                              ? { ...item, deploymentStatus: 'publish' }
                                              : item
                                          )
                                        };
                                      });
                                      await handleCardClick(selectedItem);
                                    } else {
                                      messageApi.error(resp?.message || 'Publish failed');
                                    }
                                  } catch (e) {
                                    messageApi.error(e.message || 'Publish failed');
                                  } finally {
                                    setDeployLoading(false);
                                  }
                                }}
                                className={`
                                  px-3 py-1 rounded font-semibold transition text-xxs
                                  ${(!selectedPublishUrl || deployLoading)
                                    ? 'bg-cyan-900 text-cyan-300 cursor-not-allowed'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'}
                                `}
                              >
                                {deployLoading ? 'Publishing...' : 'Publish'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                      <div className="border-t border-slate-700 my-1.5"></div>
                      <div>
                        <div className="text-xs font-semibold text-cyan-300 mb-0.5">Slug</div>
                        {slugEditing ? (
                          <div className="flex flex-col gap-1 w-full max-w-xs">
                            <textarea
                              className="px-1.5 py-1 rounded bg-slate-800 text-white border border-slate-700 resize-none text-xs"
                              style={{ minHeight: 40, lineHeight: '1.4' }}
                              value={slugInput}
                              onChange={e => setSlugInput(e.target.value)}
                              disabled={slugSaving}
                              rows={2}
                            />
                            <div className="flex gap-1.5">
                              <button
                                className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xxs font-semibold transition"
                                disabled={slugSaving}
                                onClick={async () => {
                                  setSlugSaving(true);
                                  try {
                                    const resp = await apiClient.updateAlternativeSlug(selectedPreviewId, slugInput);
                                    if (resp?.code === 1071) {
                                      messageApi.error('Slug already exists. Please choose a different slug.');
                                    } else {
                                      messageApi.success('Slug updated successfully');
                                      setResultDetail(prev => {
                                        if (!prev || !Array.isArray(prev.data)) return prev;
                                        return {
                                          ...prev,
                                          data: prev.data.map(item =>
                                            item.resultId === selectedPreviewId
                                              ? { ...item, slug: slugInput }
                                              : item
                                          )
                                        };
                                      });
                                      setSlugEditing(false);
                                    }
                                  } catch (e) {
                                    messageApi.error('Failed to update slug');
                                  }
                                  setSlugSaving(false);
                                }}
                              >
                                Save
                              </button>
                              <button
                                className="px-2 py-0.5 rounded bg-slate-700 text-white text-xxs font-semibold transition"
                                onClick={() => {
                                  const current = resultDetail?.data?.find(i => i.resultId === selectedPreviewId);
                                  setSlugInput(current?.slug || '');
                                  setSlugEditing(false);
                                }}
                                disabled={slugSaving}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-200 text-xs">{slugInput}</span>
                            <button
                              className="px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-xxs font-semibold transition"
                              onClick={() => setSlugEditing(true)}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Right: Preview */}
                    <div className="flex-1 flex justify-center bg-gradient-to-br from-black via-slate-950 to-slate-900 p-3 min-h-0">
                      {(() => {
                        const previewItem = resultDetail.data.find(i => i.resultId === selectedPreviewId);
                        if (!previewItem) {
                          return (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              No preview available
                            </div>
                          );
                        }
                        const isPublished = previewItem.deploymentStatus === 'publish' && previewItem.siteUrl && previewItem.slug;
                        const previewUrl = isPublished
                          ? `${previewItem.siteUrl.replace(/\/$/, '')}/${previewItem.slug}`
                          : `https://preview.websitelm.site/en/${previewItem.resultId}`;
                        return (
                          <div className="w-full h-full bg-black/90 rounded-lg shadow-xl flex flex-col border border-slate-800 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-1 bg-gray-900 border-b border-gray-800 flex-shrink-0">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400 mr-4"></div>
                                <div className="flex-1 bg-gray-900 text-gray-200 text-xxs px-1.5 py-0.5 rounded border border-gray-700 truncate">
                                  {previewUrl}
                                </div>
                              </div>
                              {/* 修改：移除此处的 Edit 按钮，只保留 Preview 按钮 */}
                              <div className="flex items-center gap-1.5 ml-3">
                                {/* Edit 按钮已被移到弹窗右上角 */}
                                <Button
                                  size="small"
                                  type="default"
                                  style={{ fontSize: '10px', padding: '0 8px' }}
                                  onClick={() => window.open(previewUrl, '_blank')}
                                >
                                  <span style={{ fontWeight: 600 }}>Preview</span>
                                </Button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-hidden rounded-b-lg">
                              <iframe
                                src={previewUrl}
                                title="Preview"
                                className="w-full h-full"
                                frameBorder="0"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </Modal>
        )}
        {/* === 新增：全屏编辑页面弹窗 === */}
        <Modal
          open={!!editPageId}
          onCancel={() => setEditPageId(null)}
          footer={null}
          width="100vw"
          style={{ top: 0, padding: 0, margin: 0, maxWidth: '100vw' }}
          styles={{
            body: {
              height: '100vh',
              padding: 0,
              margin: 0,
              background: '#18181c',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }
          }}
          closable={false}
          maskClosable={true}
          destroyOnClose
          title={null}
          wrapClassName="fullscreen-modal"
        >
          {/* === 还原第一个弹窗的关闭按钮样式和位置 === */}
          <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
            <button
              onClick={() => setEditPageId(null)}
              className="p-1.5 rounded-full text-white bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
              title="Close"
            >
              <CloseOutlined style={{ fontSize: 16, display: 'block' }} />
            </button>
          </div>
          {/* === 结束 === */}
          {editPageId && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <HtmlPreview pageId={editPageId} />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

const loadVerifiedDomains = async (setVerifiedDomains, setDomainLoading) => {
  setDomainLoading?.(true);
  try {
    // 1. 获取 Vercel 项目的 projectId
    const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';
    let productInfo = null;
    let domainConfigured = false;
    const response = await apiClient.getProductsByCustomerId();
    if (response?.code === 200) {
      productInfo = response.data;
    }

    // === 新增：检查 domainStatus ===
    // 如果 domainStatus 明确为 false，则直接认为没有可用域名
    if (productInfo?.domainStatus === false) {
      setVerifiedDomains([]);
      setDomainLoading?.(false); // 确保 loading 状态被关闭
      return; // 提前退出函数
    }
    // === 结束新增检查 ===

    // 2. 获取域名列表
    const domainResp = await apiClient.getVercelDomainInfo(projectId);
    const domains = domainResp?.domains || [];

    // 3. 获取根域名
    const rootDomain = productInfo?.projectWebsite;
    if (!rootDomain) {
      setVerifiedDomains([]);
      setDomainLoading?.(false); // 在 finally 中统一处理
      return; // 提前退出
    }

    // 4. 过滤并检查域名 - 只保留以根域名结尾的域名
    const verifiedDomainsPromises = domains
      .filter(domain =>
        domain.verified &&
        !domain.name.includes('vercel.app') &&
        (domain.name === rootDomain || domain.name.endsWith(`.${rootDomain}`))
      )
      .map(async domain => {
        try {
          // 检查域名配置
          const config = await apiClient.getVercelDomainConfig(domain.name);
          return !config?.misconfigured ? domain.name : null;
        } catch (error) {
          // 某个域名配置获取失败，忽略
          return null;
        }
      });

    // 5. 等待所有配置检查完成
    const verifiedDomainsList = (await Promise.all(verifiedDomainsPromises)).filter(Boolean);

    // 6. 获取子文件夹
    let subfolders = [];
    try {
      const subfolderResp = await apiClient.getSubfolders();
      if (subfolderResp?.code === 200 && Array.isArray(subfolderResp.data)) {
        subfolders = subfolderResp.data;
      }
    } catch (error) {
      // 获取子文件夹失败，忽略
    }

    // 7. 合并验证过的域名和子文件夹路径
    const mergedDomains = [
      ...verifiedDomainsList,
      ...subfolders.map(subfolder => `${rootDomain}/${subfolder}`)
    ];

    setVerifiedDomains(mergedDomains);
  } catch (error) {
    // 发生异常，清空可用域名
    setVerifiedDomains([]);
  } finally {
    setDomainLoading?.(false); // 统一在 finally 中关闭 loading
  }
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
`}</style>

export default HistoryCardList;