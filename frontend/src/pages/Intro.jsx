import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import Typewriter from '../components/Typewriter';
import BackgroundMusic from '../components/BackgroundMusic';

/**
 * 开场介绍页面
 * 展示背景故事、人物介绍，赋予用户身份
 */
const Intro = () => {
  const navigate = useNavigate();
  const {
    sessionId,
    storyType,
    background,
    characters,
    userIdentity,
    gameStatus,
    enterScene,
    error,
    musicEnabled,
    setMusicEnabled
  } = useGame();

  const [currentSection, setCurrentSection] = useState(0);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [showBackgroundContinue, setShowBackgroundContinue] = useState(false);

  // 检查是否有必要的数据
  useEffect(() => {
    if (!sessionId || gameStatus === 'initializing') {
      navigate('/', { replace: true });
    } else if (gameStatus === 'active') {
      navigate('/game', { replace: true });
    }
  }, [sessionId, gameStatus, navigate]);

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

  // 处理背景故事展示完成
  const handleBackgroundComplete = () => {
    setTimeout(() => {
      setShowBackgroundContinue(true);
    }, 500);
  };

  // 处理从背景继续到人物介绍
  const handleBackgroundContinue = () => {
    setShowBackgroundContinue(false);
    setCurrentSection(1);
  };

  // 处理人物介绍展示完成
  const handleCharactersComplete = () => {
    setTimeout(() => {
      setCurrentSection(2);
    }, 500);
  };

  // 处理点击进度步骤（仅可查看已完成的步骤）
  const handleStepClick = (step) => {
    if (step >= currentSection) return; // 不能跳转到未完成的步骤
    if (step === currentSection) return;

    // 重置相关状态
    setShowEnterButton(false);
    setShowBackgroundContinue(false);

    // 切换到目标步骤
    setCurrentSection(step);
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
            {showBackgroundContinue && (
              <button
                className="continue-button"
                onClick={handleBackgroundContinue}
              >
                继续 →
              </button>
            )}
          </div>
        );
      case 1:
        return (
          <>
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
          </>
        );
      case 2:
        return (
          <>
            <div className="intro-section identity-section">
              <div className="section-icon">🎭</div>
              <h2 className="section-title">你的身份</h2>
              <div className="identity-card">
                <div className="identity-role" style={{ marginBottom: '24px' }}>
                  <Typewriter
                    text={userIdentity?.role || '侦探助理'}
                    speed={50}
                    showCursor={true}
                  />
                </div>
                <div className="typewriter-container" style={{ textAlign: 'left', margin: 0, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Typewriter
                    text={userIdentity?.description || '协助探长侦破案件的关键人物'}
                    speed={35}
                    showCursor={true}
                    delay={800}
                    onComplete={handleIdentityComplete}
                  />
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="intro-page">
      <BackgroundMusic storyType={storyType} />

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

      <div className="intro-container">
        {/* 进度指示器 */}
        <div className="progress-indicator">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`progress-step ${currentSection > step ? 'completed' : ''} ${currentSection === step ? 'active' : ''} ${step >= currentSection ? 'disabled' : ''}`}
              onClick={() => handleStepClick(step)}
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
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .progress-step.disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .progress-step:not(.disabled):hover {
          transform: scale(1.15);
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
          position: relative;
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
          margin-bottom: 24px;
        }

        .background-section .continue-button {
          margin-top: 8px;
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

        /* 音乐控制 */
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

export default Intro;
