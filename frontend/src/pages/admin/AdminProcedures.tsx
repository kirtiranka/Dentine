import React, { useState, useMemo } from 'react';
import type { Procedure } from '../../types/admin';
import { useProcedures, useSaveProcedure } from '../../hooks/useAdmin';
import { useClinicId } from '../../hooks/useSession';

export const AdminProcedures: React.FC = () => {
  const clinicId = useClinicId();
  const { data: procedures, isLoading } = useProcedures(clinicId);
  const saveProcedure = useSaveProcedure(clinicId);

  const [editingProc, setEditingProc] = useState<Partial<Procedure> | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    procedures?.forEach((p) => {
      if (p.type) set.add(p.type);
    });
    return Array.from(set).sort();
  }, [procedures]);

  const filteredProcedures = useMemo(() => {
    if (!procedures) return [];
    if (filterType === 'all') return procedures;
    return procedures.filter((p) => p.type === filterType);
  }, [procedures, filterType]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProc?.name?.trim()) return;

    await saveProcedure.mutateAsync({
      id: editingProc.id,
      name: editingProc.name,
      type: editingProc.type || null,
      cost: Number(editingProc.cost) || 0,
    });
    setEditingProc(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Clinic Procedure Master</h2>
          <p className="text-xs text-slate-500">Standardized treatments, categories, and base fee schedule.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEditingProc({ name: '', type: 'General', cost: 1000 })}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
          >
            + Add Procedure
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
          Loading procedures...
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Procedure Name</th>
                <th className="py-2.5 px-4">Category / Specialty</th>
                <th className="py-2.5 px-4 text-right">Standard Fee (₹)</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcedures.map((proc) => (
                <tr key={proc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{proc.name}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200">
                      {proc.type || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{Number(proc.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingProc(proc)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Procedure Modal */}
      {editingProc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProc.id ? 'Edit Procedure' : 'Create New Procedure'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Root Canal Treatment (Anterior)"
                  value={editingProc.name || ''}
                  onChange={(e) => setEditingProc({ ...editingProc, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category / Type</label>
                <input
                  type="text"
                  placeholder="e.g. Endodontics, Orthodontics, Extractions"
                  value={editingProc.type || ''}
                  onChange={(e) => setEditingProc({ ...editingProc, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standard Cost (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={editingProc.cost ?? ''}
                  onChange={(e) => setEditingProc({ ...editingProc, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProc(null)}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveProcedure.isPending}
                  className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
                >
                  {saveProcedure.isPending ? 'Saving...' : 'Save Procedure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};