const http = require('http');
const url = require('url');

const PORT = 3001;

// 简单的CORS处理
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 解析JSON请求体
function parseJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 发送JSON响应
function sendJSON(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data, null, 2));
}

// 模拟数据存储
let mockData = {
  diaries: [],
  photos: [],
  memorials: [],
  todos: [],
  messages: []
};

// 创建服务器
const server = http.createServer(async (req, res) => {
  setCORS(res);

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${path}`);

  try {
    // 健康检查
    if (path === '/api/health') {
      return sendJSON(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        message: '爱情网站 API 测试服务正常运行'
      });
    }

    // 登录接口
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseJSON(req);
      const { password } = body;

      if (password === 'love2024') {
        return sendJSON(res, {
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
        return sendJSON(res, { error: '密码错误' }, 401);
      }
    }

    // 用户信息接口
    if (path === '/api/auth/profile' && method === 'GET') {
      return sendJSON(res, {
        success: true,
        user: {
          id: 1,
          username: 'couple',
          person1Name: '包胡呢斯图',
          person2Name: '张萨出拉',
          loveStartDate: '2023-09-09'
        }
      });
    }

    // 设置接口
    if (path === '/api/auth/settings' && method === 'PUT') {
      const body = await parseJSON(req);
      return sendJSON(res, {
        success: true,
        user: {
          id: 1,
          username: 'couple',
          person1Name: body.person1Name || '包胡呢斯图',
          person2Name: body.person2Name || '张萨出拉',
          loveStartDate: body.loveStartDate || '2023-09-09'
        }
      });
    }

    // 通用GET接口 - 获取数据
    if (method === 'GET' && path.startsWith('/api/')) {
      const resource = path.split('/')[2]; // diaries, photos, etc.

      if (mockData[resource]) {
        return sendJSON(res, {
          success: true,
          data: mockData[resource]
        });
      }
    }

    // 通用POST接口 - 创建数据
    if (method === 'POST' && path.startsWith('/api/')) {
      const resource = path.split('/')[2];
      const body = await parseJSON(req);

      if (mockData[resource] !== undefined) {
        const newItem = {
          id: Date.now(),
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        mockData[resource].push(newItem);

        return sendJSON(res, {
          success: true,
          data: newItem,
          message: '数据保存成功'
        }, 201);
      }
    }

    // 通用DELETE接口
    if (method === 'DELETE' && path.startsWith('/api/')) {
      const pathParts = path.split('/');
      const resource = pathParts[2];
      const id = parseInt(pathParts[3]);

      if (mockData[resource] !== undefined) {
        const index = mockData[resource].findIndex(item => item.id === id);
        if (index !== -1) {
          mockData[resource].splice(index, 1);
          return sendJSON(res, {
            success: true,
            message: '删除成功'
          });
        }
      }
    }

    // 特殊处理 - 待办事项切换
    if (path.includes('/todos/') && path.endsWith('/toggle') && method === 'PATCH') {
      const id = parseInt(path.split('/')[3]);
      const todo = mockData.todos.find(t => t.id === id);
      if (todo) {
        todo.isCompleted = !todo.isCompleted;
        todo.completedAt = todo.isCompleted ? new Date().toISOString() : null;
        return sendJSON(res, {
          success: true,
          data: todo
        });
      }
    }

    // 特殊处理 - 照片上传
    if (path === '/api/photos/upload' && method === 'POST') {
      // 模拟照片上传
      const photos = [
        {
          id: Date.now(),
          title: '测试照片',
          description: '这是一张测试照片',
          filename: 'test-photo.jpg',
          originalName: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024000,
          url: '/uploads/test-photo.jpg',
          thumbnailUrl: '/uploads/thumb_test-photo.jpg',
          uploadDate: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ];

      mockData.photos.push(...photos);

      return sendJSON(res, {
        success: true,
        data: photos,
        message: '照片上传成功'
      }, 201);
    }

    // 默认响应
    sendJSON(res, {
      success: false,
      error: '接口不存在',
      path: path,
      method: method
    }, 404);

  } catch (error) {
    console.error('服务器错误:', error);
    sendJSON(res, {
      error: '服务器内部错误',
      message: error.message
    }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`🚀 爱情网站测试服务器运行在端口 ${PORT}`);
  console.log(`💖 API测试服务启动成功`);
  console.log(`📍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🔐 登录测试: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`✨ 默认密码: love2024`);
  console.log(`\n📊 模拟数据存储:`);
  console.log(`   - 日记: ${mockData.diaries.length} 篇`);
  console.log(`   - 照片: ${mockData.photos.length} 张`);
  console.log(`   - 纪念日: ${mockData.memorials.length} 个`);
  console.log(`   - 待办: ${mockData.todos.length} 项`);
  console.log(`   - 悄悄话: ${mockData.messages.length} 条`);
  console.log(`\n🌐 前端测试地址: 请打开 http://localhost:8080`);
});