import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../../utils/api';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { User, Mail, Phone, MapPin, DollarSign, Edit, Trash2, RefreshCw } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
  totalSpent: number;
  status?: string; // Derived or static
}

const AdminCustomer = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(apiUrl('/users'));
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError('Unable to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    {
      header: 'Customer',
      accessor: (c: Customer) => (
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200 overflow-hidden">
            {c.avatar ? (
              <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-orange-600" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{c.name}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium tracking-tight">ID: {c._id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessor: (c: Customer) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>{c.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <span>{c.phone || 'N/A'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Country',
      accessor: (c: Customer) => (
        <div className="flex items-center gap-2 text-slate-600">
          <MapPin className="h-4 w-4 text-rose-400" />
          <span>{c.address?.split(',').pop()?.trim() || 'Vietnam'}</span>
        </div>
      )
    },
    {
      header: 'Total Spent',
      accessor: (c: Customer) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 font-bold text-slate-900 text-base">
            <span>{(c.totalSpent || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-normal ml-1">VND</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Premium Buyer</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (c: Customer) => (
        <StatusBadge status="success" label="Active" />
      )
    }
  ];

  const renderActions = (c: Customer) => (
    <div className="flex items-center justify-end gap-2">
      <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-orange-600 transition-all">
        <Edit className="h-4 w-4" />
      </button>
      <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Customer Relations</h1>
          <p className="text-slate-500 italic">Monitor customer lifetime value and engagement metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCustomers}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all hover:-translate-y-0.5">
            <DollarSign className="h-4 w-4" />
            Add Reward
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold uppercase tracking-widest text-rose-600">
          {error}
        </div>
      )}

      <AdminDataTable 
        columns={columns} 
        data={customers} 
        loading={loading}
        actions={renderActions}
        title="Customer Directory"
        description="Detailed view of your customers, their contact info, and total purchase history."
      />
    </div>
  );
};

export default AdminCustomer;
