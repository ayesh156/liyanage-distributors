import { useState, useEffect } from 'react';
import { X, User, Phone, Fingerprint, Mail, MapPin } from 'lucide-react';

function emptyForm() {
  return { name: '', phone: '', nic: '', email: '', address: '' };
}

export default function AddSalesPersonModal({ isOpen, onClose, onSave, editPerson }) {
  const [form, setForm] = useState(emptyForm());
  const isEditing = !!editPerson;

  useEffect(() => {
    if (isOpen) {
      if (editPerson) {
        setForm({
          name: editPerson.name || '',
          phone: editPerson.phone || '',
          nic: editPerson.nic || '',
          email: editPerson.email || '',
          address: editPerson.address || '',
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, editPerson]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(isEditing ? { ...form, id: editPerson.id } : form);
    onClose();
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" />
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-slate-800 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
              <User size={16} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {isEditing ? 'Edit Sales Person' : 'Add Sales Person'}
              </h3>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{String(editPerson.id).padStart(3, '0')}</p>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Full Name */}
          <div>
            <label className="input-label">
              <User size={13} className="inline mr-1 text-gray-400" /> Full Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="e.g., Kamal Perera"
              value={form.name} onChange={set('name')}
              className="input-field" required autoFocus />
          </div>

          {/* Phone + NIC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                <Phone size={13} className="inline mr-1 text-gray-400" /> Mobile Number
              </label>
              <input type="text" placeholder="077-XXXXXXX"
                value={form.phone} onChange={set('phone')}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">
                <Fingerprint size={13} className="inline mr-1 text-gray-400" /> NIC Number
              </label>
              <input type="text" placeholder="e.g., 851234567V"
                value={form.nic} onChange={set('nic')}
                className="input-field" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="input-label">
              <Mail size={13} className="inline mr-1 text-gray-400" /> Email Address
            </label>
            <input type="email" placeholder="e.g., kamal@example.com"
              value={form.email} onChange={set('email')}
              className="input-field" />
          </div>

          {/* Address */}
          <div>
            <label className="input-label">
              <MapPin size={13} className="inline mr-1 text-gray-400" /> Address
            </label>
            <textarea placeholder="e.g., 23 Temple Road, Morawaka"
              value={form.address} onChange={set('address')}
              className="input-field resize-none" rows={2} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-0 bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 transition-all shadow-sm shadow-orange-500/20">
              {isEditing ? 'Save Changes' : 'Add Sales Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}