async function syncTournamentsWiki(tour) {
  const year = new Date().getFullYear();
  const pageName = `${year}_${tour.toUpperCase()}_Tour`;
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageName}&prop=wikitext&format=json`;
  
  const res = await fetch(url);
  const json = await res.json();
  const wikitext = json.parse.wikitext['*'];
  
  const lines = wikitext.split('\n');
  const results = [];
  
  let currentDates = "";
  let insideTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('{| class="wikitable"')) insideTable = true;
    if (line.startsWith('|}')) insideTable = false;
    
    if (!insideTable) continue;

    if (line.startsWith('!') && (line.includes('Jan') || line.includes('Feb') || line.includes('Mar') || line.includes('Apr') || line.includes('May') || line.includes('Jun') || line.includes('Jul') || line.includes('Aug') || line.includes('Sep') || line.includes('Oct') || line.includes('Nov') || line.includes('Dec'))) {
       const match = line.match(/\d{1,2} [A-Z][a-z]{2}/g);
       if (match && line.startsWith('!')) {
           currentDates = match.join(' - ');
       }
    }
    
    if (line.includes('Grand Slam') || line.includes('ATP Masters 1000') || line.includes('WTA 1000') || line.includes('ATP Finals') || line.includes('WTA Finals')) {
       
       let name = "Unknown Tournament";
       const links = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];
       if (links.length > 0) {
           const parts = links[0][1].split('|');
           name = parts.length > 1 ? parts[1] : parts[0];
           if (name === 'Grand Slam' && links.length > 1) {
              const parts2 = links[1][1].split('|');
              name = parts2.length > 1 ? parts2[1] : parts2[0];
           }
       }
       
       let category = line.includes('Grand Slam') ? 'Grand Slam' : 
                      line.includes('Finals') ? 'Finals' : 
                      tour === 'atp' ? 'Masters 1000' : 'WTA 1000';
                      
       if (name && !name.includes('Grand Slam') && !name.includes('ATP Masters') && !name.includes('WTA 1000') && !results.find(r => r.name === name)) {
           results.push({ name, category, originalLine: line });
       }
    }
  }
  return results;
}

syncTournamentsWiki('atp').then(res => console.log('ATP:', res));
syncTournamentsWiki('wta').then(res => console.log('WTA:', res));
