# API 规范（v1）

## 版本与路径

- 主路径：`/api/*`
- 兼容前缀：`/api/v1/*`（会在中间件重写到 `/api/*`）

## 统一响应结构

### 成功

```json
{
  "success": true,
  "version": "v1",
  "...": "业务字段"
}
```

### 失败

```json
{
  "success": false,
  "version": "v1",
  "error": {
    "code": "BAD_REQUEST",
    "message": "错误信息",
    "details": "可选细节"
  }
}
```

## 错误码

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `METHOD_NOT_ALLOWED`
- `UNSUPPORTED_MEDIA_TYPE`
- `UNPROCESSABLE_ENTITY`
- `TOO_MANY_REQUESTS`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`
- `UPSTREAM_ERROR`
- `NOT_CONFIGURED`
- `DEPRECATED`

## 管理员鉴权

- 仅使用 `/api/admin/*` 作为管理员接口。
- 登录：`POST /api/admin/login`（请求体：`{ "token": "..." }`）
- 登出：`POST /api/admin/logout`
- 管理员会话 Cookie：`aurora_admin_token`
- AI 配置读取：`GET /api/admin/ai-config`
- AI 配置保存：`POST /api/admin/ai-config`（请求体：`{ "config": { ... } }`）
- 配置优先级：控制面板保存配置 > 环境变量 > 提供方默认值

## 匿名会话鉴权（普通用户）

- 受保护接口：`POST /api/generate-*` 与 `POST /api/generate-profile-followups`
- 会话 Cookie：`aurora_anon_session`（HttpOnly，`sameSite=lax`）
- 会话策略：首次页面访问自动下发签名会话，后续请求自动携带，无需用户登录
- 会话失效时返回：`401 UNAUTHORIZED`，`error.details=SESSION_REQUIRED`
- 建议配置：`ANON_AUTH_SECRET`（不配置时会回退到服务端其他私密变量/运行时密钥）

## 已废弃接口

- `POST /api/auth/login`（返回 `410 DEPRECATED`）
- `POST /api/auth/logout`（返回 `410 DEPRECATED`）

## 流式接口

- SSE：`text/event-stream`
- NDJSON：`application/x-ndjson; charset=utf-8`（`/api/generate-questions-stream-ndjson`）
