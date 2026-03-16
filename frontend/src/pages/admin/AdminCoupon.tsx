import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatCard } from '../../components/admin/StatCard';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  RefreshCw, 
  LayoutDashboard, 
  Save, 
  Target,
  Percent,
  Calendar,
  Key
} from 'lucide-react';
import { cn } from '../../lib/utils';

type Coupon = {
  _id: string;
  name: string;
  code: string;
  discount: number;
  count: number;
  expiration_date: string;
  created_at?: string;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));

const INITIAL_FORM = {
  name: '',
  code: '',
  discount: '',
  count: '',
  expiration_date: '',
};

export default function AdminCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCoupons = async () => {
    setFetching(true);
    setError('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Missing admin session');
      setFetching(false);
      return;
    }
    try {
      const response = await fetch(apiUrl('/coupons'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      setCoupons(data.coupons ?? []);
    } catch (err) {
      console.error(err);
      setError('Unable to load coupons');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Missing admin session');
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(apiUrl('/coupons'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          code: form.code.toUpperCase(),
          discount: Number(form.discount),
          count: Number(form.count),
          expiration_date: new Date(form.expiration_date),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? 'Unable to create coupon');
      }
      setSuccess('Coupon created');
      setForm(INITIAL_FORM);
      loadCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Invalidate this coupon code?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(apiUrl(`/coupons/${couponId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setSuccess('Coupon invalidated');
        loadCoupons();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to delete');
    }
  };

  const columns = [
    {
      header: 'Campaign',
      accessor: (c: Coupon) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm group-hover:bg-white transition-colors">
            <Ticket className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{c.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Seasonal Promo</span>
          </div>
        </div>
      )
    },
    {
      header: 'Code',
      accessor: (c: Coupon) => (
        <div className="flex items-center gap-2">
          <Key className="h-3 w-3 text-slate-300" />
          <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] tracking-widest">{c.code}</span>
        </div>
      )
    },
    {
      header: 'Benefit',
      accessor: (c: Coupon) => (
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Percent className="h-3.5 w-3.5 text-emerald-500" />
          <span>{c.discount}% OFF</span>
        </div>
      )
    },
    {
      header: 'Usage',
      accessor: (c: Coupon) => (
        <div className="flex flex-col gap-1.5 w-24">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Quota</span>
            <span>{c.count} rem.</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400" style={{ width: `${Math.min((c.count / 100) * 100, 100)}%` }} />
          </div>
        </div>
      )
    },
    {
      header: 'Expiration',
      accessor: (c: Coupon) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 italic">
          <Calendar className="h-3.5 w-3.5 text-slate-300" />
          <span>{formatDate(c.expiration_date)}</span>
        </div>
      )
    }
  ];

  const renderActions = (c: Coupon) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleDelete(c._id)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold"
        title="Invalidate"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const subtotal = useMemo(() => coupons.length, [coupons]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600 mb-2">
            <LayoutDashboard className="h-3 w-3" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Marketing Engine</h1>
          <p className="text-slate-500 italic">Generate and monitor high-conversion discount codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCoupons}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Coupons
          </button>
        </div>
      </header>

      {(error || success) && (
        <div className={cn(
          "rounded-xl border p-4 text-xs font-bold uppercase tracking-widest shadow-sm animate-in fade-in slide-in-from-top-2",
          error ? "border-rose-100 bg-rose-50 text-rose-600" : "border-emerald-100 bg-emerald-50 text-emerald-600"
        )}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Plus className="h-4 w-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-bold italic text-slate-900 font-serif">New Campaign</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Promo Name</label>
                <input
                  required
                  placeholder="e.g. Lunar New Year"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Coupon Code</label>
                <input
                  required
                  placeholder="SPRING2024"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-orange-600 font-mono font-bold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discount %</label>
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    placeholder="20"
                    value={form.discount}
                    onChange={(event) => setForm({ ...form, discount: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quota</label>
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="100"
                    value={form.count}
                    onChange={(event) => setForm({ ...form, count: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    type="date"
                    value={form.expiration_date}
                    onChange={(event) => setForm({ ...form, expiration_date: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {submitting ? 'Creating...' : 'Launch Campaign'}
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: List & Stats */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              label="Live Offers"
              value={subtotal}
              icon={Ticket}
              description="Coupons currently valid"
            />
            <StatCard
              label="Conversion"
              value="24.8%"
              icon={Target}
              description="Usage vs Views"
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={coupons}
            loading={fetching}
            actions={renderActions}
            title="Promotion Ledger"
            description="Comprehensive log of all active and historical discount codes."
            searchPlaceholder="Search campaigns..."
          />
        </div>
      </div>
    </div>
  );
}