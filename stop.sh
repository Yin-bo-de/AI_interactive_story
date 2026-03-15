#!/bin/bash

# 幻境回响 - 停止服务脚本
# 功能：停止所有启动的服务

echo "=========================================="
echo "幻境回响 - 停止服务"
echo "=========================================="

LOG_DIR="logs/startup"
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# 尝试从 PID 文件读取
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    echo "找到后端服务 PID: $BACKEND_PID"
fi

if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    echo "找到前端服务 PID: $FRONTEND_PID"
fi

# 停止后端服务
echo ""
echo "【停止后端服务】"
echo "=========================================="

if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
    echo "终止后端服务 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    sleep 1
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "强制终止..."
        kill -9 $BACKEND_PID 2>/dev/null
    fi
    echo "✓ 后端服务已停止"
    rm -f "$LOG_DIR/backend.pid"
else
    # 尝试通过端口查找进程
    PID=$(lsof -ti:${BACKEND_PORT} 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "发现进程 ${PID} 占用端口 ${BACKEND_PORT}"
        echo "终止进程..."
        kill $PID 2>/dev/null
        sleep 1
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
        fi
        echo "✓ 后端服务已停止"
    else
        echo "✓ 后端服务未运行"
    fi
fi

# 停止前端服务
echo ""
echo "【停止前端服务】"
echo "=========================================="

if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "终止前端服务 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    sleep 1
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "强制终止..."
        kill -9 $FRONTEND_PID 2>/dev/null
    fi
    echo "✓ 前端服务已停止"
    rm -f "$LOG_DIR/frontend.pid"
else
    # 尝试通过端口查找进程
    PID=$(lsof -ti:${FRONTEND_PORT} 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "发现进程 ${PID} 占用端口 ${FRONTEND_PORT}"
        echo "终止进程..."
        kill $PID 2>/dev/null
        sleep 1
        if kill -0 $PID 2>/dev/null; then
            kill -9 $PID 2>/dev/null
        fi
        echo "✓ 前端服务已停止"
    else
        echo "✓ 前端服务未运行"
    fi
fi

echo ""
echo "=========================================="
echo "✓ 所有服务已停止"
echo "=========================================="
