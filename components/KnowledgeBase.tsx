import React, { useRef, useMemo } from 'react';
import { DocumentItem } from '../types';

interface KnowledgeBaseProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onRemoveDocument: (id: string) => void;
  onCompareDocuments: (docs: DocumentItem[]) => void;
  onSynthesizeAll: () => void;
  onLoadDemoData: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  onClearHistory: () => void;
  onClearMemory: () => void;
  onExportSession: () => void;
  onOpenDocs: () => void;
}

export default function KnowledgeBase({ 
  documents, 
  onAddDocument, 
  onRemoveDocument,
  onLoadDemoData,
  isOpen = false,
  onClose,
  onClearHistory,
  onExportSession,
  onOpenDocs
}: KnowledgeBaseProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total memory size
  const memorySize = useMemo(() => {
    let bytes = 0;
    documents.forEach(doc => {
      bytes += doc.content.length; // Approximation
    });
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, [documents]);

  const getDocType = (file: File): DocumentItem['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) return 'csv';
    if (file.type === 'application/json' || file.name.endsWith('.json')) return 'json';
    if (file.name.endsWith('.md')) return 'markdown';
    return 'text';
  };

  const getIconClass = (type: DocumentItem['type']) => {
    switch (type) {
      case 'image': return 'fa-image text-emerald-500';
      case 'pdf': return 'fa-file-pdf text-red-500';
      case 'csv': return 'fa-file-csv text-green-500';
      case 'json': return 'fa-file-code text-orange-400';
      case 'markdown': return 'fa-file-lines text-slate-500';
      default: return 'fa-file-lines text-blue-400';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const docType = getDocType(file);
    const isBinary = docType === 'image' || docType === 'pdf';

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onAddDocument({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: content,
        type: docType,
        mimeType: file.type || (docType === 'csv' ? 'text/csv' : 'text/plain'),
        timestamp: Date.now()
      });
      if (window.innerWidth < 768 && onClose) onClose();
    };

    if (isBinary) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistoryAction = () => {
    if (confirm("Permanently delete all chat messages?")) {
      onClearHistory();
      if (window.innerWidth < 768 && onClose) onClose();
    }
  };

  const handleLoadDemo = () => {
    onLoadDemoData();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  return (
    <div className={`fixed md:relative inset-y-0 left-0 z-50 w-full max-w-xs md:w-80 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm shadow-sm">
            <i className="fa-solid fa-brain"></i>
          </div>
          <h2 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-tight">Context Memory</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold">{documents.length}</span>
          <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <div className="group relative border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 flex flex-col items-center justify-center cursor-pointer active:scale-95" onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-cloud-arrow-up text-slate-400 dark:text-zinc-600 group-hover:text-indigo-400 text-2xl mb-2"></i>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload Data</p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.json,.md,.csv,.pdf,image/*" />
        </div>
        
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="group p-3 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden">
              <div className="flex items-center gap-3 truncate pr-2">
                <i className={`fa-solid ${getIconClass(doc.type)} text-[12px]`}></i>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">{doc.name}</p>
              </div>
              <button 
                type="button" 
                onClick={() => onRemoveDocument(doc.id)} 
                className="p-1.5 text-slate-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                title="Remove from Memory"
              >
                <i className="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </div>
          ))}
        </div>

        {documents.length === 0 && (
            <div className="text-center py-10 flex flex-col items-center animate-in fade-in duration-500">
                <i className="fa-solid fa-database text-slate-200 dark:text-zinc-800 text-4xl mb-3"></i>
                <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest mb-4">Memory Idle</p>
                <button 
                  onClick={handleLoadDemo} 
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all shadow-sm active:scale-95"
                >
                  Load Demo Data
                </button>
            </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 shrink-0">
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Memory Volume</p>
              <span className={`text-[9px] font-bold ${documents.length > 0 ? 'text-indigo-500' : 'text-slate-400'}`}>{memorySize}</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(documents.length * 10, 100)}%` }}></div>
            </div>
          </div>
          
          <div>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-2 ml-1">Action Area</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onOpenDocs} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/10 transition-all group active:scale-95">
                <i className="fa-solid fa-book-open text-slate-400 group-hover:text-indigo-500 mb-1.5 text-sm transition-colors"></i>
                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Docs</span>
              </button>
              <button type="button" onClick={handleLoadDemo} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all group active:scale-95">
                <i className="fa-solid fa-flask text-slate-400 group-hover:text-blue-500 mb-1.5 text-sm transition-colors"></i>
                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Demo</span>
              </button>
              <button type="button" onClick={onExportSession} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/10 transition-all group active:scale-95">
                <i className="fa-solid fa-file-export text-slate-400 group-hover:text-emerald-500 mb-1.5 text-sm transition-colors"></i>
                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Export</span>
              </button>
              <button type="button" onClick={handleClearHistoryAction} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group active:scale-95">
                <i className="fa-solid fa-comment-slash text-slate-400 group-hover:text-amber-500 transition-colors"></i>
                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 uppercase tracking-wider text-center">Wipe Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}