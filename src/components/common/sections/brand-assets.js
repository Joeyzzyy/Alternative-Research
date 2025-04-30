import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../../../lib/api/index.js'; // 确保 apiClient 已导入
import { message, Popover } from 'antd';
import { ChromePicker } from 'react-color'; // 1. 引入 react-color

// 默认颜色值，更新为白绿主题
const defaultBrandColors = {
  brandId: null, // 新增：用于存储 brandId
  primary_color: "#FFFFFF", // White background
  secondary_color: "#4CAF50", // Green accent
  header_background_color: "#FFFFFF", // White header
  header_link_color: "#1B5E20", // Dark Green header links
  footer_background_color: "#F5F5F5", // Light Gray footer
  footer_text_color: "#1B5E20", // Dark Green footer text
  button_background_color: "#4CAF50", // Green button
  button_text_color: "#FFFFFF", // White button text
  color_summary: "A clean and fresh theme with a white primary background, accented by vibrant green. Buttons are prominent with a green background and white text, conveying growth and nature."
};

// 定义颜色配置项的标签和顺序
const colorConfigs = [
  { key: 'primary_color', label: 'Primary' },
  { key: 'secondary_color', label: 'Secondary' },
  { key: 'header_background_color', label: 'Header BG' },
  { key: 'header_link_color', label: 'Header Link' },
  { key: 'footer_background_color', label: 'Footer BG' },
  { key: 'footer_text_color', label: 'Footer Text' },
  { key: 'button_background_color', label: 'Button BG' },
  { key: 'button_text_color', label: 'Button Text' },
];

// 2. 修改 Popover 内容组件
const HexInputPopoverContent = ({ colorKey, brandColors, handleColorChange }) => {
  const popoverContentRef = useRef(null); // 1. 添加 ref

  const handlePickerChangeComplete = (color) => {
    // 调用修改后的 handleColorChange，传入包含 name 和 value 的对象
    handleColorChange({ name: colorKey, value: color.hex });
  };

  const handleInputChange = (e) => {
    // HEX 输入框的变化仍然通过标准事件处理
    handleColorChange(e);
  };

  // 2. 添加 useEffect 处理滚动事件
  useEffect(() => {
    const node = popoverContentRef.current;
    if (!node) return;

    const handleWheel = (event) => {
      // 阻止滚动事件冒泡到父级元素（如页面）
      event.stopPropagation();
    };

    node.addEventListener('wheel', handleWheel, { passive: true }); // 使用 passive: true 提高性能

    // 清理函数：移除事件监听器
    return () => {
      node.removeEventListener('wheel', handleWheel);
    };
  }, []); // 空依赖数组，仅在挂载和卸载时运行

  return (
    // 3. 添加带 ref 和 padding 的包装 div
    <div ref={popoverContentRef} className="p-3">
      <div className="flex flex-col space-y-3">
        {/* ChromePicker 组件 */}
        <ChromePicker
          color={brandColors[colorKey] || '#ffffff'}
          onChangeComplete={handlePickerChangeComplete}
          disableAlpha // 通常不需要 Alpha 通道
          styles={{ default: { picker: { boxShadow: 'none', background: 'transparent', fontFamily: 'inherit' } } }} // 调整样式以适应 Popover
        />
        {/* HEX 输入框 */}
        <div className="flex items-center space-x-2 px-1">
           <span className="text-xs text-gray-400 font-mono">HEX:</span>
           <input
             type="text"
             name={colorKey}
             value={brandColors[colorKey] || ''}
             onChange={handleInputChange}
             onClick={(e) => e.stopPropagation()} // 防止点击输入框关闭 Popover
             className="flex-grow px-2 py-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-white text-xs font-mono"
             placeholder="#RRGGBB"
             aria-label={`HEX value for ${colorKey}`}
           />
        </div>
      </div>
    </div>
  );
};

const BrandAssetsModal = ({ showBrandAssetsModal, setShowBrandAssetsModal, onSaveSuccess }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [brandColors, setBrandColors] = useState(defaultBrandColors);
  const [loading, setLoading] = useState(false); // 用于加载初始数据
  const [saving, setSaving] = useState(false); // 用于保存操作
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false); // 1. 添加状态标记是否需要创建
  // 3. 移除 colorInputRefs 和 triggerColorInput
  // const colorInputRefs = useRef({});
  const [activeColorInputKey, setActiveColorInputKey] = useState(null);

  // 映射 API 响应键到状态键
  const mapApiToStateKeys = (apiData) => {
    if (!apiData) return {};
    return {
      brandId: apiData.brandId, // 确保映射 brandId
      primary_color: apiData.primaryColor,
      secondary_color: apiData.secondaryColor,
      header_background_color: apiData.headerBackgroundColor,
      header_link_color: apiData.headerLinkColor,
      footer_background_color: apiData.footerBackgroundColor,
      footer_text_color: apiData.footerTextColor,
      button_background_color: apiData.buttonBackgroundColor,
      button_text_color: apiData.buttonTextColor,
      color_summary: apiData.colorSummary,
    };
  };

  // 新增：映射状态键到 API 请求体键
  const mapStateToApiKeys = (stateData, includeBrandId = true) => { // 添加 includeBrandId 参数
    if (!stateData) return {};
    const payload = {
      primaryColor: stateData.primary_color,
      secondaryColor: stateData.secondary_color,
      headerBackgroundColor: stateData.header_background_color,
      headerLinkColor: stateData.header_link_color,
      footerBackgroundColor: stateData.footer_background_color,
      footerTextColor: stateData.footer_text_color,
      buttonBackgroundColor: stateData.button_background_color,
      buttonTextColor: stateData.button_text_color,
      colorSummary: stateData.color_summary,
    };
    // 仅在需要时（更新操作）包含 brandId
    if (includeBrandId && stateData.brandId) {
      payload.brandId = stateData.brandId;
    }
    // customerId 通常由后端处理，不需要前端发送
    return payload;
  };

  // 获取当前品牌设置
  const fetchBrandAssets = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    setIsCreatingNew(false); // 2. 默认不是创建新记录
    try {
      console.log("Fetching brand assets via API...");
      const response = await apiClient.getBrandAssets();
      console.log("API Response:", response);

      // 检查是否收到 "No matching records found" 响应
      if (response && response.code === 1021) {
        console.log("API returned code 1021 (No matching records found), using defaults. Will create on save.");
        setBrandColors(defaultBrandColors);
        setIsCreatingNew(true); // 2. 设置标记，表示需要创建
      } else if (response && response.data) { // 确保 response.data 存在
        // 映射 API 返回的数据键到状态键
        const mappedData = mapApiToStateKeys(response.data); // 从 response.data 获取数据
        // 过滤掉值为 undefined 的键
        const filteredMappedData = Object.entries(mappedData).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {});

        // 合并默认值、过滤后的映射数据
        const newState = { ...defaultBrandColors, ...filteredMappedData };
        setBrandColors(newState);
        setIsCreatingNew(!newState.brandId); // 2. 如果没有 brandId，也视为创建
        console.log("Fetched and mapped brand assets:", newState);
      } else {
        // 如果 API 调用在 apiClient 层返回 null 或响应格式不符
        console.log("API call failed or returned unexpected data, using defaults. Will create on save.");
        setBrandColors(defaultBrandColors);
        setIsCreatingNew(true); // 2. 加载失败，也标记为创建
      }

    } catch (error) {
      console.error("Failed to fetch brand assets:", error);
      setErrorMessage('Failed to load brand assets. Using defaults.');
      setBrandColors(defaultBrandColors);
      setIsCreatingNew(true); // 2. 出错时也标记为创建
    } finally {
      setLoading(false);
    }
  }, []); // 依赖项保持为空

  // 弹窗显示时获取数据
  useEffect(() => {
    if (showBrandAssetsModal) {
      fetchBrandAssets();
      setActiveColorInputKey(null); // 关闭弹窗时重置 active key
    }
  }, [showBrandAssetsModal, fetchBrandAssets]);

  // 处理错误消息提示
  useEffect(() => {
    if (errorMessage) {
      messageApi.error(errorMessage);
      setErrorMessage(null); // 显示后清除
    }
  }, [errorMessage, messageApi]);

  // 处理成功消息提示
  useEffect(() => {
    if (successMessage) {
      messageApi.success(successMessage);
      setSuccessMessage(null); // 显示后清除
    }
  }, [successMessage, messageApi]);

  // 4. 修改 handleColorChange 以处理两种输入源
  const handleColorChange = (changeSource) => {
    let name, value;

    // 来自标准 input 事件 (e.g., HEX 输入框)
    if (changeSource && changeSource.target && typeof changeSource.target.name !== 'undefined' && typeof changeSource.target.value !== 'undefined') {
      name = changeSource.target.name;
      value = changeSource.target.value;
      // 简单的 HEX 验证 (允许空值或有效 HEX)
      if (changeSource.target.type === 'text' && value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})?$/.test(value)) { // 允许空字符串
        console.warn("Invalid HEX color format entered:", value);
        // 可以选择在这里暂时不更新状态或显示错误
        // return;
      }
    }
    // 来自 react-color (包含 name 和 value 的对象)
    else if (changeSource && typeof changeSource.name === 'string' && typeof changeSource.value === 'string') {
      name = changeSource.name;
      value = changeSource.value;
      // 来自 react-color 的值通常是有效的 HEX
    } else {
      console.error("Invalid change source in handleColorChange:", changeSource);
      return; // 如果来源无法识别，则不处理
    }

    // 只有当 name 和 value 都有效时才更新状态
    if (name && typeof value === 'string') {
       // 实时更新，即使 HEX 输入不完整或无效（允许用户输入）
       // 可以在保存时进行最终验证
       setBrandColors(prev => ({ ...prev, [name]: value }));
    }
  };

  // 处理摘要输入变化
  const handleSummaryChange = (e) => {
    setBrandColors(prev => ({ ...prev, color_summary: e.target.value }));
  };

  // 处理保存
  const handleSave = async () => {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. 验证颜色格式 (保持不变)
    const invalidColorEntry = Object.entries(brandColors).find(([key, value]) =>
      key !== 'color_summary' && key !== 'brandId' && value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) // 排除 brandId 验证
    );

    if (invalidColorEntry) {
      const label = colorConfigs.find(c => c.key === invalidColorEntry[0])?.label || invalidColorEntry[0];
      setErrorMessage(`Invalid HEX format for ${label}: ${invalidColorEntry[1]}`);
      setSaving(false);
      return;
    }

    // 2. 映射状态数据到 API 格式
    // 创建时不包含 brandId，更新时包含
    const apiPayload = mapStateToApiKeys(brandColors, !isCreatingNew);
    console.log(`Saving brand assets (${isCreatingNew ? 'CREATE' : 'UPDATE'}) with payload:`, apiPayload);

    try {
      let response;
      // --- 根据 isCreatingNew 调用不同 API ---
      if (isCreatingNew) {
        console.log("Calling createBrandAssets...");
        response = await apiClient.createBrandAssets(apiPayload);
      } else {
        // 确保有 brandId 用于更新
        if (!brandColors.brandId) {
           throw new Error("Cannot update: Brand ID is missing.");
        }
        console.log(`Calling upsertBrandAssets for brandId: ${brandColors.brandId}...`);
        // 注意：upsertBrandAssets 现在接收 brandId 作为第一个参数
        response = await apiClient.upsertBrandAssets(brandColors.brandId, apiPayload);
      }
      console.log("Save response:", response);
      // --- 结束 API 调用 ---

      // 检查 API 响应是否表示成功
      // 假设成功响应包含数据或特定成功代码/消息
      if (response && (response.data || response.code === 0 || response.message === 'Success')) { // 根据你的 API 实际成功响应调整判断条件
        setSuccessMessage('Brand assets saved successfully!');
        // 3. 保存成功后，刷新数据
        await fetchBrandAssets(); // 调用 fetch 刷新状态，这会重置 isCreatingNew
        if (onSaveSuccess) {
          // 传递最新的状态数据（fetchBrandAssets 之后）
          // 需要从 state 获取最新数据，而不是旧的 brandColors
          // 但 fetchBrandAssets 是异步的，直接用可能不是最新，最好在 fetch 内部或其 .then() 中处理回调
          // 暂时先这样，如果 onSaveSuccess 需要绝对最新数据，需要调整 fetch 逻辑
           onSaveSuccess(brandColors); // 注意：这里 brandColors 可能还不是 fetch 之后最新的
        }
        // 可选：保存成功后关闭模态框
        // setShowBrandAssetsModal(false);
      } else {
        // 处理 API 返回的逻辑错误（非网络/请求错误）
        const apiErrorMsg = response?.message || 'API indicated failure but provided no specific message.';
        throw new Error(`Failed to save brand assets: ${apiErrorMsg}`);
      }

    } catch (error) {
      console.error("Failed to save brand assets:", error);
      const apiError = error.response?.data?.message || error.message || 'An unknown error occurred.';
      setErrorMessage(`Failed to save: ${apiError}`);
    } finally {
      setSaving(false);
    }
  };

  // 辅助函数：判断颜色是否偏亮
  const isColorLight = (hexColor) => {
    if (!hexColor || typeof hexColor !== 'string') return true; // 默认亮色
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    if (hex.length !== 6) return true; // 无效格式按亮色处理

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // 计算亮度 (YIQ 公式)
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 150; // 阈值可调整
  };

  // 防御性渲染
  if (!showBrandAssetsModal) return null;

  // 渲染单个颜色块的函数，避免重复代码
  const renderColorBlock = (key, className) => {
    const config = colorConfigs.find(c => c.key === key) || { label: key };
    const label = config.label;
    const bgColor = brandColors[key] || '#ffffff'; // Default to white if undefined/invalid
    const textColor = isColorLight(bgColor) ? '#1f2937' : '#f9fafb'; // black or white text
    const isSmallBlock = className.includes('h-24'); // 判断是否是小色块

    return (
      <Popover
        key={key}
        content={
          <HexInputPopoverContent
            colorKey={key}
            brandColors={brandColors}
            handleColorChange={handleColorChange}
          />
        }
        title="Edit Color"
        trigger="click"
        placement="right"
        visible={activeColorInputKey === key}
        onVisibleChange={(visible) => {
          if (!visible) setActiveColorInputKey(null);
        }}
        overlayClassName="brand-assets-popover"
        overlayInnerStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', padding: 0 }}
      >
        <div
          onClick={() => setActiveColorInputKey(key)}
          className={`${className} rounded-lg border border-gray-600 cursor-pointer shadow-md hover:border-indigo-400 transition-colors flex flex-col justify-end ${isSmallBlock ? 'p-1.5' : 'p-2'} relative overflow-hidden`}
          style={{ backgroundColor: bgColor }}
          aria-label={`Edit ${label}`}
        >
          <span
            className={`font-medium leading-tight ${isSmallBlock ? 'text-[10px] text-center' : 'text-xs'}`} // 小色块用更小的居中字体
            style={{ color: textColor }}
          >
            {label}
          </span>
        </div>
      </Popover>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="relative w-full max-w-6xl h-[90vh] max-h-[800px] bg-gray-900 rounded-xl shadow-2xl border border-indigo-500/30 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-200">Brand Color Assets</h2>
            <button
              onClick={() => setShowBrandAssetsModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body (Scrollable Content Area) */}
          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <svg className="w-8 h-8 mr-3 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-300">Loading Brand Assets...</span>
            </div>
          ) : (
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto custom-scrollbar">
              {/* Left Column: Inputs */}
              <div className="flex flex-col space-y-6 overflow-y-auto custom-scrollbar pr-3">
                {/* --- Row 1 --- */}
                <div className="flex flex-wrap gap-4 items-start">
                  {renderColorBlock('header_background_color', 'w-40 h-52')}
                  {renderColorBlock('footer_background_color', 'w-40 h-52')}
                  <div className="flex flex-col gap-4"> {/* Vertical stack for small blocks */}
                    {renderColorBlock('header_link_color', 'w-40 h-24')}
                    {renderColorBlock('footer_text_color', 'w-40 h-24')}
                  </div>
                </div>

                {/* --- Row 2 --- */}
                <div className="flex flex-wrap gap-4 items-start">
                  {renderColorBlock('primary_color', 'w-40 h-52')}
                  {renderColorBlock('secondary_color', 'w-40 h-52')}
                   <div className="flex flex-col gap-4"> {/* Vertical stack for small blocks */}
                    {renderColorBlock('button_background_color', 'w-40 h-24')}
                    {renderColorBlock('button_text_color', 'w-40 h-24')}
                  </div>
                </div>

                {/* Color Summary */}
                <hr className="border-gray-700 my-2" />
                <div>
                  <label htmlFor="color_summary" className="block text-sm font-medium text-gray-300 mb-2">
                    Color Summary
                  </label>
                  <textarea
                    id="color_summary"
                    name="color_summary"
                    rows={4}
                    value={brandColors.color_summary || ''}
                    onChange={handleSummaryChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-gray-200 text-sm custom-scrollbar"
                    placeholder="Describe the overall color theme..."
                  />
                </div>
              </div>

              {/* Right Column: Preview */}
              <div className="bg-gray-800 rounded-lg shadow-inner p-1 overflow-hidden flex flex-col min-h-[450px]">
                {/* Header Preview */}
                <div
                  className="h-14 flex items-center justify-between px-6 shadow-sm flex-shrink-0 border-b border-gray-700/30"
                  style={{ backgroundColor: brandColors.header_background_color }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColors.header_link_color }}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" style={{ color: brandColors.header_background_color }}>
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fill="currentColor"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: brandColors.header_link_color }}>YourBrand</span>
                  </div>
                  <nav className="flex space-x-5">
                    {['Home', 'Features', 'Pricing'].map(item => (
                      <a key={item} href="#" className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: brandColors.header_link_color }}>
                        {item}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Body Preview */}
                <div className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar" style={{ backgroundColor: brandColors.primary_color }}>
                   <h4 className="text-2xl font-bold mb-4" style={{ color: brandColors.secondary_color }}>
                     Example Content Area
                   </h4>
                   <p className="text-base leading-relaxed mb-6" style={{ color: isColorLight(brandColors.primary_color) ? '#374151' : '#d1d5db' }}>
                     This section demonstrates how the primary background and secondary accent colors work together. Text contrast adjusts automatically based on the primary color's brightness. Use the controls on the left to customize.
                   </p>

                   {/* Card Example */}
                   <div
                     className="p-4 rounded-lg border mb-8 shadow-md"
                     style={{
                       backgroundColor: isColorLight(brandColors.primary_color) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // Subtle overlay
                       borderColor: brandColors.secondary_color + '40', // Accent color with alpha
                     }}
                   >
                     <h5 className="text-lg font-semibold mb-2" style={{ color: brandColors.secondary_color }}>Card Example</h5>
                     <p className="text-sm" style={{ color: isColorLight(brandColors.primary_color) ? '#4b5563' : '#adb5bd' }}>
                       This card uses subtle background and borders derived from the main theme colors. Content text contrast is adjusted based on the primary background.
                     </p>
                   </div>

                   <div className="text-center my-10">
                     <button
                       type="button"
                       className="px-8 py-3 rounded-lg text-base font-semibold shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                       style={{
                         backgroundColor: brandColors.button_background_color,
                         color: brandColors.button_text_color,
                         borderColor: brandColors.button_background_color,
                         boxShadow: `0 4px 14px 0 ${brandColors.button_background_color}60`,
                         '--tw-ring-color': brandColors.button_background_color
                       }}
                     >
                       Engage Now
                     </button>
                   </div>

                   <p className="text-xs text-center mt-6" style={{ color: isColorLight(brandColors.primary_color) ? '#6B7280' : '#9CA3AF' }}>
                     Further details and information can be placed here.
                   </p>
                </div>

                {/* Footer Preview */}
                <div
                  className="h-16 flex items-center justify-between px-8 border-t border-gray-700/50 flex-shrink-0"
                  style={{ backgroundColor: brandColors.footer_background_color }}
                >
                  <span className="text-sm" style={{ color: brandColors.footer_text_color }}>© 2024 Your Brand Inc.</span>
                  <div className="flex space-x-4">
                     <div className="w-5 h-5 rounded bg-opacity-40" style={{ backgroundColor: brandColors.footer_text_color }}></div>
                     <div className="w-5 h-5 rounded bg-opacity-40" style={{ backgroundColor: brandColors.footer_text_color }}></div>
                     <div className="w-5 h-5 rounded bg-opacity-40" style={{ backgroundColor: brandColors.footer_text_color }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer: Action Button */}
          {!loading && (
            <div className="flex justify-end flex-shrink-0 p-4 border-t border-gray-700">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Brand Color Assets'}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* 添加自定义滚动条样式 */}
      <style jsx global>{`
        .brand-assets-popover .ant-popover-title {
          background-color: #374151; /* gray-700 */
          color: #d1d5db; /* gray-300 */
          border-bottom: 1px solid #4b5563; /* gray-600 */
          font-size: 0.875rem; /* text-sm */
          padding: 8px 12px;
        }
        /* 4. 移除内边距覆盖，让组件内部控制 */
        /* .brand-assets-popover .ant-popover-inner-content {
          padding: 0 !important;
        } */
        .brand-assets-popover .ant-popover-arrow-content {
           background-color: #1f2937; /* gray-800 */
        }
        /* 确保 ChromePicker 内部元素样式协调 */
        .brand-assets-popover .chrome-picker {
            background: transparent !important; /* 使用透明背景，让包装 div 的背景生效 */
            border-radius: 0; /* 移除圆角，因为包装 div 会有 */
            box-shadow: none !important; /* 移除默认阴影 */
        }
        .brand-assets-popover .chrome-picker input {
            background-color: #374151 !important;
            color: #e5e7eb !important;
            box-shadow: inset 0 0 0 1px #4b5563 !important;
            border-radius: 2px !important;
            font-family: monospace !important;
            font-size: 11px !important;
        }
        .brand-assets-popover .chrome-picker span {
             color: #9ca3af !important;
             font-size: 11px !important;
        }
        .brand-assets-popover .chrome-picker svg {
             fill: #9ca3af !important;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5); /* gray-900 with opacity */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.7); /* gray-600 with opacity */
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(107, 114, 128, 0.8); /* gray-500 with opacity */
        }
        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.7) rgba(17, 24, 39, 0.5);
        }
      `}</style>
    </>
  );
};

export default React.memo(BrandAssetsModal);
