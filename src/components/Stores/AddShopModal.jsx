import { useState, useEffect } from 'react';
import { X, Store, MapPin, Phone, Map, Route } from 'lucide-react';
import RouteSearchSelect from '../ui/RouteSearchSelect';
import SalesPersonSearchSelect from '../ui/SalesPersonSearchSelect';

function emptyForm() {
  return { name: '', route: '', contact: '', address: '', salesPerson: '' };
}

export default function AddShopModal({ isOpen, onClose, onSave, routes, editShop }) {
  const [form, setForm] = useState(emptyForm());
  const isEditing = !!editShop;

  // Sync form when editShop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editShop) {
        setForm({
          name: editShop.name || '',
          route: editShop.route || '',
          contact: editShop.contact || '',
          address: editShop.address || '',
          salesPerson: editShop.salesPerson || '',
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, editShop]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(isEditing ? { ...form, id: editShop.id } : form);
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
            <div className="w-9 h-9 rounded-xl bg-accent-100 flex items-center justify-center">
              <Store size={16} className="text-accent-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {isEditing ? 'Edit Hardware Store' : 'Register New Store'}
              </h3>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{String(editShop.id).padStart(3, '0')}</p>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Shop Name */}
          <div>
            <label className="input-label">
              <Store size={13} className="inline mr-1 text-gray-400" /> Shop Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="e.g., Shanthi Electricals"
              value={form.name} onChange={set('name')}
              className="input-field" required autoFocus />
          </div>

          {/* Route — Premium Floating Search Select */}
          <div>
            <label className="input-label">
              <Route size={13} className="inline mr-1 text-gray-400" /> Route / Area
            </label>
            <RouteSearchSelect
              value={form.route}
              onSelect={(val) => setForm((f) => ({ ...f, route: val }))}
              placeholder="Search & select a route..."
              dropdownPosition="top"
            />
          </div>

          {/* Contact — single field */}
          <div>
            <label className="input-label">
              <Phone size={13} className="inline mr-1 text-gray-400" /> Phone
            </label>
            <input type="text" placeholder="071-XXXXXXX"
              value={form.contact} onChange={set('contact')}
              className="input-field" />
          </div>

          {/* Sales Person — Premium Search Select Only */}
          <div>
            <label className="input-label">
              <Store size={13} className="inline mr-1 text-gray-400" /> Sales Person
            </label>
            <SalesPersonSearchSelect
              value={form.salesPerson}
              onSelect={(val) => setForm((f) => ({ ...f, salesPerson: val }))}
              placeholder="Search & select a sales person..."
              dropdownPosition="top"
            />
          </div>

          <div>
            <label className="input-label">
              <Map size={13} className="inline mr-1 text-gray-400" /> Address
            </label>
            <textarea placeholder="e.g., 23 Galle Rd, Morawaka"
              value={form.address} onChange={set('address')}
              className="input-field resize-none" rows={2} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {isEditing ? 'Save Changes' : 'Register Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}