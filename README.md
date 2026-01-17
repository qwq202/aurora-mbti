# Aurora MBTI - AI

一个基于 Next.js App Router 的 MBTI 测试与 AI 解读应用：支持测试、结果页、个人档案、历史记录，以及 AI 生成题目/分析（含流式输出）。

## 在线演示

- https://mbti.qunqin.net

## 功能

- MBTI 测试流程：题目、进度、结果页
- AI 解读：结构化输出 + 流式输出（SSE/Streaming）
- 个人档案：用于个性化追问与分析
- 多语言：`next-intl`（路由位于 `app/[locale]`）
- 本地存储：`localStorage`（保存档案/历史等）

## 技术栈

- Next.js 16 + React 19 + TypeScript（App Router）
- Tailwind CSS + shadcn/ui（Radix UI）
- Lucide React（图标）
- pnpm
- Docker / Docker Compose（可选）

## 快速开始（本地开发）

1) 安装依赖
```bash
pnpm install
```

2) 配置环境变量
```bash
cp env.template .env.local
```

3) 启动开发环境
```bash
pnpm dev
```

打开：`http://localhost:3000`

## 环境变量（OpenAI Compatible）

项目通过 `OPENAI_API_URL + '/v1/chat/completions'` 调用接口，因此 `OPENAI_API_URL` 建议填「不带 `/v1`」的 base URL。

```env
OPENAI_API_URL=https://api.openai.com
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
```

## API 路由

- `GET /api/health`：健康检查（是否配置了 OpenAI 环境变量）
- `GET /api/debug/env`：调试环境变量（开发用）
- `POST /api/generate-questions-*`：生成题目（结构化/流式/更稳健版本）
- `POST /api/generate-analysis-*`：生成分析（结构化/流式/更稳健版本）
- `POST /api/generate-profile-followups`：基于用户档案生成追问

## Docker（可选）

```bash
docker build -t aurora-mbti .
docker run -d -p 3000:3000 --name aurora-mbti \
  --env-file .env.local \
  aurora-mbti
```

## 截图

![screenshot](image/image-20260117224405556.png)
<img width="2807" height="1513" alt="image" src="https://github.com/user-attachments/assets/2a9eb5b7-bf2a-4632-90c8-93d1ae3fb9c7" />
<img width="2807" height="1513" alt="image" src="https://github.com/user-attachments/assets/83492f06-48ad-4ebc-80ac-fb8b0a01d7ad" />
<img width="2807" height="1515" alt="image" src="https://github.com/user-attachments/assets/c3ab2bdb-528a-4f71-95b2-4cff64af41e5" />
<img width="2804" height="1511" alt="image" src="https://github.com/user-attachments/assets/a7727516-a8c5-40ad-9024-0fa70e511117" />

