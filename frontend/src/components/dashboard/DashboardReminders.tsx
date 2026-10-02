import React, { useState, useMemo } from 'react';
import type {
  Reminder,
  ReminderStatus,
  ReminderType,
  ReminderDetails,
} from '../../types/reminder';
import {
  useReminders,
  useUpdateReminder,
  useCreateReminder,
} from '../../hooks/useReminders';
import { useCurrentTime } from '../../hooks/useCurrentTime';
import { useClinicId, useDoctorId } from '../../hooks/useSession';

const TYPE_CONFIG: Record<
  ReminderType,
  { label: string; emoji: string; badgeClass: string }
> = {
  meeting: {
    label: 'Appointment',
    emoji: '📅',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  lab_test: {
    label: 'Lab Order',
    emoji: '🔬',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  follow_up: {
    label: 'Recall / Review',
    emoji: '📋',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  general: {
    label: 'General Task',
    emoji: '📌',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

// Hoisted outside render to avoid re-instantiation overhead
const istDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export const DashboardReminders: React.FC = () => {
  const clinicId = useClinicId();
  const now = useCurrentTime(60000); // Ticks every 60 seconds
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | 'all'>('active');
  const [typeFilter, setTypeFilter] = useState<ReminderType | 'all'>('all');

  const { data: reminders, isLoading } = useReminders(clinicId, {
    status: statusFilter,
    type: typeFilter,
  });

  const updateMutation = useUpdateReminder(clinicId);

  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const handleAcknowledge = (reminder: Reminder) => {
    updateMutation.mutate({ id: reminder.id, status: 'inactive' });
  };

  const handleShiftDays = (reminder: Reminder, deltaDays: number) => {
    const newDays = reminder.remind_in_days + deltaDays;
    updateMutation.mutate({ id: reminder.id, remind_in_days: newDays });
  };

  const handleDisable = (reminder: Reminder) => {
    updateMutation.mutate({ id: reminder.id, status: 'disabled' });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Clinic Action Reminders</h2>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
              {reminders?.length ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized clinical follow-ups, scheduled chairs, and external lab expectations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
        >
          + Add Reminder
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Type:</span>
          {(['all', 'meeting', 'lab_test', 'follow_up', 'general'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded-md border font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'All' : TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium mr-1 text-[11px]">Status:</span>
          {(['active', 'inactive', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md border capitalize font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders Feed */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading active reminders...</div>
      ) : reminders?.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm font-semibold text-slate-700">No Reminders Found</p>
          <p className="text-xs text-slate-400 mt-0.5">
            All appointments, lab tests, and clinical actions are up to date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders?.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              now={now}
              onAcknowledge={handleAcknowledge}
              onShiftDays={handleShiftDays}
              onDisable={handleDisable}
              onEditNotes={() => setEditingReminder(reminder)}
            />
          ))}
        </div>
      )}

      {/* New Reminder Modal */}
      {isNewModalOpen && (
        <CreateReminderModal
          clinicId={clinicId}
          onClose={() => setIsNewModalOpen(false)}
        />
      )}

      {/* Edit Notes Modal */}
      {editingReminder && (
        <EditReminderNotesModal
          clinicId={clinicId}
          reminder={editingReminder}
          onClose={() => setEditingReminder(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT: Single Reminder Card
// ============================================================================
interface ReminderCardProps {
  reminder: Reminder;
  now: number;
  onAcknowledge: (r: Reminder) => void;
  onShiftDays: (r: Reminder, delta: number) => void;
  onDisable: (r: Reminder) => void;
  onEditNotes: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  now,
  onAcknowledge,
  onShiftDays,
  onDisable,
  onEditNotes,
}) => {
  const typeMeta = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.general;
  const isInactive = reminder.status === 'inactive';

  // Calculate Urgency with purely passed dependencies
  const { dateLabel, urgencyBadge } = useMemo(() => {
    const dueTime = reminder.due_at
      ? new Date(reminder.due_at).getTime()
      : new Date(reminder.asof_datetime).getTime() + reminder.remind_in_days * 86400000;

    const diffHours = (dueTime - now) / 3600000;
    const formattedDate = istDateTimeFormatter.format(new Date(dueTime));

    if (reminder.status !== 'active') {
      return {
        dateLabel: formattedDate,
        urgencyBadge: <span className="text-[10px] text-slate-400">Acknowledged</span>,
      };
    }

    if (diffHours < 0) {
      return {
        dateLabel: formattedDate,
        urgencyBadge: (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold border border-red-200">
            Overdue
          </span>
        ),
      };
    }
    if (diffHours <= 24) {
      return {
        dateLabel: formattedDate,
        urgencyBadge: (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
            Due Today
          </span>
        ),
      };
    }
    return {
      dateLabel: formattedDate,
      urgencyBadge: (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
          Upcoming
        </span>
      ),
    };
  }, [reminder.due_at, reminder.asof_datetime, reminder.remind_in_days, reminder.status, now]);

  return (
    <div
      className={`p-3.5 rounded-lg border transition-all ${
        isInactive
          ? 'bg-slate-50/70 border-slate-200 opacity-60'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${typeMeta.badgeClass}`}
          >
            <span>{typeMeta.emoji}</span>
            <span>{typeMeta.label}</span>
          </span>
          {urgencyBadge}
          {reminder.remind_in_days !== 0 && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Shifted: {reminder.remind_in_days > 0 ? `+${reminder.remind_in_days}d` : `${reminder.remind_in_days}d`}
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Due: <strong className="text-slate-700">{dateLabel}</strong>
        </div>
      </div>

      <div className="py-1">
        <h4 className="text-xs font-bold text-slate-900">
          {reminder.details.title || 'Clinical Task'}
          {reminder.details.patient_name && (
            <span className="text-blue-600 font-medium ml-1">
              — {reminder.details.patient_name}
            </span>
          )}
        </h4>
        {reminder.details.notes && (
          <p className="text-xs text-slate-600 mt-0.5 italic">
            "{reminder.details.notes}"
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEditNotes}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Edit Notes
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => onDisable(reminder)}
            className="text-slate-400 hover:text-red-600 transition-colors"
          >
            Dismiss
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onShiftDays(reminder, -1)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            title="Prepone reminder by 1 day"
          >
            -1d
          </button>
          <button
            type="button"
            onClick={() => onShiftDays(reminder, 1)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            title="Postpone reminder by 1 day"
          >
            +1d
          </button>
          <button
            type="button"
            onClick={() => onShiftDays(reminder, 3)}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            title="Postpone reminder by 3 days"
          >
            +3d
          </button>

          {reminder.status === 'active' && (
            <button
              type="button"
              onClick={() => onAcknowledge(reminder)}
              className="px-2.5 py-0.5 ml-1 rounded font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Create General Reminder
// ============================================================================
const CreateReminderModal: React.FC<{
  clinicId: string;
  onClose: () => void;
}> = ({ clinicId, onClose }) => {
  const doctorId = useDoctorId();
  const createMutation = useCreateReminder(clinicId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<ReminderType>('general');
  const [asofDate, setAsofDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [remindInDays, setRemindInDays] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createMutation.mutateAsync({
      clinic_id: clinicId,
      employee_id: doctorId,
      asof_datetime: new Date(asofDate).toISOString(),
      remind_in_days: Number(remindInDays),
      type,
      status: 'active',
      details: {
        title: title.trim(),
        notes: notes.trim() || undefined,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Add Clinic Reminder</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Title / Action Item</label>
            <input
              type="text"
              required
              placeholder="e.g. Call patient to confirm implant fixture"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReminderType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
              >
                <option value="general">General</option>
                <option value="follow_up">Follow Up</option>
                <option value="meeting">Appointment</option>
                <option value="lab_test">Lab Order</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Offset (Days)</label>
              <input
                type="number"
                value={remindInDays}
                onChange={(e) => setRemindInDays(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Base Date & Time</label>
            <input
              type="datetime-local"
              required
              value={asofDate}
              onChange={(e) => setAsofDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
            <textarea
              rows={2}
              placeholder="Instructions or patient specifics..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: Edit Reminder Notes
// ============================================================================
const EditReminderNotesModal: React.FC<{
  clinicId: string;
  reminder: Reminder;
  onClose: () => void;
}> = ({ clinicId, reminder, onClose }) => {
  const updateMutation = useUpdateReminder(clinicId);
  const [notes, setNotes] = useState(reminder.details.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: ReminderDetails = {
      ...reminder.details,
      notes: notes.trim() || undefined,
    };

    await updateMutation.mutateAsync({
      id: reminder.id,
      details: updatedDetails,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-3 text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Edit Reminder Notes</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {reminder.details.title || 'Task Details'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add or update instructions..."
              className="w-full p-2.5 border border-slate-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-3.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};