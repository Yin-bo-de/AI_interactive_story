import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { apiClient } from '../api/client';

/**
 * 首页组件
 * 显示游戏开始界面
 */
const Home = () => {
  const { initializeGame, gameStatus, error } = useGame();
  const [selectedType, setSelectedType] = useState('mystery');
  const [isInitializing, setIsInitializing] = useState(false);

  // API配置状态
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');
  const [modelName, setModelName] = useState('gpt-4o');
  const [isVerifyingAPI, setIsVerifyingAPI] = useState(false);
  const [apiVerified, setApiVerified] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState('');

  // 兑换码状态
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeInfo, setCodeInfo] = useState(null);
  const [codeErrorMessage, setCodeErrorMessage] = useState('');

  // 检查本地存储中的验证状态
  useEffect(() => {
    const savedVerified = localStorage.getItem('api_verified') === 'true';
    const savedApiKey = localStorage.getItem('api_key') || '';
    const savedApiBase = localStorage.getItem('api_base') || '';
    const savedModelName = localStorage.getItem('model_name') || 'gpt-4o';

    if (savedVerified) {
      setApiVerified(true);
      setApiKey(savedApiKey);
      setApiBase(savedApiBase);
      setModelName(savedModelName);
    }
  }, []);

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

  // 验证API配置
  const handleVerifyAPI = async () => {
    if (!apiKey || !apiBase) {
      setApiErrorMessage('请填写API Key和Base URL');
      return;
    }

    setIsVerifyingAPI(true);
    setApiErrorMessage('');

    try {
      const response = await apiClient.post('/sessions/verify-api', {
        api_key: apiKey,
        api_base: apiBase,
        model_name: modelName
      });

      if (response.data.success) {
        setApiVerified(true);
        setApiErrorMessage('');
        // 保存到本地存储
        localStorage.setItem('api_verified', 'true');
        localStorage.setItem('api_key', apiKey);
        localStorage.setItem('api_base', apiBase);
        localStorage.setItem('model_name', modelName);
      } else {
        setApiVerified(false);
        setApiErrorMessage(response.data.message);
      }
    } catch (err) {
      setApiVerified(false);
      setApiErrorMessage(err.response?.data?.message || 'API API验证失败');
    } finally {
      setIsVerifyingAPI(false);
    }
  };

  // 验证兑换码
  const handleVerifyCode = async () => {
    if (!redemptionCode) {
      setCodeErrorMessage('请填写兑换码');
      return;
    }

    setIsVerifyingCode(true);
    setCodeErrorMessage('');

    try {
      const response = await apiClient.post('/sessions/verify-code', {
        code: redemptionCode
      });

      if (response.data.success) {
        setCodeVerified(true);
        setCodeInfo(response.data);
        setCodeErrorMessage('');
      } else {
        setCodeVerified(false);
        setCodeInfo(null);
        setCodeErrorMessage(response.data.message);
      }
    } catch (err) {
      setCodeVerified(false);
      setCodeInfo(null);
      setCodeErrorMessage(err.response?.data?.message || '兑换码验证失败');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleStart = async () => {
    setIsInitializing(true);
    try {
      // 使用兑换码配置或API配置
      const config = codeVerified && codeInfo ? {
        redemption_code: redemptionCode
      } : {
        api_key: apiKey,
        api_base: apiBase,
        model_name: modelName
      };

      await initializeGame(selectedType, config);
    } catch (err) {
      console.error('开始游戏失败:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  // 判断是否可以开始游戏
  const canStart = apiVerified || codeVerified;

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
          className={`start-button ${isInitializing ? 'loading' : ''} ${!canStart ? 'disabled' : ''}`}
          onClick={handleStart}
          disabled={isInitializing || !canStart}
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

        {/* API配置区域 */}
        <div className="api-config">
          <h3 className="config-title">API 配置（或使用兑换码）</h3>
          <div className="config-inputs">
            <div className="input-group">
              <label className="input-label">API Key</label>
              <input
                type="password"
                className="config-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxx"
                disabled={codeVerified}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Base URL</label>
              <input
                type="text"
                className="config-input"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
                disabled={codeVerified}
              />
            </div>
            <div className="input-group">
              <label className="input-label">模型名称</label>
              <input
                type="text"
                className="config-input"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="gpt-4o"
                disabled={codeVerified}
              />
            </div>
            <button
              className={`verify-btn ${isVerifyingAPI ? 'verifying' : ''}`}
              onClick={handleVerifyAPI}
              disabled={isVerifyingAPI || codeVerified || !apiKey || !apiBase}
            >
              {isVerifyingAPI ? (
                <>
                  <span className="spinner-small"></span>
                  验证中...
                </>
              ) : apiVerified ? (
                <>
                  ✓ 已验证
                </>
              ) : (
                <>
                  验证 API
                </>
              )}
            </button>
          </div>
          {apiErrorMessage && (
            <div className="error-message api-error">
              ⚠️ {apiErrorMessage}
            </div>
          )}
        </div>

        {/* 兑换码区域 */}
        <div className="redemption-code">
          <h3 className="config-title">或使用游戏兑换码</h3>
          <div className="config-inputs">
            <div className="input-group">
              <label className="input-label">兑换码</label>
              <input
                type="text"
                className="config-input"
                value={redemptionCode}
                onChange={(e) => setRedemptionCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={apiVerified}
                maxLength={19}
              />
            </div>
            <button
              className={`verify-btn ${isVerifyingCode ? 'verifying' : ''}`}
              onClick={handleVerifyCode}
              disabled={isVerifyingCode || apiVerified || !redemptionCode}
            >
              {isVerifyingCode ? (
                <>
                  <span className="spinner-small"></span>
                  验证中...
                </>
              ) : codeVerified ? (
                <>
                  ✓ 已验证（剩余 {codeInfo?.remaining_games || 0} 次）
                </>
              ) : (
                <>
                  兑换
                </>
              )}
            </button>
          </div>
          {codeErrorMessage && (
            <div className="error-message code-error">
              ⚠️ {codeErrorMessage}
            </div>
          )}
        </div>

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
          margin-bottom: 40px;
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
          margin-bottom: 30px;
        }

        .section-title {
          color: #e4e4e7;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          margin-bottom: 16px;
        }

        .type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .type-card {
          position: relative;
          background: #1a1a2e;
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }

        .type-card:hover:not(.selected) {
          transform: translateY(-2px);
          border-color: var(--type-color);
        }

        .type-card.selected {
          border-color: var(--type-color);
          background: rgba(33, 150, 243, 0.1);
        }

        .type-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .type-name {
          color: #e4e4e7;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .type-description {
          color: #a1a1aa;
          font-size: 13px;
          line-height: 1.4;
;
        }

        .selected-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          background: var(--type-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
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
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 24px;
        }

        .start-button:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .start-button:disabled,
        .start-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #1a1a2e;
        }

        .start-button.loading {
          background: #1a1a2e;
          border: 2px solid #2196F3;
        }

        .spinner {
          width: 18px;
          height: 18px;
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

        .start-button:hover:not(.disabled) .arrow {
          transform: translateX(4px);
        }

        .api-config,
        .redemption-code {
          background: rgba(26, 26, 46, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .config-title {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 16px;
          text-align: center;
        }

        .config-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          color: #a1a1aa;
          font-size: 12px;
          font-weight: 500;
        }

        .config-input {
          background: #0f0f1a;
          border: 1px solid #16213e;
          border-radius: 8px;
          padding: 10px 14px;
          color: #e4e4e7;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .config-input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .config-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .verify-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #1a1a2e;
          border: 1px solid #2196F3;
          color: #2196F3;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          align-self: flex-start;
        }

        .verify-btn:hover:not(:disabled) {
          background: rgba(33, 150, 243, 0.1);
          transform: translateY(-1px);
        }

        .verify-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .verify-btn.verifying {
          opacity: 0.8;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid #2196F3;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
          color: #F44336;
          font-size: 13px;
          margin-top: 8px;
        }

        .api-error,
        .code-error {
          margin-top: 12px;
        }

        .game-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #a1a1aa;
          font-size: 12px;
        }

        .info-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default Home;