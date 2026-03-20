import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 引导选项面板组件
 * 显示AI提供的引导选项
 * 固定在右侧，铺满聊天框右侧
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
          top: 80px;
          right: 0;
          width: 340px;
          height: calc(100vh - 140px);
          background: rgba(26, 26, 46, 0.95);
          border-left: 1px solid #16213e;
          z-index: 10;
          display: flex;
          flex-direction: column;
        }

        .options-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 24px;
          background: rgba(22, 33, 62, 0.95);
          border-bottom: 1px solid #16213e;
        }

        .options-icon {
          font-size: 20px;
        }

        .options-title {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
        }

        .options-grid {
          flex: 1;
          padding: 24px 24px 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px 20px;
          min-height: 50px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-card:hover:not(.disabled) {
          background: rgba(33, 150, 243, 0.15);
          border-color: #2196F3;
          transform: translateX(-4px);
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
          font-size: 14px;
          line-height: 1.4;
          flex: 1;
        }

        /* 滚动条样式 */
        .options-grid::-webkit-scrollbar {
          width: 4px;
        }

        .options-grid::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        .options-grid::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 2px;
        }

        .options-grid::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
};

export default OptionsPanel;
