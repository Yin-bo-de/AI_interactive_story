import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 输入区域组件
 * 处理用户输入和发送消息
 */
const InputArea = () => {
  const { sendMessage, isSending, isEnded, gameStatus } = useGame();
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    await sendMessage(message);
    setMessage('');

    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

        <textarea
          ref={textareaRef}
          className="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isEnded ? '游戏已结束' : '输入你的消息...（按 Enter 发送，Shift+Enter 换行）'}
          disabled={isSending || isEnded}
          maxLength={maxLength}
          rows={1}
        />

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
                发送中...
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
