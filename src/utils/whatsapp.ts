import { Order, Product } from '../types';
import { COMPANY_INFO } from '../data/mockData';

/**
 * Formats a clean, professional WhatsApp order message for staff sales
 */
export function generateWhatsAppOrderMessage(order: Order, baseUrl?: string): string {
  const dateStr = new Date(order.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const appUrl = baseUrl || window.location.origin;
  const trackUrl = `${appUrl}?track=${order.orderNumber}`;

  let itemsList = '';
  order.items.forEach((item, index) => {
    const lineTotal = (item.quantity * item.unitPrice).toFixed(2);
    itemsList += `${index + 1}. *${item.productName}*\n   ▫️ Qty: ${item.quantity} x QAR ${item.unitPrice.toFixed(2)} (${item.unit})\n   ▫️ Barcode: \`${item.barcode}\`\n   ▫️ Item Total: *QAR ${lineTotal}*\n\n`;
  });

  const deliveryModeText = 
    order.deliveryMode === 'department_delivery'
      ? `🏢 Department Delivery (${order.department})`
      : order.deliveryMode === 'central_warehouse_pickup'
      ? `🏭 Central Warehouse Staff Counter Pickup`
      : `📍 Individual Desk Handover`;

  const message = `🛍️ *ZAD MARKETING & DISTRIBUTION*
*OFFICIAL STAFF SALES ORDER*
━━━━━━━━━━━━━━━━━━━━━
🔖 *Order No:* #${order.orderNumber}
📅 *Date:* ${dateStr}

👤 *EMPLOYEE DETAILS:*
• Name: *${order.employeeName}*
• Staff ID: *${order.employeeId}*
• Department: *${order.department}*
• Phone: ${order.employeePhone}

🚚 *DELIVERY ARRANGEMENT:*
• Method: ${deliveryModeText}
${order.deliveryNotes ? `• Notes: _${order.deliveryNotes}_\n` : ''}
━━━━━━━━━━━━━━━━━━━━━
📦 *ORDERED ITEMS:*
${itemsList}━━━━━━━━━━━━━━━━━━━━━
💰 *ORDER SUMMARY:*
• Subtotal (Staff Price): *QAR ${order.subtotal.toFixed(2)}*
• Staff Discount Savings: *🎉 QAR ${order.savingsTotal.toFixed(2)} OFF*
• Delivery Fee: *FREE (Staff Benefit)*
• *GRAND TOTAL: QAR ${order.grandTotal.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━━
🔗 *Live Tracking & Barcode Pass:*
${trackUrl}

_This order was generated via ZAD Staff Sales Portal. Please confirm processing._`;

  return message;
}

/**
 * Creates direct WhatsApp link with prefilled text to ZAD company WhatsApp
 */
export function createWhatsAppOrderLink(order: Order, baseUrl?: string): string {
  const rawNumber = COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '');
  const message = generateWhatsAppOrderMessage(order, baseUrl);
  return `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Creates WhatsApp message for 1-click single product instant inquiry/order
 */
export function createSingleProductWhatsAppLink(
  product: Product,
  employeeName: string = 'Staff Member',
  employeeId: string = 'EMP',
  department: string = 'Staff'
): string {
  const rawNumber = COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '');
  const text = `🛍️ *ZAD STAFF SALE INQUIRY / ORDER*
━━━━━━━━━━━━━━━━━━━━━
*Product:* ${product.name}
*Barcode:* \`${product.barcode}\`
*SKU:* ${product.sku}
*Staff Price:* QAR ${product.staffPrice.toFixed(2)}
*Unit:* ${product.unit}

👤 *Staff Info:*
• Name: ${employeeName}
• Staff ID: ${employeeId}
• Department: ${department}

Please confirm stock availability & delivery arrangement. Thank you!`;

  return `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates notification message from Admin to Employee on dispatch
 */
export function generateDispatchWhatsAppNotification(order: Order): string {
  const text = `🚚 *ZAD STAFF SALES - DISPATCH UPDATE*
━━━━━━━━━━━━━━━━━━━━━
Dear *${order.employeeName}* (Staff ID: ${order.employeeId}),

Your staff order *#${order.orderNumber}* has been processed and is *READY / DISPATCHED*!

📦 *Delivery Details:*
• Department: *${order.department}*
• Mode: ${order.deliveryMode === 'department_delivery' ? '🏢 Sent to Department Hub' : '🏭 Warehouse Pickup Ready'}
${order.assignedDispatcher ? `• Assigned To: ${order.assignedDispatcher}\n` : ''}• Total Amount Due: *QAR ${order.grandTotal.toFixed(2)}*

🔗 *Track Order Status:*
${window.location.origin}?track=${order.orderNumber}

Thank you,
*ZAD Marketing & Distribution Logistics Team*`;

  const phone = order.employeePhone.replace(/[^0-9]/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
