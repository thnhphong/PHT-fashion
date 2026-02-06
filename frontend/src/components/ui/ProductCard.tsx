// frontend/src/components/products/ProductCard.tsx
import { Link } from 'react-router-dom';
import type { Product } from '../../types/types';
import { Button } from './button';
import { Plus, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getCategoryName = () => {
    if (typeof product.categoryId === 'string') {
      return 'Category';
    }
    return product.categoryId.name;
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <img
          src={product.img_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge */}
        {product.stock === 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded">
            Sold Out
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {getCategoryName()}
        </p>

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 h-10">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex gap-4 items-center justify-between">
          <div className="flex flex-col text-left">
            <p className="text-xs text-gray-600">
              Stock: {product.stock}
            </p>
            <p className="text-lg font-bold text-orange-500">
              {formatPrice(product.price)}
            </p>
          </div>
          {/* add to cart, */}
          <Button className="rounded-full" variant="outline" size="icon">
            <Plus className="h-5 w-5 text-orange-500 hover:text-orange-600" />
          </Button>
        </div>

        {/* Sizes */}
        {/* {product.sizes && product.sizes.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {product.sizes.slice(0, 5).map((size, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs border border-gray-300 rounded"
              >
                {size.size}
              </span>
            ))}
          </div>
        )} */}

        
      </div>
    </Link>
  );
};

export default ProductCard;