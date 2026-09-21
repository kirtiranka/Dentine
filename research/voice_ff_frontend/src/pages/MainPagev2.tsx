import React, { useState, useEffect, useCallback } from 'react';
import { useEmrStore } from '../store/useEmrStorev2';
import type { Gender } from '../types';
import { ChatPanel } from '../components/ChatPanel';

export const MainPage: React.FC = () => {
  const {
    previousVisits,
    isNewVisitOpen,
    toggleNewVisit,
    formData,
    updateFormField,
    resetForm,
    submitCurrentVisit,
    isChatDockOpen,
    toggleChatDock,
  } = useEmrStore();

  // Width of the docked Chat panel in pixels
  const [dockWidth, setDockWidth] = useState(420);
  const [isDragging, setIsDragging] = useState(false);

  // Dragging calculation
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Calculate width from the right viewport boundary
      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 300;
      const maxWidth = Math.min(850, window.innerWidth * 0.65);

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setDockWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCurrentVisit();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* ── LEFT PANE: MAIN PAGE CONTENT ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-[400px]">
        {/* Top Navbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl">🦷</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                DentEMR Studio
              </h1>
              <p className="text-xs text-zinc-400">Interactive Charting & Clinical Records</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isChatDockOpen && (
              <button
                onClick={() => toggleChatDock(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-md shadow-emerald-950"
              >
                <span>🎙️</span>
                <span>Open Voice Copilot</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 md:p-8 space-y-8 max-w-5xl w-full mx-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Patient Encounters</h2>
              <p className="text-xs text-zinc-400">Collaborate with voice or type manually below</p>
            </div>
            <button
              onClick={() => toggleNewVisit()}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
                isNewVisitOpen
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950'
              }`}
            >
              <span>{isNewVisitOpen ? '✕ Hide Form' : '+ New Visit'}</span>
            </button>
          </div>

          {/* INLINE NEW VISIT FORM (Within page, non-blocking) */}
          {isNewVisitOpen && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-200">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>New Dental Encounter</span>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                      Live Editable
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Speak or type. The assistant automatically populates these inputs.
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Patient Name *
                    </label>
                    <input
                      id="patient_name"
                      type="text"
                      required
                      value={formData.patient_name}
                      onChange={(e) => updateFormField('patient_name', e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Patient Gender */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Gender</label>
                    <select
                      id="patient_gender"
                      value={formData.patient_gender}
                      onChange={(e) => updateFormField('patient_gender', e.target.value as Gender)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="transgender">Transgender</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => updateFormField('dob', e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Patient Complaint */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Chief Complaint
                  </label>
                  <textarea
                    id="patient_complaint"
                    rows={3}
                    value={formData.patient_complaint}
                    onChange={(e) => updateFormField('patient_complaint', e.target.value)}
                    placeholder="Reported symptoms, pain level, location..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Treatment Plan
                  </label>
                  <textarea
                    id="treatment_plan"
                    rows={3}
                    value={formData.treatment_plan}
                    onChange={(e) => updateFormField('treatment_plan', e.target.value)}
                    placeholder="Diagnosed procedures, materials, medications..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2 rounded-xl transition shadow-md shadow-emerald-950"
                  >
                    Save Visit Record
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Previous Visits Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Previous Visits History ({previousVisits.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previousVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{visit.patientName}</h4>
                      <span className="text-[11px] text-zinc-400 capitalize">
                        {visit.patientGender} • DOB: {visit.dob}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-zinc-800 rounded font-mono text-zinc-400 border border-zinc-700">
                      {visit.visitDate}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 pt-2 border-t border-zinc-800">
                    <div>
                      <span className="font-medium text-emerald-400">Complaint:</span>
                      <p className="text-zinc-300 mt-0.5">{visit.complaint || 'None'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-teal-400">Plan:</span>
                      <p className="text-zinc-300 mt-0.5">{visit.treatmentPlan || 'None'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── DRAGGABLE VERTICAL SPLITTER HANDLE ────────────────────────────── */}
      {isChatDockOpen && (
        <div
          onMouseDown={startResizing}
          title="Drag to resize voice panel"
          className={`w-2.5 hover:w-3 bg-zinc-950 hover:bg-emerald-600/60 transition-all cursor-col-resize flex items-center justify-center relative select-none z-20 group border-l border-r border-zinc-800 ${
            isDragging ? 'bg-emerald-500 !w-3' : ''
          }`}
        >
          {/* Grip dots indicator */}
          <div className="flex flex-col space-y-1 items-center">
            <span className="w-1 h-1 bg-zinc-600 group-hover:bg-white rounded-full" />
            <span className="w-1 h-1 bg-zinc-600 group-hover:bg-white rounded-full" />
            <span className="w-1 h-1 bg-zinc-600 group-hover:bg-white rounded-full" />
          </div>
        </div>
      )}

      {/* ── RIGHT PANE: DOCKED VOICE COPILOT ──────────────────────────────── */}
      {isChatDockOpen && (
        <div
          style={{ width: `${dockWidth}px` }}
          className="h-full flex-shrink-0 relative overflow-hidden"
        >
          <ChatPanel />
        </div>
      )}
    </div>
  );
};