const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
  credentials: true
}));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/diaries', require('./routes/diaries'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/memorials', require('./routes/memorials'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/messages', require('./routes/messages'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404处理
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: '接口不存在'
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('Global error:', error);

  // Multer错误处理
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: '文件大小超出限制 (最大10MB)'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: '文件数量超出限制 (最多5个文件)'
    });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : error.message
  });
});

// 数据库连接和启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步数据库模型
    await sequelize.sync({ force: false });
    console.log('数据库同步完成');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;