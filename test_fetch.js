async function fetchBingImages(query, count = 4) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });
    const html = await res.text();
    
    // Bing encodes full original image URLs in murl:"https://..."
    const matches = [];
    const regex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const imgUrl = decodeURIComponent(m[1]);
      const lower = imgUrl.toLowerCase();
      
      // Filter out invalid/watermarked sources
      if (anyExtension(lower) && !hasWatermark(lower)) {
        matches.push(imgUrl);
        if (matches.length >= count) break;
      }
    }
    return matches;
  } catch (err) {
    console.error('Fetch error:', err.message);
    return [];
  }
}

function anyExtension(url) {
  return url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.webp');
}

function hasWatermark(url) {
  const bad = ['watermark', 'wm', 'shutterstock', 'depositphotos', 'dreamstime', 'stock-photo', 'vecteezy', 'freepik', 'alamy'];
  return bad.some(b => url.includes(b));
}

async function test() {
  console.log("Searching Bing for 'Bullpadel Hack 03 2025'...");
  const imgs = await fetchBingImages("Bullpadel Hack 03 2025 paleta", 4);
  console.log("Found images:", imgs);
}

test();
