import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';

type Supplier = {
  _id: string;
  name: string;
  description: string;
  created_at?: string;
};

const AdminSupplier = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get<Supplier[]>(apiUrl('/admin/suppliers'));
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load suppliers');
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
        await axios.put(apiUrl(`/admin/suppliers/${selectedSupplier._id}`), form);
        setSuccess('Supplier updated');
      } else {
        await axios.post(apiUrl('/admin/suppliers'), form);
        setSuccess('Supplier created');
      }
      resetForm();
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError('Unable to save supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await axios.delete(apiUrl(`/admin/suppliers/${supplierId}`));
      setSuccess('Supplier deleted');
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError('Unable to delete supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({ name: supplier.name, description: supplier.description });
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase text-slate-400 tracking-[0.4em]">Admin dashboard</p>
          <h1 className="text-3xl font-bold">Supplier catalog ({totalSuppliers})</h1>
          <p className="text-slate-400 text-sm">Upload and manage suppliers.</p>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <h2 className="text-xl font-semibold mb-3">{selectedSupplier ? 'Update supplier' : 'Create new supplier'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Name</label>
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white shadow-sm focus:border-rose-500 focus:outline-none"
                placeholder="Supplier name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">Description</label>
              <input
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white focus:border-rose-500 focus:outline-none"
                placeholder="Short description"
              />
            </div>
            <div className="col-span-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-rose-500/40 transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? 'Saving...' : selectedSupplier ? 'Update supplier' : 'Create supplier'}
              </button>
            </div>
            {(error || success) && (
              <p className={`text-xs uppercase ${error ? 'text-red-400' : 'text-emerald-300'}`}>
                {error || success}
              </p>
            )}
          </form>
          {selectedSupplier && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 text-xs uppercase tracking-[0.4em] text-slate-400 underline"
            >
              Cancel edit
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
          <h2 className="text-xl font-semibold mb-4">Suppliers</h2>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <article
                key={supplier._id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <div>
                  <p className="uppercase tracking-[0.3em] text-slate-300">{supplier.name}</p>
                  <p className="text-sm text-slate-400">{supplier.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(supplier._id)}
                    className="rounded-full border border-red-500/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-red-400"
                  >
                    Delete
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