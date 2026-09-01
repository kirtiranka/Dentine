import React, { useState, useMemo } from 'react';
import { useDentineStore } from '../store/useDentineStore';
import type { Appointment } from '../types/appointment';
import { AppointmentModal } from '../components/AppointmentModal';

const START_HOUR = 8; // 8:00 AM
const END_HOUR = 18;  // 6:00 PM
const SLOT_HEIGHT_PX = 40; // 30-minute interval height

const PROCEDURE_COLORS: Record<string, string> = {
  cleaning: 'bg-teal-950/80 border-l-4 border-teal-400 text-teal-200',
  filling: 'bg-sky-950/80 border-l-4 border-sky-400 text-sky-200',
  'root-canal': 'bg-amber-950/80 border-l-4 border-amber-400 text-amber-200',
  extraction: 'bg-rose-950/80 border-l-4 border-rose-400 text-rose-200',
  consultation: 'bg-indigo-950/80 border-l-4 border-indigo-400 text-indigo-200',
  crown: 'bg-purple-950/80 border-l-4 border-purple-400 text-purple-200',
  orthodontics: 'bg-emerald-950/80 border-l-4 border-emerald-400 text-emerald-200',
  emergency: 'bg-red-950 border-l-4 border-red-500 text-red-100 font-semibold ring-1 ring-red-500/30',
};

export const CalendarPage: React.FC = () => {
  const appointments = useDentineStore((state) => state.appointments);
  const selectPatient = useDentineStore((state) => state.selectPatient);

  // Default to Monday of current reference week (e.g. Aug 24, 2026)
//   const [currentMonday, setCurrentMonday] = useState<Date>(() => {
//     const today = new Date();
//     const day = today.getDay();
//     const diff = today.getDate() - day + (day === 0 ? -6 : 1);
//     const monday = new Date(today.setDate(diff));
//     monday.setHours(0, 0, 0, 0);
//     return monday;
//   });


  const [currentSunday, setCurrentSunday] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    const sunday = new Date(today.setDate(diff));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  });

  // Modal Control
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string }>({
    date: '',
    time: '09:00',
  });

  // Generate the 6 days of the working week (Mon - Sat)
  const weekDays = useMemo<Date[]>(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentSunday);
      d.setDate(currentSunday.getDate() + i);
      return d;
    });
  }, [currentSunday]);

  // Generate 30-minute interval slots
  const timeSlots = useMemo<string[]>(() => {
    const slots: string[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const handlePrevWeek = (): void => {
    const next = new Date(currentSunday);
    next.setDate(currentSunday.getDate() - 7);
    setCurrentSunday(next);
  };

  const handleNextWeek = (): void => {
    const next = new Date(currentSunday);
    next.setDate(currentSunday.getDate() + 7);
    setCurrentSunday(next);
  };

  const handleSlotClick = (dateStr: string, timeStr: string): void => {
    console.log('handleSlotClick', dateStr, timeStr)
    setSelectedSlot({ date: dateStr, time: timeStr });
    setModalOpen(true);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-100">Operatory Schedule</h1>
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 text-xs">
            <button
              onClick={handlePrevWeek}
              className="rounded-md px-2.5 py-1 font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 font-semibold text-slate-200">
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextWeek}
              className="rounded-md px-2.5 py-1 font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        <button
          onClick={(): void => {
            const todayStr = new Date().toISOString().split('T')[0];
            handleSlotClick(todayStr, '09:00');
          }}
          className="rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-500 active:bg-teal-700 transition-colors"
        >
          + Add Appointment
        </button>
      </div>

      {/* Schedule Canvas */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Sticky Day Headers */}
        <div className="sticky top-0 z-20 grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-800 bg-slate-900 shadow-sm">
          <div className="border-r border-slate-800 p-2 text-center text-xs font-medium text-slate-500">
            Time
          </div>
          {weekDays.map((day: Date) => {
            console.log(day.toISOString(), day.toLocaleDateString('en-IN', { month: 'numeric', day: 'numeric' }));
            return (
            <div
              key={day.toISOString()}
              className="border-r border-slate-800 p-2.5 text-center last:border-r-0"
            >
              <div className="text-xs font-semibold text-slate-200">
                {day.toLocaleDateString('en-IN', { weekday: 'short' })}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {day.toLocaleDateString('en-IN', { month: 'numeric', day: 'numeric' })}
              </div>
            </div>
          );})}
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-[80px_repeat(7,1fr)] relative bg-slate-950">
          {/* Time Labels Column */}
          <div className="border-r border-slate-800 select-none bg-slate-900/40">
            {timeSlots.map((time: string) => (
              <div
                key={time}
                style={{ height: `${SLOT_HEIGHT_PX}px` }}
                className="border-b border-slate-800/60 pr-2 text-right text-[11px] font-mono text-slate-500 leading-3"
              >
                {time.endsWith(':00') ? time : ''}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day: Date) => {
            const dateStr = day.toISOString().split('T')[0];

            // Filter appointments for this day
            const dayAppointments = appointments.filter((apt: Appointment) => {
              const aptDate = apt.startTime.split('T')[0];
              return aptDate === dateStr;
            });

            return (
              <div
                key={dateStr}
                className="relative border-r border-slate-800/80 last:border-r-0"
              >
                {/* 30-min clickable slot blocks */}
                {timeSlots.map((time: string) => (
                  <div
                    key={time}
                    onClick={(): void => handleSlotClick(dateStr, time)}
                    style={{ height: `${SLOT_HEIGHT_PX}px` }}
                    className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  />
                ))}

                {/* Render Appointment Cards Absolute to the Day Column */}
                {dayAppointments.map((apt: Appointment) => {
                  const start = new Date(apt.startTime);
                  const end = new Date(apt.endTime);

                  const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

                  // Calculate pixel positioning
                  const top = (startMinutes / 30) * SLOT_HEIGHT_PX;
                  const height = (durationMinutes / 30) * SLOT_HEIGHT_PX;

                  const colorClass =
                    PROCEDURE_COLORS[apt.treatmentType] ||
                    'bg-slate-800 border-l-4 border-slate-600 text-slate-100';

                  return (
                    <div
                      key={apt.id}
                      onClick={(e: React.MouseEvent): void => {
                        e.stopPropagation();
                        selectPatient(apt.patientId);
                      }}
                      style={{ top: `${top}px`, height: `${height - 2}px` }}
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md p-1.5 shadow-md text-xs cursor-pointer hover:ring-2 hover:ring-teal-400 transition-all ${colorClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate text-slate-100">{apt.patientName}</span>
                        {apt.operatoryNumber && (
                          <span className="rounded bg-black/40 px-1 text-[10px] font-mono font-medium text-slate-200">
                            Op {apt.operatoryNumber}
                          </span>
                        )}
                      </div>
                      <div className="capitalize text-[11px] text-slate-300 opacity-90 truncate">
                        {apt.treatmentType.replace('-', ' ')}
                      </div>
                      {height >= 50 && (
                        <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <AppointmentModal
        key={selectedSlot.date + selectedSlot.time}
        isOpen={modalOpen}
        onClose={(): void => setModalOpen(false)}
        defaultDate={selectedSlot.date}
        defaultTime={selectedSlot.time}
      />
    </div>
  );
};