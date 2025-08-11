# 🐳 Docker部署指南

Aurora MBTI应用的完整Docker部署文档。

## 📋 预备条件

- Docker 20.10+
- Docker Compose 1.29+
- 至少2GB可用内存
- 环境变量配置文件

## 🚀 快速开始

### 1. 环境配置

确保 `.env.local` 文件存在并包含必要配置：

```bash
OPENAI_API_URL=https://api.qunqin.org
OPENAI_API_KEY=sk-Uetg4ZDkuI0xUXI2cdxsLyxLwtPFZTYtKwXdAH9Niu3qsE1l
OPENAI_MODEL=moonshotai/Kimi-k2-Instruct
```

### 2. 构建和启动

```bash
# 方法一：使用构建脚本
chmod +x docker-build.sh
./docker-build.sh
docker-compose up -d

# 方法二：手动构建
docker build -t mbti-app:latest .
docker-compose up -d
```

### 3. 访问应用

- **应用地址**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health
- **使用Nginx代理**: http://localhost (需启用proxy profile)

## 📁 文件结构

```
mbti-app/
├── Dockerfile                 # 主要Docker镜像配置
├── docker-compose.yml         # Docker Compose配置
├── .dockerignore             # Docker忽略文件
├── next.config.docker.mjs    # Docker专用Next.js配置
├── nginx.conf               # Nginx反向代理配置
├── docker-build.sh          # 构建脚本
└── DOCKER_DEPLOYMENT.md     # 本文档
```

## ⚙️ 部署模式

### 基础模式 (推荐)

仅启动Next.js应用：

```bash
docker-compose up -d mbti-app
```

特点：
- ✅ 简单快速
- ✅ 资源占用少
- ✅ 适合开发和小规模部署

### 完整模式 (生产环境)

启动应用 + Nginx反向代理：

```bash
docker-compose --profile proxy up -d
```

特点：
- ✅ 负载均衡
- ✅ 静态资源缓存
- ✅ 安全头部
- ✅ API速率限制
- ✅ SSL支持 (需配置证书)

## 🔧 配置选项

### Docker环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | production | Node.js环境 |
| `PORT` | 3000 | 应用端口 |
| `HOSTNAME` | 0.0.0.0 | 监听地址 |

### Docker Compose配置

修改 `docker-compose.yml` 中的以下选项：

```yaml
services:
  mbti-app:
    ports:
      - "3000:3000"  # 修改外部端口
    environment:
      - NODE_ENV=production
    restart: unless-stopped  # 重启策略
```

## 🔍 监控与调试

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mbti-app
docker-compose logs -f nginx
```

### 健康检查

```bash
# 检查容器状态
docker-compose ps

# 测试健康检查端点
curl http://localhost:3000/api/health

# 检查容器内部
docker-compose exec mbti-app sh
```

### 性能监控

```bash
# 查看资源使用
docker stats

# 查看容器详情
docker inspect mbti-app
```

## 🛠️ 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 修改docker-compose.yml中的端口映射
ports:
  - "3001:3000"  # 使用3001端口
```

**2. 环境变量未生效**
```bash
# 检查.env.local文件格式
cat .env.local

# 重新构建镜像
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**3. AI生成超时**
```bash
# 检查API连接
docker-compose exec mbti-app curl -I https://api.qunqin.org

# 查看API调用日志
docker-compose logs mbti-app | grep "generate-questions"
```

**4. 内存不足**
```bash
# 增加Docker内存限制
# 在docker-compose.yml中添加：
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

## 📊 生产部署建议

### 资源配置

- **CPU**: 最少1核，推荐2核+
- **内存**: 最少1GB，推荐2GB+
- **存储**: 最少5GB可用空间

### 安全配置

```bash
# 1. 使用非root用户运行
# (已在Dockerfile中配置)

# 2. 限制容器权限
docker run --security-opt no-new-privileges

# 3. 使用只读根文件系统
docker run --read-only --tmpfs /tmp
```

### SSL证书配置

如需HTTPS，将证书文件放在 `ssl/` 目录：

```
ssl/
├── cert.pem
└── key.pem
```

然后启用Nginx HTTPS配置。

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
./docker-build.sh

# 3. 滚动更新 (零停机)
docker-compose up -d --no-deps mbti-app
```

## 📝 备份与恢复

### 数据备份

```bash
# 导出应用配置
docker-compose config > backup-compose.yml

# 备份环境变量
cp .env.local backup-env.local
```

### 快速恢复

```bash
# 从备份恢复
cp backup-env.local .env.local
docker-compose -f backup-compose.yml up -d
```

## 🤝 支持

如遇到问题，请检查：

1. **日志文件**: `docker-compose logs -f`
2. **健康检查**: `curl http://localhost:3000/api/health`
3. **环境变量**: 确保API密钥正确
4. **网络连接**: 确保能访问AI API服务

---

🎉 **现在你的MBTI应用已经成功通过Docker部署！**
