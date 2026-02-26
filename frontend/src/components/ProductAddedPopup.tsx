import { CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductAddedPopup() {
  const location = useLocation();
  const { productAddedPopupVisible, dismissProductAddedPopup } = useCart();
  const isProductDetail = location.pathname.startsWith('/product/');

  useEffect(() => {
    if (!productAddedPopupVisible) return;

    const handleClick = () => {
      dismissProductAddedPopup();
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [productAddedPopupVisible, dismissProductAddedPopup]);

  if (!productAddedPopupVisible || !isProductDetail) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center px-4 pb-8">
      <div
        className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-3xl bg-white/95 px-6 py-4 shadow-xl shadow-black/20"
        onClick={(event) => event.stopPropagation()}
      >
        <CheckCircle className="h-8 w-8 text-emerald-500" />
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">✓</p>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-800">
            Product has been added to cart!
          </p>
        </div>
      </div>
    </div>
  );
}
