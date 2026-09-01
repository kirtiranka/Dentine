import React, { useState } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import type { CreatePatientInput, Gender } from '../types/patient';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose }) => {
  const addPatient = useDentineStore((state) => state.addPatient);

  const [formData, setFormData] = useState<CreatePatientInput>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    gender: 'undisclosed' as Gender,
    insuranceProvider: '',
    policyNumber: '',
  });

  const [alertInput, setAlertInput] = useState<string>('');

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev: CreatePatientInput) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.phoneNumber) {
      alert('Please fill out all required fields.');
      return;
    }

    addPatient({
      ...formData,
      medicalAlerts: alertInput.trim()
        ? [
            {
              id: `alt-${Date.now()}`,
              type: 'allergy',
              description: alertInput.trim(),
              severity: 'high',
            },
          ]
        : [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl bg-slate-900 shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Register New Patient</h2>
            <p className="text-xs text-slate-400">Add personal and medical details to create a chart</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Sarah"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Last Name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Connor"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Date of Birth <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 [color-scheme:dark] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Insurance Provider</label>
              <input
                type="text"
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleChange}
                placeholder="e.g. Delta Dental"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Policy Number</label>
              <input
                type="text"
                name="policyNumber"
                value={formData.policyNumber}
                onChange={handleChange}
                placeholder="e.g. DD-123456"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Immediate Medical Alerts / Allergies
            </label>
            <input
              type="text"
              value={alertInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlertInput(e.target.value)}
              placeholder="e.g. Penicillin Allergy, Late-stage diabetes"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 transition-colors"
            >
              Save & Open Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};