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
          background: #1a1a2e;
          border-top: 1px solid #16213e;
          border-bottom: 1px solid #16213e;
          padding: 16px 20px;
          margin: 8px 20px;
          border-radius: 12px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }

        .options-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
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
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f0f1a;
          border: 1px solid #16213e;
          border-radius: 8px;
          padding: 12px 16px;
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
