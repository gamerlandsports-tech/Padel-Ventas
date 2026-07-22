import https from 'https';
import http from 'http';

function searchDuckDuckGoImages(query) {
  return new Promise((resolve, reject) => {
    const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&v7=1`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://duckduckgo.com/'
      }
    };

    // Primero obtener vqd token
    https.get(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const vqdMatch = body.match(/vqd=["']([^"']+)["']/);
        if (!vqdMatch) {
          return resolve([]);
        }
        const vqd = vqdMatch[1];
        const apiUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&v7=1&vqd=${vqd}`;
        
        https.get(apiUrl, options, (res2) => {
          let body2 = '';
          res2.on('data', chunk => body2 += chunk);
          res2.on('end', () => {
            try {
              const data = JSON.parse(body2);
              const results = (data.results || []).map(r => r.image);
              resolve(results);
            } catch (e) {
              resolve([]);
            }
          });
        }).on('error', () => resolve([]));
      });
    }).on('error', () => resolve([]));
  });
}

async function test() {
  console.log("Probando búsqueda de imágenes para 'Bullpadel Hack 03'...");
  const images = await searchDuckDuckGoImages('Bullpadel Hack 03 padel');
  console.log("Imágenes encontradas:", images.slice(0, 5));
  process.exit(0);
}

test();
