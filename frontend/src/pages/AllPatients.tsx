import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import type { Patient } from '../types/patient';

export const AllPatients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { data: patients, isLoading, isError, error } = usePatients();

  const filteredPatients = useMemo<Patient[]>(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return patients ?? [];

    return patients?.filter((patient: Patient): boolean => patient.name.toLowerCase().includes(query)) ?? []
  }, [patients, searchTerm]);

  return (
    <div className="max-w-[1100px] mx-auto">
        {/* Header and Actions */}
        <div className="flex justify-between items-center mb-6">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 m-0">Patients</h1>
            <p className="mt-1 text-slate-500 text-sm">
                Manage clinical records, treatment plans, and histories.
            </p>
            </div>
        </div>

        {/* Search Input Bar */}
        <div className="mb-5">
            <input
            type="text"
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-3.5 py-2.5 text-sm border border-slate-300 rounded-md outline-none bg-white text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {isLoading && (
            <div className="p-8 text-center text-slate-500">
                Loading patients...
            </div>
            )}

            {isError && (
            <div className="p-6 text-red-700 bg-red-50 text-sm">
                Error loading patients: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            )}

            {!isLoading && !isError && patients?.length === 0 && (
            <div className="p-10 text-center text-slate-500 text-sm">
                No patients found matching "{searchTerm}".
            </div>
            )}

            {!isLoading && !isError && patients && patients.length > 0 && (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Contact Phone</th>
                    <th className="px-4 py-3 font-semibold">Age / Gender</th>
                    <th className="px-4 py-3 font-semibold">Medical Alerts</th>
                    <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredPatients.map((patient: Patient) => {
                    const phone = patient.details?.contact?.phone || '—';
                    const age = patient.details?.age ? `${patient.details.age} yrs` : '';
                    const gender = patient.details?.gender ? `(${patient.details.gender})` : '';
                    const alerts = patient.details?.medical_alerts || [];

                    return (
                        <tr
                        key={patient.id}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {patient.name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{phone}</td>
                        <td className="px-4 py-3.5 text-slate-500">
                            {[age, gender].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="px-4 py-3.5">
                            {alerts.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {alerts.map((alert, i) => (
                                <span
                                    key={i}
                                    className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                                >
                                    {alert.replace(/_/g, ' ')}
                                </span>
                                ))}
                            </div>
                            ) : (
                            <span className="text-slate-400 text-xs">None</span>
                            )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                            <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/patients/${patient.id}`);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded text-xs font-medium text-slate-700 transition-colors"
                            >
                            View Profile
                            </button>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            )}
        </div>
    </div>
  );
};