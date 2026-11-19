import {
  Package,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  addCustomCatalogProduct,
  autoGenerateMarketProducts,
  CatalogProduct,
  getActiveProductCatalog,
  ProductCategory,
  removeCatalogProduct,
  resetProductCatalogToDefault,
  resolveCategoryFallbackImage,
  resolveProductThumbnail,
} from '../../data/productCatalog';

interface Props {
  onNotify: (res: { success: boolean; message?: string }) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Electronics',
  'Watches',
  'Sneakers',
  'Fashion',
  'Home Appliances',
  'Beauty',
];

export const AdminProductCatalog: React.FC<Props> = ({ onNotify }) => {
  const [products, setProducts] = useState<CatalogProduct[]>(() => getActiveProductCatalog());
  const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual custom product form state
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ProductCategory>('Electronics');
  const [customTier, setCustomTier] = useState<'low' | 'medium' | 'high'>('medium');
  const [customPrice, setCustomPrice] = useState('79.99');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [imgFallbacks, setImgFallbacks] = useState<Record<string, string>>({});

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
      const textMatch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [products, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    for (const p of products) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  const handleAutoGenerate = () => {
    const updated = autoGenerateMarketProducts();
    setProducts([...updated]);
    setImgFallbacks({});
    onNotify({
      success: true,
      message: `Auto-generated ${updated.length} market products across Electronics, Watches, Sneakers, Fashion, Home Appliances & Beauty.`,
    });
  };

  const handleResetDefault = () => {
    const restored = resetProductCatalogToDefault();
    setProducts([...restored]);
    setImgFallbacks({});
    onNotify({
      success: true,
      message: `Product pool reset to ${restored.length} curated default catalog items.`,
    });
  };

  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      onNotify({ success: false, message: 'Please enter a product name.' });
      return;
    }
    const updated = addCustomCatalogProduct({
      name: customName,
      category: customCategory,
      tier: customTier,
      basePrice: Number(customPrice) || 49.99,
      imageUrl: customImageUrl.trim() || undefined,
    });
    setProducts([...updated]);
    setCustomName('');
    setCustomImageUrl('');
    setShowAddForm(false);
    onNotify({
      success: true,
      message: `Added "${customName.trim()}" to active task product pool.`,
    });
  };

  const handleRemoveProduct = (item: CatalogProduct) => {
    const updated = removeCatalogProduct(item.id);
    setProducts([...updated]);
    onNotify({
      success: true,
      message: `Removed "${item.name}" from active product pool.`,
    });
  };

  const previewThumbnail = resolveProductThumbnail(
    customImageUrl.trim() || undefined,
    customName || customCategory,
    customCategory
  );

  return (
    <div className="space-y-4">
      {/* Header & Action Controls */}
      <div className="bg-[#0f1523] border border-[#1d273b] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              Task Product Catalog & Auto-Generator ({products.length} Active SKUs)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Powers automatic product names and keyword-matched thumbnails assigned to every user order across Amazon, Alibaba & AliExpress tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoGenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Generate Market Products</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141c2d] hover:bg-[#1b263d] border border-[#2a3854] text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showAddForm ? 'Close Custom Form' : 'Add Custom Item'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefault}
              title="Restore built-in 48 curated catalog products"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141c2d] hover:bg-[#1b263d] border border-[#1d273b] text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Manual Custom Product Creation Panel */}
        {showAddForm && (
          <form
            onSubmit={handleAddCustomProduct}
            className="bg-[#141c2d] border border-[#26344f] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Add Custom Product to Order Generator
              </span>
              <span className="text-[10px] text-slate-400">
                Leave Image URL blank to auto-assign a matching category photo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Dyson Airwrap Multi-Styler Complete"
                  className="w-full bg-[#0a0e17] border border-[#26344f] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ProductCategory)}
                  className="w-full bg-[#0a0e17] border border-[#26344f] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Balance Tier
                </label>
                <select
                  value={customTier}
                  onChange={(e) => setCustomTier(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full bg-[#0a0e17] border border-[#26344f] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                >
                  <option value="low">VIP 1 · Low ($1–$25)</option>
                  <option value="medium">VIP 2 · Medium ($25–$150)</option>
                  <option value="high">VIP 3 · High ($150+)</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-[#26344f] rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="md:col-span-3 flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Auto-mapped by keyword"
                    className="w-full bg-[#0a0e17] border border-[#26344f] rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div
                  className="w-9 h-9 rounded-lg bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden border border-[#2a3854]"
                  title="Auto-resolved thumbnail preview"
                >
                  <img
                    src={previewThumbnail}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = resolveCategoryFallbackImage(
                        customName,
                        customCategory
                      );
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-red-700 text-white'
                    : 'bg-[#141c2d] text-slate-400 hover:text-slate-200 border border-[#1d273b]'
                }`}
              >
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or category..."
              className="w-full bg-[#141c2d] border border-[#1d273b] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProducts.map((prod) => {
          const resolvedSrc =
            imgFallbacks[prod.id] ||
            resolveProductThumbnail(prod.imageUrl || prod.image, prod.name, prod.category);
          return (
            <div
              key={prod.id}
              className="bg-[#0f1523] border border-[#1d273b] hover:border-[#2e3f5e] rounded-xl p-3 flex gap-3 items-start transition-colors"
            >
              <div className="w-16 h-16 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center overflow-hidden border border-[#243047]">
                <img
                  src={resolvedSrc}
                  alt={prod.name}
                  className="w-full h-full object-contain"
                  onError={() => {
                    const fallback = resolveCategoryFallbackImage(prod.name, prod.category);
                    if (imgFallbacks[prod.id] !== fallback) {
                      setImgFallbacks((prev) => ({ ...prev, [prod.id]: fallback }));
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-1.5">
                  <h3
                    className="text-xs font-bold text-white line-clamp-2 leading-snug"
                    title={prod.name}
                  >
                    {prod.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(prod)}
                    title="Remove from active pool"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#141c2d] border border-[#25324b] text-[10px] font-semibold text-slate-300">
                    {prod.category}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      prod.tier === 'high'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : prod.tier === 'medium'
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {prod.tier}
                  </span>
                  {prod.source === 'custom' && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      Custom
                    </span>
                  )}
                  {prod.source === 'auto' && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      Auto-Market
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="font-mono font-bold text-emerald-400">
                    ${prod.basePrice.toFixed(2)}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">
                    Unit ${(prod.wholesaleUnitPrice ?? 0.25).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
