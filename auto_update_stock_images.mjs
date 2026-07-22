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

const BAD_KEYWORDS = [
  'watermark', 'wm', 'shutterstock', 'stock-photo', 'vecteezy', 
  'freepik', 'alamy', 'depositphotos', 'dreamstime', 'marca-de-agua', 
  'logo', 'icon', 'banner', 'vector', 'illustration', ' dibujo'
];

async function fetchBingImageUrls(query, requiredCount) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });

    if (!res.ok) return [];
    const html = await res.text();

    const matches = [];
    const seenHostnamesAndPaths = new Set();
    const regex = /murl&quot;:&quot;(https?:\/\/[^&"]+)&quot;/gi;
    let m;

    while ((m = regex.exec(html)) !== null) {
      let imgUrl;
      try {
        imgUrl = decodeURIComponent(m[1]);
      } catch {
        imgUrl = m[1];
      }

      const lower = imgUrl.toLowerCase();

      // Extensión válida de imagen
      if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png') && !lower.endsWith('.webp')) {
        continue;
      }

      // No tener marcas de agua ni logos
      if (BAD_KEYWORDS.some(bad => lower.includes(bad))) {
        continue;
      }

      // Evitar duplicados del mismo host/path
      const key = imgUrl.split('?')[0];
      if (seenHostnamesAndPaths.has(key)) continue;
      seenHostnamesAndPaths.add(key);

      matches.push(imgUrl);
      if (matches.length >= requiredCount) break;
    }

    return matches;
  } catch (err) {
    return [];
  }
}

async function verifyImageUrl(url, timeoutMs = 3500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    clearTimeout(timer);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      return contentType.startsWith('image/');
    }
    return false;
  } catch {
    return false;
  }
}

async function processAllStockProducts() {
  console.log("=== INICIANDO BÚSQUEDA Y ASIGNACIÓN DE IMÁGENES PROFESIONALES ===");
  console.log("Categorías objetivo CON STOCK:");
  console.log(" - Paletas: 4 imágenes por producto");
  console.log(" - Bolsos: 4 imágenes por producto");
  console.log(" - Zapatillas: 4 imágenes por producto");
  console.log(" - Indumentaria / Remeras: 2 imágenes por producto\n");

  const snapshot = await getDocs(collection(db, 'products'));
  const docs = snapshot.docs;

  const targetCategories = ['paletas', 'bolsos', 'zapatillas', 'indumentaria'];
  const stockDocs = docs.filter(docSnap => {
    const p = docSnap.data();
    const inStock = p.inStock !== false && (p.stockUnits == null || p.stockUnits > 0);
    return inStock && targetCategories.includes(p.category);
  });

  console.log(`Encontrados ${stockDocs.length} productos en stock a procesar.\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < stockDocs.length; idx++) {
    const docSnap = stockDocs[idx];
    const p = docSnap.data();

    // Determinar cantidad requerida de fotos
    const requiredCount = p.category === 'indumentaria' ? 2 : 4;

    // Si el producto ya tiene exactamente las fotos asignadas y no son placehold.co, omitir
    const hasValidImages = p.images?.length === requiredCount && !p.images[0].includes('placehold.co');
    if (hasValidImages) {
      skippedCount++;
      continue;
    }

    // Construir término de búsqueda preciso
    const searchTerms = [];
    if (p.brand && p.brand !== 'Otras') searchTerms.push(p.brand);
    searchTerms.push(p.name);
    if (p.category === 'paletas') searchTerms.push('paleta padel');
    else if (p.category === 'zapatillas') searchTerms.push('zapatillas padel');
    else if (p.category === 'bolsos') searchTerms.push('bolso padel');
    else if (p.category === 'indumentaria') searchTerms.push('indumentaria padel');

    const query = searchTerms.join(' ');
    process.stdout.write(`[${idx + 1}/${stockDocs.length}] Buscando ${requiredCount} fotos para "${p.brand} ${p.name.substring(0, 35)}"... `);

    const candidates = await fetchBingImageUrls(query, requiredCount * 3);
    const validImages = [];

    for (const url of candidates) {
      const isOk = await verifyImageUrl(url);
      if (isOk) {
        validImages.push(url);
        if (validImages.length >= requiredCount) break;
      }
    }

    if (validImages.length > 0) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        images: validImages,
        updatedAt: new Date()
      });
      console.log(`✓ Asignadas ${validImages.length}/${requiredCount} imágenes.`);
      updatedCount++;
    } else {
      console.log(`⚠️ Sin imágenes accesibles (se mantiene placeholder por ahora).`);
    }

    // Pequeño retardo para no saturar
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ¡PROCESO DE IMÁGENES FINALIZADO CON ÉXITO!`);
  console.log(`📸 Productos actualizados con fotos profesionales: ${updatedCount}`);
  console.log(`⏭ Productos que ya tenían fotos completas: ${skippedCount}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

processAllStockProducts();
