import { RefreshCw } from 'lucide-react';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { StatusBadge } from '../../components/admin/StatusBadge';

const AdminOrder = () => {
  // Mock data for now until we have real order API
  const orders = [
    { id: '#ORD-001', customer: 'John Doe', amount: 250000, status: 'Completed', date: '2026-03-15' },
    { id: '#ORD-002', customer: 'Jane Smith', amount: 120000, status: 'Processing', date: '2026-03-16' },
    { id: '#ORD-003', customer: 'Bob Johnson', amount: 450000, status: 'Pending', date: '2026-03-16' },
  ];

  const orderColumns = [
    { header: 'Order ID', accessor: 'id' as const, className: 'font-mono text-indigo-600' },
    { header: 'Customer', accessor: 'customer' as const },
    { 
      header: 'Amount', 
      accessor: (o: any) => <span>{o.amount.toLocaleString()} VND</span>
    },
    { header: 'Date', accessor: 'date' as const },
    { 
      header: 'Status', 
      accessor: (o: any) => (
        <StatusBadge 
          status={o.status === 'Completed' ? 'success' : o.status === 'Processing' ? 'info' : 'warning'} 
          label={o.status} 
        />
      )
    }
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 italic">Order Management</h1>
          <p className="text-slate-500 italic">Track and process customer orders effectively.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw className="h-4 w-4" />
          Sync Orders
        </button>
      </header>

      <AdminDataTable 
        columns={orderColumns} 
        data={orders} 
        title="Recent Orders"
        description="A real-time list of customer purchases and their fulfillment status."
      />
    </div>
  );
};

export default AdminOrder;
