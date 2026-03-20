import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GameProvider, useGame } from './contexts/GameContext';

// 页面组件
import Home from './pages/Home';
import Intro from './pages/Intro';
import Game from './pages/Game';
import Result from './pages/Result';

// AppContent 组件 - 路由逻辑
const AppContent = () => {
  const { gameStatus, isEnded, isLoadingEnding } = useGame();
  const navigate = useNavigate();

  // 监听游戏状态变化，自动跳转路由
  useEffect(() => {
    if (isEnded && !isLoadingEnding) {
      // 游结局加载完成后跳转到结果页
      navigate('/result', { replace: true });
    } else if (gameStatus === 'active') {
      navigate('/game', { replace: true });
    } else if (gameStatus === 'waiting') {
      navigate('/intro', { replace: true });
    } else if (gameStatus === 'initializing' || gameStatus === 'error') {
      // 回到首页
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [gameStatus, isEnded, isLoadingEnding, navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/intro" element={<Intro />} />
      <Route path="/game" element={<Game />} />
      <Route path="/result" element={<Result />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// 主应用组件
function App() {
  return (
    <GameProvider>
      <Router>
        <AppContent />
      </Router>
    </GameProvider>
  );
}

export default App;
