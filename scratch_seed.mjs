import http from 'http';
import querystring from 'querystring';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwWA60gGszPQQ6KDJ0dDd5gWnUEygTB14",
  authDomain: "padel-ventas.firebaseapp.com",
  projectId: "padel-ventas",
  storageBucket: "padel-ventas.firebasestorage.app",
  messagingSenderId: "957509698700",
  appId: "1:957509698700:web:dfc30e7ac62e13491aa7a9",
  measurementId: "G-294LDSXKNQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cookieJar = {};

function updateCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  const list = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  list.forEach(c => {
    const pair = c.split(';')[0];
    const [key, val] = pair.split('=');
    if (key && val) {
      cookieJar[key.trim()] = val.trim();
    }
  });
}

function getCookieHeader() {
  return Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
}

function makeRequest(pathUrl, method = 'GET', postData = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '179.43.118.91',
      port: 8084,
      path: pathUrl,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cookie': getCookieHeader()
      }
    };

    if (postData) {
      reqOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      updateCookies(res.headers['set-cookie']);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function followRedirects(startUrl, method = 'GET', postData = null) {
  let currUrl = startUrl;
  let currMethod = method;
  let currData = postData;
  let attempts = 0;

  while (attempts < 10) {
    attempts++;
    const res = await makeRequest(currUrl, currMethod, currData);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      currUrl = res.headers.location;
      currMethod = 'GET';
      currData = null;
    } else {
      return res;
    }
  }
}

function parseProductsFromHtml(html, defaultBrand = '') {
  const products = [];
  // Correct regex matching lblDescription_
  const regex = /<span[^>]*id="MainContent_rptResults_lblArticulo_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblDescription_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblUnitPrice_\d+"[^>]*>\s*([\d\.,]+)<\/span>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const sku = match[1].trim();
    const name = match[2].trim();
    const rawPrice = match[3].trim().replace(/\./g, '').replace(',', '.');
    const priceWholesale = parseFloat(rawPrice) || 0;
    const priceRetail = Math.round(priceWholesale * 1.25);

    let brand = defaultBrand;
    const knownBrands = ['Bullpadel', 'Nox', 'Head', 'Adidas', 'Siux', 'Wilson', 'Varlion', 'Black Crown', 'Cartri', 'Bewe'];
    const found = knownBrands.find(b => name.toLowerCase().includes(b.toLowerCase()));
    if (found) brand = found;

    let category = 'paletas';
    const lower = name.toLowerCase();
    if (lower.includes('bolso') || lower.includes('mochila') || lower.includes('paletero') || lower.includes('raquetera')) {
      category = 'bolsos';
    } else if (lower.includes('tubo') || lower.includes('pelota') || lower.includes('bola')) {
      category = 'pelotas';
    } else if (lower.includes('grip') || lower.includes('protector') || lower.includes('muñequera')) {
      category = 'accesorios';
    } else if (lower.includes('remera') || lower.includes('pantalon') || lower.includes('short') || lower.includes('media')) {
      category = 'indumentaria';
    } else if (lower.includes('zapatilla') || lower.includes('calzado')) {
      category = 'zapatillas';
    }

    products.push({
      sku,
      name,
      brand,
      category,
      priceWholesale,
      priceRetail,
      description: `Código oficial: ${sku}. Marca original: ${brand}.`,
      isOffer: false,
      active: true,
      featured: category === 'paletas',
      images: [
        `https://placehold.co/600x600/12121a/00f0ff?text=${encodeURIComponent(name)}`
      ],
      specs: category === 'paletas' ? {
        formato: lower.includes('hack') || lower.includes('vertex') ? 'Diamante' : (lower.includes('neuron') ? 'Híbrida' : 'Lágrima'),
        peso_min: 360,
        peso_max: 375,
        marco: 'Carbono 100%',
        placa: lower.includes('18k') ? '18K' : '12K',
        nucleo: 'EVA',
        nivel: 'Avanzado / Pro',
        textura: 'Rugosa'
      } : {}
    });
  }

  return products;
}

async function scrapeAndUpload() {
  console.log("=== INICIANDO EXTRACCIÓN Y CARGA EN FIREBASE ===");
  
  const initialRes = await makeRequest('/Login.aspx', 'GET');
  const vs = (initialRes.body.match(/id="__VIEWSTATE"\s+value="([^"]*)"/) || [])[1] || '';
  const vsg = (initialRes.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/) || [])[1] || '';
  const ev = (initialRes.body.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/) || [])[1] || '';

  const loginData = querystring.stringify({
    '__VIEWSTATE': vs,
    '__VIEWSTATEGENERATOR': vsg,
    '__EVENTVALIDATION': ev,
    'ctl00$MainContent$LoginUser$UserName': 'diego.daverio',
    'ctl00$MainContent$LoginUser$Password': 'Feli15578610',
    'ctl00$MainContent$LoginUser$LoginButton': 'Ingresar'
  });

  const searchPageRes = await followRedirects('/Login.aspx', 'POST', loginData);

  const searchVs = (searchPageRes.body.match(/id="__VIEWSTATE"\s+value="([^"]*)"/) || [])[1] || '';
  const searchVsg = (searchPageRes.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/) || [])[1] || '';
  const searchEv = (searchPageRes.body.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/) || [])[1] || '';

  const keywords = ['Bullpadel', 'Nox', 'Head', 'Adidas', 'Siux', 'Wilson', 'Grip'];
  let totalUploaded = 0;

  for (const kw of keywords) {
    console.log(`\nBuscando productos de "${kw}"...`);
    const searchPostData = querystring.stringify({
      '__VIEWSTATE': searchVs,
      '__VIEWSTATEGENERATOR': searchVsg,
      '__EVENTVALIDATION': searchEv,
      'ctl00$MainContent$txtTextToSearch': kw,
      'ctl00$MainContent$imgbtnSearch.x': '15',
      'ctl00$MainContent$imgbtnSearch.y': '15'
    });

    const res = await makeRequest('/Forms/Orders/OrdersFormSearchItems.aspx', 'POST', searchPostData);
    const products = parseProductsFromHtml(res.body, kw);
    
    console.log(`✓ ${products.length} productos procesados para "${kw}". Guardando en Firebase...`);

    for (const prod of products) {
      prod.createdAt = new Date();
      prod.updatedAt = new Date();
      await addDoc(collection(db, 'products'), prod);
      console.log(`   + Cargado: [${prod.category.toUpperCase()}] ${prod.name} (Mayorista: $${prod.priceWholesale} | Minorista: $${prod.priceRetail})`);
      totalUploaded++;
    }
  }

  console.log(`\n🎉 ¡PROCESO COMPLETADO! Se crearon ${totalUploaded} productos reales en tu Firebase.`);
  process.exit(0);
}

scrapeAndUpload();
