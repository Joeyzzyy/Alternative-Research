import axios from 'axios';

const API_URL = 'https://api.websitelm.com/v1';
const API_URL_TEST = 'http://192.168.10.89:9091/v1';

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
    const response = await apiClient.post('/customer/register', registerData);
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

const googleLogin = async () => {
  try {
    const response = await apiClient.get('/customer/google?source=alternatively');
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

const searchCompetitor = async (website, deepResearch) => {
  try {
    const response = await apiClient.post(`/alternatively/search`, {
      deepResearch,
      website
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

// 新增获取客户生成信息列表接口
const getAlternativeWebsiteList = async () => {
  try {
    const response = await apiClient.get('/alternatively/website');
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

export default apiClient;
