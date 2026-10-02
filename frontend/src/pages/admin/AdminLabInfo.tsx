import React, { useState } from 'react';
import type { Lab, LabProcedure } from '../../types/admin';
import { useLabs, useSaveLab, useSaveLabProcedure } from '../../hooks/useAdmin';
import { useClinicId } from '../../hooks/useSession';

export const AdminLabInfo: React.FC = () => {
  const clinicId = useClinicId();
  const { data: labs, isLoading } = useLabs(clinicId);
  const saveLab = useSaveLab(clinicId);
  const saveLabProcedure = useSaveLabProcedure(clinicId);

  // Modal triggers
  const [editingLab, setEditingLab] = useState<Partial<Lab> | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<{
    labId: string;
    proc?: Partial<LabProcedure>;
  } | null>(null);

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab?.name?.trim()) return;

    await saveLab.mutateAsync({
      id: editingLab.id,
      name: editingLab.name,
      contact_person: editingLab.contact_person,
      phone: editingLab.phone,
      email: editingLab.email,
      address: editingLab.address,
    });
    setEditingLab(null);
  };

  const handleSaveProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcedure?.proc?.name?.trim()) return;

    await saveLabProcedure.mutateAsync({
      id: editingProcedure.proc.id,
      lab_id: editingProcedure.labId,
      name: editingProcedure.proc.name,
      cost: Number(editingProcedure.proc.cost) || 0,
      estimated_turnaround_days: Number(editingProcedure.proc.estimated_turnaround_days) || 7,
    });
    setEditingProcedure(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Dental Laboratories & Test Catalog</h2>
          <p className="text-xs text-slate-500">
            External partner labs, turnaround delivery timelines (default 7 days), and lab item costs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingLab({ name: '' })}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
        >
          + Add Laboratory
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
          Loading laboratories...
        </div>
      ) : labs?.length === 0 ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-lg">
          <p className="text-sm font-semibold text-slate-700">No Dental Laboratories Added</p>
          <p className="text-xs text-slate-400 mt-1">Add your external vendors to assign orders and track prosthesis turnaround times.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {labs?.map((lab) => (
            <div key={lab.id} className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              {/* Lab Card Header */}
              <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{lab.name}</h3>
                    {lab.contact_person && (
                      <span className="text-[11px] text-slate-500">
                        (Contact: <strong className="text-slate-700">{lab.contact_person}</strong>)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                    {lab.phone && <span>📞 {lab.phone}</span>}
                    {lab.email && <span>✉️ {lab.email}</span>}
                    {lab.address && <span>📍 {lab.address}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLab(lab)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded font-medium"
                  >
                    Edit Lab
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProcedure({
                        labId: lab.id,
                        proc: { name: '', cost: 1500, estimated_turnaround_days: 7 },
                      })
                    }
                    className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded font-semibold"
                  >
                    + Add Test / Procedure
                  </button>
                </div>
              </div>

              {/* Lab Procedures Table */}
              <div className="p-0">
                {(!lab.procedures || lab.procedures.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No procedures registered for this lab yet.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2 px-5">Offered Test / Prosthesis</th>
                        <th className="py-2 px-5">Expected Turnaround</th>
                        <th className="py-2 px-5 text-right">Lab Charge (₹)</th>
                        <th className="py-2 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lab.procedures.map((lp) => (
                        <tr key={lp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-5 font-bold text-slate-800">{lp.name}</td>
                          <td className="py-2.5 px-5">
                            <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                              ⏱ {lp.estimated_turnaround_days} Days
                            </span>
                          </td>
                          <td className="py-2.5 px-5 text-right font-mono font-bold text-slate-900">
                            ₹{Number(lp.cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingProcedure({ labId: lab.id, proc: lp })}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Lab Modal */}
      {editingLab && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingLab.id ? 'Edit Laboratory' : 'Add Laboratory Partner'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingLab(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Precision Dental Studio"
                  value={editingLab.name || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Person / Tech</label>
                <input
                  type="text"
                  placeholder="e.g. Santosh Shinde"
                  value={editingLab.contact_person || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={editingLab.phone || ''}
                    onChange={(e) => setEditingLab({ ...editingLab, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="info@apexdental.com"
                    value={editingLab.email || ''}
                    onChange={(e) => setEditingLab({ ...editingLab, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. 402 City Centre, Camp, Pune"
                  value={editingLab.address || ''}
                  onChange={(e) => setEditingLab({ ...editingLab, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLab(null)}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLab.isPending}
                  className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
                >
                  {saveLab.isPending ? 'Saving...' : 'Save Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Create Lab Procedure Modal */}
      {editingProcedure && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProcedure.proc?.id ? 'Edit Lab Procedure' : 'Add Procedure to Lab'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProcedure(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProcedure} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test / Prosthesis Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zirconia Crown CAD/CAM (Multi-Layer)"
                  value={editingProcedure.proc?.name || ''}
                  onChange={(e) =>
                    setEditingProcedure({
                      ...editingProcedure,
                      proc: { ...editingProcedure.proc, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turnaround Time (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="60"
                  value={editingProcedure.proc?.estimated_turnaround_days ?? 7}
                  onChange={(e) =>
                    setEditingProcedure({
                      ...editingProcedure,
                      proc: { ...editingProcedure.proc, estimated_turnaround_days: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Defaults to 7 days (1 week).</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Cost (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="50"
                  value={editingProcedure.proc?.cost ?? ''}
                  onChange={(e) =>
                    setEditingProcedure({
                      ...editingProcedure,
                      proc: { ...editingProcedure.proc, cost: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProcedure(null)}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLabProcedure.isPending}
                  className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
                >
                  {saveLabProcedure.isPending ? 'Saving...' : 'Save Lab Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};