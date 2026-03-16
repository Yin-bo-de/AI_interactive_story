import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 角色信息组件
 * 显示当前角色信息
 */
const CharacterInfo = () => {
  const { character } = useGame();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!character) {
    return null;
  }

  return (
    <div className={`character-info ${isExpanded ? 'expanded' : ''}`}>
      <div
        className="character-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="character-avatar">
          {character.avatar || '🔍'}
        </div>
        <div className="character-name">{character.name}</div>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="character-details">
          <div className="character-description">
            {character.description}
          </div>
        </div>
      )}

      <style jsx>{`
        .character-info {
          position: fixed;
          top: 100px;
          left: 20px;
          background: #1a1a2e;
          border: 1px solid #16213e;
          border-radius: 12px;
          overflow: hidden;
          z-index: 99;
          transition: all 0.3s ease;
        }

        .character-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          background: #1a1a2e;
          min-width: 200px;
        }

        .character-header:hover {
          background: #16213e;
        }

        .character-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0f0f1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .character-name {
          flex: 1;
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
        }

        .expand-icon {
          color: #a1a1aa;
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .character-details {
          padding: 0 16px 16px;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .character-description {
          color: #a1a1aa;
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default CharacterInfo;
