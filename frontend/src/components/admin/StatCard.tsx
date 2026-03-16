import { TrendingUp, TrendingDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isUp: boolean;
  };
  icon?: any;
  description?: string;
}

export const StatCard = ({ label, value, trend, icon: Icon, description }: StatCardProps) => {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-100">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {trend && (
              <span className={cn(
                "flex items-center text-xs font-bold",
                trend.isUp ? "text-emerald-600" : "text-rose-600"
              )}>
                {trend.isUp ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-slate-50 p-3 text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};
