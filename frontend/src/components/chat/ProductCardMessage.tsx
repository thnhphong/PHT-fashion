import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProductCardData } from '../../context/ChatContext';

//import isAdmin from ChatContext 
import { useChat } from '../../context/ChatContext';

interface ProductCardMessageProps {
  product: ProductCardData;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ProductCardMessage({ product }: ProductCardMessageProps) {
  const { isAdmin } = useChat();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 max-w-[280px]">
      <div className="flex gap-3">
        <img
          src={product.img_url}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/64')}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 line-clamp-2">{product.name}</p>
          <p className="text-orange-600 font-semibold mt-0.5">{formatPrice(product.price)}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {!isAdmin && (
          <Link
            to={`/product/${product.slug || product.productId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-orange-500 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50"
          >
            <Zap size={16} />
            Buy now
          </Link>
        )}
      </div>
    </div>
  );
}
