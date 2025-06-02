import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../lib/api/index.js';
import { Modal, Button, Spin, message, Tooltip, Radio } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined, ReloadOutlined, ExportOutlined, CloseOutlined, ClearOutlined, EditOutlined, SettingOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import PublishSettingsModal from './publish-setting-modal';

const HistoryCardList = ({ onClose }) => {
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
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [publishingToUrl, setPublishingToUrl] = useState('');
  const [domainEditing, setDomainEditing] = useState(false);
  const [selectedDomainInput, setSelectedDomainInput] = useState('');
  const [unpublishConfirm, setUnpublishConfirm] = useState({ open: false, resultId: null });
  const [deployMode, setDeployMode] = useState('subdomain'); // 新增：部署模式状态
  const [subfolderPath, setSubfolderPath] = useState(''); // 新增：subfolder 路径状态（不保存，仅用于输入）
  const [rootDomain, setRootDomain] = useState(''); // 新增：根域名状态

  // === 修改：统一样式的确认弹窗，降低 zIndex ===
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

  const checkUrlAndOpenModal = (list) => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldOpenModal = urlParams.get('openPreviewModal') === 'true';
    
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

      setHistoryList(list);
      
      if (list.length === 0) {
        // 修改：即使没有任务也要显示弹窗，设置一个空的 selectedItem
        setSelectedItem({ isEmpty: true });
      } else {
        const firstItem = list[0];
        await handleCardClick(firstItem);
      }
      
      checkUrlAndOpenModal(list);
    } catch (e) {
      setHistoryList([]);
      // 修改：出错时也显示弹窗
      setSelectedItem({ isEmpty: true });
      messageApi.error('Failed to load tasks. Please try again.');
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
    const customerId = localStorage.getItem('alternativelyCustomerId');
    setCurrentCustomerId(customerId);

    fetchHistory(); // 只在组件初始化时获取一次
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

  // 点击卡片时，默认选中第一个 resultId
  const handleCardClick = async (item, callback) => {
    
    if (item.generatorStatus === 'failed') {
      setFailedModal({ open: true, id: item.websiteId });
      return;
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
    setIsSidebarVisible(true);
    // 调用外部传入的 onClose 函数而不是直接关闭
    if (onClose) {
      onClose();
    }
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
    let statusText = "processing";
    if (status === "finished") {
      statusColor = "text-green-400 bg-green-900/50 border-green-700";
      statusText = "finished";
    } else if (status === "failed") {
      statusColor = "text-red-400 bg-red-900/50 border-red-700";
      statusText = "failed";
    }
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${statusColor}`}>
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

  // 添加保存 slug 的函数
  const handleSaveSlug = async () => {
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
        setSlugEditing(false);
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(resp?.message || 'Failed to update slug');
      }
    } catch (e) {
      messageApi.error('Failed to update slug');
    }
    setSlugSaving(false);
  };

  // 添加获取可用域名的函数
  const loadAvailableDomains = async () => {
    if (!currentCustomerId) return;
    
    setDomainsLoading(true);
    try {
      // 1. 获取用户的根域名 - 修改：使用与 publish-setting-modal 相同的 API
      const domainRes = await apiClient.getDomain(currentCustomerId);
      
      // 修改：根据新的响应结构判断域名是否已绑定并验证成功
      let currentRootDomain = null;
      if (domainRes?.code === 200 && domainRes.data && domainRes.data.verifiedStatus === 'SUCCESS' && domainRes.data.domainName) {
        currentRootDomain = domainRes.data.domainName;
        console.log('[loadAvailableDomains] Root domain fetched successfully:', currentRootDomain);
      } else {
        console.log('[loadAvailableDomains] No verified root domain found. Response:', domainRes);
        setAvailableDomains([]);
        return;
      }

      // 2. 获取 Vercel 项目下的所有域名
      const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const allDomains = domainResp?.domains || [];
      console.log('[loadAvailableDomains] Total domains from Vercel:', allDomains.length);

      // 3. 修改：使用与 publish-setting-modal 相同的过滤逻辑
      const relevantDomains = allDomains.filter(domain => {
        const isVerified = domain.verified;
        const isNotVercelApp = !domain.name.includes('vercel.app');
        const isRootOrSubdomain = domain.name === currentRootDomain || domain.name.endsWith(`.${currentRootDomain}`);
        
        console.log(`[loadAvailableDomains] Checking domain: ${domain.name}`, {
          verified: isVerified,
          notVercelApp: isNotVercelApp,
          isRootOrSubdomain: isRootOrSubdomain
        });
        
        return isVerified && isNotVercelApp && isRootOrSubdomain;
      });
      
      console.log('[loadAvailableDomains] Relevant domains after initial filter:', relevantDomains.map(d => d.name));

      // 4. 修改：使用更宽松的配置检查逻辑
      const verifiedDomainsPromises = relevantDomains.map(async domain => {
        try {
          console.log(`[loadAvailableDomains] Getting config for domain: ${domain.name}`);
          const config = await apiClient.getVercelDomainConfig(domain.name);
          console.log(`[loadAvailableDomains] Config for ${domain.name}:`, config);
          
          const isNotMisconfigured = !config?.misconfigured;
          console.log(`[loadAvailableDomains] Domain ${domain.name} misconfigured: ${config?.misconfigured}, will include: ${isNotMisconfigured}`);
          
          return isNotMisconfigured ? domain.name : null;
        } catch (error) {
          console.warn(`[loadAvailableDomains] Could not get config for ${domain.name}, excluding from verified list. Error:`, error);
          return null;
        }
      });

      const verifiedDomainsList = (await Promise.all(verifiedDomainsPromises)).filter(Boolean);
      console.log('[loadAvailableDomains] Final verified domains list:', verifiedDomainsList);
      
      // 5. 过滤掉根域名，只保留子域名
      const selectableSubdomains = verifiedDomainsList.filter(d => d !== currentRootDomain);
      console.log('[loadAvailableDomains] Selectable subdomains (excluding root):', selectableSubdomains);
      
      setAvailableDomains(selectableSubdomains);
    } catch (error) {
      console.error('Failed to load available domains:', error);
      setAvailableDomains([]);
    } finally {
      setDomainsLoading(false);
    }
  };

  // 添加发布到指定域名的函数
  const handlePublishToDomain = async (domainUrl) => {
    if (!selectedPreviewId || !slugInput.trim()) {
      messageApi.error('Please ensure page is selected and slug is set');
      return;
    }

    setPublishingToUrl(domainUrl);
    try {
      const publishUrl = `https://${domainUrl}`;
      const response = await apiClient.updateAlternativePublishStatus(
        selectedPreviewId,
        'publish',
        publishUrl,
        slugInput
      );

      if (response?.code === 200) {
        messageApi.success(`Page published successfully to ${domainUrl}`);
        
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(response?.message || 'Failed to publish page');
      }
    } catch (error) {
      console.error('Publish error:', error);
      messageApi.error('Failed to publish page');
    } finally {
      setPublishingToUrl('');
    }
  };

  // 修改 handleUnpublish 函数
  const handleUnpublish = async () => {
    if (!selectedPreviewId) return;
    
    setPublishingToUrl('unpublishing');
    try {
      const response = await apiClient.updateAlternativePublishStatus(
        selectedPreviewId,
        'unpublish',
        '',
        ''
      );

      if (response?.code === 200) {
        messageApi.success('Page unpublished successfully');
        
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(response?.message || 'Failed to unpublish page');
      }
    } catch (error) {
      console.error('Unpublish error:', error);
      messageApi.error('Failed to unpublish page');
    } finally {
      setPublishingToUrl('');
      setUnpublishConfirm({ open: false, resultId: null });
    }
  };

  // 修改 useEffect，在打开弹窗时加载域名
  useEffect(() => {
    if (!!selectedItem && currentCustomerId) {
      loadAvailableDomains();
      loadRootDomain(); // 新增：加载根域名
    }
  }, [selectedItem, currentCustomerId]);

  // 添加保存域名选择的函数
  const handleSaveDomainSelection = async () => {
    if (!selectedPreviewId || !slugInput.trim() || !selectedDomainInput) {
      messageApi.error('Please ensure page is selected, slug is set, and domain is chosen');
      return;
    }

    setPublishingToUrl('updating-domain');
    try {
      const publishUrl = `https://${selectedDomainInput}`;
      const response = await apiClient.updateAlternativePublishStatus(
        selectedPreviewId,
        'publish',
        publishUrl,
        slugInput
      );

      if (response?.code === 200) {
        messageApi.success(`Domain updated successfully to ${selectedDomainInput}`);
        setDomainEditing(false);
        
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(response?.message || 'Failed to update domain');
      }
    } catch (error) {
      console.error('Domain update error:', error);
      messageApi.error('Failed to update domain');
    } finally {
      setPublishingToUrl('');
    }
  };

  // 新增：从 URL 中解析 subfolder path 的函数
  const parseSubfolderFromUrl = (siteUrl, slug) => {
    if (!siteUrl || !slug) return '';
    
    try {
      const url = new URL(siteUrl);
      const pathname = url.pathname;
      
      // 移除开头和结尾的斜杠
      const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
      
      // 如果路径为空，说明没有 subfolder
      if (!cleanPath) return '';
      
      // 如果路径就是 slug，说明没有 subfolder
      if (cleanPath === slug) return '';
      
      // 如果路径以 slug 结尾，提取前面的部分作为 subfolder
      if (cleanPath.endsWith(`/${slug}`)) {
        return cleanPath.substring(0, cleanPath.length - slug.length - 1);
      }
      
      // 其他情况，返回整个路径作为 subfolder（可能是特殊情况）
      return cleanPath;
    } catch (error) {
      console.error('Error parsing subfolder from URL:', error);
      return '';
    }
  };

  // 修改：在选中项变化时初始化部署模式和 subfolder path
  useEffect(() => {
    if (currentItem?.siteUrl) {
      const domain = currentItem.siteUrl.replace(/^https?:\/\//, '');
      setSelectedDomainInput(domain);
      
      // 新增：检测是否为 subfolder 模式并回填路径
      if (rootDomain && currentItem.siteUrl.includes(rootDomain)) {
        // 如果 siteUrl 包含根域名，可能是 subfolder 模式
        const extractedSubfolder = parseSubfolderFromUrl(currentItem.siteUrl, currentItem.slug);
        if (extractedSubfolder) {
          setDeployMode('subfolder');
          setSubfolderPath(extractedSubfolder);
          console.log('Detected subfolder mode, extracted path:', extractedSubfolder);
        } else {
          // 如果没有 subfolder，可能是根域名直接发布，也设为 subfolder 模式但路径为空
          // 或者保持 subdomain 模式，这里需要根据实际业务逻辑决定
        }
      }
    }
    
    // 如果弹窗已打开且有 customerId，确保域名列表已加载
    if (open && currentCustomerId && availableDomains.length === 0 && !domainsLoading) {
      loadAvailableDomains();
    }
  }, [currentItem, open, currentCustomerId, rootDomain]); // 新增：依赖 rootDomain

  // 新增：当根域名加载完成后，重新检查当前项的部署模式
  useEffect(() => {
    if (rootDomain && currentItem?.siteUrl && currentItem?.slug) {
      // 检查当前 siteUrl 是否使用了根域名
      const url = new URL(currentItem.siteUrl);
      const hostname = url.hostname;
      
      if (hostname === rootDomain) {
        // 如果 hostname 就是根域名，说明是 subfolder 模式
        const extractedSubfolder = parseSubfolderFromUrl(currentItem.siteUrl, currentItem.slug);
        setDeployMode('subfolder');
        setSubfolderPath(extractedSubfolder || '');
        console.log('Root domain match detected, setting subfolder mode. Path:', extractedSubfolder);
      } else if (hostname.endsWith(`.${rootDomain}`)) {
        // 如果是子域名，保持 subdomain 模式
        setDeployMode('subdomain');
        setSubfolderPath('');
        console.log('Subdomain detected, keeping subdomain mode');
      }
    }
  }, [rootDomain, currentItem]);

  // 修改域名编辑的处理函数
  const handleStartDomainEditing = () => {
    setDomainEditing(true);
    // 进入编辑模式时加载可用域名
    loadAvailableDomains();
  };

  // 新增：获取根域名的函数
  const loadRootDomain = async () => {
    if (!currentCustomerId) return;
    
    try {
      const domainRes = await apiClient.getDomain(currentCustomerId);
      if (domainRes?.code === 200 && domainRes.data && domainRes.data.verifiedStatus === 'SUCCESS' && domainRes.data.domainName) {
        setRootDomain(domainRes.data.domainName);
      } else {
        setRootDomain('');
      }
    } catch (error) {
      console.error('Failed to load root domain:', error);
      setRootDomain('');
    }
  };

  // 新增：subfolder 模式发布函数
  const handlePublishToSubfolder = async () => {
    if (!selectedPreviewId || !slugInput.trim() || !subfolderPath.trim() || !rootDomain) {
      messageApi.error('Please ensure page is selected, slug is set, subfolder path is entered, and root domain is available');
      return;
    }

    setPublishingToUrl('subfolder-publishing');
    try {
      // 构建完整的发布 URL：rootDomain/subfolderPath/slug
      const publishUrl = `https://${rootDomain}/${subfolderPath}`;
      
      const response = await apiClient.updateAlternativePublishStatus(
        selectedPreviewId,
        'publish',
        publishUrl,
        slugInput
      );

      if (response?.code === 200) {
        messageApi.success(`Page published successfully to ${rootDomain}/${subfolderPath}/${slugInput}`);
        
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(response?.message || 'Failed to publish page');
      }
    } catch (error) {
      console.error('Subfolder publish error:', error);
      messageApi.error('Failed to publish page');
    } finally {
      setPublishingToUrl('');
    }
  };

  // 新增：subfolder 模式取消发布函数
  const handleUnpublishFromSubfolder = async () => {
    if (!selectedPreviewId) return;
    
    setPublishingToUrl('subfolder-unpublishing');
    try {
      const response = await apiClient.updateAlternativePublishStatus(
        selectedPreviewId,
        'unpublish',
        '',
        ''
      );

      if (response?.code === 200) {
        messageApi.success('Page unpublished successfully');
        
        // 重新获取数据以更新显示
        if (selectedItem?.websiteId) {
          const res = await apiClient.getAlternativeWebsiteResultList(selectedItem.websiteId);
          setResultDetail(res);
        }
      } else {
        messageApi.error(response?.message || 'Failed to unpublish page');
      }
    } catch (error) {
      console.error('Subfolder unpublish error:', error);
      messageApi.error('Failed to unpublish page');
    } finally {
      setPublishingToUrl('');
    }
  };

  if (!hasToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">Please Login</h3>
          <p className="text-gray-400">You need to login to view your task history</p>
        </div>
      </div>
    );
  }

  return (
    <div id="result-preview-section" className="h-full flex flex-col from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      {contextHolder}
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
        zIndex={1050} // 修改：从 10100 降低到 1050
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
        zIndex={1050} // 修改：从 10100 降低到 1050
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
        zIndex={1050} // 修改：从 10100 降低到 1050
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
        zIndex={1050} // 修改：从 10100 降低到 1050
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
        zIndex={1050} // 修改：从 10100 降低到 1050
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
        <Modal
          title={
            <div className="flex flex-col gap-2">
              {/* 任务切换栏 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-300 flex-shrink-0">Task List:</span>
                {/* === 新增：刷新和批量删除按钮 === */}
                {historyList.length > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      className="flex items-center justify-center bg-slate-800/80 hover:bg-slate-700/80 rounded-full p-1 transition border border-slate-700"
                      style={{ width: 24, height: 24 }}
                      onClick={fetchHistory}
                      disabled={loading || isClearingAll}
                      title="Refresh"
                    >
                      {loading ? (
                        <Spin size="small" />
                      ) : (
                        <ReloadOutlined style={{ fontSize: 12, color: '#38bdf8' }} />
                      )}
                    </button>
                    <button
                      className="flex items-center justify-center bg-red-800/70 hover:bg-red-700/80 rounded-full p-1 transition border border-red-700"
                      style={{ width: 24, height: 24 }}
                      onClick={() => setClearAllConfirmOpen(true)}
                      disabled={loading || isClearingAll}
                      title="Clear All"
                    >
                      {isClearingAll ? (
                        <Spin size="small" />
                      ) : (
                        <ClearOutlined style={{ fontSize: 12, color: '#fca5a5' }} />
                      )}
                    </button>
                  </div>
                )}
                {/* 修改：当没有任务时显示提示信息 */}
                {historyList.length === 0 ? (
                  <div className="flex-1 text-slate-400 text-sm italic">
                    No tasks available. Please create a new task to get started.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent flex-1 py-1">
                    {historyList
                      .map((item, idx) => {
                        const isSelected = selectedItem && !selectedItem.isEmpty && item.websiteId === selectedItem.websiteId;
                        return (
                          <div
                            key={item.websiteId}
                            className={`
                              group relative rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0
                              shadow-md p-2 flex flex-col items-start justify-between
                              min-h-[80px] w-[280px] border
                              ${isSelected
                                ? 'bg-cyan-600/20 border-cyan-500 shadow-cyan-500/30' // 当前选中的任务
                                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary-500' // 其他任务
                              }
                            `}
                            onClick={async () => {
                              if (!selectedItem || selectedItem.isEmpty || item.websiteId === selectedItem.websiteId) return; // 如果是当前任务，不执行操作
                              await handleCardClick(item);
                            }}
                            title={`Switch to: ${item.website}`}
                          >
                            <div className="w-full flex flex-col items-start">
                              {/* 网站URL */}
                              <div className="font-semibold text-xs text-white mb-1 truncate w-full text-left">
                                {item.website}
                              </div>
                              
                              {/* 状态和创建时间 */}
                              <div className="flex w-full justify-between items-center mb-1">
                                {renderStatusBadge(item.generatorStatus)}
                                {item.created_at && (
                                  <span className="text-[9px] text-gray-400">
                                    Created: {new Date(item.created_at).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              
                              {/* 任务ID */}
                              <div className="text-[9px] text-gray-400 mb-1 w-full">
                                <span>Task ID: <span className="text-gray-300 font-mono">{item.websiteId}</span></span>
                              </div>
                              
                              {/* 开始和结束时间 */}
                              <div className="flex w-full justify-between items-center text-[9px] text-gray-500 mb-1">
                                <span>Start: {item.generatedStart ? new Date(item.generatedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                <span>End: {item.generatedEnd ? new Date(item.generatedEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                              </div>
                              
                              {/* 持续时间 */}
                              {item.generatedStart && item.generatedEnd && (
                                <div className="text-[9px] text-cyan-400 font-semibold">
                                  Duration: {Math.round((new Date(item.generatedEnd) - new Date(item.generatedStart)) / 1000 / 60)} min
                                </div>
                              )}
                            </div>
                            
                            {/* Delete button */}
                            <button
                              className="absolute top-1 right-1 bg-red-700/60 hover:bg-red-800/70 text-white rounded-full p-1 shadow transition"
                              title="Delete"
                              style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteConfirm({ open: true, id: item.websiteId });
                              }}
                              disabled={deletingId === item.websiteId || isClearingAll}
                            >
                              <DeleteOutlined style={{ fontSize: 8 }} />
                            </button>
                            
                            {/* === 修改：调整 Tooltip 的 zIndex === */}
                            <Tooltip 
                              title="Restart Task" 
                              placement="left"
                              zIndex={1020} // 修改：从 1050 降低到 1020
                            >
                              <button
                                className="absolute top-1 right-6 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 text-white rounded-full p-1 shadow-lg transition-all duration-200 border border-orange-400/50 hover:border-orange-300"
                                title="Restart Task"
                                style={{ 
                                  width: 16, 
                                  height: 16, 
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
                                <ReloadOutlined style={{ fontSize: 8 }} />
                              </button>
                            </Tooltip>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          }
          open={!!selectedItem}
          onCancel={handleModalClose}
          footer={null}
          width="90vw"
          destroyOnClose
          maskClosable={true}
          centered
          closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 20 }} />}
          zIndex={1000} // 修改：从 10000 降低到 1000
          styles={{
            mask: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              pointerEvents: 'auto',
            },
            wrapper: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
              zIndex: 1000, // 修改：从 10000 降低到 1000
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
              height: '75vh',
              maxHeight: '75vh',
              overflow: 'hidden',
              display: 'flex',
              pointerEvents: 'auto',
            },
            content: {
              padding: 0,
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
              backgroundColor: 'transparent',
              maxHeight: '90vh',
              pointerEvents: 'auto',
            },
          }}
        >
          {/* 修改：添加对空任务状态的处理 */}
          {selectedItem?.isEmpty ? (
            <div className="flex h-[75vh] items-center justify-center w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-300">No Tasks Available</h3>
                <p className="text-gray-400 mb-4">You haven't created any tasks yet.</p>
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Create Your First Task
                </button>
              </div>
            </div>
          ) : resultLoading ? (
            <div className="flex h-[80vh] items-center justify-center w-full">
              <Spin size="large" />
            </div>
          ) : resultDetail && Array.isArray(resultDetail.data) && resultDetail.data.length > 0 ? (
            <>
              {/* 主内容区域 - 现在在左边 */}
              <div className="w-[73%] flex flex-col bg-black/40 overflow-hidden p-1 flex-shrink-0">
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
                            onClick={() => { if (previewUrl) window.open(previewUrl, '_blank'); }}
                            className={`
                              px-2 py-1 rounded text-xs font-semibold text-white shadow-sm transition duration-200 flex items-center gap-1
                              bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                              border border-cyan-500/50 hover:border-cyan-400
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-700
                              shadow-cyan-500/50 hover:shadow-cyan-400/60 shadow-lg hover:shadow-xl
                              animate-pulse hover:animate-none
                              ring-2 ring-cyan-500/30 hover:ring-cyan-400/50
                              relative overflow-hidden
                              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
                              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                            `}
                            title="Preview Page in New Tab"
                            disabled={!selectedPreviewId || resultLoading || !previewUrl}
                          >
                            <ExportOutlined /> Preview In New Tab
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
                            <EditOutlined /> Edit This Page
                          </button>
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
                            <DeleteOutlined /> Delete This Page
                          </button>
                        </div>
                      </div>
                      {/* Iframe Preview */}
                      <div className="flex-1 overflow-hidden bg-slate-900">
                        <iframe
                          key={selectedPreviewId}
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

              {/* Right Sidebar - Task Details (移到右边) */}
              <div className="w-[27%] p-4 flex flex-col gap-4 overflow-y-auto border-l border-slate-700/40 bg-slate-950/50 backdrop-blur-md scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50 text-xs flex-shrink-0">
                {/* === 修改：将标题移到这里 === */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-700/60">
                  <div className="text-base font-semibold text-cyan-300 tracking-wide">
                    Page Publishing Guide
                  </div>
                </div>

                {/* Step 1: Set Up Your Publish Domain */}
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                    <div className="text-sm font-semibold text-blue-400">Set Up Your Publish Domain</div>
                  </div>
                  <div className="text-xs text-slate-300 mb-3">
                    Configure your domain settings to enable publishing. This is required before you can publish any pages.
                  </div>
                  <button
                    onClick={() => setIsPublishSettingsModalVisible(true)}
                    className="w-full px-3 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/50 hover:border-blue-400"
                    title="Configure your domain settings"
                    disabled={!selectedPreviewId || resultLoading}
                  >
                    <SettingOutlined /> Configure Domain Settings
                  </button>
                </div>

                {/* Step 2: Choose Deploy Mode & Publish */}
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                    <div className="text-sm font-semibold text-orange-400">Choose Deploy Mode & Publish</div>
                  </div>
                  
                  {/* Current Status */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">Current Status:</div>
                    {currentItem.deploymentStatus === 'publish' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs font-semibold">
                        <CheckCircleOutlined /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-400 rounded text-xs">
                        <ClockCircleOutlined /> Not Published
                      </span>
                    )}
                  </div>

                  {/* Deploy Mode Selection */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-2">Deploy Mode:</div>
                    <Radio.Group
                      value={deployMode}
                      onChange={(e) => setDeployMode(e.target.value)}
                      className="publish-mode-radio-group"
                      size="small"
                    >
                      <Radio.Button value="subdomain">Subdomain</Radio.Button>
                      <Radio.Button value="subfolder">Subfolder</Radio.Button>
                    </Radio.Group>
                  </div>

                  {/* Slug Configuration */}
                  <div className="mb-3">
                    <div className="text-xs text-slate-400 mb-1">Page Slug:</div>
                    {slugEditing ? (
                      <div className="w-full">
                        <textarea
                          value={slugInput}
                          onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
                          placeholder="enter-slug-here"
                          disabled={slugSaving}
                          rows={2}
                        />
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={handleSaveSlug}
                            disabled={slugSaving || !slugInput.trim()}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                          >
                            {slugSaving ? <Spin size="small" /> : '✓'} Save
                          </button>
                          <button
                            onClick={() => {
                              setSlugEditing(false);
                              setSlugInput(currentItem?.slug || '');
                            }}
                            disabled={slugSaving}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-slate-800 px-2 py-1 rounded text-green-300 font-mono break-all">
                            {currentItem?.slug || 'no-slug'}
                          </code>
                          <button
                            onClick={() => setSlugEditing(true)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                            title="Edit slug"
                          >
                            <EditOutlined />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subfolder Path (only for subfolder mode) */}
                  {deployMode === 'subfolder' && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-1">Subfolder Path:</div>
                      <div className="flex items-center rounded border border-slate-600 bg-slate-800 focus-within:border-cyan-500">
                        <span className="pl-2 pr-1 text-gray-400 text-xs">{rootDomain || 'domain.com'}/</span>
                        <input
                          type="text"
                          value={subfolderPath}
                          onChange={(e) => {
                            const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9\/\-]/g, '');
                            setSubfolderPath(sanitized);
                          }}
                          className="flex-grow bg-transparent border-none placeholder-gray-500 focus:ring-0 px-1 py-1 text-white text-xs"
                          placeholder="alternative"
                          disabled={publishingToUrl === 'subfolder-publishing'}
                        />
                        <span className="px-1 text-gray-400 text-xs">/</span>
                      </div>
                      <div className="text-xxs text-slate-400 mt-1">
                        Example: alt, alternative, alter
                      </div>
                    </div>
                  )}

                  {/* Domain Selection (only for subdomain mode and when published) */}
                  {deployMode === 'subdomain' && currentItem.deploymentStatus === 'publish' && currentItem.siteUrl && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-1">Selected Subdomain:</div>
                      {domainEditing ? (
                        <div className="w-full">
                          {domainsLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <Spin size="small" />
                              <span className="ml-2 text-xs text-slate-400">Loading subdomains...</span>
                            </div>
                          ) : availableDomains.length > 0 ? (
                            <>
                              <select
                                value={selectedDomainInput}
                                onChange={(e) => setSelectedDomainInput(e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 focus:border-cyan-500 focus:outline-none"
                                disabled={publishingToUrl === 'updating-domain'}
                              >
                                {availableDomains.map(domain => (
                                  <option key={domain} value={domain}>{domain}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-1 mt-2">
                                <button
                                  onClick={handleSaveDomainSelection}
                                  disabled={publishingToUrl === 'updating-domain' || !selectedDomainInput}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                                >
                                  {publishingToUrl === 'updating-domain' ? <Spin size="small" /> : '✓'} Save
                                </button>
                                <button
                                  onClick={() => {
                                    setDomainEditing(false);
                                    const domain = currentItem.siteUrl.replace(/^https?:\/\//, '');
                                    setSelectedDomainInput(domain);
                                  }}
                                  disabled={publishingToUrl === 'updating-domain'}
                                  className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-slate-500 py-2">
                              No verified domains available
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 text-xs bg-slate-800 px-2 py-1 rounded text-green-300 font-mono break-all">
                              {currentItem.siteUrl.replace(/^https?:\/\//, '')}
                            </div>
                            <button
                              onClick={handleStartDomainEditing}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors duration-200 flex items-center gap-1"
                              title="Change subdomain"
                            >
                              <EditOutlined />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Publish/Unpublish Actions */}
                  <div className="space-y-2">
                    {currentItem.deploymentStatus === 'publish' ? (
                      <button
                        onClick={() => setUnpublishConfirm({ open: true, resultId: selectedPreviewId })}
                        disabled={publishingToUrl === 'subfolder-unpublishing' || publishingToUrl === 'unpublishing'}
                        className="w-full px-3 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center justify-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-red-500/50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(publishingToUrl === 'subfolder-unpublishing' || publishingToUrl === 'unpublishing') ? <Spin size="small" /> : <DeleteOutlined />} 
                        Unpublish Page
                      </button>
                    ) : (
                      <>
                        {deployMode === 'subfolder' ? (
                          // === 修改：统一 subfolder 模式的发布按钮样式 ===
                          <button
                            onClick={handlePublishToSubfolder}
                            disabled={publishingToUrl === 'subfolder-publishing' || !slugInput.trim() || !subfolderPath.trim() || !rootDomain}
                            className="w-full px-3 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border border-green-500/50 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {publishingToUrl === 'subfolder-publishing' ? <Spin size="small" /> : <ExportOutlined />} 
                            Publish to Subfolder
                          </button>
                        ) : (
                          // === 修改：统一 subdomain 模式的发布按钮样式和布局 ===
                          domainsLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <Spin size="small" />
                              <span className="ml-2 text-xs text-slate-400">Loading subdomains...</span>
                            </div>
                          ) : availableDomains.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs text-slate-400 mb-2">Choose subdomain to publish:</div>
                              {availableDomains.map(domain => (
                                <button
                                  key={domain}
                                  onClick={() => handlePublishToDomain(domain)}
                                  disabled={publishingToUrl === domain || !slugInput.trim()}
                                  className="w-full px-3 py-2 rounded text-xs font-semibold text-white shadow-sm transition duration-200 inline-flex items-center justify-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border border-green-500/50 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={`Publish to ${domain}`}
                                >
                                  {publishingToUrl === domain ? (
                                    <>
                                      <Spin size="small" />
                                      Publishing...
                                    </>
                                  ) : (
                                    <>
                                      <ExportOutlined />
                                      Publish to {domain}
                                    </>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 py-2 text-center">
                              No verified subdomains available.<br />
                              Please configure your domain first.
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Step 3: View Published Page */}
                <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">3</div>
                    <div className="text-sm font-semibold text-green-400">View Page Through Published URL</div>
                  </div>
                  
                  {currentItem.deploymentStatus === 'publish' && currentItem.siteUrl && currentItem.slug ? (
                    <div>
                      <div className="text-xs text-slate-300 mb-3">
                        Your page is now live and accessible to the public. Only published pages can be indexed by Google and other search engines.
                      </div>
                      
                      {/* Published URL Display */}
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">Published URL:</div>
                        <div className="bg-slate-800 rounded p-2 border border-slate-600">
                          <a
                            href={
                              deployMode === 'subdomain' 
                                ? `${currentItem.siteUrl?.replace(/\/$/, '')}/${currentItem.slug}`
                                : deployMode === 'subfolder' && rootDomain && subfolderPath
                                  ? `https://${rootDomain}/${subfolderPath}/${currentItem.slug || slugInput}`
                                  : currentItem.siteUrl 
                                    ? `${currentItem.siteUrl.replace(/\/$/, '')}/${currentItem.slug}`
                                    : '#'
                            }
                            className="text-cyan-300 hover:text-cyan-200 transition text-xs break-all underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {deployMode === 'subdomain' 
                              ? `${currentItem.siteUrl?.replace(/\/$/, '')}/${currentItem.slug}`
                              : deployMode === 'subfolder' && rootDomain && subfolderPath
                                ? `https://${rootDomain}/${subfolderPath}/${currentItem.slug || slugInput}`
                                : currentItem.siteUrl 
                                  ? `${currentItem.siteUrl.replace(/\/$/, '')}/${currentItem.slug}`
                                  : 'Preview URL'
                            }
                          </a>
                        </div>
                      </div>

                      {/* SEO Notice */}
                      <div className="bg-green-900/30 border border-green-700/50 rounded p-2">
                        <div className="flex items-start gap-2">
                          <CheckCircleOutlined className="text-green-400 text-xs mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-green-300">
                            <div className="font-semibold mb-1">SEO Ready</div>
                            <div className="text-green-200">
                              This page is now publicly accessible and can be indexed by Google and other search engines for better visibility.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-slate-400 mb-3">
                        Your page is currently in preview mode. Publish it to make it accessible to the public and search engines.
                      </div>
                      
                      {/* Preview URL Display */}
                      <div className="mb-3">
                        <div className="text-xs text-slate-400 mb-1">Preview URL:</div>
                        <div className="bg-slate-800 rounded p-2 border border-slate-600">
                          <a
                            href={`https://preview.websitelm.site/en/${selectedPreviewId}`}
                            className="text-slate-300 hover:text-slate-200 transition text-xs break-all underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            https://preview.websitelm.site/en/{selectedPreviewId}
                          </a>
                        </div>
                      </div>

                      {/* SEO Warning */}
                      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded p-2">
                        <div className="flex items-start gap-2">
                          <WarningOutlined className="text-yellow-400 text-xs mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-yellow-300">
                            <div className="font-semibold mb-1">Not SEO Indexed</div>
                            <div className="text-yellow-200">
                              Preview pages are not indexed by search engines. Publish your page to enable Google indexing and improve search visibility.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-[80vh] items-center justify-center text-slate-500 w-full">
              {selectedItem?.generatorStatus === 'processing' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-lg text-slate-400">
                    Task is currently running, click here to recover task progress
                  </div>
                  <button
                    onClick={() => {
                      // 触发recover模式，参考layout的实现
                      const currentUrl = new URL(window.location);
                      currentUrl.searchParams.set('taskId', selectedItem.websiteId);
                      currentUrl.searchParams.set('status', 'processing');
                      
                      // 更新URL并刷新页面以触发recover模式
                      window.location.href = currentUrl.toString();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    Recover Task Progress
                  </button>
                </div>
              ) : (
                resultDetail?.error || 'No data available for this task.'
              )}
            </div>
          )}
        </Modal>
      {/* === 新增：渲染 PublishSettingsModal === */}
      {isPublishSettingsModalVisible && currentItem && currentCustomerId && (
        <PublishSettingsModal
          open={isPublishSettingsModalVisible}
          onClose={() => setIsPublishSettingsModalVisible(false)}
          apiClient={apiClient}
          messageApi={messageApi}
          currentItem={currentItem} // 传递当前选中的页面项
          currentCustomerId={currentCustomerId} // 传递 Customer ID
        />
      )}
      {/* Unpublish 确认弹窗 */}
      <Modal
        open={unpublishConfirm.open}
        onCancel={() => setUnpublishConfirm({ open: false, resultId: null })}
        footer={[
          <Button
            key="unpublish"
            type="primary"
            danger
            onClick={() => {
              if (deployMode === 'subfolder') {
                handleUnpublishFromSubfolder();
              } else {
                handleUnpublish();
              }
              setUnpublishConfirm({ open: false, resultId: null });
            }}
            loading={publishingToUrl === 'subfolder-unpublishing' || publishingToUrl === 'unpublishing'}
          >
            Unpublish
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setUnpublishConfirm({ open: false, resultId: null })} 
            className="ant-btn-modal-cancel-dark"
          >
            Cancel
          </Button>
        ]}
        centered
        title={null}
        zIndex={1050}
        styles={confirmationModalStyles}
      >
        <div className="flex flex-col items-center justify-center py-6">
          <ExclamationCircleOutlined style={{ fontSize: 40, color: '#f87171' }} />
          <div className="mt-4 text-lg font-semibold text-red-400">Confirm Unpublish</div>
          <div className="mt-2 text-slate-300 text-center">
            Are you sure you want to unpublish this page?
            {currentItem?.siteUrl && currentItem?.slug && (
              <>
                <br />
                <span className="text-sm text-gray-400">
                  The page will no longer be accessible at: {currentItem.siteUrl}/{currentItem.slug}
                </span>
              </>
            )}
          </div>
        </div>
      </Modal>
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