import React, { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import GameState from '../components/GameState';
import ChatContainer from '../components/ChatContainer';
import InputArea from '../components/InputArea';
import OptionsPanel from '../components/OptionsPanel';
import CharacterInfo from '../components/CharacterInfo';

/**
 * 游戏主页面
 */
const Game = () => {
  const {
    gameStatus,
    isEnded,
    handleGameEnd,
    handleOptionClick,
    currentOptions,
    elapsedTime,
    remainingTime,
    maxDuration,
    currentRound,
    maxRounds,
    totalMessages
  } = useGame();

  // 检查游戏状态
  useEffect(() => {
    if (gameStatus === 'ended') {
      handleGameEnd(null);
    }
  }, [gameStatus]);

  return (
    <div className="game">
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

      <style jsx>{`
        .game {
          min-height: 100vh;
          background: #0f0f1a;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding-top: 80px; /* 为游戏状态条留出空间 */
          padding-bottom: 140px; /* 为输入框留出空间 */
        }
      `}</style>
    </div>
  );
};

export default Game;
