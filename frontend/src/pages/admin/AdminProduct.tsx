import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Category, Product } from '../../types/types';
import { apiUrl } from '../../utils/api';
import { Button } from '../../components/ui/button';


const formatPrice = (value?: number) =>
  value
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
    : '—';

const AdminProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(apiUrl('/admin/products'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProducts(response.data.data ?? response.data);
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete product?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(apiUrl(`/admin/products/${productId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Unable to delete product');
    }
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.6em] text-orange-500">Products</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-gray-900">Product catalog</h1>
            <p className="text-sm text-gray-500">{totalProducts} active products</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/admin/products/create')} variant="outline">
            Add product
          </Button>
          <Button onClick={fetchProducts} variant="ghost">
            Refresh
          </Button>
        </div>
        {(error || success) && (
          <p className={`mt-3 text-xs uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
            {error || success}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading products...</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              //add img in product item
              <article
                key={product._id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 shadow-sm md:flex-row md:items-center"
              >
                <div className="flex flex-row gap-2 text-left">
                  <img src={product.img_url} alt={product.name} className="w-16 h-16 object-cover" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                      {(product.categoryId as Category)?.name || 'Uncategorized'}
                    </p>
                    <h3 className="text-md font-semibold text-gray-900 line-clamp-2 max-w-[18rem] break-words sm:max-w-full">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
                  </div>
                </div>
                {/* action buttons on the right of the product item */}
                <div className="flex justify-end gap-2 md:ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/products/${product._id}/edit`, { state: { product } })}
                  >
                    Edit
                  </Button>
                  <Button className="bg-orange-500 text-white" onClick={() => handleDelete(product._id)}>
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminProduct;
