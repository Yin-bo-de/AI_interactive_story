import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSession, getSessionStatus, enterScene as enterSceneAPI, end as endGameAPI } from '../api/session';
import { sendMessage as sendMessageAPI, sendGroupMessage, getNextSpeech, getCharacters, getMessages } from '../api/message';

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

  // 群聊相关状态
  const [isGroupChatMode, setIsGroupChatMode] = useState(true); // 默认启用群聊模式
  const [speakingCharacters, setSpeakingCharacters] = useState([]); // 正在输入的角色列表
  const [speechPollingInterval, setSpeechPollingInterval] = useState(null);

  // 结局状态
  const [isEnded, setIsEnded] = useState(false);
  const [ending, setEnding] = useState(null);
  const [isLoadingEnding, setIsLoadingEnding] = useState(false);

  // 当前角色
  const [character, setCharacter] = useState(null);

  // 错误状态
  const [error, setError] = useState(null);

  // 背景音乐控制
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);

  /**
   * 初始化游戏（第一阶段：创建会话，获取背景和人物）
   */
  const initializeGame = async (type = 'mystery', config = {}) => {
    try {
      console.log('[GameContext] 开始初始化游戏，类型:', type);
      setError(null);
      setGameStatus('initializing');

      // 创建会话，合并配置
      console.log('[GameContext] 调用 createSession API...');
      const session = await createSession({ story_type: type, ...config });
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

      if (isGroupChatMode) {
        // 群聊模式：获取完整的消息历史
        console.log('[GameContext] 群聊模式：获取消息历史...');
        const historyResponse = await getMessages(sessionId);
        console.log('[GameContext] 消息历史:', historyResponse);
        setMessages(historyResponse.messages);
        setCurrentOptions(response.options || []);

        // 刷新角色列表
        try {
          const chars = await getCharacters(sessionId);
          console.log('[GameContext] 角色列表:', chars);
          setCharacters(chars);
        } catch (err) {
          console.error('[GameContext] 获取角色列表失败:', err);
        }
      } else {
        // 单聊模式：添加初始AI消息
        const initialMessage = {
          role: 'assistant',
          content: response.initial_message,
          timestamp: new Date().toISOString(),
          options: response.options
        };
        setMessages([initialMessage]);
        setCurrentOptions(response.options);
      }

      console.log('[GameContext] 设置游戏状态为 active');
      setGameStatus('active');
      setScrollToBottom(false); // 进入现场时不滚动到底部，让用户从开头看起

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
   * 发送用户消息（非流式，单聊模式）
   */
  const sendMessage = async (content) => {
    if (!sessionId || isSending || isEnded) return;

    try {
      setIsSending(true);
      setError(null);

      // 添加用户消息到历史
      const userMessage = {
        role: 'user',
        sender_id: 'user',
        sender_name: '你',
        content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setScrollToBottom(true);

      // 非流式调用
      const response = await sendMessageAPI(sessionId, content);

      // 添加AI回复到历史
      const aiMessage = {
        role: 'assistant',
        sender_id: 'assistant',
        sender_name: '侦探',
        content: response.ai_message,
        timestamp: new Date().toISOString(),
        options: response.options
      };
      setMessages(prev => [...prev, aiMessage]);

      // 更新选项
      setCurrentOptions(response.options || []);

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
   * 发送用户消息（群聊模式）
   */
  const sendGroupChatMessage = async (content) => {
    if (!sessionId || isSending || isEnded) return;

    try {
      setIsSending(true);
      setError(null);

      // 添加用户消息到历史
      const messageId = `msg_${Date.now()}`;
      const userMessage = {
        id: messageId,
        role: 'user',
        sender_id: 'user',
        sender_name: '你',
        sender_avatar: null,
        content,
        timestamp: new Date().toISOString(),
        options: null,
        mentioned_characters: [],
        message_type: 'text'
      };
      setMessages(prev => [...prev, userMessage]);
      setScrollToBottom(true);

      // 调用群聊发送接口
      console.log('[GameContext] 调用 sendGroupMessage API...');
      const response = await sendGroupMessage(sessionId, content);
      console.log('[GameContext] sendGroupMessage 响应:', response);

      // 刷新角色列表
      try {
        const chars = await getCharacters(sessionId);
        setCharacters(chars);
      } catch (err) {
        console.error('[GameContext] 刷新角色列表失败:', err);
      }

      // 更新轮次
      setCurrentRound(response.round_number);

      // 更新剩余时间
      setRemainingTime(response.remaining_time);

      // 检查游戏是否结束
      if (response.game_over) {
        handleGameEnd(response.ending);
        return;
      }

      // 开始轮询获取AI发言
      console.log('[GameContext] 开始轮询获取AI发言');
      startSpeechPolling();

    } catch (err) {
      console.error('发送群聊消息失败:', err);
      setError(err.response?.data?.detail || '发送消息失败');
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 开始轮询获取AI发言
   */
  const startSpeechPolling = () => {
    if (speechPollingInterval) return;
    console.log('[GameContext] 启动轮询定时器');

    const interval = setInterval(async () => {
      if (!sessionId || isEnded) return;

      try {
        console.log('[GameContext] 调用 getNextSpeech...');
        const response = await getNextSpeech(sessionId);
        console.log('[GameContext] getNextSpeech 响应:', response);

        if (response.has_next && response.message) {
          console.log('[GameContext] 添加AI消息到历史:', response.message);
          // 添加AI消息到历史
          setMessages(prev => [...prev, response.message]);
          setScrollToBottom(true);

          // 更新选项（如果有）
          if (response.message.options && response.message.options.length > 0) {
            setCurrentOptions(response.message.options);
          }

          // 如果有下一个发言者，显示正在输入
          if (response.next_speaker) {
            setSpeakingCharacters(prev => [...new Set([...prev, response.next_speaker])]);
          } else {
            setSpeakingCharacters([]);
          }
        } else {
          console.log('[GameContext] 没有更多发言了，停止轮询');
          // 没有更多发言了，停止轮询
          stopSpeechPolling();
          setSpeakingCharacters([]);
        }
      } catch (err) {
        console.error('[GameContext] 获取下一个发言失败:', err);
        // 出错时重试几次后停止
        stopSpeechPolling();
        setSpeakingCharacters([]);
      }
    }, 1000); // 每秒轮询一次

    setSpeechPollingInterval(interval);
  };

  /**
   * 停止轮询AI发言
   */
  const stopSpeechPolling = () => {
    if (speechPollingInterval) {
      console.log('[GameContext] 停止轮询定时器');
      clearInterval(speechPollingInterval);
      setSpeechPollingInterval(null);
    }
    setSpeakingCharacters([]);
  };

  /**
   * 处理游戏结束
   */
  const handleGameEnd = (endingData) => {
    console.log('[GameContext] handleGameEnd被调用，endingData:', endingData);
    setEnding(endingData);
    setIsEnded(true);
    setGameStatus('ended');
    stopStatusPolling();
  };

  /**
   * 处理选项点击
   */
  const handleOptionClick = async (option) => {
    if (isGroupChatMode) {
      await sendGroupChatMessage(option);
    } else {
      await sendMessage(option);
    }
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
        if (status.remaining_time <= 0 && !isLoadingEnding && !isEnded) {
          console.log('[GameContext] 时间耗尽，获取游戏结局...');
          setIsLoadingEnding(true);
          try {
            const endingData = await endGameAPI(sessionId);
            console.log('[GameContext] 获取到结局:', endingData);
            handleGameEnd(endingData);
          } catch (err) {
            console.error('[GameContext] 获取结局失败:', err);
            // 即使获取结局失败，也结束游戏
            handleGameEnd(null);
          } finally {
            setIsLoadingEnding(false);
          }
        }

      } catch (err) {
        console.error('轮询状态失败:', err);
      }
    },1000); // 每1秒轮询一次
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
    // 清理所有游戏状态
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
    setGameStatus('initializing');  // 设置状态让App组件导航回首页
    console.log('[GameContext] 游戏已重置，状态为 initializing');
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

    // 群聊
    isGroupChatMode,
    speakingCharacters,

    // 结局
    isEnded,
    ending,
    isLoadingEnding,

    // 错误
    error,

    // 背景音乐
    musicEnabled,
    musicVolume,
    setMusicEnabled,
    setMusicVolume,

    // 方法
    initializeGame,
    enterScene,
    sendMessage,
    sendGroupChatMessage,
    handleOptionClick,
    restartGame,
    handleGameEnd,
    startSpeechPolling,
    stopSpeechPolling
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
