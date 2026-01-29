import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../../utils/api';
import type { Product } from './types';

const AdminProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Product[]>(apiUrl('/admin/products'));
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const message = (location.state as { message?: string } | null)?.message;
    if (message) {
      setSuccess(message);
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [location, navigate]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(apiUrl(`/admin/products/${productId}`));
      setSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Unable to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    navigate('/admin/products/create', { state: { product } });
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase text-slate-400 tracking-[0.4em]">Admin dashboard</p>
            <h1 className="text-3xl font-bold">Product catalog ({totalProducts})</h1>
            <p className="text-slate-400 text-sm">Review and manage the product catalog.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products/create')}
              className="rounded-full border border-rose-500/60 px-5 py-2 text-xs uppercase tracking-[0.3em] text-rose-300 transition hover:border-rose-400"
            >
              Create product
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              className="rounded-full border border-white/30 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white"
            >
              Categories
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/suppliers')}
              className="rounded-full border border-slate-500 px-5 py-2 text-xs uppercase tracking-[0.3em] text-slate-200 transition hover:border-slate-300"
            >
              Suppliers
            </button>
            <button
              type="button"
              onClick={fetchProducts}
              className="rounded-full border border-slate-700 px-5 py-2 text-xs uppercase tracking-[0.3em] text-slate-200 transition hover:border-slate-500"
            >
              Refresh
            </button>
          </div>
          {(error || success) && (
            <p className={`text-xs uppercase ${error ? 'text-red-400' : 'text-emerald-300'}`}>
              {error || success}
            </p>
          )}
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <h2 className="text-xl font-semibold mb-4">Products</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Loading products...</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                      {product.categoryId || 'Uncategorized'}
                    </p>
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
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminProduct;

