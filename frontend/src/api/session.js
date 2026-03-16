/**
 * 会话相关API
 */
import { apiClient } from './client';

/**
 * 创建新会话
 */
export const createSession = async (params) => {
  try {
    const response = await apiClient.post('/sessions/create', params);
    return response.data;
  } catch (error) {
    console.error('创建会话失败:', error);
    throw error;
  }
};

/**
 * 获取会话状态
 */
export const getSessionStatus = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/status`);
    return response.data;
  } catch (error) {
    console.error('获取会话状态失败:', error);
    throw error;
  }
};

/**
 * 获取会话详情
 */
export const getSessionDetails = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('获取会话详情失败:', error);
    throw error;
  }
};

/**
 * 删除会话
 */
export const deleteSession = async (sessionId) => {
  try {
    await apiClient.delete(`/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error('删除会话失败:', error);
    throw error;
  }
};

/**
 * 进入现场
 */
export const enterScene = async (sessionId) => {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/enter-scene`);
    return response.data;
  } catch (error) {
    console.error('进入现场失败:', error);
    throw error;
  }
};

/**
 * 结束游戏并获取结局
 */
export const end = async (sessionId) => {
  try {
    const response = await apiClient.post(`/sessions/${sessionId}/end-game`);
    return response.data;
  } catch (error) {
    console.error('结束游戏失败:', error);
    throw error;
  }
};
