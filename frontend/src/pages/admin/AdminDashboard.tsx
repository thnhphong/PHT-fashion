import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import type { Product } from '../../types/types';
import type { Category } from '../../types/types';


const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl('/admin/products')}`);
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
    navigate(`/admin/products/${product._id}/edit`, { state: { product } });
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <div className="min-h-screen rounded-[40px] bg-white px-4 py-10 shadow-xl">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.6em] text-gray-400">Admin dashboard</p>
          <h1 className="text-3xl font-semibold text-gray-900">Product intelligence</h1>
          <p className="text-sm text-gray-600">Monitor and manage the catalog from one place.</p>
          {(error || success) && (
            <p className={`text-xs uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
              {error || success}
            </p>
          )}
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[{
            label: 'Products',
            value: totalProducts,
            helper: 'In catalog',
          }, {
            label: 'Revenue',
            value: '--',
            helper: 'Coming soon',
          }, {
            label: 'New',
            value: loading ? '...' : 'Verified',
            helper: 'Last sync',
          }].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.helper}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Catalog</p>
              <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="rounded-full border border-orange-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500 transition hover:bg-orange-50"
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600"
              >
                Categories
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/suppliers')}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600"
              >
                Suppliers
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/coupons')}
                className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600"
              >
                Coupons
              </button>
              <button
                type="button"
                onClick={fetchProducts}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600"
              >
                Refresh
              </button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-gray-500">Loading products...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.isArray(products) && products.map((product) => (
                <article
                  key={product._id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-lg"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      {(product.categoryId as Category)?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.price?.toLocaleString()} VND
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(product)}
                      className="rounded-2xl border border-gray-400 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-600 transition hover:border-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product._id)}
                      className="rounded-2xl border border-red-400 px-3 py-1 text-xs uppercase tracking-[0.3em] text-red-500 transition hover:border-red-500 hover:bg-red-50"
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

export default AdminDashboard;
