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

- **Aesthetic Philosophy**: Dark Theme, Glassmorphism, Cinematic 1080p Full-Bleed Background Video, and strict adherence to Vanilla CSS (`globals.css`). **No TailwindCSS** was introduced, proving fundamental mastery over raw CSS layout systems and CSS variables.

---

## 2. 🏗️ System Architecture & Data Flow

The platform relies on a 100% serverless, zero-maintenance infrastructure.

```mermaid
graph TD
    A["GitHub Actions<br>Cron Trigger"] -->|"Semi-Weekly (Mon, Thu)"| B("Next.js Route Handler<br>/api/cron/sync")
    B -->|Fetch JSON Rankings| C[(RapidAPI<br>Tennis API)]
    B -->|Regex Parse Wikitext| W[(Wikipedia API<br>Race Rankings)]
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
1. **Trigger**: GitHub Action fires an HTTP POST request to the Vercel Production API semi-weekly (Mondays and Thursdays) to guarantee the database never hits the 7-day serverless auto-pause limit.
2. **Ingestion & Computation**: The Next.js API route streams JSON datasets from RapidAPI for 52-week rankings and directly scrapes the Wikipedia API for "Race" rankings. It uses the Wikipedia Revision History API to fetch 7-day-old wikitext, executes a high-performance memory-map algorithm to stitch player IOC codes, computes week-over-week ranking deltas (+/-), and formats the payload.
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

---

## 7. 📅 Architecture Iteration History

To ensure the highest standards of maintainability and stability, the VTAWEB architecture has undergone rigorous iterations. Below is the version control history documenting the evolution from a static PoC to a production-grade serverless pipeline:

- **v1.0 (Static UI Generation)**: Initial Proof of Concept built using hardcoded mock data. Focused purely on establishing the Glassmorphism aesthetic and React Server Components (RSC) rendering patterns.
- **v2.0 (The Python Scraper Era - *Deprecated*)**: Introduced dynamic data via `JeffSackmann` open-source CSVs and Wikipedia Revision APIs. Relied on external Python web scrapers and Cloudflare D1. *Deprecated due to third-party repository instability (404 errors) and the architectural friction of maintaining fragmented external data pipelines.*
- **v3.0 (Modern Serverless)**: Complete architectural migration to **RapidAPI** (Standard Rankings) and **Supabase Serverless Postgres**. We implemented an advanced **Database-Native Week-over-Week Delta Algorithm** entirely within the Next.js Edge API. This elegantly eliminated complex Wikipedia revision API calls for calculating `+/-` ranking changes, centralizing the entire ingestion and computation pipeline natively within the Next.js runtime environment.
- **v3.1 (Lazy Loading External Media)**: To preserve zero-cost database scalability, we rejected storing 200 high-res player avatars in Supabase during CRON syncs. Instead, we built an elegant **Glassmorphism Player Modal** that intercepts row clicks and dynamically queries the `en.wikipedia.org/api/rest_v1` API on the client side, fetching localized biographies and HD avatars instantly with zero backend load.
- **v4.0 (Native APIs & Hybrid Offline Parsing - *Current*)**: Removed heavy, fragile web scrapers (Playwright). Shifted to the official WTA native API for real-time women's tournament data. For complex PDF calendars (ATP Challengers), we adopted a strictly offline Python parsing pipeline (`parse_pdf.py`), converting raw PDFs into statically served JSON. GitHub Actions cron was optimized to semi-weekly to prevent Supabase auto-pauses, delivering a rock-solid, zero-maintenance runtime.
