import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 输入区域组件
 * 处理用户输入和发送消息，支持@提及功能
 */
const InputArea = () => {
  const { sendMessage, sendGroupChatMessage, isSending, isEnded, gameStatus, isGroupChatMode, characters } = useGame();
  const [message, setMessage] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearchText, setMentionSearchText] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef(null);
  const mentionMenuRef = useRef(null);

  // 获取可@的角色列表（活跃角色）
  const mentionableCharacters = characters.filter(char => char.is_active !== false);

  // 过滤匹配的角色
  const filteredCharacters = mentionableCharacters.filter(char =>
    char.name.toLowerCase().includes(mentionSearchText.toLowerCase())
  );

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // 点击外部关闭提及菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(e.target) &&
          textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowMentionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 检查输入内容，处理@提及
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // 获取光标位置
    const cursorPosition = e.target.selectionStart;

    // 查找光标前最近的@符号
    let lastAtIndex = -1;
    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (newValue[i] === '@') {
        // 检查@前面是不是空格或开头
        if (i === 0 || newValue[i - 1] === ' ') {
          lastAtIndex = i;
          break;
        }
      }
      // 如果遇到空格，停止搜索
      if (newValue[i] === ' ') {
        break;
      }
    }

    if (lastAtIndex !== -1) {
      // 提取@后面的搜索文本
      const searchText = newValue.substring(lastAtIndex + 1, cursorPosition);
      setMentionSearchText(searchText);
      setMentionStartIndex(lastAtIndex);
      setShowMentionMenu(true);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionMenu(false);
      setMentionSearchText('');
    }
  };

  // 插入@提及
  const insertMention = (character) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = message.substring(0, mentionStartIndex);
    const afterMention = message.substring(mentionStartIndex + mentionSearchText.length + 1);
    const newMessage = `${beforeMention}@${character.name} ${afterMention}`;

    setMessage(newMessage);
    setShowMentionMenu(false);
    setMentionSearchText('');
    setMentionStartIndex(-1);

    // 聚焦文本框
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // 设置光标位置
        const cursorPos = beforeMention.length + character.name.length + 2;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  // 处理键盘导航
  const handleKeyDown = (e) => {
    if (showMentionMenu && filteredCharacters.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            Math.min(prev + 1, filteredCharacters.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertMention(filteredCharacters[selectedMentionIndex]);
          break;
        case 'Escape':
          setShowMentionMenu(false);
          break;
      }
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    if (isGroupChatMode) {
      await sendGroupChatMessage(message);
    } else {
      await sendMessage(message);
    }

    setMessage('');
    setShowMentionMenu(false);

    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentionMenu) {
      e.preventDefault();
      handleSend();
    }
  };

  const maxLength = 1000;

  return (
    <div className="input-area">
      <div className="input-container">
        {gameStatus === 'paused' && (
          <div className="pause-banner">
            ⏸️ 游戏已暂停
          </div>
        )}

        {gameStatus === 'ended' && (
          <div className="end-banner">
            🎭 游戏已结束 - 查看结局
          </div>
        )}

        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="message-input"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onKeyDown={handleKeyDown}
            placeholder={isEnded ? '游戏已结束' : isSending ? '处理中...' : '输入你的消息...（输入@可提及角色，按 Enter 发送，Shift+Enter 换行）'}
            disabled={isSending || isEnded}
            maxLength={maxLength}
            rows={1}
          />

          {/* @提及菜单 */}
          {showMentionMenu && filteredCharacters.length > 0 && (
            <div ref={mentionMenuRef} className="mention-menu">
              {filteredCharacters.map((char, index) => (
                <div
                  key={char.id}
                  className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                  onClick={() => insertMention(char)}
                  onMouseEnter={() => setSelectedMentionIndex(index)}
                >
                  <span className="mention-avatar">{char.avatar || '👤'}</span>
                  <span className="mention-name">{char.name}</span>
                  {char.priority === 1 && <span className="mention-tag">群主</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-footer">
          <div className="char-count">
            {message.length} / {maxLength}
          </div>
          <button
            className={`send-button ${isSending ? 'sending' : ''} ${!message.trim() ? 'disabled' : ''}`}
            onClick={handleSend}
            disabled={!message.trim() || isSending || isEnded}
          >
            {isSending ? (
              <>
                <span className="spinner"></span>
                处理中...
              </>
            ) : (
              <>
                发送 ➤
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-area {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #1a1a2e;
          border-top: 1px solid #16213e;
          padding: 16px 20px;
          z-index: 20;
        }

        .pause-banner,
        .end-banner {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          text-align: center;
          color: #FFC107;
          font-size: 14px;
        }

        .end-banner {
          background: rgba(68, 138, 255, 0.1);
          border-color: rgba(68, 138, 255, 0.3);
          color: #448aff;
        }

        .input-container {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
        }

        .textarea-wrapper {
          position: relative;
        }

        .message-input {
          width: 100%;
          background: #0f0f1a;
          border: 1px solid #16213e;
          border-radius: 12px;
          padding: 12px 16px;
          color: #e4e4e7;
          font-size: 15px;
          font-family: inherit;
          resize: none;
          overflow-y: hidden;
          transition: border-color 0.2s;
          min-height: 48px;
          max-height: 200px;
        }

        .message-input:focus {
          outline: none;
          border-color: #2196F3;
        }

        .message-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mention-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: #1a1a2e;
          border: 1px solid #16213e;
          border-radius: 8px;
          margin-bottom: 8px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
        }

        .mention-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .mention-item:hover,
        .mention-item.selected {
          background: rgba(33, 150, 243, 0.2);
        }

        .mention-avatar {
          font-size: 20px;
        }

        .mention-name {
          flex: 1;
          color: #e4e4e7;
          font-size: 14px;
          font-weight: 500;
        }

        .mention-tag {
          background: rgba(33, 150, 243, 0.2);
          color: #2196F3;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }

        .char-count {
          color: #a1a1aa;
          font-size: 12px;
        }

        .send-button {
          background: #2196F3;
          border: none;
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .send-button:hover:not(.disabled) {
          background: #1976D2;
          transform: translateY(-2px);
        }

        .send-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .send-button.sending {
          background: #1a1a2e;
          border: 1px solid #2196F3;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InputArea;
