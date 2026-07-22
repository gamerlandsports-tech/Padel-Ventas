import http from 'http';
import querystring from 'querystring';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

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

function parsePriceString(priceStr) {
  if (!priceStr) return 0;
  let cleaned = priceStr.trim();
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastComma > -1 && lastDot > -1) {
    if (lastDot > lastComma) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
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

  const knownBrands = [
    { name: 'OD PRO', aliases: ['od pro', 'odpro'] },
    { name: 'Odear', aliases: ['odear', 'odea'] },
    { name: 'Bullpadel', aliases: ['bullpadel'] },
    { name: 'Nox', aliases: ['nox'] },
    { name: 'Head', aliases: ['head'] },
    { name: 'Adidas', aliases: ['adidas'] },
    { name: 'Siux', aliases: ['siux'] },
    { name: 'Wilson', aliases: ['wilson'] },
    { name: 'Varlion', aliases: ['varlion'] },
    { name: 'Black Crown', aliases: ['black crown', 'blackcrown'] },
    { name: 'Cartri', aliases: ['cartri'] },
    { name: 'Bewe', aliases: ['bewe'] },
    { name: 'Sane', aliases: ['sane'] },
    { name: 'Toalson', aliases: ['toalson'] },
    { name: 'Madma', aliases: ['madma'] },
    { name: 'Magnus', aliases: ['magnus'] },
    { name: 'Winar', aliases: ['winar', 'wiinar'] },
    { name: 'Lasaig', aliases: ['lasaig'] },
    { name: 'Prokennex', aliases: ['prokennex'] },
    { name: 'Wingpadel', aliases: ['wingpadel'] },
    { name: 'Versus', aliases: ['versus'] },
    { name: 'Softee', aliases: ['softee'] },
    { name: 'Hirostar', aliases: ['hirostar'] },
    { name: 'Hyperlight', aliases: ['hyperlight'] },
    { name: 'Coast', aliases: ['coast'] },
    { name: 'Saro', aliases: ['saro'] },
    { name: 'Royal', aliases: ['royal'] },
    { name: "J'Hayber", aliases: ["j'hayber", 'jhayber', 'j hayber'] },
    { name: 'StarVie', aliases: ['starvie', 'star vie'] },
    { name: 'Babolat', aliases: ['babolat'] },
    { name: 'Drop Shot', aliases: ['drop shot', 'dropshot'] },
    { name: 'Dunlop', aliases: ['dunlop'] },
    { name: 'Kelme', aliases: ['kelme'] },
    { name: 'Asics', aliases: ['asics'] },
    { name: 'Joma', aliases: ['joma'] },
  ];

  let brand = defaultBrand.trim();

  // Buscar coincidencia por marcas conocidas
  for (const bObj of knownBrands) {
    if (bObj.aliases.some(alias => lower.includes(alias))) {
      brand = bObj.name;
      break;
    }
  }

  if (!brand) {
    brand = 'Otras';
  }

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
  const regex = /<span[^>]*id="MainContent_rptResults_lblArticulo_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblDescription_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblUnitPrice_\d+"[^>]*>\s*([\d\.,]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblInStock_\d+"[^>]*>\s*(\d+)<\/span>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const sku = match[1].trim();
    const name = match[2].trim();
    const priceWholesale = parsePriceString(match[3]);
    const priceRetail = Math.round((priceWholesale * 1.25) * 100) / 100;
    
    const stockUnits = parseInt(match[4], 10) || 0;
    const inStock = stockUnits > 0;

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
      inStock: inStock,
      stockUnits: stockUnits,
      featured: isPaleta && inStock,
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

async function importMissingProducts() {
  console.log("=== 1. LEYENDO PRODUCTOS EXISTENTES EN FIREBASE ===");
  const snapshot = await getDocs(collection(db, 'products'));
  const existingSkus = new Set();
  const existingNames = new Set();

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    if (data.sku) existingSkus.add(String(data.sku).trim().toUpperCase());
    if (data.name) existingNames.add(String(data.name).trim().toLowerCase());
  });

  console.log(`✓ Encontrados ${existingSkus.size} productos existentes en Firebase. (NO se eliminarán ni sobreescribirán)`);

  console.log("\n=== 2. AUTENTICANDO EN PORTAL PROVEEDOR ===");
  const initialRes = await makeRequest('/Login.aspx', 'GET');
  const vs = (initialRes.body.match(/id="__VIEWSTATE"\s+value="([^"]*)"/) || [])[1] || '';
  const vsg = (initialRes.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/) || [])[1] || '';
  const ev = (initialRes.body.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/) || [])[1] || '';

  const loginData = querystring.stringify({
    '__VIEWSTATE': vs,
    '__VIEWSTATEGENERATOR': vsg,
    '__EVENTVALIDATION': ev,
    'ctl00$MainContent$LoginUser$UserName': 'diego.daverio',
    'ctl00$MainContent$LoginUser$Password': 'FeliAguTito2026'
  });

  const loginRes = await makeRequest('/Login.aspx', 'POST', loginData);
  let searchPageRes;
  if (loginRes.statusCode === 302) {
    searchPageRes = await followRedirects(loginRes.headers.location || '/Default.aspx', 'GET');
  } else {
    searchPageRes = await followRedirects('/Login.aspx', 'POST', querystring.stringify({
      '__VIEWSTATE': vs,
      '__VIEWSTATEGENERATOR': vsg,
      '__EVENTVALIDATION': ev,
      'ctl00$MainContent$LoginUser$UserName': 'diego.daverio',
      'ctl00$MainContent$LoginUser$Password': 'Feli15578610',
      'ctl00$MainContent$LoginUser$LoginButton': 'Ingresar'
    }));
  }

  const searchVs = (searchPageRes.body.match(/id="__VIEWSTATE"\s+value="([^"]*)"/) || [])[1] || '';
  const searchVsg = (searchPageRes.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]*)"/) || [])[1] || '';
  const searchEv = (searchPageRes.body.match(/id="__EVENTVALIDATION"\s+value="([^"]*)"/) || [])[1] || '';

  // Lista exhaustiva de marcas y búsquedas solicitadas
  const searchKeywords = [
    '', // Búsqueda vacía para intentar listar todo
    'HIROSTAR',
    'TOALSON',
    'LASAIG',
    'WINGPADEL',
    'SOFTEE',
    'VERSUS',
    'MADMA',
    'MAGNUS',
    'ODPRO',
    'OD PRO',
    'ODEA',
    'ODEAR',
    'WINAR',
    'WIINAR',
    'SANE',
    'BULLPADEL',
    'NOX',
    'HEAD',
    'ADIDAS',
    'SIUX',
    'WILSON',
    'BABOLAT',
    'VARLION',
    'STARVIE',
    'DROP SHOT',
    'DUNLOP',
    'KELME',
    'ASICS',
    'JOMA',
    'CARTRI',
    'ROYAL',
    'COAST',
    'SARO',
    'HYPERLIGHT',
    'BLACK CROWN',
    'J`HAYBER',
    'BEWE',
    'ORYGEN',
    'PROKENNEX',
    'ZAPATILLA',
    'MOCHILA',
    'PALETERO',
    'PELOTA',
    'GRIP',
    'PROTECTOR',
    'REMERA',
    'SHORT',
    'PANTALON',
    'BUZO'
  ];

  console.log("\n=== 3. ESCANEANDO PORTAL DEL PROVEEDOR E IMPORTANDO SOLO PRODUCTOS NUEVOS ===");

  const sessionImportedSkus = new Set();
  let totalNewAdded = 0;
  let totalSkippedAlreadyExists = 0;

  for (const kw of searchKeywords) {
    const searchLabel = kw === '' ? '[TODOS / VACÍO]' : `"${kw}"`;
    process.stdout.write(`Escaneando ${searchLabel}... `);

    const searchPostData = querystring.stringify({
      '__VIEWSTATE': searchVs,
      '__VIEWSTATEGENERATOR': searchVsg,
      '__EVENTVALIDATION': searchEv,
      'ctl00$MainContent$txtTextToSearch': kw,
      'ctl00$MainContent$imgbtnSearch.x': '15',
      'ctl00$MainContent$imgbtnSearch.y': '15'
    });

    try {
      const res = await makeRequest('/Forms/Orders/OrdersFormSearchItems.aspx', 'POST', searchPostData);
      const foundProducts = parseProductsFromHtml(res.body, kw);

      let kwAddedCount = 0;
      let kwSkippedCount = 0;

      for (const prod of foundProducts) {
        const normSku = String(prod.sku).trim().toUpperCase();
        const normName = String(prod.name).trim().toLowerCase();

        // Verificar si ya existe en Firebase o si fue importado en esta sesión
        if (existingSkus.has(normSku) || existingNames.has(normName) || sessionImportedSkus.has(normSku)) {
          kwSkippedCount++;
          totalSkippedAlreadyExists++;
          continue;
        }

        // Es un producto nuevo -> Agregar a Firebase
        prod.createdAt = new Date();
        prod.updatedAt = new Date();

        await addDoc(collection(db, 'products'), prod);

        // Registrar en los Sets para no duplicarlo en siguientes iteraciones
        existingSkus.add(normSku);
        existingNames.add(normName);
        sessionImportedSkus.add(normSku);

        const stockBadge = prod.inStock ? `[STOCK: ${prod.stockUnits}]` : '[SIN STOCK]';
        console.log(`\n    ✨ NUEVO: ${stockBadge} [${prod.brand}] ${prod.name} -> $${prod.priceRetail.toLocaleString('es-AR')}`);

        kwAddedCount++;
        totalNewAdded++;
      }

      console.log(`Encontrados ${foundProducts.length} items (${kwAddedCount} NUEVOS agregados, ${kwSkippedCount} ya existían).`);
    } catch (err) {
      console.log(`Error buscando ${searchLabel}: ${err.message}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ¡PROCESO DE EXTRACCIÓN Y COMPARACIÓN FINALIZADO!`);
  console.log(`📦 Nuevos productos agregados a Firebase: ${totalNewAdded}`);
  console.log(`⏭ Productos preexistentes respetados sin cambios: ${totalSkippedAlreadyExists}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

importMissingProducts();
