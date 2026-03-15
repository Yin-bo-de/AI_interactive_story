"""
后端应用启动脚本
"""

import os
import sys
from dotenv import load_dotenv
from loguru import logger

# 加载环境变量
load_dotenv()

# 配置日志
log_dir = os.getenv("LOG_DIR", "log")
os.makedirs(log_dir, exist_ok=True)

# 添加日志处理器
logger.add(
    os.path.join(log_dir, "{time:YYYY-MM-DD}.log"),
    rotation="00:00",
    retention="7 days",
    compression="zip",
    level=os.getenv("LOG_LEVEL", "INFO")
)

# 添加控制台输出
logger.add(
    lambda msg: print(msg, end=""),
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level=os.getenv("LOG_LEVEL", "INFO")
)

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    logger.info(f"启动幻境回响后端服务: {host}:{port}")
    logger.info(f"API文档: http://localhost:{port}/docs")

    # 获取项目根目录
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # 切换工作目录到项目根目录
    os.chdir(project_root)

    # 直接导入 app 避免路径问题
    sys.path.insert(0, project_root)
    from backend.api.main import app

    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=False,  # 使用直接导入时禁用 reload
        log_level="info"
    )
