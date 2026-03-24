import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

const EditProfile = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setAvatar(user.avatar || '');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProfile({ name, phone, address, avatar });
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/profile')}
          className="mb-6 flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-black"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('profile.backToProfile')}
        </button>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.editProfile')}</CardTitle>
            <CardDescription>{t('profile.updateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('profile.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder={t('profile.enterName')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('profile.phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder={t('profile.enterPhone')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('profile.address')}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  rows={3}
                  placeholder={t('profile.enterAddress')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('profile.avatar')}</label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder={t('profile.avatarPlaceholder')}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('admin.saving')}
                    </>
                  ) : (
                    t('admin.saveChanges')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="flex-1"
                >
                  {t('profile.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
