# 使用官方Node.js运行时作为父镜像
FROM node:20-alpine AS base

# 安装依赖阶段
FROM base AS deps
# 检查 https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 安装依赖基于你喜欢的包管理器
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 禁用遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN npm install -g pnpm && pnpm run build

# 生产镜像，复制所有文件并运行Next.js
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制public目录
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 设置正确的权限，自动利用输出跟踪来减少镜像尺寸
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# server.js 是从next build中创建的
CMD ["node", "server.js"]
