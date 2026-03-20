import React, { useEffect } from 'react';

/**
 * 背景音乐组件
 * 根据游戏类型播放相应的背景音乐
 * 使用全局单例模式，确保在页面切换时不会重复播放
 */
const BackgroundMusic = ({ storyType = 'mystery' }) => {
  // 根据故事类型获取对应的音乐文件
  const getMusicFile = (type) => {
    const musicMap = {
      mystery: '/assets/music/mystery.mp3',
      adventure: '/assets/music/adventure.mp3',
      romance: '/assets/music/romance.mp3',
      horror: '/assets/music/horror.mp3',
      scifi: '/assets/music/scifi.mp3',
      fantasy: '/assets/music/fantasy.mp3'
    };
    return musicMap[type] || '/assets/music/mystery.mp3';
  };

  const musicFile = getMusicFile(storyType);

  useEffect(() => {
    // 检查是否已经存在音频元素（全局单例）
    let audio = document.querySelector('audio[data-bg-music]');

    if (audio) {
      // 如果已存在，检查是否需要切换音乐
      const currentSrc = audio.src.endsWith('/') ? audio.src.slice(0, -1) : audio.src;
      const targetSrc = new URL(musicFile, window.location.origin).href;

      if (currentSrc !== targetSrc) {
        const wasPlaying = !audio.paused;
        audio.src = targetSrc;
        audio.load();
        if (wasPlaying) {
          audio.play().catch(err => console.log('切换音乐失败:', err));
        }
      }
      return;
    }

    // 创建新的音频元素
    audio = new Audio(musicFile);
    audio.dataset.bgMusic = 'true'; // 标记为背景音乐
    audio.loop = true; // 循环播放
    audio.volume = 0.3; // 设置音量为30%，避免太大声
    audio.preload = 'auto';
    audio.style.display = 'none';

    // 将音频元素添加到 DOM
    document.body.appendChild(audio);

    // 尝试播放音频
    const playAudio = async () => {
      try {
        await audio.play();
        console.log('[BackgroundMusic] 背景音乐开始播放:', musicFile);
      } catch (err) {
        console.warn('[BackgroundMusic] 自动播放失败，等待用户交互:', err);
      }
    };

    playAudio();

    // 清函数
    return () => {
      // 不在组件卸载时删除音频元素，保持全局单例
      // 音乐会继续播放，直到用户手动关闭或离开应用
    };
  }, [musicFile]);

  // 不渲染任何内容，音频元素已添加到 DOM
  return null;
};

export default BackgroundMusic;
