import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { Category, Product } from '../../types/types';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { Plus, RefreshCw, Edit2, Trash2, Package } from 'lucide-react';

const AdminProduct = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(apiUrl('/admin/products/all'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(apiUrl(`/admin/products/${productId}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setSuccess('Product deleted successfully');
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Unable to delete product');
    }
  };

  const productColumns = [
    { 
      header: 'Product', 
      accessor: (p: Product) => (
        <div className="flex items-center gap-4">
          {p.img_url ? (
            <img src={p.img_url} alt={p.name} className="h-12 w-12 rounded-xl object-cover border border-slate-100 shadow-sm" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100">
              <Package className="h-6 w-6 text-slate-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">{p.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{(p.categoryId as Category)?.name || 'Uncategorized'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Price', 
      accessor: (p: Product) => (
        <div className="flex flex-col text-slate-900">
          <span className="font-bold">{p.price?.toLocaleString()} VND</span>
          <span className="text-[10px] text-slate-400 font-medium italic">Incl. taxes</span>
        </div>
      )
    },
    { 
      header: 'Inventory', 
      accessor: (p: Product) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Stock</span>
            <span className={p.stock < 10 ? 'text-amber-500' : 'text-slate-600'}>{p.stock} units</span>
          </div>
          <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${p.stock < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min((p.stock / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (p: Product) => (
        <StatusBadge 
          status={p.stock === 0 ? 'danger' : p.stock < 10 ? 'warning' : 'success'} 
          label={p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'Active'} 
        />
      )
    }
  ];

  const renderActions = (p: Product) => (
    <div className="flex items-center justify-end gap-2">
      <button 
        onClick={() => navigate(`/admin/products/${p._id}/edit`, { state: { product: p } })}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-orange-600 transition-all"
        title="Edit product"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button 
        onClick={() => handleDelete(p._id)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
        title="Delete product"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Product Catalog</h1>
          <p className="text-slate-500 italic">Manage your store's inventory and product details from here.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchProducts}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync
          </button>
          <button 
            onClick={() => navigate('/admin/products/create')}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create New
          </button>
        </div>
      </header>

      {(error || success) && (
        <div className={`rounded-xl border p-4 text-xs font-bold uppercase tracking-widest ${
          error ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'
        }`}>
          {error || success}
        </div>
      )}

      <AdminDataTable 
        columns={productColumns} 
        data={products} 
        loading={loading}
        actions={renderActions}
        title="Inventory Matrix"
        description="A list of all products in your store including their current stock and price."
        searchPlaceholder="Find products..."
      />
    </div>
  );
};

export default AdminProduct;
