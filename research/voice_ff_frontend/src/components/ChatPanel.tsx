import React, { useState, useRef, useEffect } from "react";
// import { useEmrStore } from '../store/useEmrStorev2';
import { useAppStore } from "../store/useAppStore";
import { DeepgramLiveTranscriber } from "../scripts/deepgramService";
import { processVoiceTranscriptWithGemini } from "../scripts/geminiService";
import type { ToolExecutionResult , LLMMessage} from "../types/index";

export const ChatPanel: React.FC = () => {
  const {
    toggleChatDock,
    isRecording,
    setIsRecording,
    chatMessages,
    addChatMessage,
    getFullPrompt,
    getToolsDescription,
    applyTools,
  } = useAppStore();

  const [liveTranscript, setLiveTranscript] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const [isProcessingGemini, setIsProcessingGemini] = useState(false);
  const [deepgramKey, setDeepgramKey] = useState(
    import.meta.env.VITE_DEEPGRAM_API_KEY || "",
  );
  const [geminiKey, setGeminiKey] = useState(
    import.meta.env.VITE_GEMINI_API_KEY || "",
  );
  const [showConfig, setShowConfig] = useState(!deepgramKey || !geminiKey);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const transcriberRef = useRef<DeepgramLiveTranscriber | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, liveTranscript]);

  const startListening = async () => {
    setErrorMsg(null);
    if (!deepgramKey) {
      setErrorMsg("Deepgram API Key is required.");
      setShowConfig(true);
      return;
    }

    setAccumulatedTranscript("");
    setLiveTranscript("");
    const transcriber = new DeepgramLiveTranscriber(deepgramKey);
    transcriberRef.current = transcriber;

    try {
      await transcriber.start(
        (text, isFinal) => {
          if (isFinal) {
            setAccumulatedTranscript((prev) => `${prev} ${text}`.trim());
            setLiveTranscript("");
          } else {
            setLiveTranscript(text);
          }
        },
        (err) => {
          console.error("Deepgram Stream Error:", err);
          setErrorMsg("Deepgram WebSocket connection error.");
          stopListening();
        },
      );
      setIsRecording(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to access microphone.");
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

    addChatMessage({
      role: "user",
      content: fullTranscript,
    });

    if (!geminiKey) {
      setErrorMsg("Gemini API Key is required to process commands.");
      setShowConfig(true);
      return;
    }

    setIsProcessingGemini(true);
    setErrorMsg(null);

    try {
      const transcript = fullTranscript;
      const messagesHistory: LLMMessage[] = [
        {
          role: 'user',
          parts: [{ text: `Dentist dictation: "${transcript}"` }],
        }
      ]

      let completed:boolean = false;
      let iterations = 0;
      const MAX_ITERATIONS = 5; // Safety guard against infinite loops

      while (!completed && iterations < MAX_ITERATIONS) {
        iterations++;

        const fullPrompt = getFullPrompt();
        const toolsDescription = getToolsDescription();
        
        const result = await processVoiceTranscriptWithGemini(
          fullPrompt,
          messagesHistory,
          toolsDescription,
          geminiKey,
        );

        if (result.toolCalls.length === 0) {
          addChatMessage({
            role: "assistant",
            content: result.responseText || "Completed clinical actions.",
          });
          completed = true;
          break;
        }
  
        const executedActionLog: ToolExecutionResult[] = applyTools(
          result.toolCalls,
        );
  
        addChatMessage({
          role: "assistant",
          content: result.responseText || "Updating records...",
          actionsExecuted: executedActionLog,
        });

        // 3. STEP 1 FOR GEMINI: Push the MODEL turn containing the functionCall(s)
        messagesHistory.push(result.rawModelMessage);

        // 4. STEP 2 FOR GEMINI: Push the USER turn containing the functionResponse(s)
        messagesHistory.push({
          role: 'user',
          parts: result.toolCalls.map((toolCall, index) => ({
            functionResponse: {
              name: toolCall.name,
              // ⚠️ CRITICAL: 'response' MUST be a JSON object, not a primitive string
              response: {
                status: executedActionLog[index]?.status || 'success',
                output: executedActionLog[index]?.message || 'Action executed successfully',
                data: executedActionLog[index]?.result ?? null,
              },
            },
          })),
        });
      }

    } catch (err: any) {
      setErrorMsg(`Gemini processing failed: ${err.message}`);
    } finally {
      setIsProcessingGemini(false);
      setAccumulatedTranscript("");
      setLiveTranscript("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-l border-zinc-800 text-zinc-100 select-auto">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h3 className="font-semibold text-sm text-zinc-100 truncate">
            Clinical Copilot
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            Nova-2 + Gemini
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure API Keys"
            className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 rounded bg-zinc-800/60 hover:bg-zinc-800 transition"
          >
            ⚙️ Keys
          </button>
          <button
            onClick={() => toggleChatDock(false)}
            title="Collapse dock"
            className="text-zinc-400 hover:text-zinc-100 text-sm px-2 py-1 transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Collapsible Key Config */}
      {showConfig && (
        <div className="bg-zinc-950 p-3 border-b border-zinc-800 space-y-2 text-xs">
          <div>
            <label className="text-zinc-400 block mb-0.5">
              Deepgram Token:
            </label>
            <input
              type="password"
              value={deepgramKey}
              onChange={(e) => setDeepgramKey(e.target.value)}
              placeholder="Paste token..."
              className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 text-xs"
            />
          </div>
          <div>
            <label className="text-zinc-400 block mb-0.5">
              Gemini API Key:
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-200 text-xs"
            />
          </div>
        </div>
      )}

      {/* Message and Dictation Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {chatMessages.length === 0 && !isRecording && (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2 p-2">
            <p className="text-xs">
              Click <strong>Dictate</strong> below to dictate findings.
            </p>
            <div className="text-[11px] bg-zinc-950/70 p-3 rounded-lg border border-zinc-800 text-zinc-400 text-left font-mono">
              Try saying:
              <br />
              "Set patient name to Arthur Pendelton, male, DOB 1990-05-15.
              Complaint is pain on tooth #19 with temperature sensitivity.
              Treatment plan is ceramic inlay."
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-none"
                  : "bg-zinc-800 border border-zinc-700/60 text-zinc-200 rounded-bl-none"
              }`}
            >
              <p>{msg.content}</p>
              {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
                <div className="mt-2 pt-1.5 border-t border-zinc-700 text-[10px] text-emerald-400 font-mono space-y-0.5">
                  {msg.actionsExecuted.map((act, idx) => (
                    <div key={idx}>✓ {act.message}</div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[9px] text-zinc-500 mt-0.5 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isRecording && (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-2.5">
            <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-semibold mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Streaming mic to Deepgram...</span>
            </div>
            <p className="text-xs text-zinc-200 italic">
              {accumulatedTranscript}{" "}
              <span className="text-emerald-400">{liveTranscript}</span>
            </p>
          </div>
        )}

        {isProcessingGemini && (
          <div className="flex items-center space-x-2 text-xs text-teal-400 p-2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-teal-400 border-t-transparent" />
            <span>Gemini updating active form...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Control Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">
          {isRecording ? "Listening..." : "Ready"}
        </span>

        <button
          onClick={isRecording ? stopListening : startListening}
          disabled={isProcessingGemini}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
            isRecording
              ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          } disabled:opacity-50`}
        >
          <span>{isRecording ? "⏹" : "🎙"}</span>
          <span>{isRecording ? "Stop & Execute" : "Dictate"}</span>
        </button>
      </div>
    </div>
  );
};
