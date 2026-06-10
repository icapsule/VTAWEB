# 🎾 VTAWEB — Automated Tennis Intelligence Hub

> **💡 AI Onboarding Directive**
> If you are an AI Agent reading this document in a new session: This `README.md` combined with `PROJECT_SPEC.md` and `PRD.md` provides the complete context of the VTAWEB architecture. Do not hallucinate dependencies. Follow the exact pipeline design described below.

## 1. 🌌 Project Vision & Enterprise Architecture

**VTAWEB** is a fully automated, unattended platform that aggregates, processes, and publishes dynamic ITF/ATP tennis data. 

Built as a **Proof of Concept for Modern Fullstack Architecture**, this project demonstrates how to orchestrate a highly scalable, zero-maintenance data pipeline using the latest serverless paradigms. It is designed to showcase enterprise-grade decisions regarding **Data Fetching, Edge Caching, Server-Side Rendering, and Database Optimization.**

- **Aesthetic Philosophy**: Dark Theme, Glassmorphism, and strict adherence to Vanilla CSS (`globals.css`). **No TailwindCSS** was introduced, proving mastery over raw CSS layout systems and CSS variables.

---

## 2. 🏗️ Architectural Decisions (The "Why")

As a Fullstack Developer, every technology in this stack was chosen to solve specific engineering problems: minimizing client-side overhead, maximizing SEO, and ensuring infinite scalability at a fraction of traditional computing costs.

### ⚡ Next.js 15 & React Server Components (RSC)
- **Why**: Traditional React Single-Page Applications (SPAs) ship massive JavaScript bundles to the client, leading to poor SEO and high device CPU usage. By utilizing **RSC**, the database querying and HTML rendering happen entirely on the server. The user receives a pre-rendered, extremely lightweight HTML file. **Zero React JavaScript is shipped to the client for the data layer**, resulting in instant First Contentful Paint (FCP) and perfect SEO.

### 🌍 Edge Caching & ISR (Incremental Static Regeneration)
- **Why**: Querying a relational database for every user visit is an anti-pattern for public-facing dashboards. VTAWEB uses Vercel's **ISR**. When the data is updated, the server triggers `revalidatePath`. Vercel regenerates the static HTML and distributes it across its Global Edge CDN. This means millions of users can hit the website simultaneously, and they will only hit the CDN cache—**database reads remain essentially at zero**.

### 🛢️ Serverless PostgreSQL (Supabase) & Drizzle ORM
- **Why Drizzle over Prisma?**: Prisma is notoriously heavy in edge environments due to its Rust-based query engine. Drizzle is a lightweight, edge-compatible ORM that provides strictly typed SQL without the massive bundle size. 
- **Why Serverless Postgres?**: Decoupling the database from the application server allows independent scaling. Supabase's connection pooling ensures we don't exhaust DB connections during concurrent edge invocations.

### ⚙️ Decoupled Automated Pipeline (GitHub Actions + Webhooks)
- **Why**: Instead of running a persistent Node.js server to run `node-cron` (which costs money and wastes resources 99% of the time), the architecture uses a decoupled trigger. **GitHub Actions** acts as the scheduler, sending a highly secure `Bearer Token` request to a Vercel Serverless Route Handler (`/api/cron/sync`). The Route Handler spins up for 2 seconds, ingests gigabytes of raw CSV data, computes ranking deltas (+/-) in-memory, performs batch SQL Upserts, and shuts down.

---

## 3. 🔄 The Data Flow Pipeline

1. **Trigger (Monday 12:00 UTC)**: GitHub Action fires an HTTP POST request to the Vercel Production API.
2. **Ingestion & Computation**: The Next.js API route streams raw, unstructured CSV datasets from external open-source repositories. It executes a high-performance memory-map algorithm to stitch player IDs, compute week-over-week ranking deltas, and format the payload.
3. **Persistence**: A single transactional batch insertion pushes 200+ records into the Supabase PostgreSQL database via Drizzle ORM.
4. **Cache Invalidation**: The Next.js API calls `revalidatePath()`, purging the stale Edge CDN cache.
5. **Delivery**: Users immediately receive the fresh, statically generated pages at single-digit millisecond latency.

---

## 4. 💻 Local Development Guide

To prevent environment contamination across different OS architectures, the local development environment relies on **Docker** for the database.

### Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/vtaweb"
CRON_SECRET="your_local_secret_key"
```

### 1. Spin up the Database
```bash
docker compose up -d
```

### 2. Drizzle Schema Migration
```bash
npm install
npx drizzle-kit generate:pg
npx tsx src/server/db/migrate.ts
```

### 3. Run the Next.js Server
```bash
npm run dev
```

### 4. Trigger the Data Pipeline
Simulate the GitHub Action webhook to test data ingestion:
```bash
curl -X POST http://localhost:3000/api/cron/sync -H "Authorization: Bearer your_local_secret_key"
```

---

## 5. 🚀 Production Deployment

VTAWEB utilizes an automated CI/CD pipeline:
1. **Vercel**: Commits to the `main` branch trigger immutable production builds. The Vercel environment securely stores the production `DATABASE_URL` and `CRON_SECRET`.
2. **GitHub Secrets**: The repository uses `CRON_SECRET` and `VTAWEB_API_URL` to securely invoke the Vercel API.
3. **Database Branching**: Schema changes are pushed to Supabase via Drizzle migrations during the deployment phase.

---

## 6. 🛡️ Strict AI Agent Guidelines

1. **CSS Integrity**: DO NOT introduce TailwindCSS. Respect the CSS variables and structural separation defined in `app/globals.css`.
2. **ORM Adherence**: Drizzle ORM is the sole standard. Do not migrate back to Prisma.
3. **Architectural Review**: Any modifications involving database migrations, external network requests, or architectural shifts require an `implementation_plan.md` approved by the Chief Architect before execution.
