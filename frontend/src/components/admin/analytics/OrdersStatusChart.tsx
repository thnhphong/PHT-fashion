import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { ShoppingCart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

type OrdersSummary = {
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  averageOrderValue: number;
};

type OrdersStatusChartProps = {
  data: OrdersSummary | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default function OrdersStatusChart({ data }: OrdersStatusChartProps) {
  const { t } = useTranslation();

  const statusData = data?.byStatus || {};
  const labels = Object.keys(statusData);
  const values = Object.values(statusData);
  const colors = labels.map((status) => STATUS_COLORS[status] || '#9ca3af');

  const chartData = {
    labels: labels.map((status) => STATUS_LABELS[status] || status),
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map((color) => color),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context: any) {
            const total = values.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${context.raw} đơn (${percentage}%)`;
          },
        },
      },
    },
  };

  const totalOrders = values.reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('admin.ordersSummary') || 'Trạng thái đơn hàng'}
        </h2>
      </div>
      <div className="h-72">
        {totalOrders > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t('admin.noData') || 'Không có dữ liệu'}
          </div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {t('admin.averageOrderValue') || 'Giá trị đơn hàng trung bình'}
          </span>
          <span className="text-lg font-semibold text-gray-900">
            {data?.averageOrderValue
              ? new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(data.averageOrderValue)
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
