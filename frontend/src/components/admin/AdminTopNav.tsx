import { Search, Bell, Menu, User } from 'lucide-react';

export const AdminTopNav = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search everything... (CMD + K)"
            className="w-72 rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">To Thanh Phong</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">Super Admin</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 group-hover:border-orange-200 transition-all">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
};
