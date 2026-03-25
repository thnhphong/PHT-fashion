import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../utils/api';
import type { Product } from '../types/types';
import { formatPrice } from '../utils/formatPrice';

const BestSellers = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const sort = searchParams.get('sort') || 'relevance';
  const page = searchParams.get('page') || '1';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('sort', sort);
        params.append('page', page);
        params.append('limit', '20');

        const response = await axios.get(`${apiUrl('/products/best-sellers')}?${params.toString()}`);

        setProducts(response.data.data);
        setTotalProducts(response.data.pagination.totalItems);
        setTotalPages(response.data.pagination.totalPages);
      } catch (error) {
        console.error('Best sellers error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sort, page]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8 max-w-[1600px]">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('nav.bestSellers')}</h1>
          <p className="text-lg text-gray-600">
            {totalProducts} {totalProducts === 1 ? t('common.product') : t('common.products')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <label className="text-base text-gray-700">{t('products.sortBy')}:</label>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-5 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="relevance">{t('products.sortRelevance')}</option>
              <option value="price-asc">{t('products.sortPriceAsc')}</option>
              <option value="price-desc">{t('products.sortPriceDesc')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 2xl:gap-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-5 2xl:p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 2xl:gap-8">
              {products.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow cursor-pointer group"
                >
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                    <img
                      src={product.img_url || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock !== undefined && product.stock < 10 && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-sm px-3 py-1.5 rounded-md font-medium">
                        {t('products.lowStock')}
                      </span>
                    )}
                  </div>
                  <div className="p-5 2xl:p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base 2xl:text-lg">
                      {product.name}
                    </h3>
                    {product.categoryId && (
                      <p className="text-sm text-gray-500 mb-3 capitalize">
                        {typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xl 2xl:text-2xl font-bold text-orange-600">
                        {formatPrice(product.price, i18n.language)}
                      </p>
                      <div className="flex items-center space-x-1">
                        <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                        <span className="text-base text-gray-600">4.5</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-3">
                <button
                  onClick={() => handlePageChange(parseInt(page) - 1)}
                  disabled={parseInt(page) === 1}
                  className="px-5 py-2.5 2xl:px-6 2xl:py-3 text-base border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous')}
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-5 py-2.5 2xl:px-6 2xl:py-3 text-base rounded-lg ${parseInt(page) === pageNum
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(parseInt(page) + 1)}
                  disabled={parseInt(page) === totalPages}
                  className="px-5 py-2.5 2xl:px-6 2xl:py-3 text-base border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <svg className="w-28 h-28 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t('products.noProductsFound')}</h3>
            <p className="text-lg text-gray-600">{t('products.checkBackLaterBestSellers') || t('products.checkBackLater')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BestSellers;
