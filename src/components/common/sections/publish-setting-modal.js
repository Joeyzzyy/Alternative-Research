import React, { useState, useEffect } from 'react';
import { Modal, Button, Spin, Select, Radio, Input, message, App } from 'antd';
import { CopyOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
// 假设 apiClient 是通过 props 传入或者可以从 context 获取
// import apiClient from '@/services/apiClient'; // 根据你的项目结构调整

const PublishSettingsModal = ({
  open,
  onClose,
  apiClient, // 传入 apiClient 实例
  messageApi, // 传入 messageApi 实例
  currentItem, // 传入当前选中的任务项 { resultId, slug, ... }
  currentProductInfo: initialProductInfo, // 传入当前产品信息
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
  const [currentProductInfo, setCurrentProductInfo] = useState(initialProductInfo);

  // === 新增 Subfolder 相关 State ===
  const [subfolders, setSubfolders] = useState([]);
  const [subfolderLoading, setSubfolderLoading] = useState(false);
  const [showAddSubfolderModal, setShowAddSubfolderModal] = useState(false);
  const [newSubfolderInput, setNewSubfolderInput] = useState('');
  const [isAddingSubfolder, setIsAddingSubfolder] = useState(false);
  // 可以考虑添加删除时的 loading 状态，如果需要更精细的控制
  // const [deletingSubfolder, setDeletingSubfolder] = useState(null);

  // === 新增：使用 useModal Hook ===
  const [modal, contextHolder] = Modal.useModal(); // 获取 modal 实例和 contextHolder

  // === 内部加载已验证域名和产品信息的函数 ===
  const loadData = async () => {
    setDomainLoading(true);
    setVerifiedDomains([]); // 重置
    setCurrentProductInfo(null); // 重置
    let productInfo = null;
    try {
      // 1. 获取产品信息 (如果外部没传入最新的，或者需要刷新)
      //    为了简化，我们优先使用传入的 initialProductInfo，
      //    但在验证成功或解绑后，需要调用 onDomainChange 让外部刷新并重新传入
      productInfo = initialProductInfo; // 使用传入的
      setCurrentProductInfo(productInfo);

      // 如果外部没有传入 productInfo，则尝试获取
      if (!productInfo && currentCustomerId) {
         try {
            const response = await apiClient.getProductsByCustomerId();
            if (response?.code === 200 && response.data) {
               productInfo = response.data;
               setCurrentProductInfo(productInfo);
            } else {
               console.error("Failed to get product info inside modal:", response);
            }
         } catch (productError) {
            console.error("Error fetching product info inside modal:", productError);
         }
      }


      // 2. 检查 domainStatus
      if (!productInfo || productInfo.domainStatus === false) {
        setVerifiedDomains([]);
        setDomainLoading(false);
        return;
      }

      // 3. 获取 Vercel 项目的 projectId (硬编码或从配置获取)
      const projectId = 'prj_wzQuo0EarALY8MsjNvPotb4wYO8S';

      // 4. 获取域名列表
      const domainResp = await apiClient.getVercelDomainInfo(projectId);
      const domains = domainResp?.domains || [];

      // 5. 获取根域名
      const rootDomain = productInfo?.projectWebsite;
      if (!rootDomain) {
        setVerifiedDomains([]);
        setDomainLoading(false);
        return;
      }

      // 6. 过滤并检查域名
      const verifiedDomainsPromises = domains
        .filter(domain =>
          domain.verified &&
          !domain.name.includes('vercel.app') &&
          (domain.name === rootDomain || domain.name.endsWith(`.${rootDomain}`))
        )
        .map(async domain => {
          try {
            const config = await apiClient.getVercelDomainConfig(domain.name);
            return !config?.misconfigured ? domain.name : null;
          } catch (error) {
            return null;
          }
        });

      const verifiedDomainsList = (await Promise.all(verifiedDomainsPromises)).filter(Boolean);

      // 7. 获取子文件夹 (移动到这里，确保 rootDomain 存在后才加载)
      let loadedSubfolders = [];
      if (rootDomain) { // 仅当根域名存在时加载
        setSubfolderLoading(true);
        try {
          const subfolderResp = await apiClient.getSubfolders();
          if (subfolderResp?.code === 200 && Array.isArray(subfolderResp.data)) {
            loadedSubfolders = subfolderResp.data;
            setSubfolders(loadedSubfolders); // 更新 state
          } else {
            setSubfolders([]); // 清空或处理错误
          }
        } catch (error) {
          console.error("Error loading subfolders:", error);
          messageApi.error('Failed to load subfolder list.');
          setSubfolders([]); // 清空
        } finally {
          setSubfolderLoading(false);
        }
      } else {
         setSubfolders([]); // 如果没有根域名，清空子文件夹
      }

      // 8. 合并 (现在包含从 state 加载的 subfolders)
      const mergedDomains = [
        ...verifiedDomainsList,
        // 使用 state 中的 subfolders
        ...loadedSubfolders.map(subfolder => `${rootDomain}/${subfolder}`)
      ];

      setVerifiedDomains(mergedDomains);

      // 9. 设置默认选中项
      if (mergedDomains.length > 0) {
        // 尝试保持之前的选择，否则选第一个
        if (!selectedPublishUrl || !mergedDomains.includes(selectedPublishUrl)) {
           setSelectedPublishUrl(mergedDomains[0]);
        }
      } else {
        setSelectedPublishUrl('');
      }

    } catch (error) {
      console.error("Error loading verified domains in modal:", error);
      setVerifiedDomains([]);
      setSelectedPublishUrl('');
      messageApi.error('Failed to load domain information.');
    } finally {
      setDomainLoading(false);
    }
  };

  // === 当 Modal 打开时，加载数据 ===
  useEffect(() => {
    // 打印所有传入的 props
    console.log('PublishSettingsModal Props:', {
      open,
      onClose,
      apiClient,
      messageApi,
      currentItem,
      currentProductInfo,
      currentCustomerId,
      onPublishSuccess,
      onDomainChange,
    });

    if (open) {
      // 使用传入的 productInfo 初始化
      setCurrentProductInfo(initialProductInfo);
      // 设置初始 slug
      setSlugInput(currentItem?.slug || '');
      // 重置状态
      setVerificationStatus('idle');
      setDomainToVerify('');
      setTxtRecord(null);
      setVerificationError(null);
      setSlugEditing(false);
      // 加载域名等信息
      loadData();
      // 重置 subfolder 相关状态
      setSubfolders([]);
      setSubfolderLoading(false);
      setShowAddSubfolderModal(false);
      setNewSubfolderInput('');
      setIsAddingSubfolder(false);
    } else {
       // 关闭时重置状态，避免下次打开残留
       setSelectedPublishUrl('');
       setVerifiedDomains([]);
       setDomainLoading(false);
       setCurrentProductInfo(null);
    }
  }, [open, currentItem, initialProductInfo]); // 依赖 open, currentItem 和 initialProductInfo

  // === 域名验证相关函数 (从 result-preview.js 移动过来) ===
  const handleAddDomain = async () => {
    if (!domainToVerify || !currentProductInfo || !currentCustomerId) {
      messageApi.error('Please enter a domain name and ensure product info and customer ID are available.');
      return;
    }
    setVerificationLoading(true);
    setVerificationError(null);
    setTxtRecord(null);
    setVerificationStatus('pending_txt');

    try {
      // 1. 更新产品信息中的 projectWebsite (如果需要)
      const updatePayload = {
        productId: currentProductInfo.productId,
        productName: currentProductInfo.productName,
        website: domainToVerify,
        coreFeatures: currentProductInfo.productDesc, // 确保这些字段存在
        competitors: currentProductInfo.competitors, // 确保这些字段存在
        domainStatus: true
      };
      // 先尝试更新产品信息
      try {
        const updateRes = await apiClient.updateProduct(currentProductInfo.productId, updatePayload);
        if (updateRes?.code !== 200) {
          console.warn('Failed to update product with domain before adding, but proceeding.');
        } else {
           // 更新成功后，同步本地 state (虽然很快会通过 onDomainChange 刷新，但先更新)
           setCurrentProductInfo(prev => ({ ...prev, projectWebsite: domainToVerify, domainStatus: true }));
        }
      } catch (updateError) {
         console.error("Error updating product before adding domain:", updateError);
         // 即使更新失败，也尝试继续添加域名
      }


      // 2. 调用 API 添加域名并获取 TXT 记录
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
      // 考虑是否需要回滚产品信息更新 (如果之前更新了)
      // await apiClient.updateProduct(...);
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
        const verifiedDomainName = domainToVerify; // 暂存一下，因为下面会清空
        setDomainToVerify('');
        setTxtRecord(null);

        // 1. 先通知父组件刷新
        onDomainChange();

        // 2. 尝试自动添加 'alternative-pages' subfolder
        try {
          console.log("Attempting to auto-add 'alternative-pages' subfolder...");
          // 获取当前 subfolders
          const subfolderResp = await apiClient.getSubfolders();
          let currentSubfolders = [];
          if (subfolderResp?.code === 200 && Array.isArray(subfolderResp.data)) {
            currentSubfolders = subfolderResp.data;
          } else {
            console.warn("Could not fetch current subfolders before auto-add:", subfolderResp);
            // 如果获取失败，可以根据需要决定是否继续尝试添加
            // 这里我们假设如果获取失败，就认为它不存在并尝试添加
          }

          const defaultSubfolder = 'alternative-pages';
          if (!currentSubfolders.some(sf => sf.toLowerCase() === defaultSubfolder)) {
            console.log(`'${defaultSubfolder}' not found, attempting to add.`);
            const updatedList = [...currentSubfolders, defaultSubfolder];
            const addSubfolderResp = await apiClient.updateSubfolders(updatedList);

            if (addSubfolderResp?.code === 200) {
              messageApi.info(`Default subfolder '${defaultSubfolder}' added automatically.`);
              // === 新增：自动选中新添加的 subfolder ===
              const newSubfolderUrl = `${verifiedDomainName}/${defaultSubfolder}`;
              // 确保 verifiedDomains 列表在 loadData 更新后会包含这个 URL
              // 直接设置选中状态，依赖 loadData 更新 verifiedDomains 列表
              setSelectedPublishUrl(newSubfolderUrl);
              // 注意：loadData 是异步的，这里设置后，UI 可能稍后才更新下拉框选项
              // 但由于 onDomainChange() 已触发 loadData，最终状态应该是正确的
              // === 结束新增部分 ===
            } else {
              // 自动添加失败，只在控制台记录错误，避免过多打扰用户
              console.error("Error auto-adding default subfolder:", addSubfolderResp);
              messageApi.warning(`Could not automatically add the '${defaultSubfolder}' subfolder. You may need to add it manually.`);
            }
          } else {
            console.log(`Default subfolder '${defaultSubfolder}' already exists.`);
            // === 新增：如果已存在，也尝试选中它 ===
            const existingSubfolderUrl = `${verifiedDomainName}/${defaultSubfolder}`;
            // 检查当前 verifiedDomains 是否已包含它 (可能 loadData 还未完成)
            // 仍然尝试设置，依赖 loadData 更新列表
            setSelectedPublishUrl(existingSubfolderUrl);
            // === 结束新增部分 ===
          }
        } catch (subfolderError) {
          // 自动添加过程中发生异常
          console.error("Error during auto-add subfolder process:", subfolderError);
          messageApi.warning(`An error occurred while trying to add the default '${defaultSubfolder}' subfolder.`);
        }
        // --- 自动添加逻辑结束 ---

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

  // === 删除域名绑定相关函数 ===
  const handleDeleteDomainVerification = () => {
    // === 修改：使用 modal.confirm ===
    modal.confirm({
      title: <span className="text-red-400">Confirm Domain Binding Removal</span>,
      icon: <ExclamationCircleOutlined style={{ color: '#f87171' }} />,
      content: (
        <div>
          Are you sure you want to remove the domain binding for {currentProductInfo?.projectWebsite}?
          <br/>This action might affect your published pages using this domain.
        </div>
      ),
      okText: 'Confirm Removal',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      // okButtonProps: { loading: isDeletingVerification }, // modal.confirm 会自动处理按钮 loading
      // cancelButtonProps: { disabled: isDeletingVerification },
      onOk: async () => {
        // 调用执行删除的函数
        await executeDeleteDomainVerification();
      },
    });
    // setDeleteDomainConfirmOpen(true); // 移除旧逻辑
  };

  const executeDeleteDomainVerification = async () => {
    if (!currentProductInfo) {
      messageApi.error('Product information not available.');
      // setDeleteDomainConfirmOpen(false); // 移除旧逻辑
      return;
    }
    setIsDeletingVerification(true); // 仍然需要这个来控制触发按钮的 loading 状态
    // setDeleteDomainConfirmOpen(false); // 移除旧逻辑
    const payload = {
      productId: currentProductInfo.productId,
      productName: currentProductInfo.productName,
      website: '', // 清空 website
      coreFeatures: currentProductInfo.productDesc,
      competitors: currentProductInfo.competitors,
      domainStatus: false // 标记为未绑定
    };
    try {
      const res = await apiClient.updateProduct(currentProductInfo.productId, payload);
      if (res && res.code === 200) {
        messageApi.success('Domain verification record deleted successfully.');
        setSelectedPublishUrl(''); // 清空选择
        onDomainChange(); // 通知父组件刷新数据
      } else {
        messageApi.error(res?.message || 'Failed to delete domain verification record.');
      }
    } catch (e) {
      messageApi.error(e.message || 'Failed to delete domain verification record.');
    }
    setIsDeletingVerification(false);
  };

  // === 新增 Subfolder 相关函数 ===

  // 加载 Subfolders (现在集成在 loadData 中，但保留独立函数以便复用)
  const loadSubfolders = async () => {
    if (!currentProductInfo?.projectWebsite) {
      setSubfolders([]);
      return;
    }
    setSubfolderLoading(true);
    try {
      const subfolderResp = await apiClient.getSubfolders();
      if (subfolderResp?.code === 200 && Array.isArray(subfolderResp.data)) {
        setSubfolders(subfolderResp.data);
      } else {
        setSubfolders([]);
        // messageApi.error('Failed to load subfolders.'); // 避免重复提示
      }
    } catch (error) {
      console.error("Error loading subfolders:", error);
      messageApi.error('Failed to load subfolder list.');
      setSubfolders([]);
    } finally {
      setSubfolderLoading(false);
    }
  };

  // 打开添加 Subfolder 模态框
  const handleAddSubfolderClick = () => {
    setNewSubfolderInput(''); // 清空输入
    setShowAddSubfolderModal(true);
  };

  // 关闭添加 Subfolder 模态框
  const handleCancelAddSubfolder = () => {
    setShowAddSubfolderModal(false);
  };

  // 确认添加 Subfolder
  const handleOkAddSubfolder = async () => {
    const trimmedInput = newSubfolderInput.trim().toLowerCase();
    if (!trimmedInput) {
      messageApi.warning('Please enter a subfolder name.');
      return;
    }
    // 简单的 slug 格式校验 (可选，根据需求调整)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedInput)) {
       messageApi.error('Subfolder can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.');
       return;
    }

    // 检查重复 (忽略大小写)
    if (subfolders.some(sf => sf.toLowerCase() === trimmedInput)) {
      messageApi.error('This subfolder already exists.');
      return;
    }

    setIsAddingSubfolder(true);
    try {
      const updatedList = [...subfolders, trimmedInput];
      const resp = await apiClient.updateSubfolders(updatedList); // API 需要接收整个列表

      if (resp?.code === 200) {
        messageApi.success('Subfolder added successfully.');
        await loadSubfolders(); // 重新加载列表
        // 重新加载 verifiedDomains 以更新 Select 选项
        await loadData(); // 或者只更新 verifiedDomains 部分
        setShowAddSubfolderModal(false);
      } else {
        messageApi.error(resp?.message || 'Failed to add subfolder.');
      }
    } catch (e) {
      console.error("Error adding subfolder:", e);
      messageApi.error(e.message || 'Failed to add subfolder.');
    } finally {
      setIsAddingSubfolder(false);
    }
  };

  // 点击删除 Subfolder 按钮
  const handleDeleteSubfolderClick = (subfolderToDelete) => {
    // 修改：使用 modal 实例的 confirm 方法
    modal.confirm({
      title: 'Delete Subfolder',
      content: `Are you sure you want to delete the subfolder "${subfolderToDelete}"? This might affect published pages using this path.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      centered: true,
      // onOk 逻辑保持不变
      onOk: async () => {
        try {
          const filteredList = subfolders.filter(sf => sf !== subfolderToDelete);
          const resp = await apiClient.updateSubfolders(filteredList); // API 需要接收过滤后的列表

          if (resp?.code === 200) {
            messageApi.success('Subfolder deleted successfully.');
            await loadSubfolders(); // 重新加载列表
             // 重新加载 verifiedDomains 以更新 Select 选项
            await loadData(); // 或者只更新 verifiedDomains 部分

            // 如果删除的是当前选中的 URL，则清空选择
            const deletedUrl = `${currentProductInfo?.projectWebsite}/${subfolderToDelete}`;
            if (selectedPublishUrl === deletedUrl) {
              setSelectedPublishUrl('');
            }
          } else {
            messageApi.error(resp?.message || 'Failed to delete subfolder.');
          }
        } catch (e) {
          console.error("Error deleting subfolder:", e);
          messageApi.error(e.message || 'Failed to delete subfolder.');
        }
      },
      // 注意：这里的 style/bodyStyle 可能仍然需要，取决于你的全局 antd 配置
      // 如果你的 App 或 ConfigProvider 配置了深色主题，useModal 应该能自动适配
      // 如果仍然有问题，可以尝试在这里添加样式覆盖
      // className: 'your-custom-confirm-modal-class', // 可以添加自定义类名来覆盖样式
      // style: { background: '#1e293b', color: 'white' }, // 最后的手段
      // bodyStyle: { background: '#1e293b' },
    });
  };

  // === 发布函数 ===
  const handlePublish = async () => {
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
          currentItem.resultId, // 使用传入的 currentItem
          'publish',
          selectedPublishUrl,
          slugInput
        );
        if (resp?.code === 200) {
          messageApi.success('Published successfully!');
          onPublishSuccess(); // 调用成功回调
          onClose(); // 关闭弹窗
        } else {
          messageApi.error(resp?.message || 'Publish failed');
        }
      } catch (e) {
        messageApi.error(e.message || 'Publish failed');
      } finally {
        setDeployLoading(false); 
      }
  };

  // === Slug 保存函数 ===
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


  return (
    // 确保你的应用根组件被 <App> 包裹，或者至少 PublishSettingsModal 的某个祖先被 <App> 包裹
    // <App>
    <Modal
      open={open}
      onCancel={onClose}
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
      destroyOnClose // 确保每次打开都是新的状态，除非依赖项控制加载
      closeIcon={<CloseOutlined style={{ color: 'white', fontSize: '16px' }} />}
    >
      {/* 确保 currentItem 加载完成 */}
      {currentItem ? (
        <div className="text-gray-200">
          {/* Domain Section */}
          <Spin spinning={domainLoading} tip={<span className="text-gray-300">Loading domains...</span>}>
            <div className="mb-5 pb-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Domain Binding</h3>
              {verifiedDomains.length > 0 ? (
                <div className="space-y-3">
                  {currentProductInfo?.projectWebsite && (
                    <div className="mb-3 p-2 bg-slate-700/50 rounded border border-slate-600 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-300">Currently Bound Root Domain: </span>
                        <span className="text-sm font-semibold text-cyan-300">{currentProductInfo.projectWebsite}</span>
                      </div>
                      {currentProductInfo?.domainStatus && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={handleDeleteDomainVerification}
                          loading={isDeletingVerification}
                          className="text-red-400 hover:text-red-300 flex-shrink-0 ml-2"
                        >
                          Remove Domain Binding
                        </Button>
                      )}
                    </div>
                  )}
                  {/* === Subfolder 管理 UI (移除 publishMode 条件) === */}
                  {currentProductInfo?.projectWebsite && ( // 只依赖根域名是否存在
                    <Spin spinning={subfolderLoading} tip={<span className="text-gray-300">Loading subfolders...</span>}>
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-semibold text-white">Manage Subfolders</h4>
                          <Button
                            type="primary"
                            size="small"
                            onClick={handleAddSubfolderClick}
                            className="bg-cyan-600 hover:bg-cyan-500 border-none text-white text-xs"
                            icon={<PlusOutlined />}
                          >
                            Add Subfolder
                          </Button>
                        </div>
                        {subfolders.length > 0 ? (
                          <ul className="space-y-2 max-h-40 overflow-y-auto bg-slate-800/50 p-3 rounded border border-slate-700/50">
                            {subfolders.map(sf => (
                              <li key={sf} className="flex items-center justify-between text-sm bg-slate-700/70 px-3 py-1.5 rounded">
                                <span className="text-gray-200 break-all mr-2">
                                  {currentProductInfo.projectWebsite}/<span className="font-semibold text-cyan-300">{sf}</span>
                                </span>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteSubfolderClick(sf)}
                                  className="text-red-400 hover:text-red-300 flex-shrink-0"
                                  // loading={deletingSubfolder === sf} // 如果需要精细 loading
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic text-center py-2">No subfolders added yet.</p>
                        )}
                      </div>
                    </Spin>
                  )}
                  {/* === 结束 Subfolder 管理 UI === */}

                  <label htmlFor="publish-url-select" className="block text-sm font-medium text-gray-300 mt-4">Select the URL you want to publish this page to:</label>
                  <Select
                    id="publish-url-select"
                    value={selectedPublishUrl}
                    onChange={(value) => setSelectedPublishUrl(value)}
                    className="w-full domain-select-override"
                    placeholder="Select a domain or subfolder"
                    dropdownStyle={{ background: '#2a3a50', border: '1px solid #475569' }}
                  >
                    {/* 根据 publishMode 过滤选项 (这里暂时显示全部，后续可加逻辑) */}
                    {verifiedDomains.map(url => (
                      <Select.Option
                        key={url}
                        value={url}
                        className="domain-select-option-override"
                      >
                        <span>{url}</span>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              ) : (
                // 无域名：显示验证流程
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
                        disabled={verificationLoading || !currentProductInfo} // 如果没有产品信息也禁用
                      />
                      <Button
                        type="primary"
                        onClick={handleAddDomain}
                        loading={verificationLoading}
                        disabled={!domainToVerify || verificationLoading || !currentProductInfo || !currentCustomerId}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-semibold"
                      >
                        Get TXT Record
                      </Button>
                       {!currentProductInfo && <p className="text-yellow-400 text-xs mt-1">Product information is not loaded, cannot add domain.</p>}
                    </div>
                  )}
                  {(verificationStatus === 'pending_txt' || verificationStatus === 'verifying') && txtRecord && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300">Add the following TXT record to your domain's DNS settings.</p>
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
                       <p className="text-red-400 text-sm">{verificationError || 'Verification process failed.'}</p>
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

          {/* Slug Section */}
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white mb-3">Page Slug</h3>
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
                      setSlugInput(currentItem?.slug || ''); // 恢复原始 slug
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

          {/* Publish Button and Preview URL */}
          {verifiedDomains.length > 0 && (
            <div className="mt-4 pt-4 flex flex-col gap-3 border-t border-slate-700">
               {selectedPublishUrl && slugInput && (
                <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                  <div className="text-sm font-semibold text-cyan-300 mb-1">Publish Preview URL</div>
                  <div className="text-cyan-400 underline break-all hover:text-cyan-300 transition cursor-default text-sm">
                    {/* 注意: Vercel 部署可能需要时间，这里显示的是预期 URL */}
                    {`https://${selectedPublishUrl}/${slugInput}`}
                  </div>
                </div>
              )}
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
        </div>
      ) : (
         <div className="flex items-center justify-center h-40">
            <Spin tip="Loading item data..." />
         </div>
      )}

      {/* === 新增：渲染 contextHolder === */}
      {/* 它不会渲染任何可见元素，但为 modal 实例提供了上下文 */}
      {contextHolder}

      {/* === 添加 Subfolder 的 Modal (放在主 Modal return 内部的末尾) === */}
      <Modal
        title={<span style={{ color: 'white' }}>Add New Subfolder</span>}
        open={showAddSubfolderModal}
        onOk={handleOkAddSubfolder}
        onCancel={handleCancelAddSubfolder}
        confirmLoading={isAddingSubfolder}
        centered
        // 确保嵌套 modal 样式正确
        styles={{
           body: { background: '#1e293b', padding: '24px', borderRadius: '8px', color: 'white' },
           header: { background: '#1e293b', borderBottom: '1px solid #334155', color: 'white', padding: '16px 24px' },
           content: { background: '#1e293b', padding: 0 },
           footer: { background: '#1e293b', borderTop: '1px solid #334155', paddingTop: '12px', paddingBottom: '12px' },
        }}
        okButtonProps={{ className: 'bg-cyan-600 hover:bg-cyan-500 border-cyan-600' }}
        cancelButtonProps={{ className: 'hover:bg-slate-600' }}
        closeIcon={<CloseOutlined style={{ color: 'white' }} />}
      >
        <div className="space-y-2 py-4">
           <p className="text-sm text-gray-300">Enter the name for the new subfolder (recommended: 'alternative-pages').</p>
           <Input
             placeholder="subfolder-name"
             value={newSubfolderInput}
             onChange={(e) => setNewSubfolderInput(e.target.value)}
             className="bg-slate-700 border-slate-600 text-black placeholder-gray-500 focus:ring-cyan-500 focus:border-cyan-500"
             onPressEnter={handleOkAddSubfolder}
           />
           <p className="text-xs text-gray-400">
             Resulting URL: {currentProductInfo?.projectWebsite}/<span className="font-semibold text-cyan-300">{newSubfolderInput.trim().toLowerCase() || '...'}</span>
           </p>
        </div>
      </Modal>
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

  /* === 移除 Radio.Group 相关样式 === */
  /*
  .publish-mode-radio-group .ant-radio-button-wrapper {
    background-color: #334155 !important;
    border-color: #475569 !important;
    color: #cbd5e1 !important;
    box-shadow: none !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper:hover {
    background-color: #475569 !important;
    color: #e2e8f0 !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
    background-color: #0ea5e9 !important;
    border-color: #0284c7 !important;
    color: #ffffff !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
     background-color: #0369a1 !important;
     border-color: #075985 !important;
  }
  .publish-mode-radio-group .ant-radio-button-wrapper:not(:first-child)::before {
    width: 0;
  }
  */
`}</style>