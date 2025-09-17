const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 基本中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: '爱情网站 API 服务正常运行'
  });
});

// 模拟认证接口
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;

  if (password === 'love2024') {
    res.json({
      success: true,
      token: 'mock-jwt-token-for-testing',
      user: {
        id: 1,
        username: 'couple',
        person1Name: '包胡呢斯图',
        person2Name: '张萨出拉',
        loveStartDate: '2023-09-09'
      }
    });
  } else {
    res.status(401).json({
      error: '密码错误'
    });
  }
});

// 模拟其他API
app.get('/api/*', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: '这是一个模拟API响应'
  });
});

app.post('/api/*', (req, res) => {
  res.json({
    success: true,
    message: '数据保存成功（模拟）'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 测试服务器运行在端口 ${PORT}`);
  console.log(`💖 爱情网站API测试服务启动成功`);
  console.log(`📍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🔐 登录测试: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`✨ 默认密码: love2024`);
});