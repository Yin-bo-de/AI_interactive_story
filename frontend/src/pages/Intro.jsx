import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import Typewriter from '../components/Typewriter';

/**
 * 开场介绍页面
 * 展示背景故事、人物介绍，赋予用户身份
 */
const Intro = () => {
  const navigate = useNavigate();
  const {
    sessionId,
    background,
    characters,
    userIdentity,
    gameStatus,
    enterScene,
    error
  } = useGame();

  const [currentSection, setCurrentSection] = useState(0);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  // 检查是否有必要的数据
  useEffect(() => {
    if (!sessionId || gameStatus === 'initializing') {
      navigate('/', { replace: true });
    } else if (gameStatus === 'active') {
      navigate('/game', { replace: true });
    }
  }, [sessionId, gameStatus, navigate]);

  // 处理背景故事展示完成
  const handleBackgroundComplete = () => {
    setTimeout(() => {
      setCurrentSection(1);
    }, 500);
  };

  // 处理人物介绍展示完成
  const handleCharactersComplete = () => {
    setTimeout(() => {
      setCurrentSection(2);
    }, 500);
  };

  // 处理用户身份展示完成
  const handleIdentityComplete = () => {
    setTimeout(() => {
      setShowEnterButton(true);
    }, 500);
  };

  // 处理进入现场
  const handleEnterScene = async () => {
    setIsEntering(true);
    try {
      await enterScene();
    } catch (err) {
      console.error('进入现场失败:', err);
    } finally {
      setIsEntering(false);
    }
  };

  // 渲染当前部分
  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <div className="intro-section background-section">
            <div className="section-icon">📖</div>
            <h2 className="section-title">故事背景</h2>
            <div className="typewriter-container">
              <Typewriter
                text={background}
                speed={35}
                onComplete={handleBackgroundComplete}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="intro-section characters-section">
            <div className="section-icon">👥</div>
            <h2 className="section-title">剧中人物</h2>
            <div className="characters-list">
              {characters.map((char, index) => (
                <div
                  key={index}
                  className="character-card"
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <div className="character-avatar">
                    {char.avatar || '👤'}
                  </div>
                  <div className="character-info">
                    <div className="character-name">{char.name}</div>
                    <div className="character-description">{char.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="continue-button"
              onClick={handleCharactersComplete}
            >
              继续 →
            </button>
          </div>
        );
      case 2:
        return (
          <div className="intro-section identity-section">
            <div className="section-icon">🎭</div>
            <h2 className="section-title">你的身份</h2>
            <div className="identity-card">
              <div className="identity-role">
                <Typewriter
                  text={userIdentity?.role || '侦探助理'}
                  speed={50}
                  onComplete={handleIdentityComplete}
                  showCursor={false}
                />
              </div>
              <div className="identity-description">
                {userIdentity?.description || '协助探长侦破案件的关键人物'}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="intro-page">
      <div className="intro-container">
        {/* 进度指示器 */}
        <div className="progress-indicator">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentSection > step ? 'completed' : ''} ${currentSection === step ? 'active' : ''}`}
            >
              <div className="step-number">{step + 1}</div>
            </div>
          ))}
        </div>

        {/* 主要内容区域 */}
        <div className="intro-content">
          {renderSection()}
        </div>

        {/* 进入现场按钮 */}
        {showEnterButton && (
          <div className="enter-scene-section">
            <button
              className={`enter-scene-button ${isEntering ? 'loading' : ''}`}
              onClick={handleEnterScene}
              disabled={isEntering}
            >
              {isEntering ? (
                <>
                  <span className="spinner"></span>
                  进入现场中...
                </>
              ) : (
                <>
                  进入现场
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .intro-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .intro-container {
          max-width: 800px;
          width: 100%;
        }

        /* 进度指示器 */
        .progress-indicator {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 60px;
        }

        .progress-step {
          position: relative;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1a1a2e;
          border: 2px solid #3f3f46;
          color: #71717a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border-color: #2196F3;
          color: white;
          transform: scale(1.1);
        }

        .progress-step.completed .step-number {
          background: #4CAF50;
          border-color: #4CAF50;
          color: white;
        }

        /* 主要内容区域 */
        .intro-content {
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intro-section {
          text-align: center;
          width: 100%;
          animation: fadeInUp 0.5s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .section-title {
          color: #e4e4e7;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 32px;
        }

        /* 背景故事区域 */
        .typewriter-container {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 32px;
          text-align: left;
          color: #d4d4d8;
          font-size: 16px;
          line-height: 1.8;
          position: relative;
        }

        /* 人物介绍区域 */
        .characters-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .character-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
          opacity: 0;
          animation: slideIn 0.5s ease forwards;
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
        }

        .character-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2196F3 0%, #9C27B0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .character-info {
          flex: 1;
        }

        .character-name {
          color: #e4e4e7;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .character-description {
          color: #a1a1aa;
          font-size: 14px;
          line-height: 1.5;
        }

        .continue-button {
          background: transparent;
          border: 2px solid #2196F3;
          color: #2196F3;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .continue-button:hover {
          background: #2196F3;
          color: white;
        }

        /* 身份介绍区域 */
        .identity-card {
          background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%);
          border: 2px solid rgba(33, 150, 243, 0.3);
          border-radius: 16px;
          padding: 40px;
        }

        .identity-role {
          color: #e4e4e7;
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #2196F3 0%, #9C27B0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .identity-description {
          color: #a1a1aa;
          font-size: 16px;
          line-height: 1.6;
        }

        /* 进入现场按钮区域 */
        .enter-scene-section {
          text-align: center;
          margin-top: 40px;
          animation: fadeInUp 0.5s ease;
        }

        .enter-scene-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #2196F3 0%, #9C27B0 100%);
          border: none;
          color: white;
          padding: 18px 48px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
        }

        .enter-scene-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 30px rgba(33, 150, 243, 0.5);
        }

        .enter-scene-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .enter-scene-button.loading {
          background: #1a1a2e;
          border: 2px solid #2196F3;
          box-shadow: none;
        }

        .arrow {
          transition: transform 0.3s;
        }

        .enter-scene-button:hover .arrow {
          transform: translateX(4px);
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

        /* 错误提示 */
        .error-message {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          text-align: center;
          color: #F44336;
          font-size: 14px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default Intro;
