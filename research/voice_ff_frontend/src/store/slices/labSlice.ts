import type { StateCreator } from 'zustand';
import type { AppStore, LabSlice } from '../../types/index';

export const createLabSlice: StateCreator<AppStore, [], [], LabSlice> = (set, get) => ({
  labInput: '',
  labs: [
    { id: '1', name: 'Precision Ceramics Dental Lab', createdAt: '09:00 AM' },
    { id: '2', name: 'Apex Ortho Fabrication', createdAt: '10:45 AM' },
  ],

  setLabInput: (labInput) => set({ labInput }),

  addLab: (name) =>
    set((state) => {
      const targetName = (name ?? state.labInput).trim();
      if (!targetName) return state;

      const newLab = {
        id: crypto.randomUUID(),
        name: targetName,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      return {
        labs: [newLab, ...state.labs],
        labInput: '',
      };
    }),

  removeLab: (id) =>
    set((state) => ({
      labs: state.labs.filter((l) => l.id !== id),
    })),

  clearLabInput: () => set({ labInput: '' }),

  getLabPageDescription: () => {
    return({
      labs: get().labs,
      formDescription:[
        {
          name: "lab name",
          purpose: "To enter a new Lab name",
          type: "textbox",
          current_value: get().labInput
        }
      ],
    })
  },

  getLabPrompt: () => {
    // String representation of Page description
    return (JSON.stringify(get().getLabPageDescription()));
  } 
});