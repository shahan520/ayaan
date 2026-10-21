import { OrderProductItem } from '../types';

export interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  baseUnitPrice: number;
  tier: 'low' | 'mid' | 'high';
  category: string;
}

export const PRODUCT_CATALOG: CatalogProduct[] = [
  // Mid-Tier (matches screenshot exactly)
  {
    id: 'prod_switch',
    name: 'Nintendo Switch',
    image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 0.26,
    tier: 'mid',
    category: 'Gaming & Tech',
  },
  {
    id: 'prod_tab',
    name: 'Samsung Galaxy Tab',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 0.38,
    tier: 'mid',
    category: 'Tablets & Computers',
  },
  {
    id: 'prod_clothing',
    name: 'Infant Clothing Set',
    image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 4.96,
    tier: 'mid',
    category: 'Apparel & Kids',
  },
  {
    id: 'prod_band',
    name: 'Xiaomi Smart Band 8',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 0.45,
    tier: 'mid',
    category: 'Wearables',
  },
  {
    id: 'prod_keyboard',
    name: 'Mechanical RGB Gaming Keyboard',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 0.72,
    tier: 'mid',
    category: 'PC Accessories',
  },

  // Low-Tier (for normal / lower balance accounts)
  {
    id: 'prod_earbuds',
    name: 'Wireless Sport Earbuds',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 1.45,
    tier: 'low',
    category: 'Audio',
  },
  {
    id: 'prod_mug',
    name: 'Insulated Ceramic Travel Tumbler',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 2.10,
    tier: 'low',
    category: 'Home & Kitchen',
  },
  {
    id: 'prod_cable',
    name: 'Fast-Charging Braided USB-C Cable',
    image: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 0.65,
    tier: 'low',
    category: 'Accessories',
  },
  {
    id: 'prod_scotlite',
    name: 'Scotlite Good Fix Premium Vinyl Roll',
    image: '/assets/aistudio/D217d10797D9867123be63C3807Ab91e33301c2c94448713bfa4b0d9f3e7e32a_75c1958b.jpg',
    baseUnitPrice: 2.58,
    tier: 'low',
    category: 'Automotive & Wrap',
  },

  // High-Tier (for high balance accounts > 800 USDT)
  {
    id: 'prod_iphone',
    name: 'Apple iPhone 16 Pro Max 256GB',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 1.80,
    tier: 'high',
    category: 'Flagship Smartphones',
  },
  {
    id: 'prod_macbook',
    name: 'MacBook Pro 16-inch M3 Max',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 2.95,
    tier: 'high',
    category: 'Laptops',
  },
  {
    id: 'prod_drone',
    name: 'DJI Mavic 3 Pro Cine Drone',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 3.50,
    tier: 'high',
    category: 'Drones & Cameras',
  },
  {
    id: 'prod_ps5',
    name: 'Sony PlayStation 5 Pro Console',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 1.45,
    tier: 'high',
    category: 'Gaming Consoles',
  },
  {
    id: 'prod_dyson',
    name: 'Dyson Supersonic Hair Dryer Special Edition',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
    baseUnitPrice: 1.15,
    tier: 'high',
    category: 'Personal Care',
  },
];

/**
 * Generates 1 to 3 matched products tailored to user balance and platform tier
 */
export function generateTieredMatchedProducts(
  userBalance: number,
  targetOrderAmount: number
): OrderProductItem[] {
  // Determine tier based on balance
  const tier: 'low' | 'mid' | 'high' =
    userBalance >= 899 ? 'high' : userBalance >= 200 ? 'mid' : 'low';

  const eligible = PRODUCT_CATALOG.filter((p) => p.tier === tier);
  const pool = eligible.length > 0 ? eligible : PRODUCT_CATALOG;

  // Decide number of product items: 1, 2, or 3 (mid & high often 3 like in screenshot)
  let count = 3;
  if (userBalance < 50) count = 1;
  else if (userBalance < 150) count = 2;

  // Shuffle pool
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // If mid tier, and we picked 3 items, try to ensure Nintendo Switch, Samsung Galaxy Tab, Infant Clothing Set
  if (tier === 'mid' && userBalance >= 400 && Math.random() > 0.3) {
    const s1 = PRODUCT_CATALOG.find((p) => p.id === 'prod_switch') || selected[0];
    const s2 = PRODUCT_CATALOG.find((p) => p.id === 'prod_tab') || selected[1];
    const s3 = PRODUCT_CATALOG.find((p) => p.id === 'prod_clothing') || selected[2];
    selected[0] = s1;
    selected[1] = s2;
    selected[2] = s3;
  }

  // Split targetOrderAmount among the selected items
  const ratios = count === 1 ? [1] : count === 2 ? [0.55, 0.45] : [0.35, 0.35, 0.30];

  return selected.map((prod, idx) => {
    const allocated = targetOrderAmount * ratios[idx];
    const qty = Math.max(1, Math.round(allocated / prod.baseUnitPrice));
    const effectiveUnitPrice = prod.baseUnitPrice;

    return {
      id: 'item_' + Date.now() + '_' + idx,
      name: prod.name,
      image: prod.image,
      unitPrice: effectiveUnitPrice,
      quantity: qty,
      detailsLabel: 'Original details',
    };
  });
}
