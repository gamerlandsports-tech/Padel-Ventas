import fs from 'fs';
import path from 'path';
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

async function createFullBackup() {
  const dateStr = '2026-07-22';
  console.log(`=== INICIANDO RESPALDO COMPLETO (BACKUP ${dateStr}) ===`);

  const backupFolder = path.join(process.cwd(), 'backups', `backup_${dateStr}`);
  if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder, { recursive: true });
  }

  // 1. Exportar colección 'products'
  console.log("Exportando colección 'products'...");
  const prodSnap = await getDocs(collection(db, 'products'));
  const productsData = prodSnap.docs.map(d => ({
    _id: d.id,
    ...d.data()
  }));

  const productsFilePath = path.join(backupFolder, 'products_db.json');
  fs.writeFileSync(productsFilePath, JSON.stringify(productsData, null, 2), 'utf8');
  console.log(`✓ Guardados ${productsData.length} productos en: ${productsFilePath}`);

  // 2. Exportar colección 'users'
  console.log("Exportando colección 'users'...");
  const usersSnap = await getDocs(collection(db, 'users'));
  const usersData = usersSnap.docs.map(d => ({
    _id: d.id,
    ...d.data()
  }));

  const usersFilePath = path.join(backupFolder, 'users_db.json');
  fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2), 'utf8');
  console.log(`✓ Guardados ${usersData.length} usuarios en: ${usersFilePath}`);

  // 3. Crear archivo JSON consolidado en la raíz del proyecto
  const mainBackupFile = path.join(process.cwd(), `backup_padel_ventas_${dateStr}.json`);
  const fullBackupPayload = {
    backupDate: new Date().toISOString(),
    formattedDate: dateStr,
    totalProducts: productsData.length,
    totalUsers: usersData.length,
    products: productsData,
    users: usersData
  };

  fs.writeFileSync(mainBackupFile, JSON.stringify(fullBackupPayload, null, 2), 'utf8');
  console.log(`✓ Archivo de respaldo principal consolidado creado en: ${mainBackupFile}`);

  // 4. Crear archivo METADATA
  const metadataFilePath = path.join(backupFolder, 'metadata.json');
  const metadata = {
    createdAt: new Date().toISOString(),
    project: "Padel Ventas",
    totalProducts: productsData.length,
    totalUsers: usersData.length,
    status: "COMPLETE_SUCCESS",
    files: [
      `backup_padel_ventas_${dateStr}.json`,
      `backups/backup_${dateStr}/products_db.json`,
      `backups/backup_${dateStr}/users_db.json`
    ]
  };
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`\n==================================================`);
  console.log(`🎉 ¡RESPALDO COMPLETO GENERADO CON ÉXITO!`);
  console.log(`📁 Carpeta de Respaldo: ${backupFolder}`);
  console.log(`📄 Archivo Principal: ${mainBackupFile}`);
  console.log(`📦 Total de Productos Respaldados: ${productsData.length}`);
  console.log(`==================================================\n`);

  process.exit(0);
}

createFullBackup();
