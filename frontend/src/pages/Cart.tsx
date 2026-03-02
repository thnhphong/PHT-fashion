import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { formatSizeLabel, shouldShowSizeSelection } from '../utils/sizeUtils';
import SearchInput from '../components/common/SearchInput';
import { useLocation } from 'react-router-dom';



export default function Cart() {
  const {
    cart,
    updateQuantity,
    updateItemSize,
    removeFromCart,
    getTotalItems,
    clearCart,
  } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const fromBuyNow = location.state?.fromBuyNow ?? false;
  const displayedItems = fromBuyNow
    ? cart.filter((item) => {
      return true;
    })
    : cart;
  const lastItem = fromBuyNow && cart.length > 0 ? cart[cart.length - 1] : null;

  const itemsToShow = fromBuyNow && lastItem ? [lastItem] : displayedItems;
  const displayedCount = itemsToShow.length;
  const displayedTotalItems = itemsToShow.reduce((sum, i) => sum + i.quantity, 0);
  const displayedSubtotal = itemsToShow.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    cart.map((item) => `${item._id}-${item.selectedSize}`)
  );

  useEffect(() => {
    setSelectedKeys((prev) => {
      const validKeys = new Set(
        cart.map((item) => `${item._id}-${item.selectedSize}`)
      );
      const next = prev.filter((key) => validKeys.has(key));

      if (next.length === 0 && cart.length > 0) {
        return Array.from(validKeys);
      }

      return next;
    });
  }, [cart]);

  const selectedItems = useMemo(
    () =>
      cart.filter((item) =>
        selectedKeys.includes(`${item._id}-${item.selectedSize}`)
      ),
    [cart, selectedKeys]
  );

  const selectedItemCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [selectedItems]
  );

  const allSelected = cart.length > 0 && selectedKeys.length === cart.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(cart.map((item) => `${item._id}-${item.selectedSize}`));
    }
  };

  const toggleSelectItem = (id: string, size: string) => {
    const key = `${id}-${size}`;
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleRemoveSelected = () => {
    if (!selectedItems.length) return;
    if (!window.confirm('Remove selected items from cart?')) return;
    selectedItems.forEach((item) =>
      removeFromCart(item._id, item.selectedSize)
    );
  };

  const handleProceedToCheckout = () => {
    if (!selectedItems.length) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login', {
        state: { from: '/checkout', selectedItems },
      });
      return;
    }

    navigate('/checkout', { state: { selectedItems } });
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full rounded-3xl border border-slate-200/70 bg-white/80 shadow-lg shadow-slate-200/60 backdrop-blur-xl px-8 py-10 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50">
            <svg
              className="h-10 w-10 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900">
            Your cart is empty
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-slate-600">
            Explore our latest collections and add your favorite pieces to see them
            appear here in a beautiful overview.
          </p>
          <Link
            to="/products"
            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }
  const totalItems = getTotalItems();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-200/60 pt-10 pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.06),_transparent_60%),_radial-gradient(circle_at_bottom,_rgba(249,115,22,0.05),_transparent_55%)]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Cart
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Your bag, curated in bento
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} ready to check out.
            </p>
          </div>

          
        </div>
        <div className="mb-8 flex justify-end items-center gap-4">
          <SearchInput />
          <button
            onClick={() => {
              if (window.confirm('Clear entire cart?')) clearCart();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-100 bg-white/80 px-4 py-2 text-xs font-medium text-red-600 shadow-sm transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <Trash2 size={14} />
            Clear cart
          </button>
        </div>

        <div className="grid auto-rows-min gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          {/* Left column - items + perks (bento style) */}
          <div className="space-y-6">
            {/* Items card */}
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-200/70 backdrop-blur-xl sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                    Cart items
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {displayedTotalItems} {displayedTotalItems === 1 ? 'item' : 'items'} ready to check out.
                  </span>
                </div>
              </div>

              <div className="hidden items-center justify-between border-y border-slate-100 py-3 text-xs font-medium text-slate-500 sm:grid sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-orange-500 w-4 h-4 cursor-pointer"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-left">Product</span>
                </div>
                <span className="text-center">Quantity</span>
                <span className="text-right">Total</span>
                <span className="text-right">Action</span> 
              </div>

              <div className="divide-y divide-slate-100">
                {itemsToShow.map((item) => {
                  const itemKey = `${item._id}-${item.selectedSize}`;
                  const isSelected = selectedKeys.includes(itemKey);
                  return (
                  <div
                    key={itemKey}
                    className="group grid gap-4 py-4 sm:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-6"
                  >
                    {/* Product info */}
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        className="accent-orange-500 w-4 h-4 mt-7 cursor-pointer"
                        checked={isSelected}
                        onChange={() =>
                          toggleSelectItem(item._id, item.selectedSize)
                        }
                      />
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100/80">
                        <img
                          src={item.img_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>Size</span>
                            {Array.isArray(item.sizes) && item.sizes.length > 0 && shouldShowSizeSelection(item.categoryName, item.sizes) ? (
                              <select
                                value={item.selectedSize}
                                onChange={(event) =>
                                  updateItemSize(
                                    item._id,
                                    item.selectedSize,
                                    event.target.value
                                  )
                                }
                                className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                {item.sizes.map((size) => (
                                  <option
                                    key={size.size}
                                    value={size.size}
                                    disabled={size.stock <= 0}
                                  >
                                    {formatSizeLabel(size.size)}
                                    {size.stock > 0
                                      ? ` (${size.stock})`
                                      : ' - Out of stock'}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="font-medium text-slate-700">
                                {formatSizeLabel(item.selectedSize)}
                              </span>
                          )}
                          {item.supplier && (
                            <>
                              <span>·</span>
                              <span className="text-slate-500">
                                {item.supplier}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="mt-3 flex items-center justify-start sm:mt-0 sm:justify-center">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 text-xs shadow-sm">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.selectedSize,
                              item.quantity - 1,
                            )
                          }
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-l-full text-slate-600 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            if (Number.isNaN(value)) return;
                            const nextQuantity = Math.max(
                              1,
                              Math.min(item.stock, value)
                            );
                            updateQuantity(
                              item._id,
                              item.selectedSize,
                              nextQuantity
                            );
                          }}
                          className="h-8 w-12 border-x border-slate-200 bg-transparent text-center text-sm font-medium text-slate-900 focus:outline-none focus-visible:ring-0"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(
                              item._id,
                              item.selectedSize,
                              item.quantity + 1,
                            )
                          }
                          disabled={item.quantity >= item.stock}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-full text-slate-600 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="mt-1 flex items-center justify-between sm:mt-0 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-600">
                          {(item.price * item.quantity).toLocaleString()} VND
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.price.toLocaleString()} VND / item
                        </p>
                      </div>
                    </div>
                      <button
                      onClick={() => removeFromCart(item._id, item.selectedSize)}
                      className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-400 transition-colors duration-200 hover:text-red-500 justify-end"
                      title="Remove item"
                    >
                      Remove
                    </button> 
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Perks / voucher card */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm shadow-slate-200/70 backdrop-blur-xl">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Delivery
                </p>
                <h3 className="text-sm font-semibold text-slate-900">
                  Free shipping unlocks at checkout
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Shipping fees are calculated based on your address and applied in
                  the next step.
                </p>
              </div>

              <div className="rounded-3xl border border-dashed border-orange-200 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/80 p-4 shadow-sm shadow-orange-100/70 backdrop-blur-xl">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                  Voucher
                </p>
                <h3 className="text-sm font-semibold text-slate-900">
                  Apply coupons at checkout
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  You can enter promo codes and view available shop vouchers in
                  the payment step.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom price bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="accent-orange-500 h-4 w-4"
                checked={allSelected}
                onChange={toggleSelectAll}
              />
              <span>
                Select all ({cart.length}{' '}
                {cart.length === 1 ? 'item' : 'items'})
              </span>
            </label>
            <button
              type="button"
              onClick={handleRemoveSelected}
              className="text-red-500 hover:text-red-600 font-medium"
            >
              Remove selected
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hidden text-slate-500 hover:text-slate-700 sm:inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              Continue shopping
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Total ({displayedTotalItems} {displayedTotalItems === 1 ? 'item' : 'items'})
              </p>
              <p className="text-lg font-semibold text-orange-600 sm:text-xl">
                {displayedSubtotal.toLocaleString()} VND
              </p>
            </div>
            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={!selectedItems.length}
              className="inline-flex min-w-[160px] cursor-pointer items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition-colors duration-200 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}