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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const PRODUCTS_COLLECTION = 'products';

/**
 * Obtener todos los productos (con filtros y ordenamiento en memoria sin errores de índices en Firestore)
 */
export async function getProducts(filters = {}) {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    let products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filtrar solo activos y con stock positivo (salvo que se solicite incluir sin stock en admin)
    if (!filters.includeOutofStock) {
      products = products.filter(p => p.active !== false && p.inStock !== false && (p.stockUnits == null || p.stockUnits > 0) && (p.priceWholesale > 0));
    }

    // Helper para comparar: normaliza a minúsculas SIN espacios
    // Así "OD PRO" === "ODPRO" === "Od Pro" === "odpro"
    const normalize = (s) => String(s).toLowerCase().replace(/\s+/g, '');
    const matchFilter = (itemValue, filterValue) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return true;
      if (!itemValue) return false;
      const itemNorm = normalize(itemValue);
      if (Array.isArray(filterValue)) {
        return filterValue.some(v => normalize(v) === itemNorm);
      }
      return normalize(filterValue) === itemNorm;
    };

    // Filtro por categoría
    if (filters.category && filters.category !== 'todas') {
      products = products.filter(p => matchFilter(p.category, filters.category));
    }

    // Filtro por marca
    if (filters.brand) {
      products = products.filter(p => matchFilter(p.brand, filters.brand));
    }

    // Filtro por subcategoría
    if (filters.subcategory) {
      products = products.filter(p => matchFilter(p.subcategory, filters.subcategory));
    }

    // Filtro por oferta
    if (filters.isOffer) {
      products = products.filter(p => p.isOffer === true);
    }

    // Ordenamiento en memoria
    if (filters.sort === 'alpha-asc') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sort === 'alpha-desc') {
      products.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sort === 'price-asc') {
      products.sort((a, b) => (a.priceRetail || 0) - (b.priceRetail || 0));
    } else if (filters.sort === 'price-desc') {
      products.sort((a, b) => (b.priceRetail || 0) - (a.priceRetail || 0));
    }

    if (filters.limit) {
      products = products.slice(0, filters.limit);
    }

    return products;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
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
 * Obtener productos en oferta (con fallback a lista general si no hay ofertas etiquetadas)
 */
export async function getOfferProducts(maxItems = 12) {
  const allProducts = await getProducts();
  const offers = allProducts.filter(p => p.isOffer === true);
  if (offers.length > 0) {
    return offers.slice(0, maxItems);
  }
  // Fallback: Devolver los primeros N productos
  return allProducts.slice(0, maxItems);
}

/**
 * Obtener productos destacados / novedades (con fallback)
 */
export async function getFeaturedProducts(maxItems = 8) {
  const allProducts = await getProducts();
  const featured = allProducts.filter(p => p.featured === true);
  if (featured.length > 0) {
    return featured.slice(0, maxItems);
  }
  // Fallback
  return allProducts.slice(0, maxItems);
}

/**
 * Crear producto (Admin)
 */
export async function createProduct(productData) {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...productData,
    active: true,
    inStock: productData.inStock ?? true,
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
 * Obtener marcas únicas
 */
export async function getBrands(category = null) {
  const products = await getProducts({ category });
  const brands = new Set();
  products.forEach((p) => {
    if (p.brand) brands.add(p.brand);
  });
  return Array.from(brands).sort();
}
