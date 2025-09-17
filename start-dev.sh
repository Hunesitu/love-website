#!/bin/bash

# 本地开发环境启动脚本

set -e

echo "🚀 启动爱情网站本地开发环境..."

# 检查依赖
check_dependencies() {
    command -v node >/dev/null 2>&1 || { echo "请先安装 Node.js"; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo "请先安装 npm"; exit 1; }
    command -v mysql >/dev/null 2>&1 || echo "⚠️  警告: 未检测到 MySQL，将使用SQLite"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装后端依赖..."
    cd server
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    cd ..
}

# 设置数据库
setup_database() {
    echo "🗄️ 设置数据库..."

    # 检查是否有MySQL
    if command -v mysql >/dev/null 2>&1; then
        echo "使用 MySQL 数据库"
        # 创建数据库（如果不存在）
        mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS love_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
            echo "创建数据库时出错，请确保MySQL正在运行并且可以连接"
        }
    else
        echo "使用文件数据库进行开发"
    fi
}

# 启动后端服务
start_backend() {
    echo "🖥️ 启动后端服务..."
    cd server

    # 检查环境配置文件
    if [ ! -f ".env" ]; then
        echo "创建开发环境配置文件..."
        cp .env.example .env
    fi

    # 使用开发模式启动
    npm run dev &
    BACKEND_PID=$!

    echo "后端服务已启动 (PID: $BACKEND_PID)"
    echo "后端地址: http://localhost:3000"

    cd ..
}

# 启动前端服务
start_frontend() {
    echo "🌐 启动前端服务..."

    # 检查是否安装了http-server
    if ! command -v http-server >/dev/null 2>&1; then
        echo "安装 http-server..."
        npm install -g http-server
    fi

    # 启动前端服务
    http-server . -p 8080 -o &
    FRONTEND_PID=$!

    echo "前端服务已启动 (PID: $FRONTEND_PID)"
    echo "前端地址: http://localhost:8080"
}

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "后端服务已停止"
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "前端服务已停止"
    fi

    # 停止可能的nodemon进程
    pkill -f "nodemon" 2>/dev/null || true

    echo "清理完成"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    check_dependencies
    install_dependencies
    setup_database
    start_backend

    # 等待后端启动
    echo "⏳ 等待后端服务启动..."
    sleep 5

    start_frontend

    echo ""
    echo "✅ 开发环境启动完成！"
    echo ""
    echo "📋 服务信息:"
    echo "   前端: http://localhost:8080"
    echo "   后端: http://localhost:3000"
    echo "   API健康检查: http://localhost:3000/api/health"
    echo ""
    echo "💡 使用说明:"
    echo "   - 前端会自动打开浏览器"
    echo "   - 修改后端代码会自动重启服务"
    echo "   - 按 Ctrl+C 停止所有服务"
    echo ""
    echo "📊 监控命令:"
    echo "   - 查看后端日志: cd server && npm run dev"
    echo "   - 手动重启后端: cd server && npm start"
    echo ""

    # 保持脚本运行
    wait
}

# 运行主函数
main