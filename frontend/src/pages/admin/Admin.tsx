import { Outlet } from 'react-router-dom';

const Admin = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Outlet />
    </div>
  );
};

export default Admin;