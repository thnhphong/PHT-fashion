import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import type { Product, Category } from '../../types/types';
import { StatCard } from '../../components/admin/StatCard';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Package, DollarSign, ShoppingBag, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl('/admin/products')}`);
      const data = response.data.data ?? response.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const totalProducts = useMemo(() => products.length, [products]);
  const lowStockProducts = useMemo(() => products.filter(p => (p.stock || 0) < 10).length, [products]);

  const productColumns = [
    {
      header: 'Product',
      accessor: (p: Product) => (
        <div className="flex items-center gap-3">
          {p.img_url ? (
            <img src={p.img_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-100" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-100">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 line-clamp-1">{p.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{(p.categoryId as Category)?.name || 'Uncategorized'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: (p: Product) => (
        <span className="font-semibold text-slate-900">{p.price?.toLocaleString()} VND</span>
      )
    },
    {
      header: 'Stock',
      accessor: (p: Product) => (
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${p.stock && p.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{p.stock} units</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (p: Product) => (
        <StatusBadge
          status={(p.stock || 0) < 5 ? 'danger' : (p.stock || 0) < 15 ? 'warning' : 'success'}
          label={(p.stock || 0) < 5 ? 'Critical' : (p.stock || 0) < 15 ? 'Low Stock' : 'In Stock'}
        />
      )
    }
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Dashboard Overview</h1>
          <p className="text-slate-500">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all hover:border-slate-300"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/products/create')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold uppercase tracking-widest text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={totalProducts}
          icon={Package}
          trend={{ value: 12, isUp: true }}
          description="Catalog items active"
        />
        <StatCard
          label="Revenue"
          value="-- VND"
          icon={DollarSign}
          description="Last 30 days"
        />
        <StatCard
          label="Low Stock"
          value={lowStockProducts}
          icon={ShoppingBag}
          trend={{ value: 5, isUp: false }}
          description="Items below threshold"
        />
        <StatCard
          label="Customers"
          value="--"
          icon={Plus}
          description="Total registered"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 italic tracking-tight">Recent Products</h2>
            <button
              onClick={() => navigate('/admin/products')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
            >
              View All
            </button>
          </div>
          <AdminDataTable
            columns={productColumns}
            data={products.slice(0, 5)}
            loading={loading}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 italic tracking-tight">Store Health</h2>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              {[
                { label: 'Inventory Level', value: 85, color: 'bg-emerald-500' },
                { label: 'Order Completion', value: 92, color: 'bg-indigo-500' },
                { label: 'Customer Satisfaction', value: 78, color: 'bg-amber-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>{item.label}</span>
                    <span className="text-slate-900">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
