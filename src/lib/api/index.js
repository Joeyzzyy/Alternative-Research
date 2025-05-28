import axios from 'axios';

const vercelApiClient = axios.create({
  baseURL: 'https://api.vercel.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer 3LSBxZQ35VdhqRW7tzGs1oYo',
    'Content-Type': 'application/json',
  },
});

const API_URL = 'https://api.websitelm.com/v1';

// 创建 axios 实例，更新配置
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },  
});

// 拦截器添加认证头
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('alternativelyAccessToken'); // 或从其他地方获取 token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 添加响应拦截器处理token失效
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 触发一个自定义事件
      const tokenExpiredEvent = new CustomEvent('tokenExpired');
      window.dispatchEvent(tokenExpiredEvent);
      
      // 清除本地存储的token
      localStorage.removeItem('alternativelyAccessToken');
      localStorage.removeItem('alternativelyIsLoggedIn');
      localStorage.removeItem('alternativelyCustomerEmail');
      localStorage.removeItem('alternativelyCustomerId');
    }
    return Promise.reject(error);
  }
);

const getCompetitorResearch = async (website, apiKey) => {
  try {
    const response = await apiClient.post('/competitor/research', {
      website,
    }, {
      headers: {
        'api-key': 'difymr1234'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get competitor research:', error);
    return null;
  }
};

// Add regular login method
const login = async (email, password) => {
  try {
    const response = await apiClient.post('/login', {
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Failed to login:', error);
    throw error;
  }
};

// Add register method
const register = async (registerData) => {
  try {
    // registerData 现在应包含 code, email, inviteCode, password
    const response = await apiClient.post('/customer/register', {
      code: registerData.code,
      email: registerData.email,
      inviteCode: registerData.inviteCode,
      password: registerData.password
    });
    return response.data;
  } catch (error) {
    console.error('Failed to register:', error);
    throw error;
  }
};

// Add send verification code method
const sendEmailCode = async (email, codeType) => {
  try {
    const response = await apiClient.post('/customer/send-email', {
      email,
      codeType // Available values: forgot_password, change_email, register
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send email verification code:', error);
    throw error;
  }
};

// Add reset password method
const resetPassword = async (resetData) => {
  try {
    const response = await apiClient.post('/customer/reset-password', resetData);
    return response.data;
  } catch (error) {
    console.error('Failed to reset password:', error);
    throw error;
  }
};

// Google 登录
const googleLogin = async (inviteCode) => {
  try {
    const params = { source: 'alternatively' };
    if (inviteCode) params.inviteCode = inviteCode;
    const response = await apiClient.get('/customer/google', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to login with Google:', error);
    return null;
  }
};

// Google登录回调
const googleCallback = async (code, state) => {
  try {
    const response = await apiClient.get('/customer/google/callback', {
      params: { 
        code,
        state 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to handle Google callback:', error);
    throw error;
  }
};

// 获取替代方案状态
const getAlternativeStatus = async (websiteId) => {
  try {
    const response = await apiClient.get(`/alternatively/${websiteId}/status`);
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative status:', error);
    throw error;
  }
};

const searchCompetitor = async (website, deepResearch, websiteId) => {
  try {
    const response = await apiClient.post(`/alternatively/search`, {
      deepResearch,
      website,
      websiteId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to search competitor:', error);
    throw error;
  }
};

// 生成替代方案
const generateAlternative = async (websiteId, domains) => {
  try {
    const response = await apiClient.post('/alternatively/generate', {
      domains,
      websiteId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to generate alternative:', error);
    throw error;
  }
};

// 获取竞品分析详情
const getAlternativeDetail = async (websiteId, options = {}) => {
  try {
    const { planningId, page, limit } = options;
    const params = {};
    
    if (planningId) params.planningId = planningId;
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;
    
    const response = await apiClient.get(`/alternatively/${websiteId}/detail`, { params });
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative details:', error);
    throw error;
  }
};

// 获取分析竞品的来源
const getAlternativeSources = async (websiteId) => {
  try {
    const response = await apiClient.get(`/alternatively/${websiteId}/sources`);
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative sources:', error);
    throw error;
  }
};

// 获取竞品分析结果
const getAlternativeResult = async (websiteId) => {
  try {
    const response = await apiClient.get(`/alternatively/${websiteId}/result`);
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative result:', error);
    throw error;
  }
};

// 修改竞品分析聊天接口参数结构
const chatWithAI = async (message, websiteId, extraParams = {}) => {
  try {
    const { competitorList, selectCompetitorList, isFinished } = extraParams;
    const response = await apiClient.post('/alternatively/chat', {
      message,
      websiteId,
      competitorList,
      selectCompetitorList,
      isFinished
    });
    return response.data;
  } catch (error) {
    console.error('Failed to chat with AI:', error);
    throw error;
  }
};

// 新增设计样式修改接口
const changeStyle = async (styleColor, websiteId) => {
  try {
    const response = await apiClient.post('/alternatively/style', {
      styleColor,
      websiteId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to change website style:', error);
    throw error;
  }
};

// 修改获取客户生成信息列表接口，添加分页支持
const getAlternativeWebsiteList = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/alternatively/website', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative website list:', error);
    throw error;
  }
};

// 新增获取生成信息历史记录接口
const getAlternativeWebsiteHistory = async (websiteId) => {
  try {
    const response = await apiClient.get('/alternatively/website/history', {
      params: { websiteId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative website history:', error);
    throw error;
  }
};

// 新增：获取客户Package的方法
const getCustomerPackage = async () => {
  try {
    const response = await apiClient.get('/customer/package');
    return response.data;
  } catch (error) {
    console.error('Failed to get customer package:', error);
    return null;
  }
};

// 获取聊天历史记录
const getAlternativeChatHistory = async (websiteId) => {
  try {
    const response = await apiClient.get('/alternatively/chat/history', {
      params: { websiteId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get chat history:', error);
    throw error;
  }
};

// 新增：Google One Tap 登录方法
const googleOneTapLogin = async (credential) => {
  try {
    const response = await apiClient.post('/auth/google', {
      credential
    });
    return response.data;
  } catch (error) {
    console.error('Failed to login with Google One Tap:', error);
    throw error;
  }
};

// 新增：删除页面接口
const deletePage = async (websiteId) => {
  try {
    const response = await apiClient.delete(`/alternatively/${websiteId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete page:', error);
    return null;
  }
};

// 新增：生成 websiteId 接口
const generateWebsiteId = async () => {
  try {
    // 发送 POST 请求到 /alternatively/generate/websiteId
    const response = await apiClient.post('/alternatively/generate/websiteId');
    // 返回响应数据，通常包含生成的 websiteId
    return response.data;
  } catch (error) {
    // 记录错误信息并重新抛出，以便调用者处理
    console.error('Failed to generate websiteId:', error);
    throw error;
  }
};

// 新增：根据 websiteId 获取生成 alternatively 页面列表
const getAlternativeWebsiteResultList = async (websiteId) => {
  try {
    const response = await apiClient.get(`/alternatively/results/${websiteId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get alternative website result list:', error);
    throw error;
  }
};

// 新增：根据客户ID获取产品列表
const getProductsByCustomerId = async () => {
  try {
    const response = await apiClient.get(`/products/customer`);
    return response.data;
  } catch (error) {
    console.error('Failed to get customer product list:', error);
    return null;
  }
};

// 新增：获取用户子文件夹
const getSubfolders = async () => {
  try {
    const response = await apiClient.get('/customer/subfolder');
    return response.data;
  } catch (error) {
    console.error('Failed to get user subfolder:', error);
    return null;
  }
};

// 新增：更新子文件夹的方法
const updateSubfolders = async (subfolders) => {
  try {
    const response = await apiClient.put('/customer/subfolder', {
      subfolder: subfolders
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update subfolder:', error);
    return null;
  }
};

// 新增：获取 Vercel 项目域名信息
const getVercelDomainInfo = async (projectId) => {
  try {
    const response = await vercelApiClient.get(`/v9/projects/${projectId}/domains`);
    return response.data;
  } catch (error) {
    console.error('Failed to get Vercel domain info:', error);
    throw error;
  }
};

// 新增：获取 Vercel 域名配置
const getVercelDomainConfig = async (domainName, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      ...(params.slug && { slug: params.slug }),
      ...(params.strict && { strict: params.strict }),
      ...(params.teamId && { teamId: params.teamId })
    }).toString();
    
    const response = await vercelApiClient.get(
      `/v6/domains/${domainName}/config${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to get Vercel domain config:', error);
    throw error;
  }
};

// 新增：更新 alternatively 发布状态
const updateAlternativePublishStatus = async (resultId, status, siteURL) => {
  try {
    const params = {};
    if (siteURL) params.siteURL = siteURL;
    const response = await apiClient.put(
      `/alternatively/${resultId}/${status}`,
      {},
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update alternative publish status:', error);
    throw error;
  }
};

// 新增：编辑生成内容的 slug
const updateAlternativeSlug = async (resultId, slug) => {
  try {
    const response = await apiClient.put(
      `/alternatively/slug/${resultId}`,
      { slug }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update alternative slug:', error);
    throw error;
  }
};

// 新增：获取套餐功能列表接口
const getPackageFeatures = async () => {
  try {
    const response = await apiClient.get('/features-package');
    return response.data;
  } catch (error) {
    console.error('获取套餐功能列表失败:', error);
    return null;
  }
};

// 新增：创建订阅接口
const createSubscription = async (subscriptionData) => {
  try {
    const response = await apiClient.post('/payment/subscribe', {
      customerId: subscriptionData.customerId,
      email: subscriptionData.email,
      name: subscriptionData.name,
      packageId: subscriptionData.packageId,
      paymentMethodId: subscriptionData.paymentMethodId
    });
    return response.data;
  } catch (error) {
    console.error('创建订阅失败:', error);
    return null;
  }
};

// 新增：根据 slug 获取页面内容
const getPageBySlug = async (slug, lang, domain) => {
  try {
    const response = await apiClient.get(`/pages/view/${slug}`, {
      params: { domain, lang }
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { notFound: true };
    }
    console.error('Failed to get article by slug:', error.response?.data || error.message);
    throw error;
  }
};

// 新增：编辑生成内容的 HTML
const editAlternativeHtml = async (editData) => {
  try {
    const response = await apiClient.put('/alternatively/html', {
      html: editData.html,
      resultId: editData.resultId,
      websiteId: editData.websiteId
    });
    return response.data;
  } catch (error) {
    console.error('Failed to edit alternative HTML:', error);
    return null;
  }
};

// Add: Upload media file API
const uploadMedia = async (formData) => {
  try {
    const response = await apiClient.post('/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5 * 60 * 1000, // 5 minutes
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload media:', error);
    return null;
  }
};

// Get: Fetch media file list API
const getMedia = async (customerId, mediaType, categoryId, page, limit) => {
  try {
    const params = {
      customerId,
      page,
      limit,
      ...(mediaType && { mediaType }),
      ...(categoryId && { categoryId })
    };
    const response = await apiClient.get('/media', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to get media list:', error);
    return null;
  }
};

// Delete: Delete media file API
const deleteMedia = async (mediaId) => {
  try {
    const response = await apiClient.delete(`/media/${mediaId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete media:', error);
    return null;
  }
};

// 新增：重新生成网页的特定区块
const regenerateSection = async (regenerateData) => {
  try {
    const response = await apiClient.post('/alternatively/section/regenerate', regenerateData);
    return response.data;
  } catch (error) {
    console.error('Failed to regenerate section:', error);
    throw error;
  }
};

// 新增：创建域名并添加 TXT 记录
const createDomainWithTXT = async (domainData) => {
  try {
    const response = await apiClient.post('/domain', domainData);
    return response.data;
  } catch (error) {
    console.error('Failed to create domain and add TXT record:', error);
    return null; // 或者根据需要抛出错误 throw error;
  }
};

// 新增：验证域名接口
const validateDomain = async (customerId) => {
  try {
    const response = await apiClient.get('/domain/validate', {
      params: { customerId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to validate domain:', error);
    return null;
  }
};

// 新增：更新产品的方法
const updateProduct = async (productId, productData) => {
  try {
    const response = await apiClient.put(`/products/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error('Failed to update product:', error);
    return null;
  }
};

// 新增：添加 Vercel 域名
const addVercelDomain = async (projectId, domainData) => {
  try {
    const response = await vercelApiClient.post(`/v10/projects/${projectId}/domains`, domainData);
    return response.data;
  } catch (error) {
    console.error('Failed to add Vercel domain:', error);
    throw error;
  }
};

// 新增：删除 Vercel 域名
const deleteVercelDomain = async (projectId, domainName) => {
  try {
    const response = await vercelApiClient.delete(`/v9/projects/${projectId}/domains/${domainName}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete Vercel domain:', error);
    throw error;
  }
};

// 新增：获取域名
const getDomain = async (customerId) => {
  try {
    const response = await apiClient.get('/domain', {
      params: { customerId }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get domain:', error);
    return null; // 或者根据需要抛出错误 throw error;
  }
};

// 新增：删除客户域名
const deleteDomain = async (domainId) => {
  try {
    const response = await apiClient.delete(`/domain/${domainId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete domain:', error);
    throw error; // 或者返回 null，取决于错误处理策略
  }
};

// 新增：通过客户ID获取品牌资产
const getBrandAssets = async () => {
  try {
    // 发送 GET 请求到 /customer/brand-assets/current
    // Authorization 头已由拦截器自动添加
    const response = await apiClient.get('/customer/brand-assets/current');
    // 返回响应数据
    return response.data;
  } catch (error) {
    // 记录错误信息并返回 null 或根据需要抛出错误
    console.error('Failed to get brand assets:', error);
    return null; // 或者 throw error;
  }
};

// 更新：创建或更新品牌资产 (现在使用 PUT 方法并包含 brandId)
const upsertBrandAssets = async (brandId, brandAssetData) => {
  try {
    // 发送 PUT 请求到 /customer/brand-assets/{brandId}
    // Authorization 头已由拦截器自动添加
    // brandAssetData 是包含品牌资产信息的对象
    const response = await apiClient.put(`/customer/brand-assets/${brandId}`, brandAssetData);
    // 返回响应数据
    return response.data;
  } catch (error) {
    // 记录错误信息并返回 null 或根据需要抛出错误
    console.error('Failed to upsert brand assets:', error);
    return null; // 或者 throw error;
  }
};

// 新增：创建品牌资产
const createBrandAssets = async (brandAssetData) => {
  try {
    // 发送 POST 请求到 /customer/brand-assets
    // Authorization 头已由拦截器自动添加
    // brandAssetData 是包含品牌资产信息的对象
    const response = await apiClient.post('/customer/brand-assets', brandAssetData);
    // 返回响应数据
    return response.data;
  } catch (error) {
    // 记录错误信息并返回 null 或根据需要抛出错误
    console.error('Failed to create brand assets:', error);
    return null; // 或者 throw error;
  }
};

// 新增：获取用户信息
const getCustomerInfo = async () => {
  try {
    // 发送 GET 请求到 /customer/info
    // Authorization 头已由拦截器自动添加
    const response = await apiClient.get('/customer/info');
    // 返回响应数据
    return response.data;
  } catch (error) {
    // 记录错误信息并返回 null 或根据需要抛出错误
    console.error('Failed to get customer info:', error);
    return null; // 或者 throw error;
  }
};

// 新增：设置去除水印
const setWatermark = async (removeWatermark) => {
  try {
    const response = await apiClient.put('/customer/watermark', {
      removeWatermark
    });
    return response.data;
  } catch (error) {
    console.error('Failed to set watermark:', error);
    throw error;
  }
};

apiClient.getCompetitorResearch = getCompetitorResearch;
apiClient.login = login;
apiClient.register = register;
apiClient.sendEmailCode = sendEmailCode;
apiClient.resetPassword = resetPassword;
apiClient.googleLogin = googleLogin;
apiClient.googleCallback = googleCallback;
apiClient.getAlternativeStatus = getAlternativeStatus;
apiClient.generateAlternative = generateAlternative;
apiClient.getAlternativeDetail = getAlternativeDetail;
apiClient.getAlternativeSources = getAlternativeSources;
apiClient.getAlternativeResult = getAlternativeResult;
apiClient.searchCompetitor = searchCompetitor;
apiClient.chatWithAI = chatWithAI;
apiClient.changeStyle = changeStyle;
apiClient.getAlternativeWebsiteList = getAlternativeWebsiteList;
apiClient.getAlternativeWebsiteHistory = getAlternativeWebsiteHistory;
apiClient.getCustomerPackage = getCustomerPackage;
apiClient.getAlternativeChatHistory = getAlternativeChatHistory;
apiClient.googleOneTapLogin = googleOneTapLogin;
apiClient.deletePage = deletePage;
apiClient.generateWebsiteId = generateWebsiteId;
apiClient.getAlternativeWebsiteResultList = getAlternativeWebsiteResultList;
apiClient.getProductsByCustomerId = getProductsByCustomerId;
apiClient.getSubfolders = getSubfolders;
apiClient.updateSubfolders = updateSubfolders;
apiClient.getVercelDomainInfo = getVercelDomainInfo;
apiClient.getVercelDomainConfig = getVercelDomainConfig;
apiClient.updateAlternativePublishStatus = updateAlternativePublishStatus;
apiClient.updateAlternativeSlug = updateAlternativeSlug;
apiClient.getPackageFeatures = getPackageFeatures;
apiClient.createSubscription = createSubscription;
apiClient.getPageBySlug = getPageBySlug;
apiClient.editAlternativeHtml = editAlternativeHtml;
apiClient.uploadMedia = uploadMedia;
apiClient.getMedia = getMedia;
apiClient.deleteMedia = deleteMedia;
apiClient.regenerateSection = regenerateSection;
apiClient.createDomainWithTXT = createDomainWithTXT;
apiClient.validateDomain = validateDomain;
apiClient.updateProduct = updateProduct;
apiClient.addVercelDomain = addVercelDomain;
apiClient.deleteVercelDomain = deleteVercelDomain;
apiClient.getDomain = getDomain;
apiClient.deleteDomain = deleteDomain;
apiClient.getBrandAssets = getBrandAssets;
apiClient.upsertBrandAssets = upsertBrandAssets;
apiClient.createBrandAssets = createBrandAssets;
apiClient.getCustomerInfo = getCustomerInfo;
apiClient.setWatermark = setWatermark;

export default apiClient;
