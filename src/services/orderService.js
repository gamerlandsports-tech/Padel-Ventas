import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const ORDERS_COLLECTION = 'orders';

/**
 * Crear un nuevo pedido
 */
export async function createOrder(orderData) {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...orderData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Guardar pedido como borrador
 */
export async function saveDraftOrder(userId, userEmail, items, subtotal) {
  return createOrder({
    userId,
    userEmail,
    items,
    subtotal,
    shipping: null,
    status: 'draft',
    paymentStatus: 'unpaid',
    shippingStatus: 'not_shipped',
    isDraft: true,
  });
}

/**
 * Enviar pedido (de borrador a pendiente)
 */
export async function submitOrder(orderId, shippingData) {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    shipping: shippingData,
    status: 'pending',
    isDraft: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Obtener pedidos del usuario
 */
export async function getUserOrders(userId) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Obtener borradores del usuario
 */
export async function getUserDrafts(userId) {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId),
    where('isDraft', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Obtener un pedido por ID
 */
export async function getOrderById(orderId) {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Actualizar estado del pedido (Admin)
 */
export async function updateOrderStatus(orderId, status) {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Actualizar estado de pago (Admin)
 */
export async function updatePaymentStatus(orderId, paymentStatus) {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    paymentStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Actualizar estado de envío (Admin)
 */
export async function updateShippingStatus(orderId, shippingStatus) {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(docRef, {
    shippingStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Obtener todos los pedidos (Admin)
 */
export async function getAllOrders() {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
