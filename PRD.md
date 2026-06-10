# 🎯 PRD (Product Requirements Document) - VTAWEB (Visual Tennis Analytics Web)

> **💡 Antigravity PRD 定位声明**
> 这是一个基于 AI 驱动开发 (Agentic Coding) 的动态 PRD。它的核心任务是确立“人机分工框架”，清晰定义业务状态与用户故事，作为所有代码生成的最初代“单一事实来源 (Single Source of Truth)”。

---

## 1. 🌌 项目愿景 (Project Vibe & Vision)
*（定义项目的终极目标、审美偏好以及期望给用户带来的核心情绪。Agent 会根据此处的 Vibe 调整代码实现的基调。）*

- **核心目标**: 打造一个极其专业、极简且具备沉浸感的网球赛事数据看板 (Tennis Analytics Dashboard)。自动同步 ATP 与 WTA 积分排名、近期赛事结果和巡回赛日程。
- **情绪基调 (Vibe)**: 专业冷峻 (Professional & Sleek)、未来科技感、深色模式 (Dark Mode)、Glassmorphism、微动画 (Micro-animations)。
- **核心用户画像**: 核心网球球迷、数据分析师、体育记者。

## 2. 🎭 人机分工与协作边界 (Human-AI Division of Labor)
*（明确哪些逻辑是人类架构师不可触碰的绝对红线，哪些可以任由 AI 发挥。）*

- **人类强制主导 (Human Override)**:
  - 核心架构技术栈的选择 (Next.js 15, Drizzle ORM, Vitest)。
  - UI 整体的 Vibe 与交互决策 (例如要求必须有 Race 到 Turin 的快捷切换)。
- **AI 自主飞地 (AI Autonomous Zone)**:
  - 组件级的拆分与状态管理 (例如 RankingsSection Client Component 的实现)。
  - UI 界面的自动测试验证 (Browser Subagent E2E)。
  - 数据库 Schema 到 Zod 类型的映射与生成。

## 3. 📖 核心用户故事 (User Stories)
*（按照优先级排列的核心功能需求，采用 `作为...我希望...以便...` 的格式。）*

### P0 (Must Have - 核心通路)
- [x] **US-01 (首页看板)**: 作为球迷，我希望在首页看到 ATP/WTA 前三名的核心卡片以及正在进行的赛事，以便快速获取最新网球动态。
- [x] **US-02 (巡回赛双轨切换)**: 作为数据分析师，我希望能够在一个页面内通过顶部的一键切换 (Toggle) 在 ATP 与 WTA 排名之间无缝切换，避免上下长距离滚动，以便更高效地对比男女球员数据。
- [x] **US-03 (实时冠军积分 Race Toggle)**: 作为核心球迷，我希望在排名页有子选项卡，能分别查看 "PIF ATP Live Race to Turin" 和 "Race To The WTA Finals" 的年终总决赛积分，以便预测入围资格。

### P1 (Should Have - 体验提升)
- [ ] **US-04 (赛事日历)**: 作为球迷，我希望有一个 Tournament Tracker 页面，按时间轴列出大满贯、1000赛等核心巡回赛的日期与状态。
- [ ] **US-05 (球员详情卡)**: 作为球迷，我希望点击球员名字时能弹出 Glassmorphism 风格的浮层，展示球员的历史战绩。

## 4. ⚙️ 功能细节与业务状态 (Core Requirements & States)
*（深入定义系统的业务状态字典和流转逻辑，供 AI 在生成类型定义和数据库 Schema 时参考。）*

- **排名模式 (Ranking Mode) 状态机**:
  - `Standard (52-Week)` <-> `Race (YTD to Finals)`
- **赛事状态 (Tournament Status) 字典**:
  - `Upcoming` -> `Live` -> `Completed`

## 5. 验收准则 (Acceptance Criteria / DoD)
*（AI 必须执行和检查的“结案标准”。）*

- [x] 所有的 UI 交互必须符合 Vibe 定义，如 Race 按钮激活时 ATP 显示蓝色，WTA 显示紫色。
- [x] 不允许使用任何 Any 类型，所有组件必须拥有严谨的 TypeScript Interface。
- [ ] 核心功能逻辑需配套 Vitest/Playwright 测试覆盖。

## 6. 🚀 延展规划库 (Roadmap & Backlog)
*（开发过程中产生的随时的新点子或技术债记录区，不要让主干任务偏航。）*

- [ ] [Tech Debt]: 将 `src/lib/mock-data.ts` 中的假数据完全迁移到基于 Drizzle ORM 的 PostgreSQL 真实数据库。
- [ ] [Idea]: 接入外部公开 API 自动抓取每日网球赛果并录入 DB。
