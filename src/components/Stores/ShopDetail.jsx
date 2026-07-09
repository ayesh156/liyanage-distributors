import { useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, FileText, Receipt,
  CalendarDays, ChevronDown, Edit3, Banknote, CreditCard, Building2,
} from 'lucide-react';

const formatCurrency = (val) => {
  const sign = val < 0 ? '-' : '';
  return `${sign}Rs. ${Math.abs(val).toLocaleString('en-US')}`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const MODE_ICON = { cash: Banknote, cheque: CreditCard, check: Building2, credit: FileText };
const MODE_COLOR = { cash: 'text-emerald-600', cheque: 'text-blue-600', check: 'text-purple-600', credit: 'text-gray-500' };

export default function ShopDetail({
  shop,
  transactions,
  outstanding,
  onBack,
  onAddTransaction,
  onDeleteTransaction,
  onEditShop,
}) {
  const [sortOrder, setSortOrder] = useState('newest');

  const sorted = [...transactions].sort((a, b) =>
    sortOrder === 'newest'
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date),
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost p-2 -ml-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{shop.name}</h2>
            <p className="text-sm text-gray-500">
              {shop.route}
              {shop.contact && <span> · {shop.contact}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEditShop(shop)} className="btn-ghost text-xs px-3 py-2">
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={onAddTransaction} className="btn-primary text-xs">
            <Plus size={14} /> Add Entry
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(transactions.filter((t) => t.docType === 'Invoice').reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1">Total Collected</p>
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(transactions.filter((t) => t.docType === 'Payment').reduce((s, t) => s + t.amount, 0))}
          </p>
        </div>
        <div className="glass-card p-4 bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200">
          <p className="text-xs text-gray-500 mb-1">Outstanding Balance</p>
          <p className={`text-lg font-bold ${outstanding > 0 ? 'text-accent-600' : 'text-emerald-600'}`}>
            {outstanding > 0 ? formatCurrency(outstanding) : 'Rs. 0'}
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Transaction History</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="input-field text-xs py-1.5 pr-7 appearance-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="table-header">Date</th>
                <th className="table-header">Doc No</th>
                <th className="table-header">Type</th>
                <th className="table-header">Mode</th>
                <th className="table-header">Cheque No</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-center">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 text-sm">
                    <Receipt size={28} className="mx-auto mb-2 text-gray-300" />
                    No transactions yet
                  </td>
                </tr>
              ) : (
                sorted.map((t) => {
                  const Icon = MODE_ICON[t.paymentMode] || Receipt;
                  const modeColor = MODE_COLOR[t.paymentMode] || 'text-gray-500';
                  return (
                    <tr key={t.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <CalendarDays size={12} className="text-gray-400" />
                          {formatDate(t.date)}
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">{t.docNo}</td>
                      <td className="table-cell">
                        <span className={t.docType === 'Invoice' ? 'badge-amber' : 'badge-green'}>
                          {t.docType === 'Invoice'
                            ? <FileText size={10} className="inline mr-1" />
                            : <Receipt size={10} className="inline mr-1" />}
                          {t.docType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <Icon size={13} className={modeColor} title={t.paymentMode} />
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500">
                        {t.chequeNo || '—'}
                      </td>
                      <td className={`table-cell text-right font-semibold font-mono text-sm ${
                        t.docType === 'Invoice' ? 'text-accent-600' : 'text-emerald-600'
                      }`}>
                        {t.docType === 'Invoice' ? '+' : '−'} Rs. {t.amount.toLocaleString()}
                      </td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}