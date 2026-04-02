import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OrderStatusData {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

interface OrderStatusPieChartProps {
  data: OrderStatusData;
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  pending: '#fbbf24',
  processing: '#3b82f6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: unknown;
  payload?: { name: string; value: number }[];
}) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-gray-900">{LABELS[name] ?? name}</p>
      <p className="mt-1 text-sm font-medium text-gray-700">{value} orders</p>
    </div>
  );
};

interface LegendItemProps {
  name: string;
  value: number;
  color: string;
}

function LegendItem({ name, value, color }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-600 whitespace-nowrap">
        {LABELS[name] ?? name}
      </span>
      <span className="ml-auto text-xs font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

export default function OrderStatusPieChart({
  data,
  loading,
}: OrderStatusPieChartProps) {
  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-52 w-52 animate-pulse rounded-full bg-gray-100" />
      </div>
    );
  }

  const safe = data ?? ({} as OrderStatusData);
  const chartData = Object.entries(safe).map(([key, value]) => ({
    name: key,
    value,
    label: LABELS[key] ?? key,
  }));

  const hasData = chartData.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">No order data available</p>
      </div>
    );
  }

  return (
    <div className="flex h-64 w-full flex-row items-center gap-4 overflow-hidden">
      <div className="h-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[entry.name] ?? '#9ca3af'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex min-w-[110px] flex-col gap-2.5">
        {chartData.map((entry) => (
          <LegendItem
            key={entry.name}
            name={entry.name}
            value={entry.value}
            color={COLORS[entry.name] ?? '#9ca3af'}
          />
        ))}
      </div>
    </div>
  );
}
