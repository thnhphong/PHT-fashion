import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { apiUrl } from '../../utils/api';

type Coupon = {
  _id: string;
  name: string;
  code: string;
  discount: number;
  count: number;
  expiration_date: Date;
  created_at?: string;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'long',
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Missing admin session');
      setLoading(false);
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
      setLoading(false);
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
          code: form.code,
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
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = useMemo(() => coupons.length, [coupons.length]);

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-orange-500">Coupons</p>
            <h2 className="text-2xl font-semibold">Manage discount codes</h2>
          </div>
          <p className="text-sm text-gray-500">{subtotal} active coupons</p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            placeholder="Code (uppercase)"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            type="number"
            min={0}
            max={100}
            placeholder="Discount (%)"
            value={form.discount}
            onChange={(event) => setForm({ ...form, discount: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            type="number"
            min={0}
            max={100}
            placeholder="Count"
            value={form.count}
            onChange={(event) => setForm({ ...form, count: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            type="date"
            value={form.expiration_date}
            onChange={(event) => setForm({ ...form, expiration_date: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={submitting} variant="default">
              {submitting ? 'Saving...' : 'Create coupon'}
            </Button>
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="sm:col-span-2 text-sm text-green-500">{success}</p>
          )}
        </form>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm divide-y divide-gray-100">
        <h3 className="text-xl font-semibold mb-4">All Coupons</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">No coupons created yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="py-2">Name</th>
                <th className="py-2">Code</th>
                <th className="py-2">Discount</th>
                <th className="py-2">Count</th>
                <th className="py-2">Expires</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="border-t border-gray-100">
                  <td className="py-3 font-medium text-gray-900">{coupon.name}</td>
                  <td className="py-3 text-gray-500">{coupon.code}</td>
                  <td className="py-3 text-gray-900">{coupon.discount}%</td>
                  <td className="py-3 text-gray-900">{coupon.count} / 100</td>
                  <td className="py-3 text-gray-500">{formatDate(coupon.expiration_date.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}