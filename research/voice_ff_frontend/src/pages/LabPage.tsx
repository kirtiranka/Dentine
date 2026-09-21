import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const LabPage: React.FC = () => {
  const { labInput, setLabInput, addLab, removeLab, labs, clearLabInput } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labInput.trim()) return;
    addLab();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl w-full mx-auto">
      {/* Action Bar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Dental Laboratory Orders</h2>
          <p className="text-xs text-zinc-400">Specify laboratory partners for crowns, dentures, and aligners</p>
        </div>
        <span className="text-[11px] font-mono bg-teal-950/80 text-teal-400 border border-teal-800/80 px-2.5 py-1 rounded-lg">
          Slice: labSlice
        </span>
      </div>

      {/* Input Card Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-200">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Enter Lab Name</span>
              <span className="text-[10px] font-mono bg-teal-950/80 text-teal-400 border border-teal-800/80 px-2 py-0.5 rounded">
                Live Editable
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter the partner lab or manufacturing facility.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="lab_name" className="block text-xs font-medium text-zinc-400 mb-1">
              Laboratory Name *
            </label>
            <input
              id="lab_name"
              type="text"
              required
              value={labInput}
              onChange={(e) => setLabInput(e.target.value)}
              placeholder="e.g. Apex Bio-Ceramics Lab"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={clearLabInput}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Clear
            </button>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-950"
            >
              + Add Lab
            </button>
          </div>
        </form>
      </div>

      {/* Displayed Names Below the Textbox */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Registered Laboratories ({labs.length})
          </h3>
          <span className="text-[11px] text-zinc-500">Live synced to voice state</span>
        </div>

        {labs.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
            No lab names entered yet. Enter one above or speak to the Voice Copilot.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab) => (
              <div
                key={lab.id}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-teal-950/80 border border-teal-800/80 text-teal-400 flex items-center justify-center font-bold text-xs">
                    🧪
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-sm">{lab.name}</h4>
                    <span className="text-[10px] text-zinc-400">Logged at {lab.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeLab(lab.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded transition text-xs"
                  title="Remove entry"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};