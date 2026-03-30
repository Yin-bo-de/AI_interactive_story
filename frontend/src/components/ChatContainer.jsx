import React, { useEffect, useRef, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import Typewriter from './Typewriter';

/**
 * 聊天容器组件
 * 显示对话历史，支持@提及高亮
 */
const ChatContainer = () => {
  const { messages, scrollToBottom, speakingCharacters, isGroupChatMode, characters } = useGame();
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

  // 渲染带@提及高亮的内容
  const renderContentWithMentions = (content) => {
    if (!content) return content;

    // 构建角色名称正则表达式
    const characterNames = characters
      .filter(char => char.is_active !== false)
      .map(char => char.name);

    if (characterNames.length === 0) {
      return content;
    }

    // 分割内容，识别@提及
    const parts = [];
    let lastIndex = 0;
    const regex = new RegExp(`@(${characterNames.join('|')})`, 'g');
    let match;

    while ((match = regex.exec(content)) !== null) {
      // 添加@前面的文本
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      // 添加@提及
      parts.push({
        type: 'mention',
        name: match[1],
        content: match[0]
      });
      lastIndex = match.index + match[0].length;
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    if (parts.length === 0) {
      return content;
    }

    return parts.map((part, index) => {
      if (part.type === 'mention') {
        return (
          <span key={index} className="mention-highlight">
            {part.content}
          </span>
        );
      }
      return part.content;
    });
  };

  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-text">还没有对话，开始你的推理之旅吧！</div>
        </div>
      ) : (
        <div className="messages-list" ref={messagesListRef}>
          {messages.map((message, index) => {
            // 兼容新旧消息格式
            const isUser = message.role === 'user' || message.sender_id === 'user';
            const isSystem = message.role === 'system' || message.message_type === 'system';
            const senderName = message.sender_name || (isUser ? '你' : '侦探');
            const senderAvatar = message.sender_avatar || (isSystem ? '📢' : (isUser ? '👤' : '🔍'));

            return (
              <div
                key={message.id || index}
                className={`message ${isUser ? 'user' : ''} ${isSystem ? 'system' : ''}`}
              >
                <div className="message-avatar">
                  {senderAvatar}
                </div>
                <div className="message-content">
                  {isGroupChatMode && !isUser && !isSystem && (
                    <div className="message-sender-name">
                      {senderName}
                    </div>
                  )}
                  <div className="message-text">
                    {message.role === 'assistant' && index === messages.length - 1 && !isSystem ? (
                      <Typewriter
                        text={message.content}
                        speed={50}
                        showCursor={false}
                      />
                    ) : (
                      renderContentWithMentions(message.content)
                    )}
                  </div>
                  {!isSystem && (
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 正在输入提示 */}
          {speakingCharacters.length > 0 && (
            <div className="message typing-indicator">
              <div className="message-avatar">
                💬
              </div>
              <div className="message-content">
                <div className="message-text">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">
                    {speakingCharacters.join('、')} 正在输入...
                  </span>
                </div>
              </div>
            </div>
          )}

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

        .message.system {
          justify-content: center;
        }

        .message.system .message-avatar {
          display: none;
        }

        .message.system .message-content {
          max-width: 100%;
        }

        .message.system .message-text {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.3);
          text-align: center;
          color: #64b5f6;
          border-radius: 12px;
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

        .mention-highlight {
          color: #64b5f6;
          font-weight: 600;
          background: rgba(33, 150, 243, 0.15);
          padding: 0 4px;
          border-radius: 4px;
        }

        .message-time {
          font-size: 11px;
          color: #52525b;
          margin-top: 4px;
        }

        .message.user .message-time {
          text-align: right;
        }

        .message-sender-name {
          font-size: 12px;
          font-weight: 600;
          color: #2196F3;
          margin-bottom: 4px;
        }

        .typing-indicator .message-text {
          display: flex;
          align-items: center;
          gap: 12px;
          background: transparent;
          padding: 0;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2196F3;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .typing-text {
          color: #a1a1aa;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ChatContainer;
