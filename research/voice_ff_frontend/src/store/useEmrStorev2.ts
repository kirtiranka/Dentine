import { create } from 'zustand';
import type { Visit, FormFieldSchema, Gender, ChatMessage } from '../types';

interface EmrState {
  // Visits data
  previousVisits: Visit[];
  isNewVisitOpen: boolean;
  
  // Current inline form state
  formData: {
    patient_name: string;
    patient_gender: Gender | '';
    dob: string;
    patient_complaint: string;
    treatment_plan: string;
  };

  // Docked Assistant State
  isChatDockOpen: boolean;
  chatMessages: ChatMessage[];
  isRecording: boolean;

  // Actions
  toggleNewVisit: (open?: boolean) => void;
  updateFormField: (fieldId: string, value: string) => void;
  resetForm: () => void;
  submitCurrentVisit: () => boolean;
  toggleChatDock: (open?: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  // JSON view of active form schema
  getActiveFormSchema: () => FormFieldSchema[];
}

export const useEmrStore = create<EmrState>((set, get) => ({
  previousVisits: [
    {
      id: 'vis-1',
      patientName: 'Eleanor Vance',
      patientGender: 'female',
      dob: '1988-04-12',
      complaint: 'Severe throbbing pain in upper left quadrant near tooth #14.',
      treatmentPlan: 'Root canal therapy indicated for tooth #14 with porcelain crown restoration.',
      visitDate: '2026-03-10',
    },
    {
      id: 'vis-2',
      patientName: 'Marcus Brody',
      patientGender: 'male',
      dob: '1975-11-23',
      complaint: 'Routine 6-month prophylaxis and sensitivity on mandibular incisors.',
      treatmentPlan: 'Scaling and root planing, applied fluoride varnish, recommended Sensodyne.',
      visitDate: '2026-02-18',
    },
  ],

  isNewVisitOpen: true, // Default open so you can test right away

  formData: {
    patient_name: '',
    patient_gender: '',
    dob: '',
    patient_complaint: '',
    treatment_plan: '',
  },

  isChatDockOpen: true, // Docked open by default side-by-side
  chatMessages: [],
  isRecording: false,

  toggleNewVisit: (open) => {
    set((state) => ({
      isNewVisitOpen: open !== undefined ? open : !state.isNewVisitOpen,
    }));
  },

  updateFormField: (fieldId, value) => {
    set((state) => {
      if (fieldId in state.formData) {
        return {
          formData: {
            ...state.formData,
            [fieldId]: value,
          },
        };
      }
      return state;
    });
  },

  resetForm: () => {
    set({
      formData: {
        patient_name: '',
        patient_gender: '',
        dob: '',
        patient_complaint: '',
        treatment_plan: '',
      },
    });
  },

  submitCurrentVisit: () => {
    const { formData, previousVisits, resetForm } = get();
    if (!formData.patient_name.trim()) return false;

    const newVisit: Visit = {
      id: `vis-${Date.now()}`,
      patientName: formData.patient_name,
      patientGender: (formData.patient_gender as Gender) || 'declined',
      dob: formData.dob || new Date().toISOString().split('T')[0],
      complaint: formData.patient_complaint,
      treatmentPlan: formData.treatment_plan,
      visitDate: new Date().toISOString().split('T')[0],
    };

    set({
      previousVisits: [newVisit, ...previousVisits],
      isNewVisitOpen: false,
    });
    resetForm();
    return true;
  },

  toggleChatDock: (open) => {
    set((state) => ({
      isChatDockOpen: open !== undefined ? open : !state.isChatDockOpen,
    }));
  },

  setIsRecording: (recording) => set({ isRecording: recording }),

  addChatMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));
  },

  getActiveFormSchema: () => {
    const { formData } = get();
    return [
      {
        id: 'patient_name',
        type: 'text_input',
        purpose: 'Full name of the dental patient',
        current_value: formData.patient_name,
      },
      {
        id: 'patient_gender',
        type: 'select',
        purpose: 'Gender identity of the patient',
        options: ['male', 'female', 'transgender', 'declined'],
        current_value: formData.patient_gender,
      },
      {
        id: 'dob',
        type: 'date',
        purpose: 'Date of birth (YYYY-MM-DD)',
        current_value: formData.dob,
      },
      {
        id: 'patient_complaint',
        type: 'textarea',
        purpose: 'Chief complaint, symptoms, pain level, and dental issue described by patient',
        current_value: formData.patient_complaint,
      },
      {
        id: 'treatment_plan',
        type: 'textarea',
        purpose: 'Dentist diagnosed treatment plan, procedures, medications, or surgical steps',
        current_value: formData.treatment_plan,
      },
    ];
  },
}));