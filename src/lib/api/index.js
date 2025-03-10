import axios from 'axios';

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
  const token = localStorage.getItem('token'); // 或从其他地方获取 token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const response = await apiClient.get('/customer/google');
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

apiClient.getCompetitorResearch = getCompetitorResearch;
apiClient.login = login;
apiClient.register = register;
apiClient.sendEmailCode = sendEmailCode;
apiClient.resetPassword = resetPassword;
apiClient.googleLogin = googleLogin;
apiClient.googleCallback = googleCallback;

export default apiClient;
