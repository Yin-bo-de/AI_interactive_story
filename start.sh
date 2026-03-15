#!/bin/bash

# 幻境回响 - 前后端一键启动脚本
# 功能：同时启动后端和前端服务

echo "=========================================="
echo "幻境回响 - 前后端服务启动"
echo "=========================================="

# 配置
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
BACKEND_HOST=${BACKEND_HOST:-0.0.0.0}
PYTHON_CMD=${PYTHON_CMD:-python}

# 临时日志目录
LOG_DIR="logs/startup"
mkdir -p "$LOG_DIR"

# 函数：杀死指定端口的进程
kill_port_process() {
    local port=$1
    local service_name=$2

    echo "检查端口 ${port} 是否被占用..."
    local pid=$(lsof -ti:${port} 2>/dev/null)

    if [ -n "$pid" ]; then
        echo "发现进程 ${pid} 正在占用端口 ${port} (${service_name})"
        echo "正在终止进程..."

        # 尝试温和终止
        kill $pid 2>/dev/null

        # 等待进程结束
        for i in {1..10}; do
            if ! kill -0 $pid 2>/dev/null; then
                echo "进程已成功终止"
                break
            fi
            echo "等待进程结束... ($i/10)"
            sleep 1
        done

        # 如果进程仍在运行，强制终止
        if kill -0 $pid 2>/dev/null; then
            echo "进程未响应，强制终止..."
            kill -9 $pid 2>/dev/null
            sleep 1
        fi

        echo "端口 ${port} 已释放"
        return 0
    else
        echo "端口 ${port} 未被占用"
        return 1
    fi
}

# 处理后端端口
echo ""
echo "【后端服务】"
echo "=========================================="
kill_port_process $BACKEND_PORT "后端服务"

# 处理前端端口
echo ""
echo "【前端服务】"
echo "=========================================="
kill_port_process $FRONTEND_PORT "前端服务"

# 检查虚拟环境
echo ""
echo "【环境检查】"
echo "=========================================="
if [ -d "venv" ]; then
    echo "✓ 找到虚拟环境 venv/"
else
    echo "✗ 未找到虚拟环境 venv/"
    echo "请先运行: python -m venv venv"
    exit 1
fi

# 检查日志目录
if [ ! -d "log" ]; then
    echo "创建日志目录..."
    mkdir -p log
fi

# 检查 node_modules
if [ ! -d "frontend/node_modules" ]; then
    echo "未找到 frontend/node_modules，正在安装依赖..."
    cd frontend
    npm install
    cd ..
fi

# 启动后端服务（后台）
echo ""
echo "【启动后端服务】"
echo "=========================================="
echo "地址: http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "API文档: http://localhost:${BACKEND_PORT}/docs"

source venv/bin/activate
cd backend
nohup $PYTHON_CMD main.py > "../$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"
echo "日志文件: $LOG_DIR/backend.log"
cd ..

# 等待后端启动
echo "等待后端服务启动..."
for i in {1..10}; do
    if curl -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
        echo "✓ 后端服务已就绪"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "✗ 后端服务启动超时，请检查日志"
        echo "tail -f $LOG_DIR/backend.log"
    fi
    sleep 1
done

# 启动前端服务（后台）
echo ""
echo "【启动前端服务】"
echo "=========================================="
echo "地址: http://localhost:${FRONTEND_PORT}"

cd frontend
nohup npm run dev > "../$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"
echo "日志文件: $LOG_DIR/frontend.log"
cd ..

# 等待前端启动
echo "等待前端服务启动..."
for i in {1..10}; do
    if curl -s "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; then
        echo "✓ 前端服务已就绪"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "前端服务可能仍在启动中"
    fi
    sleep 1
done

# 显示启动信息
echo ""
echo "=========================================="
echo "✓ 所有服务已启动！"
echo "=========================================="
echo ""
echo "服务信息："
echo "  后端服务:"
echo "    地址: http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "    API文档: http://localhost:${BACKEND_PORT}/docs"
echo "    PID: $BACKEND_PID"
echo "    日志: $LOG_DIR/backend.log"
echo ""
echo "  前端服务:"
echo "    地址: http://localhost:${FRONTEND_PORT}"
echo "    PID: $FRONTEND_PID"
echo "    日志: $LOG_DIR/frontend.log"
echo ""
echo "停止服务命令："
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  或运行: ./stop.sh"
echo ""
echo "查看日志："
echo "  后端: tail -f $LOG_DIR/backend.log"
echo "  前端: tail -f $LOG_DIR/frontend.log"
echo "=========================================="

# 保存 PID 到文件
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

# 等待用户输入停止
echo ""
echo "按 Ctrl+C 或输入 'stop' 停止所有服务..."

while true; do
    read -t 1 input
    if [ "$input" = "stop" ]; then
        echo ""
        echo "正在停止服务..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        wait
        echo "✓ 所有服务已停止"
        exit 0
    fi

    # 检查进程是否还在运行
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo ""
        echo "✗ 后端服务已异常停止"
        echo "查看日志: tail -f $LOG_DIR/backend.log"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo ""
        echo "✗ 前端服务已异常停止"
        echo "查看日志: tail -f $LOG_DIR/frontend.log"
        break
    fi
done
