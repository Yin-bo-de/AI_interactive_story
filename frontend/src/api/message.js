/**
 * 消息相关API
 */
import { apiClient } from './client';

/**
 * 发送用户消息
 */
export const sendMessage = async (sessionId, content) => {
  try {
    const response = await apiClient.post(
      `/sessions/${sessionId}/messages/send`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
};

/**
 * 获取消息历史
 */
export const getMessages = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/messages`);
    return response.data;
  } catch (error) {
    console.error('获取消息历史失败:', error);
    throw error;
  }
};
