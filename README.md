# 🎾 VTAWEB — Automated Tennis Intelligence Hub

> **💡 AI Onboarding Directive**
> If you are an AI Agent reading this document in a new session: This `README.md` combined with `PROJECT_SPEC.md` and `PRD.md` provides the complete context of the VTAWEB architecture. Do not hallucinate dependencies. Follow the exact pipeline design described below.

## 1. 🌌 Project Vision & Identity

**VTAWEB** 是一个完全无人值守、自动更新的 ITF/ATP 动态网球数据网站。
- **核心诉求**：搭建一条 “**自动抓取 ➔ 自动处理 ➔ 自动发布**” 的零成本流水线。
- **设计美学**：深色主题 (Dark Theme)，高强度使用 Glassmorphism (毛玻璃) 和现代排版，网球绿 (#00c853) 作为核心强调色。采用极简的 Vanilla CSS (`globals.css`)，**未引入 TailwindCSS**。

---

## 2. 🏗️ Architecture & Pipeline (架构拓扑)

本项目的核心是一个**全免费、Serverless 的三层自动化架构**：

### Layer 1: Data Sourcing (数据源采集)
- **执行实体**：`scripts/fetch_tennis_data.py` (Python)
- **数据源设计**：
  - **Primary**: RapidAPI Tennis API (覆盖赛程、实时比分、排名)。
  - **Fallback**: Jeff Sackmann 提供的 GitHub 纯净 CSV 历史数据集（无需鉴权，完全开源）。

### Layer 2: Automation & Storage (无人值守触发与存储)
- **调度引擎**：**GitHub Actions** (`.github/workflows/fetch-data.yml`)。通过 Cron Job 每天 UTC 02:00 自动唤醒 Python 脚本。
- **持久化存储**：**Cloudflare D1 (SQLite)**。Python 脚本清洗数据后，通过 REST API 调用 Cloudflare Endpoint 执行 `INSERT OR REPLACE`，写入 `init_d1.sql` 所定义的 Schema 中。

### Layer 3: Rendering (前端渲染)
- **框架**：**Next.js 15 (App Router)**
- **托管**：**Vercel (Hobby Tier)**
- **数据流向**：Vercel 端部署的 Next.js Server Components 通过 Cloudflare D1 HTTP API 拉取最新数据，并结合 ISR (Incremental Static Regeneration) 缓存策略，实现前端页面的极速加载和零维护更新。

---

## 3. 🚦 Current State & AI Handoff (当前开发进度)

我们目前已完成 **Phase 1 (MVP 骨架构建)**。新加入的 AI 助手请从 Phase 2 继续推进。

### ✅ 已完成 (Phase 1)
1. **Next.js 骨架**：`app/layout.js`, `page.js`, `rankings/page.js`, `tournaments/page.js`。
2. **纯享级 CSS Design System**：位于 `app/globals.css`，定义了所有的 Tokens、Glass Cards、Badges 和 Animations。
3. **Python 爬虫底座**：`scripts/fetch_tennis_data.py` 已具备双源回退机制逻辑和 D1 REST API 写入逻辑。
4. **数据库 Schema**：`scripts/init_d1.sql` 已定义 `rankings`, `tournaments`, `matches`。
5. **本地 Mock 引擎**：目前前端页面通过 `lib/mock-data.js` 渲染出极其真实的 UI 界面，用于本地调试。
6. **Docker 本地化容器**：`Dockerfile` 和 `docker-compose.yml` 已就绪。

### ⏳ 待处理 (Phase 2 & 3 - AI Next Steps)
- **Phase 2 (数据打通)**：
  1. 协助用户在 Cloudflare Dashboard 创建 D1 数据库。
  2. 获取 `CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID`, `CF_API_TOKEN`，并配置到 GitHub Secrets 中。
  3. 将前端 `lib/mock-data.js` 替换为 `lib/db.js`，实现对 Cloudflare D1 的真实请求读取。
- **Phase 3 (上线收尾)**：
  1. 将代码推送到 GitHub，并在 Vercel 中导入项目实现自动部署。

---

## 4. 💻 Local Development Guide (本地运行指南)

为避免由于 macOS 沙箱或 Node 版本污染导致的环境问题，本项目使用 **Docker** 作为标准本地开发环境。

### 启动服务
在终端进入 `VTAWEB` 根目录，执行：
```bash
docker compose up -d --build
```
启动后，访问 `http://localhost:3000` 即可预览完整 UI。

### 停止服务
```bash
docker compose down
```

### 数据库脚本本地测试 (Dry Run)
如果您需要在本地测试 Python 抓取逻辑，请确保已安装 Python 3.12+：
```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install requests
python fetch_tennis_data.py --dry-run
```

---

## 5. 🛡️ Rules for Next AI Agent

1. **绝对禁止污染 CSS**：不得引入 Tailwind 或其他 CSS 框架，必须严格复用并扩展 `app/globals.css` 中的 CSS Variables 和工具类。
2. **保持 Serverless 纯粹性**：不得在项目中引入诸如 Prisma 这样体积庞大且需要持久连接的 ORM。继续使用纯粹的 REST HTTP 调用来与 Cloudflare D1 交互。
3. **严防安全漏洞**：在编写 `lib/db.js` 查询 D1 时，必须注意 SQL 注入风险，并妥善通过环境变量隔离 Token。
