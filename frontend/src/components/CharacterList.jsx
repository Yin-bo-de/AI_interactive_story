import React from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 群成员列表组件
 * 显示群聊中的所有角色
 */
const CharacterList = () => {
  const { characters, speakingCharacters } = useGame();

  // 只显示活跃的角色
  const activeCharacters = characters.filter(char => char.is_active !== false);

  if (activeCharacters.length === 0) {
    return null;
  }

  return (
    <div className="character-list">
      <div className="list-header">
        <h3>群成员 ({activeCharacters.length})</h3>
      </div>
      <div className="character-items">
        {activeCharacters.map((char, index) => {
          const isSpeaking = speakingCharacters.includes(char.name);
          return (
            <div key={char.id || index} className={`character-item ${isSpeaking ? 'speaking' : ''}`}>
              <div className="character-avatar">
                {char.avatar || '👤'}
                {isSpeaking && <div className="speaking-indicator"></div>}
              </div>
              <div className="character-info">
                <div className="character-name">
                  {char.name}
                  {char.priority === 1 && <span className="host-tag">群主</span>}
                </div>
                <div className="character-description">
                  {char.description.substring(0, 30)}{char.description.length > 30 ? '...' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .character-list {
          position: fixed;
          right: 0;
          top: 0;
          width: 300px;
          height: 100vh;
          background: #1a1a2e;
          border-left: 1px solid #16213e;
          padding: 20px 16px;
          overflow-y: auto;
          z-index: 10;
        }

        .list-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #16213e;
        }

        .list-header h3 {
          margin: 0;
          font-size: 16px;
          color: #e4e4e7;
          font-weight: 600;
        }

        .character-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .character-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .character-item:hover {
          background: rgba(33, 150, 243, 0.05);
        }

        .character-item.speaking {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.3);
        }

        .character-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #16213e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .speaking-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #4CAF50;
          border: 2px solid #1a1a2e;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .character-info {
          flex: 1;
          min-width: 0;
        }

        .character-name {
          font-size: 14px;
          font-weight: 500;
          color: #e4e4e7;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .host-tag {
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .character-description {
          font-size: 12px;
          color: #a1a1aa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};

export default CharacterList;
