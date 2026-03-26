# 项目协作约定

## 项目简介

Aurora MBTI 是一个基于 Next.js App Router 的 MBTI 测试与 AI 解读应用。

- **在线演示**：https://mbti.qunqin.net

## 技术栈

- **框架**：Next.js 16 + React 19 + TypeScript（App Router）
- **样式**：Tailwind CSS + shadcn/ui（Radix UI）
- **AI**：支持 12 种提供商（OpenAI、Gemini、DeepSeek、Anthropic、OpenRouter 等）
- **多语言**：next-intl（zh/en/ja 三语）
- **图表**：Recharts

## 项目结构

```
├── app/
│   ├── [locale]/           # 国际化路由 (zh/en/ja)
│   │   ├── test/           # MBTI 测试页面
│   │   ├── result/         # 结果页面
│   │   ├── profile/        # 用户档案
│   │   ├── history/        # 历史记录
│   │   ├── admin/          # 后台管理
│   │   └── types/          # MBTI 类型展示
│   └── api/
│       ├── generate-*/     # AI 生成相关 API
│       └── admin/          # 后台管理 API
├── lib/
│   ├── mbti-*.ts           # MBTI 核心逻辑
│   ├── ai-*.ts            # AI 提供方封装
│   └── *-store.ts         # 状态存储
├── i18n/                   # 国际化配置
└── messages/              # 翻译文件
```

## 核心模块

1. **MBTI 测试**：120 题（每维度 30 题），Likert 7 点量表，答案质量检测
2. **AI 分析**：流式输出（SSE/NDJSON）、结构化 JSON Schema、Robust 客户端
3. **用户档案**：localStorage 持久化，个性化权重计算
4. **后台管理**：AI 渠道配置（Base URL/模型/API Key 加密存储）、运行时监控、连通测试

## 通用约定

- 注释请使用中文。
- 代码风格遵循项目现有模式，使用现有的工具库和工具函数。
- 提交前运行 `pnpm lint` 进行类型检查和 lint。
- 不要主动提交更改，除非用户明确要求。

## 多 Agent 协作流程

当需要多个 agent 协作完成复杂任务时，按以下流程进行：

### 1. 任务分解与规划

使用 `brainstorming` skill 分析需求，将复杂任务拆分为独立的子任务，明确每个 agent 的职责范围。

### 2. Agent 分配原则

- **explore agent**：用于探索代码库、搜索文件、理解代码结构
- **general agent**：用于执行具体开发任务，如编写代码、修改文件
- 避免多个 agent 同时修改同一文件，优先分配不相关的文件给不同 agent
- 每个任务完成后，汇总结果并更新进度

### 3. 任务分配示例

复杂功能实现场景：
1. 使用 `explore agent` 理解现有代码结构和模式
2. 使用 `general agent` 编写新功能代码
3. 由主 agent 整合各 agent 的工作成果

### 4. 沟通与汇总

- 各 agent 完成任务后，主 agent 负责汇总结果
- 向用户汇报整体进度和完成状态
