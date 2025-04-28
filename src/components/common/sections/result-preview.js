import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../lib/api/index.js';
import { Modal, Button, Spin, message, Select } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, LeftOutlined, CopyOutlined, RightOutlined, CloseOutlined, ClearOutlined, EditOutlined } from '@ant-design/icons';
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
  const [currentProductInfo, setCurrentProductInfo] = useState(null); // 新增：存储产品信息
  const [currentCustomerId, setCurrentCustomerId] = useState(null); // 新增：存储 Customer ID
  const [isDeletingVerification, setIsDeletingVerification] = useState(false);
  const [deleteDomainConfirmOpen, setDeleteDomainConfirmOpen] = useState(false); // 新增：控制域名删除确认弹窗
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // 新增：控制详情弹窗侧边栏可见性
  const [isPublishSettingsModalVisible, setIsPublishSettingsModalVisible] = useState(false); // 新增：控制发布设置弹窗
  const currentItem = resultDetail?.data?.find(item => item.resultId === selectedPreviewId) || {};

  // === 新增：域名验证相关 State ===
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, input, pending_txt, verifying, failed
  const [domainToVerify, setDomainToVerify] = useState(''); // 用户输入的待验证域名
  const [txtRecord, setTxtRecord] = useState(null); // { name, type, value }
  const [verificationLoading, setVerificationLoading] = useState(false); // 验证过程中的加载状态
  const [verificationError, setVerificationError] = useState(null); // 验证过程中的错误信息
  // === 结束新增 State ===

  // === 新增：处理添加域名以获取 TXT 记录 ===
  const handleAddDomain = async () => {
    if (!domainToVerify || !currentProductInfo || !currentCustomerId) { // 新增检查 currentCustomerId
      messageApi.error('Please enter a domain name and ensure product info and customer ID are loaded.');
      return;
    }
    setVerificationLoading(true);
    setVerificationError(null);
    setTxtRecord(null);
    setVerificationStatus('pending_txt'); // 先假设会拿到TXT

    try {
      // 1. 更新产品信息中的 projectWebsite (这部分逻辑可能需要保留，取决于你的业务需求)
      //    如果 createDomainWithTXT 内部不处理产品更新，则保留此步骤
      const updatePayload = {
        productId: currentProductInfo.productId,
        productName: currentProductInfo.productName,
        website: domainToVerify, // 使用用户输入的域名
        coreFeatures: currentProductInfo.productDesc,
        competitors: currentProductInfo.competitors,
        domainStatus: true // 标记为尝试绑定
      };
      const updateRes = await apiClient.updateProduct(currentProductInfo.productId, updatePayload);
      if (updateRes?.code !== 200) {
        // 如果更新产品失败，可以选择中断或继续尝试添加域名
        console.warn('Failed to update product with domain before adding, but proceeding to add domain.');
        // throw new Error(updateRes?.message || 'Failed to update product with domain.');
      } else {
         // 更新成功后，更新本地 productInfo state
         setCurrentProductInfo(prev => ({ ...prev, projectWebsite: domainToVerify, domainStatus: true }));
      }


      // === 修改：调用正确的 API 方法 ===
      // 2. 调用 API 添加域名并获取 TXT 记录
      const addRes = await apiClient.createDomainWithTXT({
        domainName: domainToVerify,
        customerId: currentCustomerId, // 传递 customerId
      });

      // === 修改：根据 createDomainWithTXT 的响应结构处理 ===
      if (addRes?.code === 10042) { // 域名已被占用
         const errorMsg = addRes.message || 'This domain is already taken.';
         // 尝试获取现有域名的验证信息 (如果 API 支持)
         // 注意：这里的 getVercelDomainInfo 可能仍然需要，或者需要另一个 API
         messageApi.info(`${errorMsg} Fetching existing verification info...`);
         try {
            // 假设 getVercelDomainInfo 或类似 API 可以获取信息
            const verifyInfoRes = await apiClient.getVercelDomainInfo(domainToVerify); // 或者其他获取信息的 API
            if (verifyInfoRes?.verification && verifyInfoRes.verification.length > 0) {
              const txt = verifyInfoRes.verification.find(v => v.type === 'TXT');
              if (txt) {
                setTxtRecord({ name: txt.domain, type: txt.type, value: txt.value });
                setVerificationStatus('pending_txt');
              } else {
                throw new Error('Could not find TXT verification record for existing domain.');
              }
            } else if (verifyInfoRes?.verified) {
               messageApi.success('Domain is already verified!');
               setVerificationStatus('idle');
               await loadVerifiedDomains(setCurrentProductInfo, setVerifiedDomains, setDomainLoading);
            } else {
              throw new Error(verifyInfoRes?.error?.message || 'Failed to get verification info for existing domain.');
            }
         } catch (getInfoError) {
            console.error("Error getting info for existing domain:", getInfoError);
            setVerificationError(getInfoError.message || errorMsg); // 显示获取信息错误或原始占用错误
            setVerificationStatus('failed');
         }

      } else if (addRes?.code === 200 && addRes.data?.txt) {
        // 成功获取 TXT 记录
        try {
          const parsedTxt = JSON.parse(addRes.data.txt);
          if (parsedTxt?.host && parsedTxt?.value) {
            setTxtRecord({
              name: parsedTxt.host,
              value: parsedTxt.value,
              type: 'TXT'
            });
            setVerificationStatus('pending_txt');
          } else {
            throw new Error('Invalid TXT record format received.');
          }
        } catch (parseError) {
          console.error("Error parsing TXT record:", parseError);
          throw new Error('Received invalid verification data.');
        }
      } else {
         // 其他错误或未预期的成功响应 (例如，不需要验证的子域名？)
         // 根据 createDomainWithTXT 的实际行为调整这里的逻辑
         const errorMsg = addRes?.message || 'Failed to get verification record.';
         // 检查是否可能是添加成功但无需验证的情况
         if (addRes?.code === 200 && !addRes.data?.txt) {
            messageApi.success('Domain added or already configured.');
            setVerificationStatus('idle');
            await loadVerifiedDomains(setCurrentProductInfo, setVerifiedDomains, setDomainLoading);
         } else {
            throw new Error(errorMsg);
         }
      }
    } catch (e) {
      console.error("Error adding domain:", e);
      setVerificationError(e.message || 'Failed to get verification record.');
      setVerificationStatus('failed'); // 标记为失败
      // 如果添加失败，可能需要将 productInfo 中的 domainStatus 重置回 false
      // (根据实际业务逻辑决定是否需要回滚)
      // await apiClient.updateProduct(...); // 可选的回滚操作
    } finally {
      setVerificationLoading(false);
    }
  };

  // === 新增：处理最终的域名验证 ===
  const handleVerifyDomain = async () => {
    // === 修改：使用 validateDomain API ===
    if (!domainToVerify || !currentCustomerId) { // 确保有域名和 customerId
       messageApi.error('Missing domain name or customer ID for verification.');
       return;
    }
    setVerificationLoading(true);
    setVerificationError(null);
    setVerificationStatus('verifying'); // 设置为验证中状态

    try {
      // === 修改：调用 validateDomain ===
      const res = await apiClient.validateDomain({
         customerId: currentCustomerId,
         // 确认 validateDomain 是否需要 domainName 参数，如果需要则添加
         // domainName: domainToVerify
      });

      // === 修改：根据 validateDomain 的响应处理 ===
      if (res?.code === 200) { // 假设 200 表示验证成功
        messageApi.success(`Domain ${domainToVerify} verified successfully! Refreshing list...`);
        setVerificationStatus('idle'); // 重置状态
        setDomainToVerify(''); // 清空输入
        setTxtRecord(null);
        // 验证成功后，刷新域名列表
        await loadVerifiedDomains(setCurrentProductInfo, setVerifiedDomains, setDomainLoading);
        // 不需要关闭弹窗，UI 会自动更新
      } else {
         // 验证失败
         const errorMsg = res?.message || 'Verification failed. Please double-check the TXT record and wait for DNS propagation.';
         setVerificationError(errorMsg);
         setVerificationStatus('pending_txt'); // 保持在待验证状态，允许重试
      }
    } catch (e) {
      console.error("Error verifying domain:", e);
      setVerificationError(e.message || 'An error occurred during verification.');
      setVerificationStatus('pending_txt'); // 保持在待验证状态
    } finally {
      setVerificationLoading(false);
    }
  };

  // === 新增：复制文本到剪贴板 ===
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      messageApi.success('Copied to clipboard!');
    }, (err) => {
      messageApi.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  // === 新增：函数用于检查 URL 参数并打开弹窗 ===
  const checkUrlAndOpenModal = (list) => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openPreviewModal') === 'true' && list && list.length > 0) {
      // 优先选择第一个 'finished' 状态的项，否则选择列表中的第一个
      const firstValidItem = list.find(item => item.generatorStatus === 'finished') || list[0];
      if (firstValidItem) {
        // 调用 handleCardClick 来处理弹窗打开和数据加载
        handleCardClick(firstValidItem);
        // 从 URL 中移除查询参数，避免刷新时重复触发
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.delete('openPreviewModal');
        history.replaceState(null, '', currentUrl.toString());
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
    // 选中卡片后，加载可用域名和产品信息
    if (item) {
      await loadVerifiedDomains(setCurrentProductInfo, setVerifiedDomains, setDomainLoading);
    }
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

  // === 新增：处理删除验证记录（实际执行删除） ===
  const executeDeleteDomainVerification = async () => {
    if (!currentProductInfo) {
      messageApi.error('Product information not available.');
      setDeleteDomainConfirmOpen(false); // 关闭确认弹窗
      return;
    }
    setIsDeletingVerification(true);
    setDeleteDomainConfirmOpen(false); // 关闭确认弹窗
    const payload = {
      productId: currentProductInfo.productId,
      productName: currentProductInfo.productName,
      website: '',
      coreFeatures: currentProductInfo.productDesc,
      competitors: currentProductInfo.competitors,
      domainStatus: false
    };
    try {
      const res = await apiClient.updateProduct(currentProductInfo.productId, payload);
      if (res && res.code === 200) {
        messageApi.success('Domain verification record deleted successfully.');
        // 刷新域名列表和产品信息
        await loadVerifiedDomains(setCurrentProductInfo, setVerifiedDomains, setDomainLoading);
        // 清空已选发布 URL
        setSelectedPublishUrl('');
      } else {
        messageApi.error('Failed to delete domain verification record.');
      }
    } catch (e) {
      messageApi.error('Failed to delete domain verification record.');
    }
    setIsDeletingVerification(false);
  };

  // === 修改：处理删除验证记录（打开确认弹窗） ===
  const handleDeleteDomainVerification = () => {
    setDeleteDomainConfirmOpen(true);
  };

  if (!hasToken) {
    return null;
  }

  return (
    <div id="result-preview-section" className="min-h-[320px] flex flex-col from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      {/* 背景装饰 */}
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
                        shadow-md p-2.5 flex flex-col items-center justify-between
                        min-h-[80px] w-full max-w-md mx-auto
                        border border-white/10 hover:border-primary-500
                        cursor-pointer
                      `}
                      onClick={() => handleCardClick(item)}
                    >
                      <div className="w-full flex flex-col items-center">
                        <div className="font-semibold text-[11px] text-gray-300 mb-0.5">
                          Task Origin Website
                        </div>
                        <div className="font-semibold text-xs text-white mb-1 truncate w-full text-center">
                          {item.website}
                        </div>
                        <div className={`text-[10px] font-bold mb-1 ${statusColor}`}>
                          {statusText}
                        </div>
                        <div className="text-[10px] text-gray-400 mb-0.5">
                          ID: <span className="text-gray-300 font-mono">{item.websiteId.substring(0, 8)}...</span>
                        </div>
                        {item.created_at && (
                          <div className="text-[10px] text-gray-500 mb-0.5">
                            Created: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-500 mb-0.5">
                          Start: {item.generatedStart ? new Date(item.generatedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          End: {item.generatedEnd ? new Date(item.generatedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
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
                        className="absolute top-1 right-1 bg-red-700/60 hover:bg-red-800/70 text-white rounded-full p-1 shadow transition"
                        title="Delete"
                        style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, id: item.websiteId });
                        }}
                        disabled={deletingId === item.websiteId || isClearingAll}
                      >
                        <DeleteOutlined style={{ fontSize: 12 }} />
                      </button>
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
            <Button key="cancel" onClick={() => setDeleteConfirm({ open: false, id: null })}>
              Cancel
            </Button>
          ]}
          centered
          title={null}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Are you sure you want to delete this task, this action will remove all the pages under this task?</div>
            <div className="mt-2 text-gray-300 text-center">
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
        {/* processing status modal */}
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
            {/* Close button */}
            <div className="absolute top-3 right-4 z-30">
              <button
                onClick={handleModalClose}
                className="p-2 rounded-full text-white bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
                title="Close"
                disabled={resultLoading}
                style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CloseOutlined style={{ fontSize: 28, display: 'block' }} />
              </button>
            </div>
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="absolute top-1/2 left-0 -translate-y-1/2 z-30 bg-slate-700/80 hover:bg-slate-600/90 rounded-r-md py-3 px-1 shadow border-y border-r border-slate-600 transition duration-300 ease-in-out"
              style={{ transform: `translateY(-50%) translateX(${isSidebarVisible ? '280px' : '0px'})` }}
              title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarVisible
                ? <LeftOutlined style={{ fontSize: 16, color: '#94a3b8' }} />
                : <RightOutlined style={{ fontSize: 16, color: '#e2e8f0' }} />
              }
            </button>

            {resultLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spin size="large" />
              </div>
            ) : Array.isArray(resultDetail?.data) && resultDetail.data.length > 0 ? (
              <div className="flex flex-row flex-1 min-h-0 text-sm relative">
                {/* Sidebar container */}
                <div className={`
                  ${isSidebarVisible ? 'w-[280px]' : 'w-0'}
                  flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950/30 overflow-hidden
                  transition-all duration-300 ease-in-out
                `}>
                  <div className={`flex flex-col h-full ${isSidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-150 delay-150`}>
                    <div className="text-center text-base font-bold text-cyan-300 pt-3 pb-2 tracking-wide flex-shrink-0 border-b border-slate-800">
                      My Tasks
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
                      {historyList
                        .filter(task => task.generatorStatus === 'finished' || task.generatorStatus === 'processing' || task.generatorStatus === 'failed')
                        .map((item) => (
                        <div
                          key={item.websiteId}
                          className={`
                            group relative rounded-lg bg-white/5 hover:bg-white/10 transition
                            shadow-md p-3 flex flex-col items-start justify-between
                            border hover:border-primary-500
                            cursor-pointer text-xs
                            ${selectedItem.websiteId === item.websiteId
                              ? 'border-cyan-500 ring-1 ring-cyan-500/60 bg-gradient-to-r from-cyan-900/30 to-slate-900/50'
                              : 'border-white/10'}
                          `}
                          onClick={() => {
                            if (selectedItem.websiteId !== item.websiteId) {
                              handleCardClick(item);
                            }
                          }}
                        >
                          <button
                            className="absolute top-2 right-2 bg-red-700/70 hover:bg-red-800/80 text-white rounded-full p-1 shadow transition z-10"
                            title="Delete"
                            style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={e => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, id: item.websiteId });
                            }}
                            disabled={deletingId === item.websiteId || isClearingAll}
                          >
                            <DeleteOutlined style={{ fontSize: 12 }} />
                          </button>
                          <div className="w-full flex flex-col items-start">
                            <div className="font-semibold text-sm text-white mb-1 truncate w-[calc(100%-30px)]">{item.website}</div>
                            <div className="mb-1.5">
                              {renderStatusBadge(item.generatorStatus)}
                            </div>
                            <div className="text-gray-400 text-xxs mb-0.5">
                              ID: <span className="text-gray-300 font-mono">{item.websiteId.substring(0, 12)}...</span>
                            </div>
                            {item.generatedStart && (
                              <div className="text-gray-500 text-xxs">
                                Start: {new Date(item.generatedStart).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            )}
                            {item.generatedEnd && (
                              <div className="text-gray-500 text-xxs">
                                End: {new Date(item.generatedEnd).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-4">
                  <div className="flex flex-row flex-1 min-h-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-lg shadow-xl overflow-hidden border border-slate-800">
                    <div className="w-[300px] p-3 flex flex-col gap-3 overflow-y-auto border-r border-slate-800 bg-slate-900/80 scrollbar-hide text-xs flex-shrink-0">
                      <div className="text-center text-base font-bold text-cyan-300 pb-1 tracking-wide flex-shrink-0 border-b border-slate-700 mb-2">
                        Result Details
                      </div>
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
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-xxs font-semibold transition w-fit disabled:opacity-60 disabled:cursor-not-allowed"
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
                              {currentProductInfo?.projectWebsite && verifiedDomains.length > 0 && (
                                <button
                                  onClick={handleDeleteDomainVerification}
                                  className="p-1 rounded bg-yellow-700/80 hover:bg-yellow-600/90 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                  title="Delete Domain Verification Record"
                                  disabled={isDeletingVerification || domainLoading}
                                  style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {isDeletingVerification ? <Spin size="small" /> : <DeleteOutlined style={{ fontSize: 12 }} />}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold text-xs">Not Published</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex justify-center from-black via-slate-950 to-slate-900 p-3 min-h-0">
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
                                {/* URL Display */}
                                <div className="flex-1 bg-gray-900 text-gray-200 text-xxs px-1.5 py-0.5 rounded border border-gray-700 truncate">
                                  {previewUrl}
                                </div>
                                {/* Preview Button */}
                                <button
                                  onClick={() => {
                                    if (previewUrl) window.open(previewUrl, '_blank');
                                  }}
                                  className={`
                                    ml-2 px-2 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200
                                    bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                                  `}
                                  title="Preview Page in New Tab"
                                  disabled={!selectedPreviewId || resultLoading || !previewUrl}
                                >
                                  Preview in New Window
                                </button>
                                {/* Edit Button */}
                                <button
                                  onClick={() => {
                                    if (selectedPreviewId) {
                                      setEditPageId(selectedPreviewId);
                                    }
                                  }}
                                  className={`
                                    ml-2 px-2 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200
                                    bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                                  `}
                                  title="Edit This Page"
                                  disabled={!selectedPreviewId || resultLoading}
                                >
                                  Edit This Page
                                </button>
                                {/* === 修改：按钮文案改回，点击打开新弹窗 === */}
                                <button
                                  onClick={() => {
                                    // 打开发布设置弹窗
                                    setIsPublishSettingsModalVisible(true);
                                  }}
                                  className={`
                                    ml-2 px-2 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200
                                    bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400
                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                                  `}
                                  title="Bind Your Own Domain" // 修改 title 回去
                                  disabled={!selectedPreviewId || resultLoading || currentItem.deploymentStatus === 'publish'} // 如果已发布则禁用
                                >
                                  Bind Your Own Domain {/* 修改按钮文本回去 */}
                                </button>
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
        {/* Fullscreen edit page modal */}
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
          <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
            <button
              onClick={() => setEditPageId(null)}
              className="p-2 rounded-full text-white bg-slate-800/60 hover:bg-slate-700/80 transition duration-200"
              title="Close"
              style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CloseOutlined style={{ fontSize: 28, display: 'block' }} />
            </button>
          </div>
          {editPageId && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <HtmlPreview pageId={editPageId} />
            </div>
          )}
        </Modal>
        {/* Domain delete confirmation modal */}
        <Modal
          open={deleteDomainConfirmOpen}
          onCancel={() => setDeleteDomainConfirmOpen(false)}
          footer={[
            <Button
              key="delete"
              type="primary"
              danger
              loading={isDeletingVerification}
              onClick={executeDeleteDomainVerification}
            >
              Confirm Delete
            </Button>,
            <Button key="cancel" onClick={() => setDeleteDomainConfirmOpen(false)} disabled={isDeletingVerification}>
              Cancel
            </Button>
          ]}
          centered
          title={null}
          closable={!isDeletingVerification}
          maskClosable={!isDeletingVerification}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
            <div className="mt-4 text-lg font-semibold text-red-400">Confirm Deletion</div>
            <div className="mt-2 text-gray-300 text-center">
              Are you sure you want to delete the domain verification record for <span className="font-semibold text-white">{currentProductInfo?.projectWebsite}</span>?
              <br/>This action might affect your published pages.
            </div>
          </div>
        </Modal>
        {/* === 新增：发布设置弹窗 (Publish Settings Modal) === */}
        <Modal
          open={isPublishSettingsModalVisible}
          onCancel={() => setIsPublishSettingsModalVisible(false)}
          title={<span className="text-white font-semibold text-base">Bind Your Own Domain</span>}
          footer={null}
          width={650}
          centered
          styles={{
            body: { background: '#1e293b', padding: '24px', borderRadius: '8px' },
            header: { background: '#1e293b', borderBottom: '1px solid #334155', color: 'white', padding: '16px 24px' },
            content: { background: '#1e293b', padding: 0 },
          }}
          closable={true}
          maskClosable={true}
          destroyOnClose
        >
          {currentItem && (
            <div className="text-gray-200"> {/* === 修改：为整个弹窗内容设置默认浅色文字 === */}
              {/* === Domain Section === */}
              <div className="mb-5 pb-5 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3">Domain Binding</h3>
                {/* === 修改：根据是否有已验证域名显示不同内容 === */}
                {verifiedDomains.length > 0 ? (
                  // === 有域名：显示下拉选择 ===
                  <div className="space-y-3">
                    <label htmlFor="publish-url-select" className="block text-sm font-medium text-gray-300">Select Verified Domain/Subfolder:</label>
                    <Select
                      id="publish-url-select"
                      value={selectedPublishUrl}
                      onChange={(value) => setSelectedPublishUrl(value)}
                      loading={domainLoading}
                      className="w-full domain-select-override" // 添加自定义类名以便覆盖样式
                      placeholder="Select a domain or subfolder"
                      // === 修改：为 Select 组件添加样式覆盖 ===
                      dropdownStyle={{ background: '#2a3a50', border: '1px solid #475569' }} // 下拉菜单背景和边框
                      // optionLabelProp="label" // 如果需要显示复杂内容
                    >
                      {verifiedDomains.map(url => (
                        <Select.Option
                          key={url}
                          value={url}
                          className="domain-select-option-override" // 添加自定义类名
                          // === 修改：为 Option 添加样式 (这里移除内联 style，统一在 CSS 中处理) ===
                          // style={{ color: '#e2e8f0', backgroundColor: '#2a3a50' }}
                        >
                          {/* 可以在这里添加图标等 */}
                          <span>{url}</span>
                        </Select.Option>
                      ))}
                    </Select>
                     {/* === 修改：删除按钮颜色 === */}
                     {currentProductInfo?.projectWebsite && currentProductInfo?.domainStatus && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={handleDeleteDomainVerification}
                          loading={isDeletingVerification}
                          // === 修改：调整删除按钮颜色 ===
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove Domain Binding
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // === 无域名：显示验证流程 ===
                  <Spin spinning={verificationLoading} tip={<span className="text-gray-300">{verificationStatus === 'verifying' ? "Verifying..." : "Processing..."}</span>}> {/* === 修改：Spin 提示文字颜色 === */}
                    {/* === 修改：错误提示文字颜色 === */}
                    {verificationError && <p className="text-red-400 text-sm mb-3">{verificationError}</p>}

                    {/* === 步骤 1: 输入域名 === */}
                    {verificationStatus === 'idle' && (
                      <div className="space-y-3">
                        {/* === 修改：段落文字颜色 === */}
                        <p className="text-sm text-gray-300">Enter the domain name you want to associate with your site (e.g., mydomain.com).</p>
                        <input
                          type="text"
                          placeholder="example.com"
                          value={domainToVerify}
                          onChange={(e) => {
                            setDomainToVerify(e.target.value.trim());
                            setVerificationError(null); // 清除旧错误
                          }}
                          // === 修改：输入框样式和 placeholder 颜色 ===
                          className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          disabled={verificationLoading}
                        />
                        <Button
                          type="primary"
                          onClick={handleAddDomain}
                          loading={verificationLoading}
                          disabled={!domainToVerify || verificationLoading}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                        >
                          Get TXT Record
                        </Button>
                      </div>
                    )}

                    {/* === 步骤 2: 显示 TXT 记录 === */}
                    {(verificationStatus === 'pending_txt' || verificationStatus === 'verifying') && txtRecord && (
                      <div className="space-y-3">
                        {/* === 修改：段落文字颜色 === */}
                        <p className="text-sm text-gray-300">Add the following TXT record to your domain's DNS settings. This may take a few minutes to propagate.</p>
                        <div className="space-y-1 bg-slate-700/50 p-3 rounded border border-slate-600">
                          {/* === 修改：标签文字颜色 === */}
                          <p><strong className="text-gray-200">Type:</strong> <code className="text-cyan-300 bg-slate-800 px-1 rounded">TXT</code></p>
                          {/* === 修改：标签文字颜色和 code 颜色 === */}
                          <p><strong className="text-gray-200">Name/Host:</strong></p>
                          <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                            <code className="text-cyan-300 break-all mr-2">{txtRecord.name}</code>
                            {/* === 修改：复制图标颜色 === */}
                            <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.name)} />
                          </div>
                           {/* === 修改：标签文字颜色和 code 颜色 === */}
                          <p><strong className="text-gray-200">Value/Content:</strong></p>
                          <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                            <code className="text-cyan-300 break-all mr-2">{txtRecord.value}</code>
                             {/* === 修改：复制图标颜色 === */}
                            <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.value)} />
                          </div>
                        </div>
                         {/* === 修改：段落文字颜色 === */}
                        <p className="text-xs text-gray-400">Once added, click the button below to verify. DNS changes can sometimes take time to update globally.</p>
                        <Button
                          type="primary"
                          onClick={handleVerifyDomain}
                          loading={verificationLoading && verificationStatus === 'verifying'}
                          disabled={verificationLoading}
                          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 border-none text-white font-semibold"
                        >
                          {verificationLoading && verificationStatus === 'verifying' ? 'Verifying...' : 'Verify DNS Record'}
                        </Button>
                        {/* === 修改：允许返回修改域名的按钮 === */}
                        <Button
                          type="default"
                          onClick={() => {
                            setVerificationStatus('idle');
                            setTxtRecord(null);
                            setVerificationError(null);
                            // 保留 domainToVerify 输入框中的值
                          }}
                          disabled={verificationLoading}
                          className="w-full bg-slate-600 hover:bg-slate-500 border-slate-500 text-white"
                        >
                          Change Domain
                        </Button>
                      </div>
                    )}

                    {/* === 步骤 3: 验证失败 === */}
                    {verificationStatus === 'failed' && (
                       <div className="space-y-3">
                          {/* === 修改：失败提示文字颜色 === */}
                         <p className="text-red-400 text-sm">{verificationError || 'Verification process failed.'}</p>
                         <Button
                           type="primary"
                           onClick={() => {
                             setVerificationStatus('idle');
                             setVerificationError(null);
                             // 保留 domainToVerify 输入框中的值以便重试
                           }}
                           className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                         >
                           Try Again
                         </Button>
                       </div>
                    )}
                    {/* 验证成功后会自动刷新域名列表并显示 Select，无需在此处处理 'verified' 状态 */}
                  </Spin>
                )}
              </div>

              {/* === Slug Section (保持不变，但确保内部文字颜色也适配) === */}
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white mb-3">Page Slug</h3>
                {/* === 修改：段落文字颜色 === */}
                <p className="text-sm text-gray-300 mb-2">Set a unique slug for this page version (e.g., 'main-landing-page'). Used in the URL.</p>
                {slugEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))} // 实时格式化
                      // === 修改：输入框样式和 placeholder 颜色 ===
                      className="flex-grow px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                      placeholder="e.g., main-landing-page"
                      disabled={slugSaving}
                    />
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={slugSaving || !slugInput}
                        onClick={async () => {
                          // ... (save slug logic - 保持不变) ...
                          setSlugSaving(true);
                          try {
                            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugInput)) {
                               messageApi.error('Slug can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.');
                               setSlugSaving(false);
                               return;
                            }
                            const resp = await apiClient.updateAlternativeSlug(selectedPreviewId, slugInput);
                            if (resp?.code === 1071) {
                              messageApi.error('Slug already exists. Please choose a different slug.');
                            } else if (resp?.code === 200) {
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
                            } else {
                               messageApi.error(resp?.message || 'Failed to update slug');
                            }
                          } catch (e) {
                            messageApi.error('Failed to update slug');
                          }
                          setSlugSaving(false);
                        }}
                      >
                        {slugSaving ? <Spin size="small" /> : 'Save Slug'}
                      </button>
                      <button
                        // === 修改：取消按钮样式 ===
                        className="px-3 py-1.5 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition"
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
                  <div className="flex items-center justify-between gap-2 bg-slate-700/60 px-3 py-2 rounded border border-slate-600 min-h-[38px]">
                    {/* === 修改：Slug 显示文字颜色 === */}
                    <span className="text-gray-100 text-sm break-all mr-2">{slugInput || <span className="text-gray-400 italic">No slug set</span>}</span>
                    <button
                      // === 修改：编辑按钮样式 ===
                      className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition flex-shrink-0 flex items-center gap-1"
                      onClick={() => setSlugEditing(true)}
                    >
                      {/* === 修改：编辑图标颜色 === */}
                      <EditOutlined className="text-gray-300" />
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* === Publish Button 和 Preview URL (仅当有域名和 slug 时显示) === */}
              {verifiedDomains.length > 0 && (
                <div className="mt-4 pt-4 flex flex-col gap-3 border-t border-slate-700">
                   {selectedPublishUrl && slugInput && (
                    <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                      {/* === 修改：预览 URL 标签文字颜色 === */}
                      <div className="text-sm font-semibold text-cyan-300 mb-1">Publish Preview URL</div>
                      {/* === 修改：预览 URL 链接颜色 === */}
                      <div className="text-cyan-400 underline break-all hover:text-cyan-300 transition cursor-default text-sm">
                        {`https://${selectedPublishUrl}/${slugInput}`}
                      </div>
                    </div>
                  )}
                  <button
                    disabled={!selectedPublishUrl || !slugInput || deployLoading || isDeletingVerification || slugEditing || verificationLoading}
                    onClick={async () => {
                      // ... (publish logic - 保持不变) ...
                      setDeployLoading(true);
                      try {
                         if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugInput)) {
                           messageApi.error('Invalid slug format. Please fix the slug before publishing.');
                           setDeployLoading(false);
                           return;
                         }
                        if (slugEditing) {
                           messageApi.warning('Please save or cancel the slug edit before publishing.');
                           setDeployLoading(false);
                           return;
                        }
                        const resp = await apiClient.updateAlternativePublishStatus(
                          selectedPreviewId,
                          'publish',
                          selectedPublishUrl,
                          slugInput
                        );
                        if (resp?.code === 200) {
                          messageApi.success('Published successfully!');
                          setIsPublishSettingsModalVisible(false);
                          setResultDetail(prev => {
                            if (!prev || !Array.isArray(prev.data)) return prev;
                            return {
                              ...prev,
                              data: prev.data.map(item =>
                                item.resultId === selectedPreviewId
                                  ? { ...item, deploymentStatus: 'publish', siteUrl: `https://${selectedPublishUrl}`, slug: slugInput }
                                  : item
                              )
                            };
                          });
                           setTimeout(fetchHistory, 1000);
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
                      w-full px-4 py-2.5 rounded font-semibold transition text-base shadow-lg
                      ${(!selectedPublishUrl || !slugInput || deployLoading || isDeletingVerification || slugEditing || verificationLoading)
                        ? 'bg-cyan-800/70 text-cyan-400/80 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30'}
                    `}
                  >
                    {deployLoading ? <Spin /> : 'Publish Now'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

const loadVerifiedDomains = async (setCurrentProductInfo, setVerifiedDomains, setDomainLoading) => {
  setDomainLoading?.(true);
  setCurrentProductInfo(null); // 重置产品信息
  setVerifiedDomains([]); // 重置域名列表
  try {
    // 1. 获取 Vercel 项目的 projectId
    const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';
    let productInfo = null;
    // === 修改：获取并存储产品信息 ===
    try {
      const response = await apiClient.getProductsByCustomerId();
      if (response?.code === 200 && response.data) {
        productInfo = response.data;
        setCurrentProductInfo(productInfo); // 存储产品信息到 state
      } else {
        console.error("Failed to get product info:", response);
        // 即使产品信息获取失败，也继续尝试获取域名，但可能无法进行验证绑定
      }
    } catch (productError) {
      console.error("Error fetching product info:", productError);
       // 即使产品信息获取失败，也继续尝试获取域名
    }

    // === 新增：检查 domainStatus ===
    if (productInfo?.domainStatus === false) {
      setVerifiedDomains([]);
      setDomainLoading?.(false);
      return;
    }
    // === 结束新增检查 ===

    // 2. 获取域名列表
    const domainResp = await apiClient.getVercelDomainInfo(projectId);
    const domains = domainResp?.domains || [];

    // 3. 获取根域名
    const rootDomain = productInfo?.projectWebsite;
    if (!rootDomain) {
      setVerifiedDomains([]);
      setDomainLoading?.(false);
      return;
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
    console.error("Error loading verified domains:", error);
    setVerifiedDomains([]);
  } finally {
    setDomainLoading?.(false);
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
`}</style>

export default HistoryCardList;