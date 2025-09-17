#!/bin/bash

# 腾讯云服务器部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e

echo "🚀 开始部署爱情网站到腾讯云服务器..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="love-website"
SERVER_PORT=3000
NGINX_CONF_PATH="/etc/nginx/sites-available/${PROJECT_NAME}"
NGINX_ENABLED_PATH="/etc/nginx/sites-enabled/${PROJECT_NAME}"
PROJECT_PATH="/var/www/${PROJECT_NAME}"
BACKUP_PATH="/var/backups/${PROJECT_NAME}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 sudo 运行此脚本${NC}"
  exit 1
fi

# 1. 系统更新和基础软件安装
echo -e "${YELLOW}📦 更新系统并安装基础软件...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git nginx mysql-server nodejs npm supervisor ufw

# 2. 安装 Node.js 18 (如果当前版本过低)
echo -e "${YELLOW}📦 检查并安装 Node.js...${NC}"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "安装 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 3. 安装PM2
echo -e "${YELLOW}📦 安装 PM2...${NC}"
npm install -g pm2

# 4. 配置MySQL
echo -e "${YELLOW}🗄️ 配置 MySQL...${NC}"
systemctl start mysql
systemctl enable mysql

# 创建数据库和用户（如果不存在）
mysql -e "CREATE DATABASE IF NOT EXISTS love_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
mysql -e "CREATE USER IF NOT EXISTS 'loveuser'@'localhost' IDENTIFIED BY 'love2024secure';" 2>/dev/null || true
mysql -e "GRANT ALL PRIVILEGES ON love_website.* TO 'loveuser'@'localhost';" 2>/dev/null || true
mysql -e "FLUSH PRIVILEGES;" 2>/dev/null || true

# 5. 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p $PROJECT_PATH
mkdir -p $BACKUP_PATH
mkdir -p /var/log/love-website

# 6. 设置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow $SERVER_PORT

# 7. 创建Nginx配置
echo -e "${YELLOW}🌐 配置 Nginx...${NC}"
cat > $NGINX_CONF_PATH << 'EOL'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # 替换为你的域名

    # 静态文件
    location / {
        root /var/www/love-website/public;
        try_files $uri $uri/ /index.html;

        # 缓存静态资源
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 文件上传大小限制
        client_max_body_size 10M;
    }

    # 文件服务
    location /uploads/ {
        alias /var/www/love-website/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOL

# 启用站点
ln -sf $NGINX_CONF_PATH $NGINX_ENABLED_PATH
rm -f /etc/nginx/sites-enabled/default

# 8. 创建PM2配置文件
echo -e "${YELLOW}⚙️ 创建 PM2 配置...${NC}"
cat > $PROJECT_PATH/ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'love-website',
    script: 'server/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/love-website/combined.log',
    out_file: '/var/log/love-website/out.log',
    error_file: '/var/log/love-website/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOL

# 9. 创建部署脚本
echo -e "${YELLOW}📜 创建更新脚本...${NC}"
cat > $PROJECT_PATH/update.sh << 'EOL'
#!/bin/bash

# 爱情网站更新脚本
set -e

PROJECT_PATH="/var/www/love-website"
BACKUP_PATH="/var/backups/love-website"

echo "开始更新网站..."

# 备份当前版本
if [ -d "$PROJECT_PATH/server" ]; then
    echo "备份当前版本..."
    mkdir -p "$BACKUP_PATH/$(date +%Y%m%d_%H%M%S)"
    cp -r "$PROJECT_PATH/server" "$BACKUP_PATH/$(date +%Y%m%d_%H%M%S)/"
fi

# 更新代码 (假设使用git)
if [ -d "$PROJECT_PATH/.git" ]; then
    cd $PROJECT_PATH
    git pull origin main
else
    echo "请手动上传最新代码到 $PROJECT_PATH"
fi

# 安装依赖
cd $PROJECT_PATH/server
npm install --production

# 重启应用
pm2 restart love-website

# 重启nginx
systemctl reload nginx

echo "更新完成！"
EOL

chmod +x $PROJECT_PATH/update.sh

# 10. 创建SSL证书安装脚本
echo -e "${YELLOW}🔒 创建 SSL 配置脚本...${NC}"
cat > $PROJECT_PATH/setup-ssl.sh << 'EOL'
#!/bin/bash

# SSL证书安装脚本 (Let's Encrypt)
# 使用前请先将域名指向服务器IP

if [ "$#" -ne 1 ]; then
    echo "使用方法: ./setup-ssl.sh your-domain.com"
    exit 1
fi

DOMAIN=$1

# 安装certbot
apt update
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot

# 创建证书
certbot --nginx -d $DOMAIN -d www.$DOMAIN

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "SSL证书安装完成！"
EOL

chmod +x $PROJECT_PATH/setup-ssl.sh

# 11. 创建数据库配置文件
echo -e "${YELLOW}🗄️ 创建数据库配置...${NC}"
cat > $PROJECT_PATH/server/.env << 'EOL'
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=love_website
DB_USER=loveuser
DB_PASS=love2024secure

# JWT Secret - 请修改为随机字符串
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# 腾讯云COS配置
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
COS_REGION=ap-beijing
COS_BUCKET=your-bucket-name

# 默认用户配置
DEFAULT_PASSWORD=love2024
EOL

# 12. 设置目录权限
echo -e "${YELLOW}🔐 设置目录权限...${NC}"
chown -R www-data:www-data $PROJECT_PATH
chmod -R 755 $PROJECT_PATH
mkdir -p $PROJECT_PATH/uploads
chown -R www-data:www-data $PROJECT_PATH/uploads
chmod -R 775 $PROJECT_PATH/uploads

# 13. 创建系统服务监控脚本
echo -e "${YELLOW}📊 创建监控脚本...${NC}"
cat > /usr/local/bin/love-website-monitor.sh << 'EOL'
#!/bin/bash

# 系统监控脚本
LOG_FILE="/var/log/love-website/monitor.log"

# 检查PM2进程
if ! pm2 list | grep -q "love-website"; then
    echo "$(date): PM2 进程异常，正在重启..." >> $LOG_FILE
    cd /var/www/love-website
    pm2 start ecosystem.config.js
fi

# 检查Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx 服务异常，正在重启..." >> $LOG_FILE
    systemctl restart nginx
fi

# 检查MySQL
if ! systemctl is-active --quiet mysql; then
    echo "$(date): MySQL 服务异常，正在重启..." >> $LOG_FILE
    systemctl restart mysql
fi

# 清理日志文件（保留最近7天）
find /var/log/love-website -name "*.log" -mtime +7 -delete

# 磁盘空间检查
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): 磁盘空间使用率超过80%: ${DISK_USAGE}%" >> $LOG_FILE
fi
EOL

chmod +x /usr/local/bin/love-website-monitor.sh

# 添加到cron任务
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/love-website-monitor.sh") | crontab -

# 14. 重启服务
echo -e "${YELLOW}🔄 重启服务...${NC}"
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✅ 服务器基础环境部署完成！${NC}"
echo ""
echo "📝 下一步操作："
echo "1. 上传网站代码到: $PROJECT_PATH"
echo "2. 修改数据库配置: $PROJECT_PATH/server/.env"
echo "3. 修改Nginx配置中的域名: $NGINX_CONF_PATH"
echo "4. 安装SSL证书: ./setup-ssl.sh your-domain.com"
echo "5. 启动应用: cd $PROJECT_PATH && pm2 start ecosystem.config.js"
echo ""
echo "📊 监控命令:"
echo "- 查看应用状态: pm2 status"
echo "- 查看应用日志: pm2 logs love-website"
echo "- 查看Nginx日志: tail -f /var/log/nginx/access.log"
echo "- 查看系统监控: tail -f /var/log/love-website/monitor.log"
echo ""
echo -e "${GREEN}🎉 部署脚本执行完成！${NC}"