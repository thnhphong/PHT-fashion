import { useEffect, useState, useCallback } from 'react';
import { apiUrl } from '../../utils/api';
import apiClient from '../../utils/apiClient';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/formatPrice';

type Order = {
  _id: string;
  orderNumber: string;
  customerId?: { name: string; email: string };
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  created_at: string;
};

type PaginationMeta = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

// Price is handled by formatPrice utility imported from utils

// Removed formatLabel in favor of t() for status and payment labels

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (selectedStatus) params.set('status', selectedStatus);
    try {
      const res = await apiClient.get(apiUrl(`/admin/orders?${params}`));
      const data = res.data;
      setOrders(data.data ?? []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(t('admin.updateStatusConfirm', { status: t(`admin.${newStatus}`) }))) return;
    try {
      await apiClient.patch(apiUrl(`/admin/orders/${orderId}/status`), { status: newStatus });
      setSuccess(t('admin.orderStatusUpdated'));
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message ?? err.message ?? t('admin.updateFailed'));
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm(t('admin.cancelOrderConfirm'))) return;
    try {
      await apiClient.post(apiUrl(`/admin/orders/${orderId}/cancel`));
      setSuccess(t('admin.orderCancelled'));
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.message ?? err.message ?? t('admin.updateFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.orders')}</p>
          <h1 className="text-3xl font-semibold text-gray-900">{t('admin.orderManagement')}</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.totalOrdersCount', { count: pagination.totalItems })}
            </p>
          )}
        </div>
        <Button onClick={fetchOrders} variant="ghost" size="sm">{t('admin.refresh')}</Button>
      </div>

      {(error || success) && (
        <div className={`rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {error || success}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setSelectedStatus(''); setPage(1); }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${!selectedStatus ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:border-orange-400'}`}
        >{t('admin.all')}</button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setSelectedStatus(s); setPage(1); }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${selectedStatus === s ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:border-orange-400'}`}
          >{t(`admin.${s}`)}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="px-4 py-3 text-left">{t('admin.order')} #</th>
                <th className="px-4 py-3 text-left">{t('admin.customer')}</th>
                <th className="px-4 py-3 text-left">{t('admin.total')}</th>
                <th className="px-4 py-3 text-left">{t('admin.status')}</th>
                <th className="px-4 py-3 text-left">{t('admin.payment')}</th>
                <th className="px-4 py-3 text-left">{t('admin.date')}</th>
                <th className="px-4 py-3 text-left">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t('admin.loadingOrders')}</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t('admin.noOrders')}</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customerId?.name ?? t('profile.guest')}</p>
                    <p className="text-xs text-gray-500">{order.customerId?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-500">{formatPrice(order.total_amount, i18n.language)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer ${STATUS_STYLES[order.status] ?? 'bg-gray-100'}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{t(`admin.${s}`)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PAYMENT_STYLES[order.payment_status] ?? 'bg-gray-100'}`}>
                      {t(`admin.${order.payment_status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(order.created_at, i18n.language)}</td>
                  <td className="px-4 py-3">
                    {order.status !== 'cancelled' && order.status !== 'delivered' ? (
                      <button
                        onClick={() => handleCancel(order._id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >{t('admin.cancelOrder')}</button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage((p) => p - 1)}
          >{t('admin.previous')}</Button>
          <span className="text-sm text-gray-500">
            {t('admin.page')} {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >{t('admin.next')}</Button>
        </div>
      )}
    </div>
  );
}
