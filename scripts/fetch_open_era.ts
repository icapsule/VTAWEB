import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const SLAMS = [
  {
    id: 'australian-open',
    url: 'https://en.wikipedia.org/wiki/List_of_Australian_Open_men%27s_singles_champions',
    name: 'Australian Open',
    surface: 'Hard',
    location: 'Melbourne, Australia',
    trophy: '/trophies/ao.svg',
    color: '#005BBB'
  },
  {
    id: 'roland-garros',
    url: 'https://en.wikipedia.org/wiki/List_of_French_Open_men%27s_singles_champions',
    name: 'Roland Garros',
    surface: 'Clay',
    location: 'Paris, France',
    trophy: '/trophies/fo.svg',
    color: '#CB5A36'
  },
  {
    id: 'wimbledon',
    url: 'https://en.wikipedia.org/wiki/List_of_Wimbledon_gentlemen%27s_singles_champions',
    name: 'Wimbledon',
    surface: 'Grass',
    location: 'London, UK',
    trophy: '/trophies/wim.svg',
    color: '#006B3F'
  },
  {
    id: 'us-open',
    url: 'https://en.wikipedia.org/wiki/List_of_US_Open_men%27s_singles_champions',
    name: 'US Open',
    surface: 'Hard',
    location: 'New York, USA',
    trophy: '/trophies/uso.svg',
    color: '#002868'
  }
];

function extractText(el: cheerio.Cheerio<any>) {
  return el.text().replace(/[\*\†\]\[]/g, '').replace(/\(.*?\]/g, '').replace(/ \(.*/, '').split('\\n')[0].trim();
}

function extractCountry(el: cheerio.Cheerio<any>) {
  // If the cell contains an anchor with a title like "Spain", or just 3 letters.
  // We can look at the <a> tags or just grab the text. 
  // Usually it's a 3 letter code like "ESP" or "ESP".
  let txt = el.text().trim();
  if (txt.length === 3 && txt === txt.toUpperCase()) return txt;
  
  // Try to find an anchor with country title
  const title = el.find('a').attr('title');
  if (title) {
    if (title.includes('Spain')) return 'ESP';
    if (title.includes('Serbia')) return 'SRB';
    if (title.includes('Switzerland')) return 'SUI';
    if (title.includes('United States')) return 'USA';
    if (title.includes('Australia')) return 'AUS';
    if (title.includes('France')) return 'FRA';
    if (title.includes('Great Britain') || title.includes('United Kingdom')) return 'GBR';
    if (title.includes('Sweden')) return 'SWE';
    if (title.includes('Germany')) return 'GER';
    if (title.includes('West Germany')) return 'FRG';
    if (title.includes('Russia')) return 'RUS';
    if (title.includes('Italy')) return 'ITA';
    if (title.includes('Argentina')) return 'ARG';
    if (title.includes('Croatia')) return 'CRO';
    if (title.includes('Austria')) return 'AUT';
    if (title.includes('Czech')) return 'CZE';
    if (title.includes('Czechoslovakia')) return 'TCH';
    if (title.includes('Romania')) return 'ROU';
    if (title.includes('South Africa')) return 'RSA';
    if (title.includes('Netherlands')) return 'NED';
    if (title.includes('Ecuador')) return 'ECU';
    if (title.includes('Brazil')) return 'BRA';
  }
  return txt.substring(0, 3).toUpperCase();
}

async function fetchSlam(slam: any) {
  console.log(`Fetching ${slam.name}...`);
  const res = await fetch(slam.url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const champions: any[] = [];
  
  // Try to find the Open Era table specifically
  let table = $('table.wikitable'); // Just grab all tables, the row year check will filter correctly.

  let colMap = { year: 0, champCountry: 1, champ: 2, runnerCountry: 3, runner: 4, score: 5 };

  table.find('tr').each((i, row) => {
    if (i === 0) return; // skip header
    const cols = $(row).find('td, th');
    
    // In some tables, if a year spans multiple rows, or structure varies, check col count
    if (cols.length >= 5) {
      let yearText = $(cols[colMap.year]).text().trim().replace(/\[.*?\]/g, '');
      const year = parseInt(yearText, 10);
      
      if (year >= 1968 && year <= new Date().getFullYear()) {
        let champion = extractText($(cols[colMap.champ]));
        let runnerUp = extractText($(cols[colMap.runner]));
        let score = extractText($(cols[colMap.score]));
        
        let champCountry = extractCountry($(cols[colMap.champCountry]));
        let runnerCountry = extractCountry($(cols[colMap.runnerCountry]));

        // If Wikipedia structure was 4 columns (flag inside name cell)
        if (!score || score.length < 3 || score.includes('ESP') || score.includes('USA')) {
          // Fallback parsing if the columns are shifted
          champion = extractText($(cols[1]));
          runnerUp = extractText($(cols[2]));
          score = extractText($(cols[3]));
          champCountry = extractCountry($(cols[1]));
          runnerCountry = extractCountry($(cols[2]));
        }

        // Hardcode overrides for specific missing or weird Wikipedia parsing:
        if (champion === 'Carlos Alcaraz' || champion === 'Rafael Nadal') champCountry = 'ESP';
        if (champion === 'Novak Djokovic') champCountry = 'SRB';
        if (champion === 'Roger Federer' || champion === 'Stan Wawrinka') champCountry = 'SUI';
        if (champion === 'Jannik Sinner') champCountry = 'ITA';
        if (champion === 'Daniil Medvedev') champCountry = 'RUS';
        if (champion === 'Dominic Thiem') champCountry = 'AUT';
        if (champion === 'Andy Murray') champCountry = 'GBR';
        if (champion === 'Marin Čilić') champCountry = 'CRO';
        if (champion === 'Juan Martín del Potro') champCountry = 'ARG';
        if (champion === 'Lleyton Hewitt') champCountry = 'AUS';
        if (champion === 'Marat Safin') champCountry = 'RUS';
        if (champion === 'Pete Sampras' || champion === 'Andre Agassi' || champion === 'Andy Roddick') champCountry = 'USA';
        if (champion === 'Björn Borg' || champion === 'Stefan Edberg' || champion === 'Mats Wilander') champCountry = 'SWE';
        if (champion === 'Boris Becker' || champion === 'Michael Stich') champCountry = 'GER';
        if (champion === 'Ivan Lendl') champCountry = 'CZE';
        if (champion === 'Gustavo Kuerten') champCountry = 'BRA';
        if (champion === 'Yevgeny Kafelnikov') champCountry = 'RUS';
        if (champion === 'Thomas Muster') champCountry = 'AUT';
        if (champion === 'Jim Courier' || champion === 'Michael Chang' || champion === 'Jimmy Connors' || champion === 'John McEnroe') champCountry = 'USA';
        
        if (runnerUp === 'Daniil Medvedev' || runnerUp === 'Marat Safin' || runnerUp === 'Yevgeny Kafelnikov') runnerCountry = 'RUS';
        if (runnerUp === 'Stefanos Tsitsipas') runnerCountry = 'GRE';
        if (runnerUp === 'Alexander Zverev') runnerCountry = 'GER';
        if (runnerUp === 'Casper Ruud') runnerCountry = 'NOR';
        if (runnerUp === 'Matteo Berrettini') runnerCountry = 'ITA';
        if (runnerUp === 'Nick Kyrgios') runnerCountry = 'AUS';
        if (runnerUp === 'Kevin Anderson') runnerCountry = 'RSA';
        if (runnerUp === 'Milos Raonic') runnerCountry = 'CAN';
        if (runnerUp === 'Kei Nishikori') runnerCountry = 'JPN';
        if (runnerUp === 'David Ferrer' || runnerUp === 'Juan Carlos Ferrero' || runnerUp === 'Carlos Moyá') runnerCountry = 'ESP';
        if (runnerUp === 'Robin Söderling' || runnerUp === 'Thomas Enqvist') runnerCountry = 'SWE';
        if (runnerUp === 'Fernando González') runnerCountry = 'CHI';
        if (runnerUp === 'Marcos Baghdatis') runnerCountry = 'CYP';
        if (runnerUp === 'Jo-Wilfried Tsonga' || runnerUp === 'Arnaud Clément') runnerCountry = 'FRA';
        if (runnerUp === 'Mark Philippoussis') runnerCountry = 'AUS';
        if (runnerUp === 'Lleyton Hewitt') runnerCountry = 'AUS';
        if (runnerUp === 'Goran Ivanišević') runnerCountry = 'CRO';
        if (runnerUp === 'Cedric Pioline') runnerCountry = 'FRA';

        if (champion && runnerUp && score && !champion.includes('Tournament') && !champion.includes('Not held') && !champion.includes('World War')) {
          champions.push({ year, champion, champCountry, runnerUp, runnerCountry, score });
        }
      }
    }
  });

  // De-duplicate by year (sometimes tables have row spans or duplicates)
  const unique = [];
  const years = new Set();
  for (const c of champions) {
    if (!years.has(c.year)) {
      unique.push(c);
      years.add(c.year);
    }
  }

  unique.sort((a, b) => b.year - a.year);
  console.log(`Found ${unique.length} Open Era records for ${slam.name}`);
  return unique;
}

async function run() {
  const result: any = {};
  for (const slam of SLAMS) {
    const champs = await fetchSlam(slam);
    result[slam.id] = {
      name: slam.name,
      surface: slam.surface,
      location: slam.location,
      trophy: slam.trophy,
      color: slam.color,
      champions: champs
    };
  }

  const outPath = path.join(process.cwd(), 'src', 'lib', 'data', 'grand-slams-history.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`Successfully saved complete Open Era data to ${outPath}`);
}

run();
