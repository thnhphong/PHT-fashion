import { useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Category, Product } from '../../types/types';
import { apiUrl } from '../../utils/api';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/formatPrice';


// Price is handled by formatPrice utility imported from utils

const AdminProduct = () => {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAccessToken();
      const response = await axios.get(apiUrl('/admin/products'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setProducts(response.data.data ?? response.data);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId: string) => {
    if (!confirm(t('admin.deleteConfirm'))) return;
    try {
      const token = getAccessToken();
      await axios.delete(apiUrl(`/admin/products/${productId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess(t('admin.deleteSuccess'));
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(t('admin.deleteFailed'));
    }
  };

  const totalProducts = useMemo(() => products.length, [products]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.products')}</p>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-gray-900">{t('admin.productCatalogTitle')}</h1>
            <p className="text-sm text-gray-500">{t('admin.activeProductsCount', { count: totalProducts })}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/admin/products/create')} variant="outline">
            {t('admin.addProduct')}
          </Button>
          <Button onClick={fetchProducts} variant="ghost">
            {t('admin.refresh')}
          </Button>
        </div>
        {(error || success) && (
          <p className={`mt-3 text-xs uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
            {error || success}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.inventory')}</h2>
        {loading ? (
          <p className="text-sm text-gray-500">{t('admin.loading')}...</p>
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
                      {(product.categoryId as Category)?.name || t('admin.uncategorized')}
                    </p>
                    <h3 className="text-md font-semibold text-gray-900 line-clamp-2 max-w-[18rem] break-words sm:max-w-full">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">{formatPrice(product.price, i18n.language)}</p>
                  </div>
                </div>
                {/* action buttons on the right of the product item */}
                <div className="flex justify-end gap-2 md:ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/products/${product._id}/edit`, { state: { product } })}
                  >
                    {t('admin.edit')}
                  </Button>
                  <Button className="bg-orange-500 text-white" onClick={() => handleDelete(product._id)}>
                    {t('admin.delete')}
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
