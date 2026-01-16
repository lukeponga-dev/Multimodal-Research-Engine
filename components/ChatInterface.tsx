
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AppStatus, ModelType } from '../types';
import { transcribeAudio, generateSpeech } from '../geminiService';
import { decode, decodeAudioData } from '../audioUtils';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  status: AppStatus;
  useSearch: boolean;
  setUseSearch: (v: boolean) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onSendMessage: (msg: string) => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onClearHistory: () => void;
  onExportSession: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  status, 
  useSearch, 
  setUseSearch, 
  selectedModel,
  onModelChange,
  onSendMessage,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme,
  onClearHistory,
  onExportSession
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === AppStatus.LOADING) return;
    onSendMessage(input);
    setInput('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) setInput(prev => prev + (prev ? " " : "") + transcription);
          } catch (error) {
            console.error("Transcription error:", error);
          } finally {
            setIsRecording(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSpeech = async (text: string, messageId: string) => {
    if (isSpeaking) return;
    setIsSpeaking(messageId);
    try {
      const base64Audio = await generateSpeech(text);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(null);
      source.start();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(null);
    }
  };

  const isPro = selectedModel === 'gemini-3-pro-preview';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 relative min-w-0 w-full transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm z-10 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <i className="fa-solid fa-brain"></i>
          </button>
          
          <div className={`hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-xl items-center justify-center text-white shadow-lg transition-all ${isPro ? 'bg-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/20' : 'bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/20'}`}>
            <i className={`fa-solid ${isPro ? 'fa-microchip' : 'fa-bolt-lightning'} text-lg`}></i>
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-slate-800 dark:text-zinc-100 text-sm md:text-lg leading-tight truncate">
              Nexus {isPro ? 'Pro' : 'Flash'}
            </h1>
            <p className="text-[8px] md:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider truncate">
              {isPro ? 'Deep Thinking Intelligence' : 'High Speed Synthesis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Model Selection Dropdown */}
          <div className="relative group flex items-center">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value as ModelType)}
              className="appearance-none bg-slate-100 dark:bg-zinc-800 text-[10px] md:text-xs font-bold text-slate-700 dark:text-zinc-300 px-3 md:px-4 py-1.5 pr-8 rounded-full border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all uppercase tracking-tight"
            >
              <option value="gemini-3-pro-preview">Pro (Deep)</option>
              <option value="gemini-3-flash-preview">Flash (Fast)</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 text-[8px] text-slate-400 pointer-events-none"></i>
          </div>

          <button 
            onClick={onExportSession}
            className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            title="Export Research (.md)"
          >
            <i className="fa-solid fa-file-export text-sm"></i>
          </button>

          <button 
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <button 
            onClick={onClearHistory}
            className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
            title="Clear History"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>

          <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 rounded-full px-2 md:px-3 py-1 border border-slate-200 dark:border-zinc-700 shrink-0">
            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${useSearch ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-zinc-500'}`}>
              Search
            </span>
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`w-8 md:w-10 h-4 md:h-5 rounded-full relative transition-colors ${useSearch ? 'bg-green-500' : 'bg-slate-300 dark:bg-zinc-600'}`}
              title="Toggle Google Search Grounding"
            >
              <div className={`absolute top-0.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${useSearch ? 'left-4.5 md:left-5.5 shadow-sm' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 animate-in fade-in zoom-in duration-500">
            <div className={`w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center mb-6 transition-all ${isPro ? 'shadow-indigo-500/10' : 'shadow-emerald-500/10'}`}>
                <i className={`fa-solid ${isPro ? 'fa-atom' : 'fa-bolt'} ${isPro ? 'text-indigo-500' : 'text-emerald-500'} text-3xl animate-pulse`}></i>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Multimodal Research Engine</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
              {isPro 
                ? "Utilizing Gemini 3 Pro for deep reasoning across your memory and the live web." 
                : "Utilizing Gemini 3 Flash for near-instant analysis of your research data."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
               <button onClick={() => setInput("Deeply analyze the trends in my context memory.")} className="p-4 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left font-medium shadow-sm">
                 <i className="fa-solid fa-chart-line mb-2 block"></i>
                 "Analyze memory trends..."
               </button>
               <button onClick={() => setInput("Cross-reference current news with my uploaded research.")} className="p-4 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left font-medium shadow-sm">
                 <i className="fa-solid fa-earth-americas mb-2 block"></i>
                 "Cross-reference web data..."
               </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 md:p-5 shadow-sm transition-all group relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none' 
                : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-bl-none border border-slate-200 dark:border-zinc-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${msg.role === 'user' ? 'fa-user-circle' : isPro ? 'fa-brain' : 'fa-bolt-lightning'} text-[10px] opacity-60`}></i>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {msg.role === 'user' ? 'Researcher' : `${isPro ? 'Pro' : 'Flash'} Intelligence`}
                  </span>
                </div>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => handleSpeech(msg.text, msg.id)}
                    className={`text-xs p-1 rounded-full transition-colors ${isSpeaking === msg.id ? 'text-indigo-500 animate-pulse' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                    title="Read Aloud"
                  >
                    <i className={`fa-solid ${isSpeaking === msg.id ? 'fa-volume-high' : 'fa-volume-low'}`}></i>
                  </button>
                )}
              </div>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {msg.text}
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-1">
                    <i className="fa-solid fa-earth-americas"></i> Verified Search Grounding
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                      <a 
                        key={i} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] md:text-[10px] bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-zinc-700 hover:border-indigo-200 dark:hover:border-indigo-700 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 px-2 py-1 rounded-lg transition-all truncate max-w-[220px]"
                      >
                        {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {status === AppStatus.LOADING && (
          <div className="flex justify-start">
             <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-4">
                <div className="flex space-x-1.5">
                   <div className={`w-2 h-2 ${isPro ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full animate-bounce`}></div>
                   <div className={`w-2 h-2 ${isPro ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full animate-bounce [animation-delay:0.2s]`}></div>
                   <div className={`w-2 h-2 ${isPro ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full animate-bounce [animation-delay:0.4s]`}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm text-slate-400 dark:text-zinc-500 font-medium italic">
                    Nexus {isPro ? 'Pro' : 'Flash'} is thinking...
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter animate-pulse ${isPro ? 'text-indigo-400' : 'text-emerald-400'}`}>
                    Deep Reasoning Active ({isPro ? '32K' : '24K'} budget)
                  </span>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 sticky bottom-0 transition-colors">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex gap-3 relative">
          <div className="relative flex-1 group flex items-center">
             <input
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={isRecording ? "Listening to you..." : `Submit a query for ${isPro ? 'deep analytical research' : 'rapid synthesis'}...`}
               className={`w-full bg-slate-50 dark:bg-zinc-950 border ${isRecording ? 'border-red-500 ring-4 ring-red-500/10 animate-pulse' : 'border-slate-200 dark:border-zinc-800'} rounded-2xl py-3 md:py-4 px-4 md:px-5 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all pr-24 text-slate-800 dark:text-zinc-100`}
               disabled={status === AppStatus.LOADING}
             />
             <div className="absolute right-4 flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                  title="Hold to Record Voice"
                >
                  <i className={`fa-solid ${isRecording ? 'fa-microphone-lines animate-pulse' : 'fa-microphone'}`}></i>
                </button>
                <div className="hidden lg:flex items-center gap-2">
                   <kbd className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg uppercase shadow-sm">⌘ Enter</kbd>
                </div>
             </div>
          </div>
          <button
            type="submit"
            disabled={status === AppStatus.LOADING || !input.trim()}
            className={`${isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl px-4 md:px-6 py-2 transition-all flex items-center justify-center shrink-0 shadow-xl shadow-indigo-200 dark:shadow-none min-w-[50px] md:min-w-[120px]`}
          >
            <i className={`fa-solid ${isPro ? 'fa-microchip' : 'fa-bolt'} text-sm`}></i>
            <span className="text-sm font-bold hidden sm:inline ml-2">Analyze</span>
          </button>
        </form>
        <div className="flex justify-center gap-4 mt-3">
          <p className="text-[9px] md:text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
            <i className={`fa-solid ${isPro ? 'fa-brain text-indigo-400' : 'fa-bolt-lightning text-emerald-400'}`}></i> 
            Thinking Enabled
          </p>
          <p className="text-[9px] md:text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
            <i className="fa-solid fa-cloud text-amber-400"></i> 
            Gemini 3 Intelligence
          </p>
          {isRecording && (
            <p className="text-[9px] md:text-[11px] text-red-500 font-bold animate-pulse flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> RECORDING
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
