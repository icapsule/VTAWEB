# 🎯 PRD (Product Requirements Document) - VTAWEB (Visual Tennis Analytics Web)

> **💡 Antigravity PRD Positioning Statement**
> This is an AI-driven dynamic PRD (Agentic Coding). Its core mission is to establish the "Human-AI Division of Labor Framework," clearly defining business states and user stories. It serves as the primary "Single Source of Truth" for all code generation across agents.

---

## 1. 🌌 Project Vision & Vibe
*(Defines the ultimate goal, aesthetic preferences, and the core emotion the project should evoke. Agents will adjust the code implementation tone based on this Vibe.)*

- **Core Objective**: Build an extremely professional, minimalist, and immersive Tennis Analytics Dashboard. It will automatically sync ATP and WTA ranking points, recent match results, and tour schedules.
- **Vibe & Aesthetic**: Professional & Sleek, Futuristic, Dark Mode, Glassmorphism, Micro-animations.
- **Target Audience**: Hardcore tennis fans, Data Analysts, Sports Journalists.

## 2. 🎭 Human-AI Division of Labor
*(Clarifies absolute red lines that human architects control vs. autonomous zones for AI.)*

- **Human Override (Mandatory Control)**:
  - Core architecture stack selection (Next.js 15, Drizzle ORM, Vitest).
  - Overall UI Vibe and interactive decision-making (e.g., mandating a quick toggle for the Race to Turin).
- **AI Autonomous Zone**:
  - Component-level splitting and state management (e.g., implementing the `RankingsSection` Client Component).
  - Automated UI testing and validation (via Browser Subagents & E2E).
  - Mapping and generating Zod types from the Database Schema.

## 3. 📖 Core User Stories
*(Prioritized core features using the `As a... I want to... So that...` format.)*

### P0 (Must Have - Core Flows)
- [x] **US-01 (Homepage Dashboard)**: As a fan, I want to see the Top 3 ATP/WTA players and currently live tournaments on the homepage so I can quickly catch up on tennis updates.
- [x] **US-02 (Tour Dual-Toggle)**: As a data analyst, I want to seamlessly switch between ATP and WTA rankings on the same page via a top toggle (preventing long scrolling) to efficiently compare men's and women's data.
- [x] **US-03 (Live Race to Turin Toggle)**: As a hardcore fan, I want sub-tabs on the rankings page to specifically view the "PIF ATP Live Race to Turin" and "Race To The WTA Finals" points to predict qualification scenarios.

### P1 (Should Have - Experience Enhancements)
- [ ] **US-04 (Tournament Calendar)**: As a fan, I want a Tournament Tracker page that chronologically lists Grand Slams, Masters 1000s, and core tour dates and statuses.
- [ ] **US-05 (Player Detail Card)**: As a fan, I want to click on a player's name to open a Glassmorphism modal displaying their historical performance.

## 4. ⚙️ Core Requirements & States
*(Deeply defines the system's business state dictionaries and transition logic to guide AI in generating type definitions and DB schemas.)*

- **Ranking Mode State Machine**:
  - `Standard (52-Week)` <-> `Race (YTD to Finals)`
- **Tournament Status Dictionary**:
  - `Upcoming` -> `Live` -> `Completed`

## 5. ✅ Acceptance Criteria / DoD
*(The "Case Closed" standard that AI must execute and verify.)*

- [x] All UI interactions must align with the Vibe definition. (e.g., when the Race button is active, ATP displays blue, WTA displays purple).
- [x] The `any` type is strictly forbidden. All components must have rigorous TypeScript Interfaces.
- [ ] Core functional logic must be backed by Vitest/Playwright test coverage.

## 6. 🚀 Roadmap & Backlog
*(A record of spontaneous ideas or tech debt generated during development to prevent the main branch from derailing.)*

- [x] [Tech Debt]: Migrate fake data in `src/lib/mock-data.ts` to a real PostgreSQL database powered by Drizzle ORM.
- [x] [Idea]: Integrate external open-source CSVs (Jeff Sackmann) to automatically fetch and calculate daily tennis rankings into the DB.
- [x] [Idea]: Implement an internal lightweight scraper hitting the Wikipedia API to parse and synchronize real-time ATP/WTA "Race to Turin/WTA Finals" rankings, bypassing complex external python scraping services.
- [x] [Design]: Redesigned the homepage metrics section into a highly polished, glassmorphism "Big Titles Leaderboard" featuring dynamic player flags and statistics.
