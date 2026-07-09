import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, Receipt, Banknote, CreditCard, Building2, Hash, CalendarDays } from 'lucide-react';
import FancyDatePicker from '../ui/FancyDatePicker';
import SmartCombobox from '../ui/SmartCombobox';
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

const formatCurrency = (val) => `Rs. ${(val || 0).toLocaleString('en-US')}`;

export default function CollectPaymentModal({ isOpen, onClose, onSave, invoice }) {
  const bankNames = useAppStore((s) => s.bankNames);
  const bankOptions = useMemo(() => bankNames.map((b) => ({ value: b, label: b })), [bankNames]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setAmount('');
      setPaymentMode('cash');
      setChequeNo('');
      setBankName('');
      setDescription('');
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const balanceDue = Math.max(0, (invoice.amount || 0) - (invoice.received || 0));
  const needsChequeFields = paymentMode === 'cheque' || paymentMode === 'check';

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (amt > balanceDue) {
      alert(`Payment amount (${formatCurrency(amt)}) cannot exceed the balance due (${formatCurrency(balanceDue)}).`);
      return;
    }

    onSave({
      invoiceId: invoice.id,
      date,
      amount: amt,
      paymentMode,
      chequeNo: needsChequeFields ? chequeNo.trim() : '',
      bankName: needsChequeFields ? bankName.trim() : '',
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" />
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl max-h-[90vh] overflow-visible flex flex-col dark:bg-slate-800 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              <Receipt size={15} className="inline mr-1.5 text-emerald-500" />
              Collect Payment
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5 dark:text-slate-400">
              {invoice.docNo} · Balance Due: {formatCurrency(balanceDue)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
              <input type="number" placeholder="0.00" min="0.01" step="0.01" max={balanceDue}
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="input-field" required />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Max: {formatCurrency(balanceDue)}
              </p>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="input-label">Payment Mode</label>
              <div className="flex gap-2">
                {PAYMENT_MODES.map(({ value, label, icon: Icon, color }) => (
                  <button key={value} type="button"
                    onClick={() => { setPaymentMode(value); if (value === 'cash') { setChequeNo(''); setBankName(''); } }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      paymentMode === value ? modeColors[color] : modeColorsInactive
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cheque/Check fields */}
            {needsChequeFields && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">
                    <Hash size={13} className="inline mr-1 text-gray-400" />
                    {paymentMode === 'check' ? 'Check No' : 'Cheque No'}
                  </label>
                  <input type="text" placeholder="e.g., CHQ-458401"
                    value={chequeNo} onChange={(e) => setChequeNo(e.target.value)}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">
                    <Building2 size={13} className="inline mr-1 text-gray-400" /> Bank Branch
                  </label>
                  <SmartCombobox
                    value={bankName}
                    onSelect={(opt) => setBankName(opt.value)}
                    options={bankOptions}
                    placeholder="Filter by bank..."
                    dropdownMaxHeight="max-h-48"
                    portal
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="input-label">Description / Reference</label>
              <input type="text" placeholder="e.g., Partial payment for invoice"
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="input-field" />
            </div>

            {/* Summary */}
            {parseFloat(amount) > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3 dark:from-emerald-900/20 dark:to-green-900/10 dark:border-emerald-700">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500 dark:text-slate-400">
                    <span>Previous Received</span>
                    <span className="font-mono">{formatCurrency(invoice.received || 0)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-300 font-medium">
                    <span>This Payment</span>
                    <span className="font-mono">+ {formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-1 flex justify-between font-bold text-gray-900 dark:text-slate-100">
                    <span>New Total Received</span>
                    <span className="font-mono">{formatCurrency((invoice.received || 0) + (parseFloat(amount) || 0))}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                    <span>New Balance Due</span>
                    <span className="font-mono">{formatCurrency(Math.max(0, balanceDue - (parseFloat(amount) || 0)))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
                <Receipt size={14} className="inline mr-1.5" /> Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}