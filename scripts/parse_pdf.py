import pdfplumber
import re
import json
import os
from datetime import datetime, timedelta

def parse_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), '..', '2026-27-atp-challenger-calendar-as-of-18-jun-2026.pdf')
    json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'data', 'tournaments.json')
    
    with open(json_path, 'r') as f:
        existing_data = json.load(f)
        
    # Keep WTA tournaments
    wta_tournaments = [t for t in existing_data if t['tour'] == 'wta']
    
    results = []
    current_year = 2026
    current_challenger_date = None
    
    surface_map = {
        'H': 'Hard',
        'IH': 'Hard', # Indoor Hard
        'CL': 'Clay',
        'C': 'Clay',
        'G': 'Grass'
    }
    
    # Regex for Challengers
    challenger_regex = re.compile(r'^(?:(\d+)\s+(\d{1,2}-[A-Za-z]{3})\s+)?(.+?)\s+([A-Z]{3})\s+(175|125|100|75|50)\s+(USD|EUR)\s+([\d,]+)\s+([a-zA-Z]+)')

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text: continue
            
            lines = text.split('\n')
            for line in lines:
                if '2027 CALENDAR' in line.upper():
                    current_year = 2027
                elif '2026 CALENDAR' in line.upper():
                    current_year = 2026
                
                # Try matching Challenger
                chal_match = challenger_regex.search(line)
                if chal_match:
                    week, date_str, city, country, cat, currency, prize, surface_code = chal_match.groups()
                    if date_str:
                        current_challenger_date = date_str
                    
                    if not current_challenger_date:
                        continue
                        
                    # Parse date
                    # Pad date if it's single digit (e.g., "5-Jan" to "05-Jan")
                    padded_date = current_challenger_date if len(current_challenger_date.split('-')[0]) == 2 else f"0{current_challenger_date}"
                    try:
                        start_date = datetime.strptime(f"{padded_date} {current_year}", "%d-%b %Y")
                        start_date_str = start_date.strftime("%Y-%m-%d")
                        end_date_str = (start_date + timedelta(days=6)).strftime("%Y-%m-%d")
                    except Exception as e:
                        print(f"Date error on {line}: {e}")
                        continue
                    
                    surface = surface_map.get(surface_code.upper(), 'Hard')
                    name = f"{city.strip()} Challenger"
                    safe_id = re.sub(r'[^a-z0-9]', '-', name.lower())
                    
                    results.append({
                        "id": f"atp-ch-{current_year}-{safe_id}",
                        "name": name,
                        "city": city.strip(),
                        "country": country,
                        "surface": surface,
                        "tour": "atp",
                        "category": "Challenger",
                        "startDate": start_date_str,
                        "endDate": end_date_str
                    })
                    continue

                # Main ATP Tour extraction (fallback for non-Challenger pages)
                date_match = re.search(r'(\d{2}-[A-Z]{3})', line)
                if not date_match:
                    continue
                
                date_str = date_match.group(1)
                
                categories = ['GRAND SLAM', 'ATP MASTERS 1000', 'ATP 500', 'ATP 250', 'UNITED CUP', 'NITTO ATP FINALS', 'NEXT GEN ATP FINALS']
                cat = None
                for c in categories:
                    if c in line:
                        cat = c
                        break
                
                if not cat: 
                    continue
                if cat == 'UNITED CUP': continue 
                
                mapped_cat = cat
                if cat == 'GRAND SLAM': mapped_cat = 'Grand Slam'
                elif cat == 'ATP MASTERS 1000': mapped_cat = 'Masters 1000'
                elif cat == 'ATP 500': mapped_cat = 'ATP 500'
                elif cat == 'ATP 250': mapped_cat = 'ATP 250'
                elif 'FINALS' in cat: mapped_cat = 'Finals'
                
                surf_match = re.search(r'\s(H|IH|CL|G)\s', line + ' ')
                surface = surface_map.get(surf_match.group(1), 'Hard') if surf_match else 'Hard'
                
                city = "Unknown"
                try:
                    date_idx = line.find(date_str)
                    cat_idx = line.find(cat)
                    city_part = line[date_idx+len(date_str):cat_idx].strip()
                    city = re.sub(r'\d+$', '', city_part)
                except:
                    pass
                
                name = "Unknown"
                try:
                    cat_idx = line.find(cat)
                    name_part = line[cat_idx+len(cat):].strip()
                    if surf_match:
                        surf_idx = name_part.rfind(' ' + surf_match.group(1))
                        name = name_part[:surf_idx].strip()
                    else:
                        name = name_part
                except:
                    pass
                
                try:
                    start_date = datetime.strptime(f"{date_str} {current_year}", "%d-%b %Y")
                    start_date_str = start_date.strftime("%Y-%m-%d")
                    end_date_str = (start_date + timedelta(days=6)).strftime("%Y-%m-%d")
                except Exception as e:
                    continue
                    
                safe_id = re.sub(r'[^a-z0-9]', '-', name.lower())
                
                if any(r['name'] == name for r in results if r['startDate'] == start_date_str):
                    continue
                
                results.append({
                    "id": f"atp-{current_year}-{safe_id}",
                    "name": name,
                    "city": city,
                    "country": "UNK", # Handled by map_atp_countries.ts later
                    "surface": surface,
                    "tour": "atp" if mapped_cat != 'Grand Slam' else 'both',
                    "category": mapped_cat,
                    "startDate": start_date_str,
                    "endDate": end_date_str
                })

    # Merge
    all_tournaments = wta_tournaments + results
    # Sort
    all_tournaments.sort(key=lambda x: x['startDate'])
    
    with open(json_path, 'w') as f:
        json.dump(all_tournaments, f, indent=2)
        
    print(f"Parsed {len(results)} ATP events (Main + Challenger) from PDF. Total tournaments: {len(all_tournaments)}")

if __name__ == '__main__':
    parse_pdf()
