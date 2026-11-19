import { OrderProductItem } from '../types';

export type ProductCategory =
  | 'Electronics'
  | 'Watches'
  | 'Sneakers'
  | 'Fashion'
  | 'Home Appliances'
  | 'Beauty';

export interface CatalogProduct {
  id: string;
  name: string;
  imageUrl: string;
  image?: string; // backwards compatibility alias
  basePrice: number;
  tier: 'low' | 'medium' | 'high';
  category: ProductCategory | string;
  wholesaleUnitPrice?: number;
  source?: 'curated' | 'auto' | 'custom';
}

const CATALOG_STORAGE_KEY = 'worldexaglobal_product_catalog_v1';

const NON_PRODUCT_LOGO_PATTERNS = [
  'D217d10797D9867123be63C3807Ab91e33301c2c94448713bfa4b0d9f3e7e32a_75c1958b',
  'a3.f53cf407_cf3e68d0',
  'a1.3f945898_a31a0efe',
  'a2.d2e2ddaf_16e6377b',
  'a4.e7293f5f_d901c643',
  '/logo.png',
  'logo.png',
];

const DEFAULT_FALLBACK_PRODUCT_IMAGE = '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg';

/**
 * Built-in curated catalog of 48 realistic global e-commerce items across
 * Electronics, Watches, Sneakers, Fashion, Home Appliances, and Beauty.
 * Every item is paired with a visually verified, fast-loading product photo.
 */
export const CURATED_ECOMMERCE_CATALOG: CatalogProduct[] = [
  // =========================================================================
  // ELECTRONICS (Tablets, Monitors, Audio, Gaming Peripherals & Power)
  // =========================================================================
  {
    id: 'prod_ipad_10th',
    name: 'Apple iPad 10th Gen 10.9-inch Liquid Retina Display 64GB Wi-Fi',
    imageUrl: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    image: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    basePrice: 349.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_samsung_tab_s9_ultra',
    name: 'Samsung Galaxy Tab S9 Ultra 14.6" Dynamic AMOLED 2X Tablet with S-Pen',
    imageUrl: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    image: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    basePrice: 499.0,
    wholesaleUnitPrice: 0.42,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_samsung_tab_s11',
    name: 'Samsung Galaxy Tab S11 Ultra OLED Anti-Reflective Tablet 512GB',
    imageUrl: '/assets/aistudio/51WOmN30hNL._AC_UY218__4accbe53.jpg',
    image: '/assets/aistudio/51WOmN30hNL._AC_UY218__4accbe53.jpg',
    basePrice: 549.0,
    wholesaleUnitPrice: 0.48,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_android_2in1_workstation',
    name: 'ProTab 10.1" 2-in-1 Octa-Core Android Workstation with Keyboard & Mouse',
    imageUrl: '/assets/aistudio/81LyMIRcILL._AC_UY218__80112dae.jpg',
    image: '/assets/aistudio/81LyMIRcILL._AC_UY218__80112dae.jpg',
    basePrice: 189.0,
    wholesaleUnitPrice: 0.32,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_curved_monitor_34',
    name: '34-inch 1500R Curved Ultrawide WQHD 165Hz HDR Gaming Monitor',
    imageUrl: '/assets/aistudio/curved_gaming_monitor.jpg',
    image: '/assets/aistudio/curved_gaming_monitor.jpg',
    basePrice: 329.0,
    wholesaleUnitPrice: 0.36,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_sony_anc_headphones',
    name: 'Studio Pro Over-Ear Active Noise Cancelling Wireless Bluetooth Headphones',
    imageUrl: '/assets/aistudio/anc_wireless_headphones.jpg',
    image: '/assets/aistudio/anc_wireless_headphones.jpg',
    basePrice: 199.0,
    wholesaleUnitPrice: 0.35,
    tier: 'high',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_mechanical_keyboard_rgb',
    name: '75% Compact Wireless Mechanical Gaming Keyboard Hot-Swappable RGB',
    imageUrl: '/assets/aistudio/gaming_mechanical_keyboard.jpg',
    image: '/assets/aistudio/gaming_mechanical_keyboard.jpg',
    basePrice: 89.0,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_logitech_mouse',
    name: 'Logitech G305 Lightspeed Wireless Gaming Mouse HERO 12K Sensor',
    imageUrl: '/assets/aistudio/51sg9BLSMTL._AC_UL320__7260ba97.jpg',
    image: '/assets/aistudio/51sg9BLSMTL._AC_UL320__7260ba97.jpg',
    basePrice: 44.5,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_earbuds_pro_edition',
    name: 'Wireless Active Noise Canceling Earbuds Pro with MagCharge Case',
    imageUrl: '/assets/aistudio/wireless_earbuds_pro_product.jpg',
    image: '/assets/aistudio/wireless_earbuds_pro_product.jpg',
    basePrice: 59.0,
    wholesaleUnitPrice: 0.29,
    tier: 'medium',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_rosegold_sport_earbuds',
    name: 'Rose Gold Open-Ear True Wireless Sport Earbuds Dual LED Battery Case',
    imageUrl: '/assets/aistudio/61oiMqY0BDL._AC_UY218__4dd4bd77.jpg',
    image: '/assets/aistudio/61oiMqY0BDL._AC_UY218__4dd4bd77.jpg',
    basePrice: 24.99,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_arctic_sport_earbuds',
    name: 'Arctic White Ergonomic Open-Ear Bluetooth 5.3 Running Earbuds',
    imageUrl: '/assets/aistudio/61eq6sVSA2L._AC_UY218__acd1b807.jpg',
    image: '/assets/aistudio/61eq6sVSA2L._AC_UY218__acd1b807.jpg',
    basePrice: 22.9,
    wholesaleUnitPrice: 0.23,
    tier: 'low',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_rgb_charging_tower',
    name: 'Multi-Device Fast Wireless Charging Dock for Dual Controllers & Headset',
    imageUrl: '/assets/aistudio/61JI6UgtcJL._AC_UL320__5331bd7e.jpg',
    image: '/assets/aistudio/61JI6UgtcJL._AC_UL320__5331bd7e.jpg',
    basePrice: 46.99,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Electronics',
    source: 'curated',
  },
  {
    id: 'prod_surge_power_strip',
    name: '12-Outlet Surge Protector Power Strip Tower with 6 Smart USB Ports',
    imageUrl: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    image: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    basePrice: 23.99,
    wholesaleUnitPrice: 0.25,
    tier: 'low',
    category: 'Electronics',
    source: 'curated',
  },

  // =========================================================================
  // WATCHES (Luxury Mechanical, Chronograph & Smartwatches)
  // =========================================================================
  {
    id: 'prod_chronograph_steel_watch',
    name: 'Geneva Prestige Stainless Steel Chronograph Men’s Luxury Dress Watch',
    imageUrl: '/assets/aistudio/luxury_chronograph_watch.jpg',
    image: '/assets/aistudio/luxury_chronograph_watch.jpg',
    basePrice: 289.0,
    wholesaleUnitPrice: 0.39,
    tier: 'high',
    category: 'Watches',
    source: 'curated',
  },
  {
    id: 'prod_titanium_smartwatch_pro',
    name: 'TitanPulse Pro Titanium AMOLED GPS Smartwatch with Heart Rate Monitor',
    imageUrl: '/assets/aistudio/smartwatch_fitness_pro.jpg',
    image: '/assets/aistudio/smartwatch_fitness_pro.jpg',
    basePrice: 249.0,
    wholesaleUnitPrice: 0.37,
    tier: 'high',
    category: 'Watches',
    source: 'curated',
  },
  {
    id: 'prod_sapphire_navy_watch',
    name: 'Apex Automatic Sapphire Crystal Deep Navy Dial Wristwatch 42mm',
    imageUrl: '/assets/aistudio/luxury_chronograph_watch.jpg',
    image: '/assets/aistudio/luxury_chronograph_watch.jpg',
    basePrice: 129.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Watches',
    source: 'curated',
  },
  {
    id: 'prod_obsidian_fitness_watch',
    name: 'ActiveTrack Obsidian Waterproof Sport Fitness Tracker Smartwatch',
    imageUrl: '/assets/aistudio/smartwatch_fitness_pro.jpg',
    image: '/assets/aistudio/smartwatch_fitness_pro.jpg',
    basePrice: 68.0,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Watches',
    source: 'curated',
  },

  // =========================================================================
  // SNEAKERS (Running, Athletic, Retro Lifestyle & Cozy Footwear)
  // =========================================================================
  {
    id: 'prod_ua_assert_sneakers',
    name: 'Under Armour Charged Assert Breathable Knit Running Sneakers',
    imageUrl: '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg',
    image: '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg',
    basePrice: 69.0,
    wholesaleUnitPrice: 0.34,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },
  {
    id: 'prod_reebok_retro_sneakers',
    name: 'Reebok Classic Royal Suede & Mesh Cushion Retro Running Sneakers',
    imageUrl: '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg',
    image: '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg',
    basePrice: 74.0,
    wholesaleUnitPrice: 0.33,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },
  {
    id: 'prod_skechers_max_cushion',
    name: 'Skechers Max Cushioning Arch-Fit Breathable Walking Sneakers',
    imageUrl: '/assets/aistudio/81s0WAQ8vJL._AC_UL320__92f13a4f.jpg',
    image: '/assets/aistudio/81s0WAQ8vJL._AC_UL320__92f13a4f.jpg',
    basePrice: 64.0,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },
  {
    id: 'prod_puma_softride_sneakers',
    name: 'Puma Softride Pro Air-Heel Athletic Gym & Road Sneakers',
    imageUrl: '/assets/aistudio/81bLuiMMxQL._AC_UL320__7e90b268.jpg',
    image: '/assets/aistudio/81bLuiMMxQL._AC_UL320__7e90b268.jpg',
    basePrice: 66.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },
  {
    id: 'prod_retro_bow_sneakers',
    name: 'Vintage Pastel Bow Lace Chunky Gum-Sole Platform Casual Sneakers',
    imageUrl: '/assets/aistudio/71MlB-DjeSL._AC_UL320__bec02708.jpg',
    image: '/assets/aistudio/71MlB-DjeSL._AC_UL320__bec02708.jpg',
    basePrice: 39.5,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },
  {
    id: 'prod_suede_fleece_clogs',
    name: 'Project Cloud Genuine Suede Shearling-Lined Indoor Outdoor Clogs',
    imageUrl: '/assets/aistudio/81fZb9JN9yL._AC_UL640_QL65__2d9dacf6.jpg',
    image: '/assets/aistudio/81fZb9JN9yL._AC_UL640_QL65__2d9dacf6.jpg',
    basePrice: 44.0,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Sneakers',
    source: 'curated',
  },

  // =========================================================================
  // HOME APPLIANCES (Espresso, Air Fryer, Air Purifier, Vacuum & Home)
  // =========================================================================
  {
    id: 'prod_espresso_coffee_machine',
    name: 'Barista Pro 20-Bar Stainless Steel Espresso & Cappuccino Coffee Machine',
    imageUrl: '/assets/aistudio/espresso_coffee_machine.jpg',
    image: '/assets/aistudio/espresso_coffee_machine.jpg',
    basePrice: 279.0,
    wholesaleUnitPrice: 0.41,
    tier: 'high',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_cordless_stick_vacuum',
    name: 'AeroVac V12 Cordless Stick Vacuum Cleaner with HEPA Brushless Motor',
    imageUrl: '/assets/aistudio/cordless_stick_vacuum.jpg',
    image: '/assets/aistudio/cordless_stick_vacuum.jpg',
    basePrice: 219.0,
    wholesaleUnitPrice: 0.36,
    tier: 'high',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_digital_air_fryer',
    name: 'ChefTouch 6-Quart Digital Stainless Steel Rapid-Crisp Air Fryer',
    imageUrl: '/assets/aistudio/digital_air_fryer.jpg',
    image: '/assets/aistudio/digital_air_fryer.jpg',
    basePrice: 119.0,
    wholesaleUnitPrice: 0.34,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_hepa_air_purifier',
    name: 'PureBreeze 360 True HEPA Smart Home Air Purifier for Large Rooms',
    imageUrl: '/assets/aistudio/hepa_air_purifier.jpg',
    image: '/assets/aistudio/hepa_air_purifier.jpg',
    basePrice: 139.0,
    wholesaleUnitPrice: 0.35,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_heated_foot_massager',
    name: 'Ergonomic Heated Memory Foam Under-Desk Foot Warmer & Massager',
    imageUrl: '/assets/aistudio/71WyERKGCrL._AC_UL320__289148e5.jpg',
    image: '/assets/aistudio/71WyERKGCrL._AC_UL320__289148e5.jpg',
    basePrice: 49.0,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_mirrored_jewelry_cabinet',
    name: 'Full-Mirror Standing White Wooden Jewelry Armoire & Vanity Organizer',
    imageUrl: '/assets/aistudio/71HvNzho0JL._AC_UL320__964e4d7b.jpg',
    image: '/assets/aistudio/71HvNzho0JL._AC_UL320__964e4d7b.jpg',
    basePrice: 128.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_scotlite_vinyl_wrap',
    name: 'Scotlite Good Fix Premium High Gloss Vinyl Wrap Protective Film Roll',
    imageUrl: '/assets/aistudio/scotlite_vinyl_wrap_product.jpg',
    image: '/assets/aistudio/scotlite_vinyl_wrap_product.jpg',
    basePrice: 18.5,
    wholesaleUnitPrice: 0.21,
    tier: 'low',
    category: 'Home Appliances',
    source: 'curated',
  },
  {
    id: 'prod_popup_soccer_goals',
    name: 'All-Weather Portable Pop-Up Training Soccer Goal Net 2-Pack Kit',
    imageUrl: '/assets/aistudio/816KlidfhUL._AC_UL320__3eb75174.jpg',
    image: '/assets/aistudio/816KlidfhUL._AC_UL320__3eb75174.jpg',
    basePrice: 48.0,
    wholesaleUnitPrice: 0.29,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'curated',
  },

  // =========================================================================
  // BEAUTY (Serums, Luxury Perfume, Hair Styling, Cosmetic Organizers)
  // =========================================================================
  {
    id: 'prod_ionic_hair_dryer',
    name: 'Supersonic Pro High-Speed Ionic Salon Hair Dryer with Magnetic Diffuser',
    imageUrl: '/assets/aistudio/ionic_hair_dryer.jpg',
    image: '/assets/aistudio/ionic_hair_dryer.jpg',
    basePrice: 189.0,
    wholesaleUnitPrice: 0.37,
    tier: 'high',
    category: 'Beauty',
    source: 'curated',
  },
  {
    id: 'prod_luxury_eau_de_parfum',
    name: 'Lumiere Reserve Cut-Crystal Luxury Eau de Parfum Floral Fragrance 100ml',
    imageUrl: '/assets/aistudio/luxury_eau_de_parfum.jpg',
    image: '/assets/aistudio/luxury_eau_de_parfum.jpg',
    basePrice: 145.0,
    wholesaleUnitPrice: 0.36,
    tier: 'high',
    category: 'Beauty',
    source: 'curated',
  },
  {
    id: 'prod_vitamin_c_serum',
    name: 'Botanical 20% Vitamin C + Hyaluronic Acid Brightening Facial Serum',
    imageUrl: '/assets/aistudio/vitamin_c_skincare_serum.jpg',
    image: '/assets/aistudio/vitamin_c_skincare_serum.jpg',
    basePrice: 24.5,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Beauty',
    source: 'curated',
  },
  {
    id: 'prod_wavytalk_hair_waver',
    name: 'Wavytalk Professional Ceramic Triple-Barrel Deep Wave Hair Styler',
    imageUrl: '/assets/aistudio/61E_OHPYiUL._AC_UL320__4c5d577f.jpg',
    image: '/assets/aistudio/61E_OHPYiUL._AC_UL320__4c5d577f.jpg',
    basePrice: 42.0,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Beauty',
    source: 'curated',
  },
  {
    id: 'prod_makeup_carousel_organizer',
    name: '360-Degree Rotating Clear Acrylic Skincare & Cosmetic Carousel Organizer',
    imageUrl: '/assets/aistudio/61cVCxMax5L._AC_UL320__d3bb98aa.jpg',
    image: '/assets/aistudio/61cVCxMax5L._AC_UL320__d3bb98aa.jpg',
    basePrice: 21.9,
    wholesaleUnitPrice: 0.25,
    tier: 'low',
    category: 'Beauty',
    source: 'curated',
  },
  {
    id: 'prod_rose_gold_elixir_kit',
    name: 'GlowLab 24K Gold Peptide Anti-Aging Drops & Collagen Eye Serum',
    imageUrl: '/assets/aistudio/vitamin_c_skincare_serum.jpg',
    image: '/assets/aistudio/vitamin_c_skincare_serum.jpg',
    basePrice: 23.0,
    wholesaleUnitPrice: 0.23,
    tier: 'low',
    category: 'Beauty',
    source: 'curated',
  },

  // =========================================================================
  // FASHION (Handbags, Sunglasses, Fine Jewelry, Apparel & Activewear)
  // =========================================================================
  {
    id: 'prod_luxury_leather_handbag',
    name: 'Milan Structured Pebbled Leather Designer Crossbody Tote Handbag',
    imageUrl: '/assets/aistudio/luxury_leather_handbag.jpg',
    image: '/assets/aistudio/luxury_leather_handbag.jpg',
    basePrice: 239.0,
    wholesaleUnitPrice: 0.39,
    tier: 'high',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_polarized_aviator_sunglasses',
    name: 'Heritage Gold-Frame Polarized UV400 Classic Aviator Sunglasses',
    imageUrl: '/assets/aistudio/polarized_aviator_sunglasses.jpg',
    image: '/assets/aistudio/polarized_aviator_sunglasses.jpg',
    basePrice: 88.0,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_opal_solitaire_necklace',
    name: '925 Sterling Silver Teardrop Fire Opal Solitaire Pendant Necklace',
    imageUrl: '/assets/aistudio/61MMQO47mCL._AC_UL640_QL65__a0179204.jpg',
    image: '/assets/aistudio/61MMQO47mCL._AC_UL640_QL65__a0179204.jpg',
    basePrice: 48.5,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_boho_gemstone_necklace',
    name: 'Triple-Layered Bohemian Natural Raw Gemstone Cord Pendant Necklace',
    imageUrl: '/assets/aistudio/61qr6C2WPXL._AC_UL320__edde5787.jpg',
    image: '/assets/aistudio/61qr6C2WPXL._AC_UL320__edde5787.jpg',
    basePrice: 21.5,
    wholesaleUnitPrice: 0.22,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_cotton_crew_tees_5pk',
    name: '5-Pack Essential 100% Ring-Spun Combed Cotton Crewneck T-Shirts',
    imageUrl: '/assets/aistudio/81VfvFPHMRL._AC_UL320__e18fad92.jpg',
    image: '/assets/aistudio/81VfvFPHMRL._AC_UL320__e18fad92.jpg',
    basePrice: 24.0,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_athletic_joggers',
    name: 'Men’s Lightweight Quick-Dry Tapered Athletic Training Joggers',
    imageUrl: '/assets/aistudio/61WrRABw4uL._AC_UL320__64030dce.jpg',
    image: '/assets/aistudio/61WrRABw4uL._AC_UL320__64030dce.jpg',
    basePrice: 28.5,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_yoga_leggings_3pk',
    name: 'Women’s 3-Pack High-Waist Tummy Control Pocket Yoga Leggings',
    imageUrl: '/assets/aistudio/71M4vjzLF6L._AC_UL320__f465aca0.jpg',
    image: '/assets/aistudio/71M4vjzLF6L._AC_UL320__f465aca0.jpg',
    basePrice: 32.0,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_flared_yoga_pants',
    name: 'StudioSoft High-Waist Bootcut Flare Yoga Pants (Midnight Navy)',
    imageUrl: '/assets/aistudio/51RDgx5FY8L._AC_UL320__c9a6127a.jpg',
    image: '/assets/aistudio/51RDgx5FY8L._AC_UL320__c9a6127a.jpg',
    basePrice: 24.5,
    wholesaleUnitPrice: 0.23,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_compression_leggings',
    name: 'ActiveFlex Side-Pocket Seamless Compression Leggings (Jet Black)',
    imageUrl: '/assets/aistudio/61L7eBwEtCL._AC_UL320__8a315ad1.jpg',
    image: '/assets/aistudio/61L7eBwEtCL._AC_UL320__8a315ad1.jpg',
    basePrice: 23.5,
    wholesaleUnitPrice: 0.23,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_basketball_shorts_2pk',
    name: 'Men’s 2-Pack Breathable Mesh Pocket Athletic Gym Shorts',
    imageUrl: '/assets/aistudio/71PDe1uubSL._AC_UL320__17085a11.jpg',
    image: '/assets/aistudio/71PDe1uubSL._AC_UL320__17085a11.jpg',
    basePrice: 22.0,
    wholesaleUnitPrice: 0.22,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_puma_boxers_5pk',
    name: 'Puma Men’s 5-Pack Performance Stretch Cooling Boxer Briefs',
    imageUrl: '/assets/aistudio/71WWmzx0LgL._AC_UL320__37ae12d4.jpg',
    image: '/assets/aistudio/71WWmzx0LgL._AC_UL320__37ae12d4.jpg',
    basePrice: 24.99,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
  {
    id: 'prod_running_socks_10pk',
    name: '10-Pack Arch-Support Cushioned Low-Cut Performance Ankle Socks',
    imageUrl: '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg',
    image: '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg',
    basePrice: 14.99,
    wholesaleUnitPrice: 0.20,
    tier: 'low',
    category: 'Fashion',
    source: 'curated',
  },
];

/**
 * Additional global marketplace SKUs blended in when Admin clicks
 * "Auto-Generate Market Products" to refresh the active pool.
 */
const AUTO_MARKET_EXPANSION_POOL: Omit<CatalogProduct, 'image'>[] = [
  {
    id: 'mkt_ipad_air_m2',
    name: 'Apple iPad Air 11" M2 Liquid Retina Display 256GB Space Grey',
    imageUrl: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    basePrice: 549.0,
    wholesaleUnitPrice: 0.44,
    tier: 'high',
    category: 'Electronics',
    source: 'auto',
  },
  {
    id: 'mkt_sony_xm5_silver',
    name: 'Sony WH-1000XM5 Studio Wireless Noise Cancelling Headphones',
    imageUrl: '/assets/aistudio/anc_wireless_headphones.jpg',
    basePrice: 348.0,
    wholesaleUnitPrice: 0.39,
    tier: 'high',
    category: 'Electronics',
    source: 'auto',
  },
  {
    id: 'mkt_lg_ultragear_34',
    name: 'UltraGear 34" Curved Nano IPS 1ms WQHD HDR Gaming Monitor',
    imageUrl: '/assets/aistudio/curved_gaming_monitor.jpg',
    basePrice: 399.0,
    wholesaleUnitPrice: 0.42,
    tier: 'high',
    category: 'Electronics',
    source: 'auto',
  },
  {
    id: 'mkt_keychron_q1_pro',
    name: 'Keychron Pro Aluminum Gasket Mechanical Wireless Keyboard RGB',
    imageUrl: '/assets/aistudio/gaming_mechanical_keyboard.jpg',
    basePrice: 119.0,
    wholesaleUnitPrice: 0.33,
    tier: 'medium',
    category: 'Electronics',
    source: 'auto',
  },
  {
    id: 'mkt_swiss_chrono_gmt',
    name: 'Tissot Heritage Sapphire Chronograph Stainless Steel Watch 41mm',
    imageUrl: '/assets/aistudio/luxury_chronograph_watch.jpg',
    basePrice: 365.0,
    wholesaleUnitPrice: 0.43,
    tier: 'high',
    category: 'Watches',
    source: 'auto',
  },
  {
    id: 'mkt_garmin_amoled_watch',
    name: 'Venu Titanium Multisport GPS Smartwatch with Sapphire Lens',
    imageUrl: '/assets/aistudio/smartwatch_fitness_pro.jpg',
    basePrice: 295.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Watches',
    source: 'auto',
  },
  {
    id: 'mkt_breville_espresso',
    name: 'Breville Barista Express Brushed Steel Espresso Coffee Maker',
    imageUrl: '/assets/aistudio/espresso_coffee_machine.jpg',
    basePrice: 429.0,
    wholesaleUnitPrice: 0.45,
    tier: 'high',
    category: 'Home Appliances',
    source: 'auto',
  },
  {
    id: 'mkt_dyson_v11_vacuum',
    name: 'Cyclone V11 Cordless Smart Stick Vacuum with LCD Filter Display',
    imageUrl: '/assets/aistudio/cordless_stick_vacuum.jpg',
    basePrice: 289.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Home Appliances',
    source: 'auto',
  },
  {
    id: 'mkt_ninja_air_fryer_pro',
    name: 'Ninja Max XL 6-Quart Digital Stainless Crisper Air Fryer',
    imageUrl: '/assets/aistudio/digital_air_fryer.jpg',
    basePrice: 115.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'auto',
  },
  {
    id: 'mkt_levoit_hepa_300',
    name: 'Levoit Core True HEPA 360 Smart Bedroom Air Purifier',
    imageUrl: '/assets/aistudio/hepa_air_purifier.jpg',
    basePrice: 99.0,
    wholesaleUnitPrice: 0.30,
    tier: 'medium',
    category: 'Home Appliances',
    source: 'auto',
  },
  {
    id: 'mkt_dyson_supersonic_gold',
    name: 'Supersonic Luxe Ionic High-Velocity Salon Hair Dryer Kit',
    imageUrl: '/assets/aistudio/ionic_hair_dryer.jpg',
    basePrice: 229.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Beauty',
    source: 'auto',
  },
  {
    id: 'mkt_ysl_reserve_parfum',
    name: 'Atelier Velvet Crystal Eau de Parfum Luxury Signature Spray',
    imageUrl: '/assets/aistudio/luxury_eau_de_parfum.jpg',
    basePrice: 138.0,
    wholesaleUnitPrice: 0.35,
    tier: 'medium',
    category: 'Beauty',
    source: 'auto',
  },
  {
    id: 'mkt_skinceuticals_ce_serum',
    name: 'DermaGlow C+E Ferulic Antioxidant Vitamin C Brightening Serum',
    imageUrl: '/assets/aistudio/vitamin_c_skincare_serum.jpg',
    basePrice: 24.0,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Beauty',
    source: 'auto',
  },
  {
    id: 'mkt_coach_pebbled_tote',
    name: 'Coach Pebbled Leather Structured Carryall Shoulder Tote Bag',
    imageUrl: '/assets/aistudio/luxury_leather_handbag.jpg',
    basePrice: 249.0,
    wholesaleUnitPrice: 0.39,
    tier: 'high',
    category: 'Fashion',
    source: 'auto',
  },
  {
    id: 'mkt_rayban_aviator_gold',
    name: 'Classic Gold Polarized G-15 Lens UV400 Aviator Sunglasses',
    imageUrl: '/assets/aistudio/polarized_aviator_sunglasses.jpg',
    basePrice: 92.0,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Fashion',
    source: 'auto',
  },
  {
    id: 'mkt_adidas_cloudfoam_run',
    name: 'Reebok DMX Cloud Cushion Breathable Navy & White Sneakers',
    imageUrl: '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg',
    basePrice: 78.0,
    wholesaleUnitPrice: 0.33,
    tier: 'medium',
    category: 'Sneakers',
    source: 'auto',
  },
  {
    id: 'mkt_under_armour_charged',
    name: 'Under Armour Surge 4 Lightweight Cushion Training Sneakers',
    imageUrl: '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg',
    basePrice: 65.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Sneakers',
    source: 'auto',
  },
  {
    id: 'mkt_ankle_socks_bulk_10pk',
    name: '10-Pack Breathable Cotton Low-Cut Athletic Running Socks',
    imageUrl: '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg',
    basePrice: 15.9,
    wholesaleUnitPrice: 0.21,
    tier: 'low',
    category: 'Fashion',
    source: 'auto',
  },
];

export const productCatalog: CatalogProduct[] = CURATED_ECOMMERCE_CATALOG;
export const PRODUCT_CATALOG = productCatalog;

let inMemoryCatalog: CatalogProduct[] | null = null;

function sanitizeCatalogList(list: CatalogProduct[]): CatalogProduct[] {
  return list
    .filter((p) => p && typeof p.name === 'string' && p.name.trim().length > 0)
    .map((p) => {
      const safeImg = resolveProductThumbnail(p.imageUrl || p.image, p.name, p.category);
      return {
        ...p,
        imageUrl: safeImg,
        image: safeImg,
        basePrice: Number(p.basePrice) > 0 ? Number(p.basePrice) : 29.99,
        wholesaleUnitPrice:
          p.wholesaleUnitPrice && p.wholesaleUnitPrice > 0
            ? p.wholesaleUnitPrice
            : p.tier === 'high'
            ? 0.38
            : p.tier === 'medium'
            ? 0.29
            : 0.23,
      };
    });
}

/**
 * Returns the active product catalog (persisted custom/auto-generated pool if present,
 * otherwise the built-in 48-item curated global e-commerce catalog).
 */
export function getActiveProductCatalog(): CatalogProduct[] {
  if (inMemoryCatalog && inMemoryCatalog.length > 0) {
    return inMemoryCatalog;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCatalog = sanitizeCatalogList(parsed);
          return inMemoryCatalog;
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  inMemoryCatalog = CURATED_ECOMMERCE_CATALOG;
  return inMemoryCatalog;
}

export function saveActiveProductCatalog(items: CatalogProduct[]): CatalogProduct[] {
  const cleaned = sanitizeCatalogList(items);
  inMemoryCatalog = cleaned.length > 0 ? cleaned : CURATED_ECOMMERCE_CATALOG;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(inMemoryCatalog));
    }
  } catch {
    // Ignore storage write errors
  }
  return inMemoryCatalog;
}

/**
 * One-click Admin "Auto-Generate Market Products" action:
 * Refreshes and rotates a curated 48-item global e-commerce pool across
 * Electronics, Watches, Sneakers, Fashion, Home Appliances, and Beauty,
 * keeping any custom admin-added items intact.
 */
export function autoGenerateMarketProducts(): CatalogProduct[] {
  const existingCustom = getActiveProductCatalog().filter((p) => p.source === 'custom');
  const autoItems: CatalogProduct[] = AUTO_MARKET_EXPANSION_POOL.map((item) => ({
    ...item,
    image: item.imageUrl,
  }));
  // Combine auto-market SKUs + curated pool, shuffling slightly for fresh rotation
  const curatedShuffled = [...CURATED_ECOMMERCE_CATALOG].sort(() => 0.5 - Math.random());
  const combined = [...existingCustom, ...autoItems, ...curatedShuffled];
  // Deduplicate by id and keep top 52 items covering all tiers & categories
  const seen = new Set<string>();
  const deduped: CatalogProduct[] = [];
  for (const item of combined) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
    if (deduped.length >= 52) break;
  }
  return saveActiveProductCatalog(deduped);
}

export function addCustomCatalogProduct(input: {
  name: string;
  category: ProductCategory | string;
  tier: 'low' | 'medium' | 'high';
  basePrice: number;
  imageUrl?: string;
}): CatalogProduct[] {
  const cleanName = input.name.trim();
  const safeImage = resolveProductThumbnail(input.imageUrl, cleanName, input.category);
  const price = Math.max(1, Number(input.basePrice) || 29.99);
  const newProduct: CatalogProduct = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    category: input.category || 'Electronics',
    tier: input.tier || 'medium',
    basePrice: Number(price.toFixed(2)),
    wholesaleUnitPrice:
      input.tier === 'high' ? 0.38 : input.tier === 'medium' ? 0.28 : 0.22,
    imageUrl: safeImage,
    image: safeImage,
    source: 'custom',
  };
  const current = getActiveProductCatalog();
  return saveActiveProductCatalog([newProduct, ...current]);
}

export function removeCatalogProduct(productId: string): CatalogProduct[] {
  const filtered = getActiveProductCatalog().filter((p) => p.id !== productId);
  return saveActiveProductCatalog(filtered.length > 0 ? filtered : CURATED_ECOMMERCE_CATALOG);
}

export function resetProductCatalogToDefault(): CatalogProduct[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CATALOG_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  inMemoryCatalog = CURATED_ECOMMERCE_CATALOG;
  return inMemoryCatalog;
}

/**
 * Keyword-based automatic image fallback matching product title and category keywords
 * so thumbnails NEVER break or fall back to the website logo.
 */
export function resolveCategoryFallbackImage(productName?: string, category?: string): string {
  const text = `${productName || ''} ${category || ''}`.toLowerCase();

  // 1. Watches & Smartwatches
  if (text.includes('smartwatch') || text.includes('fitness watch') || text.includes('gps watch')) {
    return '/assets/aistudio/smartwatch_fitness_pro.jpg';
  }
  if (text.includes('watch') || text.includes('chronograph') || text.includes('timepiece')) {
    return '/assets/aistudio/luxury_chronograph_watch.jpg';
  }

  // 2. Electronics & Audio / Computing
  if (text.includes('earbud') || text.includes('airpod') || text.includes('tws')) {
    return '/assets/aistudio/wireless_earbuds_pro_product.jpg';
  }
  if (text.includes('headphone') || text.includes('headset') || text.includes('audio')) {
    return '/assets/aistudio/anc_wireless_headphones.jpg';
  }
  if (text.includes('keyboard')) {
    return '/assets/aistudio/gaming_mechanical_keyboard.jpg';
  }
  if (text.includes('mouse')) {
    return '/assets/aistudio/51sg9BLSMTL._AC_UL320__7260ba97.jpg';
  }
  if (text.includes('monitor') || text.includes('display') || text.includes('ultrawide')) {
    return '/assets/aistudio/curved_gaming_monitor.jpg';
  }
  if (text.includes('ipad')) {
    return '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg';
  }
  if (text.includes('samsung') || text.includes('galaxy tab') || text.includes('tablet')) {
    return '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg';
  }
  if (text.includes('charger') || text.includes('charging') || text.includes('power') || text.includes('surge')) {
    return '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg';
  }

  // 3. Home Appliances
  if (text.includes('espresso') || text.includes('coffee') || text.includes('barista')) {
    return '/assets/aistudio/espresso_coffee_machine.jpg';
  }
  if (text.includes('air fryer') || text.includes('fryer')) {
    return '/assets/aistudio/digital_air_fryer.jpg';
  }
  if (text.includes('purifier') || text.includes('hepa')) {
    return '/assets/aistudio/hepa_air_purifier.jpg';
  }
  if (text.includes('vacuum')) {
    return '/assets/aistudio/cordless_stick_vacuum.jpg';
  }
  if (text.includes('scotlite') || text.includes('vinyl') || text.includes('wrap')) {
    return '/assets/aistudio/scotlite_vinyl_wrap_product.jpg';
  }
  if (text.includes('appliance') || text.includes('kitchen') || text.includes('home')) {
    return '/assets/aistudio/espresso_coffee_machine.jpg';
  }

  // 4. Beauty & Skincare
  if (text.includes('perfume') || text.includes('parfum') || text.includes('fragrance')) {
    return '/assets/aistudio/luxury_eau_de_parfum.jpg';
  }
  if (text.includes('hair dryer') || text.includes('dryer')) {
    return '/assets/aistudio/ionic_hair_dryer.jpg';
  }
  if (text.includes('waver') || text.includes('curler') || text.includes('hair')) {
    return '/assets/aistudio/61E_OHPYiUL._AC_UL320__4c5d577f.jpg';
  }
  if (text.includes('makeup') || text.includes('cosmetic') || text.includes('organizer')) {
    return '/assets/aistudio/61cVCxMax5L._AC_UL320__d3bb98aa.jpg';
  }
  if (text.includes('serum') || text.includes('skincare') || text.includes('beauty') || text.includes('cream')) {
    return '/assets/aistudio/vitamin_c_skincare_serum.jpg';
  }

  // 5. Sneakers & Footwear
  if (text.includes('clog') || text.includes('slipper') || text.includes('suede')) {
    return '/assets/aistudio/81fZb9JN9yL._AC_UL640_QL65__2d9dacf6.jpg';
  }
  if (text.includes('reebok') || text.includes('retro')) {
    return '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg';
  }
  if (text.includes('skechers') || text.includes('walking')) {
    return '/assets/aistudio/81s0WAQ8vJL._AC_UL320__92f13a4f.jpg';
  }
  if (text.includes('sneaker') || text.includes('shoe') || text.includes('trainer') || text.includes('boot')) {
    return '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg';
  }

  // 6. Fashion, Bags, Sunglasses, Jewelry & Apparel
  if (text.includes('handbag') || text.includes('tote') || text.includes('bag') || text.includes('purse')) {
    return '/assets/aistudio/luxury_leather_handbag.jpg';
  }
  if (text.includes('sunglass') || text.includes('aviator') || text.includes('eyewear')) {
    return '/assets/aistudio/polarized_aviator_sunglasses.jpg';
  }
  if (text.includes('necklace') || text.includes('opal') || text.includes('jewelry') || text.includes('ring')) {
    return '/assets/aistudio/61MMQO47mCL._AC_UL640_QL65__a0179204.jpg';
  }
  if (text.includes('sock')) {
    return '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg';
  }
  if (text.includes('jogger') || text.includes('legging') || text.includes('yoga') || text.includes('pant')) {
    return '/assets/aistudio/71M4vjzLF6L._AC_UL320__f465aca0.jpg';
  }
  if (text.includes('short')) {
    return '/assets/aistudio/71PDe1uubSL._AC_UL320__17085a11.jpg';
  }
  if (text.includes('shirt') || text.includes('tee') || text.includes('fashion') || text.includes('apparel')) {
    return '/assets/aistudio/81VfvFPHMRL._AC_UL320__e18fad92.jpg';
  }
  if (text.includes('electronic')) {
    return '/assets/aistudio/anc_wireless_headphones.jpg';
  }

  return DEFAULT_FALLBACK_PRODUCT_IMAGE;
}

/**
 * Ensures product thumbnails never render a website brand logo or empty fallback.
 * Remaps any stored logo/placeholder URLs to the matching catalog or category photo.
 */
export function resolveProductThumbnail(
  imageUrl?: string,
  productName?: string,
  category?: string
): string {
  const trimmed = (imageUrl || '').trim();
  const isBlockedLogo =
    !trimmed ||
    NON_PRODUCT_LOGO_PATTERNS.some((pattern) =>
      trimmed.toLowerCase().includes(pattern.toLowerCase())
    );

  if (!isBlockedLogo) {
    return trimmed;
  }

  const normalizedName = (productName || '')
    .replace(/^\[Special Combo\]\s*/i, '')
    .trim()
    .toLowerCase();

  if (normalizedName) {
    const active = inMemoryCatalog || CURATED_ECOMMERCE_CATALOG;
    const matched = active.find((p) => {
      const catName = p.name.toLowerCase();
      return (
        catName === normalizedName ||
        catName.includes(normalizedName) ||
        normalizedName.includes(catName)
      );
    });
    if (matched?.imageUrl && !NON_PRODUCT_LOGO_PATTERNS.some((pat) => matched.imageUrl.toLowerCase().includes(pat.toLowerCase()))) {
      return matched.imageUrl;
    }
  }

  return resolveCategoryFallbackImage(productName, category);
}

/**
 * Generates 1 to 3 matched products tailored to user balance and platform tier
 * from the active curated/auto-generated e-commerce product pool.
 */
export function generateTieredMatchedProducts(
  userBalance: number,
  targetOrderAmount: number
): OrderProductItem[] {
  const activePool = getActiveProductCatalog();

  // Determine tier based on user balance
  const tier: 'low' | 'medium' | 'high' =
    userBalance >= 800 ? 'high' : userBalance >= 200 ? 'medium' : 'low';

  const eligible = activePool.filter((p) => p.tier === tier);
  const pool = eligible.length > 0 ? eligible : activePool;

  // Decide number of product items: 1, 2, or 3
  let count = 3;
  if (userBalance < 50) count = 1;
  else if (userBalance < 150) count = 2;

  // Pick distinct items prioritizing category variety
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected: CatalogProduct[] = [];
  const usedCategories = new Set<string>();

  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!usedCategories.has(item.category)) {
      selected.push(item);
      usedCategories.add(item.category);
    }
  }
  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!selected.some((s) => s.id === item.id)) {
      selected.push(item);
    }
  }

  // Split targetOrderAmount among the selected items (unchanged business math)
  const ratios = count === 1 ? [1] : count === 2 ? [0.55, 0.45] : [0.35, 0.35, 0.30];

  return selected.map((prod, idx) => {
    const allocated = targetOrderAmount * ratios[idx];
    const effectiveUnitPrice =
      prod.wholesaleUnitPrice ??
      (prod.basePrice > 50 ? 0.35 : prod.basePrice > 10 ? 0.26 : prod.basePrice);
    const qty = Math.max(1, Math.round(allocated / effectiveUnitPrice));

    return {
      id: 'item_' + Date.now() + '_' + idx,
      name: prod.name,
      image: resolveProductThumbnail(prod.imageUrl || prod.image, prod.name, prod.category),
      unitPrice: Number(effectiveUnitPrice.toFixed(2)),
      quantity: qty,
      detailsLabel: 'Original details',
    };
  });
}

/**
 * Generates high-value matched product combo for Special Combo Orders (Task #14 or #15)
 * Combines 3 premium flagship items across categories while preserving exact financial math.
 */
export function generateComboOrderProducts(
  userBalance: number,
  explicitTargetAmount?: number
): { items: OrderProductItem[]; totalOrderAmount: number } {
  const activePool = getActiveProductCatalog();
  const highTierPool = activePool.filter((p) => p.tier === 'high');
  const pool = highTierPool.length >= 3 ? highTierPool : activePool;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const count = 3;
  const selected: CatalogProduct[] = [];
  const usedCategories = new Set<string>();

  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!usedCategories.has(item.category)) {
      selected.push(item);
      usedCategories.add(item.category);
    }
  }
  for (const item of shuffled) {
    if (selected.length >= count) break;
    if (!selected.some((s) => s.id === item.id)) {
      selected.push(item);
    }
  }

  // Use explicit target amount if provided, else calculate
  const target =
    explicitTargetAmount && explicitTargetAmount > 0
      ? explicitTargetAmount
      : Math.max(120, userBalance > 0 ? userBalance * 1.36 : 250);
  const totalOrderAmount = Number(target.toFixed(2));

  // Split among items: 45%, 35%, 20%
  const ratios = [0.45, 0.35, 0.20];

  const items: OrderProductItem[] = selected.map((prod, idx) => {
    const allocated = totalOrderAmount * ratios[idx];
    const unitPrice = prod.wholesaleUnitPrice ?? 0.35;
    const qty = Math.max(1, Math.round(allocated / unitPrice));
    const finalUnitPrice = Number(unitPrice.toFixed(2));

    return {
      id: 'combo_item_' + Date.now() + '_' + idx,
      name: `[Special Combo] ${prod.name}`,
      image: resolveProductThumbnail(prod.imageUrl || prod.image, prod.name, prod.category),
      unitPrice: finalUnitPrice,
      quantity: qty,
      detailsLabel: 'Combo Package Allocation',
    };
  });

  // Adjust last item so item totals sum up exactly to totalOrderAmount
  if (items.length > 0) {
    const sumBeforeLast = Number(
      items.slice(0, -1).reduce((acc, it) => acc + it.unitPrice * it.quantity, 0).toFixed(2)
    );
    const diff = Number((totalOrderAmount - sumBeforeLast).toFixed(2));
    if (diff > 0) {
      const last = items[items.length - 1];
      last.unitPrice = diff;
      last.quantity = 1;
    }
  }

  return {
    items,
    totalOrderAmount,
  };
}
