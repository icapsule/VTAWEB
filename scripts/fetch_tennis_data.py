#!/usr/bin/env python3
"""
VTAWEB — Automated Tennis Data Fetcher

This script fetches tennis rankings and tournament data from open sources
and writes it to Cloudflare D1 via REST API.

Data Sources (in priority order):
  1. RapidAPI Tennis API (if RAPIDAPI_KEY is set)
  2. Jeff Sackmann's GitHub CSV datasets (fallback, free)

Usage:
  python fetch_tennis_data.py              # Full fetch & write
  python fetch_tennis_data.py --dry-run    # Fetch only, no DB writes

Environment Variables:
  RAPIDAPI_KEY         - RapidAPI subscription key (optional)
  CF_ACCOUNT_ID        - Cloudflare Account ID
  CF_API_TOKEN         - Cloudflare API Token (with D1 write access)
  CF_D1_DATABASE_ID    - Cloudflare D1 Database ID
"""

import os
import sys
import json
import csv
import io
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip install requests")
    sys.exit(1)

# ---- Configuration ----
DRY_RUN = "--dry-run" in sys.argv
RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY", "")
CF_ACCOUNT_ID = os.environ.get("CF_ACCOUNT_ID", "")
CF_API_TOKEN = os.environ.get("CF_API_TOKEN", "")
CF_D1_DATABASE_ID = os.environ.get("CF_D1_DATABASE_ID", "")

# Jeff Sackmann's GitHub raw CSV URLs (fallback data source)
SACKMANN_ATP_RANKINGS_URL = (
    "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_rankings_current.csv"
)
SACKMANN_WTA_RANKINGS_URL = (
    "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_rankings_current.csv"
)
SACKMANN_ATP_PLAYERS_URL = (
    "https://raw.githubusercontent.com/JeffSackmann/tennis_atp/master/atp_players.csv"
)
SACKMANN_WTA_PLAYERS_URL = (
    "https://raw.githubusercontent.com/JeffSackmann/tennis_wta/master/wta_players.csv"
)

NOW_ISO = datetime.now(timezone.utc).isoformat()


def log(msg):
    """Timestamped log output."""
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


# ============================================================
# Data Source: Jeff Sackmann GitHub CSV (Fallback)
# ============================================================

def fetch_sackmann_rankings(tour="atp", top_n=50):
    """
    Fetch rankings from Jeff Sackmann's open GitHub repository.
    Returns list of dicts: [{id, tour, rank, player_name, country, points, rank_change, updated_at}]
    """
    rankings_url = SACKMANN_ATP_RANKINGS_URL if tour == "atp" else SACKMANN_WTA_RANKINGS_URL
    players_url = SACKMANN_ATP_PLAYERS_URL if tour == "atp" else SACKMANN_WTA_PLAYERS_URL

    log(f"Fetching {tour.upper()} player database...")
    players_resp = requests.get(players_url, timeout=30)
    players_resp.raise_for_status()

    # Build player lookup: player_id -> {name, country}
    player_map = {}
    reader = csv.DictReader(io.StringIO(players_resp.text))
    for row in reader:
        pid = row.get("player_id", "").strip()
        fname = row.get("name_first", "").strip()
        lname = row.get("name_last", "").strip()
        country = row.get("ioc", "").strip()
        if pid:
            player_map[pid] = {
                "name": f"{fname} {lname}".strip(),
                "country": country,
            }

    log(f"Fetching {tour.upper()} rankings CSV...")
    rankings_resp = requests.get(rankings_url, timeout=30)
    rankings_resp.raise_for_status()

    # Parse rankings: columns are typically ranking_date, rank, player, points
    reader = csv.DictReader(io.StringIO(rankings_resp.text))
    rows = list(reader)

    if not rows:
        log(f"WARNING: No {tour.upper()} ranking data found!")
        return []

    # Get the most recent ranking date
    all_dates = sorted(set(r.get("ranking_date", "") for r in rows), reverse=True)
    latest_date = all_dates[0] if all_dates else ""
    log(f"Latest ranking date: {latest_date}")

    # Filter to latest date and top N
    latest_rows = [r for r in rows if r.get("ranking_date") == latest_date]
    latest_rows.sort(key=lambda r: int(r.get("rank", 9999)))
    latest_rows = latest_rows[:top_n]

    results = []
    for row in latest_rows:
        pid = row.get("player", "").strip()
        player_info = player_map.get(pid, {"name": f"Player #{pid}", "country": "UNK"})
        rank = int(row.get("rank", 0))
        points = int(row.get("points", 0))

        results.append({
            "id": f"{tour}_{pid}",
            "tour": tour,
            "rank": rank,
            "player_name": player_info["name"],
            "country": player_info["country"],
            "points": points,
            "rank_change": 0,  # CSV doesn't track week-over-week changes
            "updated_at": NOW_ISO,
        })

    log(f"Parsed {len(results)} {tour.upper()} rankings.")
    return results


# ============================================================
# Data Source: RapidAPI Tennis API (Primary, if key available)
# ============================================================

def fetch_rapidapi_rankings(tour="atp", top_n=50):
    """
    Fetch rankings from RapidAPI Tennis API.
    Requires RAPIDAPI_KEY environment variable.
    """
    url = "https://api-tennis.com/tennis/"
    params = {
        "method": "get_standings",
        "event_type": "ATP" if tour == "atp" else "WTA",
        "APIkey": RAPIDAPI_KEY,
    }

    log(f"Fetching {tour.upper()} rankings from RapidAPI...")
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    results_raw = data.get("result", [])
    if not results_raw:
        log(f"WARNING: No data returned from RapidAPI for {tour.upper()}")
        return []

    results = []
    for item in results_raw[:top_n]:
        rank = int(item.get("place", 0))
        results.append({
            "id": f"{tour}_{item.get('player_key', rank)}",
            "tour": tour,
            "rank": rank,
            "player_name": item.get("player", f"Unknown #{rank}"),
            "country": item.get("country", ""),
            "points": int(item.get("points", 0)),
            "rank_change": 0,
            "updated_at": NOW_ISO,
        })

    log(f"Fetched {len(results)} {tour.upper()} rankings from RapidAPI.")
    return results


# ============================================================
# Cloudflare D1 Writer
# ============================================================

def write_to_d1(sql_statements):
    """
    Execute a batch of SQL statements against Cloudflare D1 via REST API.
    """
    if DRY_RUN:
        log(f"[DRY RUN] Would execute {len(sql_statements)} SQL statements.")
        for stmt in sql_statements[:3]:
            log(f"  → {stmt['sql'][:100]}...")
        return True

    if not all([CF_ACCOUNT_ID, CF_API_TOKEN, CF_D1_DATABASE_ID]):
        log("ERROR: Cloudflare D1 credentials not configured. Set CF_ACCOUNT_ID, CF_API_TOKEN, CF_D1_DATABASE_ID.")
        return False

    url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/d1/database/{CF_D1_DATABASE_ID}/query"
    headers = {
        "Authorization": f"Bearer {CF_API_TOKEN}",
        "Content-Type": "application/json",
    }

    # D1 REST API accepts batch SQL
    # We'll send them in chunks to avoid hitting size limits
    chunk_size = 50
    for i in range(0, len(sql_statements), chunk_size):
        chunk = sql_statements[i : i + chunk_size]
        log(f"Writing batch {i // chunk_size + 1} ({len(chunk)} statements)...")

        for stmt in chunk:
            payload = {"sql": stmt["sql"], "params": stmt.get("params", [])}
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.status_code != 200:
                log(f"ERROR: D1 write failed: {resp.status_code} {resp.text[:200]}")
                return False

    log("All data written to D1 successfully.")
    return True


def rankings_to_sql(rankings):
    """Convert ranking data to INSERT OR REPLACE SQL statements."""
    statements = []
    for r in rankings:
        sql = (
            "INSERT OR REPLACE INTO rankings (id, tour, rank, player_name, country, points, rank_change, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        params = [r["id"], r["tour"], r["rank"], r["player_name"], r["country"], r["points"], r["rank_change"], r["updated_at"]]
        statements.append({"sql": sql, "params": params})
    return statements


# ============================================================
# Main Execution
# ============================================================

def main():
    log("=" * 50)
    log("VTAWEB Data Fetcher — Starting")
    log(f"Mode: {'DRY RUN' if DRY_RUN else 'LIVE'}")
    log(f"Data Source: {'RapidAPI' if RAPIDAPI_KEY else 'Jeff Sackmann GitHub CSV'}")
    log("=" * 50)

    all_sql = []

    # Fetch rankings for both tours
    for tour in ["atp", "wta"]:
        if RAPIDAPI_KEY:
            rankings = fetch_rapidapi_rankings(tour, top_n=50)
        else:
            rankings = fetch_sackmann_rankings(tour, top_n=50)

        if rankings:
            all_sql.extend(rankings_to_sql(rankings))
            log(f"✅ {tour.upper()}: {len(rankings)} rankings queued for write.")
        else:
            log(f"⚠️ {tour.upper()}: No rankings data fetched.")

    # Write to D1
    if all_sql:
        success = write_to_d1(all_sql)
        if success:
            log("🎉 All data synced successfully!")
        else:
            log("❌ Data sync failed. Check credentials and try again.")
            sys.exit(1)
    else:
        log("⚠️ No data to write. Exiting.")

    log("=" * 50)
    log("VTAWEB Data Fetcher — Done")


if __name__ == "__main__":
    main()
