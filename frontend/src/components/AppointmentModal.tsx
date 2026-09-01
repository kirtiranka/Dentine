import React, { useState } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import type { TreatmentType, AppointmentStatus } from '../types/appointment';
import type { Patient } from '../types/patient';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // 'YYYY-MM-DD'
  defaultTime: string; // 'HH:mm'
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultTime,
}) => {
    console.log("Appointment Modal", defaultDate, defaultTime)
  const patients = useDentineStore((state) => state.patients);
  const addAppointment = useDentineStore((state) => state.addAppointment);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || ''
  );
  const [date, setDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>(defaultTime);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [treatmentType, setTreatmentType] = useState<TreatmentType>('cleaning');
  const [dentistName, setDentistName] = useState<string>('Dr. Kirti Ranka, MDS');
  const [operatoryNumber, setOperatoryNumber] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const patient = patients.find((p: Patient) => p.id === selectedPatientId);
    if (!patient) {
      alert('Please select a valid patient.');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    addAppointment({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dentistId: 'doc-1',
      dentistName,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      status: 'scheduled' as AppointmentStatus,
      treatmentType,
      operatoryNumber,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  const selected = e.target.value;
  if (!selected) {
    setDate('');
    return;
  }

  // Parse YYYY-MM-DD components directly to avoid timezone shift bugs
  const [year, month, day] = selected.split('-').map(Number);
  const pickedDate = new Date(year, month - 1, day);

  console.log(year, month, day)

  // 0 represents Sunday
  if (pickedDate.getDay() === 0) {
    alert('Appointments cannot be booked on Sundays. Please select a different day.');
    setDate(''); // Clear the input or leave existing date
    return;
  }

  setDate(selected);
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Book Dental Appointment</h2>
            <p className="text-xs text-slate-400">Assign operatory, duration, and procedure</p>
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Patient <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedPatientId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                setSelectedPatientId(e.target.value)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            >
              {patients.map((p: Patient) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.firstName} {p.lastName} — ({p.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => handleDateChange(e)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 [color-scheme:dark] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Start Time</label>
              <input
                type="time"
                required
                step="1800"
                value={startTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 [color-scheme:dark] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration</label>
              <select
                value={durationMinutes}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                  setDurationMinutes(Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value={30} className="bg-slate-900 text-slate-100">30 min</option>
                <option value={45} className="bg-slate-900 text-slate-100">45 min</option>
                <option value={60} className="bg-slate-900 text-slate-100">60 min</option>
                <option value={90} className="bg-slate-900 text-slate-100">90 min</option>
                <option value={120} className="bg-slate-900 text-slate-100">120 min</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Procedure</label>
              <select
                value={treatmentType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                  setTreatmentType(e.target.value as TreatmentType)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value="cleaning" className="bg-slate-900 text-slate-100">Cleaning / Prophy</option>
                <option value="consultation" className="bg-slate-900 text-slate-100">Consultation / Exam</option>
                <option value="filling" className="bg-slate-900 text-slate-100">Composite Filling</option>
                <option value="root-canal" className="bg-slate-900 text-slate-100">Root Canal (Endo)</option>
                <option value="extraction" className="bg-slate-900 text-slate-100">Extraction</option>
                <option value="crown" className="bg-slate-900 text-slate-100">Crown / Bridge</option>
                <option value="orthodontics" className="bg-slate-900 text-slate-100">Orthodontics</option>
                <option value="emergency" className="bg-slate-900 text-slate-100">Emergency Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Operatory / Chair</label>
              <select
                value={operatoryNumber}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                  setOperatoryNumber(Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              >
                <option value={1} className="bg-slate-900 text-slate-100">Operatory 1 (Hygiene)</option>
                <option value={2} className="bg-slate-900 text-slate-100">Operatory 2 (General)</option>
                <option value={3} className="bg-slate-900 text-slate-100">Operatory 3 (Surgery)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Dentist / Provider</label>
            <input
              type="text"
              value={dentistName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setDentistName(e.target.value)}
              placeholder="e.g. Dr. Alex Vance"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes & Symptoms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => setNotes(e.target.value)}
              placeholder="e.g. Tooth #19 sensitivity to cold, pre-medicate required"
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
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};