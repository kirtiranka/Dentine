// src/pages/PatientView.tsx
import React, { useState } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import {
  usePatientById,
  useSavePatient,
  useDeletePatient,
} from '../hooks/useMedicalQueries';
import { useAppointments } from '../hooks/useAppointmentQueries';
import type { Patient, MedicalAlert, PatientDetails } from '../types/patient';
import type { Appointment } from '../types/appointment';
import { AppointmentModal } from '../components/AppointmentModal';
import { getNearestNonSundayDate } from '../scripts/utils';

export const PatientView: React.FC = () => {
  // Navigation / Selected ID retained from Zustand UI store
  const selectedPatientId = useDentineStore((state) => state.selectedPatientId);
  const selectPatient = useDentineStore((state) => state.selectPatient);

  // --- TanStack Queries & Mutations ---
  const {
    data: patient,
    isLoading: isPatientLoading,
    error: patientError,
  } = usePatientById(selectedPatientId ?? '');
  const { mutate: savePatient, isPending: isSaving } = useSavePatient();
  const { mutate: deletePatient, isPending: isDeleting } = useDeletePatient();
  const { data: appointments = [] } = useAppointments();

  // --- Local UI State ---
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<Patient> | null>(null);

  // Alert builder inputs
  const [newAlertDesc, setNewAlertDesc] = useState<string>('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<MedicalAlert['severity']>('high');

  // Appointment Modal
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);

  // 1. Empty / Unselected State
  if (!selectedPatientId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
        <div className="rounded-full bg-slate-900 border border-slate-800 p-4 text-3xl mb-3 shadow-inner">
          📁
        </div>
        <h2 className="text-lg font-semibold text-slate-100">No Patient Chart Selected</h2>
        <p className="text-sm text-slate-400 max-w-sm mt-1 mb-4">
          Select a patient from the directory or calendar to open their clinical record.
        </p>
        <button
          onClick={(): void => selectPatient(null)}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 transition-colors"
        >
          Open Patient Directory
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (isPatientLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Loading patient record...
      </div>
    );
  }

  // 3. Not Found or Error State
  if (!patient || patientError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-100">
        <p className="text-rose-400 text-sm mb-4">Failed to load patient details.</p>
        <button
          onClick={(): void => selectPatient(null)}
          className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          ← Return to Directory
        </button>
      </div>
    );
  }

  // Fallback to active DB record if edit form is not primed
  const activeData: Patient = (editFormData as Patient) ?? patient;
  const details: PatientDetails = activeData.details ?? {};
  const currentAlerts: MedicalAlert[] = details.medicalAlerts ?? [];

  // Filter appointments for this patient
  const patientAppointments = appointments.filter(
    (apt: Appointment) => apt.patientId === patient.id
  );

  // --- Handlers ---
  const handleStartEdit = (): void => {
    setEditFormData(patient);
    setIsEditing(true);
  };

  const handleCancelEdit = (): void => {
    setEditFormData(null);
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setEditFormData((prev) => (prev ? { ...prev, [name]: value } : patient));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const base = prev ?? patient;
      const prevDetails = base.details ?? {};
      const prevAddress = prevDetails.address ?? { street: '', city: '', state: '', zipCode: '' };

      return {
        ...base,
        details: {
          ...prevDetails,
          address: {
            ...prevAddress,
            [name]: value,
          },
        },
      };
    });
  };

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditFormData((prev) => {
      const base = prev ?? patient;
      const prevDetails = base.details ?? {};
      const prevInsurance = prevDetails.insurance ?? { provider: '', policyNumber: '' };

      return {
        ...base,
        details: {
          ...prevDetails,
          insurance: {
            ...prevInsurance,
            [name]: value,
          },
        },
      };
    });
  };

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!editFormData) return;

    savePatient(
      {
        id: patient.id,
        name: editFormData.name ?? patient.name,
        dateOfBirth: editFormData.dateOfBirth ?? patient.dateOfBirth,
        phoneNumber: editFormData.phoneNumber ?? patient.phoneNumber,
        email: editFormData.email,
        details: editFormData.details,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditFormData(null);
        },
      }
    );
  };

  const handleAddAlert = (): void => {
    if (!newAlertDesc.trim()) return;

    const newAlert: MedicalAlert = {
      id: crypto.randomUUID(),
      type: 'allergy',
      description: newAlertDesc.trim(),
      severity: newAlertSeverity,
    };

    const updatedAlerts = [...currentAlerts, newAlert];
    const updatedDetails: PatientDetails = {
      ...details,
      medicalAlerts: updatedAlerts,
    };

    savePatient({
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      details: updatedDetails,
    });

    setNewAlertDesc('');
  };

  const handleRemoveAlert = (alertId: string): void => {
    const updatedAlerts = currentAlerts.filter((a) => a.id !== alertId);
    const updatedDetails: PatientDetails = {
      ...details,
      medicalAlerts: updatedAlerts,
    };

    savePatient({
      id: patient.id,
      name: patient.name,
      dateOfBirth: patient.dateOfBirth,
      phoneNumber: patient.phoneNumber,
      email: patient.email,
      details: updatedDetails,
    });
  };

  const handleDelete = (): void => {
    if (confirm(`Are you sure you want to delete the clinical chart for ${patient.name}?`)) {
      deletePatient(patient.id, {
        onSuccess: () => selectPatient(null),
      });
    }
  };

  const nameParts = patient.name.trim().split(' ');
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : nameParts[0]?.slice(0, 2) ?? 'PT';

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-10 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={(): void => selectPatient(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Patient Directory
          </button>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 shadow-xs hover:bg-slate-700 transition-colors"
              >
                ✏️ Edit Details
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={(): void => setIsAppointmentModalOpen(true)}
              className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-500 active:bg-teal-700 transition-colors"
            >
              + Book Visit
            </button>
          </div>
        </div>

        {/* Patient Summary Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-950/80 text-xl font-bold text-teal-300 border border-teal-800/60 uppercase">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">{patient.name}</h1>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-medium text-slate-300 uppercase border border-slate-700/60">
                    ID: {patient.id.slice(0, 8)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>
                    DOB: <strong className="text-slate-200">{patient.dateOfBirth}</strong>
                  </span>
                  <span>
                    Phone: <strong className="text-slate-200">{patient.phoneNumber}</strong>
                  </span>
                  <span>
                    Email: <strong className="text-slate-200">{patient.email || 'None'}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              disabled={isDeleting}
              onClick={handleDelete}
              className="text-xs text-rose-400 hover:text-rose-300 self-start sm:self-center transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Chart'}
            </button>
          </div>
        </div>

        {/* Clinical / Medical Alerts Banner */}
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              ⚠️ Medical Alerts & Clinical Precautions
            </h3>
            <span className="text-xs text-amber-300/80">Always confirm before treatment</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {currentAlerts.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No medical alerts recorded for this patient.</span>
            ) : (
              currentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    alert.severity === 'high'
                      ? 'bg-rose-950/80 border border-rose-800/80 text-rose-300'
                      : alert.severity === 'medium'
                      ? 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                      : 'bg-blue-950/80 border border-blue-800/80 text-blue-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono">[{alert.type}]</span>
                  <span>{alert.description}</span>
                  <button
                    onClick={(): void => handleRemoveAlert(alert.id)}
                    className="ml-1 hover:text-white font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add alert inline */}
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-amber-900/50">
            <input
              type="text"
              value={newAlertDesc}
              onChange={(e): void => setNewAlertDesc(e.target.value)}
              placeholder="Add allergy / condition (e.g. Latex Allergy, Diabetes)..."
              className="rounded-md border border-amber-900/60 bg-slate-900/80 px-3 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 flex-1 max-w-sm transition-colors"
            />
            <select
              value={newAlertSeverity}
              onChange={(e): void =>
                setNewAlertSeverity(e.target.value as MedicalAlert['severity'])
              }
              className="rounded-md border border-amber-900/60 bg-slate-900/80 px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
            >
              <option value="high" className="bg-slate-900 text-slate-100">High Severity</option>
              <option value="medium" className="bg-slate-900 text-slate-100">Medium Severity</option>
              <option value="low" className="bg-slate-900 text-slate-100">Low Severity</option>
            </select>
            <button
              onClick={handleAddAlert}
              className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500 active:bg-amber-700 transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Core Layout: Form & History */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Patient Details & Demographic Form */}
          <form onSubmit={handleSave} className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
                Personal & Contact Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="name"
                    value={activeData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
                  <input
                    disabled={!isEditing}
                    type="date"
                    name="dateOfBirth"
                    value={activeData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 [color-scheme:dark] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    disabled={!isEditing}
                    name="gender"
                    value={details.gender || ''}
                    onChange={(e) => {
                      const val = e.target.value as PatientDetails['gender'];
                      setEditFormData((prev) => {
                        const base = prev ?? patient;
                        return {
                          ...base,
                          details: {
                            ...(base.details ?? {}),
                            gender: val || undefined,
                          },
                        };
                      });
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  >
                    <option value="">Select Gender</option>
                    <option value="female" className="bg-slate-900">Female</option>
                    <option value="male" className="bg-slate-900">Male</option>
                    <option value="other" className="bg-slate-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    disabled={!isEditing}
                    type="tel"
                    name="phoneNumber"
                    value={activeData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    disabled={!isEditing}
                    type="email"
                    name="email"
                    value={activeData.email || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Street Address</label>
                <input
                  disabled={!isEditing}
                  type="text"
                  name="street"
                  value={details.address?.street || ''}
                  onChange={handleAddressChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="city"
                    value={details.address?.city || ''}
                    onChange={handleAddressChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="state"
                    value={details.address?.state || ''}
                    onChange={handleAddressChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Zip Code</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="zipCode"
                    value={details.address?.zipCode || ''}
                    onChange={handleAddressChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Insurance details */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
                Insurance & Billing
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Insurance Provider</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="provider"
                    value={details.insurance?.provider || ''}
                    onChange={handleInsuranceChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Policy / Member ID</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="policyNumber"
                    value={details.insurance?.policyNumber || ''}
                    onChange={handleInsuranceChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>

          {/* Right Column: Appointment & Treatment History */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-100">Visit History</h3>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-700/60">
                  {patientAppointments.length} visits
                </span>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No appointments logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map((apt: Appointment) => (
                    <div
                      key={apt.id}
                      className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 text-xs space-y-1 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-slate-200">
                          {apt.procedure.replace('-', ' ')}
                        </span>
                        <span className="rounded bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 text-[10px] font-medium text-teal-300 uppercase">
                          {apt.status}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono">
                        {apt.date} at {apt.time} ({apt.duration} mins)
                      </div>
                      <div className="text-slate-400 text-[11px]">Provider: {apt.dentistName}</div>
                      {apt.notes && (
                        <p className="mt-1 border-t border-slate-800/60 pt-1 text-[11px] italic text-slate-400">
                          "{apt.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={(): void => setIsAppointmentModalOpen(false)}
        defaultDate={getNearestNonSundayDate()}
        defaultTime="09:00"
        defaultPatientId={patient.id}
      />
    </div>
  );
};