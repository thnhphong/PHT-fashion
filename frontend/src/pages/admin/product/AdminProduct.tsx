import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

//gET http://localhost:5001/api/admin/categories 404 (Not Found)
//GET http://localhost:5001/api/admin/suppliers 404 (Not Found)

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  supplierId: string;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: { size: string; stock: number }[];
};

const API_BASE_URL = 'http://localhost:5001/api';
const imageFields = ['img_url', 'thumbnail_img_1', 'thumbnail_img_2', 'thumbnail_img_3', 'thumbnail_img_4'];

const AdminProduct = () => {
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    supplierId: '',
    stock: '',
    sizes: '',
  });
  const [files, setFiles] = useState<Record<string, File | null>>(
    imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>)
  );

  const formTitle = selectedProduct ? 'Update product' : 'Create new product';
  const submitLabel = selectedProduct ? 'Update product' : 'Create product';

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/products`);
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch products');
    }
  };

  const fetchCategories = async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/categories`);
    setCategories(response.data);
  };

  const fetchSuppliers = async () => {
    const response = await axios.get(`${API_BASE_URL}/admin/suppliers`);
    setSuppliers(response.data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      supplierId: '',
      stock: '',
      sizes: '',
    });
    setFiles(imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>));
    setSelectedProduct(null);
  };

  const buildFormData = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) {
        if (key === 'sizes') {
          const parsed = value
            .split(',')
            .map((size) => size.trim())
            .filter(Boolean);
          formData.append(key, JSON.stringify(parsed.map((size) => ({ size, stock: 20 }))));
        } else {
          formData.append(key, value);
        }
      }
    });

    imageFields.forEach((field) => {
      if (files[field]) {
        formData.append(field, files[field] as File);
      }
    });

    return formData;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = buildFormData();
      if (selectedProduct) {
        await axios.put(`${API_BASE_URL}/admin/products/${selectedProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product updated');
      } else {
        await axios.post(`${API_BASE_URL}/admin/products`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Product created');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Unable to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/products/${productId}`);
      fetchProducts();
      setSuccess('Product deleted');
    } catch (err) {
      console.error(err);
      setError('Unable to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId,
      supplierId: product.supplierId,
      stock: String(product.stock),
      sizes: product.sizes?.map((entry) => entry.size).join(', ') ?? '',
    });
    setSuccess('');
    setFiles(imageFields.reduce((acc, field) => ({ ...acc, [field]: null }), {} as Record<string, File | null>));
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase text-slate-400 tracking-[0.4em]">Admin dashboard</p>
          <h1 className="text-3xl font-bold">Product catalog ({totalProducts})</h1>
          <p className="text-slate-400 text-sm">Upload and manage products with images & thumbnails.</p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <h2 className="text-xl font-semibold mb-3">{formTitle}</h2>
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
              <label className="text-xs uppercase text-slate-400">Category ID</label>
              <input
                value={form.categoryId}
                onChange={(event) => handleChange('categoryId', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="Category ObjectId"
              />
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
                onChange={(e) => handleChange('supplierId', e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white"
                required
              >
                {suppliers.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

              <label className="text-xs uppercase text-slate-400">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white"
                required
              >
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
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
                placeholder="Quantity"
              />
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-xs uppercase text-slate-400">Sizes (comma separated)</label>
              <input
                value={form.sizes}
                onChange={(event) => handleChange('sizes', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="XS,S,M,L"
              />
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
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-rose-500/40 transition hover:opacity-95 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Saving...' : submitLabel}
              </button>
              {(error || success) && (
                <p className={`mt-3 text-center text-xs uppercase ${error ? 'text-red-400' : 'text-emerald-300'}`}>
                  {error || success}
                </p>
              )}
            </div>
          </form>
          {selectedProduct && (
            <button
              type="button"
              className="mt-4 rounded-full px-4 py-2 text-xs uppercase tracking-[0.4em] text-slate-400 underline-offset-4 hover:text-white"
              onClick={resetForm}
            >
              Cancel edit
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          <div className="space-y-4">
            {products.map((product) => (
              <article key={product._id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{product.categoryId || 'Uncategorized'}</p>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-slate-400">${product.price?.toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                    className="rounded-full border border-red-500/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-400 transition hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminProduct;