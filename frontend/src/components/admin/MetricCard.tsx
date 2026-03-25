import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  loading?: boolean;
}

export default function MetricCard({ label, value, helper, icon: Icon, loading }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? (
              <span className="inline-block h-7 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              value
            )}
          </p>
          {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
        </div>
        <div className="rounded-xl bg-orange-50 p-3">
          <Icon className="h-5 w-5 text-orange-500" />
        </div>
      </div>
    </div>
  );
}
