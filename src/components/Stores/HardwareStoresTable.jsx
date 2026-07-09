import { useState, useMemo } from 'react';
import { Search, Store, Phone, MapPin, Plus, Edit3, Trash2, ChevronRight, X } from 'lucide-react';
import SmartCombobox from '../ui/SmartCombobox';
import useAppStore from '../../hooks/useAppStore';

const formatCurrency = (val) => `Rs. ${(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const ROUTE_BADGE = {
  Morawaka:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Akuressa:      'bg-blue-50 text-blue-700 border-blue-200',
  Deniyaya:      'bg-purple-50 text-purple-700 border-purple-200',
  Urubokka:      'bg-amber-50 text-amber-700 border-amber-200',
  Kamburupitiya: 'bg-rose-50 text-rose-700 border-rose-200',
  Kotapola:      'bg-cyan-50 text-cyan-700 border-cyan-200',
  Hakmana:       'bg-orange-50 text-orange-700 border-orange-200',
};

export default function HardwareStoresTable({
  shops,
  shopOutstanding,
  onViewInvoiceHistory,
  searchQuery,
  setSearchQuery,
  onAddShop,
  onEditShop,
  onDeleteShop,
  onUpdateStore,
}) {
  const routes = useAppStore((s) => s.routes);
  const [routeFilter, setRouteFilter] = useState('all');

  const routeOptions = useMemo(() => [
    { value: 'all', label: 'All Routes' },
    ...routes.map((r) => ({
      value: r,
      label: r,
      count: shops.filter((s) => s.route === r).length,
    })),
  ], [routes, shops]);

  const filtered = useMemo(() => {
    let result = shops;
    if (routeFilter !== 'all') result = result.filter((s) => s.route === routeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        s.route.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shops, routeFilter, searchQuery]);

  const totalOutstanding = filtered.reduce((s, shop) => s + Math.max(0, shopOutstanding[shop.id] || 0), 0);

  return (
    <div className="glass-card overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 sm:p-5 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 w-full sm:w-60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Route Filter */}
            <div className="w-full sm:w-44">
              <SmartCombobox
                value={routeFilter}
                onSelect={(opt) => setRouteFilter(opt.value)}
                options={routeOptions}
                placeholder="Filter by route..."
                dropdownMaxHeight="max-h-48"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs text-gray-500">
              <span className="text-gray-900 font-semibold">{filtered.length}</span> stores
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-accent-600 font-semibold">{formatCurrency(totalOutstanding)}</span> outstanding
            </div>
            {onAddShop && (
              <button onClick={onAddShop} className="btn-primary text-xs">
                <Plus size={14} /> Add Store
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="table-header">ID</th>
              <th className="table-header">Store Name</th>
              <th className="table-header">Route</th>
              <th className="table-header">Phone</th>
              <th className="table-header text-right">Total Paid</th>
              <th className="table-header text-right">Outstanding</th>
              <th className="table-header text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-gray-500 text-sm">
                  <Store size={32} className="mx-auto mb-2 text-gray-300" />
                  No hardware stores found
                </td>
              </tr>
            ) : (
              filtered.map((shop) => {
                const outstanding = shopOutstanding[shop.id] || 0;
                const totalPaid   = shop.totalPayments || 0;
                const routeBadge  = ROUTE_BADGE[shop.route] || 'bg-gray-100 text-gray-500 border-gray-200';
                return (
                  <tr key={shop.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-mono text-xs text-gray-400">
                      #{String(shop.id).padStart(3, '0')}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => onViewInvoiceHistory(shop.id)}
                        className="text-left hover:text-accent-500 transition-colors"
                      >
                        <span className="font-semibold text-accent-600 hover:underline">{shop.name}</span>
                        {shop.address && (
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={9} /> {shop.address}
                          </p>
                        )}
                      </button>
                    </td>
                    <td className="table-cell">
                      <span className={`badge border ${routeBadge}`}>{shop.route}</span>
                    </td>
                    <td className="table-cell">
                      <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                        <Phone size={12} className="text-gray-400" />
                        {shop.contact || '—'}
                      </span>
                    </td>
                    <td className="table-cell text-right font-mono text-sm text-emerald-600">
                      {formatCurrency(totalPaid)}
                    </td>
                    <td className={`table-cell text-right font-mono text-sm font-semibold ${
                      outstanding > 0 ? 'text-accent-600' : 'text-gray-400'
                    }`}>
                      {outstanding > 0 ? formatCurrency(outstanding) : '—'}
                    </td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onEditShop && (
                          <button
                            onClick={() => onEditShop(shop)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all"
                            title="Edit Store"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => onViewInvoiceHistory(shop.id)}
                          className="p-1.5 rounded-lg hover:bg-accent-50 text-gray-400 hover:text-accent-600 transition-all"
                          title="View Transactions"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-300 bg-gray-50">
                <td colSpan={4} className="table-cell text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Subtotal ({filtered.length} stores)
                </td>
                <td className="table-cell text-right font-mono text-sm text-emerald-600 font-semibold">
                  {formatCurrency(filtered.reduce((s, shop) => s + (shop.totalPayments || 0), 0))}
                </td>
                <td className="table-cell text-right font-mono text-sm text-accent-600 font-bold">
                  {formatCurrency(totalOutstanding)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}