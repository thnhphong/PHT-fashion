import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart, type CartItem } from '../context/CartContext';
import { apiUrl } from '../utils/api';
import { refreshAccessToken } from '../utils/auth';
import { formatSizeLabel } from '../utils/sizeUtils';
import { ChevronDown, MapPin, Truck, CreditCard, Tag, ShieldCheck } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', detail: '5–7 days', price: 0 },
  { id: 'express', label: 'Express Shipping', detail: '2–3 days', price: 30000 },
  { id: 'next_day', label: 'Next Day Delivery', detail: '1 day', price: 50000 },
];

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', label: 'Cash on Delivery' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'vnpay', label: 'VNPay' },
];

const BASE_PROVINCE_API = 'https://provinces.open-api.vn/api/?depth=1';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// ─── Component ────────────────────────────────────────────────────────────────

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, removeFromCart, clearCart } = useCart();

  const locationState = location.state as { selectedItems?: CartItem[] } | null;
  const itemsForCheckout: CartItem[] =
    locationState?.selectedItems?.length ? locationState.selectedItems : cart;

  // Guard — redirect if not logged in
  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: '/checkout', ...location.state } });
    }
  }, [navigate, location.state]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    email: localStorage.getItem('userName') ?? '',
    name: '',
    phone: '',
    street: '',
    apartment: '',
    zip: '',
    country: 'Vietnam',
  });
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState<{ name: string; code: number }[]>([]);
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].id);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [note, setNote] = useState('');

  // ── Submission state ────────────────────────────────────────────────────────
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  // Ref to prevent double submission
  const isSubmittingRef = useRef(false);

  // ── Fetch cities ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(BASE_PROVINCE_API)
      .then((r) => r.json())
      .then(setCities)
      .catch(console.error);

    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'payment_cancelled') setOrderError('Payment was cancelled.');
    if (params.get('error') === 'payment_failed') setOrderError('Payment failed or was not approved.');
  }, []);

  // ── Totals ──────────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => itemsForCheckout.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [itemsForCheckout]
  );
  const shippingPrice = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.price ?? 0;
  const discountAmount = useMemo(
    () => Math.round(subtotal * (couponDiscount / 100)),
    [subtotal, couponDiscount]
  );
  const grandTotal = subtotal + shippingPrice - discountAmount;

  // ── Coupon ──────────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch(apiUrl(`/coupons/${couponCode.trim().toUpperCase()}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Invalid coupon');
      const coupon = data.coupon;
      if (new Date(coupon.expiration_date) < new Date()) throw new Error('Coupon expired');
      setCouponDiscount(coupon.discount);
      setCouponApplied(true);
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // ── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    // Prevent double-click / multiple calls
    if (isSubmittingRef.current || placingOrder) return;

    // Validate required fields
    if (!form.name || !form.phone || !form.street || !selectedCity) {
      setOrderError('Please fill in all required shipping fields.');
      return;
    }
    if (!itemsForCheckout.length) {
      setOrderError('Your cart is empty.');
      return;
    }

    let bearerToken = localStorage.getItem('accessToken');
    if (!bearerToken) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    isSubmittingRef.current = true;
    setPlacingOrder(true);
    setOrderError('');

    const payload = {
      items: itemsForCheckout.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        productSize: item.selectedSize,
      })),
      shippingAddress: {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        street: form.street,
        apartment: form.apartment,
        city: selectedCity,
        state: selectedCity,
        zipCode: form.zip || '000000',
        country: form.country,
      },
      shippingMethod,
      paymentMethod,
      couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
    };

    const attemptRequest = (token: string) =>
      fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

    try {
      let response = await attemptRequest(bearerToken);

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          navigate('/login', { state: { from: '/checkout' } });
          return;
        }
        bearerToken = refreshed;
        response = await attemptRequest(bearerToken);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message ?? 'Unable to place order');
      }

      const responseData = await response.json();
      const draftId = responseData?.draftId;
      if (!draftId) throw new Error('Unable to create draft order');

      const cancelDraft = () =>
        fetch(apiUrl(`/orders/drafts/${draftId}/cancel`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearerToken}` },
        }).catch(() => null);

      // PayPal flow
      if (paymentMethod === 'paypal') {
        const ppRes = await fetch(apiUrl(`/payments/paypal/create-order/${draftId}`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        if (!ppRes.ok) { await cancelDraft(); throw new Error('Failed to communicate with PayPal'); }
        const ppData = await ppRes.json();
        if (ppData.approval_url) { window.location.href = ppData.approval_url; return; }
        await cancelDraft();
        throw new Error('PayPal approval URL missing');
      }
      // VNPay flow
      if (paymentMethod === 'vnpay'){
        const vnpayRes = await fetch(apiUrl(`/payments/vnpay/create-order/${draftId}`), {
          method: 'POST',
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        if (!vnpayRes.ok) { await cancelDraft(); throw new Error('Failed to communicate with VNPay'); }
        const vnpayData = await vnpayRes.json();
        if (vnpayData.payment_url) { window.location.href = vnpayData.payment_url; return; }
        await cancelDraft();
        throw new Error('VNPay payment URL missing');
      }

      // Standard flow — finalize
      const finalizeRes = await fetch(apiUrl(`/orders/drafts/${draftId}/finalize`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearerToken}` },
      });
      if (!finalizeRes.ok) {
        const errData = await finalizeRes.json().catch(() => null);
        await cancelDraft();
        throw new Error(errData?.message ?? 'Unable to finalize order');
      }

      const finalData = await finalizeRes.json();
      const orderId = finalData?.order?._id;

      // ✅ Clear cart BEFORE navigation
      itemsForCheckout.forEach((item) => removeFromCart(item._id, item.selectedSize));
      clearCart();

      navigate(`/checkout/success${orderId ? `?orderId=${orderId}` : ''}`, { replace: true });
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unable to place order');
      isSubmittingRef.current = false;
      setPlacingOrder(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (!localStorage.getItem('accessToken')) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-orange-200">
          <Link to="/" className="font-bold text-2xl text-orange-500 tracking-tight">PHT</Link>
          <span className="text-gray-300 text-xl">|</span>
          <span className="text-gray-600 text-lg font-medium">Checkout</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* 1. Shipping Address */}
            <section className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-orange-500" size={18} />
                <h2 className="text-base font-semibold text-orange-500">Shipping Address</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nguyen Van A"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Phone *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0912 345 678"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    type="email"
                    placeholder="you@email.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">City / Province *</label>
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white pr-8"
                    >
                      <option value="">Choose city</option>
                      {cities.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Street Address *</label>
                  <input
                    value={form.street}
                    onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                    placeholder="123 Le Duc Tho, Ward 6"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Apartment / Suite</label>
                  <input
                    value={form.apartment}
                    onChange={(e) => setForm((p) => ({ ...p, apartment: e.target.value }))}
                    placeholder="Apt 4B (optional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Country</label>
                  <input
                    value={form.country}
                    onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            </section>

            {/* 2. Products */}
            <section className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-800">
                  Products <span className="text-gray-400 font-normal text-sm">({itemsForCheckout.length})</span>
                </h2>
                <div className="grid grid-cols-3 gap-8 text-xs text-gray-400 uppercase tracking-wide pr-2 hidden sm:grid">
                  <span className="text-right">Unit Price</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Subtotal</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {itemsForCheckout.map((item) => (
                  <div key={`${item._id}-${item.selectedSize}`} className="flex gap-3 py-3 items-start sm:items-center">
                    <img src={item.img_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Size: {formatSizeLabel(item.selectedSize)}</p>
                      {/* Mobile price */}
                      <p className="text-sm font-semibold text-orange-500 mt-1 sm:hidden">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    {/* Desktop price columns */}
                    <div className="hidden sm:grid grid-cols-3 gap-8 text-sm items-center flex-shrink-0">
                      <p className="text-right text-gray-500">{formatPrice(item.price)}</p>
                      <p className="text-center text-gray-700 font-medium">{item.quantity}</p>
                      <p className="text-right text-orange-500 font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-gray-400 whitespace-nowrap">Note to seller:</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Leave a note (optional)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                />
              </div>

              {/* Shipping method */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Truck size={15} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Shipping method</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SHIPPING_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${shippingMethod === m.id
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={m.id}
                        checked={shippingMethod === m.id}
                        onChange={() => setShippingMethod(m.id)}
                        className="accent-orange-500 w-3.5 h-3.5"
                      />
                      <span>
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs ml-1.5 text-gray-400">{m.detail}</span>
                        <span className="text-xs ml-1.5 font-semibold">
                          {m.price === 0 ? 'Free' : formatPrice(m.price)}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Subtotal row */}
              <div className="mt-3 flex justify-end text-sm text-gray-500">
                Order total:&nbsp;
                <span className="font-semibold text-orange-500 ml-1">{formatPrice(subtotal + shippingPrice)}</span>
              </div>
            </section>

            {/* 3. Voucher */}
            <section className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={15} className="text-orange-500" />
                <h2 className="text-sm font-semibold text-gray-800">PHT Voucher</h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); setCouponApplied(false); setCouponError(''); setCouponDiscount(0); }}
                  placeholder="Enter coupon code"
                  disabled={couponApplied}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 disabled:bg-gray-50"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || couponApplied || !couponCode.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-orange-500 border border-orange-400 hover:bg-orange-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {couponLoading ? '...' : couponApplied ? '✓ Applied' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-1.5">{couponError}</p>}
              {couponApplied && <p className="text-xs text-green-600 mt-1.5">Coupon applied — {couponDiscount}% off!</p>}
            </section>

            {/* 4. Payment */}
            <section className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={15} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-800">Payment Method</h2>
                <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> Pay on delivery
                </span>
              </div>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === m.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.id}
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)}
                      className="accent-orange-500"
                    />
                    <span className={`text-sm font-medium ${paymentMethod === m.id ? 'text-orange-700' : 'text-gray-700'}`}>
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>

          </div>

          {/* ── RIGHT COLUMN — Order Summary ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-4">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Order Summary</h2>

              {/* Item thumbnails */}
              <div className="space-y-2.5 mb-4 max-h-48 overflow-y-auto">
                {itemsForCheckout.map((item) => (
                  <div key={`${item._id}-${item.selectedSize}`} className="flex gap-2.5 items-center">
                    <div className="relative flex-shrink-0">
                      <img src={item.img_url} alt={item.name} className="w-12 h-12 rounded-md object-cover border border-gray-100" />
                      <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 line-clamp-2 font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400">Size: {formatSizeLabel(item.selectedSize)}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-800 flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span>{shippingPrice === 0 ? <span className="text-green-600 font-medium">Free</span> : formatPrice(shippingPrice)}</span>
                </div>
                {couponApplied && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponDiscount}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-orange-500">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Error */}
              {orderError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{orderError}</p>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm text-white transition-all ${placingOrder
                    ? 'bg-orange-300 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'
                  }`}
              >
                {placingOrder ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-2">
                By placing your order, you agree to our{' '}
                <a href="#" className="underline">Terms & Conditions</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}