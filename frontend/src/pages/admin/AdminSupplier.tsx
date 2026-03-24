import axios from 'axios';
import { getAccessToken } from '../../utils/auth';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';
import { useTranslation } from 'react-i18next';

type Supplier = {
  _id: string;
  name: string;
  description: string;
  created_at?: string;
};

const AdminSupplier = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);

  const fetchSuppliers = async () => {
    try {
      const token = getAccessToken();
      const response = await axios.get<Supplier[]>(apiUrl('/admin/suppliers'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadFailed'));
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setSelectedSupplier(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (field: 'name' | 'description', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedSupplier) {
        const token = getAccessToken();
        await axios.put(
          apiUrl(`/admin/suppliers/${selectedSupplier._id}`),
          form,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        setSuccess(t('admin.updateSuccess'));
      } else {
        const token = getAccessToken();
        await axios.post(apiUrl('/admin/suppliers'), form, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setSuccess(t('admin.saveSuccess'));
      }
      resetForm();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError(t('admin.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm(t('admin.deleteConfirm'))) return;
    try {
        const token = getAccessToken();
        await axios.delete(apiUrl(`/admin/suppliers/${supplierId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      setSuccess(t('admin.deleteSuccess'));
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError(t('admin.deleteFailed'));
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({ name: supplier.name, description: supplier.description });
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase text-gray-400 tracking-[0.4em]">{t('admin.dashboard')}</p>
          <h1 className="text-3xl font-bold">{t('admin.supplierCatalog', { count: totalSuppliers })}</h1>
          <p className="text-gray-400 text-sm">{t('admin.manageSuppliersText')}</p>
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">{selectedSupplier ? t('admin.updateSupplier') : t('admin.createNewSupplier')}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('profile.name')}</label>
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none"
                placeholder={t('admin.supplierName')}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-gray-400">{t('admin.description')}</label>
              <input
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
                placeholder={t('admin.shortDescription')}
              />
            </div>
            <div className="col-span-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-orange-500/40 transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? t('admin.saving') : selectedSupplier ? t('admin.updateSupplier') : t('admin.suppliers')}
              </button>
            </div>
            {(error || success) && (
              <p className={`text-xs uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
                {error || success}
              </p>
            )}
          </form>
          {selectedSupplier && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 text-xs uppercase tracking-[0.4em] text-gray-400 underline"
            >
              {t('admin.cancelEdit')}
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('admin.suppliers')}</h2>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <article
                key={supplier._id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="uppercase tracking-[0.3em] text-gray-300">{supplier.name}</p>
                  <p className="text-sm text-gray-400">{supplier.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-900"
                  >
                    {t('admin.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(supplier._id)}
                    className="rounded-full border border-red-500 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-500"
                  >
                    {t('admin.delete')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSupplier;