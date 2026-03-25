import axios from 'axios';
import { getAccessToken } from '../../utils/auth';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiUrl } from '../../utils/api';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';

type Category = {
  _id: string;
  name: string;
  created_at?: string;
};

const AdminCategory = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '' });

  const submitLabel = selectedCategory ? t('admin.updateCategory') : t('admin.createCategory');

  const resetForm = () => {
    setSelectedCategory(null);
    setForm({ name: '' });
    setError('');
    setSuccess('');
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const response = await axios.get(`${apiUrl('/admin/categories')}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      setError(t('admin.loadFailed'));
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
    const token = getAccessToken();
    if (!token) {
      setError(t('common.error'));
      setLoading(false);
      return;
    }
    try {
      if (selectedCategory) {
        await axios.put(apiUrl(`/admin/categories/${selectedCategory._id}`), form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t('admin.updateSuccess'));
      } else {
        await axios.post(apiUrl('/admin/categories'), form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t('admin.saveSuccess'));
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(t('admin.saveFailed'));
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
    if (!confirm(t('admin.deleteConfirm'))) return;
    try {
      const token = getAccessToken();
      await axios.delete(apiUrl(`/admin/categories/${categoryId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess(t('admin.deleteSuccess'));
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError(t('admin.deleteFailed'));
    }
  };

  const totalCategories = useMemo(() => categories.length, [categories]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.categories')}</p>
            <h2 className="text-2xl font-semibold text-gray-900">{t('admin.manageCategories', { count: totalCategories })}</h2>
          </div>
          <Button variant="ghost" onClick={fetchCategories}>
            {t('admin.refresh')}
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            placeholder={t('admin.categoryName')}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />
          <Button type="submit" className="bg-orange-500 text-white" disabled={loading}>
            {loading ? t('admin.saving') : submitLabel}
          </Button>
          {selectedCategory && (
            <Button variant="outline" onClick={resetForm}>
              {t('admin.cancelEdit')}
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
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.categoryList')}</h3>
        {loading ? (
          <p className="text-sm text-gray-500">{t('admin.loading')}...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories.map((category) => (
              <div key={category._id} className="flex items-center justify-between py-3">
                <p className="font-medium text-gray-900">{category.name}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(category)}>
                    {t('admin.edit')}
                  </Button>
                  <Button className="bg-orange-500 text-white" onClick={() => handleDelete(category._id)}>
                    {t('admin.delete')}
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