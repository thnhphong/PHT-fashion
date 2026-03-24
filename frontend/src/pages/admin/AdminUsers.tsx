import { useEffect, useState, useCallback } from 'react';
import { apiUrl } from '../../utils/api';
import apiClient from '../../utils/apiClient';
import { Button } from '../../components/ui/button';
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type UserType = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'admin';
  avatar?: string;
  created_at: string;
};

type PaginationMeta = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

const formatDate = (value: string, locale: string) =>
  new Date(value).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<UserType[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', role: '' as 'customer' | 'admin' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter) params.set('role', roleFilter);

    try {
      const res = await apiClient.get(apiUrl(`/admin/users?${params}`));
      const data = res.data;
      setUsers(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('admin.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEdit = (user: UserType) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role,
    });
    setEditError('');
    setEditSuccess('');
  };

  const closeEdit = () => {
    setEditUser(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      await apiClient.put(apiUrl(`/admin/users/${editUser._id}`), {
        name: editForm.name,
        phone: editForm.phone || undefined,
        address: editForm.address || undefined,
        role: editForm.role,
      });

      setEditSuccess(t('admin.userUpdatedSuccess'));
      setTimeout(() => {
        closeEdit();
        fetchUsers();
      }, 1200);
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || t('admin.updateFailed'));
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(t('admin.deleteUserConfirm', { name: userName }))) return;

    try {
      await apiClient.delete(apiUrl(`/admin/users/${userId}`));

      setSuccess(t('admin.deleteSuccess'));
      setTimeout(() => setSuccess(''), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('admin.deleteFailed'));
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.6em] text-orange-500">{t('admin.dashboard')}</p>
          <h1 className="text-2xl font-semibold text-gray-900">{t('admin.usersManagement')}</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.usersTotal', { count: pagination.totalItems })}
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={fetchUsers} disabled={loading}>
          {t('admin.refresh')}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full h-10 px-3 pr-4 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
        >
          <option value="">{t('admin.allRoles')}</option>
          <option value="customer">{t('profile.customer')}</option>
          <option value="admin">{t('profile.admin')}</option>
        </select>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-500">{t('admin.loading')}...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-500">{t('admin.noUsers')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('admin.productName')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('common.email')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('admin.role')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('profile.phone')}</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('admin.created')}</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t(`profile.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(user.created_at, i18n.language)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          title={t('admin.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.name)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title={t('admin.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.previous')}
          </Button>
          <span className="text-sm text-gray-600">
            {t('admin.page')} {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.editUser')}</h2>
              <button
                onClick={closeEdit}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('profile.name')}</label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('common.email')}</label>
                <input
                  value={editUser.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('profile.phone')}</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder={t('admin.optional')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('profile.address')}</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder={t('admin.optional')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('admin.role')}</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as 'customer' | 'admin' }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                >
                  <option value="customer">{t('profile.customer')}</option>
                  <option value="admin">{t('profile.admin')}</option>
                </select>
              </div>

              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}
              {editSuccess && (
                <p className="text-sm text-emerald-600">{editSuccess}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeEdit}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={editLoading} className="bg-orange-500 text-white hover:bg-orange-600">
                  {editLoading ? t('admin.saving') : t('admin.saveChanges')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
