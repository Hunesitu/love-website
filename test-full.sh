#!/bin/bash

echo "🚀 启动完整的前后端测试环境..."

# 检查后端服务是否已启动
if ! curl -s http://localhost:3001/api/health >/dev/null; then
    echo "📱 启动后端测试服务..."
    node test-server-simple.js &
    BACKEND_PID=$!
    echo "后端服务 PID: $BACKEND_PID"

    # 等待后端启动
    echo "⏳ 等待后端服务启动..."
    sleep 3
else
    echo "✅ 后端服务已在运行"
fi

# 启动前端服务
echo "🌐 启动前端服务..."

# 使用 Python 的内置HTTP服务器
python -m http.server 8080 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

echo ""
echo "✅ 测试环境启动完成！"
echo ""
echo "📋 服务信息:"
echo "   🌐 前端: http://localhost:8080"
echo "   🖥️  后端: http://localhost:3001"
echo "   💖 API健康: http://localhost:3001/api/health"
echo ""
echo "🔐 测试账号:"
echo "   密码: love2024"
echo ""
echo "📊 功能测试:"
echo "   1. 打开 http://localhost:8080"
echo "   2. 使用密码 'love2024' 登录"
echo "   3. 测试添加日记、照片、纪念日等功能"
echo "   4. 检查数据是否正常保存和显示"
echo ""
echo "🛑 按 Ctrl+C 停止所有服务"

# 保持脚本运行
wait