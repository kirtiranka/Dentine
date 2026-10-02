import React, { useState } from 'react';
import type { Employee, EmployeeRole, EmployeeType } from '../../types/admin';
import { useEmployees, useSaveEmployee } from '../../hooks/useAdmin';
import { useClinicId } from '../../hooks/useSession';

const ROLE_BADGES: Record<EmployeeRole, string> = {
  doctor: 'bg-blue-50 text-blue-700 border-blue-200',
  visiting_doctor: 'bg-purple-50 text-purple-700 border-purple-200',
  receptionist: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const AdminEmployees: React.FC = () => {
  const clinicId = useClinicId();
  const { data: employees, isLoading } = useEmployees(clinicId);
  const saveEmployee = useSaveEmployee(clinicId);

  const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);

  const handleOpenNew = () => {
    setEditingEmployee({
      name: '',
      role: 'doctor',
      type: 'employee',
      details: { contact: { phone: '', email: '' }, address: '' },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee?.name?.trim()) return;

    await saveEmployee.mutateAsync(editingEmployee as Partial<Employee> & { name: string });
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-slate-900">Staff & Clinical Providers</h2>
          <p className="text-xs text-slate-500">Doctors, visiting specialists, and front-desk personnel.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenNew}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs"
        >
          + Add Staff Member
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
          Loading employees...
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Association</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees?.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{emp.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${
                        ROLE_BADGES[emp.role] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {emp.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">{emp.type}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">
                    {emp.details?.contact?.phone || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{emp.details?.contact?.email || '—'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingEmployee(emp)}
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

      {/* Edit / Create Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEmployee.id ? 'Edit Employee Details' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rohan Mehta"
                  value={editingEmployee.name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinic Role</label>
                  <select
                    value={editingEmployee.role || 'doctor'}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, role: e.target.value as EmployeeRole })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="visiting_doctor">Visiting Specialist</option>
                    <option value="receptionist">Receptionist / Front Desk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Engagement Type</label>
                  <select
                    value={editingEmployee.type || 'employee'}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, type: e.target.value as EmployeeType })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="employee">Salaried Employee</option>
                    <option value="partner">Partner</option>
                    <option value="owner">Clinic Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={editingEmployee.details?.contact?.phone || ''}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        details: {
                          ...editingEmployee.details,
                          contact: { ...editingEmployee.details?.contact, phone: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={editingEmployee.details?.contact?.email || ''}
                    onChange={(e) =>
                      setEditingEmployee({
                        ...editingEmployee,
                        details: {
                          ...editingEmployee.details,
                          contact: { ...editingEmployee.details?.contact, email: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveEmployee.isPending}
                  className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
                >
                  {saveEmployee.isPending ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};