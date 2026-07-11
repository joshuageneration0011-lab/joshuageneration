async function fetchAllMp3s() {
  const allMp3s = [];
  let page = 1;
  
  while (true) {
    const url = `https://joshuasgeneration.net/wp-json/wp/v2/media?per_page=100&page=${page}&mime_type=audio/mpeg&_embed`;
    console.log(`Fetching MP3s page ${page}: ${url}`);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!res.ok) {
      console.log(`Page ${page} returned ${res.status}, stopping.`);
      break;
    }
    
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1');
    const totalItems = res.headers.get('x-wp-total');
    console.log(`Total MP3s: ${totalItems}, Total Pages: ${totalPages}`);
    
    const items = await res.json();
    if (!items.length) break;
    
    for (const item of items) {
      allMp3s.push({
        id: item.id,
        title: item.title?.rendered || item.slug || '',
        description: item.description?.rendered || item.caption?.rendered || '',
        url: item.source_url || item.guid?.rendered || '',
        date: item.date ? item.date.split('T')[0] : '',
        thumbnail: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
        slug: item.slug || ''
      });
    }
    
    if (page >= totalPages) break;
    page++;
  }
  
  console.log(`\nTotal MP3s found: ${allMp3s.length}`);
  
  // Show all MP3 URLs to understand what's there
  allMp3s.forEach((m, i) => {
    console.log(`\n[${i+1}] Title: "${m.title}"`);
    console.log(`     URL: ${m.url}`);
    console.log(`     Date: ${m.date}`);
  });
}

fetchAllMp3s();
