import { Outlet } from 'react-router-dom';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </div>
    </div>
  );
};

export default Admin;