import { Product, Order, EmployeeProfile, CartItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, MOCK_EMPLOYEES } from '../data/mockData';

const STORAGE_KEYS = {
  PRODUCTS: 'zad_staff_products_v1',
  ORDERS: 'zad_staff_orders_v1',
  CART: 'zad_staff_cart_v1',
  CURRENT_EMPLOYEE: 'zad_staff_current_employee_v1',
  LANGUAGE: 'zad_staff_language_v1',
  ADMIN_PASSWORD: 'zad_admin_password_v1',
  ADMIN_AUTH: 'zad_admin_auth_v1',
  MY_ORDERS: 'zad_staff_my_orders_v1',
};

const DEFAULT_ADMIN_PASSWORD = 'zad2025';

export function getStoredAdminPassword(): string {
  try {
    const pwd = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
    if (pwd) return pwd;
  } catch (e) {
    console.error('Error reading admin password', e);
  }
  return DEFAULT_ADMIN_PASSWORD;
}

export function saveStoredAdminPassword(password: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
  } catch (e) {
    console.error('Error saving admin password', e);
  }
}

export function getStoredAdminAuth(): boolean {
  try {
    const sessionAuth = sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (sessionAuth === 'true') return true;
    const localAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    if (localAuth === 'true') return true;
  } catch (e) {
    console.error('Error reading admin auth', e);
  }
  return false;
}

export function saveStoredAdminAuth(isAuthenticated: boolean, remember = false) {
  try {
    if (isAuthenticated) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch (e) {
    console.error('Error saving admin auth', e);
  }
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (data !== null) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading products from storage', e);
  }
  return [];
}

export function saveStoredProducts(products: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products', e);
  }
}

export function getStoredOrders(): Order[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading orders from storage', e);
  }
  saveStoredOrders(INITIAL_ORDERS);
  return INITIAL_ORDERS;
}

export function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders', e);
  }
}

export function getStoredCart(): CartItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading cart', e);
  }
  return [];
}

export function saveStoredCart(cart: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving cart', e);
  }
}

export function getStoredEmployee(): EmployeeProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading employee profile', e);
  }
  const defaultEmp = MOCK_EMPLOYEES[0];
  saveStoredEmployee(defaultEmp);
  return defaultEmp;
}

export function saveStoredEmployee(emp: EmployeeProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_EMPLOYEE, JSON.stringify(emp));
  } catch (e) {
    console.error('Error saving employee profile', e);
  }
}

export function getStoredMyOrderNumbers(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MY_ORDERS);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading my orders from storage', e);
  }
  return [];
}

export function saveStoredMyOrderNumber(orderNumber: string) {
  try {
    const existing = getStoredMyOrderNumbers();
    if (!existing.includes(orderNumber)) {
      const updated = [orderNumber, ...existing];
      localStorage.setItem(STORAGE_KEYS.MY_ORDERS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Error saving my order number', e);
  }
}

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').slice(-8); // extract last 8 digits for Qatar
}

export function isOrderOwnedByEmployee(
  order: Order,
  profile?: Partial<EmployeeProfile> | null,
  myOrderNumbers?: string[]
): boolean {
  if (!order) return false;

  // 1. Direct match with order numbers placed from this device/browser
  if (myOrderNumbers && myOrderNumbers.includes(order.orderNumber)) {
    return true;
  }

  // 2. Match by clean phone number
  if (profile?.phone) {
    const profilePhoneClean = cleanPhoneNumber(profile.phone);
    const orderPhoneClean = cleanPhoneNumber(order.employeePhone);
    if (profilePhoneClean.length >= 7 && profilePhoneClean === orderPhoneClean) {
      return true;
    }
  }

  // 3. Match by Staff ID
  if (profile?.id && profile.id.trim().length >= 3) {
    if (order.employeeId && order.employeeId.trim().toLowerCase() === profile.id.trim().toLowerCase()) {
      return true;
    }
  }

  return false;
}

