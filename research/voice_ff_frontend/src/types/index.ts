
export interface PatientRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface LabRecord {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionsExecuted?: ToolExecutionResult[];
}

// Slice Interfaces
export interface PatientSlice {
  patientInput: string;
  patients: PatientRecord[];
  setPatientInput: (name: string) => void;
  addPatient: (name?: string) => void;
  removePatient: (id: string) => void;
  clearPatientInput: () => void;
  getPatientPageDescription: () => Record<string, any>;
  getPatientPrompt: () => string;
}

export interface LabSlice {
  labInput: string;
  labs: LabRecord[];
  setLabInput: (name: string) => void;
  addLab: (name?: string) => void;
  removeLab: (id: string) => void;
  clearLabInput: () => void;
  getLabPageDescription: () => Record<string, any>;
  getLabPrompt: () => string;
}

export interface VoiceAgentSlice {
  isChatDockOpen: boolean;
  chatMessages: ChatMessage[];
  isRecording: boolean;
  
  toggleChatDock: (open?: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

// Tool Call structure produced by Google Gemini API
export interface GeminiToolCall {
  name: string;
  args: Record<string, any>;
}

// Result structure to send back to Gemini as a tool response
export interface ToolExecutionResult {
  toolName: string;
  status: 'success' | 'error';
  message: string;
  result?: any;
}


export interface LLMMessage {
  role: string;
  parts: any[];
}


export type ActiveTabName = 'patient' | 'lab' | 'treatment_plan';

import type { TreatmentPlanSlice} from "./treatments";


export interface OtherSlice {
  activeTab: ActiveTabName;
  setActiveTab: (tab: ActiveTabName) => void;

  getOtherDescription: () => Record<string, any>;
  getActiveTabPrompt: () => string;
  getFullPrompt: () => string;
  getToolsDescription: () => any[]; // Array of Gemini FunctionDeclaration
  applyTools: (toolCalls: GeminiToolCall | GeminiToolCall[]) => ToolExecutionResult[];
}

// Unified Combined Store Interface
export type AppStore = PatientSlice & LabSlice & VoiceAgentSlice & TreatmentPlanSlice & OtherSlice;