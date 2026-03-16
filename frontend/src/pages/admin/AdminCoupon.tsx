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
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  scope: 'all' | 'product' | 'category';
  productIds?: any[];
  categoryIds?: any[];
  usage_limit: number;
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
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  scope: 'all' as 'all' | 'product' | 'category',
  productIds: [] as string[],
  categoryIds: [] as string[],
  usage_limit: '',
  expiration_date: '',
};

export default function AdminCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
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

  const loadResources = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(apiUrl('/admin/products'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/admin/categories'), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);
      setProducts(prodData.data ?? []);
      setCategories(catData ?? []);
    } catch (err) {
      console.error('Failed to load resources', err);
    }
  };

  useEffect(() => {
    loadCoupons();
    loadResources();
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
          ...form,
          code: form.code.toUpperCase(),
          discount_value: Number(form.discount_value),
          usage_limit: Number(form.usage_limit),
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
          <span>
            {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${new Intl.NumberFormat('vi-VN').format(c.discount_value)}đ`} OFF
          </span>
        </div>
      )
    },
    {
      header: 'Scope',
      accessor: (c: Coupon) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.scope}</span>
          <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
            {c.scope === 'product' ? `${c.productIds?.length} Items` : c.scope === 'category' ? `${c.categoryIds?.length} Categories` : 'Storewide'}
          </span>
        </div>
      )
    },
    {
      header: 'Usage',
      accessor: (c: Coupon) => (
        <div className="flex flex-col gap-1.5 w-24">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            <span>Quota</span>
            <span>{c.usage_limit} rem.</span>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400" style={{ width: `${Math.min((c.usage_limit / 100) * 100, 100)}%` }} />
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

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-orange-600">Reward Setup</label>
                  <div className="flex gap-2">
                    {(['percentage', 'fixed'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, discount_type: t })}
                        className={cn(
                          "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all",
                          form.discount_type === t 
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-100" 
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Value</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-[10px]">
                      {form.discount_type === 'percentage' ? '%' : 'VNĐ'}
                    </div>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.discount_value}
                      onChange={(event) => setForm({ ...form, discount_value: event.target.value })}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-orange-600">Scoping Matrix</label>
                  <select
                    value={form.scope}
                    onChange={(e) => setForm({ ...form, scope: e.target.value as any, productIds: [], categoryIds: [] })}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                  >
                    <option value="all">All Products</option>
                    <option value="product">Specific Products</option>
                    <option value="category">Specific Categories</option>
                  </select>
                </div>

                {form.scope === 'product' && (
                  <div className="space-y-3">
                    <input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-100 bg-white px-3 py-2 text-[10px] outline-none focus:border-orange-500"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-lg">
                      {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            const ids = form.productIds.includes(p._id) 
                              ? form.productIds.filter(id => id !== p._id)
                              : [...form.productIds, p._id];
                            setForm({ ...form, productIds: ids });
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-[10px] font-bold transition-all truncate",
                            form.productIds.includes(p._id) ? "bg-orange-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-100"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.scope === 'category' && (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          const ids = form.categoryIds.includes(c._id) 
                            ? form.categoryIds.filter(id => id !== c._id)
                            : [...form.categoryIds, c._id];
                          setForm({ ...form, categoryIds: ids });
                        }}
                        className={cn(
                          "px-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-tighter truncate transition-all",
                          form.categoryIds.includes(c._id) ? "bg-slate-900 text-white shadow-md shadow-slate-100" : "bg-slate-50 text-slate-400 border border-slate-100 hover:border-slate-200"
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quota</label>
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="100"
                    value={form.usage_limit}
                    onChange={(event) => setForm({ ...form, usage_limit: event.target.value })}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                  />
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
                      className="w-full rounded-xl border border-slate-100 bg-slate-50/50 pl-10 pr-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
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