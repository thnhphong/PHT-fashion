import { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/api';
import apiClient from '../../utils/apiClient';
import { useTranslation } from 'react-i18next';
import {
  AnalyticsOverview,
  RevenueChart,
  TopProductsChart,
  OrdersStatusChart,
} from '../../components/admin/analytics';

type OverviewData = {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalCustomers: number;
  period: { from: string; to: string };
};

type RevenueDataPoint = {
  date: string;
  revenue: number;
  orders: number;
};

type TopProduct = {
  productId: string;
  name: string;
  img_url: string;
  totalQuantity: number;
  totalRevenue: number;
};

type OrdersSummary = {
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  averageOrderValue: number;
};

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenue, setRevenue] = useState<RevenueDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<OrdersSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, revenueRes, topProductsRes, ordersRes] = await Promise.all([
          apiClient.get(apiUrl(`/admin/analytics/overview?period=${period}`)),
          apiClient.get(apiUrl(`/admin/analytics/revenue?period=${period}&groupBy=day`)),
          apiClient.get(apiUrl(`/admin/analytics/top-products?period=${period}&limit=5`)),
          apiClient.get(apiUrl(`/admin/analytics/orders-summary?period=${period}`)),
        ]);

        setOverview(overviewRes.data);
        setRevenue(revenueRes.data?.data || []);
        setTopProducts(topProductsRes.data?.data || []);
        setOrdersSummary(ordersRes.data);
      } catch (err) {
        console.error(err);
        setError(t('admin.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, t]);

  const periodOptions = [
    { value: '1d', label: '1 ' + (t('admin.day') || 'ngày') },
    { value: '7d', label: '7 ' + (t('admin.days') || 'ngày') },
    { value: '30d', label: '30 ' + (t('admin.days') || 'ngày') },
    { value: '90d', label: '90 ' + (t('admin.days') || 'ngày') },
    { value: '1y', label: '1 ' + (t('admin.year') || 'năm') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.reports')}</p>
          <h1 className="text-2xl font-semibold text-gray-900">{t('admin.analyticsOverview') || 'Báo cáo tổng quan'}</h1>
          {overview?.period && (
            <p className="text-sm text-gray-500 mt-1">
              {overview.period.from} - {overview.period.to}
            </p>
          )}
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <AnalyticsOverview data={overview} />

      <RevenueChart data={revenue} />

      <OrdersStatusChart data={ordersSummary} />

      <TopProductsChart data={topProducts} />
    </div>
  );
}
