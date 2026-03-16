import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 角色信息组件
 * 显示所有人物信息
 */
const CharacterInfo = () => {
  const { characters } = useGame();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <div className={`character-info ${isExpanded ? 'expanded' : ''}`}>
      <div
        className="character-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-icon">👥</div>
        <div className="header-title">剧中人物</div>
        <div className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {isExpanded && (
        <div className="characters-list">
          {characters.map((char, index) => (
            <div key={index} className="character-item">
              <div className="character-avatar">
                {char.avatar || '👤'}
              </div>
              <div className="character-info-item">
                <div className="character-name">{char.name}</div>
                <div className="character-description">
                  {char.description}
                </div>
              </div>
            </div>
          ))}
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
          max-height: ${isExpanded ? '500px' : '52px'};
          width: 540px;
        }

        .character-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          background: #1a1a2e;
          width: 240px;
        }

        .character-header:hover {
          background: #16213e;
        }

        .header-icon {
          font-size: 20px;
        }

        .header-title {
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

        .characters-list {
          padding: 8px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 430px;
          overflow-y: auto;
        }

        .character-item {
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 10px;
        }

        .character-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #0f0f1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .character-info-item {
          flex: 1;
          min-width: 0;
        }

        .character-name {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .character-description {
          color: #a1a1aa;
          font-size: 12px;
          line-height: 1.4;
        }

        /* 滚动条样式 */
        .characters-list::-webkit-scrollbar {
          width: 4px;
        }

        .characters-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
        }

        .characters-list::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 2px;
        }

        .characters-list::-webkit-scrollbar-thumb:hover {
          background: #52525b;
        }
      `}</style>
    </div>
  );
};

export default CharacterInfo;
