/**
 * 消息相关API
 */
import { apiClient } from './client';

/**
 * 发送用户消息（单聊模式）
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
 * 发送用户消息（群聊模式）
 */
export const sendGroupMessage = async (sessionId, content) => {
  try {
    const response = await apiClient.post(
      `/sessions/${sessionId}/messages/group-send`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error('发送群聊消息失败:', error);
    throw error;
  }
};

/**
 * 获取下一个AI角色的发言
 */
export const getNextSpeech = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/messages/next-speech`);
    return response.data;
  } catch (error) {
    console.error('获取下一个发言失败:', error);
    throw error;
  }
};

/**
 * 获取角色列表
 */
export const getCharacters = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/messages/characters`);
    return response.data;
  } catch (error) {
    console.error('获取角色列表失败:', error);
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
