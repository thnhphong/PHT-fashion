import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { RefreshCw, Eye, CheckCircle, Truck, Clock } from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: any;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  shipping_method: string;
  coupon_code?: string;
  created_at: string;
}

const AdminOrder = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl('/admin/orders'));
      setOrders(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await axios.patch(apiUrl(`/admin/orders/${orderId}/status`), { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const columns = [
    {
      header: 'Order',
      accessor: (o: Order) => (
        <span className="font-mono text-orange-600 font-bold">#{o.orderNumber || o._id.slice(-6).toUpperCase()}</span>
      )
    },
    {
      header: 'Date',
      accessor: (o: Order) => (
        <span className="text-slate-500 text-sm">
          {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: (o: Order) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{o.customerId?.name || 'Guest'}</span>
          <span className="text-[10px] text-slate-400 capitalize">{o.customerId?.email || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Payment',
      accessor: (o: Order) => (
        <div className="flex flex-col gap-1">
          <StatusBadge 
            status={o.payment_status === 'paid' ? 'success' : o.payment_status === 'pending' ? 'warning' : 'danger'} 
            label={o.payment_status} 
          />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest text-center">{o.payment_method?.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      header: 'Total',
      accessor: (o: Order) => (
        <span className="font-bold text-slate-900">{o.total_amount?.toLocaleString()} VND</span>
      )
    },
    {
      header: 'Delivery',
      accessor: (o: Order) => (
        <div className="flex flex-col items-center">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {o.shipping_method?.replace('_', ' ') || 'Standard'}
          </span>
          {o.coupon_code && (
            <span className="text-[9px] text-orange-500 font-bold mt-1 uppercase">Coupon: {o.coupon_code}</span>
          )}
        </div>
      )
    },
    {
      header: 'Fulfilment',
      accessor: (o: Order) => (
        <StatusBadge 
          status={
            o.status === 'delivered' ? 'success' : 
            o.status === 'shipped' ? 'info' : 
            o.status === 'processing' ? 'warning' : 
            o.status === 'cancelled' ? 'danger' : 'default'
          } 
          label={o.status} 
        />
      )
    }
  ];

  const renderActions = (o: Order) => (
    <div className="flex items-center justify-end gap-2">
      <select 
        value={o.status}
        onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
        className="text-[10px] font-bold border rounded-lg px-2 py-1 bg-white hover:border-orange-400 transition-colors cursor-pointer"
      >
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-orange-600 transition-all" title="View Details">
        <Eye className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Order Management</h1>
          <p className="text-slate-500 italic">Track, fulfill, and manage your store's orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Sync Orders
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold uppercase tracking-widest text-rose-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: Truck, color: 'bg-indigo-500' },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'bg-amber-500' },
          { label: 'Active', value: orders.filter(o => o.status === 'processing' || o.status === 'shipped').length, icon: RefreshCw, color: 'bg-blue-500' },
          { label: 'Completed', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: 'bg-emerald-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <AdminDataTable 
        columns={columns} 
        data={orders} 
        loading={loading}
        actions={renderActions}
        title="Recent Orders"
        description="A live feed of customer transactions and their current status."
      />
    </div>
  );
};

export default AdminOrder;
