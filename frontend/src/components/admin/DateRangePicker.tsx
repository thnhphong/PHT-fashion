export type Period = '7d' | '30d' | '90d' | '1y' | 'custom';

interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  period: Period;
  setPeriod: (p: Period) => void;
  customRange: DateRange;
  setCustomRange: (r: DateRange) => void;
}

const PRESETS: { label: string; value: Period }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' },
];

export default function DateRangePicker({
  period,
  setPeriod,
  customRange,
  setCustomRange,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              period === p.value && p.value !== 'custom'
                ? 'bg-orange-560 text-white'
                : 'border border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-500'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPeriod('custom')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            period === 'custom'
              ? 'bg-orange-500 text-white'
              : 'border border-gray-300 text-gray-600 hover:border-orange-400 hover:text-orange-500'
          }`}
        >
          Custom
        </button>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customRange.from ?? ''}
            onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-400"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={customRange.to ?? ''}
            onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-orange-400"
          />
        </div>
      )}
    </div>
  );
}
