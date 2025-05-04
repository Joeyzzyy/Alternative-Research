import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Select, Radio, Input, message, App, Tag, Alert, Table, Collapse, Descriptions } from 'antd';
import { CopyOutlined, EditOutlined, ExclamationCircleOutlined, CloseOutlined, DeleteOutlined, ReloadOutlined, CaretRightOutlined, InfoCircleOutlined } from '@ant-design/icons';

const PublishSettingsModal = ({
  open,
  onClose,
  apiClient, // 传入 apiClient 实例
  messageApi, // 传入 messageApi 实例
  currentItem, // 传入当前选中的任务项 { resultId, slug, ... }
  currentCustomerId, // 传入 Customer ID
  onPublishSuccess, // 发布成功后的回调
  onDomainChange, // 域名绑定/解绑/验证成功后的回调
}) => {
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, pending_txt, verifying, failed
  const [domainToVerify, setDomainToVerify] = useState('');
  const [txtRecord, setTxtRecord] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [selectedPublishUrl, setSelectedPublishUrl] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugSaving, setSlugSaving] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [isDeletingVerification, setIsDeletingVerification] = useState(false);
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [domainLoading, setDomainLoading] = useState(false);
  // === 新增：根域名 State ===
  const [rootDomain, setRootDomain] = useState(null); // 用于存储 getDomain 获取的根域名
  const [rootDomainId, setRootDomainId] = useState(null); // 新增：用于存储根域名的 ID
  const [subdomains, setSubdomains] = useState([]);
  const [subdomainLoading, setSubdomainLoading] = useState(false);
  const [subdomainPrefix, setSubdomainPrefix] = useState('');
  const [isAddingSubdomain, setIsAddingSubdomain] = useState(false);
  const [activeCollapseKey, setActiveCollapseKey] = useState([]); // 用于控制 Collapse 组件的展开/收起
  const [isDeletingSubdomain, setIsDeletingSubdomain] = useState(false); // 添加删除子域名的 loading 状态
  const [publishMode, setPublishMode] = useState('subdomain'); // 'subdomain' 或 'subdirectory'
  const [baseDomainInput, setBaseDomainInput] = useState(''); // 用于子目录模式的基础域名输入
  const [subdirectoryName, setSubdirectoryName] = useState('alternative'); // 默认子目录名称

  const [modal, contextHolder] = Modal.useModal(); // 获取 modal 实例和 contextHolder
  const VERCEL_PROJECT_ID = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';

  const loadData = async () => {
    setDomainLoading(true);
    setVerifiedDomains([]); // 重置
    setRootDomain(null); // 重置根域名
    setRootDomainId(null); // 新增：重置根域名 ID
    setSubdomains([]); // 重置子域名
    setActiveCollapseKey([]); // 重置 Collapse

    if (!currentCustomerId) {
      console.warn("Cannot load data without customerId.");
      setDomainLoading(false);
      return;
    }

    let fetchedRootDomain = null;

    try {
      // 1. === 修改：获取根域名 ===
      try {
        const domainRes = await apiClient.getDomain(currentCustomerId);
        console.log('getDomain response:', domainRes); // 增加日志方便调试

        // === 修改：根据新的响应结构判断域名是否已绑定并验证成功 ===
        if (domainRes?.code === 200 && domainRes.data && domainRes.data.verifiedStatus === 'SUCCESS' && domainRes.data.domainName) {
          fetchedRootDomain = domainRes.data.domainName;
          setRootDomain(fetchedRootDomain); // 设置根域名状态
          setRootDomainId(domainRes.data.domainId); // 修改：使用 domainId
          console.log('Fetched and verified root domain:', fetchedRootDomain, 'with ID:', domainRes.data.domainId); // 修改：使用 domainId
        } else {
          // 可能是未绑定、验证未完成、API 返回 code 不为 200 或 data 结构不符
          console.log('No verified root domain bound for this customer or failed to fetch.');
          // 不需要设置错误消息，因为这可能是正常情况（用户未绑定域名或验证中）
        }
      } catch (domainError) {
        console.error("Error fetching root domain:", domainError);
        messageApi.error('Failed to load root domain information.');
      }

      if (!fetchedRootDomain) {
        setVerifiedDomains([]);
        setSelectedPublishUrl('');
        setSubdomains([]);
        setDomainLoading(false);
        setActiveCollapseKey([]);
        console.log('No verified root domain available, skipping Vercel domain checks.');
        return; // 没有已验证的根域名，不需要进行后续 Vercel 检查
      }

      // 3. 获取 Vercel 项目的 projectId (硬编码或从配置获取)
      const projectId = VERCEL_PROJECT_ID;

      // 4. 获取 Vercel 域名列表
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const domains = domainResp?.domains || [];

      // 5. === 修改：使用 fetchedRootDomain ===
      const currentRootDomain = fetchedRootDomain; // 使用从 getDomain 获取的根域名

      // 6. 过滤并检查域名 (包括根域名和子域名)
      const verifiedDomainsPromises = domains
        .filter(domain =>
          domain.verified && // 必须是 vercel 验证通过的
          !domain.name.includes('vercel.app') && // 排除 vercel 默认域名
          (domain.name === currentRootDomain || domain.name.endsWith(`.${currentRootDomain}`)) // 必须是根域名或其子域名
        )
        .map(async domain => {
          try {
            // 再次检查配置，确保没有 misconfigured
            const config = await apiClient.getVercelDomainConfig(domain.name);
            return !config?.misconfigured ? domain.name : null;
          } catch (error) {
            // 获取配置失败，视为未完全验证通过
            console.warn(`Could not get config for ${domain.name}, excluding from verified list.`);
            return null;
          }
        });

      const verifiedDomainsList = (await Promise.all(verifiedDomainsPromises)).filter(Boolean);

      // 7. 设置验证通过的域名列表
      setVerifiedDomains(verifiedDomainsList);

      // 8. 设置默认选中项
      // 过滤掉根域名，只在子域名中选择
      const selectableSubdomains = verifiedDomainsList.filter(d => d !== currentRootDomain); // 使用 currentRootDomain

      if (selectableSubdomains.length > 0) {
        // 尝试保持之前的选择 (如果它仍然在可选列表中)
        if (!selectedPublishUrl || !selectableSubdomains.includes(selectedPublishUrl)) {
           setSelectedPublishUrl(selectableSubdomains[0]); // 否则选第一个子域名
        }
        // 如果之前的选择还在，则保持不变
      } else {
        setSelectedPublishUrl(''); // 没有可选的子域名了
      }

      // === 修改：在 loadData 结束时，如果根域名存在，则加载子域名 ===
      if (currentRootDomain) { // 使用 currentRootDomain
        await loadSubdomains(currentRootDomain); // 传递根域名给 loadSubdomains
        // 如果有子域名或根域名已验证，则展开 Collapse
        if (subdomains.length > 0 || verifiedDomainsList.includes(currentRootDomain)) {
           setActiveCollapseKey(['subdomains']);
        } else {
           setActiveCollapseKey([]);
        }
      } else {
         setSubdomains([]); // 确保没有根域名时子域名列表为空
         setActiveCollapseKey([]); // 没有根域名则不展开
      }

    } catch (error) {
      console.error("Error loading domain data in modal:", error);
      // 避免覆盖上面 getDomain 可能设置的 rootDomain
      // setRootDomain(null);
      setVerifiedDomains([]);
      setSelectedPublishUrl('');
      setSubdomains([]); // 出错时也清空子域名
      setActiveCollapseKey([]);
      // 新增：出错时也清空 rootDomainId
      setRootDomainId(null);
      messageApi.error('Failed to load domain information.');
    } finally {
      setDomainLoading(false);
    }
  };

  const loadSubdomains = async (currentRootDomain) => {
    if (!currentRootDomain) { // 使用传入的参数判断
      console.log("No root domain provided, skipping subdomain load.");
      setSubdomains([]);
      return;
    }
    setSubdomainLoading(true);
    setSubdomains([]); // 重置
    const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S'; // 保持和 loadData 一致

    try {
      // 1. 获取项目下的所有域名
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const allDomains = domainResp?.domains || [];

      // 2. === 修改：使用传入的 currentRootDomain 过滤 ===
      const potentialSubdomains = allDomains.filter(domain =>
        domain.apexName === currentRootDomain && domain.name !== currentRootDomain
      );

      // 3. 获取每个子域名的详细配置信息
      const subdomainsWithConfigPromises = potentialSubdomains.map(async (domain) => {
        try {
          const config = await apiClient.getVercelDomainConfig(domain.name);
          return {
            ...domain, // 保留 Vercel 返回的基础信息 (name, apexName, createdAt, etc.)
            verified: !config?.misconfigured, // 根据 misconfigured 判断验证状态
            configDetails: config, // 存储完整的配置信息
          };
        } catch (error) {
          console.error(`Failed to get config for subdomain ${domain.name}:`, error);
          // 即使获取配置失败，也返回基础信息，标记为未验证
          return {
            ...domain,
            verified: false,
            configDetails: null, // 表示配置获取失败
          };
        }
      });

      const resolvedSubdomains = await Promise.all(subdomainsWithConfigPromises);
      setSubdomains(resolvedSubdomains);
      console.log('Loaded subdomains:', resolvedSubdomains);

    } catch (error) {
      console.error("Error loading subdomains:", error);
      messageApi.error('Failed to load subdomain information.');
      setSubdomains([]); // 出错时清空
    } finally {
      setSubdomainLoading(false);
    }
  };

  useEffect(() => {
    // === 日志：记录传入的 props ===
    console.log('[PublishSettingsModal useEffect] Running effect. Props:', {
      open,
      currentItem, // 重点关注 currentItem.siteUrl 和 currentItem.slug
      currentCustomerId,
    });

    if (open) {
      // 1. 初始化 Slug (保持不变)
      const initialSlug = currentItem?.slug || '';
      setSlugInput(initialSlug);
      console.log('[PublishSettingsModal useEffect] Initial slug set to:', initialSlug); // 日志

      // 2. 重置通用状态
      setVerificationStatus('idle');
      setDomainToVerify('');
      setTxtRecord(null);
      setVerificationError(null);
      setSlugEditing(false);
      console.log('[PublishSettingsModal useEffect] Common states reset.'); // 日志

      // 3. === 根据 currentItem.siteUrl 初始化发布模式 ===
      let initialMode = 'subdomain'; // 默认子域名模式
      let initialBaseDomain = '';
      let initialSubdirectory = 'alternative'; // 默认子目录名

      const siteUrl = currentItem?.siteUrl; // 获取 siteUrl
      console.log('[PublishSettingsModal useEffect] Checking currentItem.siteUrl:', siteUrl); // 日志

      if (siteUrl) {
        try {
          const url = new URL(siteUrl);
          const hostname = url.hostname; // 提取域名
          const pathParts = url.pathname.split('/').filter(part => part !== ''); // 分割路径并移除空部分

          // === 日志：记录解析结果 ===
          console.log('[PublishSettingsModal useEffect] Parsed siteUrl:', { hostname, pathname: url.pathname, pathParts });

          // === 修改判断条件：只要路径部分不为空，就认为是子目录模式 ===
          // 假设 siteUrl 结构是 https://domain.com/subdirectory (没有 slug) 或 https://domain.com/subdirectory/slug
          // pathParts 会是 ['subdirectory'] 或 ['subdirectory', 'slug']
          if (pathParts.length >= 1) { // <--- 修改这里：从 > 1 改为 >= 1
            initialMode = 'subdirectory';
            initialBaseDomain = hostname;
            initialSubdirectory = pathParts[0]; // 第一部分作为子目录
            // === 日志：记录识别为子目录模式 ===
            console.log(`[PublishSettingsModal useEffect] Identified as subdirectory mode (pathParts.length >= 1). Initial values:`, { initialMode, initialBaseDomain, initialSubdirectory });
          } else {
            // === 日志：记录 siteUrl 不匹配子目录模式 ===
            console.log(`[PublishSettingsModal useEffect] siteUrl (${siteUrl}) pathParts length (${pathParts.length}) < 1, defaulting to subdomain mode.`);
          }
        } catch (e) {
          // === 日志：记录 URL 解析错误 ===
          console.error("[PublishSettingsModal useEffect] Error parsing currentItem.siteUrl, defaulting to subdomain mode:", e);
        }
      } else {
         // === 日志：记录 siteUrl 为空 ===
         console.log("[PublishSettingsModal useEffect] currentItem.siteUrl is empty or null, defaulting to subdomain mode.");
      }

      // 4. 设置计算出的初始状态
      console.log('[PublishSettingsModal useEffect] Setting initial state:', { publishMode: initialMode, baseDomainInput: initialBaseDomain, subdirectoryName: initialSubdirectory }); // 日志
      setPublishMode(initialMode);
      setBaseDomainInput(initialBaseDomain);
      setSubdirectoryName(initialSubdirectory);
      setSubdomainPrefix('alternative'); // 子域名模式的默认前缀

      // 5. 根据确定的模式加载数据
      console.log(`[PublishSettingsModal useEffect] Mode is ${initialMode}. Calling loadData().`); // 日志
      loadData(); // 现在统一调用 loadData，它内部会处理根域名等逻辑

    } else {
       // 关闭时重置状态 (保持不变)
       console.log('[PublishSettingsModal useEffect] Modal closed, resetting states.'); // 日志
       setSelectedPublishUrl('');
       setVerifiedDomains([]);
       setDomainLoading(false);
       setRootDomain(null);
       setRootDomainId(null);
       setSubdomains([]);
       setSubdomainLoading(false);
       setSubdomainPrefix('alternative');
       setIsAddingSubdomain(false);
       setActiveCollapseKey([]);
       setIsDeletingSubdomain(false);
       setBaseDomainInput('');
       setSubdirectoryName('alternative');
       setPublishMode('subdomain');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentItem, currentCustomerId]); // 依赖项保持不变 (暂时忽略 exhaustive-deps 警告，因为 loadData 等函数未包含)

  // === 域名验证相关函数 (从 result-preview.js 移动过来) ===
  const handleAddDomain = async () => {
    if (!domainToVerify || !currentCustomerId) {
      messageApi.error('Please enter a domain name and ensure Customer ID is available.');
      return;
    }
    setVerificationLoading(true);
    setVerificationError(null);
    setTxtRecord(null);
    setVerificationStatus('pending_txt');

    try {
      // 1. 调用 API 添加域名并获取 TXT 记录
      const addRes = await apiClient.createDomainWithTXT({
        domainName: domainToVerify,
        customerId: currentCustomerId,
      });

      if (addRes?.code === 10042) { // 域名已被占用
         const errorMsg = addRes.message || 'This domain is already taken.';
         messageApi.info(`${errorMsg} Fetching existing verification info...`);
         try {
            const verifyInfoRes = await apiClient.getVercelDomainInfo(domainToVerify);
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
               setVerificationStatus('idle'); // 重置状态
               onDomainChange(); // 通知父组件刷新数据
            } else {
              throw new Error(verifyInfoRes?.error?.message || 'Failed to get verification info for existing domain.');
            }
         } catch (getInfoError) {
            console.error("Error getting info for existing domain:", getInfoError);
            setVerificationError(getInfoError.message || errorMsg);
            setVerificationStatus('failed');
         }

      } else if (addRes?.code === 200 && addRes.data?.txt) {
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
         const errorMsg = addRes?.message || 'Failed to get verification record.';
         if (addRes?.code === 200 && !addRes.data?.txt) {
            messageApi.success('Domain added or already configured.');
            setVerificationStatus('idle');
            onDomainChange(); // 通知父组件刷新数据
         } else {
            throw new Error(errorMsg);
         }
      }
    } catch (e) {
      console.error("Error adding domain:", e);
      setVerificationError(e.message || 'Failed to get verification record.');
      setVerificationStatus('failed');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!domainToVerify || !currentCustomerId) {
       messageApi.error('Missing domain name or customer ID for verification.');
       return;
    }
    setVerificationLoading(true);
    setVerificationError(null);
    setVerificationStatus('verifying');

    try {
      const res = await apiClient.validateDomain(currentCustomerId);

      if (res?.code === 200) {
        messageApi.success(`Domain ${domainToVerify} verified successfully! Refreshing...`);
        setVerificationStatus('idle');
        setDomainToVerify('');
        setTxtRecord(null);

        // === 修改：调用 loadData 刷新模态框内部状态 ===
        await loadData(); // 重新加载根域名、Vercel 域名和子域名列表

        // 1. 先通知父组件刷新 (如果父组件仍需此通知)
        onDomainChange(); // 这会触发父组件的逻辑 (如果需要)

      } else {
         const errorMsg = res?.message || 'Verification failed. Please double-check the TXT record and wait for DNS propagation.';
         setVerificationError(errorMsg);
         setVerificationStatus('pending_txt'); // 保持待验证，允许重试
      }
    } catch (e) {
      console.error("Error verifying domain:", e);
      setVerificationError(e.message || 'An error occurred during verification.');
      setVerificationStatus('pending_txt');
    } finally {
      setVerificationLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      messageApi.success('Copied to clipboard!');
    }, (err) => {
      messageApi.error('Failed to copy!');
      console.error('Could not copy text: ', err);
    });
  };

  const handleDeleteDomainVerification = () => {
    // === 修改：使用 modal.confirm ===
    modal.confirm({
      title: <span className="text-red-400">Confirm Domain Binding Removal</span>,
      icon: <ExclamationCircleOutlined style={{ color: '#f87171' }} />,
      content: (
        <div>
          {/* 修改：使用 rootDomain state */}
          Are you sure you want to remove the domain binding for {rootDomain}?
          <br/>This action might affect your published pages using this domain.
          <br/><span className="text-xs text-yellow-400">Note: This only removes the binding in our system. You may need to remove the domain from Vercel separately if it's no longer needed.</span>
        </div>
      ),
      okText: 'Confirm Removal',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        // 调用执行删除的函数
        await executeDeleteDomainVerification();
      },
    });
  };

  const executeDeleteDomainVerification = async () => {
    // 修改：检查 rootDomainId 是否存在
    if (!rootDomainId || !currentCustomerId) {
      messageApi.error('Root domain ID or customer information not available.');
      return;
    }
    setIsDeletingVerification(true);
    try {
      // === 修改：调用 deleteDomain API ===
      console.log(`Attempting to delete domain with ID: ${rootDomainId}`);
      const res = await apiClient.deleteDomain(rootDomainId); // 使用 rootDomainId 调用接口

      // 检查后端返回的 code
      if (res && res.code === 200) {
        messageApi.success(`Domain binding for ${rootDomain} removed successfully.`);
        setSelectedPublishUrl(''); // 清空选择
        setRootDomain(null); // 清空本地根域名状态
        setRootDomainId(null); // 新增：清空本地根域名 ID 状态
        setVerifiedDomains([]); // 清空验证域名列表，因为根域名没了
        setSubdomains([]); // 清空子域名列表
        setActiveCollapseKey([]); // 收起 Collapse
        onDomainChange(); // 通知父组件刷新数据 (父组件可能需要重新获取 getDomain)
      } else {
        // API 调用成功但业务逻辑失败 (code 不是 200)
        messageApi.error(res?.message || 'Failed to remove domain binding.');
      }
    } catch (e) {
      // API 调用本身失败 (网络错误、服务器错误等)
      console.error("Error deleting domain binding:", e);
      messageApi.error(e.response?.data?.message || e.message || 'Failed to remove domain binding.');
    } finally { // 确保 loading 状态被重置
       setIsDeletingVerification(false);
    }
  };

  const handlePublish = async () => {
      setDeployLoading(true);
      let publishUrl = '';
      let isValid = false;
      // === 修改：确保使用最新的 slugInput ===
      const currentSlug = slugInput.trim(); // 使用 state 中的 slugInput

      // 1. 验证 Slug
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(currentSlug)) { // 使用 currentSlug
        messageApi.error('Invalid slug format. Please fix the slug before publishing.');
        setDeployLoading(false);
        return;
      }
      if (slugEditing) {
         messageApi.warning('Please save or cancel the slug edit before publishing.');
         setDeployLoading(false);
         return;
      }

      // 2. 根据模式确定 publishUrl/subdirectory 并验证
      if (publishMode === 'subdomain') {
        if (!selectedPublishUrl) {
          messageApi.error('Please select a verified subdomain to publish to.');
          setDeployLoading(false);
          return;
        }
        publishUrl = selectedPublishUrl; // 子域名模式使用选中的 URL
        isValid = true;
      } else if (publishMode === 'subdirectory') {
        // === 修改：使用 state 中的 rootDomain 和 subdirectoryName ===
        // const currentBaseDomain = baseDomainInput.trim(); // 不再需要从 input 获取
        const currentSubdirectory = subdirectoryName.trim();

        // === 新增：检查 rootDomain 是否存在 (理论上此时应该存在) ===
        if (!rootDomain) {
          messageApi.error('Base domain is not bound or verified. Please complete the domain binding first.');
          setDeployLoading(false);
          return;
        }

        if (!currentSubdirectory) { // 使用 currentSubdirectory
            messageApi.error('Please enter a subdirectory path.');
            setDeployLoading(false);
            return;
        }
        // === 修改：构建 publishUrl 时使用 rootDomain ===
        // publishUrl 现在代表完整的发布目标标识符，后端可能需要解析它
        // 或者，你可能需要分别传递 baseDomain, subdirectory, slug 给 API
        // 这里我们先按组合方式构建，假设 API 能处理
        publishUrl = `${rootDomain}/${currentSubdirectory}`; // <--- 使用 rootDomain
        isValid = true;
      }

      if (!isValid) {
        messageApi.error('Publishing configuration is incomplete.');
        setDeployLoading(false);
        return;
      }

      // 3. 调用 API
      try {
        // === 修改 API 调用以传递 slugInput ===
        // 假设 API 需要 resultId, 操作类型, 发布目标(域名或域名/子目录), slug
        const resp = await apiClient.updateAlternativePublishStatus(
          currentItem.resultId,
          'publish',
          publishUrl, // 包含基础域名(rootDomain)和子目录 (如果是子目录模式)
          currentSlug           // 使用 state 中的 slugInput
        );

        if (resp?.code === 200) {
          messageApi.success('Published successfully!');
          onPublishSuccess();
          onClose();
        } else {
          messageApi.error(resp?.message || 'Publish failed');
        }
      } catch (e) {
        messageApi.error(e.message || 'Publish failed');
      } finally {
        setDeployLoading(false);
      }
  };

   const handleSaveSlug = async () => {
      setSlugSaving(true);
      try {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugInput)) {
           messageApi.error('Slug can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.');
           setSlugSaving(false);
           return;
        }
        const resp = await apiClient.updateAlternativeSlug(currentItem.resultId, slugInput);
        if (resp?.code === 1071) {
          messageApi.error('Slug already exists. Please choose a different slug.');
        } else if (resp?.code === 200) {
          messageApi.success('Slug updated successfully');
          // 注意：这里不直接修改传入的 currentItem，父组件会在 onPublishSuccess 后刷新
          setSlugEditing(false);
          // 可以考虑增加一个 onSlugChange 回调，如果父组件需要实时知道 slug 变化
        } else {
           messageApi.error(resp?.message || 'Failed to update slug');
        }
      } catch (e) {
        messageApi.error('Failed to update slug');
      }
      setSlugSaving(false);
    };

  const getDomainStatusInfo = (domain) => {
    if (domain.verified) {
      return { color: 'success', text: 'Verified' };
    }
    // 如果 configDetails 存在且 misconfigured 为 false，也视为已验证（可能 Vercel 验证逻辑稍有延迟）
    if (domain.configDetails && !domain.configDetails.misconfigured) {
       return { color: 'success', text: 'Verified' };
    }
    // 如果 configDetails 不存在（获取失败）或 misconfigured 为 true
    return { color: 'warning', text: 'Pending DNS' };
  };

  const handleDeleteSubdomain = (domainName) => {
    modal.confirm({
      title: <span className="text-red-400">Confirm Subdomain Deletion</span>,
      icon: <ExclamationCircleOutlined style={{ color: '#f87171' }} />,
      content: `Are you sure you want to delete the subdomain "${domainName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      onOk: async () => {
        setIsDeletingSubdomain(true);
        const projectId = VERCEL_PROJECT_ID;

        try {
          console.log(`Attempting to delete domain: ${domainName} from project ${projectId}`);
          await apiClient.deleteVercelDomain(projectId, domainName);
          messageApi.success(`Subdomain "${domainName}" deleted successfully.`);

          // === 新增：检查并清空 selectedPublishUrl ===
          if (selectedPublishUrl === domainName) {
            setSelectedPublishUrl(''); // 清空选择
          }

          // === 修改：调用 loadData 刷新所有相关数据 ===
          await loadData(); // 刷新 verifiedDomains 和 subdomains 列表

        } catch (error) {
          console.error(`Failed to delete subdomain ${domainName}:`, error);
          messageApi.error(`Failed to delete subdomain: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
        } finally {
          setIsDeletingSubdomain(false);
        }
      },
      onCancel() {
        console.log('Subdomain deletion cancelled.');
      },
    });
  };

  const dnsColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', width: '15%' },
    { title: 'Name', dataIndex: 'name', key: 'name', width: '30%' },
    { title: 'Value', dataIndex: 'value', key: 'value', width: '55%', render: (text) => <code className="text-xs break-all">{text}</code> },
    // 可以添加复制按钮
    // {
    //   title: 'Action',
    //   key: 'action',
    //   render: (_, record) => (
    //     <Button icon={<CopyOutlined />} size="small" type="text" onClick={() => copyToClipboard(record.value)} />
    //   ),
    // },
  ];

  const handleAddSubdomain = async () => {
    if (!subdomainPrefix.trim()) {
      messageApi.warning('Please enter a subdomain prefix.');
      return;
    }
    const validPrefix = subdomainPrefix.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '');
    if (validPrefix !== subdomainPrefix.trim()) {
        messageApi.warning('Subdomain prefix can only contain lowercase letters, numbers, and hyphens.');
        setSubdomainPrefix(validPrefix);
        return;
    }

    // TODO: 考虑添加子域名数量限制检查 (根据 Vercel 计划)
    // if (subdomains.length >= ...) { ... }

    setIsAddingSubdomain(true);
    const fullDomain = `${validPrefix}.${rootDomain}`; // 使用 rootDomain state
    const projectId = VERCEL_PROJECT_ID;

    // 准备 Vercel API 需要的数据载荷
    // 参考 Vue 代码中的 domainData 结构
    const domainData = {
      name: fullDomain,
      gitBranch: null, // 通常子域名不需要关联 git 分支
      // projectId: projectId, // Vercel API v9/v10 通常 projectId 在 URL 中，不在 body 里
      redirect: null,
      redirectStatusCode: null
    };

    try {
      console.log(`Attempting to add domain: ${fullDomain} to project ${projectId}`);
      console.log('Domain data payload:', domainData);

      // 调用 apiClient 中的方法添加域名
      // 注意：API 签名可能需要调整，Vercel API projectId 通常在 URL path 中
      // 例如: POST /v10/projects/{projectId}/domains 或 POST /v9/projects/{projectId}/domains
      // 确认 apiClient.addVercelDomain 的实现是否正确处理了 projectId
      const response = await apiClient.addVercelDomain(projectId, domainData); // 假设此函数内部处理了正确的 Vercel API 端点

      console.log('Add domain response:', response);
      messageApi.success(`Please add the DNS records below to finish the verification of ${fullDomain} `);

      // 添加成功后刷新列表并设置默认值
      await loadData(); // 重新加载根域名、Vercel 域名和子域名列表
      setSubdomainPrefix('alternative');

    } catch (error) {
      console.error('Failed to add subdomain:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code, // Axios 错误码
        responseStatus: error.response?.status, // HTTP 状态码
        responseData: error.response?.data, // Vercel 返回的错误详情
        stack: error.stack
      });

      // 处理 Vercel 特定的错误码
      const vercelErrorCode = error.response?.data?.error?.code;
      if (vercelErrorCode === 'domain_already_in_use') {
        messageApi.info('This subdomain is already associated with another Vercel project or configuration.');
      } else if (vercelErrorCode === 'forbidden') {
         messageApi.error('Permission denied. Check your Vercel token and project permissions.');
      } else if (vercelErrorCode === 'invalid_domain') {
         messageApi.error(`Invalid domain name: ${fullDomain}`);
      } else {
        // 通用错误消息
        messageApi.error(`Failed to add subdomain: ${error.response?.data?.error?.message || error.message || 'Unknown error'}`);
      }
    } finally {
      setIsAddingSubdomain(false); // 结束 loading 状态
    }
  };

  const getSubdomainPanel = () => {
    if (!rootDomain) {
      return null;
    }

    return (
      <Collapse.Panel
        header={<span className="text-base font-semibold text-white">Manage Subdomains</span>}
        key="subdomains"
        className="subdomain-collapse-panel"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex flex-grow items-center rounded border border-slate-600 bg-slate-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500">
            <Input
              placeholder="e.g., blog"
              value={subdomainPrefix}
              onChange={(e) => setSubdomainPrefix(e.target.value)}
              className="flex-grow bg-transparent border-none placeholder-gray-500 focus:ring-0 px-3 py-1.5"
              disabled={isAddingSubdomain || subdomainLoading}
              onPressEnter={handleAddSubdomain}
            />
            {rootDomain && (
              <span className="px-3 py-1.5 text-sm text-gray-400 bg-slate-600 flex-shrink-0 rounded-r">
                .{rootDomain}
              </span>
            )}
          </div>
          <Button
            type="primary"
            onClick={handleAddSubdomain}
            loading={isAddingSubdomain}
            disabled={!subdomainPrefix.trim() || subdomainLoading}
            className="bg-cyan-600 hover:bg-cyan-500 border-none flex-shrink-0"
          >
            Add Subdomain
          </Button>
          <Button
            onClick={loadData}
            loading={domainLoading && !isAddingSubdomain}
            disabled={isAddingSubdomain || domainLoading}
            className="text-gray-300 hover:text-white border-slate-600 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs"
          >
            Records added, refresh
          </Button>
        </div>

        <Spin spinning={subdomainLoading && !isAddingSubdomain} tip={<span className="text-gray-300">Loading subdomains...</span>}>
          {subdomains.length > 0 ? (
            <div className="space-y-3">
              {subdomains.map(domain => {
                const status = getDomainStatusInfo(domain);
                const dnsData = domain.configDetails?.misconfigured ? [{
                  type: 'CNAME',
                  name: domain.name.replace(`.${domain.apexName}`, ''),
                  value: 'cname.vercel-dns.com.',
                  key: 'cname-record'
                }] : [];

                return (
                  <div key={domain.name} className="p-4 bg-slate-700/50 rounded border border-slate-600 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-medium text-cyan-300 break-all">{domain.name}</span>
                        <Tag color={status.color} className="font-mono text-xs">{status.text}</Tag>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={isDeletingSubdomain ? <Spin size="small" /> : <DeleteOutlined className="text-red-400 hover:text-red-300"/>}
                        size="small"
                        onClick={() => handleDeleteSubdomain(domain.name)}
                        className="flex-shrink-0 ml-2"
                        disabled={isDeletingSubdomain || isAddingSubdomain || subdomainLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Added on {new Date(domain.createdAt).toLocaleDateString()}
                    </p>

                    {domain.configDetails?.misconfigured && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                         <Alert
                          message={<span className="font-semibold text-yellow-100">DNS Configuration Required</span>}
                          description={<span className="text-yellow-200/90 text-xs">Add the following CNAME record to your domain provider (e.g., GoDaddy, Namecheap) to verify this subdomain. DNS changes can take some time to propagate.</span>}
                          type="warning"
                          showIcon
                          className="bg-yellow-600/20 border-yellow-500/30 text-yellow-200 mb-3"
                          icon={<ExclamationCircleOutlined className="text-yellow-300" />}
                        />
                        <Table
                          dataSource={dnsData}
                          columns={dnsColumns}
                          pagination={false}
                          size="small"
                          className="subdomain-dns-table-override"
                          rowKey="key"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !subdomainLoading && <p className="text-sm text-gray-400">No subdomains configured yet.</p>
          )}
        </Spin>
      </Collapse.Panel>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-white font-semibold text-base">Publish Settings</span>}
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
      closeIcon={<CloseOutlined style={{ color: 'white', fontSize: '16px' }} />}
    >
      {/* 确保 currentItem 加载完成 */}
      {currentItem ? (
        <div className="text-gray-200 space-y-6">
          {/* === 新增：发布模式选择 === */}
          <div className="pb-5 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Publishing Mode</h3>
            <Radio.Group
              onChange={(e) => {
                setPublishMode(e.target.value);
                // 清理切换模式时可能不再相关的状态
                setSelectedPublishUrl('');
                setBaseDomainInput('');
                setVerificationStatus('idle');
                setDomainToVerify('');
                setTxtRecord(null);
                setVerificationError(null);
                // 如果从子目录切换回子域名，重新加载域名数据
                if (e.target.value === 'subdomain') {
                  loadData();
                }
              }}
              value={publishMode}
              optionType="button"
              buttonStyle="solid"
              className="publish-mode-radio-group-new" // 使用新的 class
            >
              <Radio.Button value="subdomain">Use Subdomain</Radio.Button>
              <Radio.Button value="subdirectory">Use Subdirectory (Advanced)</Radio.Button>
            </Radio.Group>
            {publishMode === 'subdirectory' && (
              <Alert
                message="Subdirectory Mode requires manual Nginx configuration on your server."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                className="mt-3 bg-blue-900/30 border-blue-700/50 text-blue-200 text-xs"
              />
            )}
          </div>

          {/* === 条件渲染：根据 publishMode 显示不同内容 === */}
          {publishMode === 'subdomain' && (
            <>
              {/* Domain Section */}
              <Spin spinning={domainLoading} tip={<span className="text-gray-300">Loading domains...</span>}>
                <div className="pb-5 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Domain Binding</h3>
                  {rootDomain ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-700/50 rounded border border-slate-600 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-sm font-medium text-gray-300">Bound Root Domain: </span>
                          <span className="text-sm font-semibold text-cyan-300">{rootDomain}</span>
                        </div>
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={handleDeleteDomainVerification}
                          loading={isDeletingVerification}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                        >
                          Remove Binding
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Spin spinning={verificationLoading} tip={<span className="text-gray-300">{verificationStatus === 'verifying' ? "Verifying..." : "Processing..."}</span>}>
                      {verificationError && <p className="text-red-400 text-sm mb-3">{verificationError}</p>}
                      {verificationStatus === 'idle' && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-300">Enter the domain name you want to associate with your site (e.g., mydomain.com).</p>
                          <input
                            type="text"
                            placeholder="example.com"
                            value={domainToVerify}
                            onChange={(e) => {
                              setDomainToVerify(e.target.value.trim());
                              setVerificationError(null);
                            }}
                            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            disabled={verificationLoading || !currentCustomerId}
                          />
                          <Button
                            type="primary"
                            onClick={handleAddDomain}
                            loading={verificationLoading}
                            disabled={!domainToVerify || verificationLoading || !currentCustomerId}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                          >
                            Get Verification Record
                          </Button>
                          {!currentCustomerId && <p className="text-yellow-400 text-xs mt-1">Customer ID is not available, cannot add domain.</p>}
                        </div>
                      )}
                      {(verificationStatus === 'pending_txt' || verificationStatus === 'verifying') && txtRecord && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-300">
                            Add the following TXT record to your domain's DNS settings.
                            <span className="block text-xs text-yellow-400/80 mt-1">
                              If verification repeatedly fails, please delete the existing TXT record for this host in your DNS settings and add it again.
                            </span>
                          </p>
                          <div className="space-y-1 bg-slate-700/50 p-3 rounded border border-slate-600">
                            <p><strong className="text-gray-200">Type:</strong> <code className="text-cyan-300 bg-slate-800 px-1 rounded">TXT</code></p>
                            <p><strong className="text-gray-200">Name/Host:</strong></p>
                            <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                              <code className="text-cyan-300 break-all mr-2">{txtRecord.name}</code>
                              <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.name)} />
                            </div>
                            <p><strong className="text-gray-200">Value/Content:</strong></p>
                            <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                              <code className="text-cyan-300 break-all mr-2">{txtRecord.value}</code>
                              <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.value)} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">Once added, click the button below to verify.</p>
                          <Button
                            type="primary"
                            onClick={handleVerifyDomain}
                            loading={verificationLoading && verificationStatus === 'verifying'}
                            disabled={verificationLoading}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 border-none text-white font-semibold"
                          >
                            {verificationLoading && verificationStatus === 'verifying' ? 'Verifying...' : 'Verify DNS Record'}
                          </Button>
                          <Button
                            type="default"
                            onClick={() => {
                              setVerificationStatus('idle');
                              setTxtRecord(null);
                              setVerificationError(null);
                            }}
                            disabled={verificationLoading}
                            className="w-full bg-slate-600 hover:bg-slate-500 border-slate-500 text-white"
                          >
                            Change Domain
                          </Button>
                        </div>
                      )}
                      {verificationStatus === 'failed' && (
                         <div className="space-y-3">
                           <Button
                             type="primary"
                             onClick={() => {
                               setVerificationStatus('idle');
                               setVerificationError(null);
                             }}
                             className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                           >
                             Try Again
                           </Button>
                         </div>
                      )}
                    </Spin>
                  )}
                </div>
              </Spin>

              {/* 子域名管理区域 (仅在根域名绑定后显示) */}
              {rootDomain && (
                <Collapse
                  ghost
                  activeKey={activeCollapseKey}
                  onChange={(keys) => setActiveCollapseKey(Array.isArray(keys) ? keys : [keys])}
                  expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} style={{ color: 'white', fontSize: '12px' }} />}
                  className="domain-collapse-override"
                >
                  {getSubdomainPanel()}
                </Collapse>
              )}

              {/* URL 选择 Section (仅在有验证域名时显示) */}
              {verifiedDomains.length > 0 && (
                <div className="space-y-5">
                  {/* URL Selection */}
                  <div>
                    <label htmlFor="publish-url-select" className="block text-sm font-medium text-gray-300 mb-2">Select Publish URL</label>
                    <Select
                      id="publish-url-select"
                      value={selectedPublishUrl}
                      onChange={(value) => setSelectedPublishUrl(value)}
                      className="w-full domain-select-override"
                      placeholder="Select a verified subdomain"
                      dropdownStyle={{ background: '#2a3a50', border: '1px solid #475569' }}
                      allowClear // 允许清空选择
                      disabled={domainLoading || isDeletingSubdomain || isAddingSubdomain} // 加载或操作时禁用
                    >
                      {verifiedDomains
                        .filter(url => url !== rootDomain) // 仍然排除根域名本身作为可选发布 URL
                        .map(url => (
                          <Select.Option
                            key={url}
                            value={url}
                            className="domain-select-option-override"
                          >
                            <span>{url}</span>
                          </Select.Option>
                      ))}
                    </Select>
                     {/* 提示：当有 verifiedDomains 但过滤后没有可选子域名时 */}
                     {verifiedDomains.length > 0 && verifiedDomains.filter(url => url !== rootDomain).length === 0 && (
                       <p className="text-xs text-yellow-400 mt-1">No available subdomains to select. Add a subdomain below.</p>
                     )}
                  </div>

                  {/* === Slug Section (仅在绑定根域名后显示) === */}
                  {rootDomain && ( // 新增条件：只要 rootDomain 存在就显示 Slug 部分
                    <div className="mt-5"> {/* 添加一些上边距 */}
                      <h3 className="text-base font-semibold text-white mb-2">Page Slug</h3>
                      <p className="text-sm text-gray-300 mb-2">Set a unique slug for this page version (e.g., 'main-landing-page').</p>
                      {slugEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={slugInput}
                            onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))}
                            className="flex-grow px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                            placeholder="e.g., main-landing-page"
                            disabled={slugSaving}
                          />
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={slugSaving || !slugInput}
                              onClick={handleSaveSlug}
                            >
                              {slugSaving ? <Spin size="small" /> : 'Save Slug'}
                            </button>
                            <button
                              className="px-3 py-1.5 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition"
                              onClick={() => {
                                setSlugInput(currentItem?.slug || '');
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
                          <span className="text-gray-100 text-sm break-all mr-2">{slugInput || <span className="text-gray-400 italic">No slug set</span>}</span>
                          <button
                            className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition flex-shrink-0 flex items-center gap-1"
                            onClick={() => setSlugEditing(true)}
                          >
                            <EditOutlined className="text-gray-300" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Publish Button and Preview URL (仅在子域名模式且有选中 URL 时显示) */}
              {verifiedDomains.length > 0 && (
                <div className="mt-6 pt-6 flex flex-col gap-4 border-t border-slate-700">
                   {/* Preview URL (依赖 selectedPublishUrl 和 slugInput) */}
                   {selectedPublishUrl && slugInput && (
                    <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                      <div className="text-sm font-semibold text-cyan-300 mb-1">Publish Preview URL</div>
                      <div className="text-cyan-400 underline break-all hover:text-cyan-300 transition cursor-default text-sm">
                        {`https://${selectedPublishUrl}/${slugInput}`}
                      </div>
                    </div>
                  )}
                  {/* Publish Button (依赖 selectedPublishUrl 和 slugInput) */}
                  <button
                    disabled={!selectedPublishUrl || !slugInput || deployLoading || isDeletingVerification || slugEditing || verificationLoading || domainLoading}
                    onClick={handlePublish}
                    className={`
                      w-full px-4 py-2.5 rounded font-semibold transition text-base shadow-lg
                      ${(!selectedPublishUrl || !slugInput || deployLoading || isDeletingVerification || slugEditing || verificationLoading || domainLoading)
                        ? 'bg-cyan-800/70 text-cyan-400/80 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30'}
                    `}
                  >
                    {deployLoading ? <Spin /> : 'Publish Now'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* === 条件渲染：子目录模式 UI === */}
          {publishMode === 'subdirectory' && (
            <div className="space-y-6"> {/* 保持此处的垂直间距用于分隔下面的区块 */}

              {/* === 新增：子目录模式下的域名绑定区域 === */}
              <Spin spinning={domainLoading} tip={<span className="text-gray-300">Loading domain info...</span>}>
                <div className="pb-5 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Base Domain Binding</h3>
                  {rootDomain ? (
                    // === 域名已绑定时显示 ===
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-700/50 rounded border border-slate-600 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-sm font-medium text-gray-300">Bound Base Domain: </span>
                          <span className="text-sm font-semibold text-cyan-300">{rootDomain}</span>
                        </div>
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={handleDeleteDomainVerification} // 使用相同的删除函数
                          loading={isDeletingVerification}
                          className="text-red-400 hover:text-red-300 flex-shrink-0"
                        >
                          Remove Binding
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        This domain will be used as the base for your subdirectory setup.
                      </p>
                    </div>
                  ) : (
                    // === 域名未绑定时显示 (与子域名模式类似) ===
                    <Spin spinning={verificationLoading} tip={<span className="text-gray-300">{verificationStatus === 'verifying' ? "Verifying..." : "Processing..."}</span>}>
                      {verificationError && <p className="text-red-400 text-sm mb-3">{verificationError}</p>}
                      {verificationStatus === 'idle' && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-300">Enter the base domain you want to use for the subdirectory setup (e.g., yourdomain.com).</p>
                          <input
                            type="text"
                            placeholder="yourdomain.com"
                            value={domainToVerify}
                            onChange={(e) => {
                              setDomainToVerify(e.target.value.trim());
                              setVerificationError(null);
                            }}
                            className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            disabled={verificationLoading || !currentCustomerId}
                          />
                          <Button
                            type="primary"
                            onClick={handleAddDomain} // 使用相同的添加函数
                            loading={verificationLoading}
                            disabled={!domainToVerify || verificationLoading || !currentCustomerId}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                          >
                            Get Verification Record
                          </Button>
                          {!currentCustomerId && <p className="text-yellow-400 text-xs mt-1">Customer ID is not available, cannot add domain.</p>}
                        </div>
                      )}
                      {(verificationStatus === 'pending_txt' || verificationStatus === 'verifying') && txtRecord && (
                        // TXT 记录验证 UI (与子域名模式完全相同)
                        <div className="space-y-3">
                          <p className="text-sm text-gray-300">
                            Add the following TXT record to your domain's DNS settings.
                            <span className="block text-xs text-yellow-400/80 mt-1">
                              If verification repeatedly fails, please delete the existing TXT record for this host in your DNS settings and add it again.
                            </span>
                          </p>
                          <div className="space-y-1 bg-slate-700/50 p-3 rounded border border-slate-600">
                            <p><strong className="text-gray-200">Type:</strong> <code className="text-cyan-300 bg-slate-800 px-1 rounded">TXT</code></p>
                            <p><strong className="text-gray-200">Name/Host:</strong></p>
                            <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                              <code className="text-cyan-300 break-all mr-2">{txtRecord.name}</code>
                              <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.name)} />
                            </div>
                            <p><strong className="text-gray-200">Value/Content:</strong></p>
                            <div className="flex items-center justify-between bg-slate-800 px-2 py-1 rounded">
                              <code className="text-cyan-300 break-all mr-2">{txtRecord.value}</code>
                              <Button icon={<CopyOutlined className="text-gray-300 hover:text-white"/>} type="text" size="small" onClick={() => copyToClipboard(txtRecord.value)} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">Once added, click the button below to verify.</p>
                          <Button
                            type="primary"
                            onClick={handleVerifyDomain} // 使用相同的验证函数
                            loading={verificationLoading && verificationStatus === 'verifying'}
                            disabled={verificationLoading}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 border-none text-white font-semibold"
                          >
                            {verificationLoading && verificationStatus === 'verifying' ? 'Verifying...' : 'Verify DNS Record'}
                          </Button>
                          <Button
                            type="default"
                            onClick={() => {
                              setVerificationStatus('idle');
                              setTxtRecord(null);
                              setVerificationError(null);
                            }}
                            disabled={verificationLoading}
                            className="w-full bg-slate-600 hover:bg-slate-500 border-slate-500 text-white"
                          >
                            Change Domain
                          </Button>
                        </div>
                      )}
                      {verificationStatus === 'failed' && (
                         <div className="space-y-3">
                           <Button
                             type="primary"
                             onClick={() => {
                               setVerificationStatus('idle');
                               setVerificationError(null);
                             }}
                             className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                           >
                             Try Again
                           </Button>
                         </div>
                      )}
                    </Spin>
                  )}
                </div>
              </Spin>

              {/* === 新增：只有在基础域名绑定后才显示后续配置 === */}
              {rootDomain && (
                <div className="space-y-6"> {/* 添加一个容器并保持间距 */}

                  {/* 1. Subdirectory Path Input */}
                  <div> {/* 包裹起来方便控制 */}
                    <label htmlFor="subdirectory-name-input" className="block text-sm font-medium text-gray-300 mb-2">
                      Subdirectory Path <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center rounded border border-slate-600 bg-slate-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500">
                      <span className="pl-3 pr-1 text-gray-400">{rootDomain}/</span> {/* 显示绑定的域名 */}
                      <input
                        id="subdirectory-name-input"
                        type="text"
                        placeholder="alternative"
                        value={subdirectoryName}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                          setSubdirectoryName(sanitized);
                        }}
                        className="flex-grow bg-transparent border-none placeholder-gray-500 focus:ring-0 px-1 py-2 text-white"
                        disabled={deployLoading || slugEditing}
                      />
                      <span className="px-2 text-gray-400">/</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Choose a path like 'blog', 'docs', 'app'. Final URL structure: {rootDomain}/<span className="text-cyan-300">{subdirectoryName || 'path'}</span>/{slugInput || 'your-slug'}
                    </p>
                  </div>

                  {/* 2. Slug Section */}
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Page Slug <span className="text-red-400">*</span></h3>
                    <p className="text-sm text-gray-300 mb-2">Set a unique slug for this page version (e.g., 'main-landing-page').</p>
                    {slugEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={slugInput}
                          onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))}
                          className="flex-grow px-3 py-1.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                          placeholder="e.g., main-landing-page"
                          disabled={slugSaving}
                        />
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={slugSaving || !slugInput}
                            onClick={handleSaveSlug}
                          >
                            {slugSaving ? <Spin size="small" /> : 'Save Slug'}
                          </button>
                          <button
                            className="px-3 py-1.5 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition"
                            onClick={() => {
                              setSlugInput(currentItem?.slug || '');
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
                        <span className="text-gray-100 text-sm break-all mr-2">{slugInput || <span className="text-gray-400 italic">No slug set</span>}</span>
                        <button
                          className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold transition flex-shrink-0 flex items-center gap-1"
                          onClick={() => setSlugEditing(true)}
                        >
                          <EditOutlined className="text-gray-300" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Nginx Configuration Guide */}
                  <div className="pb-5 border-t border-slate-700 pt-5">
                    <h3 className="text-lg font-semibold text-white mb-3">Nginx Setup Guide</h3>
                     <Alert
                        message={<span className="font-semibold text-yellow-100">Important</span>}
                        description={
                          <ul className="list-disc list-inside text-yellow-200/90 text-xs space-y-1">
                            <li>Requires Nginx & server access.</li>
                            <li>Backup Nginx config before editing.</li>
                          </ul>
                        }
                        type="warning"
                        showIcon
                        className="bg-yellow-600/20 border-yellow-500/30 text-yellow-200 mb-4"
                        icon={<ExclamationCircleOutlined className="text-yellow-300" />}
                      />

                    <div className="space-y-3 text-sm text-gray-300">
                      <p><strong>1. Locate Nginx Config:</strong> Find your site's config file (e.g., <code className="text-xs bg-slate-600 px-1 rounded">/etc/nginx/sites-available/{rootDomain}</code>).</p> {/* 使用 rootDomain */}
                      {/* === 修改：更新说明和 Nginx 示例 === */}
                      <p><strong>2. Add Location Block:</strong> Inside the <code className="text-xs bg-slate-600 px-1 rounded">server</code> block for your domain (<code className="text-xs bg-slate-600 px-1 rounded">{rootDomain}</code>), add a location block similar to this example. Adjust the path (e.g., <code className="text-xs bg-slate-600 px-1 rounded">^/alternative/</code>) to match the subdirectory path you chose (<code className="text-xs bg-slate-600 px-1 rounded">{subdirectoryName || 'your-path'}</code>):</p>
                      <pre className="bg-slate-800 p-3 rounded mt-1 text-xs text-cyan-200 overflow-x-auto"><code>
{`location ~ ^/${subdirectoryName || 'alternative'}/.*$ {
    proxy_pass https://websitelm-pages-production.vercel.app;
    proxy_set_header Host websitelm-pages-production.vercel.app;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-AlterPage-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`}
                      </code></pre>
                       <p className="text-xs text-gray-400 mt-1">Ensure the <code className="text-xs bg-slate-600 px-1 rounded">location</code> path (e.g., <code className="text-xs bg-slate-600 px-1 rounded">^/${subdirectoryName || 'alternative'}/.*$</code>) correctly matches the subdirectory you chose above.</p>
                      {/* === 修改结束 === */}

                      <p><strong>3. Test Config:</strong> Run <code className="text-xs bg-slate-600 px-1 rounded">sudo nginx -t</code>. Check for "syntax is ok".</p>
                      <p><strong>4. Reload Nginx:</strong> Run <code className="text-xs bg-slate-600 px-1 rounded">sudo systemctl reload nginx</code> or <code className="text-xs bg-slate-600 px-1 rounded">sudo service nginx reload</code>.</p>
                      <p><strong>5. Verify:</strong> After publishing, check if <code className="text-xs bg-slate-600 px-1 rounded">{rootDomain}/{subdirectoryName || 'your-path'}/{slugInput || 'your-slug'}</code> loads correctly.</p> {/* 使用 rootDomain */}
                    </div>
                  </div>

                  {/* 4. Publish Button (Subdirectory Mode) */}
                  <div className="mt-6 pt-6 flex flex-col gap-4 border-t border-slate-700">
                     {/* Preview URL */}
                     {rootDomain && slugInput && subdirectoryName && ( // 使用 rootDomain
                      <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                        <div className="text-sm font-semibold text-cyan-300 mb-1">Expected Publish URL (After Nginx Setup)</div>
                        <div className="text-cyan-400 underline break-all hover:text-cyan-300 transition cursor-default text-sm">
                          {`https://${rootDomain}/${subdirectoryName}/${slugInput}`} {/* 使用 rootDomain */}
                        </div>
                      </div>
                    )}
                    <button
                      disabled={!rootDomain || !slugInput || !subdirectoryName || deployLoading || slugEditing} // 依赖 rootDomain
                      onClick={handlePublish}
                      className={`
                        w-full px-4 py-2.5 rounded font-semibold transition text-base shadow-lg
                        ${(!rootDomain || !slugInput || !subdirectoryName || deployLoading || slugEditing) // 依赖 rootDomain
                          ? 'bg-cyan-800/70 text-cyan-400/80 cursor-not-allowed opacity-80'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30'}
                      `}
                    >
                      {deployLoading ? <Spin /> : 'Publish Now'}
                    </button>
                     <p className="text-xs text-center text-gray-400">Ensure your Nginx configuration is complete before publishing.</p>
                  </div>
                </div>
              )}

              {/* === 移除旧的、未绑定的 UI 结构 === */}
              {/*
              <div className="flex flex-col md:flex-row gap-4"> ... </div>
              <div> ... Slug Section ... </div>
              <div className="pb-5 border-t border-slate-700 pt-5"> ... Nginx Guide ... </div>
              <div className="mt-6 pt-6 flex flex-col gap-4 border-t border-slate-700"> ... Publish Button ... </div>
              */}

            </div>
          )}

        </div>
      ) : (
         <div className="flex items-center justify-center h-40">
            <Spin tip="Loading item data..." />
         </div>
      )}

      {/* === 新增：渲染 contextHolder === */}
      {contextHolder}
    </Modal>
    // </App> // 如果在这里添加 App 包裹
  );
};

export default PublishSettingsModal;

<style jsx global>{`
  /* === 覆盖 antd Select 样式 === */
  .domain-select-override .ant-select-selector {
    background-color: #334155 !important; /* 深蓝灰色背景 */
    border-color: #475569 !important; /* 边框颜色 */
    color: #e2e8f0 !important; /* 文字颜色 */
    box-shadow: none !important;
  }
  .domain-select-override .ant-select-arrow {
    color: #94a3b8 !important; /* 箭头颜色 */
  }
  .domain-select-override .ant-select-selection-placeholder {
    color: #64748b !important; /* Placeholder 颜色 */
  }
  /* 下拉菜单选项 */
  .domain-select-option-override.ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    background-color: #0ea5e9 !important; /* 选中项背景 (青色) */
    color: white !important;
  }
  .domain-select-option-override.ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: #475569 !important; /* 悬停项背景 */
    color: white !important;
  }
  .domain-select-option-override {
    color: #cbd5e1 !important; /* 默认选项文字颜色 */
  }

  /* === 移除旧的 Radio.Group 相关样式 (如果不再需要) === */
  /*
  .publish-mode-radio-group .ant-radio-button-wrapper { ... }
  */

  /* === 新增：新的发布模式 Radio.Group 样式 === */
  .publish-mode-radio-group-new .ant-radio-button-wrapper {
    background-color: #334155 !important; /* 深蓝灰色背景 */
    border-color: #475569 !important; /* 边框颜色 */
    color: #cbd5e1 !important; /* 文字颜色 */
    box-shadow: none !important;
  }
  .publish-mode-radio-group-new .ant-radio-button-wrapper:hover {
    background-color: #475569 !important;
    color: #e2e8f0 !important;
  }
  .publish-mode-radio-group-new .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
    background-color: #0ea5e9 !important; /* 青色背景 */
    border-color: #0284c7 !important; /* 深青色边框 */
    color: #ffffff !important; /* 白色文字 */
  }
  .publish-mode-radio-group-new .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
     background-color: #0369a1 !important; /* 深一点的青色 */
     border-color: #075985 !important;
  }
  /* 移除按钮间的分割线 */
  .publish-mode-radio-group-new .ant-radio-button-wrapper:not(:first-child)::before {
    width: 0;
  }

  /* === 自定义子域名 DNS 表格样式 === */
  .subdomain-dns-table-override .ant-table {
    background-color: #334155; /* 深蓝灰色背景 */
    border: 1px solid #475569;
    border-radius: 4px;
  }
  .subdomain-dns-table-override .ant-table-thead > tr > th {
    background-color: #3e4f66; /* 表头稍深一点 */
    color: #cbd5e1; /* 表头文字颜色 */
    border-bottom: 1px solid #475569;
    padding: 8px 12px; /* 调整内边距 */
    font-size: 0.8rem;
  }
  .subdomain-dns-table-override .ant-table-tbody > tr > td {
    color: #e2e8f0; /* 表格文字颜色 */
    border-bottom: 1px solid #475569;
    padding: 8px 12px; /* 调整内边距 */
    font-size: 0.8rem;
    vertical-align: top; /* 垂直对齐 */
  }
  .subdomain-dns-table-override .ant-table-tbody > tr:last-child > td {
    border-bottom: none; /* 移除最后一行底边框 */
  }
  .subdomain-dns-table-override code {
    background-color: #1e293b; /* 代码背景色 */
    color: #93c5fd; /* 代码文字颜色 (浅蓝) */
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }

  /* === 新增：自定义 Collapse 样式 === */
  .domain-collapse-override.ant-collapse {
    background-color: transparent; /* Collapse 背景透明 */
    border: 1px solid #334155; /* 添加边框 */
    border-radius: 6px; /* 添加圆角 */
  }
  .domain-collapse-override > .ant-collapse-item {
    border-bottom: none; /* 移除 Panel 之间的默认分隔线 */
  }
  .domain-collapse-override > .ant-collapse-item > .ant-collapse-header {
    color: #e2e8f0; /* Header 文字颜色 */
    padding: 12px 16px; /* 调整 Header 内边距 */
    align-items: center; /* 垂直居中图标和文字 */
    background-color: #293548; /* Header 背景色 */
    border-radius: 6px 6px 0 0; /* 顶部圆角 */
  }
   /* 当 Panel 展开时，移除 Header 底部圆角 */
  .domain-collapse-override > .ant-collapse-item.ant-collapse-item-active > .ant-collapse-header {
    border-radius: 6px 6px 0 0;
    border-bottom: 1px solid #334155; /* 展开时添加分隔线 */
  }
  .domain-collapse-override > .ant-collapse-item > .ant-collapse-content {
    background-color: #1e293b; /* 内容区域背景色 (与 Modal body 一致) */
    color: #cbd5e1; /* 内容区域文字颜色 */
    border-top: none; /* 移除内容区域顶部边框 */
    border-radius: 0 0 6px 6px; /* 底部圆角 */
  }
  .domain-collapse-override > .ant-collapse-item > .ant-collapse-content > .ant-collapse-content-box {
    padding: 16px; /* 内容区域内边距 */
  }
  /* 覆盖 Panel 内部的样式 */
  .subdomain-collapse-panel {
     /* 这里可以添加特定于 Panel 内部元素的样式，如果需要的话 */
  }

`}</style>