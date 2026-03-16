import { ChevronRight, ChevronLeft, Search, Filter } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  title?: string;
  description?: string;
  searchPlaceholder?: string;
}

export const AdminDataTable = <T extends { _id?: string | number; id?: string | number }>({
  columns,
  data,
  loading,
  onRowClick,
  actions,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  title,
  description,
  searchPlaceholder = "Search..."
}: AdminDataTableProps<T>) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      {(title || description) && (
        <div className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
              {description && <p className="text-sm text-slate-500">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="rounded-lg bg-slate-50 py-1.5 pl-10 pr-4 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 w-48 transition-all focus:w-64"
                />
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500">
          <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={cn("px-6 py-4", col.className)}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-6 py-4">
                      <div className="h-4 w-full rounded bg-slate-100"></div>
                    </td>
                  ))}
                  {actions && <td className="px-6 py-4"><div className="ml-auto h-4 w-8 rounded bg-slate-100"></div></td>}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400">
                  No data found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item._id || item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "group bg-white transition-colors hover:bg-slate-50/50",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={cn("px-6 py-4 font-medium text-slate-700", col.className)}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      <div onClick={(e) => e.stopPropagation()}>{actions(item)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
          <p className="text-xs text-slate-500 font-medium">
            Page <span className="text-slate-900">{currentPage}</span> of <span className="text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
