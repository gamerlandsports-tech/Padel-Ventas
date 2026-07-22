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

async function inspectAndRestore() {
  console.log("=== INSPECCIONANDO PRODUCTOS EN FIRESTORE ===");
  const snapshot = await getDocs(collection(db, 'products'));

  let userUploadedCount = 0;
  let autoAssignedCount = 0;
  let placeholderCount = 0;

  const userUploadedDocs = [];
  const autoAssignedDocs = [];

  snapshot.docs.forEach(docSnap => {
    const p = docSnap.data();
    const imgs = p.images || [];

    // Detectar si alguna imagen fue subida/cargada manualmente por el usuario
    const isUserUploaded = imgs.some(img => {
      if (typeof img !== 'string') return false;
      // Base64 o Cloudinary o subidas directas del usuario
      return img.startsWith('data:image/') || img.includes('cloudinary.com');
    });

    if (isUserUploaded) {
      userUploadedCount++;
      userUploadedDocs.push({ id: docSnap.id, name: p.name, images: imgs });
    } else if (imgs.length > 0 && !imgs[0].includes('placehold.co')) {
      autoAssignedCount++;
      autoAssignedDocs.push({ id: docSnap.id, name: p.name, images: imgs });
    } else {
      placeholderCount++;
    }
  });

  console.log(`\n📊 RESULTADO INSPECCIÓN:`);
  console.log(`⭐ Guardadas por el USUARIO (Base64 / Cloudinary): ${userUploadedCount} productos (SE CONSERVAN 100%)`);
  console.log(`🤖 Asignadas automáticamente por el script: ${autoAssignedCount} productos (SE REVIERTEN)`);
  console.log(`🖼️ Ya tenían placeholder: ${placeholderCount} productos`);

  if (userUploadedDocs.length > 0) {
    console.log(`\nEjemplos de productos con fotos del usuario (NO SE TOCAN):`);
    userUploadedDocs.slice(0, 5).forEach(d => {
      console.log(`  - [CONSERVADO] ${d.name} (${d.images.length} fotos)`);
    });
  }

  if (autoAssignedDocs.length > 0) {
    console.log(`\nEjemplos de productos a revertir a placeholder original:`);
    autoAssignedDocs.slice(0, 5).forEach(d => {
      console.log(`  - [REVERTIR] ${d.name}`);
    });
  }

  // Realizar la reversión de las auto-asignadas respetando las del usuario
  console.log(`\n=== EJECUTANDO REVERSIÓN SEGURA DE IMÁGENES AUTOMÁTICAS ===`);
  let revertedCount = 0;

  for (const item of autoAssignedDocs) {
    const placeholderUrl = `https://placehold.co/600x600/12121a/00f0ff?text=${encodeURIComponent(item.name)}`;
    await updateDoc(doc(db, 'products', item.id), {
      images: [placeholderUrl],
      updatedAt: new Date()
    });
    revertedCount++;
  }

  console.log(`\n==================================================`);
  console.log(`✅ REVERSIÓN FINALIZADA CON ÉXITO:`);
  console.log(`- ${revertedCount} productos volvieron al estado previo a la carga automática.`);
  console.log(`- ${userUploadedCount} productos cargados manualmente por vos se conservaron INTACTOS.`);
  console.log(`==================================================\n`);

  process.exit(0);
}

inspectAndRestore();
