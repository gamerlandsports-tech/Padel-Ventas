import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const PRODUCTS_COLLECTION = 'products';

/**
 * Obtener todos los productos (con filtros opcionales)
 */
export async function getProducts(filters = {}) {
  let q = collection(db, PRODUCTS_COLLECTION);
  const constraints = [where('active', '==', true)];

  if (filters.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.brand) {
    constraints.push(where('brand', '==', filters.brand));
  }
  if (filters.subcategory) {
    constraints.push(where('subcategory', '==', filters.subcategory));
  }
  if (filters.isOffer) {
    constraints.push(where('isOffer', '==', true));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  q = query(q, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(productId) {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Obtener productos en oferta
 */
export async function getOfferProducts(maxItems = 12) {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('isOffer', '==', true),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Obtener productos destacados
 */
export async function getFeaturedProducts(maxItems = 8) {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Crear producto (Admin)
 */
export async function createProduct(productData) {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Actualizar producto (Admin)
 */
export async function updateProduct(productId, updates) {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Eliminar producto (Admin) — soft delete
 */
export async function deleteProduct(productId) {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(docRef, {
    active: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Obtener marcas únicas (para filtros dinámicos)
 */
export async function getBrands(category = null) {
  let q;
  if (category) {
    q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('active', '==', true),
      where('category', '==', category)
    );
  } else {
    q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('active', '==', true)
    );
  }
  const snapshot = await getDocs(q);
  const brands = new Set();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.brand) brands.add(data.brand);
  });
  return Array.from(brands).sort();
}
