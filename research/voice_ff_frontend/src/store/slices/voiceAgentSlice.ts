import type { StateCreator } from 'zustand';
import type { AppStore, VoiceAgentSlice, ChatMessage } from '../../types/index';

export const createVoiceAgentSlice: StateCreator<AppStore, [], [], VoiceAgentSlice> = (set) => ({
   isChatDockOpen: true, // Docked open by default side-by-side
  chatMessages: [],
  isRecording: false,

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
});