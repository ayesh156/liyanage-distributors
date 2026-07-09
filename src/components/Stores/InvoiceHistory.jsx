import { useState, useRef, useMemo, useEffect } from 'react';
import {
  ArrowLeft, Edit3, Receipt, CalendarDays,
  Search, X, Printer, Plus, Trash2, DollarSign, Loader2,
} from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import AddInvoiceModal from './AddInvoiceModal';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import CollectPaymentModal from './CollectPaymentModal';
import PaymentHistoryDrawer from './PaymentHistoryDrawer';
import FancyDatePicker from '../ui/FancyDatePicker';
import Pagination from '../ui/Pagination';

const formatCurrency = (val) => `Rs. ${(val || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function InvoiceHistory({
  shop,
  transactions,
  outstanding,
  isHydrating,   // ← true during hard-refresh hydration window
  onBack,
  onAddTransaction,
  onUpdateInvoice,
  onDeleteTransaction,
  onPrintReceipt,
  onPrintOutstanding,
  onEditShop,
}) {
  const addPaymentToInvoice = useAppStore((s) => s.addPaymentToInvoice);
  const [editInvoiceTarget, setEditInvoiceTarget] = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [sortOrder,    setSortOrder]    = useState('newest');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Reset to page 1 whenever search, sort, or rows-per-page changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, sortOrder, rowsPerPage]);

  // Payment modals
  const [collectPaymentTarget, setCollectPaymentTarget] = useState(null);
  const [paymentHistoryTarget, setPaymentHistoryTarget] = useState(null);

  // Inline dynamic payment capture state
  const [inlinePayment, setInlinePayment] = useState(null);
  const payDateRef = useRef(null);
  const payAmountRef = useRef(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Filtered + sorted (full dataset, used for aggregate summary cards) ──
  const filtered = useMemo(() =>
    transactions
      .filter((t) => {
        const q = searchQuery.toLowerCase();
        return !q || t.docNo.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const da = new Date(a.date), db = new Date(b.date);
        return sortOrder === 'newest' ? db - da : da - db;
      }),
    [transactions, searchQuery, sortOrder]
  );

  // ── Pagination slice — compute displayed rows for the current page ──
  const paginatedTransactions = useMemo(() => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return filtered.slice(indexOfFirstRow, indexOfLastRow);
  }, [filtered, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  const handleEdit = (t) => setEditInvoiceTarget(t);

  const handleDeleteRequest = (transaction) => {
    setDeleteTarget(transaction);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    onDeleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── Inline Dynamic Payment Capture ─────────────────────────────────
  const openInlinePayment = (row) => {
    setInlinePayment({
      id: row.id,
      date: new Date().toISOString().split('T')[0],
      amount: '',
      description: '',
    });
    setTimeout(() => {
      if (payDateRef.current) payDateRef.current.focus();
    }, 100);
  };

  const handleInlinePaymentSubmit = (e) => {
    e.preventDefault();
    if (!inlinePayment) return;
    const amt = parseFloat(inlinePayment.amount);
    if (!amt || amt <= 0) return;

    const targetRow = transactions.find((t) => t.id === inlinePayment.id);
    if (!targetRow) return;
    const balanceDue = Math.max(0, (targetRow.amount || 0) - (targetRow.received || 0));
    if (amt > balanceDue) {
      alert(`Payment amount (${formatCurrency(amt)}) cannot exceed balance due (${formatCurrency(balanceDue)}).`);
      return;
    }

    addPaymentToInvoice(inlinePayment.id, {
      date: inlinePayment.date,
      amount: amt,
      paymentMode: 'cash',
      chequeNo: '',
      bankName: '',
      description: inlinePayment.description || 'Quick payment',
    });
    setInlinePayment(null);
  };

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
          <button
            onClick={() => !isHydrating && onPrintOutstanding(shop.id)}
            disabled={isHydrating}
            className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeft size={14} className="rotate-90" /> Statement
          </button>
          <button
            onClick={() => !isHydrating && onAddTransaction()}
            disabled={isHydrating}
            className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus size={14} /> Add Invoice
          </button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Total Invoiced</p>
          <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
            {formatCurrency(transactions.reduce((s, t) => s + t.amount, 0))}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">{transactions.length} invoices</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-gray-500 mb-1 dark:text-slate-400">Total Collected</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(transactions.reduce((s, t) => s + (t.received || 0), 0))}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-slate-500 mt-1">
            {transactions.reduce((s, t) => s + (t.payments?.length || 0), 0)} payments
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
              <div className="relative">
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                  className="input-field text-xs py-1.5 pr-7 appearance-none cursor-pointer">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
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
                <th className="table-header">Doc Type</th>
                <th className="table-header">Cheque / Bank</th>
                <th className="table-header text-right">Amount</th>
                <th className="table-header text-right">Received</th>
                <th className="table-header text-right">Balance Due</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="table-divide">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-gray-500 dark:text-slate-400 text-sm">
                    {isHydrating ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin text-accent-500" />
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Loading store details...</p>
                      </div>
                    ) : (
                      <>
                        <Receipt size={32} className="mx-auto mb-2 text-gray-300 dark:text-slate-600" />
                        No transactions found
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const balanceDue = Math.max(0, (t.amount || 0) - (t.received || 0));
                  const chequeDisplay = t.chequeNo
                    ? <span className="font-mono">{t.chequeNo}{t.bankName ? <span className="ml-1 text-gray-400 dark:text-slate-500">/ {t.bankName}</span> : null}</span>
                    : '—';
                  return (
                    <tr key={t.id} className="group table-body-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={12} className="text-gray-400 dark:text-slate-500" />
                          <span className="text-sm">{formatDate(t.date)}</span>
                        </div>
                      </td>
                      <td className="table-cell font-mono text-xs text-gray-500 dark:text-slate-400">{t.docNo}</td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-600 dark:text-slate-300">Invoice</span>
                      </td>
                      <td className="table-cell text-xs text-gray-500 dark:text-slate-400">{chequeDisplay}</td>
                      <td className="table-cell text-right font-semibold font-mono text-sm text-accent-600 dark:text-accent-400">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="table-cell text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(t.received || 0)}
                      </td>
                      <td className="table-cell text-right font-mono text-sm font-semibold">
                        <span className={balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {formatCurrency(balanceDue)}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Print Invoice */}
                          <button onClick={() => onPrintReceipt(t)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                            title="Print Invoice">
                            <Printer size={13} />
                          </button>

                          {/* Collect Payment — only if balanceDue > 0 */}
                          {balanceDue > 0 && (
                            <button
                              onClick={() => openInlinePayment(t)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-all dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                              title="Collect Payment"
                            >
                              <DollarSign size={13} />
                            </button>
                          )}

                          {/* View Payment History */}
                          <button
                            onClick={() => setPaymentHistoryTarget(t)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                            title="View Payment History"
                          >
                            <Receipt size={13} />
                          </button>

                          <button onClick={() => handleEdit(t)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                            title="Edit">
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(t)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Delete"
                          >
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

        {/* Pagination Footer — conditionally rendered when data exceeds rowsPerPage */}
        {filtered.length > rowsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        )}
      </div>

      {/* ── Inline Dynamic Payment Capture ────────────────────────── */}
      {inlinePayment && (() => {
        const targetRow = transactions.find((t) => t.id === inlinePayment.id);
        const rowBalanceDue = targetRow ? Math.max(0, (targetRow.amount || 0) - (targetRow.received || 0)) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Quick Collect Payment</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 dark:text-slate-400">{targetRow?.docNo || ''} — Balance Due: {formatCurrency(rowBalanceDue)}</p>
                </div>
                <button onClick={() => setInlinePayment(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-slate-700">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleInlinePaymentSubmit} className="p-5 space-y-4">
                <div>
                  <FancyDatePicker
                    value={inlinePayment.date}
                    onChange={(val) => setInlinePayment((p) => ({ ...p, date: val.target ? val.target.value : val }))}
                    label="Date"
                  />
                </div>
                <div>
                  <label className="input-label">Amount (Rs.)</label>
                  <input ref={payAmountRef} type="number" placeholder="0.00" min="1" step="0.01"
                    value={inlinePayment.amount}
                    onChange={(e) => setInlinePayment((p) => ({ ...p, amount: e.target.value }))}
                    className="input-field" required />
                </div>
                <div>
                  <label className="input-label">Description</label>
                  <input type="text" placeholder="e.g., Over-the-counter payment"
                    value={inlinePayment.description}
                    onChange={(e) => setInlinePayment((p) => ({ ...p, description: e.target.value }))}
                    className="input-field" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setInlinePayment(null)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">
                    <DollarSign size={14} className="inline mr-1.5" /> Collect Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Invoice via unified AddInvoiceModal (edit mode) ── */}
      <AddInvoiceModal
        isOpen={!!editInvoiceTarget}
        onClose={() => setEditInvoiceTarget(null)}
        onSave={(data) => {
          if (data.id) {
            // Edit mode: call update handler
            onUpdateInvoice(data.id, {
              docNo: data.docNo,
              date: data.date,
              amount: data.amount,
              received: data.received,
              description: data.description,
              salesPerson: data.salesPerson,
              chequeNo: data.chequeNo,
            });
          }
          setEditInvoiceTarget(null);
        }}
        shopName={shop?.name}
        shopSalesPerson={shop?.salesPerson}
        editInvoice={editInvoiceTarget}
      />

      {/* ── Collect Payment Modal (fallback) ──────────────────────── */}
      <CollectPaymentModal
        isOpen={!!collectPaymentTarget}
        onClose={() => setCollectPaymentTarget(null)}
        onSave={(paymentData) => {
          addPaymentToInvoice(paymentData.invoiceId, {
            date: paymentData.date,
            amount: paymentData.amount,
            paymentMode: paymentData.paymentMode,
            chequeNo: paymentData.chequeNo,
            bankName: paymentData.bankName,
            description: paymentData.description,
          });
        }}
        invoice={collectPaymentTarget}
      />

      {/* ── Payment History Drawer ─────────────────────────────── */}
      <PaymentHistoryDrawer
        isOpen={!!paymentHistoryTarget}
        onClose={() => setPaymentHistoryTarget(null)}
        invoice={paymentHistoryTarget}
      />

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        entityType={deleteTarget?.docType === 'Invoice' ? 'invoice' : 'payment'}
        entityName={deleteTarget?.docNo || ''}
        extraMessage={
          deleteTarget
            ? `This will permanently remove transaction ${deleteTarget.docNo} from ${shop?.name}'s history.`
            : null
        }
      />
    </div>
  );
}