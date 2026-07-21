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

async function inspectProducts() {
  const snap = await getDocs(collection(db, 'products'));
  console.log(`Total productos en Firestore: ${snap.docs.length}`);

  const categoriesCount = {};
  const subcategoriesCount = {};

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    const cat = data.category || 'sin-categoria';
    const sub = data.subcategory || 'sin-subcategoria';

    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    subcategoriesCount[`${cat} -> ${sub}`] = (subcategoriesCount[`${cat} -> ${sub}`] || 0) + 1;
  });

  console.log("\nCategorías en Firestore:");
  console.log(categoriesCount);

  console.log("\nSubcategorías en Firestore:");
  console.log(subcategoriesCount);

  process.exit(0);
}

inspectProducts();
