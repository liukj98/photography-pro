#!/bin/bash

# 部署到云服务器的自动化脚本
# 使用方法: ./deploy/deploy.sh <服务器IP> [用户名]
# 示例: ./deploy/deploy.sh 10.18.12.19 root

set -e  # 遇到错误立即退出

# 检查参数
if [ $# -lt 1 ]; then
    echo "❌ 错误: 请提供服务器 IP 地址"
    echo ""
    echo "用法:"
    echo "  ./deploy/deploy.sh <服务器IP> [用户名]"
    echo ""
    echo "示例:"
    echo "  ./deploy/deploy.sh 10.18.12.19"
    echo "  ./deploy/deploy.sh 10.18.12.19 root"
    echo ""
    exit 1
fi

# 配置变量
SERVER_IP="$1"
SERVER_USER="${2:-root}"  # 默认为 root，可通过第二个参数指定
REMOTE_PATH="/var/www/photography-pro"
LOCAL_DIST="dist"

# 检查是否配置了 SSH 密钥免密登录
echo ""
echo "🔐 检查 SSH 连接..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
    echo "⚠️  未配置 SSH 免密登录，将使用密码登录"
    echo "💡 建议配置 SSH 密钥免密登录:"
    echo "   ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
    echo ""
    SSH_USE_PASSWORD=true
else
    echo "✅ SSH 免密登录已配置"
    SSH_USE_PASSWORD=false
fi

echo "================================================"
echo "  Photography Pro - 部署脚本"
echo "  目标服务器: $SERVER_IP"
echo "================================================"

# 步骤 1: 构建生产版本
echo ""
echo "📦 [1/5] 构建生产版本..."
npm run build

# 检查构建是否成功
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ 构建失败: dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# 步骤 2: 创建远程目录
echo ""
echo "📁 [2/5] 创建远程目录..."
if [ "$SSH_USE_PASSWORD" = true ]; then
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}"
else
    ssh -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}"
fi

# 步骤 3: 上传文件
echo ""
echo "🚀 [3/5] 上传文件到服务器..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env*' \
    ${LOCAL_DIST}/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/dist/

# 步骤 4: 上传 Nginx 配置
echo ""
echo "⚙️  [4/5] 上传 Nginx 配置..."

# 检测服务器 Nginx 配置目录类型
if [ "$SSH_USE_PASSWORD" = true ]; then
    NGINX_CONF_DIR=$(ssh ${SERVER_USER}@${SERVER_IP} "if [ -d /etc/nginx/conf.d ]; then echo 'conf.d'; elif [ -d /etc/nginx/sites-available ]; then echo 'sites-available'; else echo 'default'; fi")
else
    NGINX_CONF_DIR=$(ssh -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "if [ -d /etc/nginx/conf.d ]; then echo 'conf.d'; elif [ -d /etc/nginx/sites-available ]; then echo 'sites-available'; else echo 'default'; fi")
fi

if [ "$NGINX_CONF_DIR" = "conf.d" ]; then
    # CentOS/TencentOS 风格
    rsync -avz deploy/nginx.conf ${SERVER_USER}@${SERVER_IP}:/etc/nginx/conf.d/photography-pro.conf
    echo "✅ 已上传到 /etc/nginx/conf.d/photography-pro.conf"
elif [ "$NGINX_CONF_DIR" = "sites-available" ]; then
    # Ubuntu/Debian 风格
    rsync -avz deploy/nginx.conf ${SERVER_USER}@${SERVER_IP}:/etc/nginx/sites-available/photography-pro
    ssh ${SERVER_USER}@${SERVER_IP} "ln -sf /etc/nginx/sites-available/photography-pro /etc/nginx/sites-enabled/photography-pro"
    echo "✅ 已上传到 /etc/nginx/sites-available/photography-pro"
else
    echo "⚠️  未检测到标准 Nginx 配置目录,请手动配置"
    exit 1
fi

# 步骤 5: 在服务器上执行配置
echo ""
echo "🔧 [5/5] 配置 Nginx..."

# 构建 SSH 命令参数
SSH_OPTS=""
if [ "$SSH_USE_PASSWORD" = false ]; then
    SSH_OPTS="-o BatchMode=yes"
fi

ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # 测试 Nginx 配置
    nginx -t
    
    # 重启 Nginx
    systemctl reload nginx
    
    echo "✅ Nginx 配置完成"
ENDSSH

echo ""
echo "================================================"
echo "✅ 部署完成!"
echo "================================================"
echo ""
echo "访问地址: http://$SERVER_IP"
echo ""
echo "提示:"
echo "  - 如果无法访问,请检查服务器防火墙是否开放 80 端口"
echo "  - 查看 Nginx 日志: tail -f /var/log/nginx/photography-pro.error.log"
echo ""

# 如果使用了密码登录，提示配置免密登录
if [ "$SSH_USE_PASSWORD" = true ]; then
    echo "💡 建议配置 SSH 密钥免密登录，下次部署无需输入密码:"
    echo "   1. 生成密钥对(如果还没有): ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "   2. 上传公钥到服务器: ssh-copy-id ${SERVER_USER}@${SERVER_IP}"
    echo "   3. 测试免密登录: ssh ${SERVER_USER}@${SERVER_IP}"
    echo ""
fi
