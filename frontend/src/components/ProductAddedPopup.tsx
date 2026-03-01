import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductAddedPopup() {
  const { showCartPopup, setShowCartPopup } = useCart();

  if (!showCartPopup) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setShowCartPopup(false)}
      />
      <div className="pointer-events-auto relative flex items-center gap-3 rounded-2xl bg-white/95 px-6 py-4 shadow-xl shadow-black/20">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-800">
          Product has been added to cart!
        </p>
        <button
          onClick={() => setShowCartPopup(false)}
          className="ml-4 rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}
