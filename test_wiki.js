async function fetchWiki() {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=2026_WTA_Tour&prop=wikitext&format=json`;
  const res = await fetch(url);
  const json = await res.json();
  const wikitext = json.parse.wikitext['*'];
  const lines = wikitext.split('\n');
  for (const line of lines) {
    if (line.includes('Australian Open') || line.includes('French Open') || line.includes('Roland Garros')) {
      console.log(line);
    }
  }
}
fetchWiki();
