import http from 'http';
import querystring from 'querystring';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

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

/**
 * Función robusta para transformar precios del portal ("464,035.00" -> 464035)
 */
function parsePriceString(priceStr) {
  if (!priceStr) return 0;
  let cleaned = priceStr.trim();
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > -1 && lastDot > -1) {
    if (lastDot > lastComma) {
      // Formato EE.UU.: "464,035.00" -> coma es miles, punto es decimal
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Formato ES: "464.035,00" -> punto es miles, coma es decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastComma > -1) {
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function classifyProduct(name, sku, defaultBrand = '') {
  const lower = name.toLowerCase();

  let brand = defaultBrand;
  const knownBrands = ['Bullpadel', 'Nox', 'Head', 'Adidas', 'Siux', 'Wilson', 'Varlion', 'Black Crown', 'Cartri', 'Bewe', 'Odea', 'Orygen', 'Sane', 'Toalson', 'Madma', 'Magnus', 'Winar'];
  const foundBrand = knownBrands.find(b => lower.includes(b.toLowerCase()));
  if (foundBrand) brand = foundBrand;

  let category = 'paletas';
  let subcategory = '';

  if (lower.includes('zapatilla') || lower.includes('calzado') || lower.includes('shoe') || sku.includes('ZAP')) {
    category = 'zapatillas';
  } else if (lower.includes('bolso') || lower.includes('mochila') || lower.includes('paletero') || lower.includes('raquetera') || lower.includes('neceser') || lower.includes('trolley')) {
    category = 'bolsos';
  } else if (lower.includes('tubo') || lower.includes('pelota') || lower.includes('bola') || lower.includes('canasto')) {
    category = 'pelotas';
  } else if (lower.includes('remera') || lower.includes('pantalon') || lower.includes('short') || lower.includes('musculosa') || lower.includes('pollera') || lower.includes('camper') || lower.includes('buzo')) {
    category = 'indumentaria';
  } else if (
    lower.includes('grip') || lower.includes('overgrip') || lower.includes('protector') || 
    lower.includes('muñequera') || lower.includes('antivibrador') || lower.includes('gorra') || 
    lower.includes('vincha') || lower.includes('toalla') || lower.includes('gel') || lower.includes('funda') || lower.includes('media')
  ) {
    category = 'accesorios';

    if (lower.includes('grip') || lower.includes('overgrip')) {
      subcategory = 'cubre-grips';
    } else if (lower.includes('protector')) {
      if (lower.includes('aleta')) {
        subcategory = 'protectores-con-aletas';
      } else {
        subcategory = 'protectores-sin-aletas';
      }
    } else if (lower.includes('muñequera')) {
      subcategory = 'munequeras';
    } else if (lower.includes('gorra')) {
      subcategory = 'gorras';
    } else if (lower.includes('vincha')) {
      subcategory = 'vinchas';
    } else if (lower.includes('media')) {
      subcategory = 'medias';
    } else if (lower.includes('funda')) {
      subcategory = 'fundas';
    } else if (lower.includes('antivibrador')) {
      subcategory = 'antivibradores';
    } else if (lower.includes('gel')) {
      subcategory = 'gel-antideslizante';
    }
  } else if (lower.includes('pala') || lower.includes('paleta') || sku.includes('PAL')) {
    category = 'paletas';
  }

  return { category, subcategory, brand };
}

function parseProductsFromHtml(html, defaultBrand = '') {
  const products = [];
  const regex = /<span[^>]*id="MainContent_rptResults_lblArticulo_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblDescription_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblUnitPrice_\d+"[^>]*>\s*([\d\.,]+)<\/span>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const sku = match[1].trim();
    const name = match[2].trim();
    const priceWholesale = parsePriceString(match[3]);
    const priceRetail = Math.round((priceWholesale * 1.25) * 100) / 100;

    const { category, subcategory, brand } = classifyProduct(name, sku, defaultBrand);

    const lower = name.toLowerCase();
    const isPaleta = category === 'paletas';

    products.push({
      sku,
      name,
      brand,
      category,
      subcategory,
      priceWholesale,
      priceRetail,
      description: `Código oficial: ${sku}. Marca original: ${brand}. Excelente calidad y rendimiento garantizado.`,
      isOffer: false,
      active: true,
      inStock: true,
      featured: isPaleta,
      images: [
        `https://placehold.co/600x600/12121a/00f0ff?text=${encodeURIComponent(name)}`
      ],
      specs: isPaleta ? {
        formato: lower.includes('hack') || lower.includes('vertex') || lower.includes('diamond') ? 'Diamante' : (lower.includes('neuron') || lower.includes('hybrid') ? 'Híbrida' : 'Lágrima'),
        peso_min: 360,
        peso_max: 375,
        marco: 'Carbono 100%',
        placa: lower.includes('18k') ? '18K' : (lower.includes('12k') ? '12K' : '3K'),
        nucleo: lower.includes('black') ? 'Black Eva' : 'Eva',
        nivel: lower.includes('pro') ? 'Pro' : 'Avanzado',
        textura: lower.includes('3d') ? '3D' : 'Rugosa'
      } : {}
    });
  }

  return products;
}

async function cleanAndReseed() {
  console.log("=== 1. LIMPIANDO PRODUCTOS EN FIREBASE CON PRECIOS INCORRECTOS ===");
  const snapshot = await getDocs(collection(db, 'products'));
  let deletedCount = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'products', docSnap.id));
    deletedCount++;
  }
  console.log(`✓ Se eliminaron ${deletedCount} productos.`);

  console.log("\n=== 2. INICIANDO IMPORTACIÓN CON PRECIOS COMPLETOS EN MILES ($464.035,00) ===");
  
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

  const keywords = ['Bullpadel', 'Nox', 'Head', 'Adidas', 'Siux', 'Wilson', 'Grip', 'Zapatilla', 'Mochila', 'Pelota'];
  let totalUploaded = 0;
  const processedSkus = new Set();

  for (const kw of keywords) {
    console.log(`\nProcesando búsqueda para "${kw}"...`);
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
    
    let kwCount = 0;
    for (const prod of products) {
      if (processedSkus.has(prod.sku)) continue;
      processedSkus.add(prod.sku);

      prod.createdAt = new Date();
      prod.updatedAt = new Date();
      await addDoc(collection(db, 'products'), prod);
      console.log(`   + [${prod.category.toUpperCase()}] ${prod.name} -> Mayorista: $${prod.priceWholesale.toLocaleString('es-AR')} | Minorista: $${prod.priceRetail.toLocaleString('es-AR')}`);
      kwCount++;
      totalUploaded++;
    }
    console.log(`  ✓ ${kwCount} productos procesados con importes completos para "${kw}".`);
  }

  console.log(`\n🎉 ¡REIMPORTACIÓN COMPLETADA! Se crearon ${totalUploaded} productos con sus montos reales de miles.`);
  process.exit(0);
}

cleanAndReseed();
