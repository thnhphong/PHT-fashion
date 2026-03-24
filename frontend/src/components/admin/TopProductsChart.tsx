import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TopProduct {
  productId: string;
  name: string;
  img_url: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
  loading?: boolean;
}

const truncate = (str: string, len: number) =>
  str.length > len ? `${str.slice(0, len)}…` : str;

const CustomTooltip = ({ active, payload }: {active?: unknown; payload?: {payload: TopProduct}[]}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-900">{d.name}</p>
      <p className="mt-1 text-sm text-orange-500 font-medium">{d.totalQuantity} units sold</p>
    </div>
  );
};

export default function TopProductsChart({ data, loading }: TopProductsChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-56 w-full animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">No product data available</p>
      </div>
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    displayName: truncate(p.name, 22),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis
            type="number"
            tickFormatter={(v) => v.toLocaleString()}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="displayName"
            width={120}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
          <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={index === 0 ? '#f97316' : `rgba(249, 115, 22, ${0.9 - index * 0.08})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
