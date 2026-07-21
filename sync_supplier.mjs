import http from 'http';
import querystring from 'querystring';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

function extractSupplierPrices(html) {
  const priceMap = new Map();
  const regex = /<span[^>]*id="MainContent_rptResults_lblArticulo_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblDescription_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblUnitPrice_\d+"[^>]*>\s*([\d\.,]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblInStock_\d+"[^>]*>\s*(\d+)<\/span>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const sku = match[1].trim();
    const name = match[2].trim();
    const priceWholesale = parsePriceString(match[3]);
    const priceRetail = Math.round((priceWholesale * 1.25) * 100) / 100;
    
    const stockUnits = parseInt(match[4], 10) || 0;
    const inStock = stockUnits > 0;

    const info = { priceWholesale, priceRetail, stockUnits, inStock };
    priceMap.set(sku, info);
    priceMap.set(name, info);
  }

  return priceMap;
}

async function syncPrices() {
  console.log("=== SINCRONIZACIÓN DE PRECIOS Y STOCK REAL EN TIEMPO REAL ===");
  
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
  const supplierPriceMap = new Map();

  for (const kw of keywords) {
    console.log(`Obteniendo precios y stock para "${kw}"...`);
    const searchPostData = querystring.stringify({
      '__VIEWSTATE': searchVs,
      '__VIEWSTATEGENERATOR': searchVsg,
      '__EVENTVALIDATION': searchEv,
      'ctl00$MainContent$txtTextToSearch': kw,
      'ctl00$MainContent$imgbtnSearch.x': '15',
      'ctl00$MainContent$imgbtnSearch.y': '15'
    });

    const res = await makeRequest('/Forms/Orders/OrdersFormSearchItems.aspx', 'POST', searchPostData);
    const parsedMap = extractSupplierPrices(res.body);
    parsedMap.forEach((v, k) => supplierPriceMap.set(k, v));
  }

  console.log(`\n✓ Extraída información de precios y stock del portal.`);
  console.log("Actualizando Firebase...");

  const snapshot = await getDocs(collection(db, 'products'));
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const info = supplierPriceMap.get(data.sku) || supplierPriceMap.get(data.name);

    if (info) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        priceWholesale: info.priceWholesale,
        priceRetail: info.priceRetail,
        stockUnits: info.stockUnits,
        inStock: info.inStock,
        updatedAt: new Date()
      });
      updatedCount++;
    }
  }

  console.log(`\n🎉 ¡SINCRONIZACIÓN DE STOCK Y PRECIOS EXITOSA! Se actualizaron ${updatedCount} productos.`);
  process.exit(0);
}

syncPrices();
