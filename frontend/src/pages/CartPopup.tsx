// src/components/cart/CartPopup.tsx
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { X, Plus, Minus } from 'lucide-react';

export default function CartPopup() {
  const {
    cart,
    showCartPopup,
    setShowCartPopup,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getTotalItems,
  } = useCart();

  if (!showCartPopup || cart.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-opacity-40 z-40"
        onClick={() => setShowCartPopup(false)}
      />

      {/* Popup */}
      <div className="fixed right-4 bottom-4 sm:right-8 sm:bottom-8 w-[80%] max-w-sm sm:max-w-md bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200 backdrop-blur-sm">
        <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
          <h3 className="font-semibold text-lg text-gray-900">
            Cart ({getTotalItems()})
          </h3>
          <button
            onClick={() => setShowCartPopup(false)}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {cart.map((item) => (
            <div key={`${item._id}-${item.selectedSize}`} className="flex gap-4">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border">
                <img
                  src={item.img_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/80')}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  Size: {item.selectedSize} · {item.price.toLocaleString()} VND
                </p>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-100"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-100"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id, item.selectedSize)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-orange-600">
              {getCartTotal().toLocaleString()} VND
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/cart"
              onClick={() => setShowCartPopup(false)}
              className="py-2 px-4 border border-orange-500 text-orange-600 rounded-lg font-medium text-center hover:bg-orange-50 transition-colors"
            >
              View Cart
            </Link>
            <Link
              to="/checkout"
              className="py-2 px-4 bg-orange-500 text-white rounded-lg font-semibold text-center hover:bg-orange-600 transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}