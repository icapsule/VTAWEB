# 🎾 VTAWEB — Automated Tennis Intelligence Hub

> **💡 AI Onboarding Directive**
> If you are an AI Agent reading this document in a new session: This `README.md` combined with `PROJECT_SPEC.md` and `PRD.md` provides the complete context of the VTAWEB architecture. Do not hallucinate dependencies. Follow the exact pipeline design described below.

## 1. 🌌 Project Vision & Identity

**VTAWEB** 是一个完全无人值守、高度自动化的 ITF/ATP 动态网球数据展示平台。
- **核心定位**：搭建一条 “**自动抓取 ➔ 数据清洗 ➔ 自动发布**” 的现代化全栈流水线。
- **设计美学**：深色主题 (Dark Theme)，高强度使用 Glassmorphism (毛玻璃) 和现代排版，以网球绿 (#00c853) 作为核心强调色。前端采用极简的 Vanilla CSS (`globals.css`)，**未引入 TailwindCSS** 从而保证样式纯净。

---

## 2. 🏗️ Tech Stack & Architecture (技术栈与架构拓扑)

本项目的核心基于**全自动化的 Serverless 架构**，实现了从数据获取到前端渲染的完整闭环。

### 核心技术栈 (Technology Stack)
- **前端与中间件**：Next.js 15 (App Router, React 19 RSC)
- **数据库**：PostgreSQL (Serverless Cloud DB)
- **ORM**：Drizzle ORM
- **CI/CD 与任务调度**：GitHub Actions & Vercel
- **开发环境**：Docker (容器化本地数据库)

### 架构实现与数据流向 (Pipeline Implementation)

#### Layer 1: Data Sourcing & Automation (数据源与调度)
- **触发引擎**：**GitHub Actions** (`.github/workflows/cron-sync.yml`)。通过 Cron Job 机制设定每周一自动发起安全 HTTP 触发请求。
- **数据摄取 API**：Vercel 端暴露受保护的 Next.js Route Handler (`/api/cron/sync`) 作为无头爬虫与数据流转中枢。所有外部调用必须通过 `CRON_SECRET` 环境变量进行 Bearer 授权鉴权。

#### Layer 2: Persistence & ORM (持久化与连接)
- **持久化存储**：**PostgreSQL (Serverless)**。
- **数据操作层**：**Drizzle ORM**。用于执行高效的类型安全 SQL 和复杂的 `Upsert` 并发写入，确保幂等性。
- **数据流转**：当触发同步接口后，后端会自动拉取最新的网球排名数据，经过清洗处理后批量写入 PostgreSQL。系统同时执行滚动清理策略（如保留最近 10 周的数据）以保证存储层轻量且高效。

#### Layer 3: Rendering & Hosting (前端渲染与部署)
- **云端托管**：**Vercel** 边缘网络。
- **性能优化策略**：Next.js 的服务端组件 (Server Components) 在渲染前直连 PostgreSQL 提取数据。数据写入完成后，中间件主动调用 `revalidatePath`，清空缓存并触发前端静态资源按需再生 (ISR, Incremental Static Regeneration)，确保最终用户访问时的数据鲜活性与极速加载体验。

---

## 3. 💻 Local Development Guide (本地开发指南)

为避免由于 macOS 沙箱或 Node 版本差异导致的环境污染，本项目使用 **Docker** 封装本地 PostgreSQL 环境。

### 前置准备 (Environment)
请在项目根目录创建 `.env` 文件，提供本地开发所需的配置：
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/vtaweb"
CRON_SECRET="your_local_secret_key"
```

### 启动本地数据库容器
```bash
docker compose up -d
```

### 初始化数据结构 (Drizzle Migration)
```bash
npm install
npx drizzle-kit generate:pg
npx tsx src/server/db/migrate.ts
```

### 启动本地 Next.js 服务
```bash
npm run dev
```

### 调试数据抓取 (Webhook Trigger)
通过 CURL 调用本地接口模拟 GitHub Actions 调度，测试数据落库过程：
```bash
curl -X POST http://localhost:3000/api/cron/sync -H "Authorization: Bearer your_local_secret_key"
```

---

## 4. 🚀 Production Deployment (生产环境发布)

平台现已无缝集成自动化 CI/CD 流程：
1. **Vercel**：代码推送到 `main` 分支后，Vercel 自动触发生产构建。生产环境已注入 `DATABASE_URL`（指向生产级 PostgreSQL）及 `CRON_SECRET`。
2. **GitHub Secrets**：仓库层已绑定 `CRON_SECRET` 和 `VTAWEB_API_URL`。
3. **Database Migration**：通过 Vercel 构建钩子或本地向生产环境推流（`Drizzle Push`），保持表结构与代码严格同步。

---

## 5. 🛡️ Rules for Next AI Agent

1. **绝对禁止污染 CSS**：不得引入 Tailwind 或其他 CSS 框架，必须严格复用并扩展 `app/globals.css` 中的 CSS Variables 和工具类。
2. **保持架构纯粹性**：坚定采用 Drizzle ORM，不可回退至 Prisma。
3. **严格遵守执行边界**：所有涉及到数据库迁移、外网请求、结构级大改的代码落地，必须事先向人类最高指挥官提报 `implementation_plan.md`，并在其明确同意后执行。
