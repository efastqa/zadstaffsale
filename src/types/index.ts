export type Department = 
  | 'Sales & Key Accounts'
  | 'Logistics & Warehouse'
  | 'Finance & Accounting'
  | 'Marketing & Brand'
  | 'Operations & Supply Chain'
  | 'IT & Systems'
  | 'Human Resources'
  | 'Executive Management'
  | 'Fleet & Transport';

export type DeliveryMode = 'department_delivery' | 'individual_desk' | 'central_warehouse_pickup';

export type OrderStatus = 
  | 'pending_whatsapp'
  | 'confirmed'
  | 'packing'
  | 'ready_for_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  descriptionAr?: string;
  originalPrice: number; // in QAR
  staffPrice: number;    // in QAR
  stock: number;
  unit: string;          // e.g. "Pack of 12", "Box of 24", "1 kg", "Bottle 750ml"
  imageUrl: string;
  isStaffSpecial?: boolean;
  clearanceReason?: string; // e.g. "Excess Distribution Batch", "Special Staff Subsidy", "Short Expiry 3M"
  expiryDate?: string;
  maxPerEmployee?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  regularPrice: number;
  totalPrice: number;
  unit: string;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. ZAD-8041
  createdAt: string;
  updatedAt: string;
  employeeName: string;
  employeeId: string;
  employeePhone: string;
  employeeEmail?: string;
  department: Department;
  deliveryMode: DeliveryMode;
  deliveryNotes?: string;
  items: OrderItem[];
  subtotal: number;
  savingsTotal: number;
  deliveryFee: number;
  grandTotal: number;
  status: OrderStatus;
  whatsappMessageSent: boolean;
  assignedDispatcher?: string;
  batchManifestId?: string;
  deliveredAt?: string;
  adminNotes?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  department: Department;
  phone: string;
  email?: string;
  deskLocation?: string;
}

export type Language = 'en' | 'ar';
