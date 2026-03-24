import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  FolderOpen,
  Truck,
  Tag,
  ShoppingCart,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Award,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { useState } from 'react';
import { getUserFromToken } from '../../utils/auth';

function NavItem({
  to,
  label,
  icon: Icon,
  isActive,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  const base =
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
  const active = 'bg-orange-50 text-orange-600';
  const inactive = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  return (
    <Link
      to={to}
      className={`${base} ${isActive ? active : inactive}`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{label}</span>
      {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
    </Link>
  );
}

function NavGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
      >
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
        />
        {title}
      </button>
      {isOpen && <div className="space-y-1">{children}</div>}
    </div>
  );
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNavItems = [
  //  { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/admin/products', label: t('admin.products'), icon: Package },
    { to: '/admin/users', label: t('admin.users'), icon: Users },
    { to: '/admin/categories', label: t('admin.categories'), icon: FolderOpen },
    { to: '/admin/suppliers', label: t('admin.suppliers'), icon: Truck },
    { to: '/admin/coupons', label: t('admin.coupons'), icon: Tag },
    { to: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart },
  ];

  const analyticsNavItems = [
    { to: '/admin/analytics', label: t('admin.analyticsOverview') || 'Báo cáo', icon: BarChart3 },
  ];

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const user = getUserFromToken();
  const userName = user?.sub || 'Admin';

  const SidebarContent = () => (
    <>
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link
          to="/admin"
          className="font-display text-2xl tracking-wider text-gray-900 hover:text-orange-500 transition-colors"
        >
          PHT<span className="text-orange-500">.</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <NavGroup title={t('admin.management') || 'Quản lý'}>
          {adminNavItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              isActive={isActive(item.to)}
            />
          ))}
        </NavGroup>

        <NavGroup title={t('admin.reports') || 'Báo cáo'}>
          {analyticsNavItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              isActive={isActive(item.to)}
            />
          ))}
        </NavGroup>
      </nav>

      <div className="px-3 py-4 border-t border-gray-200 space-y-4">
        <div className="px-3">
          <LanguageSwitcher />
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('admin.backToSite')}
        </Link>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-700 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          {t('admin.logout') || 'Đăng xuất'}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link
            to="/admin"
            className="font-display text-xl tracking-wider text-gray-900"
          >
            PHT<span className="text-orange-500">.</span>
          </Link>
          <div className="w-10" />
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-white pt-14">
          <SidebarContent />
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <main className="pt-14 lg:pt-0 min-h-screen">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
