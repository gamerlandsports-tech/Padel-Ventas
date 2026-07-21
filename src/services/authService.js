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
export async function registerUser(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName });

  // Create user document in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    role: USER_ROLES.RETAIL,
    phone: '',
    address: '',
    city: '',
    province: '',
    approved: true, // Retail users are auto-approved
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
