import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 引导选项面板组件
 * 显示AI提供的引导选项
 */
const OptionsPanel = ({ options, onOptionClick }) => {
  const { isSending } = useGame();

  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="options-panel">
      <div className="options-header">
        <span className="options-icon">💡</span>
        <span className="options-title">你可以尝试</span>
      </div>
      <div className="options-grid">
        {options.map((option, index) => (
          <button
            key={index}
            className={`option-card ${isSending ? 'disabled' : ''}`}
            onClick={() => !isSending && onOptionClick(option)}
            disabled={isSending}
          >
            <span className="option-index">{index + 1}</span>
            <span className="option-text">{option}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .options-panel {
          position: fixed;
          right: calc(50% - 900px);
          top: 50%;
          transform: translateY(-50%);
          width: 260px;
          background: rgba(26, 26, 46, 0.95);
          border: 1px solid #2196F3;
          border-radius: 12px;
          padding: 16px;
          z-index: 10;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(33, 150, 243, 0.2);
        }

        .options-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .options-icon {
          font-size: 20px;
        }

        .options-title {
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 500;
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f0f1a;
          border: 1px solid #16213e;
          border-radius: 8px;
          padding: 16px 16px;
          min-height: 60px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-card:hover:not(.disabled) {
          background: #16213e;
          border-color: #2196F3;
          transform: translateY(-2px);
        }

        .option-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .option-index {
          width: 24px;
          height: 24px;
          background: #2196F3;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .option-text {
          color: #e4e4e7;
          font-size: 13px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default OptionsPanel;
