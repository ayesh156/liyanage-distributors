import { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Receipt, User, Hash } from 'lucide-react';
import FancyDatePicker from '../ui/FancyDatePicker';
import SalesPersonSearchSelect from '../ui/SalesPersonSearchSelect';
import useAppStore from '../../hooks/useAppStore';

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `Rs. ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AddInvoiceModal({ isOpen, onClose, onSave, shopName, shopSalesPerson, editInvoice }) {
  const bankNames = useAppStore((s) => s.bankNames);
  const invoices = useAppStore((s) => s.invoices);
  const routes = useAppStore((s) => s.routes);

  const [docNo, setDocNo] = useState('');
  const [amount, setAmount] = useState('');
  const [alreadyReceived, setAlreadyReceived] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesPerson, setSalesPerson] = useState(shopSalesPerson || '');
  const [description, setDescription] = useState('');
  const [chequeNo, setChequeNo] = useState('');

  const isEditMode = !!editInvoice;

  // Reset or pre-populate form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (editInvoice) {
        // Edit mode: pre-populate fields from the invoice data
        setDocNo(editInvoice.docNo || '');
        setAmount(editInvoice.amount ? String(editInvoice.amount) : '');
        setAlreadyReceived(editInvoice.received ? String(editInvoice.received) : '');
        setDate(editInvoice.date || new Date().toISOString().split('T')[0]);
        setSalesPerson(editInvoice.salesPerson || shopSalesPerson || '');
        setDescription(editInvoice.description || '');
        setChequeNo(editInvoice.chequeNo || '');
      } else {
        // Add mode: reset to defaults
        setDocNo('');
        setAmount('');
        setAlreadyReceived('');
        setDate(new Date().toISOString().split('T')[0]);
        setSalesPerson(shopSalesPerson || '');
        setDescription('');
        setChequeNo('');
      }
    }
  }, [isOpen, shopSalesPerson, editInvoice]);

  // Live due balance computation
  const dueBalance = (() => {
    const amt = parseFloat(amount) || 0;
    const rec = parseFloat(alreadyReceived) || 0;
    return Math.max(0, amt - rec);
  })();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    const payload = {
      docNo: docNo.trim(),
      date,
      amount: amt,
      received: parseFloat(alreadyReceived) || 0,
      description: description.trim(),
      salesPerson: salesPerson.trim(),
      chequeNo: chequeNo.trim(),
      route: '', // Inferred from parent shop context
    };

    if (isEditMode) {
      // In edit mode, include the id so the handler knows which invoice to update
      payload.id = editInvoice.id;
    }

    onSave(payload);
    onClose();
  };

  const title = isEditMode ? 'Update Invoice' : 'Add Invoice';
  const submitLabel = isEditMode ? 'Update Invoice' : 'Add Invoice';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" />
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[90vh] overflow-visible flex flex-col dark:bg-slate-800 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10 dark:bg-slate-800 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
            {shopName && <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">{shopName}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Document No — editable text input */}
            <div>
              <label className="input-label">
                <FileText size={13} className="inline mr-1 text-gray-400" /> Document No
              </label>
              <input type="text" placeholder="e.g., INV-2026-001"
                value={docNo} onChange={(e) => setDocNo(e.target.value)}
                className="input-field font-mono font-semibold" required />
            </div>

            {/* Date */}
            <div>
              <FancyDatePicker
                value={date}
                onChange={(val) => setDate(val)}
                label="Date"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="input-label">
                <DollarSign size={13} className="inline mr-1 text-gray-400" /> Amount (Rs.)
              </label>
              <input type="number" placeholder="0.00" min="1" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" required />
            </div>

            {/* Already Received */}
            <div>
              <label className="input-label">
                <Receipt size={13} className="inline mr-1 text-gray-400" /> Already Received (Rs.)
              </label>
              <input type="number" placeholder="0.00" min="0" step="0.01"
                value={alreadyReceived} onChange={(e) => setAlreadyReceived(e.target.value)}
                className="input-field" />
              <p className="text-[10px] text-gray-400 mt-0.5">Default: 0 if nothing collected yet.</p>
            </div>

            {/* Cheque No */}
            <div>
              <label className="input-label">
                <Hash size={13} className="inline mr-1 text-gray-400" /> Cheque No
              </label>
              <input type="text" placeholder="e.g., CHQ-458401 (optional)"
                value={chequeNo} onChange={(e) => setChequeNo(e.target.value)}
                className="input-field" />
              <p className="text-[10px] text-gray-400 mt-0.5">Optional cheque reference number.</p>
            </div>

            {/* Live Due Balance */}
            {(parseFloat(amount) || 0) > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 dark:from-amber-900/20 dark:to-orange-900/10 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Due Balance</span>
                  <span className={`text-lg font-bold font-mono ${dueBalance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatCurrency(dueBalance)}
                  </span>
                </div>
                <div className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5">
                  {formatCurrency(parseFloat(amount) || 0)} − {formatCurrency(parseFloat(alreadyReceived) || 0)} = {formatCurrency(dueBalance)}
                </div>
              </div>
            )}

            {/* Sales Person — Auto-inferred from shop, search-select */}
            <div>
              <label className="input-label">
                <User size={13} className="inline mr-1 text-gray-400" /> Sales Person
              </label>
              <SalesPersonSearchSelect
                value={salesPerson}
                onSelect={(val) => setSalesPerson(val)}
                placeholder="Search & select a sales person..."
              />
              {shopSalesPerson && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Default assigned: <span className="font-medium text-gray-500 dark:text-slate-300">{shopSalesPerson}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="input-label">Description</label>
              <input type="text" placeholder="e.g., Wiring supplies & cables"
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="input-field" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">
                <FileText size={14} className="inline mr-1.5" /> {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}