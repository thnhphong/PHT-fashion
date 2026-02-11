import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    getTotalItems,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart ({getTotalItems()})</h1>
          <button
            onClick={() => {
              if (window.confirm('Clear entire cart?')) clearCart();
            }}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1.5"
          >
            <Trash2 size={16} /> Clear Cart
          </button>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-10">
          {cart.map((item) => (
            <div
              key={`${item._id}-${item.selectedSize}`}
              className="flex flex-col sm:flex-row gap-6 p-6 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              {/* Image */}
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border">
                <img
                  src={item.img_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                  {item.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Size: <span className="font-medium">{item.selectedSize}</span></p>
                  {item.supplier && <p>Supplier: {item.supplier}</p>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-6">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity - 1)}
                      className="p-2.5 hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="px-6 py-2 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.selectedSize, item.quantity + 1)}
                      className="p-2.5 hover:bg-gray-100 disabled:opacity-50"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="text-xl font-bold text-orange-600">
                    {(item.price * item.quantity).toLocaleString()} VND
                  </div>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFromCart(item._id, item.selectedSize)}
                className="self-start text-gray-400 hover:text-red-600 p-2"
                title="Remove item"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal ({getTotalItems()} items)</span>
              <span>{getCartTotal().toLocaleString()} VND</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span className="text-green-600">Calculated at checkout</span>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-600">{getCartTotal().toLocaleString()} VND</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="py-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Continue Shopping
            </button>
            <Link
              to="/checkout"
              className="py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}