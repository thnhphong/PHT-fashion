import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import type { Category, Product, Supplier } from '../../types/types';
import { 
  Package, 
  Tag, 
  DollarSign, 
  Truck, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Layers,
  Image as ImageIcon,
  Save,
  Clock,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';


const imageFields = ['img_url', 'thumbnail_img_1', 'thumbnail_img_2', 'thumbnail_img_3', 'thumbnail_img_4'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const initialFormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  supplierId: '',
  stock: '',
  hasVariants: false,
};

type SizeEntry = {
  size: string;
  stock: string;
  price?: string;
};

type LocationState = { product?: Product };

const AdminProductForm = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  const [form, setForm] = useState(initialFormState);
  const [files, setFiles] = useState<Record<string, File | null>>(
    imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>)
  );
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(locationState?.product ?? null);
  const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);
  const [sizeDraft, setSizeDraft] = useState<SizeEntry>({ size: '', stock: '', price: '' });
  const [error, setError] = useState('');
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addedStock, setAddedStock] = useState<number>(0);

  const isEditing = Boolean(id || selectedProduct);
  const imageInputRefs = imageFields.reduce((acc, field) => {
    acc[field] = acc[field] || (null as HTMLInputElement | null);
    return acc;
  }, {} as Record<string, HTMLInputElement | null>);

  const NO_SIZE_CATEGORIES = ['bags', 'hats', 'socks'];
  const selectedCategory = categories.find(
    (c) => c._id === form.categoryId
  );

  const showSizes =
    !!selectedCategory &&
    !NO_SIZE_CATEGORIES.includes(selectedCategory.name.toLowerCase());
  useEffect(() => {
    if (!showSizes) {
      setSizeEntries([]);
      setSizeDraft({ size: '', stock: '' });
    }
  }, [showSizes]);

  const applyProduct = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: product.price !== undefined ? String(product.price) : '',
      categoryId: (product.categoryId as Category)?._id ?? '',
      supplierId: (product.supplierId as Supplier)?._id ?? '',
      stock: product.stock !== undefined ? String(product.stock) : '',
      hasVariants: product.hasVariants ?? false,
    });
    setSizeEntries(
      product.sizes?.map((entry) => ({
        size: entry.size,
        stock: entry.stock !== undefined ? String(entry.stock) : '',
        price: entry.price !== undefined ? String(entry.price) : '',
      })) ?? []
    );
    setSizeDraft({ size: '', stock: '', price: '' });
    setFiles(imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>));
    setAddedStock(0);
  };

  const fetchProduct = useCallback(async (productId: string) => {
    setFetchingProduct(true);
    try {
      const response = await axios.get<Product>(apiUrl(`/admin/products/${productId}`));
      applyProduct(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load product');
    } finally {
      setFetchingProduct(false);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get<Category[]>(apiUrl('/admin/categories'));
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load categories');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get<{ _id: string; name: string }[]>(apiUrl('/admin/suppliers'));
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load suppliers');
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (locationState?.product) {
      applyProduct(locationState.product);
    } else if (id) {
      fetchProduct(id);
    }
  }, [id, locationState, fetchProduct]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const startIndex = imageFields.indexOf(field);
    const updatedFiles = { ...files };

    Array.from(fileList).forEach((file, idx) => {
      const targetField = imageFields[startIndex + idx];
      if (targetField) {
        updatedFiles[targetField] = file;
      }
    });

    setFiles(updatedFiles);

    // 🔥 focus next empty input
    const nextField = imageFields[startIndex + fileList.length];
    if (nextField && imageInputRefs[nextField]) {
      imageInputRefs[nextField]?.focus();
    }
  };

  const handleSizeDraftChange = (field: keyof SizeEntry, value: string) => {
    setSizeDraft((prev) => ({ ...prev, [field]: value }));
  };

  const getTotalSizeStock = (entries: SizeEntry[]) =>
    entries.reduce((sum, e) => sum + (Number(e.stock) || 0), 0);

  const addSizeEntry = () => {
    const size = sizeDraft.size.trim();
    const stock = Number(sizeDraft.stock);

    if (!size || isNaN(stock)) return;

    const totalStock = Number(form.stock || 0);
    const usedStock = getTotalSizeStock(sizeEntries);

    if (usedStock + stock > totalStock) {
      setError('Total size stock exceeds product stock');
      return;
    }

    setError('');

    setSizeEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.size === size);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { size, stock: String(stock), price: sizeDraft.price };
        return updated;
      }
      return [...prev, { size, stock: String(stock), price: sizeDraft.price }];
    });

    setSizeDraft({ size: '', stock: '', price: '' });
  };


  const updateSizeStock = (size: string, value: string) => {
    const newStock = Number(value);
    if (isNaN(newStock)) return;

    const totalStock = Number(form.stock || 0);

    const newTotal = sizeEntries.reduce((sum, entry) => {
      if (entry.size === size) return sum + newStock;
      return sum + (Number(entry.stock) || 0);
    }, 0);

    if (newTotal > totalStock) {
      setError('Total size stock exceeds product stock');
      return;
    }

    setError('');

    setSizeEntries((prev) =>
      prev.map((entry) =>
        entry.size === size ? { ...entry, stock: value } : entry
      )
    );
  };

  const removeSizeEntry = (size: string) => {
    setSizeEntries((prev) => prev.filter((entry) => entry.size !== size));
  };

  const buildFormData = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (!value) return;
      formData.append(key, value);
    });

    const serialized = sizeEntries
      .filter((entry) => entry.size)
      .map((entry) => ({
        size: entry.size,
        stock: Number(entry.stock) || 0,
        price: entry.price ? Number(entry.price) : undefined,
      }));
    formData.append('sizes', JSON.stringify(serialized));

    imageFields.forEach((field) => {
      if (files[field]) {
        formData.append(field, files[field] as File);
      }
    });

    return formData;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = buildFormData();
      const productId = id ?? selectedProduct?._id;
      const isUpdate = Boolean(productId);
      if (isUpdate) {
        await axios.put(apiUrl(`/admin/products/${productId}`), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(apiUrl('/admin/products'), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      const message = isUpdate ? 'Product updated' : 'Product created';
      navigate('/admin/products', { state: { message }, replace: true });
    } catch (err) {
      console.error(err);
      setError('Unable to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddStock = (amount: number) => {
    const currentStock = Number(form.stock || 0);
    const newStock = Math.max(0, currentStock + amount);
    handleChange('stock', String(newStock));
    setAddedStock(prev => prev + amount);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600 mb-2">
            <LayoutDashboard className="h-3 w-3" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">
            {isEditing ? 'Update Product' : 'Create New Product'}
          </h1>
          <p className="text-slate-500 italic">
            {isEditing
              ? `Refining details for "${selectedProduct?.name || 'Loading...'}"`
              : 'Expanding your store with premium new inventory.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Catalog
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-6 text-slate-900">
              <Package className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold italic tracking-tight">Core Details</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 col-span-full">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Product Name</label>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g. Premium Cotton T-Shirt"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={form.categoryId}
                    onChange={(event) => handleChange('categoryId', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supplier</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={form.supplierId}
                    onChange={(event) => handleChange('supplierId', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                    required
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.price}
                    onChange={(event) => handleChange('price', event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="Price in VND"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Global Stock</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={form.stock}
                    onChange={(event) => handleChange('stock', event.target.value)}
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                    placeholder="Total units available"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Mode</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(form.hasVariants)}
                    onChange={(e) => handleChange('hasVariants', String(e.target.checked))}
                    id="hasVariants"
                    className="h-4 w-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="hasVariants" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Size-Based Pricing (Variants)
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                placeholder="Describe the product's features, material, and care instructions..."
                rows={5}
                required
              />
            </div>
          </section>

          {/* Sizes Section */}
          {showSizes && (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold italic tracking-tight">Variant Matrix</h2>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Total Managed: <span className="text-slate-900">{getTotalSizeStock(sizeEntries)}</span> / <span className="text-orange-600 font-bold">{form.stock || 0}</span>
                </div>
              </div>

              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex flex-wrap items-end gap-3 mb-8">
                <div className="space-y-2 flex-1 min-w-[140px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Size</label>
                  <select
                    value={sizeDraft.size}
                    onChange={(event) => handleSizeDraftChange('size', event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm outline-none focus:border-orange-500 appearance-none"
                  >
                    <option value="">Select Size</option>
                    {sizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 flex-1 min-w-[140px]">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variant Price (Opt.)</label>
                  <input
                    value={sizeDraft.price}
                    onChange={(event) => handleSizeDraftChange('price', event.target.value)}
                    type="number"
                    min="0"
                    placeholder="Same as base"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold outline-none focus:border-orange-500 shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={addSizeEntry}
                  disabled={!sizeDraft.size || sizeDraft.stock === ''}
                  className="h-10 px-6 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:hover:bg-slate-900"
                >
                  Configure
                </button>
              </div>

              <div className="space-y-3">
                {sizeEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 italic">
                    <p className="text-xs">No sizing variants configured yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sizeEntries.map((entry) => (
                      <div key={entry.size} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm group hover:border-orange-200 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">{entry.size}</span>
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Availability & Price</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  value={entry.stock}
                                  onChange={(event) => updateSizeStock(entry.size, event.target.value)}
                                  type="number"
                                  min="0"
                                  className="w-12 bg-transparent text-sm font-bold text-slate-900 outline-none focus:text-orange-600"
                                />
                                <span className="text-[9px] text-slate-400 uppercase">Units</span>
                              </div>
                              {entry.price && (
                                <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                  <span className="text-sm font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(Number(entry.price))}đ</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSizeEntry(entry.size)}
                          className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Image Upload Grid */}
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-8 text-slate-900">
              <ImageIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold italic tracking-tight">Vibrant Media</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {imageFields.map((field, idx) => (
                <div key={field} className={cn("space-y-2", idx === 0 && "col-span-full sm:col-span-1")}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {idx === 0 ? 'Primary Master Image' : `Gallery Image ${idx}`}
                  </label>
                  <label className="group relative flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-orange-500/50 transition-all cursor-pointer overflow-hidden">
                    {files[field] ? (
                      <>
                        <img 
                          src={URL.createObjectURL(files[field] as File)} 
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                          alt="preview"
                        />
                        <div className="relative z-10 flex flex-col items-center">
                          <RefreshCw className="h-6 w-6 text-slate-900 mb-1" />
                          <span className="text-[9px] font-bold uppercase text-slate-900">Change File</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Plus className="h-6 w-6 text-slate-300 group-hover:text-orange-500 transition-colors mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600">Upload SVG/PNG</span>
                      </div>
                    )}
                    <input
                      ref={(el) => { imageInputRefs[field] = el; }}
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFileChange(field, event.target.files ?? null)}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Actions & Inventory Management */}
        <div className="space-y-8">
          {/* Quick Stock Component - User Requested "Adding Quant" */}
          {isEditing && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50/30 p-8 shadow-sm transition-all hover:shadow-md border-b-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold italic tracking-tight text-slate-900 uppercase">Quick Stock</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Level</span>
                    <span className="text-2xl font-bold text-slate-900">{form.stock} <span className="text-xs font-normal text-slate-400 italic">units</span></span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${Number(form.stock) < 10 ? 'bg-amber-500' : 'bg-orange-500'}`} 
                      style={{ width: `${Math.min((Number(form.stock) / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[1, 5, 10, 50].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickAddStock(val)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:border-orange-400 hover:text-orange-600 hover:shadow-sm transition-all active:scale-95"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleQuickAddStock(-1)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:border-rose-400 hover:text-rose-600 hover:shadow-sm transition-all active:scale-95 col-span-2"
                  >
                    <Minus className="h-3 w-3" /> Reduce by 1
                  </button>
                </div>

                {addedStock !== 0 && (
                  <div className="bg-white/50 border border-orange-100 rounded-xl p-3 flex items-center justify-between text-[10px] font-bold animate-in zoom-in-95 duration-200">
                    <span className="text-slate-500 uppercase tracking-widest">Adjusted this session</span>
                    <span className={addedStock > 0 ? "text-emerald-600" : "text-rose-600"}>
                      {addedStock > 0 ? `+${addedStock}` : addedStock} units
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Submission Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold italic mb-6 text-slate-900">Publish Changes</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <Clock className="h-4 w-4 text-slate-300" />
                <span>Last updated: {selectedProduct?.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleDateString() : 'Never'}</span>
              </div>
              
              <button
                type="submit"
                disabled={submitting || fetchingProduct}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditing ? 'Save Product' : 'Create Product'}
                  </>
                ) }
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-xs font-bold uppercase tracking-[.2em] text-slate-500 hover:bg-slate-50 transition-all"
              >
                Discard Changes
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;

