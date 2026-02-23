import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import { Star } from 'lucide-react';
import type { Product } from '../types/types';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || '1');
  const [localQuery, setLocalQuery] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        params.set('page', page.toString());
        params.set('limit', '20');

        const response = await axios.get(`${apiUrl('/search')}?${params.toString()}`);
        if (response.data.success) {
          setProducts(response.data.data);
          setTotalProducts(response.data.pagination.totalProducts);
          setTotalPages(response.data.pagination.totalPages);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, page]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (localQuery.trim()) {
      params.set('q', localQuery.trim());
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

  const renderStars = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => (
        <Star key={index} className="w-4 h-4 text-[#FF1744] fill-current" />
      )),
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.6em]">
            <span className="text-[#FF1744]">Search</span>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-[#1a1a1a]">Results</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {query ? `Search results for "${query}"` : 'Search products'}
            </h1>
            <p className="text-sm text-gray-600">
              {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
            </p>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={localQuery}
              onChange={(event) => setLocalQuery(event.target.value)}
              placeholder="Search by name, brand, color..."
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm focus:border-orange-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#1a1a1a] px-6 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              Search
            </button>
          </form>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-xl bg-white shadow-sm" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="cursor-pointer overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm transition hover:shadow-lg"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={product.img_url || 'https://via.placeholder.com/500'}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {product.stock !== undefined && product.stock < 10 && (
                      <span className="absolute top-3 left-3 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold uppercase text-white">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h2>
                    {product.categoryId && (
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                        {typeof product.categoryId === 'string' ? product.categoryId : product.categoryId.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-[#FF1744]">{formatPrice(product.price)}</p>
                      <div className="flex items-center gap-1">{renderStars}</div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {product.stock && product.stock < 10 ? 'Limited quantity' : 'In stock'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      page === index + 1
                        ? 'bg-[#1a1a1a] text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-900">No products found</p>
            <p className="text-sm text-gray-500">Try another search term to discover what you need.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;