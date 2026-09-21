import type { GeminiToolCall , LLMMessage} from '../types/index';

export interface GeminiVoiceResponse {
  responseText: string;
  toolCalls: GeminiToolCall[];
  rawModelMessage: LLMMessage;
}

export async function processVoiceTranscriptWithGemini(
  fullPrompt: string,
  messagesHistory: LLMMessage[],
  toolsDescription:any,
  apiKey: string
): Promise<GeminiVoiceResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `
${fullPrompt}
`;

console.log("Full prompt", fullPrompt);

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: messagesHistory,
    tools: [
      {
        function_declarations: [
          ...toolsDescription
        ],
      },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const json = await res.json();
  const candidate = json.candidates?.[0]?.content?.parts || [];
  
  let responseText = '';
  const toolCalls: GeminiToolCall[] = [];

  for (const part of candidate) {
    if (part.text) {
      responseText += part.text + ' ';
    }
    if (part.functionCall) {
      toolCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args,
      });
    }
  }

  const response = {
    responseText: responseText.trim() || 'Executed requested clinical actions.',
    toolCalls,
    rawModelMessage: {
      role: 'model',
      parts: candidate,
    },
  };

  console.log("Response", response);

  return response;
}