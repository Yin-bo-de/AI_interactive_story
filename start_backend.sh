#!/bin/bash

# 幻境回响 - 后端启动脚本
# 功能：检测并杀死现有进程后重新启动

echo "=========================================="
echo "幻境回响 - 后端服务启动"
echo "=========================================="

# 配置
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}
PYTHON_CMD=${PYTHON_CMD:-python}

# 查找占用端口的进程
echo "检查端口 ${PORT} 是否被占用..."
PID=$(lsof -ti:${PORT} 2>/dev/null)

if [ -n "$PID" ]; then
    echo "发现进程 ${PID} 正在占用端口 ${PORT}"
    echo "正在终止进程..."

    # 尝试温和终止
    kill $PID 2>/dev/null

    # 等待进程结束
    for i in {1..10}; do
        if ! kill -0 $PID 2>/dev/null; then
            echo "进程已成功终止"
            break
        fi
        echo "等待进程结束... ($i/10)"
        sleep 1
    done

    # 如果进程仍在运行，强制终止
    if kill -0 $PID 2>/dev/null; then
        echo "进程未响应，强制终止..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi

    echo "端口 ${PORT} 已释放"
else
    echo "端口 ${PORT} 未被占用"
fi

# 检查虚拟环境
if [ -d "venv" ]; then
    echo "激活虚拟环境..."
    source venv/bin/activate
else
    echo "警告：未找到虚拟环境 venv/"
    echo "请先运行: python -m venv venv"
    exit 1
fi

# 检查日志目录
if [ ! -d "log" ]; then
    echo "创建日志目录..."
    mkdir -p log
fi

# 启动后端服务
echo ""
echo "=========================================="
echo "启动后端服务..."
echo "=========================================="
echo "地址: http://${HOST}:${PORT}"
echo "API文档: http://localhost:${PORT}/docs"
echo "按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

# 启动服务
cd backend
$PYTHON_CMD main.py
