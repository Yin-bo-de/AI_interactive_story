import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 角色信息组件
 * 显示所有人物信息
 * 固定在左侧，铺满聊天框左侧
 */
const CharacterInfo = () => {
  const { characters } = useGame();

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <div className="character-info">
      <div className="character-header">
        <div className="header-icon">👥</div>
        <div className="header-title">剧中人物</div>
      </div>

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

      <style jsx>{`
        .character-info {
          position: fixed;
          top: 80px;
          left: 0;
          width: 340px;
          height: calc(100vh - 140px);
          background: rgba(26, 26, 46, 0.95);
          border-right: 1px solid #16213e;
          z-index: 90;
          display: flex;
          flex-direction: column;
        }

        .character-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 24px;
          background: rgba(22, 33, 62, 0.95);
          border-bottom: 1px solid #16213e;
        }

        .header-icon {
          font-size: 20px;
        }

        .header-title {
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 600;
        }

        .characters-list {
          flex: 1;
          padding: 24px;
          padding-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }

        .character-item {
          display: flex;
          gap: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
        }

        .character-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #0f0f1a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .character-info-item {
          flex: 1;
          min-width: 0;
        }

        .character-name {
          color: #e4e4e7;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .character-description {
          color: #a1a1aa;
          font-size: 13px;
          line-height: 1.5;
        }

        /* 滚动条样式 */
        .characters-list::-webkit-scrollbar {
          width: 4px;
        }

        .characters-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
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
