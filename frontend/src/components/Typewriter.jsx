import React, { useState, useEffect, useRef } from 'react';

/**
 * 打字机效果组件
 * 逐字显示文本，营造沉浸式阅读体验
 */
const Typewriter = ({
  text,
  speed = 30,
  onComplete,
  showCursor = true,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // 重置状态
    setDisplayText('');
    setIsTyping(true);
    indexRef.current = 0;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 开始打字效果
    const type = () => {
      if (indexRef.current < text.length) {
        setDisplayText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        if (onComplete) {
          onComplete();
        }
      }
    };

    timeoutRef.current = setTimeout(type, 100);

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed]);

  // 提供跳过打字效果的功能
  const skipTyping = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayText(text);
    setIsTyping(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className={`typewriter ${className}`}>
      <span className="typewriter-text">
        {displayText}
      </span>
      {showCursor && isTyping && (
        <span className="typewriter-cursor">|</span>
      )}
      {isTyping && (
        <button
          className="typewriter-skip"
          onClick={skipTyping}
        >
          点击跳过
        </button>
      )}

      <style jsx>{`
        .typewriter {
          position: relative;
          line-height: 1.8;
        }

        .typewriter-text {
          white-space: pre-wrap;
        }

        .typewriter-cursor {
          display: inline-block;
          animation: blink 1s infinite;
          margin-left: 2px;
          font-weight: normal;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .typewriter-skip {
          position: absolute;
          right: 0;
          bottom: -24px;
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .typewriter-skip:hover {
          color: #e4e4e7;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Typewriter;
