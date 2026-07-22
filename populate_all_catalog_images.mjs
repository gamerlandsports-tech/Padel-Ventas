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

// Filtros estrictos para excluir marcas de agua Y cualquier imagen con personas, modelos o animaciones
const BAD_KEYWORDS = [
  'watermark', 'wm', 'shutterstock', 'stock-photo', 'vecteezy', 
  'freepik', 'alamy', 'depositphotos', 'dreamstime', 'marca-de-agua', 
  'logo', 'icon', 'banner', 'vector', 'illustration', 'dibujo',
  'person', 'people', 'man', 'woman', 'model', 'player', 'jugador', 'jugadora', 
  'modelo', 'hombre', 'mujer', 'chico', 'chica', 'face', 'portrait', 'persona', 
  'foto-persona', 'lifestyle', 'editorial', 'avatar', 'character', 'cartoon', 
  'anime', 'animation', 'wearing', 'outfit', 'pose', 'body', 'cuerpo', 'cara', 
  'rostro', 'selfie', 'lookbook', 'streetstyle'
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

      // No tener marcas de agua, ni personas/modelos/jugadores
      if (BAD_KEYWORDS.some(bad => lower.includes(bad))) {
        continue;
      }

      // Evitar duplicados del mismo host/path
      const key = imgUrl.split('?')[0];
      if (seenHostnamesAndPaths.has(key)) continue;
      seenHostnamesAndPaths.add(key);

      // Usar proxy CDN wsrv.nl para garantizar 200 OK y evadir bloqueo de hotlink/CORS
      const cdnUrl = `https://wsrv.nl/?url=${encodeURIComponent(imgUrl)}&w=600&output=webp`;
      matches.push(cdnUrl);
      if (matches.length >= requiredCount) break;
    }

    return matches;
  } catch (err) {
    return [];
  }
}

async function verifyImageUrl(url, timeoutMs = 4000) {
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
      return contentType.startsWith('image/') || contentType.includes('webp');
    }
    return false;
  } catch {
    return false;
  }
}

async function populateAllCatalogImages() {
  console.log("=== POPULANDO IMÁGENES PROFESIONALES CON PROXY CDN ANTI-BLOQUEO ===");
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
  let userPreservedCount = 0;

  for (let idx = 0; idx < stockDocs.length; idx++) {
    const docSnap = stockDocs[idx];
    const p = docSnap.data();

    // Determinar cantidad requerida de fotos
    const requiredCount = p.category === 'indumentaria' ? 2 : 4;

    // Verificar si el producto tiene fotos subidas manualmente por el usuario (Base64 o Cloudinary)
    const hasUserImages = p.images?.some(img => typeof img === 'string' && (img.startsWith('data:image/') || img.includes('cloudinary.com')));
    if (hasUserImages) {
      console.log(`[${idx + 1}/${stockDocs.length}] ⭐ CONSERVANDO FOTOS DEL USUARIO para "${p.name}"`);
      userPreservedCount++;
      continue;
    }

    // Construir término de búsqueda orientado a producto aislado
    const searchTerms = [];
    if (p.brand && p.brand !== 'Otras') searchTerms.push(p.brand);
    searchTerms.push(p.name);
    
    if (p.category === 'paletas') searchTerms.push('paleta padel producto aislado');
    else if (p.category === 'zapatillas') searchTerms.push('zapatillas padel producto solo');
    else if (p.category === 'bolsos') searchTerms.push('bolso padel producto solo');
    else if (p.category === 'indumentaria') searchTerms.push('prenda producto solo sin persona');

    const query = searchTerms.join(' ');
    process.stdout.write(`[${idx + 1}/${stockDocs.length}] Buscando ${requiredCount} fotos CDN para "${p.brand} ${p.name.substring(0, 35)}"... `);

    const candidates = await fetchBingImageUrls(query, requiredCount * 4);
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
      console.log(`✓ Asignadas ${validImages.length}/${requiredCount} fotos CDN garantizadas.`);
      updatedCount++;
    } else {
      console.log(`⚠️ Reintentando sin palabras secundarias...`);
      // Reintentar búsqueda simplificada si falló
      const simpleQuery = `${p.brand || ''} ${p.name} padel`.trim();
      const fallbackCandidates = await fetchBingImageUrls(simpleQuery, requiredCount * 3);
      const fallbackValid = [];
      for (const url of fallbackCandidates) {
        const isOk = await verifyImageUrl(url);
        if (isOk) {
          fallbackValid.push(url);
          if (fallbackValid.length >= requiredCount) break;
        }
      }
      if (fallbackValid.length > 0) {
        await updateDoc(doc(db, 'products', docSnap.id), {
          images: fallbackValid,
          updatedAt: new Date()
        });
        console.log(`  ✓ Asignadas ${fallbackValid.length}/${requiredCount} fotos CDN fallback.`);
        updatedCount++;
      } else {
        console.log(`  ⚠️ Se mantiene placeholder por ahora.`);
      }
    }

    // Retardo leve
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n==================================================`);
  console.log(`🎉 ¡PROCESO DE IMÁGENES CDN COMPLETADO CON ÉXITO!`);
  console.log(`📸 Productos actualizados con fotos activas CDN: ${updatedCount}`);
  console.log(`⭐ Productos con fotos del usuario conservados: ${userPreservedCount}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

populateAllCatalogImages();
