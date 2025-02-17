import axios from 'axios';

const API_URL = 'https://api.websitelm.com/v1';

// 创建 axios 实例，更新配置
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 获取批次历史数据
export async function getArticles(customerId, token) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_URL}/pages/article/${customerId}`, {headers});
    return response.data;
  } catch (error) {
    console.error('获取批次历史数据失败:', error);
    return null;
  }
};

// 根据 slug 获取单篇文章
export async function getPageBySlug(slug, lang, domain) {
  try {
    // 确保 slug 是正确的路径格式，并进行编码
    const encodedSlug = encodeURIComponent(slug);
    console.log('编码前的 slug:', slug);
    console.log('编码后的 slug:', encodedSlug);
    
    const response = await axios.get(`${API_URL}/pages/view/${encodedSlug}`, { 
      params: { lang, domain }
    });
    console.log('response', response.data)
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { notFound: true };
    }
    // 其他错误仍然记录并抛出
    console.error('Error fetching article by slug:', error.response?.data || error.message);
    throw error;
  }
}

// 获取客户定制推荐
export async function getCustomRecommendations({ pageId, customerId, title, category, lang }) {
  try {
    const response = await apiClient.post('/website-lm/recommend', {
      pageId,
      customerId,
      title,
      category: 'WebsiteLM',
      lang
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get custom recommendations:', error);
    return null;
  }
}

// 获取域名的 favicon
export async function getDomainFavicon(domainName) {
  try {
    const response = await apiClient.get('/domain/favicon', {
      params: { domainName }
    });
    return response.data;
  } catch (error) {
    console.error('获取域名 favicon 失败:', error);
    return null;
  }
}
