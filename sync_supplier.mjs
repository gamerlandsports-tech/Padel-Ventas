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

function extractSupplierPrices(html) {
  const priceMap = new Map();
  const regex = /<span[^>]*id="MainContent_rptResults_lblArticulo_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblDescription_\d+"[^>]*>\s*([^<]+)<\/span>[\s\S]*?<span[^>]*id="MainContent_rptResults_lblUnitPrice_\d+"[^>]*>\s*([\d\.,]+)<\/span>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const sku = match[1].trim();
    const name = match[2].trim();
    const rawPrice = match[3].trim().replace(/\./g, '').replace(',', '.');
    const priceWholesale = parseFloat(rawPrice) || 0;
    
    // 2 decimales exactos
    const exactWholesale = Math.round(priceWholesale * 100) / 100;
    const exactRetail = Math.round((exactWholesale * 1.25) * 100) / 100;

    priceMap.set(sku, { priceWholesale: exactWholesale, priceRetail: exactRetail });
    priceMap.set(name, { priceWholesale: exactWholesale, priceRetail: exactRetail });
  }

  return priceMap;
}

async function syncPrices() {
  console.log("=== SINCRONIZACIÓN DE PRECIOS EN TIEMPO REAL CON EL PROVEEDOR ===");
  
  // 1. Iniciar sesión en el portal
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

  // 2. Consultar marcas para obtener precios frescos
  const keywords = ['Bullpadel', 'Nox', 'Head', 'Adidas', 'Siux', 'Wilson', 'Grip', 'Zapatilla', 'Mochila', 'Pelota'];
  const supplierPriceMap = new Map();

  for (const kw of keywords) {
    console.log(`Obteniendo precios actualizados para "${kw}"...`);
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

  console.log(`\n✓ Se extrajeron precios en vivo para ${supplierPriceMap.size / 2} ítems del portal.`);
  console.log("3. Actualizando productos en Firebase...");

  const snapshot = await getDocs(collection(db, 'products'));
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updatedPrice = supplierPriceMap.get(data.sku) || supplierPriceMap.get(data.name);

    if (updatedPrice) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        priceWholesale: updatedPrice.priceWholesale,
        priceRetail: updatedPrice.priceRetail,
        updatedAt: new Date()
      });
      updatedCount++;
    }
  }

  console.log(`\n🎉 ¡SINCRONIZACIÓN EXITOSA! Se actualizaron los precios con decimales exactos en ${updatedCount} productos.`);
  process.exit(0);
}

syncPrices();
