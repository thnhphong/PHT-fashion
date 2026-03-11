import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductCardData } from '../../context/ChatContext';

interface ProductContextBannerProps {
  product: ProductCardData;
  onDismiss: () => void;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ProductContextBanner({ product, onDismiss }: ProductContextBannerProps) {
  return (
    <div className="bg-orange-50 border-b border-orange-100 p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <img
          src={product.img_url}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200"
          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/48')}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-600">Bạn đang trao đổi với Admin về sản phẩm này</p>
          <p className="font-medium text-gray-900 truncate">{product.name}</p>
          <p className="text-sm text-orange-600 font-semibold">{formatPrice(product.price)}</p>
        </div>
      </div>
      <Link
        to={`/product/${product.slug || product.productId}`}
        className="text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
      >
        Thay đổi
      </Link>
      <button
        onClick={onDismiss}
        className="p-1 text-gray-500 hover:text-gray-700"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
}
