import fs from 'fs';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'src/lib/data/tournaments.json');

async function fetchWTA() {
  console.log('Fetching WTA data from official API for 2026 and 2027...');
  
  const years = [2026, 2027];
  let newWtaEvents: any[] = [];

  for (const year of years) {
    try {
      let page = 0;
      let totalPages = 1;
      
      while (page < totalPages) {
        const url = `https://api.wtatennis.com/tennis/tournaments/?page=${page}&pageSize=100&levels=&excludeLevels=ITF&surfaces=&from=${year}-01-01&to=${year}-12-31`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        if (!data.content) {
          break;
        }
        
        newWtaEvents = [...newWtaEvents, ...data.content];
        
        if (data.pageInfo) {
          totalPages = Math.ceil(data.pageInfo.numEntries / data.pageInfo.pageSize);
        }
        page++;
      }
    } catch (e) {
      console.error(`Error fetching WTA API for year ${year}:`, e);
    }
  }

  console.log(`Fetched ${newWtaEvents.length} raw WTA events.`);

  // Load existing data
  let existingData = [];
  if (fs.existsSync(JSON_PATH)) {
    existingData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  }

  // Filter out any existing WTA events (except Grand Slams which are 'both')
  const atpAndSlams = existingData.filter((t: any) => t.tour === 'atp' || t.category === 'Grand Slam' || t.tour === 'both');

  // Map WTA API data to our schema
  const mappedWta = newWtaEvents.map((wta: any) => {
    
    // Map Surface
    let surface = 'Hard';
    if (wta.surface === 'Hard') surface = 'Hard';
    if (wta.surface === 'Clay') surface = 'Clay';
    if (wta.surface === 'Grass') surface = 'Grass';

    // Map Category
    let category = wta.level;
    if (category === 'WTA 1000') category = 'WTA 1000';
    else if (category === 'WTA 500') category = 'WTA 500';
    else if (category === 'WTA 250') category = 'WTA 250';
    else if (category.includes('WTA 125') || category.includes('125K')) category = 'Challenger';
    else if (category.includes('Finals')) category = 'Finals';
    
    // Create clean ID
    const safeName = (wta.title || wta.tournamentGroup?.name || 'wta-event').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const safeId = `wta-${wta.year}-${safeName}`;

    return {
      id: safeId,
      name: (wta.tournamentGroup?.name || wta.title || 'WTA Event').replace(/\b\w/g, (c: string) => c.toUpperCase()), // Title Case
      city: wta.city || 'Unknown',
      country: wta.country || 'UNK',
      surface: surface,
      tour: 'wta',
      category: category,
      startDate: wta.startDate,
      endDate: wta.endDate
    };
  });

  // Since Grand Slams are in ATP PDF already (mapped to 'both'), we should drop Grand Slams from WTA API
  // to avoid duplicates.
  const filteredMappedWta = mappedWta.filter(w => !w.category.toLowerCase().includes('grand slam'));

  const finalCalendar = [...atpAndSlams, ...filteredMappedWta];
  
  // Sort by startDate
  finalCalendar.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  fs.writeFileSync(JSON_PATH, JSON.stringify(finalCalendar, null, 2));
  console.log(`Successfully merged ${filteredMappedWta.length} WTA events. Total calendar size: ${finalCalendar.length}`);
}

fetchWTA();
