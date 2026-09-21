import React from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ActiveTabName } from '../types/index';

interface NavbarProps {
  activeTab: ActiveTabName;
  setActiveTab: (tab: ActiveTabName) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const isChatDockOpen = useAppStore((state) => state.isChatDockOpen);
  const toggleChatDock = useAppStore((state) => state.toggleChatDock);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-4">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl">🦷</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              DentEMR Studio
            </h1>
            <p className="text-xs text-zinc-400">Clinical Data & Voice Agent</p>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <nav className="flex items-center space-x-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'patient'
                ? 'bg-zinc-800 text-emerald-400 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            👤 Patient Records
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'lab'
                ? 'bg-zinc-800 text-teal-400 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🧪 Lab Orders
          </button>
          <button
            onClick={() => setActiveTab('treatment_plan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'treatment_plan'
                ? 'bg-zinc-800 text-teal-400 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📋 Treatment Plan
          </button>
        </nav>
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
  );
};