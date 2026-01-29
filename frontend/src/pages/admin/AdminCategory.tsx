import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';

type Category = {
  _id: string;
  name: string;
  created_at?: string;
};

const AdminCategory = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [form, setForm] = useState({ name: '' });

  const formTitle = selectedCategory ? 'Update category' : 'Create new category';
  const submitLabel = selectedCategory ? 'Update category' : 'Create category';

  // ---------------- FETCH ----------------
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl('/admin/categories')}`);
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ---------------- FORM ----------------
  const handleChange = (value: string) => {
    setForm({ name: value });
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm({ name: '' });
    setSelectedCategory(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (selectedCategory) {
        await axios.put(apiUrl(`/admin/categories/${selectedCategory._id}`), form);
        setSuccess('Category updated successfully');
      } else {
        await axios.post(apiUrl('/admin/categories'), form);
        setSuccess('Category created successfully');
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError('Unable to save category');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- ACTIONS ----------------
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setForm({ name: category.name });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Delete this category?')) return;

    try {
      await axios.delete(apiUrl(`/admin/categories/${categoryId}`));
      setSuccess('Category deleted');
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError('Unable to delete category');
    }
  };

  const totalCategories = useMemo(() => categories.length, [categories]);

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase text-slate-400 tracking-[0.4em]">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold">
            Category catalog ({totalCategories})
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your product categories.
          </p>
        </header>

        {/* -------- FORM -------- */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold mb-3">{formTitle}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-400">
                Category name
              </label>
              <input
                value={form.name}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm"
                placeholder="Example: T-Shirts"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em]"
            >
              {loading ? 'Saving...' : submitLabel}
            </button>

            {(error || success) && (
              <p
                className={`text-center text-xs uppercase ${error ? 'text-red-400' : 'text-emerald-400'
                  }`}
              >
                {error || success}
              </p>
            )}
          </form>

          {selectedCategory && (
            <button
              type="button"
              onClick={resetForm}
              className="mt-4 text-xs uppercase tracking-[0.4em] text-slate-400 underline"
            >
              Cancel edit
            </button>
          )}
        </section>

        {/* -------- LIST -------- */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>

          <div className="space-y-3">
            {categories.map((category) => (
              <article
                key={category._id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <p className="uppercase tracking-[0.3em] text-slate-300">
                  {category.name}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="rounded-full border border-red-500/80 px-4 py-2 text-xs uppercase text-red-400"
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

export default AdminCategory;
