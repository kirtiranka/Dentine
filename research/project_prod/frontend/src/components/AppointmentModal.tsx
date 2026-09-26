// src/components/AppointmentModal.tsx
import React, { useState, useMemo } from 'react';
import { usePatientsSummary, useDoctors } from '../hooks/useMedicalQueries';
import { useCreateAppointment } from '../hooks/useAppointmentQueries';
import type { TreatmentType } from '../types/appointment';
import type { PatientSummary } from '../types/patient';
import type { DoctorRow } from '../hooks/useMedicalQueries';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // 'YYYY-MM-DD'
  defaultTime: string; // 'HH:mm'
  defaultPatientId: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
  defaultPatientId,
}) => {
  // --- TanStack Queries ---
  const { data: patients = [], isLoading: patientsLoading } = usePatientsSummary();
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors();
  const { mutate: createAppointment, isPending, error: mutationError } = useCreateAppointment();

  // --- Form State (Initialized directly from props without useEffect) ---
  const [date, setDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>(defaultTime);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('cleaning');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Searchable Patient Selector State ---
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState<boolean>(false);

  // --- Searchable Dentist Selector State ---
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [dentistSearch, setDentistSearch] = useState<string>('');
  const [isDentistDropdownOpen, setIsDentistDropdownOpen] = useState<boolean>(false);

  // Filter patients by name or phone
  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p: PatientSummary) =>
        p.name.toLowerCase().includes(q) || p.phoneNumber.replace(/\D/g, '').includes(q)
    );
  }, [patients, patientSearch]);

  // Filter dentists by name
  const filteredDoctors = useMemo(() => {
    const q = dentistSearch.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d: DoctorRow) => d.name.toLowerCase().includes(q));
  }, [doctors, dentistSearch]);

  // Lookup selected records
  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );
  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDentistId),
    [doctors, selectedDentistId]
  );

  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = e.target.value;
    if (!selected) {
      setDate('');
      return;
    }

    const [year, month, day] = selected.split('-').map(Number);
    const pickedDate = new Date(year, month - 1, day);

    // 0 represents Sunday
    if (pickedDate.getDay() === 0) {
      setValidationError('Appointments cannot be booked on Sundays. Please choose another day.');
      return;
    }

    setValidationError(null);
    setDate(selected);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedPatientId) {
      setValidationError('Please search and select a patient.');
      return;
    }

    if (!selectedDentistId) {
      setValidationError('Please search and select an attending dentist.');
      return;
    }

    if (!date || !startTime) {
      setValidationError('Please specify both a date and a start time.');
      return;
    }

    createAppointment(
      {
        patientId: selectedPatientId,
        dentistId: selectedDentistId,
        date,
        time: startTime,
        duration: durationMinutes,
        procedure: treatmentType,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 shadow-2xl border border-slate-800 overflow-visible">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Book Dental Appointment</h2>
            <p className="text-xs text-slate-400">Assign duration, and provider</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Error Feedback */}
        {(validationError || mutationError) && (
          <div className="mx-6 mt-4 rounded-lg border border-red-500/20 bg-red-950/40 p-3 text-xs text-red-300">
            {validationError ||
              (mutationError instanceof Error ? mutationError.message : 'An error occurred.')}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Searchable Patient Selection */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Patient <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={
                  selectedPatient
                    ? `${selectedPatient.name} (${selectedPatient.phoneNumber})`
                    : 'Search patient by name or phone...'
                }
                value={patientSearch}
                onFocus={() => setIsPatientDropdownOpen(true)}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setIsPatientDropdownOpen(true);
                }}
                className={`w-full rounded-lg border ${
                  selectedPatientId ? 'border-teal-500/50' : 'border-slate-700'
                } bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
              />
              {selectedPatientId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('');
                    setPatientSearch('');
                  }}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Patient Dropdown List */}
            {isPatientDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                {patientsLoading ? (
                  <div className="p-3 text-xs text-slate-400">Loading patients...</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">No matching patients found.</div>
                ) : (
                  filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch(`${p.name} (${p.phoneNumber})`);
                        setIsPatientDropdownOpen(false);
                      }}
                      className="cursor-pointer px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{p.phoneNumber}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. Searchable Dentist Selection */}
          <div className="relative">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Attending Dentist <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={selectedDoctor ? selectedDoctor.name : 'Search dentist by name...'}
                value={dentistSearch}
                onFocus={() => setIsDentistDropdownOpen(true)}
                onChange={(e) => {
                  setDentistSearch(e.target.value);
                  setIsDentistDropdownOpen(true);
                }}
                className={`w-full rounded-lg border ${
                  selectedDentistId ? 'border-teal-500/50' : 'border-slate-700'
                } bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors`}
              />
              {selectedDentistId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDentistId('');
                    setDentistSearch('');
                  }}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Dentist Dropdown List */}
            {isDentistDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                {doctorsLoading ? (
                  <div className="p-3 text-xs text-slate-400">Loading doctors...</div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500">No matching doctors found.</div>
                ) : (
                  filteredDoctors.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDentistId(d.id);
                        setDentistSearch(d.name);
                        setIsDentistDropdownOpen(false);
                      }}
                      className="cursor-pointer px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      {d.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. Date / Time / Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={handleDateChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 [color-scheme:dark] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                required
                step="1800"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 [color-scheme:dark] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value={30} className="bg-slate-900">30 min</option>
                <option value={45} className="bg-slate-900">45 min</option>
                <option value={60} className="bg-slate-900">60 min</option>
                <option value={90} className="bg-slate-900">90 min</option>
                <option value={120} className="bg-slate-900">120 min</option>
              </select>
            </div>
          </div>

          {/* 4. Procedure & Operatory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Procedure</label>
              <select
                value={treatmentType}
                onChange={(e) => setTreatmentType(e.target.value as TreatmentType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value="cleaning" className="bg-slate-900">Cleaning / Prophy</option>
                <option value="consultation" className="bg-slate-900">Consultation / Exam</option>
                <option value="filling" className="bg-slate-900">Composite Filling</option>
                <option value="root-canal" className="bg-slate-900">Root Canal (Endo)</option>
                <option value="extraction" className="bg-slate-900">Extraction</option>
                <option value="crown" className="bg-slate-900">Crown / Bridge</option>
                <option value="orthodontics" className="bg-slate-900">Orthodontics</option>
                <option value="emergency" className="bg-slate-900">Emergency Visit</option>
              </select>
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes & Symptoms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tooth #19 sensitivity to cold, pre-medicate required"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedPatientId || !selectedDentistId}
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Scheduling...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};