# 爱情网站 - 腾讯云服务器部署指南

## 📋 部署概览

本指南将帮助您将爱情网站部署到腾讯云服务器，支持用户认证、数据持久化和文件上传功能。

## 🏗️ 架构说明

**前端**: HTML + CSS + JavaScript (API调用版本)
**后端**: Node.js + Express + MySQL
**文件存储**: 本地存储 (可升级为腾讯云COS)
**反向代理**: Nginx
**进程管理**: PM2

## 🚀 快速部署

### 1. 准备腾讯云服务器

- **配置要求**: 1核2G内存，40G硬盘
- **操作系统**: Ubuntu 20.04 LTS
- **网络**: 开放80、443、3000端口

### 2. 执行一键部署

```bash
# 上传代码到服务器
scp -r . root@your-server-ip:/tmp/love-website/

# 连接到服务器
ssh root@your-server-ip

# 移动代码到项目目录
mv /tmp/love-website /var/www/

# 执行部署脚本
cd /var/www/love-website
chmod +x deploy.sh
sudo ./deploy.sh
```

### 3. 完成配置

```bash
# 修改环境配置
nano /var/www/love-website/server/.env

# 修改数据库密码和JWT密钥
# 配置腾讯云COS信息（可选）

# 启动应用
cd /var/www/love-website
pm2 start ecosystem.config.js

# 检查状态
pm2 status
systemctl status nginx
```

### 4. 配置域名和SSL

```bash
# 修改Nginx配置中的域名
nano /etc/nginx/sites-available/love-website

# 重启Nginx
systemctl reload nginx

# 安装SSL证书（需要先将域名指向服务器IP）
cd /var/www/love-website
./setup-ssl.sh your-domain.com
```

## 💻 本地开发

### 快速启动
```bash
# 克隆代码
git clone <repository-url>
cd love-website

# 启动开发环境
chmod +x start-dev.sh
./start-dev.sh
```

### 手动启动
```bash
# 1. 安装后端依赖
cd server
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 3. 启动后端
npm run dev

# 4. 启动前端 (新终端)
cd ..
npx http-server . -p 8080
```

访问 http://localhost:8080

## 🗄️ 数据库配置

### MySQL设置 (生产环境)
```sql
CREATE DATABASE love_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'loveuser'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON love_website.* TO 'loveuser'@'localhost';
FLUSH PRIVILEGES;
```

### 环境变量配置
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=love_website
DB_USER=loveuser
DB_PASS=your_secure_password

JWT_SECRET=your_super_secret_jwt_key_change_in_production
DEFAULT_PASSWORD=love2024
```

## 🔧 API接口说明

### 认证接口
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取用户信息
- `PUT /api/auth/settings` - 更新用户设置

### 功能接口
- `GET/POST/PUT/DELETE /api/diaries` - 日记管理
- `GET/POST/DELETE /api/photos` - 照片管理
- `POST /api/photos/upload` - 照片上传
- `GET/POST/PUT/DELETE /api/memorials` - 纪念日管理
- `GET/POST/PUT/DELETE /api/todos` - 待办事项管理
- `PATCH /api/todos/:id/toggle` - 切换待办状态
- `GET/POST/PUT/DELETE /api/messages` - 悄悄话管理

### 文件服务
- `GET /uploads/*` - 静态文件访问

## 📊 监控和维护

### 日志查看
```bash
# 应用日志
pm2 logs love-website

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 系统监控日志
tail -f /var/log/love-website/monitor.log
```

### 应用管理
```bash
# 重启应用
pm2 restart love-website

# 更新代码
cd /var/www/love-website
./update.sh

# 备份数据库
mysqldump -u loveuser -p love_website > backup_$(date +%Y%m%d).sql
```

### 系统监控

系统已自动配置每5分钟检查一次服务状态，包括：
- PM2进程监控
- Nginx服务监控
- MySQL服务监控
- 磁盘空间检查
- 日志清理

## 🔒 安全配置

### 防火墙设置
```bash
ufw enable
ufw allow ssh
ufw allow 80
ufw allow 443
```

### Nginx安全头
已在配置中添加:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### 数据安全
- JWT token认证
- 密码bcrypt加密
- SQL注入防护
- 文件上传类型验证
- 请求频率限制

## 🔄 数据迁移

首次登录时，系统会自动检测localStorage中的旧数据并迁移到服务器：

1. 检测本地存储数据
2. 用户登录后自动迁移
3. 迁移完成后清理本地缓存

## 📱 功能特性

### 已实现功能
- ✅ 用户认证系统
- ✅ 爱情日记 (支持心情、天气标记)
- ✅ 照片上传和管理 (支持缩略图)
- ✅ 重要纪念日管理
- ✅ 待办事项管理
- ✅ 悄悄话留言
- ✅ 个性化设置
- ✅ 数据统计和最近动态
- ✅ 响应式设计

### 技术特色
- 🔐 JWT身份验证
- 🗄️ MySQL数据持久化
- 📁 文件上传与存储
- 🖼️ 图片压缩和缩略图
- 🚀 PM2进程管理
- 🌐 Nginx反向代理
- 📊 系统监控
- 🔒 安全防护

## ❗ 故障排除

### 常见问题

**1. 后端启动失败**
```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 检查环境变量
cd /var/www/love-website/server
cat .env

# 检查数据库连接
mysql -u loveuser -p love_website
```

**2. Nginx配置错误**
```bash
# 检查配置语法
nginx -t

# 检查站点配置
cat /etc/nginx/sites-available/love-website
```

**3. 文件上传失败**
```bash
# 检查目录权限
ls -la /var/www/love-website/uploads
chown -R www-data:www-data /var/www/love-website/uploads
```

**4. 数据库连接失败**
```bash
# 检查MySQL服务
systemctl status mysql

# 检查用户权限
mysql -u root -p
SHOW GRANTS FOR 'loveuser'@'localhost';
```

### 联系支持

如遇到问题，请检查：
1. 系统日志: `/var/log/love-website/`
2. 应用日志: `pm2 logs love-website`
3. Nginx日志: `/var/log/nginx/`

## 📚 更多资源

- [腾讯云CVM文档](https://cloud.tencent.com/document/product/213)
- [腾讯云COS文档](https://cloud.tencent.com/document/product/436)
- [Let's Encrypt证书](https://letsencrypt.org/)
- [PM2文档](https://pm2.keymetrics.io/)
- [Nginx文档](https://nginx.org/en/docs/)