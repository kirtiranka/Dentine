import React, { useState, useRef, useEffect } from 'react';
import { useEmrStore } from '../store/useEmrStore';
import { DeepgramLiveTranscriber } from '../scripts/deepgramService';
import { processVoiceTranscriptWithGemini } from '../scripts/geminiService';

export const ChatModal: React.FC = () => {
  const {
    isChatModalOpen,
    toggleChatModal,
    isRecording,
    setIsRecording,
    chatMessages,
    addChatMessage,
    getActiveFormSchema,
    isNewVisitOpen,
    toggleNewVisit,
    updateFormField,
    submitCurrentVisit,
  } = useEmrStore();

  const [liveTranscript, setLiveTranscript] = useState('');
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [isProcessingGemini, setIsProcessingGemini] = useState(false);
  const [deepgramKey, setDeepgramKey] = useState(import.meta.env.VITE_DEEPGRAM_API_KEY || '');
  const [geminiKey, setGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const transcriberRef = useRef<DeepgramLiveTranscriber | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, liveTranscript]);

  if (!isChatModalOpen) return null;

  const startListening = async () => {
    setErrorMsg(null);
    if (!deepgramKey) {
      setErrorMsg('Deepgram API Key is required.');
      return;
    }

    setAccumulatedTranscript('');
    setLiveTranscript('');
    const transcriber = new DeepgramLiveTranscriber(deepgramKey);
    transcriberRef.current = transcriber;

    try {
      await transcriber.start(
        (text, isFinal) => {
          if (isFinal) {
            setAccumulatedTranscript((prev) => `${prev} ${text}`.trim());
            setLiveTranscript('');
          } else {
            setLiveTranscript(text);
          }
        },
        (err) => {
          console.error('Deepgram Stream Error:', err);
          setErrorMsg('Deepgram WebSocket connection error.');
          stopListening();
        }
      );
      setIsRecording(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to access microphone.');
      setIsRecording(false);
    }
  };

  const stopListening = async () => {
    if (transcriberRef.current) {
      transcriberRef.current.stop();
      transcriberRef.current = null;
    }
    setIsRecording(false);

    const fullTranscript = `${accumulatedTranscript} ${liveTranscript}`.trim();
    if (!fullTranscript) return;

    // Log the user's voice message
    addChatMessage({
      role: 'user',
      content: fullTranscript,
    });

    if (!geminiKey) {
      setErrorMsg('Gemini API Key is required to process commands.');
      return;
    }

    setIsProcessingGemini(true);
    setErrorMsg(null);

    try {
      // 1. Get active JSON view of the form schema
      const activeSchema = getActiveFormSchema();

      // 2. Call Gemini with Tool Calling
      const result = await processVoiceTranscriptWithGemini(
        fullTranscript,
        activeSchema,
        isNewVisitOpen,
        geminiKey
      );

      // 3. Execute tool calls directly on the Zustand store
      const executedActionLog: string[] = [];

      for (const tool of result.toolCalls) {
        if (tool.name === 'update_form_fields' && tool.args?.fields) {
          // Auto-open form if closed
          if (!isNewVisitOpen) toggleNewVisit(true);

          for (const item of tool.args.fields) {
            updateFormField(item.id, item.value);
            executedActionLog.push(`Filled ${item.id} -> "${item.value}"`);
          }
        } else if (tool.name === 'toggle_new_visit_form') {
          toggleNewVisit(tool.args.open);
          executedActionLog.push(`${tool.args.open ? 'Opened' : 'Closed'} inline visit form`);
        } else if (tool.name === 'submit_visit_form') {
          const ok = submitCurrentVisit();
          executedActionLog.push(ok ? 'Submitted visit form successfully' : 'Failed to submit form (missing patient name)');
        }
      }

      // Add assistant response
      addChatMessage({
        role: 'assistant',
        content: result.responseText,
        actionsExecuted: executedActionLog,
      });
    } catch (err: any) {
      setErrorMsg(`Gemini processing failed: ${err.message}`);
    } finally {
      setIsProcessingGemini(false);
      setAccumulatedTranscript('');
      setLiveTranscript('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col h-160 overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-semibold text-lg text-zinc-100">Dentist Voice Assistant</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Deepgram + Gemini
            </span>
          </div>
          <button
            onClick={() => toggleChatModal(false)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* API Keys Configuration Drawer */}
        {(!import.meta.env.VITE_DEEPGRAM_API_KEY || !import.meta.env.VITE_GEMINI_API_KEY) && (
          <div className="bg-zinc-950 border-b border-zinc-800 p-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Deepgram API Key:</label>
              <input
                type="password"
                value={deepgramKey}
                onChange={(e) => setDeepgramKey(e.target.value)}
                placeholder="Token..."
                className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Gemini API Key:</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200"
              />
            </div>
          </div>
        )}

        {/* Chat History & Live Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && !isRecording && (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
              <p className="text-sm">Click the microphone to dictate dental observations.</p>
              <div className="text-xs bg-zinc-800/60 p-3 rounded-lg border border-zinc-800 max-w-md text-zinc-400 text-left font-mono">
                Example: "Open new visit for Sarah Connor, female, complaining of severe sensitivity on lower molar 30. Treatment plan is composite restoration."
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 rounded-bl-none'
                }`}
              >
                <p>{msg.content}</p>
                {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-700/60 text-xs text-emerald-400 font-mono space-y-0.5">
                    {msg.actionsExecuted.map((act, idx) => (
                      <div key={idx}>✓ {act}</div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {/* Live Dictation Display */}
          {isRecording && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Streaming audio to Deepgram...</span>
              </div>
              <p className="text-sm text-zinc-200 italic">
                {accumulatedTranscript} <span className="text-emerald-400">{liveTranscript}</span>
              </p>
            </div>
          )}

          {isProcessingGemini && (
            <div className="flex items-center space-x-2 text-xs text-teal-400 p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-400 border-t-transparent" />
              <span>Analyzing dictation & executing form actions with Gemini...</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer with Voice Control Button */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {isRecording ? 'Listening... click stop to execute.' : 'Ready for clinical dictation.'}
          </div>

          <button
            onClick={isRecording ? stopListening : startListening}
            disabled={isProcessingGemini}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-medium transition-all shadow-lg ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            } disabled:opacity-50`}
          >
            <span className="text-base">{isRecording ? '⏹' : '🎙'}</span>
            <span>{isRecording ? 'Stop & Execute' : 'Dictate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};