"""
FastAPI应用主入口
"""

import os
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 导入路由
from .sessions import router as sessions_router
from .messages import router as messages_router
from .game import router as game_router


# 配置日志
log_dir = os.getenv("LOG_DIR", "log")
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, f"{logger.start_time.strftime('%Y-%m-%d')}.log") if hasattr(logger, 'start_time') else os.path.join(log_dir, f"{datetime.now().strftime('%Y-%m-%d')}.log")

logger.add(
    log_file,
    rotation="00:00",  # 每天轮转
    retention="7 days",  # 保留7天
    compression="zip",  # 压缩旧日志
    level=os.getenv("LOG_LEVEL", "INFO")
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("应用启动中...")
    yield
    logger.info("应用关闭中...")


# 创建FastAPI应用
app = FastAPI(
    title="幻境回响 API",
    description="互动式AI推理叙事游戏API",
    version="1.0.0",
    lifespan=lifespan
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(sessions_router)
app.include_router(messages_router)
app.include_router(game_router)


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "欢迎来到幻境回响",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "幻境回响 API"
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    logger.info(f"启动服务器: {host}:{port}")

    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True
    )
