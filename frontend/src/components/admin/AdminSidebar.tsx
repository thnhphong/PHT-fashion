import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  Tags, 
  Ticket,
  ChevronLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Truck },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
];

export const AdminSidebar = ({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) => {
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-slate-400 transition-all duration-300 ease-in-out border-r border-slate-800",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        {!collapsed && (
          <span className="text-xl font-bold text-white tracking-tight">PHT<span className="text-orange-400">Fashion</span></span>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="mt-6 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin'}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-orange-600/10 text-orange-400 shadow-sm" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              collapsed ? "mx-auto" : ""
            )} />
            {!collapsed && <span>{item.name}</span>}
            {collapsed && (
              <div className="absolute left-full ml-6 hidden rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block whitespace-nowrap z-50">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
        <div className={cn("flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
            AD
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white leading-none">Admin User</span>
              <span className="text-xs text-slate-500 mt-1">pht-fashion.com</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
