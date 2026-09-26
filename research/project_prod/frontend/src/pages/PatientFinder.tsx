import React, { useState, useMemo } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import type { PatientSummary } from '../types/patient';
import { AddPatientModal } from '../components/AddPatientModal';
import { usePatientsSummary } from '../hooks/useMedicalQueries';

export const PatientFinder: React.FC = () => {
  const { data: patients } = usePatientsSummary();
  const selectPatient = useDentineStore((state) => state.selectPatient);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter patients by Name, DOB, or Phone Number
  const filteredPatients = useMemo<PatientSummary[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients ?? [];

    return (
      patients?.filter((patient: PatientSummary): boolean => {
        const fullName = patient.name.toLowerCase();
        const phone = patient.phoneNumber.replace(/\D/g, '');
        const rawQuery = query.replace(/\D/g, '');

        return (
          fullName.includes(query) ||
          patient.dateOfBirth.includes(query) ||
          (rawQuery.length > 0 && phone.includes(rawQuery))
        );
      }) ?? []
    );
  }, [patients, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Patient Directory</h1>
            <p className="text-sm text-slate-400 mt-1">
              Search, manage, and access active dental charts
            </p>
          </div>
          <button
            onClick={(): void => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 active:scale-95 transition-all"
          >
            <span className="text-base font-bold leading-none">+</span>
            New Patient
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone number, or DOB (YYYY-MM-DD)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3.5 pl-11 pr-10 text-sm text-slate-100 shadow-sm outline-none transition-all placeholder:text-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <span className="absolute left-4 top-3.5 text-slate-500">🔍</span>
          {searchQuery && (
            <button
              onClick={(): void => setSearchQuery('')}
              className="absolute right-4 top-3 text-xs font-medium text-slate-400 hover:text-slate-200 p-1 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Patient Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Date of Birth</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      No patients matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient: PatientSummary) => (
                    <tr
                      key={patient.id}
                      onClick={(): void => selectPatient(patient.id)}
                      className="cursor-pointer hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100 group-hover:text-teal-400 transition-colors">
                          {patient.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {patient.email || 'No email on file'}
                        </div>
                      </td>

                      {/* DOB */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {patient.dateOfBirth}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-slate-300">{patient.phoneNumber}</td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-medium text-teal-400 group-hover:underline">
                          View Chart →
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-800 bg-slate-900/60 px-6 py-3 text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{filteredPatients.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{patients?.length ?? 0}</span> registered patients
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddPatientModal isOpen={isModalOpen} onClose={(): void => setIsModalOpen(false)} />
    </div>
  );
};