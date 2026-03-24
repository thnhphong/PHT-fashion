import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/formatPrice';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

const formatVND = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const formatDate = (dateStr: string, locale: string) => {
  const d = new Date(dateStr);
  if (dateStr.includes('W')) return dateStr;
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: {active?: unknown; payload?: {value: number; dataKey: string}[]; label?: string}) => {
  const { t, i18n } = useTranslation();
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const orders = payload.find((p) => p.dataKey === 'orders')?.value ?? 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-900">{formatDate(label ?? '', i18n.language)}</p>
      <p className="mt-1 text-sm text-orange-500">
        {t('admin.revenue')}: {formatPrice(revenue, i18n.language)}
      </p>
      <p className="text-xs text-gray-500">{t('admin.orders')}: {orders}</p>
    </div>
  );
};

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">{t('admin.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tickFormatter={(val) => formatDate(val, i18n.language)}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatVND}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 5, fill: '#f97316' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
