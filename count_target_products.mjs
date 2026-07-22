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

async function countProducts() {
  console.log("Contando productos en stock por categoría...");
  const snapshot = await getDocs(collection(db, 'products'));
  const counts = { paletas: 0, bolsos: 0, indumentaria: 0, zapatillas: 0, otros: 0 };
  const totalDocs = snapshot.docs.length;
  let totalInStock = 0;
  let targetInStock = 0;

  snapshot.docs.forEach(docSnap => {
    const p = docSnap.data();
    if (p.inStock !== false && (p.stockUnits == null || p.stockUnits > 0)) {
      totalInStock++;
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
        targetInStock++;
      } else {
        counts.otros++;
      }
    }
  });

  console.log("=== PRODUCTOS EN STOCK ===");
  console.log(`Total productos en DB: ${totalDocs}`);
  console.log(`Total productos CON STOCK: ${totalInStock}`);
  console.log(`Objetivo con stock (paletas, bolsos, indumentaria, zapatillas): ${targetInStock}`);
  console.log("Detalle por categoría:", counts);
  process.exit(0);
}

countProducts();
