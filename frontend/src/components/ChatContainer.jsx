import React, { useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import Typewriter from './Typewriter';

/**
 * 聊天容器组件
 * 显示对话历史
 */
const ChatContainer = () => {
  const { messages, scrollToBottom } = useGame();
  const chatEndRef = useRef(null);
  const messagesListRef = useRef(null);

  // 自动滚动逻辑
  useEffect(() => {
    if (messages.length === 1) {
      // 首次加载第一条消息，滚动到顶部
      messagesListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (scrollToBottom && chatEndRef.current) {
      // 后续新消息，滚动到底部
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
        <div className="messages-list" ref={messagesListRef}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🔍'}
              </div>
              <div className="message-content">
                <div className="message-text">
                  {message.role === 'assistant' ? (
                    <Typewriter
                      text={message.content}
                      speed={100}
                      showCursor={false}
                    />
                  ) : (
                    message.content
                  )}
                </div>
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
          margin-left: 340px;
          margin-right: 340px;
          padding: 20px 40px;
          padding-top: 80px;
          padding-bottom: 100px;
          background: #0f0f1a;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a1a1aa;
          min-height: calc(100vh - 180px);
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
          max-width: 100%;
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
          max-width: 600px;
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
