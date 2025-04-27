import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Input, Button, Tag, Spin, Typography, message, notification, Alert, Space } from 'antd';
import { ExclamationCircleFilled, InfoCircleOutlined, CopyOutlined } from '@ant-design/icons';
import apiClient from '../../lib/api/index.js'; // 确认 apiClient 的路径是否正确

const { Text, Paragraph } = Typography;

const DomainBindingModal = ({
  visible,
  onClose,
  productInfo, // 传入当前产品信息，包含域名和验证状态
  customerId,  // 传入当前用户ID
  onVerified,  // 验证成功后的回调函数
  onError,     // 发生错误时的回调函数
  // onDomainUpdated // 可选：如果需要在模态框内直接更新域名信息，添加此回调
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // 通用加载状态
  const [startVerifying, setStartVerifying] = useState(false); // 获取TXT记录加载状态
  const [verifying, setVerifying] = useState(false); // 验证域名加载状态
  const [showVerifyRecord, setShowVerifyRecord] = useState(false);
  const [verifyRecord, setVerifyRecord] = useState(null);
  const [currentDomainStatus, setCurrentDomainStatus] = useState(false);
  const [originalWebsite, setOriginalWebsite] = useState('');
  const [domainName, setDomainName] = useState('');
  const [error, setError] = useState(null);
  const [txtRecord, setTxtRecord] = useState(null); // 用于存储 { name, type, value }
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, pending_txt, verifying, verified, failed

  // 初始化表单和状态
  useEffect(() => {
    if (visible && productInfo) {
      const website = productInfo.projectWebsite?.replace(/^https?:\/\//, '') || '';
      form.setFieldsValue({ website });
      setOriginalWebsite(website);
      setCurrentDomainStatus(productInfo.domainStatus || false);
      // 如果域名已存在但未验证，尝试获取验证记录
      if (website && !productInfo.domainStatus) {
        checkExistingVerification(website);
      } else {
        // 重置验证状态
        setShowVerifyRecord(false);
        setVerifyRecord(null);
      }
    } else if (!visible) {
      // 关闭时重置状态
      form.resetFields();
      setLoading(false);
      setStartVerifying(false);
      setVerifying(false);
      setShowVerifyRecord(false);
      setVerifyRecord(null);
      setCurrentDomainStatus(false);
      setOriginalWebsite('');
    }
  }, [visible, productInfo, form]);

  // 检查当前域名是否已有验证记录
  const checkExistingVerification = useCallback(async (domain) => {
    if (!domain || !customerId) return;
    setStartVerifying(true); // 使用 startVerifying 状态指示检查过程
    try {
      // 注意：API可能需要调整，这里假设 getDomain 可以传入 domain 参数
      // 或者需要一个新的 API 端点来获取特定域名的验证记录
      const response = await apiClient.getDomain({ customerId }); // 可能需要调整 API 调用方式

      // 假设 API 返回的数据结构与 Vue 示例类似
      // 需要根据实际 API 返回调整逻辑
      if (response?.code === 200 && response.data?.textRecord) {
         // 检查返回的记录是否与当前输入的域名匹配
         const recordData = JSON.parse(response.data.textRecord);
         // 假设 recordData.host 或类似字段包含域名信息
         if (recordData?.host && recordData.host.includes(domain)) {
            setVerifyRecord(recordData);
            setShowVerifyRecord(true);
            setCurrentDomainStatus(false); // 确保状态为未验证
         } else {
            setShowVerifyRecord(false);
            setVerifyRecord(null);
         }
      } else {
        setShowVerifyRecord(false);
        setVerifyRecord(null);
      }
    } catch (error) {
      console.error('Failed to check existing domain verification:', error);
      setShowVerifyRecord(false);
      setVerifyRecord(null);
      // 不提示错误，因为这只是尝试性检查
    } finally {
      setStartVerifying(false);
    }
  }, [customerId]);


  // 处理网址输入变化
  const handleWebsiteChange = (e) => {
    const newWebsite = e.target.value.trim();
    // 如果域名改变，重置验证状态
    if (newWebsite !== originalWebsite) {
      setCurrentDomainStatus(false);
      setShowVerifyRecord(false);
      setVerifyRecord(null);
    } else {
      // 如果改回原域名，恢复原始状态
      setCurrentDomainStatus(productInfo?.domainStatus || false);
      // 如果原域名未验证，尝试重新检查验证记录
      if (!productInfo?.domainStatus) {
         checkExistingVerification(newWebsite);
      } else {
         setShowVerifyRecord(false);
         setVerifyRecord(null);
      }
    }
  };

  // 开始验证（获取TXT记录）
  const handleStartVerify = async () => {
    // 简单的域名格式校验 (可选，但推荐)
    if (!domainName || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainName)) {
      setError('Please enter a valid domain name.');
      return;
    }
    if (!customerId) {
      setError('Missing required information (customer ID). Cannot proceed.');
      console.error("Missing IDs:", { customerId });
      return;
    }

    setLoading(true);
    setError(null);
    setTxtRecord(null);
    setVerificationStatus('pending_txt'); // 更新状态，表示正在请求 TXT 记录

    try {
      // 调用后端 API 创建域名并获取 TXT 记录
      const response = await apiClient.createDomainWithTXT({
        domainName: domainName,
        customerId: customerId,
      });

      // 检查 API 响应
      if (response?.code === 10042) {
        // 特定错误：域名已被占用
        const errorMsg = response.message || 'This domain is already taken. Please choose another domain.';
        setError(errorMsg);
        setVerificationStatus('failed'); // 标记为失败状态
        onError?.(new Error(errorMsg));
      } else if (response?.code === 200 && response.data?.txt) {
        // 成功获取 TXT 记录信息
        try {
          const parsedTxt = JSON.parse(response.data.txt);
          if (parsedTxt?.host && parsedTxt?.value) {
            // 存储 TXT 记录 { name, type, value }
            setTxtRecord({
              name: parsedTxt.host, // 使用 host 作为 name
              value: parsedTxt.value,
              type: 'TXT' // 类型固定为 TXT
            });
            message.info('Please add the following TXT record to your DNS settings.');
            // 保持 loading=false, verificationStatus='pending_txt' 等待用户操作
          } else {
            // 解析成功但缺少 host 或 value
            throw new Error('Invalid TXT record format received from server.');
          }
        } catch (parseError) {
          // JSON 解析失败
          console.error("Error parsing TXT record JSON:", parseError, response.data.txt);
          const errorMsg = 'Received invalid verification data from the server.';
          setError(errorMsg);
          setVerificationStatus('failed');
          onError?.(new Error(errorMsg));
        }
      } else {
        // 其他 API 错误 (非 200 或 10042，或缺少 data.txt)
        const errorMsg = response?.message || 'Failed to get TXT record. Please try again.';
        setError(errorMsg);
        setVerificationStatus('failed'); // 标记为失败状态
        onError?.(new Error(errorMsg));
      }
    } catch (err) {
      // API 调用本身失败 (网络错误等)
      console.error("Error calling createDomainWithTXT:", err);
      // 检查是否是 Error 对象，避免直接显示 [object Object]
      const errorMsg = err instanceof Error ? err.message : (err.response?.data?.message || 'An error occurred while trying to start verification.');
      setError(errorMsg);
      setVerificationStatus('failed'); // 标记为失败状态
      onError?.(err); // 通知父组件错误
    } finally {
      // 请求完成后（无论成功或失败）停止 loading
      setLoading(false);
    }
  };

  // 立即验证（检查DNS记录）
  const handleVerifyNow = async () => {
    const website = form.getFieldValue('website');
    if (!website || !customerId) return;

    setVerifying(true);
    setLoading(true);
    try {
      // 调用API验证DNS记录 - 需要确认API端点和参数
      // 假设 verifyDomain API 用于此目的
      const response = await apiClient.verifyDomain({ // 替换为实际的API调用
        customerId,
        domain: website,
      });

      if (response?.code === 200 && response.data?.domainStatus === true) {
        setCurrentDomainStatus(true);
        setShowVerifyRecord(false); // 验证成功后隐藏记录
        notification.success({
          message: 'Domain Verified!',
          description: `Successfully verified ${website}.`,
        });
        if (onVerified) onVerified(website); // 回调通知父组件
        // 可选：如果需要在模态框内直接更新，可以在这里调用 onDomainUpdated
        // onClose(); // 验证成功后可以关闭模态框
      } else {
         // 即便 code 是 200，也可能验证未通过
         const errorMsg = response?.data?.message || response?.msg || 'Verification failed. Please ensure the TXT record is correctly set and has propagated (this may take some time).';
         throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      notification.error({
        message: 'Verification Failed',
        description: error.message || 'Could not verify the domain. Please check the TXT record and try again.',
      });
       setCurrentDomainStatus(false); // 确保状态仍为未验证
      if (onError) onError(error);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  // 辅助函数：格式化 Host 值
  const getHostValue = (type) => {
      const host = verifyRecord?.host || '_';
      const domain = form.getFieldValue('website') || '';
      if (type === 'full') {
          return host;
      }
      if (type === 'short' && domain && host.endsWith('.' + domain)) {
          return host.split('.' + domain)[0];
      }
      // 如果域名为空或 host 不包含域名，返回原始 host 或 '_'
      return host === '_' ? '_' : host.split('.')[0]; // 尝试返回第一部分
  };

  // 检查验证状态的函数
  const handleCheckVerification = async () => {
    // 确保 domainName 和 customerId 存在
    if (!domainName || !customerId) {
      setError('Missing domain name or customer ID.');
      message.error('Missing domain name or customer ID.');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationStatus('verifying');
    message.loading({ content: 'Verifying DNS record...', key: 'verifying' });

    try {
      // 调用后端 API 验证域名 TXT 记录
      const response = await apiClient.validateDomain({
        customerId: customerId,
        // 注意：确认 validateDomain 是否需要 domainName 参数
        // 如果需要，添加 domainName: domainName
      });

      if (response?.code === 200) {
        // 验证成功
        message.success({ content: 'Domain verified successfully!', key: 'verifying' });
        setVerificationStatus('verified');
        onVerified?.(domainName); // 通知父组件验证成功
        // 验证成功后通常会关闭模态框，或者显示成功状态让用户手动关闭
        // onClose(); // 根据需要决定是否在此处关闭

        // 可以添加一个 notification 提示用户后续操作，如果需要的话
        // notification.info({
        //   message: 'Domain Verified',
        //   description: 'Your domain ownership has been successfully verified.',
        // });

      } else {
        // 验证失败 (API 返回非 200 code 或其他错误状态)
        const errorMsg = response?.message || 'Verification failed. Please double-check the TXT record and wait a few minutes for DNS propagation.';
        message.error({ content: errorMsg, key: 'verifying', duration: 5 });
        setError(errorMsg);
        setVerificationStatus('pending_txt'); // 回到等待 TXT 状态
      }

    } catch (err) {
      // API 调用本身失败 (网络错误等)
      console.error("Error checking verification:", err);
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred during verification.';
      message.error({ content: errorMsg, key: 'verifying', duration: 5 });
      setError(errorMsg);
      setVerificationStatus('pending_txt'); // 回到等待 TXT 状态
      onError?.(err); // 通知父组件错误
    } finally {
      setLoading(false);
    }
  };

  // 渲染不同状态下的内容
  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending_txt':
      case 'verifying': // 在验证中也显示 TXT 记录
        if (txtRecord) {
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>Please add the following TXT record to your domain's DNS settings. This may take a few minutes to propagate.</Paragraph>
              <Text strong>Record Type:</Text>
              <Text code>TXT</Text>
              <Text strong>Name/Host:</Text>
              <Text code copyable={{ tooltips: ['Copy', 'Copied!'] }}>{txtRecord.name}</Text>
              <Text strong>Value/Content:</Text>
              <Text code copyable={{ tooltips: ['Copy', 'Copied!'] }}>{txtRecord.value}</Text>
              <Paragraph type="secondary">Once added, click the button below to verify. DNS changes can sometimes take time to update globally.</Paragraph>
            </Space>
          );
        }
        // 如果 txtRecord 还未加载出来（理论上很快），可以显示一个加载提示
        return <Spin tip="Fetching TXT record..." />;
      case 'failed':
        return <Paragraph type="danger">Verification process failed. Please check the error message above, correct the domain name if necessary, and try again.</Paragraph>;
      case 'verified':
        return <Paragraph type="success">Domain verified successfully!</Paragraph>;
      case 'idle':
      default:
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>Enter the domain name you want to associate with your site (e.g., mydomain.com).</Paragraph>
            <Input
              placeholder="example.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value.trim())} // 去除前后空格
              disabled={loading}
              onPressEnter={handleStartVerify} // 支持回车触发
            />
          </Space>
        );
    }
  };

  // 根据状态决定底部按钮
  const renderFooter = () => {
    switch (verificationStatus) {
      case 'pending_txt':
        return [
          <Button key="back" onClick={onClose} disabled={loading}>
            Cancel
          </Button>,
          <Button key="verify" type="primary" loading={loading} onClick={handleCheckVerification}>
            Verify DNS Record
          </Button>,
        ];
      case 'verifying':
        return [
          <Button key="back" onClick={onClose} disabled={true}>
            Cancel
          </Button>,
          <Button key="verify" type="primary" loading={true} disabled={true}>
            Verifying...
          </Button>,
        ];
      case 'failed':
        return [
          <Button key="back" onClick={onClose}>
            Close
          </Button>,
          <Button key="retry" type="primary" onClick={() => setVerificationStatus('idle')} >
            Try Again
          </Button>,
        ];
      case 'verified':
        return [
          <Button key="close" type="primary" onClick={onClose}>
            Done
          </Button>,
        ];
      case 'idle':
      default:
        return [
          <Button key="back" onClick={onClose} disabled={loading}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleStartVerify}
            disabled={!domainName || loading} // 确保域名不为空
          >
            Start Verification
          </Button>,
        ];
    }
  };

  return (
    <Modal
      title="Verify Domain Ownership"
      open={visible}
      onCancel={onClose}
      footer={renderFooter()} // 使用动态渲染的 footer
      maskClosable={!loading} // 加载时不允许点击遮罩层关闭
      closable={!loading} // 加载时不允许点击关闭按钮
    >
      <Spin spinning={loading && verificationStatus !== 'pending_txt' && verificationStatus !== 'verifying'} tip={verificationStatus === 'verifying' ? "Verifying..." : "Processing..."}> {/* 调整 Spin 的显示逻辑 */}
        {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}
        {renderContent()}
      </Spin>
    </Modal>
  );
};

export default DomainBindingModal; 