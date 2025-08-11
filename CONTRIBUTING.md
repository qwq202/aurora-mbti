# 贡献指南

感谢你对 Aurora MBTI 项目的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告Bug
- 使用 [Issue模板] 报告Bug
- 提供详细的复现步骤
- 包含错误日志和环境信息

### 功能建议
- 在Issues中描述新功能的需求和用例
- 讨论实现方案
- 考虑向后兼容性

### 提交代码
1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 确保代码通过测试和检查
4. 提交更改: `git commit -m 'Add amazing feature'`
5. 推送到分支: `git push origin feature/amazing-feature`
6. 创建 Pull Request

## 💻 开发环境

### 本地开发设置
```bash
# 克隆项目
git clone <your-fork>
cd mbti-app

# 安装依赖
pnpm install

# 配置环境变量
cp env.template .env.local
# 编辑 .env.local

# 启动开发服务器
pnpm dev
```

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式写法
- 保持代码整洁和注释清晰

### 测试
```bash
# 运行类型检查
pnpm type-check

# 运行linting
pnpm lint

# 构建测试
pnpm build
```

## 📋 提交规范

使用语义化的提交消息：
- `feat:` 新功能
- `fix:` 修复Bug
- `docs:` 文档更新  
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建工具或依赖更新

示例：
```
feat: 添加AI题目生成超时重试机制
fix: 修复测试页面题库切换缓存问题
docs: 更新Docker部署文档
```

## 🎯 开发优先级

当前需要帮助的领域：
- 🌍 国际化支持
- 📱 移动端体验优化
- 🔧 更多AI模型支持
- 📊 数据分析功能
- 🎨 主题定制功能

## ❓ 需要帮助？

- 查看现有 [Issues](../../issues)
- 在 [Discussions](../../discussions) 中讨论
- 阅读项目文档

再次感谢你的贡献！🙏
