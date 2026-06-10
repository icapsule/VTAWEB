# 🎾 VTAWEB — Automated Tennis Intelligence Hub

> **💡 AI Onboarding Directive**
> If you are an AI Agent reading this document in a new session: This `README.md` combined with `PROJECT_SPEC.md` and `PRD.md` provides the complete context of the VTAWEB architecture. Do not hallucinate dependencies. Follow the exact pipeline design described below.

## 1. 🌌 Project Vision & Identity

**VTAWEB** 是一个完全无人值守、自动更新的 ITF/ATP 动态网球数据网站。
- **核心诉求**：搭建一条 “**自动抓取 ➔ 自动处理 ➔ 自动发布**” 的零成本流水线。
- **设计美学**：深色主题 (Dark Theme)，高强度使用 Glassmorphism (毛玻璃) 和现代排版，网球绿 (#00c853) 作为核心强调色。采用极简的 Vanilla CSS (`globals.css`)，**未引入 TailwindCSS**。

---

## 2. 🏗️ Architecture & Pipeline (架构拓扑)

本项目的核心是一个**全免费、Serverless 的自动化架构**：

### Layer 1: Data Sourcing (数据源采集)
- **触发引擎**：**GitHub Actions** (`.github/workflows/cron-sync.yml`)。通过 Cron Job 每周定期自动发起安全触发。
- **数据摄取 API**：`/api/cron/sync` (Next.js Route Handler) 作为无头爬虫与数据中转站。通过 `CRON_SECRET` 进行授权鉴权。

### Layer 2: Persistence & ORM (持久化与连接)
- **持久化存储**：**PostgreSQL (Serverless)** (推荐 Neon / Supabase)。
- **ORM 映射**：**Drizzle ORM**，负责执行高效的类型安全 SQL 和 `Upsert` 并发写入。
- **数据流转**：API 接口拉取到最新网球排名数据后，自动写入 Postgres，同时滚动清理 10 周前的旧数据以防容量超载。

### Layer 3: Rendering & Hosting (前端渲染与部署)
- **框架**：**Next.js 15 (App Router / React 19 RSC)**
- **托管**：**Vercel**
- **性能策略**：Next.js Server Components 在渲染前直连 PostgreSQL 取数，数据更新后通过调用 `revalidatePath` 执行静态资源的按需再生 (ISR)，保障极速加载。

---

## 3. 💻 Local Development Guide (本地运行指南)

为避免由于 macOS 沙箱或 Node 版本污染导致的环境问题，本项目使用 **Docker** 封装本地 PostgreSQL 服务。

### 前置准备 (Environment)
请在根目录创建 `.env` 文件：
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/vtaweb"
CRON_SECRET="your_local_secret_key"
```

### 启动数据库容器
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

### 测试数据抓取 (Webhook Trigger)
通过 CURL 调用本地接口模拟 GitHub Actions 触发：
```bash
curl -X POST http://localhost:3000/api/cron/sync -H "Authorization: Bearer your_local_secret_key"
```

---

## 4. 🚀 Production Deployment (生产上线)

1. 配置 **Vercel**: 导入项目，并注入生产环境的 `DATABASE_URL` 和 `CRON_SECRET`。
2. 配置 **GitHub Secrets**: 在 GitHub 仓库设置中注入 `CRON_SECRET` 和 `VERCEL_URL`，以确保 GitHub Actions 有权限向生产接口推送数据。
3. 执行 **Drizzle Push**: 向生产环境的 PostgreSQL 推送 Schema。

---

## 5. 🛡️ Rules for Next AI Agent

1. **绝对禁止污染 CSS**：不得引入 Tailwind 或其他 CSS 框架，必须严格复用并扩展 `app/globals.css` 中的 CSS Variables 和工具类。
2. **保持架构纯粹性**：使用 Drizzle ORM，不可切换到 Prisma。
3. **严格遵守执行边界**：所有涉及到数据库迁移、外网请求、结构级大改的代码落地，必须事先向人类最高指挥官提报 `implementation_plan.md`，并在其明确同意后执行。
