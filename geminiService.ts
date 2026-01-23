import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { DocumentItem, ChatMessage, GroundingSource, ModelType, ChatAttachment } from "./types";

// Helper to strip markdown for cleaner TTS
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .replace(/\*\*/g, '')      // Remove bold
    .replace(/\*/g, '')        // Remove italics/bullets (single asterisks)
    .replace(/`{3}[\s\S]*?`{3}/g, 'Code block omitted.') // Replace code blocks
    .replace(/`(.+?)`/g, '$1') // Remove inline code ticks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/^\s*-\s+/gm, '') // Remove list hyphens
    .trim();
}

/**
 * Executes a multimodal research task using the Google Gemini 3 API.
 * 
 * @param prompt - The user's current text query.
 * @param history - Array of previous chat messages for context.
 * @param memory - Array of persistent documents (text/images) from the knowledge base.
 * @param model - The specific Gemini model to use (Pro vs Flash).
 * @param currentAttachments - Any temporary images/snapshots attached to the specific prompt.
 * @param useSearch - Whether to enable the Google Search grounding tool.
 * @returns A promise resolving to the generated text and any cited sources.
 */
export const performResearch = async (
  prompt: string,
  history: ChatMessage[],
  memory: DocumentItem[],
  model: ModelType,
  currentAttachments: ChatAttachment[] = [],
  useSearch: boolean = true
): Promise<{ text: string; sources: GroundingSource[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const isPro = model === 'gemini-3-pro-preview';
  const modelNameLabel = isPro ? 'Pro' : 'Flash';

  const systemInstruction = `You are Nexus ${modelNameLabel}, a high-performance multimodal Research Agent powered by Gemini 3. 
    You have access to visual inputs (camera snapshots), audio inputs, and various document types (PDF, CSV, MD).
    Analyze the provided text documents, structured data (CSV), and visual/binary artifacts (Images, PDFs) ${isPro ? 'with extreme depth and reasoning' : 'rapidly and accurately'}. 
    If Google Search is enabled, use it to verify facts or find recent developments.
    If images or PDFs are provided, incorporate visual analysis into your response.
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

  // 1. Add Text-based Docs (Text, JSON, Markdown, CSV)
  const textDocs = memory.filter(doc => ['text', 'json', 'markdown', 'csv'].includes(doc.type));
  textDocs.forEach(doc => {
      currentParts.push({
          text: `[KNOWLEDGE BASE DOCUMENT: ${doc.name} (${doc.type})]\n${doc.content}`
      });
  });
  
  // 2. Add Binary Docs (Images, PDFs)
  const binaryDocs = memory.filter(doc => ['image', 'pdf'].includes(doc.type));
  binaryDocs.forEach(doc => {
    let mimeType = doc.mimeType;
    let base64Data = '';

    // Robustly extract base64 and mimeType from Data URL
    const commaIndex = doc.content.indexOf(',');
    
    if (commaIndex !== -1) {
      base64Data = doc.content.slice(commaIndex + 1);
      
      // Attempt to extract accurate mimeType from the header
      const header = doc.content.slice(0, commaIndex);
      const match = header.match(/data:([^;]+);base64/);
      if (match && match[1]) {
        mimeType = match[1];
      }
    } else {
      // Fallback for raw base64 strings
      base64Data = doc.content;
    }

    // CRITICAL: Clean any whitespace/newlines that might cause API errors
    base64Data = base64Data.replace(/[\r\n\s]+/g, '');

    if (base64Data) {
      currentParts.push({
          inlineData: {
          mimeType: mimeType || (doc.type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          data: base64Data
          }
      });
    }
  });

  // 3. Add User Prompt
  if (prompt && prompt.trim()) {
    currentParts.push({ text: prompt });
  }

  // 4. Add Immediate Attachments (Snapshots/Live Vision)
  currentAttachments.forEach(att => {
    if (att.data) {
        // Clean attachment data as well
        const cleanData = att.data.replace(/[\r\n\s]+/g, '');
        currentParts.push({
        inlineData: {
            mimeType: att.mimeType,
            data: cleanData
        }
        });
    }
  });

  // Ensure current message has content
  if (currentParts.length === 0) {
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

/**
 * Transcribes audio data using Gemini Flash 1.5/2.0 multimodal capabilities.
 * 
 * @param base64Audio - Raw audio data encoded in base64.
 * @param mimeType - The mime type of the audio (e.g., 'audio/webm').
 * @returns The transcribed text.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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

/**
 * Generates speech from text using the Gemini TTS model.
 * Note: Strips markdown characters before processing to ensure clean speech.
 * 
 * @param text - The text to be spoken.
 * @returns Base64 encoded audio data.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // Strip markdown for cleaner TTS processing
  const cleanText = stripMarkdown(text);
  
  // Fallback if text is empty after cleaning
  const promptText = cleanText || "I have no content to read.";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: promptText }] }],
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