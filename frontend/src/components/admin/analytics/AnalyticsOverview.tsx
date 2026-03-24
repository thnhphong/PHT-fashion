import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../../utils/formatPrice';
import { Users, ShoppingCart, Package, DollarSign } from 'lucide-react';

type OverviewData = {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalCustomers: number;
};

const AnalyticsCard = ({
  title,
  value,
  icon: Icon,
  format = 'number',
}: {
  title: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'currency';
}) => {
  const numValue = value ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{title}</span>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {format === 'currency' ? formatPrice(numValue) : numValue.toLocaleString()}
      </div>
    </div>
  );
};

export default function AnalyticsOverview({ data }: { data: OverviewData | null }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AnalyticsCard
        title={t('admin.totalRevenue') || 'Tổng doanh thu'}
        value={data?.totalRevenue}
        icon={DollarSign}
        format="currency"
      />
      <AnalyticsCard
        title={t('admin.totalOrders') || 'Tổng đơn hàng'}
        value={data?.totalOrders}
        icon={ShoppingCart}
      />
      <AnalyticsCard
        title={t('admin.totalProducts') || 'Tổng sản phẩm đã bán'}
        value={data?.totalItemsSold}
        icon={Package}
      />
      <AnalyticsCard
        title={t('admin.totalUsers') || 'Tổng khách hàng'}
        value={data?.totalCustomers}
        icon={Users}
      />
    </div>
  );
}
