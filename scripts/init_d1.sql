-- ============================================================
-- VTAWEB — Cloudflare D1 Database Schema
-- Run this once to initialize the database structure.
-- ============================================================

-- ATP/WTA Player Rankings
CREATE TABLE IF NOT EXISTS rankings (
  id TEXT PRIMARY KEY,             -- "{tour}_{player_id}" e.g. "atp_sinner"
  tour TEXT NOT NULL,               -- "atp" | "wta"
  rank INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  country TEXT,
  points INTEGER DEFAULT 0,
  rank_change INTEGER DEFAULT 0,   -- positive = moved up, negative = moved down
  updated_at TEXT NOT NULL          -- ISO 8601 timestamp
);

-- Tournament Calendar
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,              -- e.g. "wimbledon-2026"
  tour TEXT NOT NULL,               -- "atp" | "wta" | "both"
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  surface TEXT,                     -- "Hard" | "Clay" | "Grass" | "Indoor"
  category TEXT,                    -- "Grand Slam" | "Masters 1000" | "ATP 500" | etc.
  start_date TEXT,                  -- "YYYY-MM-DD"
  end_date TEXT,                    -- "YYYY-MM-DD"
  status TEXT DEFAULT 'upcoming',   -- "upcoming" | "live" | "completed"
  updated_at TEXT NOT NULL
);

-- Match Results
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  round TEXT,                       -- "R128" | "R64" | "R32" | "R16" | "QF" | "SF" | "F"
  player1 TEXT NOT NULL,
  player2 TEXT NOT NULL,
  score TEXT,
  winner TEXT,
  match_date TEXT,                  -- "YYYY-MM-DD"
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rankings_tour ON rankings(tour);
CREATE INDEX IF NOT EXISTS idx_rankings_rank ON rankings(tour, rank);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
