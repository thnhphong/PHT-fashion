import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, MapPin, Calendar, Lock, ShoppingBag, User as UserIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { apiUrl } from '../utils/api';
import apiClient from '../utils/apiClient';

// Order Types from Orders.tsx
type OrderItemView = {
  productId: { name?: string; price?: number } | string;
  quantity: number;
  unit_price: number;
  productSize: string;
};

type OrderView = {
  _id: string;
  orderNumber: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_cost: number;
  shipping_method: string;
  payment_method: string;
  created_at: string;
  items: OrderItemView[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

const formatDate = (value: string | Date, lang: string) =>
  new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'account' | 'password' | 'orders'>('account');
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Orders state
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      fetchOrders();
    }
  }, [activeTab, user]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    
    try {
      const response = await apiClient.get(apiUrl('/orders/my'));
      setOrders(response.data);
    } catch (err: any) {
      setOrdersError(err.response?.data?.message || err.message || t('profile.loadOrdersError'));
    } finally {
      setOrdersLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(t('profile.minPassword'));
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(t('profile.changeSuccess'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || t('profile.changeFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('profile.myProfile')}</h1>
          <p className="mt-2 text-gray-600">{t('profile.account')}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <UserIcon className="h-5 w-5" />
                <span>{t('profile.account')}</span>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Lock className="h-5 w-5" />
                <span>{t('profile.changePassword')}</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>{t('profile.orderHistory')}</span>
              </button>
              <hr className="my-4 border-gray-200" />
              <button
                onClick={() => logout()}
                className="flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <span className="flex-1 text-left">{t('profile.logout')}</span>
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {activeTab === 'account' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('profile.personalInfo')}</CardTitle>
                    <CardDescription></CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/profile/edit')}>
                    {t('profile.edit')}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <UserIcon className="h-10 w-10 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-gray-500 capitalize">{t(`common.${user.role}`)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">{t('profile.email')}</p>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">{t('profile.phone')}</p>
                        <p>{user.phone || t('profile.notUpdated')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700 sm:col-span-2">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">{t('profile.address')}</p>
                        <p>{user.address || t('profile.notUpdated')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs font-medium uppercase text-gray-400">{t('profile.joinedDate')}</p>
                        <p>{formatDate(String(user.created_at), i18n.language)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'password' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.changePassword')}</CardTitle>
                  <CardDescription></CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {passwordError && (
                      <div className="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="flex items-center space-x-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('profile.currentPassword')}</label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('profile.newPassword')}</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('profile.confirmPassword')}</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <Button type="submit" disabled={passwordLoading} className="w-full md:w-auto">
                      {passwordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('profile.updating')}
                        </>
                      ) : (
                        t('profile.changePassword')
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('profile.orderHistory')}</CardTitle>
                    <CardDescription></CardDescription>
                  </CardHeader>
                </Card>

                {ordersLoading && (
                  <div className="flex py-10 items-center justify-center bg-white rounded-lg border border-gray-200">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                )}

                {ordersError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {ordersError}
                  </div>
                )}

                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{t('profile.noOrders')}</h3>
                    <p className="mt-2 text-gray-500"></p>
                    <Button className="mt-6" onClick={() => navigate('/products')}>
                      {t('profile.startShopping')}
                    </Button>
                  </div>
                )}
                {!ordersLoading && !ordersError && orders.map((order) => (
                  <Card key={order._id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('profile.orders')} #{order.orderNumber}</p>
                          <p className="text-sm text-gray-900">{formatDate(order.created_at, i18n.language)}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {t(`admin.${order.status.toLowerCase()}`)}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase text-gray-600">
                            {t(`order.${order.payment_status.toLowerCase()}`)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {order.items?.map((item, index) => {
                          const productName = typeof item.productId === 'object' ? item.productId.name : t('order.product');
                          const productPrice = item.unit_price;
                          return (
                            <div key={`${order._id}-${index}`} className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{productName}</p>
                                  <p className="text-sm text-gray-500">{t('order.size')}: {item.productSize} · {t('order.qty')}: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="font-semibold text-gray-900">{formatPrice(productPrice * item.quantity)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-gray-100 flex justify-between items-center py-4">
                      <div className="text-sm text-gray-500">
                        {t('order.payment')}: <span className="font-medium text-gray-900">{order.payment_method}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {t('order.total')}: {formatPrice(order.total_amount)}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
