import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import type { Category, Product, Supplier } from '../../types/types';


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
  const { t } = useTranslation();
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
      setError(t('admin.loadFailed'));
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
      setError(t('admin.loadFailed'));
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get<{ _id: string; name: string }[]>(apiUrl('/admin/suppliers'));
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadFailed'));
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
      setError(t('admin.stockLimitExceeded'));
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
    const newStock = Number(value);
    if (isNaN(newStock)) return;

    const totalStock = Number(form.stock || 0);

    const newTotal = sizeEntries.reduce((sum, entry) => {
      if (entry.size === size) return sum + newStock;
      return sum + (Number(entry.stock) || 0);
    }, 0);

    if (newTotal > totalStock) {
      setError(t('admin.stockLimitExceeded'));
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
      const message = isUpdate ? t('admin.updateSuccess') : t('admin.saveSuccess');
      navigate('/admin/products', { state: { message }, replace: true });
    } catch (err) {
      console.error(err);
      setError(t('admin.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase text-gray-400 tracking-[0.4em]">{t('admin.dashboard')}</p>
            <h1 className="text-3xl font-bold">{isEditing ? t('admin.updateProduct') : t('admin.createNewProduct')}</h1>
            <p className="text-gray-400 text-sm">
              {isEditing
                ? t('admin.editProductDescription')
                : t('admin.addProductDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="rounded-full border border-gray-200 px-5 py-2 text-xs uppercase tracking-[0.3em] text-gray-900 transition hover:border-gray-200"
            >
              {t('admin.backToCatalog')}
            </button>
          </div>
          {error && <p className="text-xs uppercase text-red-500">{error}</p>}
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('profile.name')}</label>
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none"
                placeholder={t('admin.productName')}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('admin.categories')}</label>
              <select
                value={form.categoryId}
                onChange={(event) => handleChange('categoryId', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
                required
              >
                <option value="">{t('admin.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('products.price')}</label>
              <input
                value={form.price}
                onChange={(event) => handleChange('price', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
                placeholder={`${t('products.price')} (USD)`}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('admin.suppliers')}</label>
              <select
                value={form.supplierId}
                onChange={(event) => handleChange('supplierId', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
                required
              >
                <option value="">{t('admin.selectSupplier')}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('admin.stockCount')}</label>
              <input
                value={form.stock}
                onChange={(event) => handleChange('stock', event.target.value)}
                type="number"
                min="0"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {showSizes && (
              <div className="col-span-full space-y-3">
                <label className="text-xs uppercase text-gray-400">{t('admin.sizesAndStock')}</label>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={sizeDraft.size}
                    onChange={(event) => handleSizeDraftChange('size', event.target.value)}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-900"
                  >
                    <option value="">{t('admin.chooseSize')}</option>
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
                    placeholder={t('admin.stockPerSize')}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={addSizeEntry}
                    disabled={!sizeDraft.size || sizeDraft.stock === ''}
                    className="rounded-full border border-emerald-400 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-300 transition hover:border-emerald-300 disabled:border-gray-200 disabled:text-gray-500"
                  >
                    {t('admin.addSize')}
                  </button>
                </div>
                <div className="space-y-2">
                  {sizeEntries.length === 0 && (
                    <p className="text-xs uppercase text-gray-500">{t('admin.noSizesPlaceholder')}</p>
                  )}
                  {sizeEntries.map((entry) => (
                    <div key={entry.size} className="flex flex-wrap items-center gap-3">
                      <span className="text-xs uppercase tracking-[0.4em] text-gray-400">{entry.size}</span>
                      <input
                        value={entry.stock}
                        onChange={(event) => updateSizeStock(entry.size, event.target.value)}
                        type="number"
                        min="0"
                        placeholder="Stock"
                        className="w-24 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSizeEntry(entry.size)}
                        className="text-xs uppercase tracking-[0.3em] text-red-500 underline-offset-4 hover:text-red-200"
                      >
                        {t('admin.delete')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-full space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('admin.description')}</label>
              <textarea
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
                placeholder={t('admin.shortDescription')}
                rows={3}
                required
              />
            </div>

            {imageFields.map((field) => (
              <div key={field} className="space-y-2">
                <label className="text-xs uppercase text-gray-400">{field}</label>
                <input
                  ref={(el) => { imageInputRefs[field] = el; }}
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFileChange(field, event.target.files ?? null)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none"
                />
              </div>
            ))}

            <div className="col-span-full">
              <button
                type="submit"
                disabled={submitting || fetchingProduct}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-orange-500/40 transition hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? t('admin.saving') : t('admin.saveProduct')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminProductForm;

