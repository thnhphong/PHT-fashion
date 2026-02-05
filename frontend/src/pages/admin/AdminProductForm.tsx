import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import type { Category, Product } from '../../types/types';

const imageFields = ['img_url', 'thumbnail_img_1', 'thumbnail_img_2', 'thumbnail_img_3', 'thumbnail_img_4'];
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const initialFormState = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  supplierId: '',
  stock: '',
};

type SizeEntry = {
  size: string;
  stock: string;
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
  const [sizeDraft, setSizeDraft] = useState<SizeEntry>({ size: '', stock: '' });
  const [error, setError] = useState('');
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(id || selectedProduct);

  const applyProduct = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name ?? '',
      description: product.description ?? '',
      price: product.price !== undefined ? String(product.price) : '',
      categoryId: product.categoryId ?? '',
      supplierId: product.supplierId ?? '',
      stock: product.stock !== undefined ? String(product.stock) : '',
    });
    setSizeEntries(
      product.sizes?.map((entry) => ({
        size: entry.size,
        stock: entry.stock !== undefined ? String(entry.stock) : '',
      })) ?? []
    );
    setSizeDraft({ size: '', stock: '' });
    setFiles(imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>));
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

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
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

  // ❌ block if exceeded
  if (usedStock + stock > totalStock) {
    setError('Total size stock exceeds product stock');
    return;
  }

  setError('');

  setSizeEntries((prev) => {
    const existingIndex = prev.findIndex((e) => e.size === size);
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex] = { size, stock: String(stock) };
      return updated;
    }
    return [...prev, { size, stock: String(stock) }];
  });

  setSizeDraft({ size: '', stock: '' });
};


  const updateSizeStock = (size: string, value: string) => {
    setSizeEntries((prev) =>
      prev.map((entry) => (entry.size === size ? { ...entry, stock: value } : entry))
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

    if (sizeEntries.length > 0) {
      const serialized = sizeEntries
        .filter((entry) => entry.size)
        .map((entry) => ({
          size: entry.size,
          stock: Number(entry.stock) || 0,
        }));
      if (serialized.length) {
        formData.append('sizes', JSON.stringify(serialized));
      }
    }

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

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase text-slate-400 tracking-[0.4em]">Admin dashboard</p>
            <h1 className="text-3xl font-bold">{isEditing ? 'Update product' : 'Create new product'}</h1>
            <p className="text-slate-400 text-sm">
              {isEditing
                ? 'Edit the details of an existing product.'
                : 'Add a new product with images, sizes, and associations.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white"
            >
              Back to catalog
            </button>
          </div>
          {error && <p className="text-xs uppercase text-red-400">{error}</p>}
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Name</label>
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-sm focus:border-rose-500 focus:outline-none"
                placeholder="Product name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Category</label>
              <select
                value={form.categoryId}
                onChange={(event) => handleChange('categoryId', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white"
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
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Price</label>
              <input
                value={form.price}
                onChange={(event) => handleChange('price', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="Price in USD"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Supplier</label>
              <select
                value={form.supplierId}
                onChange={(event) => handleChange('supplierId', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white"
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
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Stock count</label>
              <input
                value={form.stock}
                onChange={(event) => handleChange('stock', event.target.value)}
                type="number"
                min="0"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div className="col-span-full space-y-3">
              <label className="text-xs uppercase text-slate-400">Sizes &amp; stock</label>
              <div className="flex flex-wrap gap-3">
                <select
                  value={sizeDraft.size}
                  onChange={(event) => handleSizeDraftChange('size', event.target.value)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                >
                  <option value="">Choose size</option>
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>

                <input
                  value={sizeDraft.stock}
                  onChange={(event) => handleSizeDraftChange('stock', event.target.value)}
                  type="number"
                  min="0"
                  placeholder="Stock per size"
                  className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={addSizeEntry}
                  disabled={!sizeDraft.size || sizeDraft.stock === ''}
                  className="rounded-full border border-emerald-400 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-300 transition hover:border-emerald-300 disabled:border-slate-700 disabled:text-slate-500"
                >
                  Add size
                </button>
              </div>
              <div className="space-y-2">
                {sizeEntries.length === 0 && (
                  <p className="text-xs uppercase text-slate-500">No sizes added yet.</p>
                )}
                {sizeEntries.map((entry) => (
                  <div key={entry.size} className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-[0.4em] text-slate-400">{entry.size}</span>
                    <input
                      value={entry.stock}
                      onChange={(event) => updateSizeStock(entry.size, event.target.value)}
                      type="number"
                      min="0"
                      placeholder="Stock"
                      className="w-24 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSizeEntry(entry.size)}
                      className="text-xs uppercase tracking-[0.3em] text-rose-400 underline-offset-4 hover:text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-xs uppercase text-slate-400">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="Product description"
                rows={3}
                required
              />
            </div>

            {imageFields.map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-xs uppercase text-slate-400">{field}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(field, event.target.files?.[0] ?? null)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            ))}

            <div className="col-span-full">
              <button
                type="submit"
                disabled={submitting || fetchingProduct}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-rose-500/40 transition hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? 'Saving...' : 'Save product'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminProductForm;

