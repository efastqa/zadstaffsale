import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

// Initialize Firestore with robust long-polling connection for iframe and sandboxed web runtimes
export const db = (() => {
  try {
    const dbId = firebaseConfig.firestoreDatabaseId;
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId || undefined);
  } catch {
    // If already initialized, get standard instance
    return firebaseConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Collection References
export const PRODUCTS_COLLECTION = 'products';
export const ORDERS_COLLECTION = 'orders';
export const SETTINGS_COLLECTION = 'settings';

/**
 * Sanitize object to remove undefined values which Firestore forbids
 */
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = cleanForFirestore(value);
    }
  }
  return result;
}

/* =======================================================
   PRODUCTS SERVICE
======================================================= */

/**
 * Subscribe to real-time products updates
 */
export function subscribeToProducts(
  callback: (products: Product[]) => void,
  onError?: (error: any) => void
) {
  const q = query(collection(db, PRODUCTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((docSnap) => {
        products.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
      });
      callback(products);
    },
    (error) => {
      console.error('Firestore products subscription error:', error);
      if (onError) onError(error);
    }
  );
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
  const cleaned = cleanForFirestore(product);
  const prodRef = doc(db, PRODUCTS_COLLECTION, product.id);
  await setDoc(prodRef, cleaned, { merge: true });
}

/**
 * Bulk save products (Batch write with chunking for Firestore limits)
 */
export async function saveFirebaseProductsBulk(products: Product[]): Promise<void> {
  if (!products || products.length === 0) return;
  const chunkSize = 300;
  for (let i = 0; i < products.length; i += chunkSize) {
    const chunk = products.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((prod) => {
      const cleaned = cleanForFirestore(prod);
      const ref = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(ref, cleaned, { merge: true });
    });
    await batch.commit();
  }
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
  const docs = snapshot.docs;
  const chunkSize = 300;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}

/* =======================================================
   ORDERS SERVICE
======================================================= */

/**
 * Subscribe to real-time orders updates
 */
export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: any) => void
) {
  const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        orders.push({ id: docSnap.id, ...(docSnap.data() as Omit<Order, 'id'>) });
      });
      callback(orders);
    },
    (error) => {
      console.error('Firestore orders subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Create a new order in Firestore
 */
export async function createFirebaseOrder(order: Order): Promise<void> {
  const cleaned = cleanForFirestore(order);
  const orderRef = doc(db, ORDERS_COLLECTION, order.id);
  await setDoc(orderRef, cleaned);
}

/**
 * Update order status or dispatch details
 */
export async function updateFirebaseOrderStatus(
  orderId: string, 
  updates: Partial<Order>
): Promise<void> {
  const cleaned = cleanForFirestore({
    ...updates,
    updatedAt: new Date().toISOString()
  });
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await updateDoc(orderRef, cleaned);
}

/**
 * Clear all orders (for starting fresh)
 */
export async function clearAllFirebaseOrders(): Promise<void> {
  const snapshot = await getDocs(collection(db, ORDERS_COLLECTION));
  const docs = snapshot.docs;
  const chunkSize = 300;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
