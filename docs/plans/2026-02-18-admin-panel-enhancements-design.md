# 管理面板扩展设计文档

**日期**：2026-02-18  
**范围**：题目管理、测试记录、数据分析三大模块

---

## 背景

当前管理面板包含概览、统计、渠道、安全四个标签页。本次扩展增加：
- 题目管理（完整 CRUD）
- 测试记录（匿名记录列表与筛选）
- 数据分析（可视化聚合分析）

---

## 数据存储方案

选用 **JSON 文件存储**（方案 A），与现有 `stats.json`、`logs.json`、`ai-config.json` 保持一致，无需引入新依赖。

### `data/questions.json`

题目库文件，支持多语言，替代 TypeScript 静态题目文件。

```json
{
  "version": 1,
  "updatedAt": "2026-02-18T00:00:00Z",
  "questions": [
    {
      "id": "q1",
      "locale": "zh",
      "text": "题目文本",
      "dimension": "EI",
      "agree": "E",
      "contexts": ["work", "general"],
      "ageGroups": ["adult", "young"]
    }
  ]
}
```

字段说明：
- `id`：唯一标识（格式：`{locale}-{dimension}-{序号}`）
- `locale`：语言（`zh` / `en` / `ja`）
- `dimension`：维度（`EI` / `SN` / `TF` / `JP`）
- `agree`：选择"同意"时对应的 MBTI 字母
- `contexts`：适用场景（可选）
- `ageGroups`：适用年龄组（可选）

### `data/results.json`

匿名化测试记录，不存储姓名、精确年龄等个人身份信息。

```json
{
  "results": [
    {
      "id": "uuid-v4",
      "timestamp": "2026-02-18T10:30:00Z",
      "mbtiType": "INTJ",
      "locale": "zh",
      "scores": {
        "EI": { "winner": "I", "percent": 65 },
        "SN": { "winner": "N", "percent": 70 },
        "TF": { "winner": "T", "percent": 80 },
        "JP": { "winner": "J", "percent": 60 }
      },
      "ageGroup": "adult",
      "gender": "male"
    }
  ]
}
```

字段说明：
- `ageGroup`：年龄段（从用户年龄自动归类：`young` <25 / `adult` 25-45 / `mature` >45）
- `gender`：性别（`male` / `female` / `other` / 不填）
- 不存储：姓名、精确年龄、职业详情、学历

---

## 新增 API 路由

### 管理员 API（需认证）

| 方法 | 路径 | 功能 |
|---|---|---|
| `GET` | `/api/admin/questions` | 获取题目列表（支持 `locale`、`dimension` 筛选） |
| `POST` | `/api/admin/questions` | 新增题目 |
| `PUT` | `/api/admin/questions/[id]` | 编辑题目 |
| `DELETE` | `/api/admin/questions/[id]` | 删除题目 |
| `POST` | `/api/admin/questions/import` | 批量导入 JSON |
| `GET` | `/api/admin/results` | 获取测试记录列表（分页 + 筛选） |
| `GET` | `/api/admin/analytics` | 获取聚合分析数据 |

### 公开 API（前端调用）

| 方法 | 路径 | 功能 |
|---|---|---|
| `POST` | `/api/results/submit` | 测试完成后上报匿名记录（含限流保护） |

---

## 数据流

### 测试完成上报

```
用户完成测试
  → profile/page.tsx 触发 POST /api/results/submit
  → 服务端提取匿名字段（mbtiType, scores, ageGroup, gender, locale）
  → 追加写入 data/results.json（最多保留 10,000 条）
  → 返回 200 OK（失败静默处理，不影响用户体验）
```

### 管理员查看分析

```
管理员访问数据分析页
  → GET /api/admin/analytics
  → 读取 data/results.json，内存聚合计算
  → 返回：type_distribution, dimension_averages, demographics, daily_trend
```

---

## 现有代码修改

1. **`app/api/generate-questions-structured/route.ts`**  
   优先读取 `data/questions.json`；若为空则回退到 TypeScript 静态题库

2. **`app/[locale]/profile/page.tsx`**  
   测试结果计算完成后，静默调用 `POST /api/results/submit`

---

## 管理面板导航变更

侧边栏新增分组标签和 3 个导航项：

```
── 系统 ──
  概览      (现有, Gauge 图标, sky)
  统计      (现有, BarChart3 图标, emerald)

── 内容 ──
  题目管理  (新增, BookOpen 图标, orange)

── 数据 ──
  测试记录  (新增, ClipboardList 图标, violet)
  数据分析  (新增, PieChart 图标, pink)

── 配置 ──
  渠道      (现有, Network 图标, violet)
  安全      (现有, Shield 图标, amber)
```

---

## 各页面功能说明

### 题目管理页

- **工具栏**：语言切换（zh/en/ja）、维度筛选（全部/EI/SN/TF/JP）、搜索框、「新增题目」按钮、导入 JSON、导出 JSON
- **题目表格**：序号、题目文本、维度 badge、方向（agree）、操作（编辑/删除）
- **新增/编辑弹层**：表单填写题目文本、维度、方向、语言、场景（可选）
- **初始化**：首次访问若 `data/questions.json` 为空，提供「从内置题库导入」按钮

### 测试记录页

- **筛选栏**：日期范围、MBTI 类型多选、语言
- **记录表格**：时间、MBTI 类型、EI/SN/TF/JP 各维度百分比、年龄段、性别、语言
- **分页**：每页 50 条，显示总数

### 数据分析页

- **卡片 1 - MBTI 类型分布**：16 种类型横向柱状图，按数量降序
- **卡片 2 - 维度偏向**：4 个维度进度条（例：E ←→ I，群体均值 42% E）
- **卡片 3 - 人口画像**：年龄段占比饼图 + 性别占比饼图
- **卡片 4 - 时间趋势**：每日测试人数折线图（复用现有 Recharts 组件）

---

## 新增 lib 文件

| 文件 | 职责 |
|---|---|
| `lib/questions-store.ts` | 读写 `data/questions.json`，提供 CRUD 操作 |
| `lib/results-store.ts` | 读写 `data/results.json`，提供追加写入、分页查询、聚合计算 |

---

## 实现顺序建议

1. `lib/questions-store.ts` + `lib/results-store.ts` 数据层
2. 所有新增 API 路由（admin + public）
3. 修改现有 API（generate-questions 优先读 JSON）
4. 修改前端 profile 页面（静默上报）
5. 管理面板导航侧边栏分组
6. 题目管理页 UI
7. 测试记录页 UI
8. 数据分析页 UI
