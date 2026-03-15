/**
 * 游戏状态相关API
 */
import { apiClient } from './client';

/**
 * 获取游戏状态
 */
export const getGameState = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/game/state`);
    return response.data;
  } catch (error) {
    console.error('获取游戏状态失败:', error);
    throw error;
  }
};

/**
 * 获取游戏时间信息
 */
export const getGameTime = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/game/time`);
    return response.data;
  } catch (error) {
    console.error('获取游戏时间失败:', error);
    throw error;
  }
};

/**
 * 获取游戏轮次信息
 */
export const getGameRounds = async (sessionId) => {
  try {
    const response = await apiClient.get(`/sessions/${sessionId}/game/rounds`);
    return response.data;
  } catch (error) {
    console.error('获取游戏轮次失败:', error);
    throw error;
  }
}
