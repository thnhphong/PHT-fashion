import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/api';
import { refreshAccessToken } from '../utils/auth';

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', detail: '5-7 days • Free', price: 0 },
  { id: 'express', label: 'Express Shipping', detail: '2-3 days • 30,000 VND', price: 30000 },
  { id: 'next_day', label: 'Next Day Delivery', detail: '1 day • 50,000 VND', price: 50000 },
];

const PAYMENT_TABS = ['Credit Card', 'PayPal', 'Apple Pay', 'Cash on Delivery'];

const BASE_PROVINCE_API = 'https://provinces.open-api.vn/api/?depth=1';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

const CheckoutStepper = ({ step }: { step: number }) => {
  const data = [
    'Shipping',
    'Shipping Method',
    'Payment',
    'Review Order',
  ];
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 flex gap-4">
      {data.map((label, index) => (
        <div key={label} className="flex-1 text-center">
          <div
            className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
              index + 1 === step
                ? 'border-orange-500 bg-orange-500 text-white'
                : index + 1 < step
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_METHODS[0].id);
  const [paymentTab, setPaymentTab] = useState(PAYMENT_TABS[0]);
  const [cities, setCities] = useState<{ name: string; code: number }[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [form, setForm] = useState({
    email: localStorage.getItem('userName') ?? '',
    name: '',
    phone: '',
    street: '',
    apartment: '',
    city: '',
    province: '',
    zip: '',
    country: 'Vietnam',
    saveAddress: false,
    billingSame: true,
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(BASE_PROVINCE_API);
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Unable to load cities', error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    setForm((prev) => ({ ...prev, city: selectedCity }));
  }, [selectedCity]);

  const subtotal = useMemo(() => getCartTotal(), [getCartTotal]);
  const shippingPrice =
    SHIPPING_METHODS.find((method) => method.id === shippingMethod)?.price ?? 0;
  const grandTotal = subtotal + shippingPrice;

  const handleInput = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handlePlaceOrder = async () => {
    if (!cart.length) {
      setOrderError('Your cart is empty');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const paymentMethodMap: Record<string, string> = {
      'Credit Card': 'credit_card',
      PayPal: 'paypal',
      'Apple Pay': 'apple_pay',
      'Cash on Delivery': 'cash_on_delivery',
    };

    const items = cart.map((item) => ({
      productId: item._id,
      quantity: item.quantity,
      productSize: item.selectedSize,
    }));

    const shippingAddressPayload = {
      fullName: form.name,
      email: form.email,
      phone: form.phone,
      street: form.street,
      apartment: form.apartment,
      city: form.city || selectedCity,
      state: form.province || form.city || selectedCity,
      zipCode: form.zip,
      country: form.country,
    };

    const payload = {
      items,
      shippingAddress: shippingAddressPayload,
      shippingMethod,
      paymentMethod: paymentMethodMap[paymentTab] ?? paymentMethodMap['Credit Card'],
    };

    setOrderError('');
    setOrderSuccess('');
    setPlacingOrder(true);

    const attemptOrderRequest = (bearerToken: string) =>
      fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

    let response = await attemptOrderRequest(token);

    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        setOrderError('Session expired. Please log in again.');
        navigate('/login');
        setPlacingOrder(false);
        return;
      }
      response = await attemptOrderRequest(refreshed);
    }

    try {
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message ?? 'Unable to place order');
      }

      await response.json();
      setOrderSuccess('Order placed successfully. We will email you the confirmation shortly.');
      clearCart();
      setStep(4);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to place order';
      setOrderError(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!localStorage.getItem('accessToken')) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <CheckoutStepper step={step} />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Shipping Information</h2>
                  <Link to="/login" className="text-sm text-orange-500">
                    Already have an account? Login
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Email</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleInput('email', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Full Name</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => handleInput('name', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Phone Number</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => handleInput('phone', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Street Address</span>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(event) => handleInput('street', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Apartment/Suite</span>
                    <input
                      type="text"
                      value={form.apartment}
                      onChange={(event) => handleInput('apartment', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">City / Province</span>
                    <select
                      value={selectedCity}
                      onChange={(event) => setSelectedCity(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none bg-white"
                    >
                      <option value="">Choose city</option>
                      {cities.map((city) => (
                        <option key={city.code} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">ZIP / Postal Code</span>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(event) => handleInput('zip', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase text-gray-500">Country</span>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(event) => handleInput('country', event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                    />
                  </label>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.saveAddress}
                      onChange={(event) => handleInput('saveAddress', event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Save this address for future orders
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.billingSame}
                      onChange={(event) => handleInput('billingSame', event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Billing address same as shipping
                  </label>
                </div>
                <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                  <h2 className="text-lg font-semibold">Shipping Method</h2>
                  <div className="space-y-4">
                    {SHIPPING_METHODS.map((method) => (
                      <label
                        key={`step1-${method.id}`}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition ${
                          shippingMethod === method.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{method.label}</p>
                          <p className="text-sm text-gray-500">{method.detail}</p>
                        </div>
                        <input
                          type="radio"
                          name="shippingMethod"
                          checked={shippingMethod === method.id}
                          onChange={() => setShippingMethod(method.id)}
                          className="h-4 w-4 accent-orange-500"
                        />
                      </label>
                    ))}
                  </div>
                </section>
              </section>
            )}
            {step === 2 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <h2 className="text-xl font-semibold">Shipping Method</h2>
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
                  {(() => {
                    const method = SHIPPING_METHODS.find((item) => item.id === shippingMethod);
                    if (!method) return <p>Shipping method not selected</p>;
                    return (
                      <>
                        <p className="font-semibold">{method.label}</p>
                        <p className="text-sm text-gray-500">{method.detail}</p>
                        <p className="text-sm text-gray-500">
                          Shipping cost: {formatPrice(method.price)}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </section>
            )}
            {step === 3 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6">
                <h2 className="text-xl font-semibold">Payment Method</h2>
                <div className="flex gap-4 text-sm uppercase tracking-[0.4em]">
                  {PAYMENT_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setPaymentTab(tab)}
                      className={`flex-1 rounded-2xl border px-4 py-2 transition ${
                        paymentTab === tab
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {paymentTab === 'Credit Card' && (
                  <div className="space-y-4">
                    <label className="space-y-2">
                      <span className="text-xs uppercase text-gray-500">Card Number</span>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                        placeholder="0000 0000 0000 0000"
                      />
                    </label>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-xs uppercase text-gray-500">Cardholder Name</span>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                          placeholder="Full Name"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase text-gray-500">Expiration</span>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-xs uppercase text-gray-500">CVV</span>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-orange-500 outline-none"
                        />
                      </label>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" className="h-4 w-4 accent-orange-500" />
                      Save card for future purchases
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                        SSL Secure
                      </span>
                      <span className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1">
                        PCI Compliant
                      </span>
                    </div>
                  </div>
                )}
                {paymentTab === 'Cash on Delivery' && (
                  <div className="space-y-2 rounded-2xl border border-dashed border-gray-300 bg-orange-50 p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p>
                      Pay the courier when your package arrives. Make sure you have the exact amount
                      ready and a valid ID for verification.
                    </p>
                  </div>
                )}
                {paymentTab !== 'Credit Card' && paymentTab !== 'Cash on Delivery' && (
                  <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">{paymentTab}</p>
                    <p>We will redirect you to {paymentTab} to complete the payment securely.</p>
                  </div>
                )}
              </section>
            )}
            {step === 4 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
                <h2 className="text-xl font-semibold">Review Order</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={`${item._id}-${item.selectedSize}`} className="flex gap-4 rounded-2xl border border-gray-200 p-4">
                      <img src={item.img_url} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Size {item.selectedSize} • Qty {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Shipping</span>
                    <span className="font-semibold">{formatPrice(shippingPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tax</span>
                    <span className="font-semibold">{formatPrice(0)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" className="h-4 w-4 accent-orange-500" />
                  I agree to the terms and conditions
                </label>
              </section>
            )}
            <div className="flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={handlePrev}
                  className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-500"
                >
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-900"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className={`rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white ${placingOrder ? 'opacity-70 cursor-wait' : 'hover:bg-orange-600'}`}
                >
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>
            {orderError && <p className="text-sm text-red-600">{orderError}</p>}
            {orderSuccess && <p className="text-sm text-green-600">{orderSuccess}</p>}
          </div>
          <aside className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Order Summary</h3>
              <button className="text-sm text-orange-500">Edit Cart</button>
            </div>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item._id}-${item.selectedSize}`} className="flex items-center gap-3">
                  <img src={item.img_url} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                      Size {item.selectedSize}
                    </p>
                    <p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex items-center justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Shipping</span>
                <span>{formatPrice(shippingPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-500">
                <span>Tax</span>
                <span>{formatPrice(0)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
            <div className="space-y-2 text-xs text-gray-500">
              <p>Secure Checkout • SSL encrypted</p>
              <p>30-day money back • Free returns</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
