import { OrderProductItem } from '../types';

export interface CatalogProduct {
  id: string;
  name: string;
  imageUrl: string;
  image?: string; // backwards compatibility alias
  basePrice: number;
  tier: 'low' | 'medium' | 'high';
  category: string;
  wholesaleUnitPrice?: number;
}

/**
 * Clean JavaScript/TypeScript product catalog generated from all user-uploaded product images.
 * Tiers:
 * - 'low': 0.20 - 25 USDT (High-volume wholesale accessories, socks, beauty, basic cables)
 * - 'medium': 25 - 150 USDT (Fashion apparel, gaming peripherals, audio, bedding, sneakers)
 * - 'high': 150 - 500+ USDT (Tablets, curved monitors, VR headsets, workstations, gaming desks)
 */
export const productCatalog: CatalogProduct[] = [
  // =========================================================================
  // HIGH TIER (150 - 550+ USDT): Premium Tech, Monitors, Desks, VR & Tablets
  // =========================================================================
  {
    id: 'prod_ipad_10th',
    name: 'Apple iPad 10th Gen 10.9-inch Liquid Retina Display 64GB',
    imageUrl: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    image: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    basePrice: 349.0,
    wholesaleUnitPrice: 0.38,
    tier: 'high',
    category: 'Electronics & Tablets',
  },
  {
    id: 'prod_samsung_tab_s9_ultra',
    name: 'Samsung Galaxy Tab S9 Ultra 14.6" Dynamic AMOLED 2X with S-Pen',
    imageUrl: '/assets/aistudio/51LHmhoU-cL._AC_UY218___1__f0f133ce.jpg',
    image: '/assets/aistudio/51LHmhoU-cL._AC_UY218___1__f0f133ce.jpg',
    basePrice: 499.0,
    wholesaleUnitPrice: 0.42,
    tier: 'high',
    category: 'Electronics & Tablets',
  },
  {
    id: 'prod_samsung_tab_s9_plus',
    name: 'Samsung Galaxy Tab S9 Plus 12.4" 5G Tablet 256GB Graphite',
    imageUrl: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    image: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    basePrice: 429.0,
    wholesaleUnitPrice: 0.36,
    tier: 'high',
    category: 'Electronics & Tablets',
  },
  {
    id: 'prod_samsung_tab_s11',
    name: 'Samsung Galaxy Tab S11 Ultra OLED Anti-Reflective Tablet 512GB',
    imageUrl: '/assets/aistudio/51WOmN30hNL._AC_UY218__4accbe53.jpg',
    image: '/assets/aistudio/51WOmN30hNL._AC_UY218__4accbe53.jpg',
    basePrice: 549.0,
    wholesaleUnitPrice: 0.48,
    tier: 'high',
    category: 'Electronics & Tablets',
  },
  {
    id: 'prod_curved_monitor_34',
    name: '34-inch 1500R Curved Ultrawide WQHD 165Hz HDR Gaming Monitor',
    imageUrl: '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg',
    image: '/assets/aistudio/61TVq0CDn7L._AC_UL320__533a5dc9.jpg',
    basePrice: 289.0,
    wholesaleUnitPrice: 0.32,
    tier: 'high',
    category: 'Electronics & Monitors',
  },
  {
    id: 'prod_sceptre_27_monitor',
    name: 'Sceptre 27-inch 180Hz 1ms Curved Gaming LED Monitor HDMI DP',
    imageUrl: '/assets/aistudio/71PDe1uubSL._AC_UL320__17085a11.jpg',
    image: '/assets/aistudio/71PDe1uubSL._AC_UL320__17085a11.jpg',
    basePrice: 179.0,
    wholesaleUnitPrice: 0.28,
    tier: 'high',
    category: 'Electronics & Monitors',
  },
  {
    id: 'prod_rgb_lshaped_desk',
    name: 'L-Shaped Carbon Fiber Ergonomic Gaming Desk with Full RGB Lights',
    imageUrl: '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg',
    image: '/assets/aistudio/810FvfaDKxL._AC_UL320__d53b2de1.jpg',
    basePrice: 189.0,
    wholesaleUnitPrice: 0.35,
    tier: 'high',
    category: 'Furniture & Gaming',
  },
  {
    id: 'prod_meta_quest_3',
    name: 'Meta Quest 3 Mixed Reality VR Headset 512GB Gaming Bundle',
    imageUrl: '/assets/aistudio/816KlidfhUL._AC_UL320__3eb75174.jpg',
    image: '/assets/aistudio/816KlidfhUL._AC_UL320__3eb75174.jpg',
    basePrice: 499.0,
    wholesaleUnitPrice: 0.45,
    tier: 'high',
    category: 'Gaming & VR',
  },
  {
    id: 'prod_android14_2in1_tablet',
    name: 'Android 14 Octa-Core 10" Tablet 2-in-1 with Keyboard & Stylus',
    imageUrl: '/assets/aistudio/6189AFCEQSL._AC_UY218__a67ecfa1.jpg',
    image: '/assets/aistudio/6189AFCEQSL._AC_UY218__a67ecfa1.jpg',
    basePrice: 169.0,
    wholesaleUnitPrice: 0.30,
    tier: 'high',
    category: 'Computers & Tablets',
  },
  {
    id: 'prod_android_5g_tablet',
    name: '10.1-inch 5G Android Tablet 16GB+512GB with Capacitive Stylus',
    imageUrl: '/assets/aistudio/61qr6C2WPXL._AC_UL320__edde5787.jpg',
    image: '/assets/aistudio/61qr6C2WPXL._AC_UL320__edde5787.jpg',
    basePrice: 199.0,
    wholesaleUnitPrice: 0.34,
    tier: 'high',
    category: 'Computers & Tablets',
  },
  {
    id: 'prod_mini_pc_i7',
    name: 'Intel Core i7 High-Performance Mini PC Workstation 32GB RAM 1TB SSD',
    imageUrl: '/assets/aistudio/61oiMqY0BDL._AC_UY218__4dd4bd77.jpg',
    image: '/assets/aistudio/61oiMqY0BDL._AC_UY218__4dd4bd77.jpg',
    basePrice: 389.0,
    wholesaleUnitPrice: 0.40,
    tier: 'high',
    category: 'Computers & Office',
  },

  // =========================================================================
  // MEDIUM TIER (25 - 150 USDT): Shoes, Peripherals, Audio, Bedding & Apparel
  // =========================================================================
  {
    id: 'prod_wavytalk_curler',
    name: 'Wavytalk Professional Ceramic Triple Barrel Deep Hair Waver',
    imageUrl: '/assets/aistudio/61cVCxMax5L._AC_UL320__d3bb98aa.jpg',
    image: '/assets/aistudio/61cVCxMax5L._AC_UL320__d3bb98aa.jpg',
    basePrice: 42.0,
    wholesaleUnitPrice: 0.29,
    tier: 'medium',
    category: 'Beauty & Hair Care',
  },
  {
    id: 'prod_charging_station',
    name: 'Multi-Device Fast Wireless Charging Stand for Controller & Headset',
    imageUrl: '/assets/aistudio/61E_OHPYiUL._AC_UL320__4c5d577f.jpg',
    image: '/assets/aistudio/61E_OHPYiUL._AC_UL320__4c5d577f.jpg',
    basePrice: 36.99,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Gaming Accessories',
  },
  {
    id: 'prod_opal_necklace',
    name: '925 Sterling Silver Teardrop Opal Solitaire Pendant Necklace',
    imageUrl: '/assets/aistudio/61eq6sVSA2L._AC_UY218__acd1b807.jpg',
    image: '/assets/aistudio/61eq6sVSA2L._AC_UY218__acd1b807.jpg',
    basePrice: 32.5,
    wholesaleUnitPrice: 0.22,
    tier: 'medium',
    category: 'Fine Jewelry',
  },
  {
    id: 'prod_orzly_gaming_bundle',
    name: 'Orzly 4-in-1 PC Gaming Combo (RGB Keyboard, Mouse, Headset & Pad)',
    imageUrl: '/assets/aistudio/61JI6UgtcJL._AC_UL320__5331bd7e.jpg',
    image: '/assets/aistudio/61JI6UgtcJL._AC_UL320__5331bd7e.jpg',
    basePrice: 49.99,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Gaming Accessories',
  },
  {
    id: 'prod_rosegold_earbuds',
    name: 'Rose Gold Open-Ear True Wireless Sport Earbuds Dual LED Display',
    imageUrl: '/assets/aistudio/61L7eBwEtCL._AC_UL320__8a315ad1.jpg',
    image: '/assets/aistudio/61L7eBwEtCL._AC_UL320__8a315ad1.jpg',
    basePrice: 28.0,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Audio & Headphones',
  },
  {
    id: 'prod_girls_winter_boots',
    name: "Girl's Winter Plush Faux Fur Trim Lace-Up Warm Suede Snow Boots",
    imageUrl: '/assets/aistudio/61MkUYRjkzL._AC_UL320__fe4a15f5.jpg',
    image: '/assets/aistudio/61MkUYRjkzL._AC_UL320__fe4a15f5.jpg',
    basePrice: 34.0,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_ua_assert9_shoes',
    name: "Under Armour Men's Charged Assert 9 Breathable Running Shoes",
    imageUrl: '/assets/aistudio/61MMQO47mCL._AC_UL640_QL65__a0179204.jpg',
    image: '/assets/aistudio/61MMQO47mCL._AC_UL640_QL65__a0179204.jpg',
    basePrice: 65.0,
    wholesaleUnitPrice: 0.35,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_skechers_kids_bright',
    name: 'Skechers Kids Bright Shimmer Lightweight Slip-On Sneakers',
    imageUrl: '/assets/aistudio/61YfJfmV4UL._AC_UL320__7f1d6071.jpg',
    image: '/assets/aistudio/61YfJfmV4UL._AC_UL320__7f1d6071.jpg',
    basePrice: 38.0,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_open_ear_sport_headset',
    name: 'Ergonomic Open-Ear Wireless Sport Running Headphones with Hooks',
    imageUrl: '/assets/aistudio/61Z2_gP-wML._AC_UL320__0ba3e5e0.jpg',
    image: '/assets/aistudio/61Z2_gP-wML._AC_UL320__0ba3e5e0.jpg',
    basePrice: 26.5,
    wholesaleUnitPrice: 0.23,
    tier: 'medium',
    category: 'Audio & Headphones',
  },
  {
    id: 'prod_nike_drifit_jersey',
    name: "Nike Men's Dri-FIT Park VII Breathable Soccer Jersey Neon Lime",
    imageUrl: '/assets/aistudio/714VU8D3t7L._AC_UL320__31e8d245.jpg',
    image: '/assets/aistudio/714VU8D3t7L._AC_UL320__31e8d245.jpg',
    basePrice: 28.0,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Sportswear & Apparel',
  },
  {
    id: 'prod_women_yoga_leggings_3pk',
    name: "Women's 3-Pack High-Waist Tummy Control Yoga Leggings with Pockets",
    imageUrl: '/assets/aistudio/717Jpv_7b2L._AC_UL320__ccf03425.jpg',
    image: '/assets/aistudio/717Jpv_7b2L._AC_UL320__ccf03425.jpg',
    basePrice: 32.0,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Sportswear & Apparel',
  },
  {
    id: 'prod_suede_ankle_booties',
    name: "Women's Warm Cozy Faux Fur Winter Suede Ankle Platform Booties",
    imageUrl: '/assets/aistudio/71dZvR8mpmL._AC_UL320__4d723cd5.jpg',
    image: '/assets/aistudio/71dZvR8mpmL._AC_UL320__4d723cd5.jpg',
    basePrice: 39.5,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_standing_jewelry_armoire',
    name: 'Full-Length Mirrored Free Standing White Jewelry Armoire Cabinet',
    imageUrl: '/assets/aistudio/71FrzNegWuL._AC_UL320__a5202dc4.jpg',
    image: '/assets/aistudio/71FrzNegWuL._AC_UL320__a5202dc4.jpg',
    basePrice: 119.0,
    wholesaleUnitPrice: 0.40,
    tier: 'medium',
    category: 'Furniture & Decor',
  },
  {
    id: 'prod_rgb_headphone_stand',
    name: 'RGB Universal Dual Headphone & Quad Controller Desktop Stand',
    imageUrl: '/assets/aistudio/71HvNzho0JL._AC_UL320__964e4d7b.jpg',
    image: '/assets/aistudio/71HvNzho0JL._AC_UL320__964e4d7b.jpg',
    basePrice: 36.0,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Gaming Accessories',
  },
  {
    id: 'prod_retro_bow_sneakers',
    name: 'Vintage Retro Pastel Bow Chunky Platform Sneakers for Women',
    imageUrl: '/assets/aistudio/71lUF0xA_OL._AC_UL320__3888c260.jpg',
    image: '/assets/aistudio/71lUF0xA_OL._AC_UL320__3888c260.jpg',
    basePrice: 29.5,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_extended_rgb_mousepad',
    name: 'Extended RGB Gaming Mouse Pad with 15W Qi Fast Wireless Charging',
    imageUrl: '/assets/aistudio/71lU_M0CQtL._AC_UL320__1b680845.jpg',
    image: '/assets/aistudio/71lU_M0CQtL._AC_UL320__1b680845.jpg',
    basePrice: 31.99,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Gaming Accessories',
  },
  {
    id: 'prod_anker_q30_headphones',
    name: 'Soundcore by Anker Life Q30 Hybrid Active Noise Cancelling Headphones',
    imageUrl: '/assets/aistudio/71MlB-DjeSL._AC_UL320__bec02708.jpg',
    image: '/assets/aistudio/71MlB-DjeSL._AC_UL320__bec02708.jpg',
    basePrice: 79.99,
    wholesaleUnitPrice: 0.36,
    tier: 'medium',
    category: 'Audio & Electronics',
  },
  {
    id: 'prod_heated_footrest',
    name: 'Ergonomic Memory Foam Under-Desk Footrest with Soothing Heating',
    imageUrl: '/assets/aistudio/71S-pQNQyIL._AC_UL320__a0468f38.jpg',
    image: '/assets/aistudio/71S-pQNQyIL._AC_UL320__a0468f38.jpg',
    basePrice: 46.0,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Office & Comfort',
  },
  {
    id: 'prod_popup_soccer_goals',
    name: 'Portable Pop-Up Soccer Goal 2-Pack Set with Agility Ladder & Cones',
    imageUrl: '/assets/aistudio/71sTM-ZWo7L._AC_UL320__3346a1aa.jpg',
    image: '/assets/aistudio/71sTM-ZWo7L._AC_UL320__3346a1aa.jpg',
    basePrice: 48.0,
    wholesaleUnitPrice: 0.30,
    tier: 'medium',
    category: 'Sports & Outdoors',
  },
  {
    id: 'prod_velvet_jewelry_travel_box',
    name: 'Dual-Layer Emerald Velvet Travel Jewelry Box Organizer with Lock',
    imageUrl: '/assets/aistudio/71wwLe7E8nL._AC_UY218__745bafd3.jpg',
    image: '/assets/aistudio/71wwLe7E8nL._AC_UY218__745bafd3.jpg',
    basePrice: 28.5,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Jewelry & Accessories',
  },
  {
    id: 'prod_project_cloud_slippers',
    name: 'Project Cloud Genuine Suede Moccasin Fleece Indoor Outdoor Slippers',
    imageUrl: '/assets/aistudio/71wwtlpQuZL._AC_UL320__a124cae6.jpg',
    image: '/assets/aistudio/71wwtlpQuZL._AC_UL320__a124cae6.jpg',
    basePrice: 44.0,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Footwear & Apparel',
  },
  {
    id: 'prod_bamboo_queen_duvet',
    name: 'Luxury 100% Organic Bamboo Lyocell Silky Cooling Queen Duvet Set',
    imageUrl: '/assets/aistudio/71WyERKGCrL._AC_UL320__289148e5.jpg',
    image: '/assets/aistudio/71WyERKGCrL._AC_UL320__289148e5.jpg',
    basePrice: 68.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Home & Bedding',
  },
  {
    id: 'prod_sage_green_comforter',
    name: 'Sage Green Botanical Floral Reversible Microfiber Queen Quilt Set',
    imageUrl: '/assets/aistudio/71xaPkLCWQL._AC_UL320__deabf97d.jpg',
    image: '/assets/aistudio/71xaPkLCWQL._AC_UL320__deabf97d.jpg',
    basePrice: 45.0,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Home & Bedding',
  },
  {
    id: 'prod_air_cushion_loafers',
    name: "Women's Air Cushion Orthopedic Slip-On Walking Loafer Mesh Shoes",
    imageUrl: '/assets/aistudio/71XBzSvq-NL._AC_UY218__4554d51b.jpg',
    image: '/assets/aistudio/71XBzSvq-NL._AC_UY218__4554d51b.jpg',
    basePrice: 33.0,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Footwear & Shoes',
  },
  {
    id: 'prod_skechers_gowalk_flex',
    name: "Skechers Women's Go Walk Flex Remarkable Slip-Ins Shoes",
    imageUrl: '/assets/aistudio/71zVw5KQUyL._AC_UL320__a44a515c.jpg',
    image: '/assets/aistudio/71zVw5KQUyL._AC_UL320__a44a515c.jpg',
    basePrice: 62.0,
    wholesaleUnitPrice: 0.32,
    tier: 'medium',
    category: 'Footwear & Shoes',
  },
  {
    id: 'prod_puma_boxers_5pk',
    name: "Puma Men's 5-Pack Performance Stretch Sport Boxer Briefs",
    imageUrl: '/assets/aistudio/815YXaoy1oL._AC_UL320__56da40c4.jpg',
    image: '/assets/aistudio/815YXaoy1oL._AC_UL320__56da40c4.jpg',
    basePrice: 32.5,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Apparel & Underwear',
  },
  {
    id: 'prod_skechers_flutter_hearts',
    name: 'Skechers Kids Flutter Hearts Lights Shimmer Athletic Shoes',
    imageUrl: '/assets/aistudio/81bLuiMMxQL._AC_UL320__7e90b268.jpg',
    image: '/assets/aistudio/81bLuiMMxQL._AC_UL320__7e90b268.jpg',
    basePrice: 39.0,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Kids Footwear',
  },
  {
    id: 'prod_cotton_floral_duvet',
    name: 'Botanical Garden Wildflower 100% Washed Cotton 3-Piece Floral Set',
    imageUrl: '/assets/aistudio/81Btuse5G2L._AC_UL320__b469a5fc.jpg',
    image: '/assets/aistudio/81Btuse5G2L._AC_UL320__b469a5fc.jpg',
    basePrice: 49.0,
    wholesaleUnitPrice: 0.29,
    tier: 'medium',
    category: 'Home & Bedding',
  },
  {
    id: 'prod_linen_khaki_duvet',
    name: 'Linen Textured Pre-Washed Earthy Khaki Queen Duvet Cover Set',
    imageUrl: '/assets/aistudio/81dsRwQoj4L._AC_UL320__553fc9a9.jpg',
    image: '/assets/aistudio/81dsRwQoj4L._AC_UL320__553fc9a9.jpg',
    basePrice: 52.0,
    wholesaleUnitPrice: 0.30,
    tier: 'medium',
    category: 'Home & Bedding',
  },
  {
    id: 'prod_quad_controller_tower',
    name: 'Universal 4-Controller & Dual Gaming Headset Desktop Tower',
    imageUrl: '/assets/aistudio/81fJ6AvNEkL._AC_UL320__0bb5c6a7.jpg',
    image: '/assets/aistudio/81fJ6AvNEkL._AC_UL320__0bb5c6a7.jpg',
    basePrice: 41.5,
    wholesaleUnitPrice: 0.27,
    tier: 'medium',
    category: 'Gaming Accessories',
  },
  {
    id: 'prod_reebok_royal_glide',
    name: "Reebok Men's Royal Glide Classic Leather Casual Sneakers",
    imageUrl: '/assets/aistudio/81fZb9JN9yL._AC_UL640_QL65__2d9dacf6.jpg',
    image: '/assets/aistudio/81fZb9JN9yL._AC_UL640_QL65__2d9dacf6.jpg',
    basePrice: 58.0,
    wholesaleUnitPrice: 0.31,
    tier: 'medium',
    category: 'Footwear & Shoes',
  },
  {
    id: 'prod_waffle_cotton_blanket',
    name: 'Heavyweight Washed Waffle Weave Breathable 100% Cotton Blanket',
    imageUrl: '/assets/aistudio/81gpRJtdO_L._AC_UL320__8e5db003.jpg',
    image: '/assets/aistudio/81gpRJtdO_L._AC_UL320__8e5db003.jpg',
    basePrice: 56.0,
    wholesaleUnitPrice: 0.30,
    tier: 'medium',
    category: 'Home & Bedding',
  },
  {
    id: 'prod_dual_soccer_targets',
    name: 'Dual All-Weather Pop-Up Training Soccer Target Nets Set',
    imageUrl: '/assets/aistudio/81HiDy7TtmL._AC_UL320__87d4e3c8.jpg',
    image: '/assets/aistudio/81HiDy7TtmL._AC_UL320__87d4e3c8.jpg',
    basePrice: 54.0,
    wholesaleUnitPrice: 0.29,
    tier: 'medium',
    category: 'Sports & Outdoors',
  },
  {
    id: 'prod_bone_conduction_headphones',
    name: 'Open-Ear Bone Conduction Bluetooth 5.3 Wireless Running Headphones',
    imageUrl: '/assets/aistudio/81LyMIRcILL._AC_UY218__80112dae.jpg',
    image: '/assets/aistudio/81LyMIRcILL._AC_UY218__80112dae.jpg',
    basePrice: 35.0,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Audio & Sport',
  },
  {
    id: 'prod_ua_ignite_slides',
    name: 'Under Armour Unisex Ignite VI Memory Foam Athletic Slides',
    imageUrl: '/assets/aistudio/81pI6PIPVEL._AC_UL320__9bd26497.jpg',
    image: '/assets/aistudio/81pI6PIPVEL._AC_UL320__9bd26497.jpg',
    basePrice: 32.0,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Footwear & Sandals',
  },
  {
    id: 'prod_cargo_flare_yoga_pants',
    name: 'High-Waisted Tactical Bootcut Flare Yoga Pants with Cargo Pockets',
    imageUrl: '/assets/aistudio/81Q5fJHT7ZL._AC_UL320__cb3e769c.jpg',
    image: '/assets/aistudio/81Q5fJHT7ZL._AC_UL320__cb3e769c.jpg',
    basePrice: 28.5,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Apparel & Activewear',
  },
  {
    id: 'prod_cast_iron_dumbbell_set',
    name: '66lb Adjustable Solid Cast Iron Dumbbell & Barbell Weight Set',
    imageUrl: '/assets/aistudio/81s0WAQ8vJL._AC_UL320__92f13a4f.jpg',
    image: '/assets/aistudio/81s0WAQ8vJL._AC_UL320__92f13a4f.jpg',
    basePrice: 75.0,
    wholesaleUnitPrice: 0.35,
    tier: 'medium',
    category: 'Fitness & Gym',
  },
  {
    id: 'prod_clarks_desert_boots',
    name: "Clarks Men's Bushacre 2 Classic Leather Desert Chukka Boots",
    imageUrl: '/assets/aistudio/81VfvFPHMRL._AC_UL320__e18fad92.jpg',
    image: '/assets/aistudio/81VfvFPHMRL._AC_UL320__e18fad92.jpg',
    basePrice: 85.0,
    wholesaleUnitPrice: 0.38,
    tier: 'medium',
    category: 'Footwear & Boots',
  },
  {
    id: 'prod_vintage_muscle_tanks_3pk',
    name: "3-Pack Men's Vintage Acid-Washed Muscle Cut-Off Gym Tank Tops",
    imageUrl: '/assets/aistudio/91a7LKXeiEL._AC_UL320__5b57755a.jpg',
    image: '/assets/aistudio/91a7LKXeiEL._AC_UL320__5b57755a.jpg',
    basePrice: 27.0,
    wholesaleUnitPrice: 0.23,
    tier: 'medium',
    category: 'Apparel & Fitness',
  },
  {
    id: 'prod_athletic_workout_joggers',
    name: "Men's Lightweight Athletic Quick-Dry Workout Running Joggers",
    imageUrl: '/assets/aistudio/91OykGwVwuL._AC_UL320__43c967b2.jpg',
    image: '/assets/aistudio/91OykGwVwuL._AC_UL320__43c967b2.jpg',
    basePrice: 26.5,
    wholesaleUnitPrice: 0.24,
    tier: 'medium',
    category: 'Apparel & Activewear',
  },
  {
    id: 'prod_gym_shorts_5pk',
    name: "Men's 5-Pack Quick-Dry 7-inch Inseam Athletic Running Shorts",
    imageUrl: '/assets/aistudio/51LhnGgtG1L._AC_UL320__592b2bd3.jpg',
    image: '/assets/aistudio/51LhnGgtG1L._AC_UL320__592b2bd3.jpg',
    basePrice: 33.0,
    wholesaleUnitPrice: 0.25,
    tier: 'medium',
    category: 'Sportswear & Shorts',
  },

  // =========================================================================
  // LOW TIER (0.20 - 25 USDT): High Volume Wholesales, Socks, Accessories
  // =========================================================================
  {
    id: 'prod_makeup_carousel',
    name: '360 Rotating Clear Acrylic Cosmetic & Skincare Carousel Organizer',
    imageUrl: '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg',
    image: '/assets/aistudio/61bIYw12j5L._AC_UL320__5b09577d.jpg',
    basePrice: 18.9,
    wholesaleUnitPrice: 0.28,
    tier: 'low',
    category: 'Beauty & Organization',
  },
  {
    id: 'prod_boho_chakra_necklace',
    name: 'Triple Layered Bohemian Natural Raw Gemstone Pendant Necklace',
    imageUrl: '/assets/aistudio/61lW-nQhWIL._AC_UY218__62299bff.jpg',
    image: '/assets/aistudio/61lW-nQhWIL._AC_UY218__62299bff.jpg',
    basePrice: 24.5,
    wholesaleUnitPrice: 0.22,
    tier: 'low',
    category: 'Fashion Jewelry',
  },
  {
    id: 'prod_makeup_brushes_14pk',
    name: 'Professional 14-Piece Vegan Synthetic Bristle Makeup Brush Set',
    imageUrl: '/assets/aistudio/61WrRABw4uL._AC_UL320__64030dce.jpg',
    image: '/assets/aistudio/61WrRABw4uL._AC_UL320__64030dce.jpg',
    basePrice: 19.99,
    wholesaleUnitPrice: 0.25,
    tier: 'low',
    category: 'Beauty & Cosmetics',
  },
  {
    id: 'prod_cotton_crew_undershirts_5pk',
    name: "Men's 5-Pack Heavyweight Combed Cotton Crewneck Undershirts",
    imageUrl: '/assets/aistudio/713bf_sUQVL._AC_UL320__03623968.jpg',
    image: '/assets/aistudio/713bf_sUQVL._AC_UL320__03623968.jpg',
    basePrice: 22.5,
    wholesaleUnitPrice: 0.26,
    tier: 'low',
    category: 'Apparel & Clothing',
  },
  {
    id: 'prod_velvet_jewelry_stand',
    name: '3-Tier Grey Velvet T-Bar Jewelry Display Stand Organizer',
    imageUrl: '/assets/aistudio/71BZPVv5dtL._AC_UL320__1cef981b.jpg',
    image: '/assets/aistudio/71BZPVv5dtL._AC_UL320__1cef981b.jpg',
    basePrice: 21.0,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Home & Jewelry',
  },
  {
    id: 'prod_surge_protector_tower',
    name: '12-Outlet Surge Protector Power Strip Tower with 6 USB Ports',
    imageUrl: '/assets/aistudio/71M4vjzLF6L._AC_UL320__f465aca0.jpg',
    image: '/assets/aistudio/71M4vjzLF6L._AC_UL320__f465aca0.jpg',
    basePrice: 24.99,
    wholesaleUnitPrice: 0.30,
    tier: 'low',
    category: 'Home & Electronics',
  },
  {
    id: 'prod_cushioned_ankle_socks_8pk',
    name: '8-Pack Athletic Low-Cut Cushioned Arch Support Running Ankle Socks',
    imageUrl: '/assets/aistudio/71WWmzx0LgL._AC_UL320__37ae12d4.jpg',
    image: '/assets/aistudio/71WWmzx0LgL._AC_UL320__37ae12d4.jpg',
    basePrice: 14.99,
    wholesaleUnitPrice: 0.20,
    tier: 'low',
    category: 'Apparel & Socks',
  },
  {
    id: 'prod_toddler_mesh_shoes',
    name: 'Toddler First Walkers Soft Lightweight Breathable Non-Slip Shoes',
    imageUrl: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    image: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    basePrice: 18.5,
    wholesaleUnitPrice: 0.22,
    tier: 'low',
    category: 'Baby & Kids',
  },
  {
    id: 'prod_slouchy_knit_socks_3pk',
    name: '3-Pair Y2K Aesthetic Extra-Long Ribbed Slouchy Knit Boot Socks',
    imageUrl: '/assets/aistudio/813TAlC6LRL._AC_UL320__f6c09ac0.jpg',
    image: '/assets/aistudio/813TAlC6LRL._AC_UL320__f6c09ac0.jpg',
    basePrice: 12.99,
    wholesaleUnitPrice: 0.20,
    tier: 'low',
    category: 'Fashion & Socks',
  },
  {
    id: 'prod_boho_gold_jewelry_50pk',
    name: '50-Piece Vintage Bohemian Chunky Gold Plated Ring & Chain Bangle Set',
    imageUrl: '/assets/aistudio/81Djs1HrRYL._AC_UL320__bcee8b57.jpg',
    image: '/assets/aistudio/81Djs1HrRYL._AC_UL320__bcee8b57.jpg',
    basePrice: 24.99,
    wholesaleUnitPrice: 0.28,
    tier: 'low',
    category: 'Fashion Jewelry',
  },
  {
    id: 'prod_perf_ankle_socks_6pk',
    name: "6-Pack Men's Moisture-Wicking Low Cut Performance Ankle Socks",
    imageUrl: '/assets/aistudio/81W5kRhJYuL._AC_UL320__1a22d1e2.jpg',
    image: '/assets/aistudio/81W5kRhJYuL._AC_UL320__1a22d1e2.jpg',
    basePrice: 13.5,
    wholesaleUnitPrice: 0.20,
    tier: 'low',
    category: 'Apparel & Socks',
  },
  {
    id: 'prod_palazzo_lounge_pants',
    name: 'High-Waisted Wide Leg Flowy Casual Lounge Palazzo Pants',
    imageUrl: '/assets/aistudio/81YE4AOrAVL._AC_UL320__fba4f5c1.jpg',
    image: '/assets/aistudio/81YE4AOrAVL._AC_UL320__fba4f5c1.jpg',
    basePrice: 24.5,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Apparel & Loungewear',
  },
  {
    id: 'prod_compression_leggings',
    name: "Women's Seamless Ribbed Tummy Control Compression Leggings",
    imageUrl: '/assets/aistudio/91krpHS1OUL._AC_UL320__278ae8c6.jpg',
    image: '/assets/aistudio/91krpHS1OUL._AC_UL320__278ae8c6.jpg',
    basePrice: 23.5,
    wholesaleUnitPrice: 0.23,
    tier: 'low',
    category: 'Apparel & Activewear',
  },
  {
    id: 'prod_basketball_shorts_2pk',
    name: "Men's 2-Pack Mesh Basketball Training Gym Shorts with Pockets",
    imageUrl: '/assets/aistudio/4116U03TTKL._AC_UL320__608bb56f.jpg',
    image: '/assets/aistudio/4116U03TTKL._AC_UL320__608bb56f.jpg',
    basePrice: 22.0,
    wholesaleUnitPrice: 0.22,
    tier: 'low',
    category: 'Sportswear & Shorts',
  },
  {
    id: 'prod_cotton_everyday_shirts_5pk',
    name: '5-Pack Classic 100% Ring-Spun Cotton Everyday Undershirts',
    imageUrl: '/assets/aistudio/41MjMjLh9BL._SR210_210__303aa6e1.jpg',
    image: '/assets/aistudio/41MjMjLh9BL._SR210_210__303aa6e1.jpg',
    basePrice: 24.0,
    wholesaleUnitPrice: 0.24,
    tier: 'low',
    category: 'Apparel & Basics',
  },
  {
    id: 'prod_sport_earbuds_led_case',
    name: 'True Wireless Sport Bluetooth Earbuds with Dual LED Battery Case',
    imageUrl: '/assets/aistudio/51RDgx5FY8L._AC_UL320__c9a6127a.jpg',
    image: '/assets/aistudio/51RDgx5FY8L._AC_UL320__c9a6127a.jpg',
    basePrice: 24.99,
    wholesaleUnitPrice: 0.25,
    tier: 'low',
    category: 'Audio & Earbuds',
  },
  {
    id: 'prod_scotlite_vinyl_wrap',
    name: 'Scotlite Good Fix Premium High Gloss Vinyl Wrap Protective Film',
    imageUrl: '/assets/aistudio/D217d10797D9867123be63C3807Ab91e33301c2c94448713bfa4b0d9f3e7e32a_75c1958b.jpg',
    image: '/assets/aistudio/D217d10797D9867123be63C3807Ab91e33301c2c94448713bfa4b0d9f3e7e32a_75c1958b.jpg',
    basePrice: 15.5,
    wholesaleUnitPrice: 0.21,
    tier: 'low',
    category: 'Automotive & Wrap',
  },
  {
    id: 'prod_logitech_mouse',
    name: 'Logitech G305 Lightspeed Wireless Gaming Mouse HERO Sensor',
    imageUrl: '/assets/aistudio/51sg9BLSMTL._AC_UL320__7260ba97.jpg',
    image: '/assets/aistudio/51sg9BLSMTL._AC_UL320__7260ba97.jpg',
    basePrice: 38.5,
    wholesaleUnitPrice: 0.28,
    tier: 'medium',
    category: 'Gaming Accessories',
  },

  // =========================================================================
  // ICONIC MATCHED ITEMS (Supporting exact screenshot grab_order_80330fb5.jpg)
  // =========================================================================
  {
    id: 'prod_switch',
    name: 'Nintendo Switch',
    imageUrl: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    image: '/assets/aistudio/41lyVjfaJ7L._AC_UY218__3d4a1b42.jpg',
    basePrice: 299.0,
    wholesaleUnitPrice: 0.26,
    tier: 'medium',
    category: 'Gaming & Tech',
  },
  {
    id: 'prod_tab',
    name: 'Samsung Galaxy Tab',
    imageUrl: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    image: '/assets/aistudio/51LHmhoU-cL._AC_UY218__f0f133ce.jpg',
    basePrice: 380.0,
    wholesaleUnitPrice: 0.38,
    tier: 'medium',
    category: 'Tablets & Computers',
  },
  {
    id: 'prod_clothing',
    name: 'Infant Clothing Set',
    imageUrl: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    image: '/assets/aistudio/71ul-8eS9IL._AC_UL320__1523d6aa.jpg',
    basePrice: 49.6,
    wholesaleUnitPrice: 4.96,
    tier: 'medium',
    category: 'Apparel & Kids',
  },
];

// Backwards compatibility alias
export const PRODUCT_CATALOG = productCatalog;

/**
 * Generates 1 to 3 matched products tailored to user balance and platform tier
 * Supports wholesale order tasks (high quantities x955, x693, x53) matching the screenshot!
 */
export function generateTieredMatchedProducts(
  userBalance: number,
  targetOrderAmount: number
): OrderProductItem[] {
  // Determine tier based on user balance
  const tier: 'low' | 'medium' | 'high' =
    userBalance >= 800 ? 'high' : userBalance >= 200 ? 'medium' : 'low';

  const eligible = productCatalog.filter((p) => p.tier === tier);
  const pool = eligible.length > 0 ? eligible : productCatalog;

  // Decide number of product items: 1, 2, or 3
  let count = 3;
  if (userBalance < 50) count = 1;
  else if (userBalance < 150) count = 2;

  // Shuffle pool to pick distinct items
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // High fidelity match for the classic screenshot when medium tier and balance ~400+
  if (tier === 'medium' && userBalance >= 400 && Math.random() > 0.4) {
    const s1 = productCatalog.find((p) => p.id === 'prod_switch') || selected[0];
    const s2 = productCatalog.find((p) => p.id === 'prod_tab') || selected[1];
    const s3 = productCatalog.find((p) => p.id === 'prod_clothing') || selected[2];
    selected[0] = s1;
    selected[1] = s2;
    selected[2] = s3;
  }

  // Split targetOrderAmount among the selected items
  const ratios = count === 1 ? [1] : count === 2 ? [0.55, 0.45] : [0.35, 0.35, 0.30];

  return selected.map((prod, idx) => {
    const allocated = targetOrderAmount * ratios[idx];
    // Use wholesaleUnitPrice if present, otherwise realistic basePrice scaled
    const effectiveUnitPrice = prod.wholesaleUnitPrice ?? (prod.basePrice > 50 ? 0.35 : prod.basePrice > 10 ? 0.26 : prod.basePrice);
    const qty = Math.max(1, Math.round(allocated / effectiveUnitPrice));

    return {
      id: 'item_' + Date.now() + '_' + idx,
      name: prod.name,
      image: prod.imageUrl || prod.image || '',
      unitPrice: Number(effectiveUnitPrice.toFixed(2)),
      quantity: qty,
      detailsLabel: 'Original details',
    };
  });
}

/**
 * Generates high-value matched product combo for Special Combo Orders (Task #14 or #15)
 * Combines 2 to 3 premium luxury/tech flagship items with super commission potential.
 */
export function generateComboOrderProducts(
  userBalance: number,
  explicitTargetAmount?: number
): { items: OrderProductItem[]; totalOrderAmount: number } {
  // Select premium high-tier catalog items
  const highTierPool = productCatalog.filter((p) => p.tier === 'high');
  const pool = highTierPool.length >= 3 ? highTierPool : productCatalog;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  // Pick 2 or 3 premium items
  const count = 3;
  const selected = shuffled.slice(0, count);

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
      image: prod.imageUrl || prod.image || '',
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

