import { useEffect, useMemo, useState } from 'react';
import { getAccessToken } from '../../utils/auth';
import { Button } from '../../components/ui/button';
import { apiUrl } from '../../utils/api';
import { useTranslation } from 'react-i18next';

type Coupon = {
  _id: string;
  name: string;
  code: string;
  discount: number;
  count: number;
  expiration_date: Date;
  created_at?: string;
};

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
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
  const { t, i18n } = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    const token = getAccessToken();
    if (!token) {
      setError(t('common.error'));
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
      setError(t('admin.loadFailed'));
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
    const token = getAccessToken();
    if (!token) {
      setError(t('common.error'));
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
        throw new Error(body.message ?? t('admin.saveFailed'));
      }
      setSuccess(t('admin.saveSuccess'));
      setForm(INITIAL_FORM);
      loadCoupons();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('admin.saveFailed'));
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
            <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.coupons')}</p>
            <h2 className="text-2xl font-semibold">{t('admin.manageDiscountCodes')}</h2>
          </div>
          <p className="text-sm text-gray-500">{t('admin.activeCoupons', { count: subtotal })}</p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder={t('profile.name')}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            placeholder={t('checkout.couponCode')}
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            type="number"
            min={0}
            max={100}
            placeholder={`${t('admin.discount')} (%)`}
            value={form.discount}
            onChange={(event) => setForm({ ...form, discount: event.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
          />
          <input
            required
            type="number"
            min={0}
            max={100}
            placeholder={t('admin.count')}
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
              {submitting ? t('admin.saving') : t('admin.createCoupon')}
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
        <h3 className="text-xl font-semibold mb-4">{t('admin.allCoupons')}</h3>
        {loading ? (
          <p className="text-sm text-gray-500">{t('admin.loading')}...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">{t('admin.noCoupons')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-gray-500">
                <th className="py-2">{t('admin.productName')}</th>
                <th className="py-2">{t('checkout.couponCode')}</th>
                <th className="py-2">{t('admin.discount')}</th>
                <th className="py-2">{t('admin.count')}</th>
                <th className="py-2">{t('admin.expires')}</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="border-t border-gray-100">
                  <td className="py-3 font-medium text-gray-900">{coupon.name}</td>
                  <td className="py-3 text-gray-500">{coupon.code}</td>
                  <td className="py-3 text-gray-900">{coupon.discount}%</td>
                  <td className="py-3 text-gray-900">{coupon.count} / 100</td>
                  <td className="py-3 text-gray-500">{formatDate(coupon.expiration_date.toString(), i18n.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}