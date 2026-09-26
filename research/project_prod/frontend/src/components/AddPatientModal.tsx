// src/components/AddPatientModal.tsx
import React, { useState } from 'react';
import { useSavePatient } from '../hooks/useMedicalQueries';
import type { MedicalAlert, PatientDetails } from '../types/patient';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (patientId: string) => void;
}

interface FormState {
  // Core Fields
  name: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  gender: 'male' | 'female' | 'other' | '';

  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;

  // Insurance
  insuranceProvider: string;
  policyNumber: string;

  // Emergency Contact
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;

  // Medical Alerts
  medicalAlerts: MedicalAlert[];
}

const initialFormState: FormState = {
  name: '',
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  gender: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  insuranceProvider: '',
  policyNumber: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
  medicalAlerts: [],
};

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);

  // Temporary state for the "Add Medical Alert" row
  const [alertType, setAlertType] = useState<MedicalAlert['type']>('allergy');
  const [alertDescription, setAlertDescription] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<MedicalAlert['severity']>('medium');

  const { mutate: savePatient, isPending } = useSavePatient();

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAlert = () => {
    if (!alertDescription.trim()) return;

    const newAlert: MedicalAlert = {
      id: crypto.randomUUID(),
      type: alertType,
      description: alertDescription.trim(),
      severity: alertSeverity,
    };

    setFormData((prev) => ({
      ...prev,
      medicalAlerts: [...prev.medicalAlerts, newAlert],
    }));

    setAlertDescription('');
    setAlertSeverity('medium');
  };

  const handleRemoveAlert = (alertId: string) => {
    setFormData((prev) => ({
      ...prev,
      medicalAlerts: prev.medicalAlerts.filter((a) => a.id !== alertId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!formData.name.trim() || !formData.dateOfBirth || !formData.phoneNumber.trim()) {
      setError('Name, Date of Birth, and Phone Number are required.');
      return;
    }

    // Construct optional nested details
    const details: PatientDetails = {
      ...(formData.gender ? { gender: formData.gender as PatientDetails['gender'] } : {}),
      ...(formData.street || formData.city || formData.state || formData.zipCode
        ? {
            address: {
              street: formData.street.trim(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              zipCode: formData.zipCode.trim(),
            },
          }
        : {}),
      ...(formData.insuranceProvider || formData.policyNumber
        ? {
            insurance: {
              provider: formData.insuranceProvider.trim(),
              policyNumber: formData.policyNumber.trim(),
            },
          }
        : {}),
      ...(formData.emergencyName || formData.emergencyPhone || formData.emergencyRelationship
        ? {
            emergencyContact: {
              name: formData.emergencyName.trim(),
              relationship: formData.emergencyRelationship.trim(),
              phoneNumber: formData.emergencyPhone.trim(),
            },
          }
        : {}),
      ...(formData.medicalAlerts.length > 0
        ? { medicalAlerts: formData.medicalAlerts }
        : {}),
    };

    savePatient(
      {
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        details: Object.keys(details).length > 0 ? details : undefined,
      },
      {
        onSuccess: (saved) => {
          setFormData(initialFormState);
          onClose();
          onSuccess?.(saved.id);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to create patient.');
        },
      }
    );
  };

  const inputClass =
    'w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all';
  const labelClass = 'block text-xs font-medium text-slate-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Add New Patient</h2>
            <p className="text-xs text-slate-400 mt-0.5">Register personal data, insurance, and medical alerts</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
              Basic Demographics
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Eleanor Vance"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Date of Birth (YYYY-MM-DD) *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  required
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  required
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="(555) 000-0000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="patient@example.com"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
              Address
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-4">
                <label className={labelClass}>Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Springfield"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="IL"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  placeholder="62701"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Insurance & Emergency */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
                Insurance Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Provider</label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    placeholder="e.g. Delta Dental"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Policy Number</label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. POL-89104"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
                Emergency Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Contact Name</label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    placeholder="Contact Name"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Relationship</label>
                    <input
                      type="text"
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={handleInputChange}
                      placeholder="Spouse, Parent..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Medical Alerts */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
              Medical Alerts & Conditions
            </h3>

            {/* Existing added alerts */}
            {formData.medicalAlerts.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {formData.medicalAlerts.map((alert) => (
                  <span
                    key={alert.id}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium border ${
                      alert.severity === 'high'
                        ? 'border-red-500/30 bg-red-950/40 text-red-300'
                        : alert.severity === 'medium'
                        ? 'border-amber-500/30 bg-amber-950/40 text-amber-300'
                        : 'border-blue-500/30 bg-blue-950/40 text-blue-300'
                    }`}
                  >
                    <span className="font-semibold uppercase text-[10px]">[{alert.type}]</span>
                    <span>{alert.description}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAlert(alert.id)}
                      className="ml-1 text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* New alert input row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as MedicalAlert['type'])}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-slate-300 outline-none focus:border-teal-500"
              >
                <option value="allergy">Allergy</option>
                <option value="condition">Condition</option>
                <option value="medication">Medication</option>
                <option value="warning">Warning</option>
              </select>

              <select
                value={alertSeverity}
                onChange={(e) => setAlertSeverity(e.target.value as MedicalAlert['severity'])}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-slate-300 outline-none focus:border-teal-500"
              >
                <option value="low">Low Severity</option>
                <option value="medium">Medium Severity</option>
                <option value="high">High Severity</option>
              </select>

              <input
                type="text"
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
                placeholder="Alert description (e.g., Penicillin allergy)..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAlert();
                  }
                }}
              />

              <button
                type="button"
                onClick={handleAddAlert}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                + Add Alert
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Saving...' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};