import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Select, Radio, Input, message, App, Tag, Alert, Table, Collapse, Descriptions, Tabs } from 'antd';
import { CopyOutlined, EditOutlined, ExclamationCircleOutlined, CloseOutlined, DeleteOutlined, ReloadOutlined, CaretRightOutlined, InfoCircleOutlined } from '@ant-design/icons';

const PublishSettingsModal = ({
  open,
  onClose,
  apiClient, // 传入 apiClient 实例
  messageApi, // 传入 messageApi 实例
  currentCustomerId, // 传入 Customer ID
}) => {
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, pending_txt, verifying, failed
  const [domainToVerify, setDomainToVerify] = useState('');
  const [txtRecord, setTxtRecord] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [selectedPublishUrl, setSelectedPublishUrl] = useState('');
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
  const [activeCollapseKey, setActiveCollapseKey] = useState(['subdomains']); // 修改：默认打开 subdomains
  const [isDeletingSubdomain, setIsDeletingSubdomain] = useState(false); // 添加删除子域名的 loading 状态
  const [publishMode, setPublishMode] = useState('subdomain'); // 'subdomain' 或 'subdirectory'
  const [baseDomainInput, setBaseDomainInput] = useState(''); // 用于子目录模式的基础域名输入
  // 在现有 state 中添加
  const [currentPublishStatus, setCurrentPublishStatus] = useState(null); // 'published' | 'unpublished' | null
  const [activeTabKey, setActiveTabKey] = useState('domain'); // 新增：用于控制 Tab 切换

  const [modal, contextHolder] = Modal.useModal(); // 获取 modal 实例和 contextHolder
  const VERCEL_PROJECT_ID = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';

  const loadData = async () => {
    setDomainLoading(true);
    setVerifiedDomains([]); // 重置
    setRootDomain(null); // 重置根域名
    setRootDomainId(null); // 新增：重置根域名 ID
    setSubdomains([]); // 重置子域名

    if (!currentCustomerId) {
      console.warn("Cannot load data without customerId.");
      setDomainLoading(false);
      return;
    }

    let fetchedRootDomain = null;

    try {
      try {
        const domainRes = await apiClient.getDomain(currentCustomerId);

        // === 修改：根据新的响应结构判断域名是否已绑定并验证成功 ===
        if (domainRes?.code === 200 && domainRes.data && domainRes.data.verifiedStatus === 'SUCCESS' && domainRes.data.domainName) {
          fetchedRootDomain = domainRes.data.domainName;
          setRootDomain(fetchedRootDomain); // 设置根域名状态
          setRootDomainId(domainRes.data.domainId); // 修改：使用 domainId
          console.log('[loadData] Root domain fetched successfully:', fetchedRootDomain, 'ID:', domainRes.data.domainId);
        } else {
          // 可能是未绑定、验证未完成、API 返回 code 不为 200 或 data 结构不符
          // 不需要设置错误消息，因为这可能是正常情况（用户未绑定域名或验证中）
          console.log('[loadData] No verified root domain found. Response:', domainRes);
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
        console.log('[loadData] No root domain, skipping Vercel domain checks.');
        return; // 没有已验证的根域名，不需要进行后续 Vercel 检查
      }

      // 3. 获取 Vercel 项目的 projectId (硬编码或从配置获取)
      const projectId = VERCEL_PROJECT_ID;
      console.log('[loadData] Using Vercel project ID:', projectId);

      // 4. 获取 Vercel 域名列表
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const domains = domainResp?.domains || [];
      console.log('[loadData] Vercel domains response:', domainResp);
      console.log('[loadData] Total domains from Vercel:', domains.length);

      // 5. === 修改：使用 fetchedRootDomain ===
      const currentRootDomain = fetchedRootDomain; // 使用从 getDomain 获取的根域名
      console.log('[loadData] Current root domain for filtering:', currentRootDomain);

      // 6. 过滤并检查域名 (包括根域名和子域名)
      console.log('[loadData] Starting domain filtering and verification...');
      
      // === 新增：先过滤出相关域名，添加详细日志 ===
      const relevantDomains = domains.filter(domain => {
        const isVerified = domain.verified;
        const isNotVercelApp = !domain.name.includes('vercel.app');
        const isRootOrSubdomain = domain.name === currentRootDomain || domain.name.endsWith(`.${currentRootDomain}`);
        
        console.log(`[loadData] Checking domain: ${domain.name}`, {
          verified: isVerified,
          notVercelApp: isNotVercelApp,
          isRootOrSubdomain: isRootOrSubdomain,
          apexName: domain.apexName,
          createdAt: domain.createdAt
        });
        
        return isVerified && isNotVercelApp && isRootOrSubdomain;
      });
      
      console.log('[loadData] Relevant domains after initial filter:', relevantDomains.map(d => d.name));

      const verifiedDomainsPromises = relevantDomains.map(async domain => {
        try {
          console.log(`[loadData] Getting config for domain: ${domain.name}`);
          // 再次检查配置，确保没有 misconfigured
          const config = await apiClient.getVercelDomainConfig(domain.name);
          console.log(`[loadData] Config for ${domain.name}:`, config);
          
          const isNotMisconfigured = !config?.misconfigured;
          console.log(`[loadData] Domain ${domain.name} misconfigured: ${config?.misconfigured}, will include: ${isNotMisconfigured}`);
          
          return isNotMisconfigured ? domain.name : null;
        } catch (error) {
          // 获取配置失败，视为未完全验证通过
          console.warn(`[loadData] Could not get config for ${domain.name}, excluding from verified list. Error:`, error);
          return null;
        }
      });

      const verifiedDomainsList = (await Promise.all(verifiedDomainsPromises)).filter(Boolean);

      console.log('[loadData] Final verified domains list:', verifiedDomainsList);

      // 7. 设置验证通过的域名列表
      setVerifiedDomains(verifiedDomainsList);

      // 8. 设置默认选中项
      // 过滤掉根域名，只在子域名中选择
      const selectableSubdomains = verifiedDomainsList.filter(d => d !== currentRootDomain); // 使用 currentRootDomain
      console.log('[loadData] Selectable subdomains (excluding root):', selectableSubdomains);

      if (selectableSubdomains.length > 0) {
        // 尝试保持之前的选择 (如果它仍然在可选列表中)
        if (!selectedPublishUrl || !selectableSubdomains.includes(selectedPublishUrl)) {
           console.log('[loadData] Setting default selected URL to first subdomain:', selectableSubdomains[0]);
           setSelectedPublishUrl(selectableSubdomains[0]); // 否则选第一个子域名
        } else {
           console.log('[loadData] Keeping previous selection:', selectedPublishUrl);
        }
        // 如果之前的选择还在，则保持不变
      } else {
        console.log('[loadData] No selectable subdomains, clearing selection');
        setSelectedPublishUrl(''); // 没有可选的子域名了
      }

      // === 修改：在 loadData 结束时，如果根域名存在，则加载子域名 ===
      if (currentRootDomain) { // 使用 currentRootDomain
        console.log('[loadData] Loading subdomains for root domain:', currentRootDomain);
        await loadSubdomains(currentRootDomain); // 传递根域名给 loadSubdomains
        console.log('[loadData] Subdomains loaded, setting collapse key');
        setActiveCollapseKey(['subdomains']); // 修改：确保有根域名时展开
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
      setActiveCollapseKey([]); // 出错时收起
      // 新增：出错时也清空 rootDomainId
      setRootDomainId(null);
      messageApi.error('Failed to load domain information.');
    } finally {
      setDomainLoading(false);
    }
  };

  const loadSubdomains = async (currentRootDomain) => {
    if (!currentRootDomain) {
      console.log("No root domain provided, skipping subdomain load.");
      setSubdomains([]);
      return;
    }
    setSubdomainLoading(true);
    setSubdomains([]);
    const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';

    try {
      // 1. 获取项目下的所有域名
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const allDomains = domainResp?.domains || [];

      // 2. 过滤出子域名
      const potentialSubdomains = allDomains.filter(domain =>
        domain.apexName === currentRootDomain && domain.name !== currentRootDomain
      );

      console.log('[loadSubdomains] Potential subdomains found:', potentialSubdomains.map(d => ({ 
        name: d.name, 
        verified: d.verified,
        hasVerification: !!d.verification?.length 
      })));

      // 3. 获取每个子域名的详细配置信息
      const subdomainsWithConfigPromises = potentialSubdomains.map(async (domain) => {
        try {
          console.log(`[loadSubdomains] Processing subdomain: ${domain.name}`);
          console.log(`[loadSubdomains] - Vercel verified: ${domain.verified}`);
          console.log(`[loadSubdomains] - Has verification array: ${!!domain.verification?.length}`);
          console.log(`[loadSubdomains] - Verification records:`, domain.verification);

          const config = await apiClient.getVercelDomainConfig(domain.name);
          console.log(`[loadSubdomains] Config for ${domain.name}:`, config);
          
          // === 修改：综合判断域名状态 ===
          const configOk = !config?.misconfigured; // DNS 配置是否正确
          const needsVerification = !!domain.verification?.length; // 是否需要额外验证
          const fullyVerified = domain.verified && !needsVerification; // 完全验证通过
          
          // === 新增：确定最终的验证状态和需要显示的记录 ===
          let finalVerified = fullyVerified;
          let recordsToShow = null;
          
          if (needsVerification) {
            // 如果有 verification 数组，说明需要额外验证，显示为未验证状态
            finalVerified = false;
            recordsToShow = domain.verification;
          } else if (!configOk) {
            // 如果没有 verification 数组但 config 有问题，可能需要 CNAME 记录
            finalVerified = false;
            recordsToShow = [{
              type: 'CNAME',
              domain: domain.name.replace(`.${domain.apexName}`, ''),
              value: 'cname.vercel-dns.com.',
              reason: 'dns_configuration'
            }];
          }
          
          console.log(`[loadSubdomains] Final status for ${domain.name}:`, {
            configOk,
            needsVerification,
            fullyVerified,
            finalVerified,
            recordsToShow: recordsToShow?.length || 0
          });
          
          return {
            ...domain,
            verified: finalVerified, // === 修改：使用综合判断的结果 ===
            configDetails: config,
            verificationRecords: recordsToShow, // === 修改：使用需要显示的记录 ===
            needsVerification: needsVerification, // === 新增：标记是否需要验证 ===
            configOk: configOk, // === 新增：标记配置是否正确 ===
          };
        } catch (error) {
          console.error(`Failed to get config for subdomain ${domain.name}:`, error);
          return {
            ...domain,
            verified: false,
            configDetails: null,
            verificationRecords: domain.verification || null, // 即使配置获取失败，也保留验证记录
            needsVerification: !!domain.verification?.length,
            configOk: false,
          };
        }
      });

      const resolvedSubdomains = await Promise.all(subdomainsWithConfigPromises);
      console.log('[loadSubdomains] Final resolved subdomains:', resolvedSubdomains.map(d => ({ 
        name: d.name, 
        verified: d.verified,
        needsVerification: d.needsVerification,
        configOk: d.configOk,
        recordsCount: d.verificationRecords?.length || 0
      })));
      
      setSubdomains(resolvedSubdomains);

    } catch (error) {
      console.error("Error loading subdomains:", error);
      messageApi.error('Failed to load subdomain information.');
      setSubdomains([]);
    } finally {
      setSubdomainLoading(false);
    }
  };

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

  const getDomainStatusInfo = (domain) => {
    if (domain.verified && !domain.needsVerification) {
      return { color: 'success', text: 'Verified' };
    }
    
    if (domain.needsVerification) {
      return { color: 'warning', text: 'Needs Verification' };
    }
    
    if (!domain.configOk) {
      return { color: 'warning', text: 'Pending DNS' };
    }
    
    // 默认情况
    return { color: 'warning', text: 'Pending' };
  };

  const handleDeleteSubdomain = async (domainName) => {
    modal.confirm({
      title: <span className="text-red-400">Delete Subdomain</span>,
      icon: <ExclamationCircleOutlined style={{ color: '#f87171' }} />,
      content: (
        <div>
          <p>Are you sure you want to delete the subdomain <strong>{domainName}</strong>?</p>
          <div className="mt-3 p-3 bg-red-900/20 border border-red-700/50 rounded">
            <p className="text-red-800 text-sm mb-2 font-semibold">⚠️ This action will:</p>
            <ul className="text-red-900 text-xs space-y-1 ml-4">
              <li>• Permanently delete the subdomain</li>
              <li>• Unpublish all pages on this subdomain</li>
              <li>• Make all content inaccessible</li>
              <li>• Cannot be undone</li>
            </ul>
          </div>
        </div>
      ),
      okText: 'Delete Subdomain',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setIsDeletingSubdomain(true);
        try {
          // 修改：传递 projectId 参数
          await apiClient.deleteVercelDomain(VERCEL_PROJECT_ID, domainName);
          messageApi.success(`Subdomain ${domainName} deleted successfully`);
          
          // 如果删除的是当前选中的发布域名，清空选择并重置发布状态
          if (selectedPublishUrl === domainName) {
            setSelectedPublishUrl('');
            setCurrentPublishStatus(null);
          }
          
          // 重新加载数据
          await loadData();
        } catch (error) {
          console.error('Error deleting subdomain:', error);
          messageApi.error(`Failed to delete subdomain: ${error.message}`);
        } finally {
          setIsDeletingSubdomain(false);
        }
      }
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
            <input
              type="text"
              placeholder="e.g., blog"
              value={subdomainPrefix}
              onChange={(e) => setSubdomainPrefix(e.target.value)}
              className="flex-grow bg-transparent border-none placeholder-gray-500 focus:outline-none focus:ring-0 px-3 py-1.5 text-white"
              disabled={isAddingSubdomain || subdomainLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubdomain();
                }
              }}
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
            className="bg-green-600 hover:bg-green-500 border-green-600 hover:border-green-500 text-white font-semibold px-4 py-1.5 text-sm shadow-md hover:shadow-lg transition-all duration-200"
          >
            Records added, refresh
          </Button>
        </div>

        <Spin spinning={subdomainLoading && !isAddingSubdomain} tip={<span className="text-gray-300">Loading subdomains...</span>}>
          {subdomains.length > 0 ? (
            <div className="space-y-3">
              {subdomains.map(domain => {
                const status = getDomainStatusInfo(domain);
                
                // === 修改：合并显示所有需要的 DNS 记录 ===
                let dnsData = [];
                let alertMessage = '';
                let alertDescription = '';
                
                // 收集所有需要的 DNS 记录
                const allRecords = [];
                
                // 1. 如果需要验证（TXT 记录）
                if (domain.needsVerification && domain.verificationRecords) {
                  domain.verificationRecords.forEach(record => {
                    allRecords.push({
                      ...record,
                      purpose: 'verification' // 标记用途
                    });
                  });
                }
                
                // 2. 如果需要 DNS 配置（CNAME/A 记录）
                if (!domain.configOk && domain.configRecords) {
                  domain.configRecords.forEach(record => {
                    allRecords.push({
                      ...record,
                      purpose: 'config' // 标记用途
                    });
                  });
                }
                
                // 3. 如果 verificationRecords 中包含了配置记录（兼容旧数据结构）
                if (!domain.configOk && domain.verificationRecords && !domain.configRecords) {
                  domain.verificationRecords.forEach(record => {
                    if (record.type !== 'TXT') { // 非 TXT 记录通常是配置记录
                      allRecords.push({
                        ...record,
                        purpose: 'config'
                      });
                    }
                  });
                }
                
                // 转换为表格数据格式
                if (allRecords.length > 0) {
                  dnsData = allRecords.map((record, index) => ({
                    type: record.type,
                    name: record.domain || record.name,
                    value: record.value,
                    purpose: record.purpose,
                    key: `${record.type}-${record.purpose}-${index}`
                  }));
                  
                  // 根据记录类型设置提示信息
                  const hasVerification = allRecords.some(r => r.purpose === 'verification');
                  const hasConfig = allRecords.some(r => r.purpose === 'config');
                  
                  if (hasVerification && hasConfig) {
                    alertMessage = 'Domain Verification & DNS Configuration Required';
                    alertDescription = 'This domain needs both ownership verification (TXT) and DNS configuration (CNAME/A) records. Add all records below to complete the setup.';
                  } else if (hasVerification) {
                    alertMessage = 'Domain Verification Required';
                    alertDescription = 'This domain may be used in another Vercel project. Add the following TXT record to verify ownership for this project.';
                  } else if (hasConfig) {
                    alertMessage = 'DNS Configuration Required';
                    alertDescription = 'Add the following DNS record(s) to your domain provider to configure this subdomain.';
                  }
                }

                return (
                  <div key={domain.name} className="p-4 bg-slate-700/50 rounded border border-slate-600 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{domain.name}</span>
                        <Tag color={status.color} className="text-xs">
                          {status.text}
                        </Tag>
                      </div>
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="text"
                        danger
                        onClick={() => handleDeleteSubdomain(domain.name)}
                        disabled={isDeletingSubdomain}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      />
                    </div>

                    {/* === 修改：显示所有需要的 DNS 记录 === */}
                    {dnsData.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                         <Alert
                          message={<span className="font-semibold text-yellow-100">{alertMessage}</span>}
                          description={
                            <div className="space-y-2">
                              <span className="text-yellow-200/90 text-xs">{alertDescription}</span>
                              <div className="text-xs text-yellow-300/80">
                                💡 After adding all DNS records, click "Records added, refresh" below to check verification status.
                              </div>
                            </div>
                          }
                          type="warning"
                          showIcon
                          className="bg-yellow-600/20 border-yellow-500/30 text-yellow-200 mb-3"
                          icon={<ExclamationCircleOutlined className="text-yellow-300" />}
                        />
                        <Table
                          dataSource={dnsData}
                          columns={[
                            { title: 'Type', dataIndex: 'type', key: 'type', width: '15%' },
                            { title: 'Name', dataIndex: 'name', key: 'name', width: '30%' },
                            { 
                              title: 'Value', 
                              dataIndex: 'value', 
                              key: 'value', 
                              width: '45%', 
                              render: (text) => <code className="text-xs break-all">{text}</code> 
                            },
                            {
                              title: 'Purpose',
                              dataIndex: 'purpose',
                              key: 'purpose',
                              width: '10%',
                              render: (purpose) => (
                                <Tag 
                                  color={purpose === 'verification' ? 'orange' : 'blue'} 
                                  className="text-xs"
                                >
                                  {purpose === 'verification' ? 'Verify' : 'Config'}
                                </Tag>
                              )
                            }
                          ]}
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

  // 添加检查是否完全验证完成的函数
  const isSubdomainModeFullyVerified = () => {
    // 1. 必须有根域名
    if (!rootDomain) return false;
    
    // 2. 必须有至少一个完全验证的子域名
    const fullyVerifiedSubdomains = verifiedDomains.filter(d => d !== rootDomain);
    return fullyVerifiedSubdomains.length > 0;
  };
  
  // 修改 useEffect，添加自动发布逻辑
  useEffect(() => {
    if (open) {
      loadData();
    }
    // ... 现有的 else 逻辑 ...
  }, [open, currentCustomerId]); // 依赖项保持不变 (暂时忽略 exhaustive-deps 警告，因为 loadData 等函数未包含)

  // 在 useEffect 中添加 Tab 切换逻辑
  useEffect(() => {
    if (open) {
      // 根据当前状态自动切换到合适的 Tab
      if (!rootDomain) {
        setActiveTabKey('domain');
      } else {
        setActiveTabKey('subdomains');
      }
    }
  }, [open, rootDomain, verifiedDomains]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={<span className="text-white font-medium text-base">Publish Domain Settings</span>}
      footer={null}
      width={1200}
      centered
      styles={{
        body: { background: '#1e293b', padding: '16px', borderRadius: '8px' },
        header: { background: '#1e293b', borderBottom: '1px solid #334155', color: 'white', padding: '8px 16px' },
        content: { background: '#1e293b', padding: 0 },
      }}
      closable={true}
      maskClosable={false}
      destroyOnClose
      closeIcon={<CloseOutlined style={{ color: 'white', fontSize: '14px' }} />} 
    >
        <div className="text-gray-200 space-y-3">
          {/* === 发布模式选择 === */}
          <div className="pb-3 border-b border-slate-700">
            <h3 className="text-sm font-medium text-white mb-2">Publishing Mode</h3>
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
              className="publish-mode-radio-group-new"
              size="small"
            >
              <Radio.Button value="subdomain">Add Subdomain</Radio.Button>
              <Radio.Button value="subdirectory">Add Subfolder</Radio.Button>
            </Radio.Group>
            {publishMode === 'subdirectory' && (
              <Alert
                message="Subdirectory Mode requires manual Nginx configuration on your server."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                className="mt-2 bg-blue-900/30 border-blue-700/50 text-blue-200 text-xs"
              />
            )}
          </div>

          {/* === Step 1: 通用域名绑定 === */}
          <div className="pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${rootDomain ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                {rootDomain ? '✓' : '1'}
              </div>
              <h3 className="text-sm font-medium text-white">Step 1: Bind Domain</h3>
            </div>

            <Spin spinning={domainLoading} tip={<span className="text-gray-300 text-xs">Loading domain info...</span>}>
              {rootDomain ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-green-900/20 border border-green-700/50 rounded">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-medium text-green-300">Domain Successfully Bound</span>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs text-gray-300">Root Domain: </span>
                        <span className="text-xs font-semibold text-green-300">{rootDomain}</span>
                      </div>
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={handleDeleteDomainVerification}
                        loading={isDeletingVerification}
                        className="text-red-400 hover:text-red-300 flex-shrink-0 text-xs h-6"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">✓ Domain ready. Proceed to next step below.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 bg-blue-900/20 border border-blue-700/50 rounded">
                    <p className="text-xs text-blue-200 mb-1.5">
                      Bind a domain to your account. This will be your root domain (e.g., yourdomain.com) for {publishMode === 'subdomain' ? 'creating subdomains' : 'subdirectory setup'}.
                    </p>
                  </div>
                  <Spin spinning={verificationLoading} tip={<span className="text-gray-300 text-xs">{verificationStatus === 'verifying' ? "Verifying..." : "Processing..."}</span>}>
                    {verificationError && (
                      <div className="p-2 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-xs">
                        {verificationError}
                      </div>
                    )}
                    {verificationStatus === 'idle' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-1">Enter your domain name</label>
                          <input
                            type="text"
                            placeholder="example.com"
                            value={domainToVerify}
                            onChange={(e) => {
                              setDomainToVerify(e.target.value.trim());
                              setVerificationError(null);
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                            disabled={verificationLoading || !currentCustomerId}
                          />
                        </div>
                        <Button
                          type="primary"
                          onClick={handleAddDomain}
                          loading={verificationLoading}
                          disabled={!domainToVerify || verificationLoading || !currentCustomerId}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold text-xs h-7"
                          size="small"
                        >
                          Get Verification Record
                        </Button>
                        {!currentCustomerId && <p className="text-yellow-400 text-xs mt-1">Customer ID is not available, cannot add domain.</p>}
                      </div>
                    )}
                    {(verificationStatus === 'pending_txt' || verificationStatus === 'verifying') && txtRecord && (
                      <div className="space-y-4">
                        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                          <h4 className="font-medium text-yellow-200 mb-2">DNS Verification Required</h4>
                          <p className="text-sm text-yellow-200/80 mb-3">
                            Add the following TXT record to your domain's DNS settings to verify ownership.
                          </p>
                          <div className="space-y-2 bg-slate-800 p-3 rounded border border-slate-600">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Type:</span>
                                <div className="flex items-center justify-between">
                                  <code className="text-cyan-300 bg-slate-700 px-2 py-1 rounded">TXT</code>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Name/Host:</span>
                                <div className="flex items-center justify-between">
                                  <code className="text-cyan-300 bg-slate-700 px-2 py-1 rounded break-all mr-1">{txtRecord.name}</code>
                                  <Button icon={<CopyOutlined />} type="text" size="small" onClick={() => copyToClipboard(txtRecord.name)} />
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Value:</span>
                                <div className="flex items-center justify-between">
                                  <code className="text-cyan-300 bg-slate-700 px-2 py-1 rounded break-all mr-1">{txtRecord.value}</code>
                                  <Button icon={<CopyOutlined />} type="text" size="small" onClick={() => copyToClipboard(txtRecord.value)} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-yellow-300/80 mt-2">
                            💡 Tip: DNS changes can take 5-30 minutes to propagate. If verification fails, wait a bit and try again.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="primary"
                            onClick={handleVerifyDomain}
                            loading={verificationLoading && verificationStatus === 'verifying'}
                            disabled={verificationLoading}
                            className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 border-none text-white font-semibold"
                          >
                            {verificationLoading && verificationStatus === 'verifying' ? 'Verifying...' : 'Verify Domain'}
                          </Button>
                          <Button
                            type="default"
                            onClick={() => {
                              setVerificationStatus('idle');
                              setTxtRecord(null);
                              setVerificationError(null);
                            }}
                            disabled={verificationLoading}
                            className="bg-slate-600 hover:bg-slate-500 border-slate-500 text-white"
                          >
                            Change Domain
                          </Button>
                        </div>
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
                </div>
              )}
            </Spin>
          </div>

          {/* === Step 2: 根据模式显示不同内容 === */}
          {rootDomain && (
            <>
              {publishMode === 'subdomain' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${verifiedDomains.filter(d => d !== rootDomain).length > 0 ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {verifiedDomains.filter(d => d !== rootDomain).length > 0 ? '✓' : '2'}
                    </div>
                    <h3 className="text-sm font-medium text-white">Step 2: Create Subdomains</h3>
                  </div>

                  <div className="space-y-3">
                    {verifiedDomains.filter(d => d !== rootDomain).length === 0 ? (
                      <div className="p-2.5 bg-blue-900/20 border border-blue-700/50 rounded mb-2">
                        <p className="text-xs text-blue-200 mb-1.5">
                          Now let's create your subdomain! Subdomains allow you to publish content at addresses like 
                          <code className="mx-1 px-1 bg-slate-700 rounded text-cyan-300">alternative.{rootDomain}</code> or 
                          <code className="mx-1 px-1 bg-slate-700 rounded text-cyan-300">alt.{rootDomain}</code>.
                        </p>
                        <p className="text-xs text-blue-300">
                          💡 You can create multiple subdomains for different types of content.
                        </p>
                      </div>
                    ) : null}

                    {/* Add Subdomain Section */}
                    <div className="p-2.5 bg-slate-800/50 rounded border border-slate-600">
                      <h4 className="text-xs font-medium text-white mb-2">Create New Subdomain</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-grow items-center rounded border border-slate-600 bg-slate-700 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500">
                          <input
                            type="text"
                            placeholder="blog"
                            value={subdomainPrefix}
                            onChange={(e) => setSubdomainPrefix(e.target.value)}
                            className="flex-grow bg-transparent border-none placeholder-gray-500 focus:outline-none focus:ring-0 px-2.5 py-1.5 text-white text-xs" 
                            disabled={isAddingSubdomain || subdomainLoading}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddSubdomain();
                              }
                            }}
                          />
                          <span className="px-2.5 py-1.5 text-xs text-gray-400 bg-slate-600 flex-shrink-0 rounded-r"> 
                            .{rootDomain}
                          </span>
                        </div>
                        <Button
                          type="primary"
                          onClick={handleAddSubdomain}
                          loading={isAddingSubdomain}
                          disabled={!subdomainPrefix.trim() || subdomainLoading}
                          className="bg-cyan-600 hover:bg-cyan-500 border-none flex-shrink-0 text-xs h-7" 
                          size="small"
                        >
                          Add Subdomain
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Examples: alternative, alt, etc. Use lowercase letters only.
                      </p>
                    </div>

                    {/* Existing Subdomains */}
                    <Spin spinning={subdomainLoading && !isAddingSubdomain} tip={<span className="text-gray-300 text-xs">Loading subdomains...</span>}>
                      {subdomains.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-white">Your Subdomains</h4>
                          {subdomains.map(domain => {
                            const status = getDomainStatusInfo(domain);
                            
                            // DNS 记录处理逻辑保持不变
                            let dnsData = [];
                            let alertMessage = '';
                            let alertDescription = '';
                            
                            const allRecords = [];
                            
                            if (domain.needsVerification && domain.verificationRecords) {
                              domain.verificationRecords.forEach(record => {
                                allRecords.push({
                                  ...record,
                                  purpose: 'verification'
                                });
                              });
                            }
                            
                            if (!domain.configOk && domain.configRecords) {
                              domain.configRecords.forEach(record => {
                                allRecords.push({
                                  ...record,
                                  purpose: 'config'
                                });
                              });
                            }
                            
                            if (!domain.configOk && domain.verificationRecords && !domain.configRecords) {
                              domain.verificationRecords.forEach(record => {
                                if (record.type !== 'TXT') {
                                  allRecords.push({
                                    ...record,
                                    purpose: 'config'
                                  });
                                }
                              });
                            }
                            
                            if (allRecords.length > 0) {
                              dnsData = allRecords.map((record, index) => ({
                                type: record.type,
                                name: record.domain || record.name,
                                value: record.value,
                                purpose: record.purpose,
                                key: `${record.type}-${record.purpose}-${index}`
                              }));
                              
                              const hasVerification = allRecords.some(r => r.purpose === 'verification');
                              const hasConfig = allRecords.some(r => r.purpose === 'config');
                              
                              if (hasVerification && hasConfig) {
                                alertMessage = 'Domain Verification & DNS Configuration Required';
                                alertDescription = 'This domain needs both ownership verification (TXT) and DNS configuration (CNAME/A) records. Add all records below to complete the setup.';
                              } else if (hasVerification) {
                                alertMessage = 'Domain Verification Required';
                                alertDescription = 'This domain may be used in another Vercel project. Add the following TXT record to verify ownership for this project.';
                              } else if (hasConfig) {
                                alertMessage = 'DNS Configuration Required';
                                alertDescription = 'Add the following DNS record(s) to your domain provider to configure this subdomain.';
                              }
                            }

                            return (
                              <div key={domain.name} className="p-4 bg-slate-700/50 rounded border border-slate-600 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-white">{domain.name}</span>
                                    <Tag color={status.color} className="text-xs">
                                      {status.text}
                                    </Tag>
                                  </div>
                                  <Button
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    type="text"
                                    danger
                                    onClick={() => handleDeleteSubdomain(domain.name)}
                                    disabled={isDeletingSubdomain}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  />
                                </div>

                                {dnsData.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-slate-600/50">
                                     <Alert
                                      message={<span className="font-semibold text-yellow-100">{alertMessage}</span>}
                                      description={
                                        <div className="space-y-2">
                                          <span className="text-yellow-200/90 text-xs">{alertDescription}</span>
                                          <div className="text-xs text-yellow-300/80">
                                            💡 After adding all DNS records, click "Records added, refresh" below to check verification status.
                                          </div>
                                        </div>
                                      }
                                      type="warning"
                                      showIcon
                                      className="bg-yellow-600/20 border-yellow-500/30 text-yellow-200 mb-3"
                                      icon={<ExclamationCircleOutlined className="text-yellow-300" />}
                                    />
                                    <Table
                                      dataSource={dnsData}
                                      columns={[
                                        { title: 'Type', dataIndex: 'type', key: 'type', width: '15%' },
                                        { title: 'Name', dataIndex: 'name', key: 'name', width: '30%' },
                                        { 
                                          title: 'Value', 
                                          dataIndex: 'value', 
                                          key: 'value', 
                                          width: '45%', 
                                          render: (text) => <code className="text-xs break-all">{text}</code> 
                                        },
                                        {
                                          title: 'Purpose',
                                          dataIndex: 'purpose',
                                          key: 'purpose',
                                          width: '10%',
                                          render: (purpose) => (
                                            <Tag 
                                              color={purpose === 'verification' ? 'orange' : 'blue'} 
                                              className="text-xs"
                                            >
                                              {purpose === 'verification' ? 'Verify' : 'Config'}
                                            </Tag>
                                          )
                                        }
                                      ]}
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
                          
                          {/* Refresh Button */}
                          <div className="flex justify-center pt-2">
                            <Button
                              onClick={loadData}
                              loading={domainLoading && !isAddingSubdomain}
                              disabled={isAddingSubdomain || domainLoading}
                              className="bg-green-600 hover:bg-green-500 border-green-600 hover:border-green-500 text-white font-semibold px-4 py-1.5 text-xs shadow-md hover:shadow-lg transition-all duration-200"
                              icon={<ReloadOutlined />}
                              size="small"
                            >
                              Records added, refresh status
                            </Button>
                          </div>
                        </div>
                      ) : (
                        !subdomainLoading && (
                          <div className="text-center py-4">
                            <p className="text-xs text-gray-400 mb-1">No subdomains created yet</p>
                            <p className="text-xs text-gray-500">Create your first subdomain above to get started!</p>
                          </div>
                        )
                      )}
                    </Spin>

                    {/* 完成提示 */}
                    {verifiedDomains.filter(d => d !== rootDomain).length > 0 && (
                      <div className="text-center pt-3 border-t border-slate-700">
                        <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-300">🎉 Setup Complete!</span>
                          </div>
                          <p className="text-xs text-green-200 mb-2">
                            ✓ {verifiedDomains.filter(d => d !== rootDomain).length} subdomain(s) ready for publishing
                          </p>
                          <p className="text-xs text-gray-300">
                            You can now close this dialog and use the publish button in the result preview to publish your content.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {publishMode === 'subdirectory' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-blue-600 text-white">
                      2
                    </div>
                    <h3 className="text-sm font-medium text-white">Step 2: Nginx Setup Guide</h3>
                  </div>

                  <div className="space-y-4">
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
                      className="bg-yellow-600/20 border-yellow-500/30 text-yellow-200"
                      icon={<ExclamationCircleOutlined className="text-yellow-300" />}
                    />

                    <div className="space-y-3 text-sm text-gray-300">
                      <p><strong>1. Locate Nginx Config:</strong> Find your site's config file (e.g., <code className="text-xs bg-slate-600 px-1 rounded">/etc/nginx/sites-available/{rootDomain}</code>).</p>
                      <p><strong>2. Add Location Block:</strong> Inside the <code className="text-xs bg-slate-600 px-1 rounded">server</code> block for your domain (<code className="text-xs bg-slate-600 px-1 rounded">{rootDomain}</code>), add a location block for your subdirectory path:</p>
                      <pre className="bg-slate-800 p-3 rounded mt-1 text-xs text-cyan-200 overflow-x-auto"><code>
{`location ~ ^/your-subdirectory/.*$ {
    proxy_pass https://websitelm-pages-production.vercel.app;
    proxy_set_header Host websitelm-pages-production.vercel.app;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-AlterPage-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`}
                      </code></pre>
                      <p className="text-xs text-gray-400 mt-1">Replace <code className="text-xs bg-slate-600 px-1 rounded">your-subdirectory</code> with your chosen subdirectory path (e.g., <code className="text-xs bg-slate-600 px-1 rounded">alternative</code>, <code className="text-xs bg-slate-600 px-1 rounded">blog</code>, etc.).</p>

                      <p><strong>3. Test Config:</strong> Run <code className="text-xs bg-slate-600 px-1 rounded">sudo nginx -t</code>. Check for "syntax is ok".</p>
                      <p><strong>4. Reload Nginx:</strong> Run <code className="text-xs bg-slate-600 px-1 rounded">sudo systemctl reload nginx</code> or <code className="text-xs bg-slate-600 px-1 rounded">sudo service nginx reload</code>.</p>
                      <p><strong>5. Verify:</strong> After publishing your content, check if <code className="text-xs bg-slate-600 px-1 rounded">{rootDomain}/your-subdirectory/your-slug</code> loads correctly.</p>
                    </div>

                    <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-300">Setup Complete!</span>
                      </div>
                      <p className="text-xs text-blue-200 mb-2">
                        ✓ Domain bound: {rootDomain}
                      </p>
                      <p className="text-xs text-gray-300">
                        Configure your Nginx server with the location block above, then you can publish content using the subdirectory mode in the result preview.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 如果域名未绑定，显示提示 */}
          {!rootDomain && (
            <div className="text-center py-8">
              <div className="flex items-center gap-2 justify-center mb-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-slate-600 text-gray-300">
                  2
                </div>
                <span className="text-sm text-gray-400">Step 2: {publishMode === 'subdomain' ? 'Create Subdomains' : 'Nginx Setup Guide'}</span>
              </div>
              <p className="text-gray-400 text-sm">Please complete domain binding first</p>
            </div>
          )}
        </div>
      {contextHolder}
    </Modal>
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

  /* === 修改：Tab 样式 - 完全复刻 Radio.Group 的样式 === */
  .subdomain-tabs-override .ant-tabs-nav {
    background-color: #1e293b;
    margin-bottom: 16px;
  }
  /* 未选中状态 - 复刻 Radio.Group 的默认样式 */
  .subdomain-tabs-override .ant-tabs-tab {
    background-color: #334155 !important; /* 深蓝灰色背景 */
    border-color: #475569 !important; /* 边框颜色 */
    color: #cbd5e1 !important; /* 文字颜色 */
    box-shadow: none !important;
    margin-right: 4px !important;
  }
  /* 悬停状态 - 复刻 Radio.Group 的悬停样式 */
  .subdomain-tabs-override .ant-tabs-tab:hover {
    background-color: #475569 !important;
    color: #e2e8f0 !important;
  }
  /* 选中状态 - 完全复刻 Radio.Group 的选中样式 */
  .subdomain-tabs-override .ant-tabs-tab-active {
    background-color: #0ea5e9 !important; /* 青色背景 */
    border-color: #0284c7 !important; /* 深青色边框 */
    color: #ffffff !important; /* 白色文字 */
  }
  /* 选中状态悬停 - 复刻 Radio.Group 的选中悬停样式 */
  .subdomain-tabs-override .ant-tabs-tab-active:hover {
    background-color: #0369a1 !important; /* 深一点的青色 */
    border-color: #075985 !important;
    color: #ffffff !important;
  }
  /* 禁用状态 */
  .subdomain-tabs-override .ant-tabs-tab-disabled {
    background-color: #1e293b !important;
    border-color: #334155 !important;
    color: #94a3b8 !important;
    opacity: 0.7;
  }
  .subdomain-tabs-override .ant-tabs-content-holder {
    background-color: transparent;
  }
  .subdomain-tabs-override .ant-tabs-tabpane {
    background-color: transparent;
    min-height: 300px;
  }
  .subdomain-tabs-override .ant-tabs-ink-bar {
    background-color: #0ea5e9 !important;
  }

  /* === 确保 Tab 内的文字和图标也使用正确颜色 === */
  .subdomain-tabs-override .ant-tabs-tab .ant-tabs-tab-btn {
    color: inherit !important;
  }
  .subdomain-tabs-override .ant-tabs-tab .ant-tabs-tab-btn > span {
    color: inherit !important;
  }
  .subdomain-tabs-override .ant-tabs-tab .ant-tabs-tab-btn * {
    color: inherit !important;
  }
  /* 确保选中状态下的所有子元素都使用白色 */
  .subdomain-tabs-override .ant-tabs-tab-active .ant-tabs-tab-btn,
  .subdomain-tabs-override .ant-tabs-tab-active .ant-tabs-tab-btn > span,
  .subdomain-tabs-override .ant-tabs-tab-active .ant-tabs-tab-btn * {
    color: #ffffff !important;
  }
`}</style>