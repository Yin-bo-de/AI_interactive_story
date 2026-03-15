import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSession, getSessionStatus, enterScene as enterSceneAPI } from '../api/session';
import { sendMessage as sendMessageAPI } from '../api/message';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  // 会话相关状态
  const [sessionId, setSessionId] = useState(null);
  const [storyType, setStoryType] = useState('mystery');
  const [background, setBackground] = useState('');
  const [characters, setCharacters] = useState([]);
  const [userIdentity, setUserIdentity] = useState(null);

  // 游戏状态
  const [gameStatus, setGameStatus] = useState('initializing');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(1800);
  const [maxDuration, setMaxDuration] = useState(1800);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(100);
  const [totalMessages, setTotalMessages] = useState(0);

  // 对话相关状态
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [scrollToBottom, setScrollToBottom] = useState(false);
  const [currentOptions, setCurrentOptions] = useState([]);

  // 结局状态
  const [isEnded, setIsEnded] = useState(false);
  const [ending, setEnding] = useState(null);

  // 当前角色
  const [character, setCharacter] = useState(null);

  // 错误状态
  const [error, setError] = useState(null);

  /**
   * 初始化游戏（第一阶段：创建会话，获取背景和人物）
   */
  const initializeGame = async (type = 'mystery') => {
    try {
      console.log('[GameContext] 开始初始化游戏，类型:', type);
      setError(null);
      setGameStatus('initializing');

      // 创建会话
      console.log('[GameContext] 调用 createSession API...');
      const session = await createSession({ story_type: type });
      console.log('[GameContext] 收到后端响应:', session);

      setSessionId(session.session_id);
      setStoryType(type);
      setBackground(session.background);
      setCharacters(session.characters);
      setUserIdentity(session.user_identity);
      setMaxDuration(session.max_duration_seconds || 1800);
      setRemainingTime(session.max_duration_seconds || 1800);
      setMaxRounds(session.max_rounds || 100);

      // 设置当前角色
      if (session.characters && session.characters.length > 0) {
        setCharacter(session.characters[0]);
      }

      console.log('[GameContext] 设置游戏状态为 waiting（等待进入现场）');
      setGameStatus('waiting');

    } catch (err) {
      console.error('[GameContext] 初始化游戏失败:', err);
      setError(err.response?.data?.detail || '初始化游戏失败');
      setGameStatus('error');
    }
  };

  /**
   * 进入现场（第二阶段：获取现场介绍）
   */
  const enterScene = async () => {
    if (!sessionId) return;

    try {
      console.log('[GameContext] 进入现场...');
      setError(null);
      setIsSending(true);

      const response = await enterSceneAPI(sessionId);
      console.log('[GameContext] 收到现场介绍:', response);

      // 添加初始AI消息
      const initialMessage = {
        role: 'assistant',
        content: response.initial_message,
        timestamp: new Date().toISOString(),
        options: response.options
      };
      setMessages([initialMessage]);
      setCurrentOptions(response.options);

      console.log('[GameContext] 设置游戏状态为 active');
      setGameStatus('active');
      setScrollToBottom(true);

      // 开始轮询游戏状态
      startStatusPolling();

    } catch (err) {
      console.error('[GameContext] 进入现场失败:', err);
      setError(err.response?.data?.detail || '进入现场失败');
      throw err;
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 发送用户消息
   */
  const sendMessage = async (content) => {
    if (!sessionId || isSending || isEnded) return;

    try {
      setIsSending(true);
      setError(null);

      // 添加用户消息到历史
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setScrollToBottom(true);

      // 发送消息到后端
      const response = await sendMessageAPI(sessionId, content);

      // 添加AI回复到历史
      const aiMessage = {
        role: 'assistant',
        content: response.ai_message,
        timestamp: new Date().toISOString(),
        options: response.options
      };
      setMessages(prev => [...prev, aiMessage]);

      // 更新选项
      setCurrentOptions(response.options || [])

      // 更新轮次
      setCurrentRound(response.round_number);

      // 更新剩余时间
      setRemainingTime(response.remaining_time);

      // 检查游戏是否结束
      if (response.game_over) {
        handleGameEnd(response.ending);
      }

      setScrollToBottom(true);

    } catch (err) {
      console.error('发送消息失败:', err);
      setError(err.response?.data?.detail || '发送消息失败');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 处理游戏结束
   */
  const handleGameEnd = (endingData) => {
    setIsEnded(true);
    setGameStatus('ended');
    setEnding(endingData);
    stopStatusPolling();
  };

  /**
   * 处理选项点击
   */
  const handleOptionClick = async (option) => {
    await sendMessage(option);
  };

  /**
   * 开始轮询游戏状态
   */
  let pollInterval = null;

  const startStatusPolling = () => {
    stopStatusPolling();
    pollInterval = setInterval(async () => {
      if (!sessionId || isEnded) return;

      try {
        const status = await getSessionStatus(sessionId);

        setRemainingTime(status.remaining_time);
        setCurrentRound(status.total_rounds);

        // 检查是否时间到了
        if (status.remaining_time <= 0) {
          handleGameEnd(null);
        }

      } catch (err) {
        console.error('轮询状态失败:', err);
      }
    }, 5000); // 每5秒轮询一次
  };

  /**
   * 停止轮询
   */
  const stopStatusPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  /**
   * 重新开始游戏
   */
  const restartGame = async () => {
    // 清理状态
    setSessionId(null);
    setMessages([]);
    setEnding(null);
    setIsEnded(false);
    setError(null);
    setCurrentOptions([]);
    setCurrentRound(0);
    setBackground('');
    setCharacters([]);
    setUserIdentity(null);

    // 重新初始化
    setGameStatus('initializing');
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, []);

  const value = {
    // 会话信息
    sessionId,
    storyType,
    background,
    characters,
    userIdentity,
    character,

    // 游戏状态
    gameStatus,
    elapsedTime,
    remainingTime,
    maxDuration,
    currentRound,
    maxRounds,
    totalMessages,

    // 对话
    messages,
    isSending,
    scrollToBottom,
    currentOptions,

    // 结局
    isEnded,
    ending,

    // 错误
    error,

    // 方法
    initializeGame,
    enterScene,
    sendMessage,
    handleOptionClick,
    restartGame,
    handleGameEnd
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
