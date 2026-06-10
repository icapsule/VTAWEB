import re
import requests

def test_wiki_parse():
    url = 'https://en.wikipedia.org/w/api.php?action=parse&page=2026_ATP_Finals&prop=wikitext&format=json'
    headers = {'User-Agent': 'VTAWEB_Bot/1.0'}
    res = requests.get(url, headers=headers)
    wikitext = res.json().get('parse', {}).get('wikitext', {}).get('*', '')
    
    # Extract Singles table
    table_match = re.search(r'===\s*Singles\s*===.*?\{\|class="wikitable.*?\n(.*?)\n\|\}', wikitext, re.DOTALL)
    if not table_match:
        print("Could not find table")
        return
        
    singles_text = table_match.group(1)
    
    # Regex to find player rows:
    # Example row:
    rows_raw = singles_text.split('|-')
    for row in rows_raw:
        if 'align="left"' not in row:
            continue
        
        lines = [line.strip() for line in row.strip().split('\n')]
        
        # Find rank, name, points using simple search
        rank_match = re.search(r'\|\s*(\d+)', row)
        name_match = re.search(r'\[\[(.*?)\]\]', row)
        points_match = re.search(r'\!\s*([\d,]+)', row)
        
        if rank_match and name_match and points_match:
            rank = rank_match.group(1)
            name_raw = name_match.group(1)
            name = name_raw.split('|')[0] if '|' in name_raw else name_raw
            points = points_match.group(1).replace(',', '')
            print(f"Rank {rank}: {name} ({points} pts)")
        else:
            if rank_match:
                if rank_match.group(1) == '5':
                    print(f"ROW 5 IS: {repr(row)}")
                print(f"Failed parsing Rank {rank_match.group(1)}: name={bool(name_match)} points={bool(points_match)}")

test_wiki_parse()
