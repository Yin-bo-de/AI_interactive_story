import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 结局展示页面
 */
const Result = () => {
  const { ending, background, restartGame, storyType } = useGame();

  const getStoryTypeName = (type) => {
    const types = {
      'mystery': '推理悬疑',
      'thriller': '惊悚恐怖',
      'scifi': '科幻未来'
    };
    return types[type] || type;
  };

  return (
    <div className="result">
      <div className="result-container">
        {/* 标题 */}
        <div className="result-header">
          <div className="ending-badge">🎭</div>
          <h1 className="ending-title">
            {ending?.ending_title || '故事终章'}
          </h1>
        </div>

        {/* 故事类型 */}
        <div className="story-type-badge">
          {getStoryTypeName(storyType)}
        </div>

        {/* 结局内容 */}
        <div className="ending-content">
          <div className="ending-section">
            <h3 className="section-title">📖 故事结局</h3>
            <p className="section-content">
              {ending?.ending_story || '感谢你的参与，故事到此结束。'}
            </p>
          </div>

          {ending?.truth_revealed && (
            <div className="ending-section">
              <h3 className="section-title">💡 真相</h3>
              <p className="section-content">
                {ending.truth_revealed}
              </p>
            </div>
          )}

          {ending?.clues_explanation && (
            <div className="ending-section">
              <h3 className="section-title">🔍 线索解析</h3>
              <p className="section-content">
                {ending.clues_explanation}
              </p>
            </div>
          )}

          {ending?.player_evaluation && (
            <div className="ending-section">
              <h3 className="section-title">👤 你的表现</h3>
              <p className="section-content">
                {ending.player_evaluation}
              </p>
            </div>
          )}
        </div>

        {/* 评分 */}
        {ending?.rating !== undefined && (
          <div className="rating">
            <div className="rating-stars">
              {[...Array(10)].map((_, index) => (
                <span
                  key={index}
                  className={`star ${index < Math.round(ending.rating) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="rating-value">
              {ending.rating.toFixed(1)}/10
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="action-buttons">
          <button
            className="action-button primary"
            onClick={restartGame}
          >
            🔄 重新开始
          </button>
        </div>
      </div>

      <style jsx>{`
        .result {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .result-container {
          max-width: 800px;
          width: 100%;
          background: #1a1a2e;
          border: 1px solid #16213e;
          border-radius: 20px;
          padding: 40px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .ending-badge {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .ending-title {
          color: #e4e4e7;
          font-size: 32px;
          font-weight: 700;
          margin: 0;
        }

        .story-type-badge {
          display: inline-block;
          background: linear-gradient(135deg, #2196F3 0%, #9C27B0 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin: 0 auto 32px;
          display: block;
          width: fit-content;
        }

        .ending-content {
          margin-bottom: 32px;
        }

        .ending-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #16213e;
        }

        .ending-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-title {
          color: #2196F3;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 12px;
        }

        .section-content {
          color: #a1a1aa;
          font-size: 15px;
          line-height: 1.8;
          margin: 0;
          white-space: pre-wrap;
        }

        .rating {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
          padding: 20px;
          background: #0f0f1a;
          border-radius: 12px;
        }

        .rating-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 8px;
        }

        .star {
          color: #3f3f46;
          font-size: 24px;
        }

        .star.filled {
          color: #FFC107;
        }

        .rating-value {
          color: #e4e4e7;
          font-size: 20px;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0f0f1a;
          border: 2px solid #2196F3;
          color: #2196F3;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button.primary {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          color: white;
        }

        .action-button.primary:hover {
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Result;
