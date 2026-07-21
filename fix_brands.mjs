import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAwWA60gGszPQQ6KDJ0dDd5gWnUEygTB14",
  authDomain: "padel-ventas.firebaseapp.com",
  projectId: "padel-ventas",
  storageBucket: "padel-ventas.firebasestorage.app",
  messagingSenderId: "957509698700",
  appId: "1:957509698700:web:dfc30e7ac62e13491aa7a9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reglas de detección de marca por nombre del producto (más específicas primero)
const BRAND_RULES = [
  { match: /^OD PRO\s/i,       brand: 'OD PRO' },
  { match: /^ODEAR\s/i,        brand: 'Odear' },
  { match: /^ODEA\s/i,         brand: 'Odear' },
  { match: /^BULLPADEL\s/i,    brand: 'Bullpadel' },
  { match: /^NOX\s/i,          brand: 'Nox' },
  { match: /^SIUX\s/i,         brand: 'Siux' },
  { match: /^ADIDAS\s/i,       brand: 'Adidas' },
  { match: /^WILSON\s/i,       brand: 'Wilson' },
  { match: /^HEAD\s/i,         brand: 'Head' },
  { match: /^MADMA\s/i,        brand: 'Madma' },
  { match: /^MAGNUS\s/i,       brand: 'Magnus' },
  { match: /^SANE\s/i,         brand: 'Sane' },
  { match: /^WINAR\s/i,        brand: 'Winar' },
  { match: /^LASAIG\s/i,       brand: 'Lasaig' },
  { match: /^PROKENNEX\s/i,    brand: 'Prokennex' },
  { match: /^TOALSON\s/i,      brand: 'Toalson' },
  { match: /^ZAPATILLA SIUX\s/i, brand: 'Siux' },
  { match: /^ZAPATILLA NOX\s/i,  brand: 'Nox' },
  { match: /^PALA SIUX\s/i,    brand: 'Siux' },
  { match: /^PALA NOX\s/i,     brand: 'Nox' },
];

function detectBrandFromName(name) {
  for (const rule of BRAND_RULES) {
    if (rule.match.test(name)) return rule.brand;
  }
  return null;
}

async function fixBrands() {
  console.log("=== CORRIGIENDO MARCAS INCORRECTAS EN FIRESTORE ===\n");

  const snapshot = await getDocs(collection(db, 'products'));
  let fixed = 0;
  let skipped = 0;
  const brandCounts = {};

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const detectedBrand = detectBrandFromName(data.name || '');

    if (detectedBrand && detectedBrand !== data.brand) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        brand: detectedBrand,
        updatedAt: new Date()
      });
      console.log(`  ✓ [${data.brand} → ${detectedBrand}] ${data.name}`);
      brandCounts[detectedBrand] = (brandCounts[detectedBrand] || 0) + 1;
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`✅ Corregidos: ${fixed} productos`);
  console.log(`⏭  Sin cambios: ${skipped} productos`);
  console.log(`\nDistribución de marcas corregidas:`);
  Object.entries(brandCounts).sort((a,b) => b[1]-a[1]).forEach(([b, c]) => {
    console.log(`  ${b}: ${c}`);
  });

  process.exit(0);
}

fixBrands();
