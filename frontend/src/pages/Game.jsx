import React, { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import GameState from '../components/GameState';
import ChatContainer from '../components/ChatContainer';
import InputArea from '../components/InputArea';
import OptionsPanel from '../components/OptionsPanel';
import CharacterInfo from '../components/CharacterInfo';
import BackgroundMusic from '../components/BackgroundMusic';

/**
 * 游戏主页面
 */
const Game = () => {
  const {
    gameStatus,
    isEnded,
    storyType,
    handleGameEnd,
    handleOptionClick,
    currentOptions,
    elapsedTime,
    remainingTime,
    maxDuration,
    currentRound,
    maxRounds,
    totalMessages,
    musicEnabled,
    setMusicEnabled
  } = useGame();

  // 检查游戏状态
  useEffect(() => {
    if (gameStatus === 'ended') {
      handleGameEnd(null);
    }
  }, [gameStatus]);

  // 禁用浏览器返回按钮，防止误操作
  useEffect(() => {
    // 禁用浏览器前进后退
    history.pushState(null, null, location.href);
    const handlePopState = () => {
      history.pushState(null, null, location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 更新音乐播放状态
  useEffect(() => {
    const audio = document.querySelector('audio');
    if (audio) {
      if (musicEnabled) {
        audio.play().catch(err => console.log('播放失败:', err));
      } else {
        audio.pause();
      }
    }
  }, [musicEnabled]);

  // 切换音乐开关
  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
    const audio = document.querySelector('audio');
    if (audio) {
      if (!musicEnabled) {
        audio.play().catch(err => console.log('播放失败:', err));
      } else {
        audio.pause();
      }
    }
  };

  return (
    <div className="game">
      <BackgroundMusic storyType={storyType} />

      <GameState
        elapsed_time={elapsedTime}
        remaining_time={remainingTime}
        max_duration={maxDuration}
        current_round={currentRound}
        maxRounds={maxRounds}
        status={gameStatus}
        totalMessages={totalMessages}
      />

      <ChatContainer />

      {!isEnded && currentOptions.length > 0 && (
        <OptionsPanel
          options={currentOptions}
          onOptionClick={handleOptionClick}
        />
      )}

      <InputArea />

      <CharacterInfo />

      {/* 音乐控制按钮 - 左下角 */}
      <div
        className="music-control"
        onClick={toggleMusic}
      >
        <div className="music-icon">
          {musicEnabled ? '🔊' : '🔇'}
        </div>
        <div className="music-label">
          {musicEnabled ? '音乐开' : '音乐关'}
        </div>
      </div>

      <style jsx>{`
        .game {
          min-height: 100vh;
          background: #0f0f1a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-top: 80px; /* 为游戏状态条留出空间 */
          padding-bottom: 140px; /* 为输入框留出空间 */
          padding-left: 300px; /* 为左侧人物面板留出空间 */
          padding-right: 300px; /* 为右侧选项面板留出空间 */
        }

        .music-control {
          position: fixed;
          bottom: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(26, 26, 46, 0.9);
          border: 1px solid #16213e;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .music-control:hover {
          background: rgba(22, 33, 62, 0.95);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .music-icon {
          font-size: 20px;
        }

        .music-label {
          color: #e4e4e7;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Game;
