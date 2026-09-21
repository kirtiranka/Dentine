import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Navbar } from '../components/Navbar';
import { ChatPanel } from '../components/ChatPanel';
import { PatientPage } from '../pages/PatientPage';
import { LabPage } from '../pages/LabPage';
import TreatmentPlansPage from './TreatmentPlansPage';

export const MainPage: React.FC = () => {
  const {activeTab, setActiveTab} = useAppStore();

  // Zustand slice values for voice agent dock
  const isChatDockOpen = useAppStore((state) => state.isChatDockOpen);
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
  }, [isDragging, setDockWidth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* ── LEFT PANE: MAIN CONTENT & PAGES ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-[400px]">
        {/* Top Navbar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'patient' ? <PatientPage /> : activeTab === 'lab' ? <LabPage /> : <TreatmentPlansPage />}
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
          className="h-full shrink-0 relative overflow-hidden"
        >
          <ChatPanel />
        </div>
      )}
    </div>
  );
};

export default MainPage;