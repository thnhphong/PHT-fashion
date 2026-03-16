import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatCard } from '../../components/admin/StatCard';
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  LayoutDashboard, 
  Save, 
  X,
  Building2,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';

type Supplier = {
  _id: string;
  name: string;
  description: string;
  created_at?: string;
};

const AdminSupplier = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const totalSuppliers = useMemo(() => suppliers.length, [suppliers]);

  const fetchSuppliers = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<Supplier[]>(apiUrl('/admin/suppliers'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load suppliers');
    } finally {
      setFetching(false);
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
      const token = localStorage.getItem('accessToken');
      if (selectedSupplier) {
        await axios.put(
          apiUrl(`/admin/suppliers/${selectedSupplier._id}`),
          form,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        setSuccess('Supplier updated');
      } else {
        await axios.post(apiUrl('/admin/suppliers'), form, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setSuccess('Supplier created');
      }
      resetForm();
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 3000);
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
        const token = localStorage.getItem('accessToken');
        await axios.delete(apiUrl(`/admin/suppliers/${supplierId}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      setSuccess('Supplier deleted');
      fetchSuppliers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Unable to delete supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setForm({ name: supplier.name, description: supplier.description });
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columns = [
    {
      header: 'Partner Name',
      accessor: (s: Supplier) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm group-hover:bg-white transition-colors">
            <Truck className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{s.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Verified Partner</span>
          </div>
        </div>
      )
    },
    {
      header: 'Description',
      accessor: (s: Supplier) => (
        <span className="text-sm text-slate-500 line-clamp-1 italic">"{s.description || 'No description provided'}"</span>
      )
    },
    {
      header: 'Added Date',
      accessor: (s: Supplier) => (
        <span className="text-xs text-slate-400 font-medium tracking-tight">
          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB') : 'N/A'}
        </span>
      )
    }
  ];

  const renderActions = (s: Supplier) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleEdit(s)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-orange-600 transition-all"
        title="Edit supplier"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(s._id)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold"
        title="Delete supplier"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-orange-600 mb-2">
            <LayoutDashboard className="h-3 w-3" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Partners & Suppliers</h1>
          <p className="text-slate-500 italic">Manage your procurement network and verified partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSuppliers}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Network
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
        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                {selectedSupplier ? <Edit2 className="h-4 w-4 text-orange-600" /> : <Plus className="h-4 w-4 text-orange-600" />}
              </div>
              <h2 className="text-lg font-bold italic text-slate-900">{selectedSupplier ? 'Edit Partner' : 'New Partner'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Name</label>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g. Sáng Tạo Group"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brief Bio</label>
                <textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Describe their niche..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Processing...' : selectedSupplier ? 'Update Partner' : 'Register Partner'}
                </button>
                {selectedSupplier && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              label="Active Partners"
              value={totalSuppliers}
              icon={Building2}
              description="Verified in network"
            />
            <StatCard
              label="Quality Score"
              value="A+"
              icon={Info}
              description="Aggregate store rating"
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={suppliers}
            loading={fetching}
            actions={renderActions}
            title="Partnership Index"
            description="Complete directory of entities currently providing inventory for PHT-Fashion."
            searchPlaceholder="Filter partners..."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminSupplier;