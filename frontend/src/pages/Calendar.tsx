import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Appointment, AppointmentType, AppointmentStatus } from '../types/appointment';
import { useAppointments } from '../hooks/useAppointments';
import {
  getWeekDays,
  formatISTDateHeader,
  formatISTTime,
  getISTHourAndMinute,
} from '../utils/istDateUtils';
import { ScheduleModal } from '../components/calendar/ScheduleModal';
import { AppointmentDetailsModal } from '../components/calendar/AppointmentDetailsModal';

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

// Type-based border/accent colors
const TYPE_COLORS: Record<AppointmentType, string> = {
  consultation: 'bg-blue-100 border-blue-500 text-blue-900',
  procedure: 'bg-purple-100 border-purple-500 text-purple-900',
  emergency: 'bg-rose-100 border-rose-500 text-rose-900',
  follow_up: 'bg-emerald-100 border-emerald-500 text-emerald-900',
};

const STATUS_DOTS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-slate-400',
  confirmed: 'bg-blue-500',
  checked_in: 'bg-amber-500',
  in_progress: 'bg-purple-500 animate-pulse',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-400',
  no_show: 'bg-rose-600',
};

export const CalendarPage: React.FC = () => {
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Compute 7 days for the current week (Monday -> Sunday)
  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  // Window bounds for database query
  const startWindowIso = useMemo(() => {
    const d = new Date(weekDays[0]);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [weekDays]);

  const endWindowIso = useMemo(() => {
    const d = new Date(weekDays[6]);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [weekDays]);

  const { data: appointments,  } = useAppointments(startWindowIso, endWindowIso);

  // Auto-scroll to 8:00 AM (Active clinic opening hour) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      // 8th hour row * 64px row height
      scrollContainerRef.current.scrollTop = 8 * 64;
    }
  }, []);

  const handlePrevWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(referenceDate.getDate() - 7);
    setReferenceDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(referenceDate);
    next.setDate(referenceDate.getDate() + 7);
    setReferenceDate(next);
  };

  const handleToday = () => {
    setReferenceDate(new Date());
  };

  // Group appointments by date string YYYY-MM-DD in IST
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!appointments) return map;

    for (const appt of appointments) {
      const istDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
      }).format(new Date(appt.start_time)); // Formats as YYYY-MM-DD

      const list = map.get(istDate) || [];
      list.push(appt);
      map.set(istDate, list);
    }
    return map;
  }, [appointments]);

  const formattedRangeHeader = `${formatISTDateHeader(weekDays[0])} – ${formatISTDateHeader(
    weekDays[6]
  )} (IST)`;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1400px] mx-auto">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Clinic Calendar</h1>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              IST (UTC+05:30)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Hours: <span className="font-semibold text-slate-700">08:00 AM – 08:00 PM</span>. Click any slot to schedule.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-700 mr-2">{formattedRangeHeader}</span>
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-300 rounded overflow-hidden">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-xs text-slate-700 border-r border-slate-200"
              title="Previous Week"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-xs text-slate-700"
              title="Next Week"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Day Column Headers (Sticky Top) */}
      <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-slate-50 border-b border-slate-200 text-xs select-none">
        <div className="p-3 text-center text-slate-400 font-mono border-r border-slate-200 text-[10px] font-bold">
          TIME
        </div>
        {weekDays.map((day) => {
          const isToday =
            new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()) ===
            new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(day);

          return (
            <div
              key={day.toISOString()}
              className={`p-2.5 text-center border-r border-slate-200 ${
                isToday ? 'bg-blue-50/80 font-bold text-blue-700' : 'text-slate-700 font-semibold'
              }`}
            >
              <div>{formatISTDateHeader(day)}</div>
              {isToday && (
                <span className="text-[10px] text-blue-600 uppercase font-mono tracking-widest block">
                  Today
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Main 24-Hour Scrollable Calendar Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-slate-100/50 border border-slate-200 select-none relative"
      >
        <div className="grid grid-cols-[64px_repeat(7,1fr)] relative">
          {/* Time Label Column (00:00 to 23:00) */}
          <div className="divide-y divide-slate-200 border-r border-slate-200 bg-white">
            {HOURS.map((hour) => {
              const isActive = hour >= 8 && hour < 20;
            //   const displayTime = formatISTTime(
            //     new Date(Date.UTC(2026, 0, 1, (hour - 5 + 24) % 24, hour === 5 ? 30 : 0)).toISOString()
            //   );
              // Clean label like 8 AM, 12 PM, etc.
              const hourLabel =
                hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

              return (
                <div
                  key={hour}
                  className={`h-16 flex items-start justify-center pt-1 text-[11px] font-mono ${
                    isActive ? 'text-slate-800 font-bold bg-white' : 'text-slate-400 bg-slate-100/60'
                  }`}
                >
                  {hourLabel}
                </div>
              );
            })}
          </div>

          {/* 7 Day Columns */}
          {weekDays.map((day) => {
            const dayKey = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
            }).format(day);
            const dayAppointments = appointmentsByDay.get(dayKey) || [];

            return (
              <div key={dayKey} className="relative border-r border-slate-200 divide-y divide-slate-200">
                {/* 24 Hour Slots */}
                {HOURS.map((hour) => {
                  const isActive = hour >= 8 && hour < 20;

                  return (
                    <div
                      key={hour}
                      onClick={() => setSelectedSlot({ date: day, hour })}
                      className={`h-16 transition-colors cursor-pointer group relative ${
                        isActive
                          ? 'bg-white hover:bg-blue-50/40' // Active hours: Bright White
                          : 'bg-slate-100/70 hover:bg-slate-200/50' // Off-hours: Tinted background
                      }`}
                    >
                      {/* Subtle hover plus indicator */}
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 font-bold p-1 absolute top-0 right-1 pointer-events-none">
                        +
                      </span>
                    </div>
                  );
                })}

                {/* Overlaid Appointment Blocks */}
                {dayAppointments.map((appt) => {
                  const { hour, minute } = getISTHourAndMinute(appt.start_time);
                //   const end = getISTHourAndMinute(appt.end_time);

                  // Calculate top offset and height in pixels (each hour = 64px)
                  const topOffsetPx = hour * 64 + (minute / 60) * 64;
                  const durationMinutes =
                    (new Date(appt.end_time).getTime() - new Date(appt.start_time).getTime()) / 60000;
                  const heightPx = Math.max((durationMinutes / 60) * 64 - 2, 24);

                  const colorClass = TYPE_COLORS[appt.type] || TYPE_COLORS.consultation;
                  const dotClass = STATUS_DOTS[appt.status] || STATUS_DOTS.scheduled;

                  return (
                    <div
                      key={appt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(appt);
                      }}
                      style={{
                        top: `${topOffsetPx}px`,
                        height: `${heightPx}px`,
                      }}
                      className={`absolute left-1 right-1 rounded border-l-4 shadow-xs p-1.5 overflow-hidden cursor-pointer hover:shadow-md hover:z-20 transition-all ${colorClass}`}
                      title={`${appt.patient?.name} (${formatISTTime(appt.start_time)} - ${formatISTTime(
                        appt.end_time
                      )})`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} flex-shrink-0`} />
                        <span className="truncate">{appt.patient?.name || 'Patient'}</span>
                      </div>
                      <div className="text-[9px] text-slate-600 truncate mt-0.5">
                        {formatISTTime(appt.start_time)} • Chair {appt.operatory_number}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Booking on Slot Click */}
      {selectedSlot && (
        <ScheduleModal
          initialDate={selectedSlot.date}
          initialHour={selectedSlot.hour}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* Modal: Appointment Inspection & Status Update */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
};