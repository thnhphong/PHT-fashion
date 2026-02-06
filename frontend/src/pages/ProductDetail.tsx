import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { apiUrl } from '../utils/api';
import Navbar from '../components/layout/Navbar';

interface IProductSize {
  size: string;
  stock: number;
}

interface ICategory {
  _id: string;
  name: string;
}

interface ISupplier {
  _id: string;
  name: string;
  description: string;
}

interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: ICategory;
  supplierId: ISupplier;
  stock: number;
  img_url: string;
  thumbnail_img_1?: string;
  thumbnail_img_2?: string;
  thumbnail_img_3?: string;
  thumbnail_img_4?: string;
  sizes: IProductSize[];
  created_at: Date;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<IProduct>(`${apiUrl(`products/${productId}`)}`);
      setProduct(response.data);
      setActiveImage(response.data.img_url);

      // Auto-select first available size
      const availableSize = response.data.sizes.find(s => s.stock > 0);
      if (availableSize) {
        setSelectedSize(availableSize.size);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Unable to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProductImages = () => {
    if (!product) return [];
    const images = [product.img_url];
    if (product.thumbnail_img_1) images.push(product.thumbnail_img_1);
    if (product.thumbnail_img_2) images.push(product.thumbnail_img_2);
    if (product.thumbnail_img_3) images.push(product.thumbnail_img_3);
    if (product.thumbnail_img_4) images.push(product.thumbnail_img_4);
    return images;
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', { product, selectedSize, quantity });
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }
    // TODO: Implement buy now functionality
    console.log('Buy now:', { product, selectedSize, quantity });
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-range-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <svg className="w-24 h-24 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalStock = product.sizes.reduce((sum, size) => sum + size.stock, 0);
  const productImages = getProductImages();
  const selectedSizeStock = product.sizes.find(s => s.size === selectedSize)?.stock || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-orange-500">Products</Link>
          <span>/</span>
          {product.categoryId && (
            <>
              <Link to={`/products?category=${product.categoryId._id}`} className="hover:text-orange-500">
                {product.categoryId.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] bg-white rounded-2xl shadow-md overflow-hidden">
              {/* Supplier Info */}
              {product.supplierId && (
                <div className="px-4 py-2 w-fit bg-orange-500 rounded-full text-left mt-4 ml-4">
                  <p className="font-semibold text-white">{product.supplierId.name}</p>
                  {product.supplierId.description && (
                    <p className="text-sm text-gray-600 mt-1">{product.supplierId.description}</p>
                  )}
                </div>
              )}
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/600x600?text=No+Image';
                }}
              />
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Product view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/150x150?text=No+Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Category & Brand */}
            <div className="flex items-center gap-3 justify-center">
              {product.categoryId && (
                <Link
                  to={`/products?category=${product.categoryId._id}`}
                  className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                  {product.categoryId.name}
                </Link>
              )}
              {totalStock === 0 && (
                <span className="px-4 py-1.5 bg-red-100 text-red-600 rounded-full text-sm font-semibold">
                  Out of Stock
                </span>
              )}
              {totalStock > 0 && totalStock < 10 && (
                <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
                  Only {totalStock} Left
                </span>
              )}
            </div>

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            {/* <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">(4.5) · 128 reviews</span>
            </div> */}

            {/* Price */}
            <div className="flex items-baseline gap-3 justify-center">
              <span className="text-4xl font-bold text-orange-500">{product.price.toLocaleString()} VND</span>
              {/* You can add discount price here if applicable */}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 text-left">Description</h3>
              <p className="text-gray-600 leading-relaxed text-left">{product.description}</p>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 text-left">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sizeItem) => {
                  const isAvailable = sizeItem.stock > 0;
                  const isSelected = selectedSize === sizeItem.size;

                  return (
                    <button
                      key={sizeItem.size}
                      onClick={() => isAvailable && setSelectedSize(sizeItem.size)}
                      disabled={!isAvailable}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : isAvailable
                            ? 'border-gray-300 bg-white text-gray-900 hover:border-orange-300'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                        }`}
                    >
                      {sizeItem.size}
                      {isAvailable && (
                        <span className="ml-2 text-xs">({sizeItem.stock})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            {totalStock > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 text-left">Quantity</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-orange-300 transition-colors"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedSizeStock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(selectedSizeStock, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 h-10 text-center border-2 border-gray-300 rounded-lg font-semibold"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(selectedSizeStock, quantity + 1))}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-orange-300 transition-colors"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    {selectedSizeStock} available
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={totalStock === 0 || !selectedSize}
                className="flex-1 py-2 bg-white border-2 border-orange-500 text-orange-500 rounded-full font-semibold hover:bg-orange-50 transition-colors disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={totalStock === 0 || !selectedSize}
                className="flex-1 py-4 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Quality</p>
                  <p className="text-sm text-gray-600">Premium materials</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Secure</p>
                  <p className="text-sm text-gray-600">Safe payment</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Returns</p>
                  <p className="text-sm text-gray-600">30-day policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;