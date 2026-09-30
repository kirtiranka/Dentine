import React from 'react';
import { Link } from 'react-router-dom';
import type { Appointment, AppointmentStatus } from '../../types/appointment';
import { useUpdateAppointmentStatus } from '../../hooks/useAppointments';
import { formatISTTime } from '../../utils/istDateUtils';

export const AppointmentDetailsModal: React.FC<{
  appointment: Appointment;
  onClose: () => void;
}> = ({ appointment, onClose }) => {
  const updateStatus = useUpdateAppointmentStatus();

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    await updateStatus.mutateAsync({ id: appointment.id, status: newStatus });
    onClose();
  };

  const startTimeStr = formatISTTime(appointment.start_time);
  const endTimeStr = formatISTTime(appointment.end_time);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
              Chair {appointment.operatory_number} • {appointment.type}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {appointment.patient?.name || 'Patient Booking'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Time and Info */}
        <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded border border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-400">Scheduled (IST):</span>
            <strong className="text-slate-800">
              {startTimeStr} – {endTimeStr}
            </strong>
          </div>
          {appointment.doctor?.name && (
            <div className="flex justify-between">
              <span className="text-slate-400">Doctor:</span>
              <span className="font-medium text-slate-800">{appointment.doctor.name}</span>
            </div>
          )}
          {appointment.patient?.details?.contact?.phone && (
            <div className="flex justify-between">
              <span className="text-slate-400">Phone:</span>
              <span>{appointment.patient.details.contact.phone}</span>
            </div>
          )}
          {appointment.notes && (
            <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
              "{appointment.notes}"
            </div>
          )}
        </div>

        {/* Status Transition Quick Selectors */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Update Appointment Status
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                { id: 'scheduled', label: 'Scheduled', style: 'border-slate-200 text-slate-700 hover:bg-slate-50' },
                { id: 'confirmed', label: 'Confirmed', style: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
                { id: 'checked_in', label: 'Checked In', style: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
                { id: 'in_progress', label: 'In Progress (Chair)', style: 'border-purple-200 text-purple-700 hover:bg-purple-50' },
                { id: 'completed', label: 'Completed', style: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
                { id: 'cancelled', label: 'Cancelled / No Show', style: 'border-red-200 text-red-700 hover:bg-red-50' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleStatusChange(item.id)}
                disabled={appointment.status === item.id || updateStatus.isPending}
                className={`py-1.5 px-2.5 rounded border text-center font-medium transition-colors ${item.style} ${
                  appointment.status === item.id ? 'bg-slate-900 text-white font-bold border-slate-900' : 'bg-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          {appointment.patient_id ? (
            <Link
              to={`/patients/${appointment.patient_id}/timeline`}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Open Patient Profile ↗
            </Link>
          ) : <span />}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};