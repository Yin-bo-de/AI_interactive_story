/**
 * API客户端基础配置
 */
import axios from 'axios';

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120秒超时
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * 流式发送消息
 * @param {string} sessionId - 会话ID
 * @param {string} content - 消息内容
 * @param {function} onChunk - 接收数据块的回调，参数为解析后的JSON对象
 * @param {function} onComplete - 完成回调
 * @param {function} onError - 错误回调
 */
export const sendMessageStream = async (sessionId, content, onChunk, onComplete, onError) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages/send/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '请求失败');
    }
    console.log('[API] 流式请求已发送，开始接收数据...', response);
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      // 按换行符分割JSON行（NDJSON格式）
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留不完整的行到下一次处理

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line.trim());

          // 处理不同事件类型
          if (event.type === 'message' && event.data) {
            if (onChunk) {
              onChunk(event.data);
            }
          } else if (event.type === 'end') {
            if (onComplete) {
              onComplete();
            }
            return;
          } else if (event.type === 'error' && event.data) {
            throw new Error(event.data.detail || '流式请求出错');
          }
        } catch (e) {
          console.error('解析JSON行失败:', e, line);
        }
      }
    }

    if (onComplete) {
      onComplete();
    }

  } catch (error) {
    console.error('流式发送消息失败:', error);
    if (onError) {
      onError(error);
    }
  }
};

export { apiClient, API_BASE_URL };
