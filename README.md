<div align="center">
  <h1>🎾 VTAWEB — Automated Tennis Intelligence Hub</h1>
  <p><strong>A Proof of Concept for Modern Fullstack Serverless Architecture</strong></p>
  <h3><a href="https://vtaweb.vercel.app/">🌐 Live Demo: vtaweb.vercel.app</a></h3>
  <br/>
  <img src="./public/preview.png" alt="VTAWEB Dashboard" width="800"/>
  <br/><br/>

  ![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Supabase](https://img.shields.io/badge/Supabase-Serverless-3ECF8E?style=for-the-badge&logo=supabase)
  ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle)
  ![Vercel](https://img.shields.io/badge/Vercel-Edge_CDN-000000?style=for-the-badge&logo=vercel)
  ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Pipeline-2088FF?style=for-the-badge&logo=github-actions)
</div>

---

> **💡 AI Onboarding Directive**
> If you are an AI Agent reading this document in a new session: This `README.md` combined with `PROJECT_SPEC.md` and `PRD.md` provides the complete context of the VTAWEB architecture. Do not hallucinate dependencies. Follow the exact pipeline design described below.

## 1. 🌌 Project Vision & Enterprise Architecture

**VTAWEB** is a fully automated, unattended platform that aggregates, processes, and publishes dynamic ITF/ATP tennis data. 

Built to showcase **Fullstack Seniority**, this project demonstrates how to orchestrate a highly scalable, zero-maintenance data pipeline using the latest serverless paradigms. It is designed to prove mastery over **Data Fetching, Edge Caching, Server-Side Rendering, and Database Optimization.**

- **Aesthetic Philosophy**: Dark Theme, Glassmorphism, and strict adherence to Vanilla CSS (`globals.css`). **No TailwindCSS** was introduced, proving fundamental mastery over raw CSS layout systems and CSS variables.

---

## 2. 🏗️ System Architecture & Data Flow

The platform relies on a 100% serverless, zero-maintenance infrastructure.

```mermaid
graph TD
    A[GitHub Actions<br>Cron Trigger] -->|Mon 12:00 UTC| B(Next.js Route Handler<br>/api/cron/sync)
    B -->|Fetch & Parse CSVs| C[(Jeff Sackmann<br>GitHub Datasets)]
    B -->|Memory-Map & Compute Deltas| D{Compute Engine}
    D -->|Drizzle ORM Batch Upsert| E[(Supabase<br>Serverless Postgres)]
    B -->|revalidatePath| F[Vercel Edge CDN]
    E -.->|Zero-cost Reads| F
    F -->|Instant HTML Delivery| G[End User Browser]
    
    classDef trigger fill:#2088FF,stroke:#fff,stroke-width:2px,color:#fff;
    classDef api fill:#000,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#000;
    
    class A trigger;
    class B api;
    class E db;
```

### 🔄 The Pipeline Lifecycle
1. **Trigger**: GitHub Action fires an HTTP POST request to the Vercel Production API.
2. **Ingestion & Computation**: The Next.js API route streams raw CSV datasets, executes a high-performance memory-map algorithm to stitch player IDs, computes week-over-week ranking deltas (+/-), and formats the payload.
3. **Persistence**: A single transactional batch insertion pushes 200+ records into Supabase via Drizzle ORM.
4. **Cache Invalidation**: The Next.js API calls `revalidatePath()`, purging the stale Edge CDN cache.
5. **Delivery**: Users immediately receive the fresh, statically generated pages at single-digit millisecond latency.

---

## 3. 🧠 Architectural Decisions (The "Why")

As an enterprise architect, every technology was chosen to solve specific engineering problems: minimizing client-side overhead, maximizing SEO, and ensuring infinite scalability at a fraction of traditional computing costs.

### ⚡ Next.js 15 & React Server Components (RSC)
Traditional React SPAs ship massive JavaScript bundles to the client, leading to poor SEO and high device CPU usage. By utilizing **RSC**, the database querying and HTML rendering happen entirely on the server. **Zero React JavaScript is shipped to the client for the data layer**, resulting in instant First Contentful Paint (FCP) and perfect SEO.

### 🌍 Edge Caching & ISR (Incremental Static Regeneration)
Querying a relational database for every user visit is an anti-pattern. VTAWEB uses Vercel's **ISR**. When the data is updated, Vercel regenerates the static HTML and distributes it across its Global CDN. Millions of users can hit the website simultaneously, and they will only hit the CDN cache—**database reads remain essentially at zero**.

### 🛢️ Serverless Postgres (Supabase) & Drizzle ORM
Prisma is notoriously heavy in edge environments due to its Rust-based query engine. **Drizzle** is a lightweight, edge-compatible ORM that provides strictly typed SQL without the massive bundle size. Decoupling the database to **Supabase** allows independent scaling with connection pooling.

---

## 4. 📂 Directory Structure

```text
├── src/
│   ├── app/                # Next.js 15 App Router (Pages, Route Handlers, Layouts)
│   ├── components/         # Reusable React UI Components (Glassmorphism design)
│   ├── server/db/          # Backend logic: Drizzle Schema, Migrations, DB Client
│   └── lib/                # Utilities: Formatters, Mock Data, Core Algorithms
├── .github/workflows/      # CI/CD: Automated Cron Sync Pipelines
├── public/                 # Static assets and fonts
└── globals.css             # Vanilla CSS Design System (Color Tokens, Custom Utilities)
```

---

## 5. 💻 Local Development Guide

To prevent environment contamination, the local development environment relies on **Docker**.

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/vtaweb"
CRON_SECRET="your_local_secret_key"
```

### 2. Initialization & Boot
```bash
# Spin up the local PostgreSQL container
docker compose up -d

# Generate schema and push to database
npm install
npx drizzle-kit generate:pg
npx tsx src/server/db/migrate.ts

# Start Next.js Development Server
npm run dev
```

### 3. Trigger Data Pipeline (Webhook Simulation)
```bash
curl -X POST http://localhost:3000/api/cron/sync -H "Authorization: Bearer your_local_secret_key"
```

---

## 6. 🚀 Production Deployment

VTAWEB utilizes an automated CI/CD pipeline:
1. **Vercel**: Commits to the `main` branch trigger immutable production builds.
2. **GitHub Secrets**: The repository uses `CRON_SECRET` and `VTAWEB_API_URL` to securely invoke the Vercel API.
3. **Database Branching**: Schema changes are pushed to Supabase via Drizzle migrations during the deployment phase.
