import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 首页组件
 * 显示游戏开始界面
 */
const Home = () => {
  const { initializeGame, gameStatus, error } = useGame();
  const [selectedType, setSelectedType] = useState('mystery');
  const [isInitializing, setIsInitializing] = useState(false);

  const storyTypes = [
    {
      id: 'mystery',
      name: '推理悬疑',
      description: '经典的侦探推理故事，解开谜题寻找真相',
      icon: '🔍',
      color: '#2196F3'
    },
    {
      id: 'thriller',
      name: '惊悚恐怖',
      description: '紧张刺激的惊悚故事，挑战你的胆量',
      icon: '👻',
      color: '#9C27B0'
    },
    {
      id: 'scifi',
      name: '科幻未来',
      description: '探索未来的科幻冒险，想象无限可能',
      icon: '🚀',
      color: '#00BCD4'
    }
  ];

  const handleStart = async () => {
    setIsInitializing(true);
    try {
      await initializeGame(selectedType);
    } catch (err) {
      console.error('开始游戏失败:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="home">
      <div className="home-container">
        {/* 标题区域 */}
        <div className="header">
          <div className="logo">
            <span className="logo-icon">🌙</span>
            <span className="logo-text">幻境回响</span>
          </div>
          <p className="subtitle">
            互动式AI推理叙事游戏
          </p>
        </div>

        {/* 故事类型选择 */}
        <div className="story-types">
          <h2 className="section-title">选择故事类型</h2>
          <div className="type-grid">
            {storyTypes.map((type) => (
              <div
                key={type.id}
                className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
                onClick={() => !isInitializing && setSelectedType(type.id)}
                style={{
                  '--type-color': type.color
                }}
              >
                <div className="type-icon">{type.icon}</div>
                <div className="type-name">{type.name}</div>
                <div className="type-description">{type.description}</div>
                {selectedType === type.id && (
                  <div className="selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 开始按钮 */}
        <button
          className={`start-button ${isInitializing ? 'loading' : ''}`}
          onClick={handleStart}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <span className="spinner"></span>
              初始化中...
            </>
          ) : (
            <>
              开始游戏
              <span className="arrow">→</span>
            </>
          )}
        </button>

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* 游戏说明 */}
        <div className="game-info">
          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <span>游戏时长：30分钟</span>
          </div>
          <div className="info-item">
            <span className="info-icon">💬</span>
            <span>最大对话轮次：100轮</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🎭</span>
            <span>AI角色扮演互动</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .home {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .home-container {
          max-width: 900px;
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 60px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logo-icon {
          font-size: 48px;
        }

        .logo-text {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #2196F3 0%, #9C27B0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #a1a1aa;
          font-size: 16px;
        }

        .story-types {
          margin-bottom: 40px;
        }

        .section-title {
          color: #e4e4e7;
          font-size: 24px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 24px;
        }

        .type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .type-card {
          position: relative;
          background: #1a1a2e;
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .type-card:hover:not(.selected) {
          transform: translateY(-4px);
          border-color: var(--type-color);
        }

        .type-card.selected {
          border-color: var(--type-color);
          background: rgba(33, 150, 243, 0.1);
        }

        .type-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }

        .type-name {
          color: #e4e4e7;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .type-description {
          color: #a1a1aa;
          font-size: 14px;
          line-height: 1.5;
        }

        .selected-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 24px;
          height: 24px;
          background: var(--type-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .start-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 20px;
        }

        .start-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .start-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .start-button.loading {
          background: #1a1a2e;
          border: 2px solid #2196F3;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .arrow {
          transition: transform 0.3s;
        }

        .start-button:hover .arrow {
          transform: translateX(4px);
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          text-align: center;
          color: #F44336;
          font-size: 14px;
        }

        .game-info {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 24px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a1a1aa;
          font-size: 13px;
        }

        .info-icon {
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};

export default Home;
