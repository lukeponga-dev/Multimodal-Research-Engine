
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, AppStatus, ModelType, ChatAttachment } from '../types.ts';
import { transcribeAudio, generateSpeech } from '../geminiService.ts';
import { decode, decodeAudioData } from '../audioUtils.ts';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  status: AppStatus;
  useSearch: boolean;
  setUseSearch: (v: boolean) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onSendMessage: (msg: string, attachments?: ChatAttachment[]) => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function ChatInterface({ 
  messages, 
  status, 
  useSearch, 
  setUseSearch, 
  selectedModel,
  onModelChange,
  onSendMessage,
  onToggleSidebar,
  isDarkMode,
  onToggleTheme
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState<ChatAttachment | null>(null);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  
  // Auto-speak state with persistence
  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem('nexus_autospeak_v1') === 'true';
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, isCameraOpen, chatSearchTerm]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  useEffect(() => {
    localStorage.setItem('nexus_autospeak_v1', autoSpeak.toString());
  }, [autoSpeak]);

  // Audio Playback Control
  const stopSpeech = () => {
    if (currentAudioSourceRef.current) {
        try {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current.disconnect();
        } catch (e) {
            // ignore errors if already stopped
        }
        currentAudioSourceRef.current = null;
    }
    setIsSpeaking(null);
  };

  const handleSpeech = async (text: string, messageId: string) => {
    if (isSpeaking === messageId) {
      stopSpeech();
      return;
    }

    stopSpeech(); // Ensure clean state before starting new
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
      source.onended = () => {
        setIsSpeaking(null);
        currentAudioSourceRef.current = null;
      };
      source.start();
      currentAudioSourceRef.current = source;
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(null);
    }
  };

  // Auto-speak Effect
  useEffect(() => {
    // Prevent reading full history on load
    if (lastReadMessageIdRef.current === null && messages.length > 0) {
        lastReadMessageIdRef.current = messages[messages.length - 1].id;
        return;
    }
    
    if (messages.length === 0) {
      // If chat is cleared, stop any active speech and reset tracker
      stopSpeech();
      lastReadMessageIdRef.current = null;
      return;
    }
    
    const lastMsg = messages[messages.length - 1];
    
    // Only process if it's a new message
    if (lastMsg.id !== lastReadMessageIdRef.current) {
        lastReadMessageIdRef.current = lastMsg.id;
        if (lastMsg.role === 'model' && autoSpeak) {
            handleSpeech(lastMsg.text, lastMsg.id);
        }
    }
  }, [messages, autoSpeak]);

  const displayedMessages = useMemo(() => {
    if (!chatSearchTerm.trim()) return messages;
    const regex = new RegExp(escapeRegExp(chatSearchTerm), 'i');
    return messages.filter(msg => regex.test(msg.text));
  }, [messages, chatSearchTerm]);

  const renderMessageText = (text: string) => {
    if (!chatSearchTerm.trim()) return text;
    const regex = new RegExp(`(${escapeRegExp(chatSearchTerm)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="bg-amber-300/40 dark:bg-amber-600/40 text-slate-900 dark:text-zinc-50 rounded px-0.5 shadow-sm border border-amber-400/20 font-semibold">{part}</span> : part
    );
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 3;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isDarkMode) {
        gradient.addColorStop(0, '#f43f5e');
        gradient.addColorStop(1, '#818cf8');
      } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(1, '#6366f1');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
      x += barWidth;
    }
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !pendingSnapshot) || status === AppStatus.LOADING || isTranscribing) return;
    const attachments = pendingSnapshot ? [pendingSnapshot] : [];
    
    onSendMessage(input, attachments);
    setInput('');
    setPendingSnapshot(null);
    setIsCameraOpen(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraOpen(true);
      } catch (fallbackErr) {
        alert("Could not access camera.");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      setPendingSnapshot({ type: 'image', mimeType: 'image/jpeg', data: base64 });
      stopCamera();
    }
  };

  const startRecording = async () => {
    if (isTranscribing || status === AppStatus.LOADING) return;
    try {
      stopSpeech(); // Stop TTS if user starts speaking
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      drawVisualizer();
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setIsRecording(false);
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) {
              onSendMessage(transcription, pendingSnapshot ? [pendingSnapshot] : []);
              setInput('');
              setPendingSnapshot(null);
            }
          } catch (error) {
            console.error("Transcription error:", error);
          } finally {
            setIsTranscribing(false);
            audioCtx.close();
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

  const isPro = selectedModel === 'gemini-3-pro-preview';

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950 relative min-w-0 w-full transition-colors duration-300">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm z-10 transition-colors">
        {showChatSearch ? (
            <div className="flex-1 flex items-center animate-in fade-in slide-in-from-left-2 duration-200 mr-2 md:mr-4">
                <div className="relative w-full max-w-lg">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input autoFocus value={chatSearchTerm} onChange={(e) => setChatSearchTerm(e.target.value)} placeholder="Search conversation..." className="w-full bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 text-sm rounded-xl py-2 pl-9 pr-9 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400" />
                    {chatSearchTerm && (
                        <button onClick={() => setChatSearchTerm('')} className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                             <i className="fa-solid fa-circle-xmark text-xs"></i>
                        </button>
                    )}
                    <button onClick={() => { setShowChatSearch(false); setChatSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                         <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-200">
              <button onClick={onToggleSidebar} className="md:hidden w-10 h-10 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"><i className="fa-solid fa-brain"></i></button>
              <div className={`hidden sm:flex w-9 h-9 md:w-10 md:h-10 rounded-xl items-center justify-center text-white shadow-lg transition-all ${isPro ? 'bg-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/20' : 'bg-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/20'}`}><i className={`fa-solid ${isPro ? 'fa-microchip' : 'fa-bolt-lightning'} text-lg`}></i></div>
              <div className="overflow-hidden">
                <div className="flex items-baseline gap-2"><h1 className="font-bold text-slate-800 dark:text-zinc-100 text-sm md:text-lg leading-tight truncate">Nexus {isPro ? 'Pro' : 'Flash'}</h1><span className="hidden lg:inline text-[9px] text-slate-400 font-bold uppercase tracking-widest border-l border-slate-200 dark:border-zinc-700 pl-2">Infinite Context</span></div>
                <p className="text-[8px] md:text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider truncate">{isPro ? 'Deep Thinking Intelligence' : 'High Speed Synthesis'}</p>
              </div>
            </div>
        )}
        <div className="flex items-center gap-1 md:gap-3">
          {!showChatSearch && (
              <button onClick={() => setShowChatSearch(true)} className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors" title="Search Chat History"><i className="fa-solid fa-magnifying-glass"></i></button>
          )}
          <div className="relative group flex items-center">
            <select value={selectedModel} onChange={(e) => onModelChange(e.target.value as ModelType)} className="appearance-none bg-slate-100 dark:bg-zinc-800 text-[10px] md:text-xs font-bold text-slate-700 dark:text-zinc-300 px-3 md:px-4 py-1.5 pr-8 rounded-full border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all uppercase tracking-tight">
              <option value="gemini-3-pro-preview">Pro (Deep)</option>
              <option value="gemini-3-flash-preview">Flash (Fast)</option>
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 text-[8px] text-slate-400 pointer-events-none"></i>
          </div>
          
          <div className="flex items-center gap-1">
            {isSpeaking && (
                <button
                    onClick={stopSpeech}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-in fade-in zoom-in duration-200"
                    title="Stop Speaking"
                >
                    <i className="fa-solid fa-stop"></i>
                </button>
            )}
            <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${autoSpeak ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                title={autoSpeak ? "Auto-speak: ON" : "Auto-speak: OFF"}
            >
                <i className={`fa-solid ${autoSpeak ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
            </button>
          </div>

          <button onClick={onToggleTheme} className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i></button>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 rounded-full px-2 md:px-3 py-1 border border-slate-200 dark:border-zinc-700 shrink-0">
            <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${useSearch ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-zinc-500'}`}>Search</span>
            <button onClick={() => setUseSearch(!useSearch)} className={`w-8 md:w-10 h-4 md:h-5 rounded-full relative transition-colors ${useSearch ? 'bg-green-500' : 'bg-slate-300 dark:bg-zinc-600'}`} title="Toggle Google Search Grounding">
              <div className={`absolute top-0.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${useSearch ? 'left-[18px] md:left-[22px] shadow-sm' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Camera View Overlay */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-8">
            <button 
              onClick={stopCamera} 
              className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <button 
              onClick={captureSnapshot} 
              className="w-20 h-20 bg-white rounded-full border-8 border-white/30 flex items-center justify-center shadow-2xl transform active:scale-90 transition-all"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                <i className="fa-solid fa-camera text-2xl"></i>
              </div>
            </button>
            <div className="w-14 h-14" /> {/* Spacer */}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-8 scroll-smooth">
        {messages.length === 0 && !isCameraOpen && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 animate-in fade-in zoom-in duration-500">
            <div className={`w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center mb-6 transition-all ${isPro ? 'shadow-indigo-500/10' : 'shadow-emerald-500/10'}`}><i className={`fa-solid ${isPro ? 'fa-atom' : 'fa-bolt'} ${isPro ? 'text-indigo-500' : 'text-emerald-500'} text-3xl animate-pulse`}></i></div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-1">Nexus Sensory Engine</h3>
            <p className="text-[10px] md:text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-[0.2em] mb-4">Synthesis Without Limits.</p>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">Enable "Vision" to scan your environment, or speak to interact with the multimodal reasoning core.</p>
            <div className="flex gap-4">
              <button onClick={startCamera} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                <i className="fa-solid fa-camera"></i> Live Vision
              </button>
            </div>
          </div>
        )}
        
        {displayedMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 md:p-5 shadow-sm transition-all group relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-bl-none border border-slate-200 dark:border-zinc-800'}`}>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {msg.attachments.map((att, i) => (
                    <img key={i} src={`data:${att.mimeType};base64,${att.data}`} alt="Snapshot" className="rounded-lg max-h-48 border border-white/20 shadow-md" />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><i className={`fa-solid ${msg.role === 'user' ? 'fa-user-circle' : isPro ? 'fa-brain' : 'fa-bolt-lightning'} text-[10px] opacity-60`}></i><span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-60">{msg.role === 'user' ? 'Researcher' : `${isPro ? 'Pro' : 'Flash'} Intelligence`}</span></div>
                {msg.role === 'model' && (
                  <button onClick={() => handleSpeech(msg.text, msg.id)} title={isSpeaking === msg.id ? "Stop Speaking" : "Read Aloud"} className={`text-xs p-1 rounded-full transition-colors ${isSpeaking === msg.id ? 'text-red-500' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}><i className={`fa-solid ${isSpeaking === msg.id ? 'fa-stop' : 'fa-volume-low'}`}></i></button>
                )}
              </div>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{renderMessageText(msg.text)}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800"><p className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3 flex items-center gap-1"><i className="fa-solid fa-earth-americas"></i> Verified Search Grounding</p><div className="flex flex-wrap gap-2">{msg.sources.map((src, i) => (<a key={i} href={src.uri} target="_blank" rel="noreferrer" className="text-[9px] md:text-[10px] bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 px-2 py-1 rounded-lg transition-all truncate max-w-[220px]">{src.title}</a>))}</div></div>
              )}
            </div>
          </div>
        ))}

        {(status === AppStatus.LOADING || isTranscribing) && (
          <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl rounded-bl-none p-5 shadow-2xl shadow-indigo-500/10 dark:shadow-none flex items-center gap-5 max-w-sm">
                
                <div className="shrink-0 relative w-14 h-14 flex items-center justify-center">
                  
                  {isTranscribing ? (
                    <>
                      <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-pulse"></div>
                      <div className="flex gap-1 items-center h-6">
                        <div className="w-1.5 bg-amber-500 rounded-full h-3 animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                        <div className="w-1.5 bg-amber-500 rounded-full h-6 animate-[pulse_0.5s_ease-in-out_0.1s_infinite]"></div>
                        <div className="w-1.5 bg-amber-500 rounded-full h-4 animate-[pulse_0.5s_ease-in-out_0.2s_infinite]"></div>
                        <div className="w-1.5 bg-amber-500 rounded-full h-5 animate-[pulse_0.5s_ease-in-out_0.3s_infinite]"></div>
                        <div className="w-1.5 bg-amber-500 rounded-full h-2 animate-[pulse_0.5s_ease-in-out_0.4s_infinite]"></div>
                      </div>
                    </>
                  ) : isPro ? (
                    <>
                       <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-lg"></div>
                       <div className="relative z-10 w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                       <div className="absolute w-8 h-8 border border-indigo-200 dark:border-indigo-800 rounded-lg rotate-45 animate-[spin_6s_linear_infinite]"></div>
                       <div className="absolute w-12 h-12 rounded-full border-[1.5px] border-transparent border-t-purple-500/60 border-b-purple-500/60 animate-[spin_4s_linear_infinite_reverse]"></div>
                       <div className="absolute w-full h-full rounded-full border border-indigo-500/10 dark:border-indigo-400/10"></div>
                       <div className="absolute w-full h-full rounded-full border-l-2 border-indigo-500 animate-[spin_2s_ease-in-out_infinite]"></div>
                       <div className="absolute w-10 h-10 animate-[spin_5s_linear_infinite]">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full absolute -top-0.5 left-1/2 -translate-x-1/2 shadow-sm"></div>
                       </div>
                    </>
                  ) : (
                    <>
                       <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping"></div>
                       <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 border-l-emerald-500 animate-[spin_0.4s_linear_infinite]"></div>
                       <div className="absolute inset-2 rounded-full border-2 border-transparent border-r-emerald-400 animate-[spin_0.6s_linear_infinite_reverse]"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                           <i className="fa-solid fa-bolt text-emerald-500 text-lg animate-[pulse_0.2s_ease-in-out_infinite]"></i>
                       </div>
                    </>
                  )}

                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-800 dark:text-zinc-100 font-bold tracking-tight">
                      {isTranscribing ? 'Nexus Audio Engine' : `Nexus ${isPro ? 'Pro' : 'Flash'}`}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isTranscribing ? 'text-amber-500 animate-pulse' : (isPro ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-emerald-500')}`}>
                      {isTranscribing ? 'Transcribing Input...' : (isPro ? 'Deep Reasoning Active...' : 'Rapid Synthesis...')}
                  </span>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Sensory Input Deck */}
      <div className="p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 sticky bottom-0 transition-colors z-20">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex flex-col gap-4">
            {pendingSnapshot && (
              <div className="flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300 p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-2">
                <div className="relative group shrink-0">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                    <img 
                        src={`data:${pendingSnapshot.mimeType};base64,${pendingSnapshot.data}`} 
                        className="relative w-24 h-24 object-cover rounded-lg shadow-sm"
                        alt="Context" 
                    />
                    <button 
                        type="button"
                        onClick={() => setPendingSnapshot(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-zinc-800 text-slate-500 hover:text-red-500 rounded-full shadow-md border border-slate-100 dark:border-zinc-700 flex items-center justify-center transition-transform hover:scale-110 z-10"
                    >
                        <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Vision</span>
                     <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">Image Context Attached</span>
                   </div>
                   <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight mb-2">
                     Nexus will analyze this image. Add a text prompt below or send as is.
                   </p>
                   <button 
                    type="submit"
                    className="text-[10px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-600 dark:text-zinc-300 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide transition-all shadow-sm hover:shadow"
                   >
                     Analyze Image Only <i className="fa-solid fa-arrow-right ml-1"></i>
                   </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 relative">
                {isRecording && (
                    <div className="absolute inset-0 z-30 bg-red-50 dark:bg-red-950/20 backdrop-blur-sm rounded-2xl flex items-center px-4 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 animate-pulse">
                            <i className="fa-solid fa-microphone text-red-600 dark:text-red-400 text-lg"></i>
                          </div>
                          <div className="flex-1 flex flex-col justify-center h-full overflow-hidden relative">
                             <canvas ref={canvasRef} width={300} height={40} className="w-full h-10 opacity-80"></canvas>
                          </div>
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap animate-pulse">
                             Release to Send
                          </span>
                        </div>
                    </div>
                )}
                
                {isTranscribing && (
                   <div className="absolute inset-0 z-30 bg-amber-50/90 dark:bg-zinc-900/95 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-amber-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 items-center">
                          <div className="w-1.5 h-4 bg-amber-500 rounded-full animate-[bounce_1s_infinite]"></div>
                          <div className="w-1.5 h-6 bg-amber-500 rounded-full animate-[bounce_1s_infinite_0.1s]"></div>
                          <div className="w-1.5 h-4 bg-amber-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                        </div>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] animate-pulse">Processing Voice Input...</span>
                      </div>
                   </div>
                )}

                <div className="relative flex-1 group flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={pendingSnapshot ? "Provide context for this visual..." : `Query Nexus ${isPro ? 'Pro' : 'Flash'}...`}
                        className={`w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl py-4 md:py-5 px-5 md:px-6 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all pr-32 text-slate-800 dark:text-zinc-100 font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600`}
                        disabled={status === AppStatus.LOADING || isTranscribing}
                    />
                    <div className="absolute right-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => isCameraOpen ? stopCamera() : startCamera()}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isCameraOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                            title="Live Vision"
                            disabled={isTranscribing}
                        >
                            <i className="fa-solid fa-camera"></i>
                        </button>

                        <button
                            type="button"
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${isRecording ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40 ring-4 ring-red-500/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-zinc-800'}`}
                            title="Hold to Speak"
                            disabled={isTranscribing || status === AppStatus.LOADING}
                        >
                            <i className={`fa-solid ${isRecording ? 'fa-waveform-lines animate-pulse' : 'fa-microphone'}`}></i>
                            {isRecording && (
                              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap animate-bounce">HOLDING</span>
                            )}
                        </button>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={status === AppStatus.LOADING || isTranscribing || (!input.trim() && !pendingSnapshot)}
                    className={`${isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 text-white rounded-2xl px-6 py-2 transition-all flex items-center justify-center shrink-0 shadow-xl min-w-[140px] border-b-4 ${isPro ? 'border-indigo-800' : 'border-emerald-800'} active:border-b-0 active:translate-y-1 transform`}
                >
                    {status === AppStatus.LOADING ? (
                      <i className="fa-solid fa-spinner-third animate-spin"></i>
                    ) : (
                      <>
                        <i className={`fa-solid ${isPro ? 'fa-atom' : 'fa-bolt'} text-sm`}></i>
                        <span className="text-sm font-black hidden sm:inline ml-2 uppercase tracking-widest">Analyze</span>
                      </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
