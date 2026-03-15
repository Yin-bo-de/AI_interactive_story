import React from 'react';

/**
 * 游戏状态组件
 * 显示顶部进度条/倒计时
 */
const GameState = ({
  elapsed_time = 0,
  remaining_time = 1800,
  max_duration = 1800,
  current_round = 0,
  maxRounds = 100,
  status = 'initializing',
  totalMessages = 0
}) => {
  // 格式化时间显示
  const formatTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;
    const minutes = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const safeMaxDuration = Number(max_duration) || 1800;
  const safeRemainingTime = Number(remaining_time) || 0;
  const progress = ((safeMaxDuration - safeRemainingTime) / safeMaxDuration) * 100;

  // 状态样式
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'paused':
        return '#FFC107';
      case 'ended':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <div className="game-state">
      <div className="game-state-header">
        <div className="game-status">
          <span
            className="status-indicator"
            style={{ backgroundColor: getStatusColor() }}
          ></span>
          <span className="status-text">
            {status === 'active' && '进行中'}
            {status === 'paused' && '已暂停'}
            {status === 'ended' && '已结束'}
          </span>
        </div>
        <div className="game-stats">
          <span className="rounds">
            轮次: {current_round}/{maxRounds}
          </span>
          <span className="messages">
            消息: {totalMessages}
          </span>
        </div>
      </div>

      <div className="time-display">
        <div className="time-info">
          <span className="time-label">剩余时间</span>
          <span className="time-value">{formatTime(remaining_time)}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: progress > 90 ? '#F44336' : '#2196F3'
            }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        .game-state {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: #1a1a2e;
          border-bottom: 1px solid #16213e;
          padding: 12px 20px;
        }

        .game-state-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .game-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .status-text {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 500;
        }

        .game-stats {
          display: flex;
          gap: 16px;
        }

        .rounds,
        .messages {
          color: #a1a1aa;
          font-size: 13px;
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .time-info {
          display: flex;
          flex-direction: column;
          min-width: 100px;
        }

        .time-label {
          color: #a1a1aa;
          font-size: 11px;
          text-transform: uppercase;
        }

        .time-value {
          color: #fafafa;
          font-size: 20px;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #16213e;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default GameState;
