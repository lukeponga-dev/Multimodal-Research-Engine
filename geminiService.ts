
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { DocumentItem, ChatMessage, GroundingSource, ModelType, ChatAttachment } from "./types";

export const performResearch = async (
  prompt: string,
  history: ChatMessage[],
  memory: DocumentItem[],
  model: ModelType,
  currentAttachments: ChatAttachment[] = [],
  useSearch: boolean = true
): Promise<{ text: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  // Separate text context from image data (Long term memory)
  const textDocs = memory.filter(doc => doc.type !== 'image');
  const memoryImages = memory.filter(doc => doc.type === 'image');

  const contextHeader = textDocs.length > 0 
    ? `KNOWLEDGE BASE CONTEXT:\n${textDocs.map(doc => `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n`).join('\n')}\n\n`
    : "";

  const isPro = model === 'gemini-3-pro-preview';
  const modelNameLabel = isPro ? 'Pro' : 'Flash';

  const systemInstruction = `You are Nexus ${modelNameLabel}, a high-performance multimodal Research Agent powered by Gemini 3. 
    You have access to visual inputs (camera snapshots) and audio inputs.
    Analyze the provided text documents and images ${isPro ? 'with extreme depth and reasoning' : 'rapidly and accurately'}. 
    If Google Search is enabled, use it to verify facts or find recent developments.
    If images are provided, incorporate visual analysis into your response.
    Be objective, precise, and cite sources when available.
    Use your thinking process to synthesize datasets into cohesive insights ${isPro ? 'utilizing your full reasoning capacity' : 'with minimal latency'}.`;

  // Build conversation history
  const contents = history.map(msg => {
    const parts: any[] = [];
    
    // Only add text part if it's not empty
    if (msg.text && msg.text.trim()) {
      parts.push({ text: msg.text });
    }

    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    // Safety fallback: if a message ends up with no parts, provide a placeholder
    if (parts.length === 0) {
      parts.push({ text: "..." });
    }

    return {
      role: msg.role === 'user' ? 'user' : 'model',
      parts: parts
    };
  });

  // Build current prompt parts (multimodal)
  const currentParts: any[] = [];
  const fullPrompt = contextHeader + prompt;

  if (fullPrompt && fullPrompt.trim()) {
    currentParts.push({ text: fullPrompt });
  }
  
  // 1. Add Memory Images (Long term)
  memoryImages.forEach(img => {
    if (img.content.includes(',')) {
      const base64Data = img.content.split(',')[1];
      if (base64Data) {
        currentParts.push({
            inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: base64Data
            }
        });
      }
    }
  });

  // 2. Add Immediate Attachments (Snapshots/Live Vision)
  currentAttachments.forEach(att => {
    if (att.data) {
        currentParts.push({
        inlineData: {
            mimeType: att.mimeType,
            data: att.data
        }
        });
    }
  });

  // Ensure current message has content
  if (currentParts.length === 0) {
    // Should generally not happen if ChatInterface checks input
    currentParts.push({ text: "Analyze the current context." });
  }

  contents.push({
    role: 'user',
    parts: currentParts
  });

  const config: any = {
    systemInstruction,
    temperature: 0.7,
    // Max thinking budget: 32768 for Pro, 24576 for Flash
    thinkingConfig: { thinkingBudget: isPro ? 32768 : 24576 }
  };

  if (useSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: contents,
    config: config,
  });

  const text = response.text || "I couldn't generate a response.";
  
  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          title: chunk.web.title || 'Source',
          uri: chunk.web.uri
        });
      }
    });
  }

  return { text, sources };
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        { text: "Transcribe this audio exactly. Return only the transcription without any additional commentary." },
      ],
    },
  });
  return response.text?.trim() || "";
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data returned");
  return base64Audio;
};
