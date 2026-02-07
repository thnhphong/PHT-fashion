import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import type { Product } from '../types/types';
const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get query params
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const supplier = searchParams.get('supplier') || '';
  const color = searchParams.get('color') || '';
  const size = searchParams.get('size') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const page = searchParams.get('page') || '1';

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    suppliers: string[];
    colors: string[];
    sizes: string[];
    priceRange: { min: number; max: number };
  } | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    category: category,
    minPrice: minPrice,
    maxPrice: maxPrice,
    supplier: supplier,
    color: color,
    size: size,
    sort: sort
  });

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (category) params.append('category', category);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (supplier) params.append('supplier', supplier);
        if (color) params.append('color', color);
        if (size) params.append('size', size);
        params.append('sort', sort);
        params.append('page', page);
        params.append('limit', '20');

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
  }, [query, category, minPrice, maxPrice, supplier, color, size, sort, page]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (category) params.append('category', category);

        const response = await axios.get(`${apiUrl('/search/filters')}?${params.toString()}`);

        if (response.data.success) {
          setFilterOptions(response.data.data);
        }
      } catch (error) {
        console.error('Filter options error:', error);
      }
    };

    fetchFilterOptions();
  }, [query, category]);

  // Update URL with filters
  const updateFilters = (newFilters: {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    supplier?: string;
    color?: string;
    size?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.supplier) params.set('supplier', newFilters.supplier);
    if (newFilters.color) params.set('color', newFilters.color);
    if (newFilters.size) params.set('size', newFilters.size);
    if (newFilters.sort) params.set('sort', newFilters.sort);
    params.set('page', '1'); // Reset to page 1 when filters change
    setSearchParams(params);
  };
  // Apply filters
  const applyFilters = () => {
    updateFilters(localFilters);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    const resetFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      supplier: '',
      color: '',
      size: '',
      sort: 'relevance'
    };
    setLocalFilters(resetFilters);
    updateFilters(resetFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filters count
  const activeFiltersCount = [category, supplier, color, size, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {query ? `Search results for "${query}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {/* Filter & Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={sort}
              onChange={(e) => {
                const newFilters = { ...localFilters, sort: e.target.value };
                setLocalFilters(newFilters);
                updateFilters(newFilters);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {category && (
              <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>Category: {category}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, category: '' };
                    setLocalFilters(newFilters);
                    updateFilters(newFilters);
                  }}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {supplier && (
              <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>Supplier: {supplier}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, supplier: '' };
                    setLocalFilters(newFilters);
                    updateFilters(newFilters);
                  }}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {color && (
              <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>Color: {color}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, color: '' };
                    setLocalFilters(newFilters);
                    updateFilters(newFilters);
                  }}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {size && (
              <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>Size: {size}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, size: '' };
                    setLocalFilters(newFilters);
                    updateFilters(newFilters);
                  }}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <span>
                  Price: ${minPrice || '0'} - ${maxPrice || '∞'}
                </span>
                <button
                  onClick={() => {
                    const newFilters = { ...localFilters, minPrice: '', maxPrice: '' };
                    setLocalFilters(newFilters);
                    updateFilters(newFilters);
                  }}
                  className="hover:text-orange-900"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && filterOptions && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>

                {/* Category Filter */}
                {filterOptions.categories && Array.isArray(filterOptions.categories) && filterOptions.categories.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                    <div className="space-y-2">
                      {filterOptions.categories.map((cat: string) => (
                        <label key={cat} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={localFilters.category === cat}
                            onChange={() => setLocalFilters({ ...localFilters, category: cat })}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplier Filter */}
                {filterOptions.suppliers && Array.isArray(filterOptions.suppliers) && filterOptions.suppliers.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Supplier</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filterOptions.suppliers.map((sup: string) => (
                        <label key={sup} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="supplier"
                            value={sup}
                            checked={localFilters.supplier === sup}
                            onChange={() => setLocalFilters({ ...localFilters, supplier: sup })}  
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                          />
                            <span className="ml-2 text-sm text-gray-700">{sup}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range Filter */}
                {filterOptions.priceRange && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={localFilters.minPrice}
                        onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={localFilters.maxPrice}
                        onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500">
                        Range: ${filterOptions.priceRange.min} - ${filterOptions.priceRange.max}
                      </p>
                    </div>
                  </div>
                )}

                {/* Color Filter */}
                {filterOptions.colors && filterOptions.colors.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setLocalFilters({
                            ...localFilters,
                            color: localFilters.color === c ? '' : c
                          })}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${localFilters.color === c
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                            }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Filter */}
                {filterOptions.sizes && filterOptions.sizes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setLocalFilters({
                            ...localFilters,
                            size: localFilters.size === s ? '' : s
                          })}
                          className={`w-12 h-12 rounded-lg text-sm font-medium border transition-colors ${localFilters.size === s
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply Filters Button */}
                <div className="space-y-2">
                  <button
                    onClick={applyFilters}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
                    >
                      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                        <img
                          src={product.img_url || 'https://via.placeholder.com/400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.stock < 10 && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h3>
                        {product.categoryId && (
                          <p className="text-xs text-gray-500 mb-2 capitalize">
                            {typeof product.categoryId === 'object' ? product.categoryId.name : product.categoryId}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-orange-600">
                            {product.price} VND
                          </p>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="text-sm text-gray-600">4.5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(parseInt(page) - 1)}
                      disabled={parseInt(page) === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-4 py-2 rounded-lg ${parseInt(page) === pageNum
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
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;