import { useState, useEffect } from 'react';
import { X, FileText, Receipt, CalendarDays, DollarSign, CreditCard, Banknote, Building2, Hash, ChevronDown } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash',         icon: Banknote,   color: 'emerald' },
  { value: 'cheque', label: 'Cheque',        icon: CreditCard, color: 'blue'    },
  { value: 'check',  label: 'Direct Check',  icon: Building2,  color: 'purple'  },
];

const modeColors = {
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blue:    'bg-blue-100 text-blue-700 border-blue-200',
  purple:  'bg-purple-100 text-purple-700 border-purple-200',
};
const modeColorsInactive = 'bg-white text-gray-500 border-gray-200 hover:border-gray-300';

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
  const bankNames = useAppStore((s) => s.bankNames);
  const routes    = useAppStore((s) => s.routes);
  const [form, setForm] = useState(emptyForm());

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) setForm(emptyForm());
  }, [isOpen]);

  if (!isOpen) return null;

  const needsChequeFields =
    form.docType === 'Payment' && (form.paymentMode === 'cheque' || form.paymentMode === 'check');

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
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
            {shopName && <p className="text-xs text-gray-500 mt-0.5">{shopName}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Doc Type Toggle */}
          <div>
            <label className="input-label">Document Type</label>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, docType: 'Invoice' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.docType === 'Invoice'
                    ? 'bg-accent-100 text-accent-700 border-accent-200'
                    : modeColorsInactive
                }`}
              >
                <FileText size={16} /> Invoice
              </button>
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, docType: 'Payment', paymentMode: 'cash' }))}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  form.docType === 'Payment'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
              <label className="input-label">
                <CalendarDays size={13} className="inline mr-1 text-gray-400" /> Date
              </label>
              <input type="date" value={form.date} onChange={set('date')}
                className="input-field" required />
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
                <div className="relative">
                  <select value={form.bankName} onChange={set('bankName')} className="input-field appearance-none pr-8">
                    <option value="">— Select Bank —</option>
                    {bankNames.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
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
                <div className="relative">
                  <select value={form.route} onChange={set('route')} className="input-field appearance-none pr-8">
                    <option value="">— Select Route —</option>
                    {routes.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
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
  );
}