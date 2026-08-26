import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References
export const PRODUCTS_COLLECTION = 'products';
export const ORDERS_COLLECTION = 'orders';
export const SETTINGS_COLLECTION = 'settings';

/* =======================================================
   PRODUCTS SERVICE
======================================================= */

/**
 * Subscribe to real-time products updates
 */
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
    });
    callback(products);
  }, (error) => {
    console.error('Firestore products subscription error:', error);
  });
}

/**
 * Fetch all products once
 */
export async function getFirebaseProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
    });
    return products;
  } catch (error) {
    console.error('Failed to get products from Firebase:', error);
    return [];
  }
}

/**
 * Save or update a single product
 */
export async function saveFirebaseProduct(product: Product): Promise<void> {
  const prodRef = doc(db, PRODUCTS_COLLECTION, product.id);
  await setDoc(prodRef, product, { merge: true });
}

/**
 * Bulk save products (Batch write)
 */
export async function saveFirebaseProductsBulk(products: Product[]): Promise<void> {
  const batch = writeBatch(db);
  products.forEach((prod) => {
    const ref = doc(db, PRODUCTS_COLLECTION, prod.id);
    batch.set(ref, prod, { merge: true });
  });
  await batch.commit();
}

/**
 * Delete a product
 */
export async function deleteFirebaseProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
}

/**
 * Clear all products in Firestore (for clean catalog start)
 */
export async function clearAllFirebaseProducts(): Promise<void> {
  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

/* =======================================================
   ORDERS SERVICE
======================================================= */

/**
 * Subscribe to real-time orders updates
 */
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders: Order[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
    });
    callback(orders);
  }, (error) => {
    console.error('Firestore orders subscription error:', error);
  });
}

/**
 * Create a new order in Firestore
 */
export async function createFirebaseOrder(order: Order): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  await setDoc(orderRef, order);
}

/**
 * Update order status or dispatch details
 */
export async function updateFirebaseOrderStatus(
  orderId: string, 
  updates: Partial<Order>
): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Clear all orders (for starting fresh)
 */
export async function clearAllFirebaseOrders(): Promise<void> {
  const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}
