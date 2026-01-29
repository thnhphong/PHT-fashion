import { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import { Link } from 'react-router-dom';

interface IProductSize {
  size: string;
  stock: number;
}

interface ICategory {
  _id: string;
  name: string;
}

interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: ICategory;
  supplierId: string;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: IProductSize[];
  created_at: Date;
}

const OurProducts = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${apiUrl('products')}`),
        axios.get(`${apiUrl('categories')}`),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(product => product.categoryId?.name === activeCategory);

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get all thumbnails for a product
  const getProductImages = (product: IProduct) => {
    const images = [product.img_url];
    if (product.thumbnail_img_1) images.push(product.thumbnail_img_1);
    if (product.thumbnail_img_2) images.push(product.thumbnail_img_2);
    if (product.thumbnail_img_3) images.push(product.thumbnail_img_3);
    if (product.thumbnail_img_4) images.push(product.thumbnail_img_4);
    return images;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our handcrafted selection of pastries, cakes, and breads made fresh daily with the finest ingredients.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        <button
          onClick={() => handleCategoryChange('All')}
          className={`px-6 py-2 rounded-full font-medium transition-all ${
            activeCategory === 'All'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => handleCategoryChange(category.name)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeCategory === category.name
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-pink-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {currentProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No products found in this category.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {currentProducts.map((product) => {
              const productImages = getProductImages(product);
              const totalStock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
              
              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={product.img_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image';
                      }}
                    />
                    
                    {/* Stock Badge */}
                    {totalStock === 0 && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    )}
                    {totalStock > 0 && totalStock < 10 && (
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Low Stock
                      </span>
                    )}

                    {/* Wishlist Icon */}
                    <button 
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-pink-50 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        // Handle wishlist
                      }}
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Image Gallery Thumbnails */}
                    {productImages.length > 1 && (
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        {productImages.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="w-10 h-10 bg-white rounded-md border border-gray-200 overflow-hidden">
                            <img 
                              src={img} 
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-pink-500 transition-colors">
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price and Add to Cart */}
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-pink-500">
                        {product.price}VND
                      </span>
                      <button
                        className="bg-pink-500 text-white rounded-full p-2 hover:bg-pink-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        disabled={totalStock === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle add to cart
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-pink-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* View All Products Button */}
          <div className="text-center mt-12">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-pink-500 text-pink-500 rounded-full font-semibold hover:bg-pink-500 hover:text-white transition-colors"
            >
              View All Products
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </section>
  );
};

export default OurProducts;