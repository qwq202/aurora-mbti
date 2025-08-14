# 🌟 Aurora MBTI - 新一代AI智能人格测试平台

> 基于最新AI技术的现代化MBTI人格测试应用，提供个性化出题、智能分析和完整的测试体验

Aurora MBTI 是一个功能完整的人格测试平台，结合了传统MBTI理论与现代AI技术，为用户提供准确、个性化、有深度的人格分析体验。

## ✨ 核心特色

### 🤖 智能化测试体验
- **AI个性化出题**: 根据用户职业、兴趣、年龄等背景信息生成专属题目
- **多种测试模式**: 支持AI模式(30/60/120题)，适应不同测试需求
- **流式生成**: 实时生成题目，提供平滑的用户体验
- **进度恢复**: 智能保存测试进度，支持跨设备无缝继续

### 🎯 专业分析系统
- **AI深度分析**: GPT驱动的性格特征分析，提供专业建议
- **可视化图表**: 雷达图、条形图等多维度展示性格维度
- **详细报告**: 包含性格描述、优势、建议、职业匹配等
- **可信度评估**: 基于答题模式分析结果可信度

### 🔄 完整功能生态
- **用户档案**: 详细的个人信息管理，支持社交偏好设置
- **历史记录**: 完整的测试历史，支持结果对比和趋势分析
- **类型百科**: 16种MBTI类型的详细介绍和特征说明
- **隐私保护**: 所有数据本地存储，确保用户隐私安全

### 🛠️ 技术优势
- **现代技术栈**: Next.js 15 + React 18 + TypeScript
- **响应式设计**: 完美适配桌面端和移动端
- **性能优化**: 懒加载、代码分割、缓存策略
- **多端部署**: 支持Docker、静态部署、CDN等多种方式

## 🚀 在线体验

**官方演示**: [https://mbti.qunqin.net](https://mbti.qunqin.net)

体验最新功能，包括AI智能出题和完整的测试流程。

## 📸 应用截图

### 首页
<img width="1380" height="764" alt="image" src="https://github.com/user-attachments/assets/36339887-5553-41bc-a1bc-e257036c4f8d" />

### AI测试流程
<img width="1380" height="762" alt="image" src="https://github.com/user-attachments/assets/7d66c9b0-b94e-47ec-bc26-010d41276101" />

<img width="1380" height="762" alt="image" src="https://github.com/user-attachments/assets/5f44c9a0-06f4-4872-bd51-6ac4368d134e" />

### 结果分析
<img width="1380" height="768" alt="image" src="https://github.com/user-attachments/assets/948525d8-9a1a-47eb-9f23-a5fe49d2912a" />

## 🛠️ 技术栈

### 前端技术
- **框架**: Next.js 15 + React 18 + TypeScript
- **样式**: Tailwind CSS + CSS Modules
- **UI组件**: Radix UI + shadcn/ui
- **图标**: Lucide React
- **字体**: Geist Sans + Geist Mono
- **图表**: 自定义雷达图和条形图组件
- **动画**: CSS Transitions + Framer Motion

### 后端与AI
- **API路由**: Next.js App Router API
- **AI模型**: OpenAI GPT-4/GPT-3.5 兼容API
- **流式响应**: Server-Sent Events
- **数据存储**: 本地 localStorage + IndexedDB

### 开发与部署
- **包管理**: pnpm
- **代码规范**: ESLint + Prettier
- **构建工具**: Next.js + Turbopack
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **部署方式**: Docker Hub + 静态部署 + CDN

## ⚡ 快速开始

### 方法一：Docker Hub镜像部署 (推荐)

直接使用预构建的Docker镜像，无需下载源码：

```bash
docker run -d -p 3000:3000 --name MBTI \
  -e OPENAI_API_URL=your-api-url \
  -e OPENAI_API_KEY=your-api-key \
  -e OPENAI_MODEL=moonshotai/kimi-k2 \
  qunqin45/aurora-mbti:latest
```

**参数说明：**
- `OPENAI_API_URL`: AI服务API地址
- `OPENAI_API_KEY`: API密钥
- `OPENAI_MODEL`: 使用的模型（支持OpenAI兼容模型）

**访问应用：** `http://localhost:3000`

### 方法二：源码构建部署

1. **克隆项目**
```bash
git clone https://github.com/qwq202/aurora-mbti.git
cd aurora-mbti
```

2. **配置环境变量**
```bash
cp env.template .env.local
# 编辑 .env.local，填入你的API配置
```

3. **构建并运行**
```bash
docker build -t aurora-mbti .
docker run -d -p 3000:3000 --name MBTI \
  --env-file .env.local \
  aurora-mbti
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

## 🔄 最新更新

### v2024.08 - AI测试体验重大升级

#### ✅ 核心功能优化
- **AI测试进度恢复** - 彻底修复进度丢失问题，支持无缝继续测试
- **智能题目生成** - 优化AI出题算法，提供更加个性化的测试体验
- **流式响应优化** - 改进AI生成的稳定性和错误处理机制
- **用户体验提升** - 优化页面加载速度和交互响应

#### 🎯 新增功能
- **历史记录系统** - 完整的测试历史查看和对比功能
- **性能监控** - 实时监控应用性能，确保最佳用户体验
- **可视化图表** - 新增自定义雷达图和条形图组件
- **延迟加载** - 优化资源加载，提升页面响应速度

#### 🛠️ 技术改进
- **代码重构** - 优化组件结构，提高代码维护性
- **类型安全** - 增强TypeScript类型定义，减少运行时错误
- **缓存策略** - 智能缓存机制，避免数据丢失
- **错误处理** - 完善错误边界和异常恢复机制

#### 🐛 问题修复
- 修复AI测试模式进度恢复失败的时序问题
- 解决空答案状态覆盖已有缓存的bug
- 修复题目ID不一致导致的匹配失败
- 优化答案加载逻辑，确保在题目加载完成后进行

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
