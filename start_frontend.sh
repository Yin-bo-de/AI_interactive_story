#!/bin/bash

# 幻境回响 - 前端启动脚本
# 功能：检测并杀死现有进程后重新启动

echo "=========================================="
echo "幻境回响 - 前端服务启动"
echo "=========================================="

# 配置
PORT=${PORT:-5173}
HOST=${HOST:-0.0.0.0}

# 查找占用端口的进程
echo "检查端口 ${PORT} 是否被占用..."
PID=$(lsof -ti:${PORT} 2>/dev/null)

if [ -n "$PID" ]; then
    echo "发现进程 ${PID} 正在占用端口 ${PORT}"
    echo "正在终止进程..."

    # 尝尝试温和终止
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

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "未找到 node_modules，正在安装依赖..."
    npm install
fi

# 启动前端服务
echo ""
echo "=========================================="
echo "启动前端服务..."
echo "=========================================="
echo "地址: http://localhost:${PORT}"
echo "按 Ctrl+C 停止服务"
echo "=========================================="
echo ""

# 启动服务
cd frontend
npm run dev -- --host ${HOST} --port ${PORT}
