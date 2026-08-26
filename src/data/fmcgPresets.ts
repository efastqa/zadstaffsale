export interface ProductPreset {
  name: string;
  nameAr: string;
  category: string;
  brand: string;
  description: string;
  originalPrice: number;
  staffPrice: number;
  stock: number;
  unit: string;
  imageUrl: string;
  isStaffSpecial: boolean;
  clearanceReason: string;
}

export const FMCG_PRESETS: ProductPreset[] = [
  {
    name: 'Perrier Sparkling Natural Mineral Water 330ml (Case of 24)',
    nameAr: 'مياه بيريه غازية معدنية طبيعية 330 مل (كرتون 24 حبة)',
    category: 'Beverages & Juices',
    brand: 'Perrier',
    description: 'Crisp French sparkling natural mineral water in glass bottles. Premium hydration for office and home.',
    originalPrice: 168.0,
    staffPrice: 79.0,
    stock: 45,
    unit: 'Carton (24 x 330ml Glass)',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Direct Distribution Subsidy 53% Off',
  },
  {
    name: 'Ferrero Rocher Hazelnut Chocolates Box (24 Pieces)',
    nameAr: 'شوكولاتة فيريرو روشيه بالبندق الفاخرة (24 قطعة)',
    category: 'Chocolates & Confectionery',
    brand: 'Ferrero',
    description: 'Whole crunchy hazelnut in the heart, creamy hazelnut filling with crisp wafer shell covered in chocolate.',
    originalPrice: 58.0,
    staffPrice: 28.0,
    stock: 60,
    unit: 'Box (24 Pcs / 300g)',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Staff Hospitality Special 52% Off',
  },
  {
    name: 'Lavazza Super Crema Italian Espresso Whole Beans 1kg',
    nameAr: 'حبوب قهوة إسبريسو لافاتزا سوبر كريما إيطالية 1 كجم',
    category: 'Coffee, Tea & Breakfast',
    brand: 'Lavazza',
    description: 'Medium roast blend with velvety crema, notes of roasted hazelnut and brown sugar. Authentic Italian barista quality.',
    originalPrice: 110.0,
    staffPrice: 49.0,
    stock: 35,
    unit: 'Bag (1 kg Beans)',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Exclusive Staff Roastery Allocation',
  },
  {
    name: 'India Gate Classic Royal Basmati Rice (20kg Bag)',
    nameAr: 'أرز كلاسيك ملكي بسمتي أنديا جيت (شوال 20 كجم)',
    category: 'Groceries & Pantry',
    brand: 'India Gate',
    description: 'Extra long grain aged basmati rice, aromatic fragrance and pearl white finish. Essential pantry staple for staff families.',
    originalPrice: 195.0,
    staffPrice: 98.0,
    stock: 50,
    unit: 'Master Bag (20 kg)',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Employee Essential Household Allowance',
  },
  {
    name: 'Ariel 3in1 Pods Mountain Spring Laundry Detergent (Carton of 4 x 38 Pods)',
    nameAr: 'كبسولات اريال 3 في 1 لغسيل الملابس رائحة الانتعاش (كرتون 4 عبوات)',
    category: 'Personal Care & Household',
    brand: 'Ariel',
    description: 'Deep stain removal, fabric brightening, and long-lasting fresh scent in all-in-one pre-dosed pods.',
    originalPrice: 220.0,
    staffPrice: 99.0,
    stock: 30,
    unit: 'Carton (4 x 38 Pods)',
    imageUrl: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Household Bulk Clearance 55% Off',
  },
  {
    name: 'Papadopoulos Caprice Classic Chocolate Hazelnut Wafers (Carton 12 x 250g)',
    nameAr: 'بسكويت ويفر رول كابريس بالشوكولاتة والبندق (كرتون 12 علبة)',
    category: 'Biscuits & Snacks',
    brand: 'Caprice',
    description: 'Delicate crispy rolled wafers with rich chocolate hazelnut cream filling. Iconic Greek confectionery.',
    originalPrice: 144.0,
    staffPrice: 65.0,
    stock: 40,
    unit: 'Carton (12 Tins x 250g)',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: false,
    clearanceReason: 'Direct Import Batch',
  },
  {
    name: 'Monini Classico Extra Virgin Olive Oil 1L (Carton of 6 Bottles)',
    nameAr: 'زيت زيتون بكر ممتاز مونيني إيطالي أصلي 1 لتر (كرتون 6 زجاجات)',
    category: 'Groceries & Pantry',
    brand: 'Monini',
    description: 'Cold extracted 100% Italian extra virgin olive oil. Harmonious balanced flavor with aromatic green olive aroma.',
    originalPrice: 240.0,
    staffPrice: 115.0,
    stock: 25,
    unit: 'Carton (6 x 1L Glass)',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Special Mediterranean Import Allocation',
  },
  {
    name: 'Red Bull Energy Drink 250ml (Tray of 24 Cans)',
    nameAr: 'مشروب الطاقة ريد بول 250 مل (صندوق 24 علبة)',
    category: 'Beverages & Juices',
    brand: 'Red Bull',
    description: 'Vitalizes body and mind with premium taurine, B-group vitamins, and caffeine. Sealed distributor tray.',
    originalPrice: 192.0,
    staffPrice: 99.0,
    stock: 50,
    unit: 'Tray (24 x 250ml)',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    isStaffSpecial: true,
    clearanceReason: 'Staff Energy Support Subsidy',
  }
];

export const CURATED_IMAGES = [
  { label: 'Beverages / Mineral Water', url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fruit Juice Carton', url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80' },
  { label: 'Energy Drinks', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chocolates & Truffles', url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Artisan Hazelnut Bar', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Espresso Coffee Beans', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Basmati Rice Bag', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Extra Virgin Olive Oil', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Italian Pasta Box', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80' },
  { label: 'Biscuits & Cookies', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80' },
  { label: 'Laundry Detergent & Pods', url: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80' },
  { label: 'Snack Assortment', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80' }
];

export function generateEAN13Barcode(): string {
  // Qatar / Gulf GS1 prefix starts with 629
  let code = '629';
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10);
  }
  // Calculate EAN-13 checksum digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code.charAt(i), 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return code + checkDigit;
}
