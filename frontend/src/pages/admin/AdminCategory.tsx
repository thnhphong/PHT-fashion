import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';
import { Button } from '../../components/ui/button';

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

  const submitLabel = selectedCategory ? 'Update category' : 'Create category';

  const resetForm = () => {
    setSelectedCategory(null);
    setForm({ name: '' });
    setError('');
    setSuccess('');
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${apiUrl('/admin/categories')}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
        setSuccess('Category updated successfully');
      } else {
        await axios.post(apiUrl('/admin/categories'), form, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setForm({ name: category.name });
    setError('');
    setSuccess('');
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
    } catch (err) {
      console.error(err);
      setError('Unable to delete category');
    }
  };

  const totalCategories = useMemo(() => categories.length, [categories]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-orange-500">Categories</p>
            <h2 className="text-2xl font-semibold text-gray-900">Manage categories ({totalCategories})</h2>
          </div>
          <Button variant="ghost" onClick={fetchCategories}>
            Refresh
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder="Category name"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <Button type="submit" className="bg-orange-500 text-white" disabled={loading}>
            {loading ? 'Saving...' : submitLabel}
          </Button>
          {selectedCategory && (
            <Button variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
          {(error || success) && (
            <p className={`text-xs uppercase ${error ? 'text-red-500' : 'text-emerald-500'}`}>
              {error || success}
            </p>
          )}
        </form>
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Category list</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center justify-between py-3">
                <p className="font-medium text-gray-900">{category.name}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(category)}>
                    Edit
                  </Button>
                  <Button className="bg-orange-500 text-white" onClick={() => handleDelete(category._id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminCategory;