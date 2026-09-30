import React, { useState } from 'react';
import type { AppointmentType, AppointmentStatus } from '../../types/appointment';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { useClinicId, useDoctorId } from '../../hooks/useSession';
import { istDateTimeToUTC } from '../../utils/istDateUtils';

interface ScheduleModalProps {
  initialDate: Date;
  initialHour: number; // 0 to 23
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  initialDate,
  initialHour,
  onClose,
}) => {
  const clinicId = useClinicId();
  const doctorId = useDoctorId();
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const createMutation = useCreateAppointment();

  // Form states initialized directly from props
  const [patientId, setPatientId] = useState('');
  const [operatory, setOperatory] = useState<number>(1);
  const [type, setType] = useState<AppointmentType>('consultation');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  
  // Format initial HH:MM
  const startHourStr = String(initialHour).padStart(2, '0') + ':00';
  const endHourStr = String(Math.min(initialHour + 1, 23)).padStart(2, '0') + ':00';

  const [startTime, setStartTime] = useState(startHourStr);
  const [endTime, setEndTime] = useState(endHourStr);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientId) {
      setErrorMsg('Please select a patient.');
      return;
    }

    if (startTime >= endTime) {
      setErrorMsg('End time must be after start time.');
      return;
    }

    try {
      const startUtc = istDateTimeToUTC(initialDate, startTime);
      const endUtc = istDateTimeToUTC(initialDate, endTime);

      await createMutation.mutateAsync({
        clinic_id: clinicId,
        patient_id: patientId,
        doctor_id: doctorId,
        operatory_number: operatory,
        start_time: startUtc,
        end_time: endUtc,
        type,
        status,
        notes: notes.trim() || null,
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to schedule appointment');
    }
  };

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
  }).format(initialDate);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Schedule Appointment</h3>
            <p className="text-xs text-blue-600 font-medium mt-0.5">{dateLabel} (IST)</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose Patient --</option>
              {isLoadingPatients && <option disabled>Loading patients...</option>}
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.details?.contact?.phone ? `(${p.details.contact.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Time Picker Row (IST) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time (IST)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Time (IST)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Chair & Category Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operatory / Dental Chair
              </label>
              <select
                value={operatory}
                onChange={(e) => setOperatory(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>Chair 1 (Main Operatory)</option>
                <option value={2}>Chair 2 (Surgery / Implant)</option>
                <option value={3}>Chair 3 (Orthodontics)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Encounter Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="consultation">Consultation</option>
                <option value="procedure">Clinical Procedure</option>
                <option value="emergency">Emergency Walk-in</option>
                <option value="follow_up">Follow-up / Review</option>
              </select>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed with Patient</option>
              <option value="checked_in">Checked In (In Reception)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Notes or Purpose
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Tooth #46 Obturation, Crown measurement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
            >
              {createMutation.isPending ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};