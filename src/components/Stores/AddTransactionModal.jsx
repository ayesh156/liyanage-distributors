import { useState, useEffect, useMemo } from 'react';
import { X, FileText, Receipt, CalendarDays, DollarSign, CreditCard, Banknote, Building2, Hash } from 'lucide-react';
import SmartCombobox from '../ui/SmartCombobox';
import FancyDatePicker from '../ui/FancyDatePicker';
import useAppStore from '../../hooks/useAppStore';

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash',         icon: Banknote,   color: 'emerald' },
  { value: 'cheque', label: 'Cheque',        icon: CreditCard, color: 'blue'    },
  { value: 'check',  label: 'Direct Check',  icon: Building2,  color: 'purple'  },
];

const modeColors = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  blue:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
  purple:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
};
const modeColorsInactive = 'bg-white text-slate-800 border-slate-200 hover:bg-gray-50 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600';

function emptyForm() {
  return {
    date: new Date().toISOString().split('T')[0],
    docType: 'Invoice',
    amount: '',
    paymentMode: 'cash',
    chequeNo: '',
    bankName: '',
    description: '',
    salesPerson: '',
    salesPersonPhone: '',
    route: '',
  };
}

export default function AddTransactionModal({ isOpen, onClose, onSave, shopName }) {
  /* ─── ALL REACT HOOKS AT THE ABSOLUTE TOP (Rules of Hooks compliance) ─── */
  const bankNames = useAppStore((s) => s.bankNames);
  const routes    = useAppStore((s) => s.routes);
  const [form, setForm] = useState(emptyForm());

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) setForm(emptyForm());
  }, [isOpen]);

  const routeOptions = useMemo(() => routes.map((r) => ({ value: r, label: r })), [routes]);
  const bankOptions  = useMemo(() => bankNames.map((b) => ({ value: b, label: b })), [bankNames]);

  /* ─── EARLY RETURN (AFTER all hooks — order is now stable) ─── */
  if (!isOpen) return null;

  /* ─── DERIVED STATE / HANDLERS ─── */
  const needsChequeFields =
    form.docType === 'Payment' &&
    (form.paymentMode === 'cheque' || form.paymentMode === 'check');

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    onSave({
      date: form.date,
      docType: form.docType,
      amount,
      paymentMode: form.docType === 'Invoice' ? 'credit' : form.paymentMode,
      chequeNo: needsChequeFields ? form.chequeNo.trim() : '',
      bankName: needsChequeFields ? form.bankName.trim() : '',
      description: form.description.trim(),
      salesPerson: form.docType === 'Invoice' ? form.salesPerson.trim() : '',
      salesPersonPhone: form.docType === 'Invoice' ? form.salesPersonPhone.trim() : '',
      route: form.docType === 'Invoice' ? form.route : '',
    });
    onClose();
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[90vh] overflow-visible flex flex-col dark:bg-slate-800 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10 dark:bg-slate-800 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Add Transaction</h3>
            {shopName && <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">{shopName}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Doc Type Toggle */}
          <div>
            <label className="input-label">Document Type</label>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, docType: 'Invoice' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.docType === 'Invoice'
                    ? 'bg-accent-100 text-accent-700 border-accent-200 dark:bg-accent-900/40 dark:text-accent-300 dark:border-accent-700'
                    : modeColorsInactive
                }`}
              >
                <FileText size={16} /> Invoice
              </button>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, docType: 'Payment', paymentMode: 'cash' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.docType === 'Payment'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700'
                    : modeColorsInactive
                }`}
              >
                <Receipt size={16} /> Payment / Receipt
              </button>
            </div>
          </div>

          {/* Payment Mode — only when Payment selected */}
          {form.docType === 'Payment' && (
            <div>
              <label className="input-label">Payment Mode</label>
              <div className="flex gap-2">
                {PAYMENT_MODES.map(({ value, label, icon: Icon, color }) => (
                  <button key={value} type="button"
                    onClick={() => setForm((f) => ({ ...f, paymentMode: value }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.paymentMode === value ? modeColors[color] : modeColorsInactive
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FancyDatePicker
                value={form.date}
                onChange={set('date')}
                label="Date"
              />
            </div>
            <div>
              <label className="input-label">
                <DollarSign size={13} className="inline mr-1 text-gray-400" /> Amount (Rs.)
              </label>
              <input type="number" placeholder="0.00" min="1" step="0.01"
                value={form.amount} onChange={set('amount')}
                className="input-field" required />
            </div>
          </div>

          {/* Cheque / Check fields */}
          {needsChequeFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">
                  <Hash size={13} className="inline mr-1 text-gray-400" />
                  {form.paymentMode === 'check' ? 'Check No' : 'Cheque No'}
                </label>
                <input type="text" placeholder="e.g., CHQ-458401"
                  value={form.chequeNo} onChange={set('chequeNo')}
                  className="input-field" />
              </div>
              <div>
                <label className="input-label">
                  <Building2 size={13} className="inline mr-1 text-gray-400" /> Bank Branch
                </label>
                <SmartCombobox
                  value={form.bankName}
                  onSelect={(opt) => setForm((f) => ({ ...f, bankName: opt.value }))}
                  options={bankOptions}
                  placeholder="Filter by route..."
                  dropdownMaxHeight="max-h-48"
                  portal
                />
              </div>
            </div>
          )}

          {/* Invoice extra fields */}
          {form.docType === 'Invoice' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Sales Person</label>
                  <input type="text" placeholder="e.g., Kamal Perera"
                    value={form.salesPerson} onChange={set('salesPerson')}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">Sales Person Phone</label>
                  <input type="text" placeholder="077-XXXXXXX"
                    value={form.salesPersonPhone} onChange={set('salesPersonPhone')}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="input-label">Route</label>
                <SmartCombobox
                  value={form.route}
                  onSelect={(opt) => setForm((f) => ({ ...f, route: opt.value }))}
                  options={routeOptions}
                  placeholder="Filter by route..."
                  dropdownMaxHeight="max-h-48"
                  portal
                  dropdownPosition="top"
                />
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="input-label">Description</label>
            <input type="text" placeholder="e.g., Wiring supplies & cables"
              value={form.description} onChange={set('description')}
              className="input-field" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              Add {form.docType}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}