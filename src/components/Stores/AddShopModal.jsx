import { useState, useEffect } from 'react';
import { X, Store, MapPin, Phone, Map, Trash2, AlertTriangle } from 'lucide-react';

const ROUTE_COLORS = {
  Morawaka:      'bg-emerald-100 text-emerald-700',
  Akuressa:      'bg-blue-100 text-blue-700',
  Deniyaya:      'bg-purple-100 text-purple-700',
  Urubokka:      'bg-amber-100 text-amber-700',
  Kamburupitiya: 'bg-rose-100 text-rose-700',
  Kotapola:      'bg-cyan-100 text-cyan-700',
  Hakmana:       'bg-orange-100 text-orange-700',
};

function emptyForm(routes) {
  return { name: '', route: routes[0] || '', contact: '', address: '', salesPerson: '', salesPersonPhone: '' };
}

export default function AddShopModal({ isOpen, onClose, onSave, onDelete, routes, editShop }) {
  const [form, setForm] = useState(emptyForm(routes));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = !!editShop;

  // Sync form when editShop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (editShop) {
        setForm({
          name: editShop.name || '',
          route: editShop.route || routes[0] || '',
          contact: editShop.contact || '',
          address: editShop.address || '',
          salesPerson: editShop.salesPerson || '',
          salesPersonPhone: editShop.salesPersonPhone || '',
        });
      } else {
        setForm(emptyForm(routes));
      }
      setConfirmDelete(false);
    }
  }, [isOpen, editShop, routes]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(isEditing ? { ...form, id: editShop.id } : form);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete && onDelete(editShop.id);
    onClose();
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" onClick={() => { setConfirmDelete(false); onClose(); }} />
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
          <button onClick={() => { setConfirmDelete(false); onClose(); }}
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

          {/* Route */}
          <div>
            <label className="input-label">
              <MapPin size={13} className="inline mr-1 text-gray-400" /> Route / Area
            </label>
            <div className="grid grid-cols-3 gap-2">
              {routes.map((r) => (
                <button key={r} type="button"
                  onClick={() => setForm((f) => ({ ...f, route: r }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                    form.route === r
                      ? `${ROUTE_COLORS[r] || 'bg-accent-100 text-accent-700'} border-current/60`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Contact + Address */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">
                <Phone size={13} className="inline mr-1 text-gray-400" /> Phone
              </label>
              <input type="text" placeholder="071-XXXXXXX"
                value={form.contact} onChange={set('contact')}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">Sales Person</label>
              <input type="text" placeholder="Name"
                value={form.salesPerson} onChange={set('salesPerson')}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="input-label">
              <Map size={13} className="inline mr-1 text-gray-400" /> Address
            </label>
            <textarea placeholder="e.g., 23 Galle Rd, Morawaka"
              value={form.address} onChange={set('address')}
              className="input-field resize-none" rows={2} />
          </div>

          {/* Delete confirm banner */}
          {confirmDelete && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                This will permanently delete <span className="font-semibold">{editShop?.name}</span> and all its transactions.
                Click Delete again to confirm.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {isEditing && onDelete && (
              <button type="button" onClick={handleDelete}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  confirmDelete
                    ? 'bg-red-600 text-white border-red-500 hover:bg-red-700'
                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                }`}
              >
                <Trash2 size={14} className="inline mr-1.5" />
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            <button type="button" onClick={() => { setConfirmDelete(false); onClose(); }}
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