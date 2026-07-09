import { useState } from 'react';
import {
  ArrowLeft, Edit3, FileText, Receipt, CalendarDays,
  Search, X, Printer, Download, Plus, Trash2, Banknote,
  CreditCard, Building2, ChevronDown,
} from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const formatCurrency = (val) => `Rs. ${(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const PAYMENT_MODE_META = {
  cash:   { label: 'Cash',         icon: Banknote,   color: 'badge-green'  },
  cheque: { label: 'Cheque',       icon: CreditCard, color: 'badge-blue'   },
  check:  { label: 'Direct Check', icon: Building2,  color: 'badge-purple' },
  credit: { label: 'Credit',       icon: FileText,   color: 'badge-amber'  },
};

function PaymentModeBadge({ mode }) {
  const meta = PAYMENT_MODE_META[mode] || { label: mode || '—', icon: Receipt, color: 'badge' };
  const Icon = meta.icon;
  return (
    <span className={`${meta.color} text-xs`}>
      <Icon size={10} className="inline mr-1" />
      {meta.label}
    </span>
  );
}

export default function InvoiceHistory({
  shop,
  transactions,
  outstanding,
  onBack,
  onAddTransaction,
  onUpdateInvoice,
  onDeleteTransaction,
  onPrintReceipt,
  onPrintOutstanding,
  onEditShop,
}) {
  const bankNames = useAppStore((s) => s.bankNames);
  const [editModal,    setEditModal]    = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [sortOrder,    setSortOrder]    = useState('newest');
  const [typeFilter,   setTypeFilter]   = useState('all'); // 'all' | 'Invoice' | 'Payment'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtered = transactions
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchQ = !q || t.docNo.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || t.docType === typeFilter;
      return matchQ && matchType;
    })
    .sort((a, b) => {
      const da = new Date(a.date), db = new Date(b.date);
      return sortOrder === 'newest' ? db - da : da - db;
    });

  const handleEdit = (t) => setEditModal({
    id: t.id, docNo: t.docNo, date: t.date, docType: t.docType,
    amount: t.amount, salesPerson: t.salesPerson || '',
    salesPersonPhone: t.salesPersonPhone || '',
    paymentMode: t.paymentMode || 'cash',
    chequeNo: t.chequeNo || '', bankName: t.bankName || '',
    route: t.route || '', description: t.description || '',
  });

  const handleSaveEdit = () => {
    if (editModal) {
      onUpdateInvoice(editModal.id, {
        salesPerson: editModal.salesPerson,
        salesPersonPhone: editModal.salesPersonPhone,
        paymentMode: editModal.paymentMode,
        chequeNo: editModal.chequeNo,
        bankName: editModal.bankName,
        route: editModal.route,
        description: editModal.description,
      });
      setEditModal(null);
    }
  };

  const handleDelete = (id) => {
    if (confirmDeleteId === id) { onDeleteTransaction(id); setConfirmDeleteId(null); }
    else setConfirmDeleteId(id);
  };

  const em = (field) => (e) => setEditModal((m) => ({ ...m, [field]: e.target.value }));

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost p-2 -ml-2">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{shop?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Route: <span className="text-accent-600 dark:text-accent-400">{shop?.route}</span>
              <span className="mx-2 text-gray-300 dark:text-slate-600">|</span>
              {shop?.contact}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEditShop && (
            <button onClick={onEditShop} className="btn-ghost text-xs px-3 py-2">
              <Edit3 size={13} /> Edit Shop
            </button>
          )}
          <button onClick={() => onPrintOutstanding(shop.id)} className="btn-secondary text-xs">
            <Download size={14} /> Statement
          </button>
          <button onClick={onAddTransaction} className="btn-primary text-xs">
            <Plus size={14} /> Add Entry
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Total Invoiced</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {formatCurrency(transactions.filter((t) => t.docType === 'Invoice').reduce((s, t) => s + t.amount, 0))}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">
            {transactions.filter((t) => t.docType === 'Invoice').length} invoices
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Total Collected</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(transactions.filter((t) => t.docType === 'Payment').reduce((s, t) => s + t.amount, 0))}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">
            {transactions.filter((t) => t.docType === 'Payment').length} payments
          </p>
        </div>
        <div className="glass-card p-4 bg-gradient-to-br from-accent-50 to-accent-100/50 border-accent-200 dark:from-accent-900/20 dark:to-accent-800/10 dark:border-accent-700">
          <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Outstanding Balance</p>
          <p className={`text-lg font-bold ${outstanding > 0 ? 'text-accent-600 dark:text-accent-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {outstanding > 0 ? formatCurrency(outstanding) : 'Rs. 0 — Cleared'}
          </p>
        </div>
      </div>

      {/* ── Transactions Table ─────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Transaction History</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Type filter */}
              <div className="flex gap-1">
                {['all', 'Invoice', 'Payment'].map((t) => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      typeFilter === t
                        ? 'bg-accent-100 text-accent-700 border border-accent-200 dark:bg-accent-900/30 dark:text-accent-300 dark:border-accent-700'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                    }`}
                  >{t === 'all' ? 'All' : t}</button>
                ))}
              </div>
              {/* Sort */}
              <div className="relative">
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                  className="input-field text-xs py-1.5 pr-7 appearance-none cursor-pointer">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Doc no / desc..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-8 text-xs py-1.5 w-40" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header-row">
                <th className="table-header">Date</th>
                <th className="table-header">Doc No</th>
                <th className="table-header">Type</th>
                <th className="table-header">Mode</th>
                <th className="table-header">Cheque / Bank</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="table-divide">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-gray-500 dark:text-slate-400 text-sm">
                    <Receipt size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isInvoice = t.docType === 'Invoice';
                  const isDeleting = confirmDeleteId === t.id;
                  return (
                    <tr key={t.id} className={`group table-body-row ${isDeleting ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={12} className="text-gray-400 dark:text-slate-500" />
                          <span className="text-sm">{formatDate(t.date)}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500 dark:text-slate-400">{t.docNo}</td>
                      <td className="table-cell">
                        <span className={isInvoice ? 'badge-amber' : 'badge-green'}>
                          {isInvoice ? <FileText size={10} className="inline mr-1" /> : <Receipt size={10} className="inline mr-1" />}
                          {t.docType}
                        </span>
                      </td>
                      <td className="table-cell">
                        <PaymentModeBadge mode={t.paymentMode} />
                      </td>
                      <td className="table-cell text-xs text-gray-500 dark:text-slate-400">
                        {t.chequeNo
                          ? <span className="font-mono">{t.chequeNo}{t.bankName ? <span className="ml-1 text-gray-400 dark:text-slate-500">/ {t.bankName}</span> : null}</span>
                          : '—'}
                      </td>
                      <td className={`table-cell text-right font-semibold font-mono text-sm ${
                        isInvoice ? 'text-accent-600 dark:text-accent-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isInvoice ? '+' : '−'} {formatCurrency(t.amount)}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(t)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            title="Edit">
                            <Edit3 size={13} />
                          </button>
                          {isInvoice && (
                            <button onClick={() => onPrintReceipt(t)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                              title="Print Receipt">
                              <Printer size={13} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(t.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              isDeleting
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                : 'hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                            }`}
                            title={isDeleting ? 'Click again to confirm' : 'Delete'}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Edit {editModal.docType}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5 dark:text-slate-400">{editModal.docNo}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Date</label>
                  <input type="text" value={formatDate(editModal.date)} readOnly
                    className="input-field bg-gray-50 text-gray-500 cursor-not-allowed text-sm dark:bg-slate-700 dark:text-slate-400" />
                </div>
                <div>
                  <label className="input-label">Amount</label>
                  <input type="text" value={formatCurrency(editModal.amount)} readOnly
                    className="input-field bg-gray-50 text-gray-500 cursor-not-allowed text-sm dark:bg-slate-700 dark:text-slate-400" />
                </div>
              </div>

              {editModal.docType === 'Payment' && (
                <>
                  <div>
                    <label className="input-label">Payment Mode</label>
                    <select value={editModal.paymentMode} onChange={em('paymentMode')} className="input-field">
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="check">Direct Check</option>
                    </select>
                  </div>
                  {(editModal.paymentMode === 'cheque' || editModal.paymentMode === 'check') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">Cheque / Check No</label>
                        <input type="text" placeholder="e.g., CHQ-458401"
                          value={editModal.chequeNo} onChange={em('chequeNo')} className="input-field" />
                      </div>
                      <div>
                        <label className="input-label">Bank Branch</label>
                        <select value={editModal.bankName} onChange={em('bankName')} className="input-field">
                          <option value="">— Select Bank —</option>
                          {bankNames.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {editModal.docType === 'Invoice' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Sales Person</label>
                      <input type="text" value={editModal.salesPerson} onChange={em('salesPerson')}
                        className="input-field" placeholder="Name" />
                    </div>
                    <div>
                      <label className="input-label">Phone</label>
                      <input type="text" value={editModal.salesPersonPhone} onChange={em('salesPersonPhone')}
                        className="input-field" placeholder="077-XXXXXXX" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="input-label">Description</label>
                <input type="text" value={editModal.description} onChange={em('description')}
                  className="input-field" placeholder="Optional description" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-slate-700">
              <button onClick={() => setEditModal(null)} className="btn-ghost text-sm px-4 py-2">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary text-sm px-6 py-2">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}