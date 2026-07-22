import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import sharp from 'sharp';

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

async function inspectAndCompress() {
  console.log("Inspeccionando productos en Firestore para comprimir imágenes...");
  const snapshot = await getDocs(collection(db, 'products'));
  let totalDocs = 0;
  let docsWithBase64 = 0;
  let totalBase64OriginalSize = 0;
  let totalBase64CompressedSize = 0;

  for (const docSnap of snapshot.docs) {
    totalDocs++;
    const data = docSnap.data();
    if (!data.images || !Array.isArray(data.images) || data.images.length === 0) continue;

    let modified = false;
    const newImages = [];

    for (const imgUrl of data.images) {
      if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image/')) {
        docsWithBase64++;
        const origSize = imgUrl.length;
        totalBase64OriginalSize += origSize;

        try {
          // Extraer buffer base64
          const base64Data = imgUrl.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');

          // Comprimir usando sharp a WebP max 400px
          const compressedBuffer = await sharp(buffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 70 })
            .toBuffer();

          const compressedBase64 = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;
          totalBase64CompressedSize += compressedBase64.length;

          console.log(`[${docSnap.id}] ${data.name.substring(0, 30)}: ${Math.round(origSize/1024)}KB -> ${Math.round(compressedBase64.length/1024)}KB`);
          newImages.push(compressedBase64);
          modified = true;
        } catch (err) {
          console.error(`Error comprimiendo imagen en doc ${docSnap.id}:`, err.message);
          newImages.push(imgUrl);
        }
      } else {
        newImages.push(imgUrl);
      }
    }

    if (modified) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        images: newImages,
        updatedAt: new Date()
      });
    }
  }

  console.log("\n=== RESUMEN COMPRESIÓN ===");
  console.log(`Total productos: ${totalDocs}`);
  console.log(`Imágenes Base64 procesadas: ${docsWithBase64}`);
  console.log(`Tamaño original acumulado: ${(totalBase64OriginalSize/1024/1024).toFixed(2)} MB`);
  console.log(`Tamaño comprimido acumulado: ${(totalBase64CompressedSize/1024/1024).toFixed(2)} MB`);
  
  process.exit(0);
}

inspectAndCompress();
