// frontend/src/components/home/FeaturedProducts.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import ProductCard from '../ui/ProductCard';
import Pagination from '../common/Pagination';
import type { Product, PaginatedResponse } from '../../types/types';
import { apiUrl } from "../../utils/api";
import handleAddToCart from '../../utils/handleAddToCart';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchProducts = async (page: number = 1) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get<PaginatedResponse<Product>>(
        `${apiUrl('/products/featured')}`,
        {
          params: {
            page,
            limit: 10, // 2 rows × 5 items
            sort: 'created_at',
            order: 'desc',
          },
        }
      );

      setProducts(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Unable to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
    // Scroll to top of products section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading && products.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-300 aspect-[3/4] rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Products</h2>
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => fetchProducts(pagination.currentPage)}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
          </div>
          <button
            onClick={() => {/* Navigate to all products */ }}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            View All →
          </button>
        </div>

        {/* Products Grid - 5 columns, 2 rows = 10 items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        )}

        {/* Loading Overlay */}
        {loading && products.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-700">Loading products...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;