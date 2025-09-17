// API配置
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : '/api';

// API工具类
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.setToken(null);
        throw new Error('认证失败，请重新登录');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      return data;
    } catch (error) {
      console.error(`API请求失败 ${endpoint}:`, error);
      throw error;
    }
  }

  // GET请求
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request(url, {
      method: 'GET'
    });
  }

  // POST请求
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT请求
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE请求
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // PATCH请求
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // 文件上传
  async upload(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.status === 401) {
        this.setToken(null);
        throw new Error('认证失败，请重新登录');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '上传失败');
      }

      return data;
    } catch (error) {
      console.error(`文件上传失败 ${endpoint}:`, error);
      throw error;
    }
  }
}

// 创建全局API客户端实例
const apiClient = new ApiClient();