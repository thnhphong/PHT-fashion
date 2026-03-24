import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Award } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type TopProduct = {
  productId: string;
  name: string;
  img_url: string;
  totalQuantity: number;
  totalRevenue: number;
};

type TopProductsChartProps = {
  data: TopProduct[];
};

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const { t } = useTranslation();

  const chartData = {
    labels: data.map((item) =>
      item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
    ),
    datasets: [
      {
        label: t('admin.quantitySold') || 'Số lượng bán',
        data: data.map((item) => item.totalQuantity),
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: '#f97316',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
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
            return `${context.raw} ${t('admin.units') || 'sản phẩm'}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('admin.topProducts') || 'Top sản phẩm bán chạy'}
        </h2>
      </div>
      <div className="h-80">
        {data.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {t('admin.noData') || 'Không có dữ liệu'}
          </div>
        )}
      </div>
    </div>
  );
}
