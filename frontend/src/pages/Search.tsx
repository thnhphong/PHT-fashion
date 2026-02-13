import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import { useDebounce } from '../hooks/useDebounce';
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

  // Local state for inputs that need debouncing
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  // Debounced values (500ms delay)
  const debouncedMinPrice = useDebounce(localMinPrice, 500);
  const debouncedMaxPrice = useDebounce(localMaxPrice, 500);

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{
    categories: { _id: string; name: string; isSelected: boolean }[];
    suppliers: string[];
    colors: string[];
    sizes: string[];
    priceRange: { min: number; max: number };
  } | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync local price state with URL params
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Update URL when debounced prices change
  useEffect(() => {
    if (debouncedMinPrice !== minPrice || debouncedMaxPrice !== maxPrice) {
      const params = new URLSearchParams(searchParams);

      if (debouncedMinPrice) {
        params.set('minPrice', debouncedMinPrice);
      } else {
        params.delete('minPrice');
      }

      if (debouncedMaxPrice) {
        params.set('maxPrice', debouncedMaxPrice);
      } else {
        params.delete('maxPrice');
      }

      params.set('page', '1');
      setSearchParams(params);
    }
  }, [debouncedMinPrice, debouncedMaxPrice]);

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
        if (supplier) params.append('supplier', supplier);
        if (color) params.append('color', color);
        if (size) params.append('size', size);

        const response = await axios.get(`${apiUrl('/search/filters')}?${params.toString()}`);

        if (response.data.success) {
          setFilterOptions(response.data.data);
        }
      } catch (error) {
        console.error('Filter options error:', error);
      }
    };

    fetchFilterOptions();
  }, [query, category, supplier, color, size]);

  // Auto-update URL when filters change (instant for non-text inputs)
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filters change
    params.set('page', '1');

    setSearchParams(params);
  };

  // Clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams();
    // Query is not preserved, effectively clearing it
    params.set('sort', 'relevance');
    params.set('page', '1');
    setSearchParams(params);
    // Clear local price state
    setLocalMinPrice('');
    setLocalMaxPrice('');
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filters count
  const activeFiltersCount = [query, category, supplier, color, size, minPrice, maxPrice].filter(Boolean).length;

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
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              {filterOptions?.categories && filterOptions.categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                  <div className="space-y-2">
                    {filterOptions.categories.map((cat: any) => (
                      <label key={cat._id} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          checked={cat.isSelected}
                          onChange={() => updateFilter('category', cat.isSelected ? '' : cat.name)}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <span className={`ml-2 text-sm group-hover:text-gray-900 ${cat.isSelected ? 'font-medium text-orange-600' : 'text-gray-700'}`}>
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplier Filter */}
              {filterOptions?.suppliers && filterOptions.suppliers.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Supplier</h4>
                  <div className="space-y-2">
                    {filterOptions.suppliers.map((sup) => (
                      <label key={sup} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="supplier"
                          checked={supplier === sup}
                          onChange={() => updateFilter('supplier', supplier === sup ? '' : sup)}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                          {sup}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range Filter - WITH DEBOUNCE */}
              {filterOptions?.priceRange && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">Min Price</label>
                      <input
                        type="number"
                        value={localMinPrice}
                        onChange={(e) => setLocalMinPrice(e.target.value)}
                        min={filterOptions.priceRange.min}
                        max={filterOptions.priceRange.max}
                        placeholder={`Min ${filterOptions.priceRange.min}`}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                      />
                      {localMinPrice !== debouncedMinPrice && (
                        <p className="text-xs text-gray-400 mt-1">
                          <svg className="inline w-3 h-3 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {' '}Filtering...
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Max Price</label>
                      <input
                        type="number"
                        value={localMaxPrice}
                        onChange={(e) => setLocalMaxPrice(e.target.value)}
                        min={filterOptions.priceRange.min}
                        max={filterOptions.priceRange.max}
                        placeholder={`Max ${filterOptions.priceRange.max}`}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                      />
                      {localMaxPrice !== debouncedMaxPrice && (
                        <p className="text-xs text-gray-400 mt-1">
                          <svg className="inline w-3 h-3 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {' '}Filtering...
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Range: {filterOptions.priceRange.min} - {filterOptions.priceRange.max} VND
                    </p>
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {filterOptions?.colors && filterOptions.colors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateFilter('color', color === c ? '' : c)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${color === c
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
              {filterOptions?.sizes && filterOptions.sizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Size</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateFilter('size', size === s ? '' : s)}
                        className={`w-12 h-12 rounded-lg text-sm font-medium border transition-colors ${size === s
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
            </div>
          </div>

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
                        {product.stock !== undefined && product.stock < 10 && (
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