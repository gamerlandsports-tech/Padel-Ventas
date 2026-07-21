import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { USER_ROLES } from '../utils/constants';

/**
 * Registrar nuevo usuario
 */
export async function registerUser(email, password, profileData) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Si el correo es gamerlandsports@gmail.com, forzamos el rol ADMIN
  const isTargetAdmin = email.trim().toLowerCase() === 'gamerlandsports@gmail.com';
  const assignedRole = isTargetAdmin ? USER_ROLES.ADMIN : (profileData.role || USER_ROLES.RETAIL);

  const fullName = profileData.name ? (profileData.name + (profileData.lastName ? ' ' + profileData.lastName : '')) : 'Administrador';
  await updateProfile(user, { displayName: fullName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email.toLowerCase(),
    displayName: fullName,
    ...profileData,
    role: assignedRole,
    approved: true,
    createdAt: serverTimestamp(),
  });

  return user;
}

/**
 * Iniciar sesión
 */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Cerrar sesión
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Obtener datos del usuario desde Firestore
 */
export async function getUserProfile(uid) {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

/**
 * Observer de auth state changes
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
