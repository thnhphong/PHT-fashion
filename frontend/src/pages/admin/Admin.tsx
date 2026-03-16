import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminTopNav } from '../../components/admin/AdminTopNav';

const Admin = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <main className={`transition-all duration-300 ease-in-out ${collapsed ? "pl-20" : "pl-72"}`}>
        <AdminTopNav />
        
        <div className="min-h-[calc(100vh-64px)] p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;