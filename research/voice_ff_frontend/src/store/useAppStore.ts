import { create } from 'zustand';
import type { AppStore } from '../types/index';
import { createPatientSlice } from './slices/patientSlice';
import { createLabSlice } from './slices/labSlice';
import { createVoiceAgentSlice } from './slices/voiceAgentSlice';
import { createOtherSlice } from './slices/otherSlice';
import { createTreatmentPlanSlice } from './slices/treatmentPlanSlice';

export const useAppStore = create<AppStore>()((...a) => ({
  ...createPatientSlice(...a),
  ...createLabSlice(...a),
  ...createVoiceAgentSlice(...a),
  ...createOtherSlice(...a),
  ...createTreatmentPlanSlice(...a)
}));