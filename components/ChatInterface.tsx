
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, AppStatus, ModelType, ChatAttachment } from '../types';
import { transcribeAudio, generateSpeech } from '../geminiService';
import { decode, decodeAudioData } from '../audioUtils';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  status: AppStatus;
  useSearch: boolean;
  setUseSearch: (v: boolean) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onSendMessage: (msg: string, attachments?: ChatAttachment[], autoSpeak?: boolean) => void;
  onToggleSidebar: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

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
  onToggleTheme
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [pendingSnapshot, setPendingSnapshot] = useState<ChatAttachment | null>(null);
  
  // Search State
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status, isCameraOpen, chatSearchTerm]); // Scroll when search changes too

  // Attach video stream when camera opens and video element is mounted
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // Filter messages based on search term
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

  // Audio Visualizer Logic
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2;
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isDarkMode) {
        gradient.addColorStop(0, '#818cf8'); // Indigo 400
        gradient.addColorStop(1, '#a78bfa'); // Purple 400
      } else {
        gradient.addColorStop(0, '#4f46e5'); // Indigo 600
        gradient.addColorStop(1, '#9333ea'); // Purple 600
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !pendingSnapshot) || status === AppStatus.LOADING) return;
    
    const attachments = pendingSnapshot ? [pendingSnapshot] : [];
    onSendMessage(input, attachments, false);
    setInput('');
    setPendingSnapshot(null);
    setIsCameraOpen(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      // Try getting the environment camera with high resolution
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera error:", err);
      // Fallback attempt: Try any camera if environment constraint fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraOpen(true);
      } catch (fallbackErr) {
        console.error("Fallback camera error:", fallbackErr);
        alert("Could not access camera. Please ensure permissions are granted.");
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
      setPendingSnapshot({
        type: 'image',
        mimeType: 'image/jpeg',
        data: base64
      });
      stopCamera();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Audio Context for Visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      drawVisualizer();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const transcription = await transcribeAudio(base64Audio, 'audio/webm');
            if (transcription) {
              onSendMessage(transcription, pendingSnapshot ? [pendingSnapshot] : [], true);
              setInput('');
              setPendingSnapshot(null);
            }
          } catch (error) {
            console.error("Transcription error:", error);
          } finally {
            setIsRecording(false);
            if (audioContextRef.current) {
              // Not closing the global ref if reused, but for this instance we can close the local ctx if needed
              // or just let GC handle it since we created it locally
              audioCtx.close();
            }
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
        
        {showChatSearch ? (
            <div className="flex-1 flex items-center animate-in fade-in slide-in-from-left-2 duration-200 mr-2 md:mr-4">
                <div className="relative w-full max-w-lg">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input 
                        autoFocus
                        value={chatSearchTerm}
                        onChange={(e) => setChatSearchTerm(e.target.value)}
                        placeholder="Search conversation..."
                        className="w-full bg-slate-100 dark:bg-zinc-800/50 text-slate-800 dark:text-zinc-100 text-sm rounded-xl py-2 pl-9 pr-9 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                    />
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
        )}

        <div className="flex items-center gap-1 md:gap-3">
          {!showChatSearch && (
              <button 
                onClick={() => setShowChatSearch(true)}
                className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                title="Search Chat History"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
          )}

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
            onClick={onToggleTheme}
            className="w-9 h-9 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 rounded-full px-2 md:px-3 py-1 border border-slate-200 dark:border-zinc-700 shrink-0">
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
        {messages.length === 0 && !isCameraOpen && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto px-4 animate-in fade-in zoom-in duration-500">
            <div className={`w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl flex items-center justify-center mb-6 transition-all ${isPro ? 'shadow-indigo-500/10' : 'shadow-emerald-500/10'}`}>
                <i className={`fa-solid ${isPro ? 'fa-atom' : 'fa-bolt'} ${isPro ? 'text-indigo-500' : 'text-emerald-500'} text-3xl animate-pulse`}></i>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-zinc-100 mb-2">Nexus Sensory Engine</h3>
            <p className="text-slate-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
              Enable "Vision" to scan your environment, or speak to interact with the multimodal reasoning core.
            </p>
            <div className="flex gap-4">
                <button onClick={startCamera} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <i className="fa-solid fa-eye"></i> Activate Vision
                </button>
            </div>
          </div>
        )}

        {/* Search Empty State */}
        {messages.length > 0 && displayedMessages.length === 0 && chatSearchTerm && (
             <div className="flex flex-col items-center justify-center h-48 md:h-64 text-slate-400 dark:text-zinc-500 opacity-60 animate-in fade-in zoom-in duration-300">
                 <i className="fa-solid fa-magnifying-glass-minus text-3xl md:text-4xl mb-3"></i>
                 <p className="text-sm font-medium">No results found for "{chatSearchTerm}"</p>
                 <button onClick={() => setChatSearchTerm('')} className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold uppercase tracking-wider">Clear Search</button>
             </div>
        )}

        {/* Live Camera View */}
        {isCameraOpen && (
            <div className="relative w-full max-w-lg mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black aspect-[3/4] sm:aspect-video group animate-in zoom-in-95 duration-300">
                <style>{`
                    @keyframes scan {
                        0% { top: 0%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                `}</style>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Scan Line Animation */}
                    <div className="absolute inset-x-0 h-0.5 bg-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,1)] w-full" style={{ animation: 'scan 3s ease-in-out infinite' }}></div>
                    
                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                    {/* Gradient Vignette */}
                    <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.6) 100%)"></div>

                    {/* Corners */}
                    <div className="absolute top-6 left-6 w-8 h-8 md:w-12 md:h-12 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg drop-shadow-[0_0_4px_rgba(99,102,241,0.8)]"></div>
                    <div className="absolute top-6 right-6 w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg drop-shadow-[0_0_4px_rgba(99,102,241,0.8)]"></div>
                    <div className="absolute bottom-6 left-6 w-8 h-8 md:w-12 md:h-12 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg drop-shadow-[0_0_4px_rgba(99,102,241,0.8)]"></div>
                    <div className="absolute bottom-6 right-6 w-8 h-8 md:w-12 md:h-12 border-b-2 border-r-2 border-indigo-500 rounded-br-lg drop-shadow-[0_0_4px_rgba(99,102,241,0.8)]"></div>

                    {/* Status Text */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-mono font-bold text-white tracking-widest uppercase">Nexus Vision</span>
                    </div>

                    {/* Tech Data (Decorative) */}
                    <div className="absolute bottom-6 left-6 text-[8px] font-mono text-indigo-300/60 hidden sm:block">
                        <p>ISO: AUTO</p>
                        <p>EXP: 0.0</p>
                    </div>
                    <div className="absolute bottom-6 right-6 text-[8px] font-mono text-indigo-300/60 hidden sm:block text-right">
                        <p>AI: ON</p>
                        <p>OBJ: TRACKING</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
                    <div className="flex justify-end">
                         <button onClick={stopCamera} className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-red-500 hover:text-white transition-all border border-white/10 hover:border-red-400">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div className="flex justify-center items-center pb-2">
                        <button 
                            onClick={captureSnapshot} 
                            className="group/shutter relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                        >
                            {/* Outer Ring */}
                            <div className="absolute inset-0 rounded-full border-[3px] border-white/30 group-hover/shutter:border-white/60 transition-colors"></div>
                            {/* Inner Button */}
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover/shutter:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"></div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {displayedMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] rounded-2xl p-4 md:p-5 shadow-sm transition-all group relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none' 
                : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-bl-none border border-slate-200 dark:border-zinc-800'
            }`}>
              {/* Attachments (Snapshots) */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mb-3">
                   {msg.attachments.map((att, i) => (
                       <img 
                        key={i} 
                        src={`data:${att.mimeType};base64,${att.data}`} 
                        alt="Snapshot" 
                        className="rounded-lg max-h-48 border border-white/20 shadow-md"
                       />
                   ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
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
                {renderMessageText(msg.text)}
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
          <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-bl-none p-4 shadow-lg shadow-indigo-500/5 dark:shadow-none flex items-center gap-5 max-w-sm">
                
                {/* Loader Icon */}
                <div className="shrink-0">
                  {isPro ? (
                    // Pro: Deep Thinking Orb
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                      <div className="absolute inset-0 border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_2s_linear_infinite]"></div>
                      <div className="absolute inset-1.5 border-2 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                      <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.8)]"></div>
                    </div>
                  ) : (
                    // Flash: High Speed Wave
                    <div className="flex items-center gap-0.5 h-8">
                       <div className="w-1 h-3 bg-emerald-400/50 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]"></div>
                       <div className="w-1 h-5 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_0.15s_infinite]"></div>
                       <div className="w-1 h-8 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_0.3s_infinite]"></div>
                       <div className="w-1 h-5 bg-emerald-500 rounded-full animate-[pulse_0.6s_ease-in-out_0.45s_infinite]"></div>
                       <div className="w-1 h-3 bg-emerald-400/50 rounded-full animate-[pulse_0.6s_ease-in-out_0.6s_infinite]"></div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-700 dark:text-zinc-200 font-semibold tracking-tight">
                    Nexus {isPro ? 'Pro' : 'Flash'} is {isPro ? 'reasoning' : 'processing'}...
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPro ? 'text-indigo-500' : 'text-emerald-500'}`}>
                       {isPro ? 'Constructing Logic Paths' : 'Synthesizing Data'}
                    </span>
                     {isPro && <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-mono">32k budget</span>}
                  </div>
                </div>
             </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Sensory Input Deck */}
      <div className="p-4 md:p-6 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 sticky bottom-0 transition-colors">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto flex flex-col gap-2">
            {/* Snapshot Preview in Input */}
            {pendingSnapshot && (
                <div className="relative inline-block w-24 mb-2 animate-in slide-in-from-bottom-2">
                    <img 
                        src={`data:${pendingSnapshot.mimeType};base64,${pendingSnapshot.data}`} 
                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-zinc-700 shadow-sm"
                        alt="Preview"
                    />
                    <button 
                        type="button"
                        onClick={() => setPendingSnapshot(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded">SCAN</span>
                </div>
            )}

            <div className="flex gap-3 relative">
                {/* Visualizer Overlay */}
                {isRecording && (
                    <div className="absolute inset-0 z-20 bg-slate-50 dark:bg-zinc-950 rounded-2xl flex items-center px-4 border border-indigo-500/50">
                        <canvas ref={canvasRef} width={200} height={40} className="w-full h-full opacity-80"></canvas>
                        <span className="absolute right-4 text-xs font-bold text-indigo-500 animate-pulse uppercase tracking-widest">Listening...</span>
                    </div>
                )}

                <div className="relative flex-1 group flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={pendingSnapshot ? "Add context to this visual..." : `Query Nexus ${isPro ? 'Pro' : 'Flash'}...`}
                        className={`w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl py-3 md:py-4 px-4 md:px-5 text-sm md:text-base focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-all pr-32 text-slate-800 dark:text-zinc-100`}
                        disabled={status === AppStatus.LOADING}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        {/* Vision Toggle */}
                        <button
                            type="button"
                            onClick={() => isCameraOpen ? stopCamera() : startCamera()}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isCameraOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                            title="Toggle Vision"
                        >
                            <i className="fa-solid fa-eye"></i>
                        </button>

                        {/* Mic Toggle */}
                        <button
                            type="button"
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onMouseLeave={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
                            title="Hold to Speak"
                        >
                            <i className={`fa-solid ${isRecording ? 'fa-microphone-lines animate-pulse' : 'fa-microphone'}`}></i>
                        </button>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={status === AppStatus.LOADING || (!input.trim() && !pendingSnapshot)}
                    className={`${isPro ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-slate-300 dark:disabled:bg-zinc-800 text-white rounded-2xl px-4 md:px-6 py-2 transition-all flex items-center justify-center shrink-0 shadow-xl shadow-indigo-200 dark:shadow-none min-w-[50px] md:min-w-[120px]`}
                >
                    <i className={`fa-solid ${isPro ? 'fa-microchip' : 'fa-bolt'} text-sm`}></i>
                    <span className="text-sm font-bold hidden sm:inline ml-2">Analyze</span>
                </button>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
