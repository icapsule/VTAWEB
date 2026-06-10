#!/usr/bin/env python3
"""
Automated Tournament Scraper for VTAWEB
Fetches the upcoming year's calendar from Wikipedia and updates tournaments.json.
This script is intended to be run via GitHub Actions every December.
"""

import requests
import json
import re
from datetime import datetime
import os
import sys

# Official Data Sources
ATP_CALENDAR_URL = "https://www.atptour.com/en/tournaments"
WTA_CALENDAR_URL = "https://www.wtatennis.com/tournaments?status=all"

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")

def fetch_official_atp():
    """
    Placeholder: Fetch from official ATP Tour website.
    Note: Highly susceptible to Cloudflare blocking. If requests fails, 
    consider replacing with Playwright/Selenium in the future.
    """
    log(f"Attempting official ATP source: {ATP_CALENDAR_URL}")
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
    try:
        res = requests.get(ATP_CALENDAR_URL, headers=headers, timeout=30)
        if res.status_code == 200:
            log("Successfully loaded ATP official page (HTML). Future parsing logic goes here.")
            # TODO: Parse the HTML structure of the ATP tournament calendar
            return []
        else:
            log(f"ATP official page returned status: {res.status_code}")
    except Exception as e:
        log(f"ATP official fetch failed: {e}")
    return []

def fetch_official_wta():
    """
    Placeholder: Fetch from official WTA Tour website.
    """
    log(f"Attempting official WTA source: {WTA_CALENDAR_URL}")
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
    try:
        res = requests.get(WTA_CALENDAR_URL, headers=headers, timeout=30)
        if res.status_code == 200:
            log("Successfully loaded WTA official page (HTML). Future parsing logic goes here.")
            # TODO: Parse the HTML structure of the WTA tournament calendar
            return []
        else:
            log(f"WTA official page returned status: {res.status_code}")
    except Exception as e:
        log(f"WTA official fetch failed: {e}")
    return []

def fetch_wiki_year(tour, year):
    page_name = f"{year}_{tour.upper()}_Tour"
    url = f"https://en.wikipedia.org/w/api.php?action=parse&page={page_name}&prop=wikitext&format=json"
    
    log(f"Fetching Wikipedia: {page_name}")
    try:
        headers = {'User-Agent': 'VTAWEB_Bot/1.0 (https://github.com/icapsule/VTAWEB)'}
        res = requests.get(url, headers=headers, timeout=30)
        res.raise_for_status()
    except Exception as e:
        log(f"Failed to fetch {url}: {e}")
        return []

    data = res.json()
    if 'parse' not in data or 'wikitext' not in data['parse']:
        log(f"Warning: No wikitext found for {page_name}")
        return []

    wikitext = data['parse']['wikitext']['*']
    lines = wikitext.split('\n')
    results = []
    current_dates = ""
    inside_table = False
    
    for line in lines:
        line = line.strip()
        if line.startswith('{| class="wikitable"'):
            inside_table = True
        if line.startswith('|}'):
            inside_table = False
        
        if not inside_table:
            continue
            
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if line.startswith('!') and any(m in line for m in months):
            match = re.findall(r'\d{1,2} [A-Z][a-z]{2}', line)
            if match and line.startswith('!'):
                current_dates = ' - '.join(match)
                
        trigger_words = ['Grand Slam', 'ATP Masters 1000', 'WTA 1000', 'ATP Finals', 'WTA Finals', 'ATP Tour Masters 1000']
        if any(x in line for x in trigger_words):
            name = "Unknown"
            links = re.findall(r'\[\[([^\]]+)\]\]', line)
            if links:
                parts = links[0].split('|')
                name = parts[1] if len(parts) > 1 else parts[0]
                if name == 'Grand Slam' and len(links) > 1:
                    parts2 = links[1].split('|')
                    name = parts2[1] if len(parts2) > 1 else parts2[0]
                    
            category = 'Grand Slam' if 'Grand Slam' in line else 'Finals' if 'Finals' in line else ('Masters 1000' if tour == 'atp' else 'WTA 1000')
            surface = 'Hard' if 'Hard' in line else 'Clay' if 'Clay' in line else 'Grass' if 'Grass' in line else 'Hard'
            
            city = "Unknown"
            if len(links) > 1:
                parts = links[1].split('|')
                city = parts[1] if len(parts) > 1 else parts[0]
                if city in ['Grand Slam', 'ATP Masters 1000', 'WTA 1000', 'ATP Tour Masters 1000']:
                    city = "Unknown"
            
            dates_split = current_dates.split('-')
            start_date_str = dates_split[0].strip() if len(dates_split) > 0 else ''
            end_date_str = dates_split[-1].strip() if len(dates_split) > 0 else start_date_str
            
            try:
                start_date = datetime.strptime(f"{start_date_str} {year}", "%d %b %Y").strftime("%Y-%m-%d")
            except:
                start_date = f"{year}-01-01"
            
            try:
                end_date = datetime.strptime(f"{end_date_str} {year}", "%d %b %Y").strftime("%Y-%m-%d")
            except:
                end_date = start_date
                
            if name and not any(x in name for x in ['Grand Slam', 'ATP Masters', 'WTA 1000']):
                # Simple deduplication
                if not any(r['name'] == name for r in results):
                    safe_id = re.sub(r'[^a-z0-9]', '-', name.lower())
                    results.append({
                        "id": f"{category[:2].lower()}-{safe_id}",
                        "name": name,
                        "city": city,
                        "country": "UNK",
                        "surface": surface,
                        "tour": tour,
                        "category": category,
                        "startDate": start_date,
                        "endDate": end_date
                    })
    log(f"Parsed {len(results)} events for {tour.upper()}")
    return results

def main():
    # If running in December, fetch next year. Otherwise fetch current year.
    now = datetime.now()
    target_year = now.year + 1 if now.month == 12 else now.year
    log(f"Starting calendar sync for target year: {target_year}")
    
    atp_tournaments = fetch_wiki_year('atp', target_year)
    wta_tournaments = fetch_wiki_year('wta', target_year)
    
    all_tournaments = atp_tournaments + wta_tournaments
    
    # Merge Grand Slams (tour: 'both')
    merged_tournaments = []
    seen_gs = set()
    for t in all_tournaments:
        if t['category'] == 'Grand Slam':
            if t['name'] in seen_gs:
                continue
            t['tour'] = 'both'
            seen_gs.add(t['name'])
        merged_tournaments.append(t)
        
    if not merged_tournaments:
        log("ERROR: No tournaments scraped. Aborting to avoid corrupting data.")
        sys.exit(1)
        
    # Sort by start date
    merged_tournaments.sort(key=lambda x: x['startDate'])
    
    # Save to JSON
    target_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'data', 'tournaments.json')
    try:
        with open(target_path, 'w') as f:
            json.dump(merged_tournaments, f, indent=2)
        log(f"SUCCESS: Wrote {len(merged_tournaments)} tournaments to {target_path}")
    except Exception as e:
        log(f"ERROR writing to {target_path}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
