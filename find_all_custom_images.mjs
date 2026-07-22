import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function inspectAllImages() {
  console.log("=== INSPECCIÓN COMPLETA DE TODAS LAS IMÁGENES EN FIRESTORE ===");
  const snapshot = await getDocs(collection(db, 'products'));

  const withNonPlaceholderImages = [];
  const allImagesTypes = {};

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const imgs = data.images || [];

    const nonPlaceholder = imgs.filter(img => typeof img === 'string' && !img.includes('placehold.co'));
    if (nonPlaceholder.length > 0) {
      withNonPlaceholderImages.push({
        id: docSnap.id,
        name: data.name,
        brand: data.brand,
        category: data.category,
        images: imgs
      });
    }
  });

  console.log(`Total productos en DB: ${snapshot.docs.length}`);
  console.log(`Productos con imágenes distintas a placeholder: ${withNonPlaceholderImages.length}\n`);

  withNonPlaceholderImages.forEach((item, idx) => {
    console.log(`[${idx + 1}] ID: ${item.id} | ${item.brand} - ${item.name}`);
    item.images.forEach((img, i) => {
      console.log(`    Foto ${i + 1}: ${img.substring(0, 90)}...`);
    });
  });

  process.exit(0);
}

inspectAllImages();
