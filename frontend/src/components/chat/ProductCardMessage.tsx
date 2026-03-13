import { ShoppingCart, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { apiUrl } from '../../utils/api';
import type { ProductCardData } from '../../context/ChatContext';

//import isAdmin from ChatContext 
import { useChat } from '../../context/ChatContext';


interface ProductCardMessageProps {
  product: ProductCardData;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export default function ProductCardMessage({ product }: ProductCardMessageProps) {

  const { addToCart, setShowCartPopup } = useCart();
  const { isAdmin } = useChat(); 
  const handleAddToCart = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login?from=chat';
        return;
      }
      const res = await axios.get(apiUrl(`products/${product.productId}`));
      const p = res.data;
      const size = p.sizes?.[0]?.size ?? 'ONE_SIZE';
      addToCart(p, size, 1);
      setShowCartPopup(true);
    } catch (e) {
      console.error('Add to cart error:', e);
    }
  };

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
        <button
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
        >
          <ShoppingCart size={16} />
          Add to cart
        </button>
        )}
        {!isAdmin && (  
        <Link
          to={`/product/${product.slug || product.productId}?buyNow=true`}
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
