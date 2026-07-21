// Firebase Configuration
// ─── IMPORTANTE: Reemplazá estos valores con tu configuración de Firebase ───
// Instrucciones:
// 1. Ir a https://console.firebase.google.com
// 2. Crear un proyecto nuevo o usar uno existente
// 3. Agregar una app web
// 4. Copiar la configuración aquí

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAwWA60gGszPQQ6KDJ0dDd5gWnUEygTB14",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "padel-ventas.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "padel-ventas",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "padel-ventas.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "957509698700",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:957509698700:web:dfc30e7ac62e13491aa7a9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
