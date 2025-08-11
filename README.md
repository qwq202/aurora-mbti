# 🌟 Aurora MBTI - AI智能人格测试应用

基于AI技术的现代化MBTI人格测试平台，支持个性化出题和智能结果分析。

## ✨ 功能特色

- 🤖 **AI智能出题**: 基于个人背景生成个性化测试题目
- 🎯 **精准分析**: AI深度解析性格特征，提供专业建议
- 📱 **响应式设计**: 完美支持PC和移动设备
- 🔒 **隐私保护**: 数据仅存储在本地，保护用户隐私
- ⚡ **快速部署**: 支持Docker一键部署
- 🎨 **现代UI**: 基于Tailwind CSS的精美界面

## 🚀 在线体验

[点击体验在线版本](https://your-domain.com) （如果你已部署）

## 📸 应用截图

### 首页
![首页截图](public/screenshot-home.png)

### AI测试流程
![测试流程](public/screenshot-test.png)

### 结果分析
![结果分析](public/screenshot-result.png)

## 🛠️ 技术栈

- **前端框架**: Next.js 15 + React 18
- **样式系统**: Tailwind CSS
- **UI组件**: Radix UI
- **图标**: Lucide React
- **字体**: Geist Font
- **AI集成**: OpenAI 兼容 API
- **部署**: Docker + Nginx

## ⚡ 快速开始

### 方法一：Docker部署 (推荐)

1. **克隆项目**
```bash
git clone <repository-url>
cd mbti-app
```

2. **配置环境变量**
```bash
cp env.template .env.local
# 编辑 .env.local，填入你的API配置
```

3. **一键部署**
```bash
chmod +x docker-build.sh
./docker-build.sh
docker-compose up -d
```

4. **访问应用**
```
http://localhost:3000
```

### 方法二：本地开发

1. **安装依赖**
```bash
npm install
# 或
pnpm install
# 或
yarn install
```

2. **配置环境变量**
```bash
cp env.template .env.local
# 编辑 .env.local
```

3. **启动开发服务器**
```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

4. **访问应用**
```
http://localhost:3000
```

## 🔧 环境配置

### API服务商支持

本应用支持任何兼容OpenAI格式的API服务，包括：

#### OpenAI官方
```env
OPENAI_API_URL=https://api.openai.com
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo
```

#### 月之暗面 (Moonshot AI)
```env
OPENAI_API_URL=https://api.moonshot.cn
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
OPENAI_MODEL=moonshot-v1-8k
```

#### Azure OpenAI
```env
OPENAI_API_URL=https://your-resource.openai.azure.com
OPENAI_API_KEY=your-azure-key
OPENAI_MODEL=gpt-35-turbo
```

#### 智谱AI (GLM)
```env
OPENAI_API_URL=https://open.bigmodel.cn/api/paas/v4
OPENAI_API_KEY=your-zhipu-key
OPENAI_MODEL=glm-4
```

#### 阿里云通义千问
```env
OPENAI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_API_KEY=your-dashscope-key
OPENAI_MODEL=qwen-plus
```

### 模型要求

为了获得最佳体验，推荐使用：
- 支持较长context window的模型（8k+ tokens）
- 中文理解能力较强的模型
- 稳定可靠的API服务

## 📦 部署选项

### Docker部署 (推荐)

**优势**:
- 一键部署，环境一致
- 包含Nginx反向代理
- 支持健康检查
- 生产就绪

**步骤**:
```bash
# 构建并启动
./docker-build.sh
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 传统部署

**构建生产版本**:
```bash
npm run build
npm start
```

### 静态部署

**导出静态文件**:
```bash
npm run build
# 文件将输出到 ./out 目录
```

适用于：Netlify, Vercel, GitHub Pages等静态托管平台

## 🔍 健康监控

### 健康检查端点
```bash
curl http://localhost:3000/api/health
```

### 日志监控
```bash
# Docker部署
docker-compose logs -f mbti-app

# 本地部署
tail -f logs/app.log
```

## ⚙️ 高级配置

### Nginx配置

如使用Docker完整模式，Nginx提供：
- 静态资源缓存
- API速率限制
- 安全头部
- SSL支持

### 性能优化

- 启用了代码分割和Tree Shaking
- 图片和字体预加载
- 生产环境移除console日志
- Gzip压缩

### 安全配置

- CSP安全策略
- XSS防护
- 数据本地存储
- API密钥安全管理

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置

1. Fork项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 提交前运行测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙋‍♂️ 常见问题

### Q: 如何更换API服务商？

A: 修改 `.env.local` 文件中的API配置即可，支持任何OpenAI兼容的API。

### Q: AI生成题目需要多长时间？

A: 通常需要30秒到5分钟，取决于API服务商的响应速度。

### Q: 数据是否会被保存到服务器？

A: 不会，所有用户数据仅保存在浏览器本地，保护隐私安全。

### Q: 可以自定义测试题目吗？

A: 可以，通过修改 `lib/mbti.ts` 中的题库配置。

### Q: 支持其他语言吗？

A: 当前仅支持中文，欢迎贡献国际化版本。

## 📞 支持

如遇到问题，请：

1. 查看 [常见问题](#常见问题)
2. 搜索现有 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

## 🎉 鸣谢

感谢所有贡献者和以下开源项目：

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide](https://lucide.dev/)

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！
