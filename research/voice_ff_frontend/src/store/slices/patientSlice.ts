import type { StateCreator } from 'zustand';
import type { AppStore, PatientSlice } from '../../types/index';

export const createPatientSlice: StateCreator<AppStore, [], [], PatientSlice> = (set, get) => ({
  patientInput: '',
  patients: [
    { id: '1', name: 'Eleanor Vance', createdAt: '10:14 AM' },
    { id: '2', name: 'Marcus Brody', createdAt: '11:30 AM' },
  ],

  setPatientInput: (patientInput) => set({ patientInput }),

  addPatient: (name) =>
    set((state) => {
      const targetName = (name ?? state.patientInput).trim();
      if (!targetName) return state;

      const newPatient = {
        id: crypto.randomUUID(),
        name: targetName,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      return {
        patients: [newPatient, ...state.patients],
        patientInput: '',
      };
    }),

  removePatient: (id) =>
    set((state) => ({
      patients: state.patients.filter((p) => p.id !== id),
    })),

  clearPatientInput: () => set({ patientInput: '' }),

  getPatientPageDescription: () => {
    return({
      patients: get().patients,
      formDescription:[
        {
          name: "patient name",
          purpose: "To enter a new Patient name",
          type: "textbox",
          current_value: get().patientInput
        }
      ],
    })
  },

  getPatientPrompt: () => {
    // String representation of Page description
    return (JSON.stringify(get().getPatientPageDescription()));
  } 
});