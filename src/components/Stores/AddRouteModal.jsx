import { useState, useEffect } from 'react';
import { X, Route, Map, CalendarDays, Plus, X as XIcon } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function emptyForm() {
  return { name: '', description: '', routeDates: [] };
}

export default function AddRouteModal({ isOpen, onClose, onSave, editRoute }) {
  const [form, setForm] = useState(emptyForm());
  const isEditing = !!editRoute;

  useEffect(() => {
    if (isOpen) {
      if (editRoute) {
        setForm({
          name: editRoute.name || '',
          description: editRoute.description || '',
          routeDates: [...(editRoute.routeDates || [])],
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [isOpen, editRoute]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(isEditing ? { ...form, id: editRoute.id } : form);
    onClose();
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      routeDates: f.routeDates.includes(day)
        ? f.routeDates.filter((d) => d !== day)
        : [...f.routeDates, day],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm dark:bg-gray-900/40" />
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-slate-800 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Route size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                {isEditing ? 'Edit Route' : 'Add New Route'}
              </h3>
              {isEditing && (
                <p className="text-xs text-gray-500 mt-0.5 font-mono">#{String(editRoute.id).padStart(3, '0')}</p>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Route Name */}
          <div>
            <label className="input-label">
              <Route size={13} className="inline mr-1 text-gray-400" /> Route Name <span className="text-red-500">*</span>
            </label>
            <input type="text" placeholder="e.g., Morawaka, Akuressa"
              value={form.name} onChange={set('name')}
              className="input-field" required autoFocus />
          </div>

          {/* Description / Area Coverage */}
          <div>
            <label className="input-label">
              <Map size={13} className="inline mr-1 text-gray-400" /> Area / Address Coverage
            </label>
            <textarea placeholder="e.g., Main town area, Galle Road junction shops"
              value={form.description} onChange={set('description')}
              className="input-field resize-none" rows={2} />
          </div>

          {/* Delivery Schedule — Multi-select Day Tags */}
          <div>
            <label className="input-label">
              <CalendarDays size={13} className="inline mr-1 text-gray-400" /> Delivery Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = form.routeDates.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:border-slate-500'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isSelected ? <XIcon size={11} /> : <Plus size={11} />}
                      {day.slice(0, 3)}
                    </span>
                  </button>
                );
              })}
            </div>
            {form.routeDates.length > 0 && (
              <p className="text-xs text-gray-500 mt-1.5 dark:text-slate-400">
                Selected: <span className="font-medium text-orange-600 dark:text-orange-400">{form.routeDates.join(', ')}</span>
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" style={{ background: 'rgb(249 115 22)', backgroundColor: 'rgb(249 115 22)' }}>
              {isEditing ? 'Save Changes' : 'Add Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}