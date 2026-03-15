import React, { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

/**
 * 聊天容器组件
 * 显示对话历史
 */
const ChatContainer = () => {
  const { messages, scrollToBottom } = useGame();
  const chatEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollToBottom && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, scrollToBottom]);

  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-text">还没有对话，开始你的推理之旅吧！</div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🔍'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      <style jsx>{`
        .chat-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          padding-top: 100px;
          background: #0f0f1a;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a1a1aa;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 16px;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 800px;
          margin: 0 auto;
        }

        .message {
          display: flex;
          gap: 12px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: #2196F3;
        }

        .message-content {
          max-width: 70%;
        }

        .message-text {
          background: #1a1a2e;
          padding: 12px 16px;
          border-radius: 12px;
          border-top-left-radius: 4px;
          color: #e4e4e7;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .message.user .message-text {
          background: #2196F3;
          border-radius: 12px;
          border-top-right-radius: 4px;
          color: #ffffff;
        }

        .message-time {
          font-size: 11px;
          color: #52525b;
          margin-top: 4px;
        }

        .message.user .message-time {
          text-align: right;
        }
      `}</style>
    </div>
  );
};

export default ChatContainer;
