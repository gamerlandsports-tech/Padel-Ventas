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

async function checkCollections() {
  const collectionNames = ['products', 'orders', 'users', 'images', 'backups'];
  console.log("=== REVISANDO OTRAS COLECCIONES EN FIRESTORE ===");
  for (const name of collectionNames) {
    try {
      const snap = await getDocs(collection(db, name));
      console.log(`Colección '${name}': ${snap.docs.length} documentos`);
    } catch (e) {
      console.log(`Colección '${name}': no accesible o no existe`);
    }
  }
  process.exit(0);
}

checkCollections();
