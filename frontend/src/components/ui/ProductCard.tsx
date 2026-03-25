// frontend/src/components/products/ProductCard.tsx

import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/types';
import { Button } from './button';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorite } from '../../context/useFavorite';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const { favorites, addFavorite, removeFavorite } = useFavorite();
  const isFavorite = favorites.includes(product._id);
 
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language, {
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

  const handleToggleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFavorite) {
      removeFavorite(product._id);
    } else {
      addFavorite(product._id);
    }
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
            {t('products.outOfStock')}
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 text-xs font-medium rounded">
            {t('products.lowStock')}
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
            <p className="text-xs text-gray-600">{t('products.stock')}: {product.stock}</p>
            <p className="text-lg font-bold text-orange-500">{formatPrice(product.price)}</p>
          </div>
          <div className="flex items-center gap-2"> 
            <Button
              type="button"
              onClick={handleToggleFavorite}
              className="rounded-full"
              variant="ghost"
              size="icon"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              />
            </Button>
          </div>
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