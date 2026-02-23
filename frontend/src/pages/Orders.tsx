import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../utils/api';
import { refreshAccessToken } from '../utils/auth';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type OrderItemView = {
  productId: { name?: string; price?: number } | string;
  quantity: number;
  unit_price: number;
  productSize: string;
};

type OrderView = {
  _id: string;
  orderNumber: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_cost: number;
  shipping_method: string;
  payment_method: string;
  created_at: string;
  items: OrderItemView[];
};

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchOrders = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const attemptFetch = (bearer: string) =>
        fetch(apiUrl('/orders/my'), {
          headers: {
            Authorization: `Bearer ${bearer}`,
            'Content-Type': 'application/json',
          },
        });

      try {
        let response = await attemptFetch(token);
        if (response.status === 401) {
          const refreshed = await refreshAccessToken();
          if (!refreshed) {
            if (mounted) {
              setError('Session expired. Please log in again.');
            }
            navigate('/login');
            return;
          }
          response = await attemptFetch(refreshed);
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? 'Unable to load orders');
        }

        const data = (await response.json()) as OrderView[];
        if (mounted) {
          setOrders(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load orders');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (!localStorage.getItem('accessToken')) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.4em] text-gray-500">Account</p>
          <h1 className="text-3xl font-semibold text-gray-900">Your orders</h1>
          <p className="text-sm text-gray-500">
            Track the status of every purchase you've made with PHT Fashion.
          </p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            Loading your orders...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
            You have no orders yet. Create your first order to see it here.
          </div>
        )}

        {!loading &&
          !error &&
          orders.map((order) => (
            <article
              key={order._id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {order.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                    {order.payment_status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-gray-500">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Payment</p>
                  <p className="font-medium text-gray-900">{formatLabel(order.payment_method)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Shipping</p>
                  <p className="font-medium text-gray-900">{formatLabel(order.shipping_method)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Total</p>
                  <p className="font-medium text-gray-900">{formatPrice(order.total_amount)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
                {order.items?.map((item, index) => {
                  const productName =
                    typeof item.productId === 'object' ? item.productId.name : undefined;
                  const productPrice =
                    item.unit_price ?? (typeof item.productId === 'object' ? item.productId.price ?? 0 : 0);
                  return (
                    <div key={`${order._id}-${index}`} className="flex items-center justify-between text-gray-700">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {productName ?? 'Product'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Size {item.productSize} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">{formatPrice(productPrice * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}

        {!loading && !error && orders.length > 0 && (
          <p className="text-sm text-gray-500">
            If you need help with an order, reply to the confirmation email or contact support.
          </p>
        )}
      </div>
    </div>
  );
};

export default Orders;
