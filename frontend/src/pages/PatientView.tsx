import React, { useState } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import type { Patient, MedicalAlert } from '../types/patient';
import type { Appointment } from '../types/appointment';
import { AppointmentModal } from '../components/AppointmentModal';
import { getNearestNonSundayDate } from '../scripts/utils';

export const PatientView: React.FC = () => {
  const selectedPatientId = useDentineStore((state) => state.selectedPatientId);
  const getPatientById = useDentineStore((state) => state.getPatientById);
  const updatePatient = useDentineStore((state) => state.updatePatient);
  const deletePatient = useDentineStore((state) => state.deletePatient);
  const selectPatient = useDentineStore((state) => state.selectPatient);
  const appointments = useDentineStore((state) => state.appointments);

  const patient = selectedPatientId ? getPatientById(selectedPatientId) : undefined;

  // Edit Mode & Local Form State
  const [isEditing, setIsEditing] = useState<boolean>(false);
//   const [prevPatientId, setPrevPatientId] = useState(patient?.id);
  const [formData, setFormData] = useState<Patient | null>(patient ?? null);

  // New Medical Alert inline inputs
  const [newAlertDesc, setNewAlertDesc] = useState<string>('');
  const [newAlertSeverity, setNewAlertSeverity] = useState<'low' | 'medium' | 'high'>('high');

  // Appointment Modal state
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);

//   if (patient?.id !== prevPatientId) {
//     setPrevPatientId(patient?.id);
//     setFormData(patient ?? null);
//   }

  if (!patient || !formData) {
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

  // Filter appointments for this specific patient
  const patientAppointments = appointments.filter(
    (apt: Appointment) => apt.patientId === patient.id
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            address: {
              street: prev.address?.street || '',
              city: prev.address?.city || '',
              state: prev.address?.state || '',
              zipCode: prev.address?.zipCode || '',
              [name]: value,
            },
          }
        : null
    );
  };

  const handleSave = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!formData) return;
    updatePatient(patient.id, formData);
    setIsEditing(false);
  };

  const handleAddAlert = (): void => {
    if (!newAlertDesc.trim()) return;
    const newAlert: MedicalAlert = {
      id: `alt-${Date.now()}`,
      type: 'allergy',
      description: newAlertDesc.trim(),
      severity: newAlertSeverity,
    };
    const updatedAlerts = [...(formData.medicalAlerts || []), newAlert];
    setFormData({ ...formData, medicalAlerts: updatedAlerts });
    updatePatient(patient.id, { medicalAlerts: updatedAlerts });
    setNewAlertDesc('');
  };

  const handleRemoveAlert = (alertId: string): void => {
    const updatedAlerts = (formData.medicalAlerts || []).filter((a) => a.id !== alertId);
    setFormData({ ...formData, medicalAlerts: updatedAlerts });
    updatePatient(patient.id, { medicalAlerts: updatedAlerts });
  };

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
                onClick={(): void => setIsEditing(true)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-200 shadow-xs hover:bg-slate-700 transition-colors"
              >
                ✏️ Edit Details
              </button>
            ) : (
              <button
                type="button"
                onClick={(): void => {
                  setFormData(patient);
                  setIsEditing(false);
                }}
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-950/80 text-xl font-bold text-teal-300 border border-teal-800/60">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-100">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs font-medium text-slate-300 uppercase border border-slate-700/60">
                    ID: {patient.id}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span>DOB: <strong className="text-slate-200">{patient.dateOfBirth}</strong></span>
                  <span>Phone: <strong className="text-slate-200">{patient.phoneNumber}</strong></span>
                  <span>Email: <strong className="text-slate-200">{patient.email || 'None'}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={(): void => {
                if (confirm(`Are you sure you want to delete ${patient.firstName}'s chart?`)) {
                  deletePatient(patient.id);
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 self-start sm:self-center transition-colors"
            >
              Delete Chart
            </button>
          </div>
        </div>

        {/* Clinical / Medical Alerts Banner */}
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              ⚠️ Medical Alerts & Clinical Precautions
            </h3>
            <span className="text-xs text-amber-300/80">Always confirm before administering anesthesia</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {(formData.medicalAlerts || []).length === 0 ? (
              <span className="text-xs text-slate-400 italic">No medical alerts recorded for this patient.</span>
            ) : (
              formData.medicalAlerts?.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
                    alert.severity === 'high'
                      ? 'bg-rose-950/80 border border-rose-800/80 text-rose-300'
                      : 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                  }`}
                >
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
              onChange={(e): void => setNewAlertSeverity(e.target.value as 'low' | 'medium' | 'high')}
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="lastName"
                    value={formData.lastName}
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
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 [color-scheme:dark] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    disabled={!isEditing}
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  >
                    <option value="undisclosed" className="bg-slate-900 text-slate-100">Undisclosed</option>
                    <option value="female" className="bg-slate-900 text-slate-100">Female</option>
                    <option value="male" className="bg-slate-900 text-slate-100">Male</option>
                    <option value="other" className="bg-slate-900 text-slate-100">Other</option>
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
                    value={formData.phoneNumber}
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
                    value={formData.email || ''}
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
                  value={formData.address?.street || ''}
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
                    value={formData.address?.city || ''}
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
                    value={formData.address?.state || ''}
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
                    value={formData.address?.zipCode || ''}
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
                    name="insuranceProvider"
                    value={formData.insuranceProvider || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Policy / Member ID</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 disabled:bg-slate-900/80 disabled:border-slate-800 disabled:text-slate-400 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={(): void => setIsEditing(false)}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 transition-colors"
                >
                  Save Changes
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
                          {apt.treatmentType.replace('-', ' ')}
                        </span>
                        <span className="rounded bg-teal-950/80 border border-teal-800/60 px-1.5 py-0.5 text-[10px] font-medium text-teal-300 uppercase">
                          {apt.status}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono">
                        {new Date(apt.startTime).toLocaleDateString()} at{' '}
                        {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      />
    </div>
  );
};