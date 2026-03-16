import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatCard } from '../../components/admin/StatCard';
import { 
  Tags, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  LayoutDashboard, 
  Save, 
  X,
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

type Category = {
  _id: string;
  name: string;
  created_at?: string;
};

const AdminCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '' });

  const totalCategories = useMemo(() => categories.length, [categories]);

  const fetchCategories = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get<Category[]>(apiUrl('/admin/categories'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch categories');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setSelectedCategory(null);
    setForm({ name: '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Missing admin session');
      setLoading(false);
      return;
    }
    try {
      if (selectedCategory) {
        await axios.put(apiUrl(`/admin/categories/${selectedCategory._id}`), form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Category updated');
      } else {
        await axios.post(apiUrl('/admin/categories'), form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Category created');
      }
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Unable to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setForm({ name: category.name });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(apiUrl(`/admin/categories/${categoryId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess('Category deleted');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Unable to delete category');
    }
  };

  const columns = [
    {
      header: 'Category Label',
      accessor: (c: Category) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm group-hover:bg-white transition-colors">
            <Tags className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{c.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Active Taxonomy</span>
          </div>
        </div>
      )
    },
    {
      header: 'System ID',
      accessor: (c: Category) => (
        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded">
          {c._id}
        </span>
      )
    },
    {
      header: 'Created At',
      accessor: (c: Category) => (
        <span className="text-xs text-slate-500 font-medium">
          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : 'N/A'}
        </span>
      )
    }
  ];

  const renderActions = (category: Category) => (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleEdit(category)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-orange-600 transition-all font-bold"
        title="Edit category"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(category._id)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold"
        title="Delete category"
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Store Taxonomy</h1>
          <p className="text-slate-500 italic">Organize your product catalog with intuitive categories.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <RefreshCw className={fetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Groups
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
                {selectedCategory ? <Edit2 className="h-4 w-4 text-orange-600" /> : <Plus className="h-4 w-4 text-orange-600" />}
              </div>
              <h2 className="text-lg font-bold italic text-slate-900">{selectedCategory ? 'Refine Group' : 'New Group'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Label Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="e.g. Winter Essentials"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Processing...' : selectedCategory ? 'Update Group' : 'Create Group'}
                </button>
                {selectedCategory && (
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
              label="Total Groups"
              value={totalCategories}
              icon={Layers}
              description="Nesting possible"
            />
            <StatCard
              label="Popularity"
              value="Trending"
              icon={Sparkles}
              description="Highest click-through"
            />
          </div>

          <AdminDataTable
            columns={columns}
            data={categories}
            loading={fetching}
            actions={renderActions}
            title="Classification Map"
            description="A structure of how products are grouped for customer navigation."
            searchPlaceholder="Filter groups..."
          />
        </div>
      </div>
    </div>
  );
};

export default AdminCategory;