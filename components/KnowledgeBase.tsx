import React, { useRef, useState, useMemo } from 'react';
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
  onCompareDocuments,
  onSynthesizeAll,
  onLoadDemoData,
  isOpen = false,
  onClose,
  onClearHistory,
  onClearMemory,
  onExportSession,
  onOpenDocs
}: KnowledgeBaseProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const isImage = file.type.startsWith('image/');
      onAddDocument({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: content,
        type: isImage ? 'image' : (file.name.endsWith('.json') ? 'json' : 'text'),
        mimeType: file.type,
        timestamp: Date.now()
      });
      if (window.innerWidth < 768 && onClose) onClose();
    };
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCompare = () => {
    const selectedDocs = documents.filter(d => selectedIds.has(d.id));
    onCompareDocuments(selectedDocs);
    setSelectedIds(new Set());
    if (window.innerWidth < 768 && onClose) onClose();
  };
  
  const handleSynthesizeAction = () => {
    onSynthesizeAll();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const handleClearHistoryAction = () => {
    onClearHistory();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const handleClearMemoryAction = () => {
    onClearMemory();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const handleLoadDemo = () => {
    onLoadDemoData();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  return (
    <div className={`fixed md:relative inset-y-0 left-0 z-50 w-80 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}`}>
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm shadow-sm"><i className="fa-solid fa-brain"></i></div><h2 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-tight">Context Memory</h2></div>
        <div className="flex items-center gap-2"><span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold">{documents.length}</span><button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 dark:text-zinc-50"><i className="fa-solid fa-xmark"></i></button></div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <div className="group relative border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 flex flex-col items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-cloud-arrow-up text-slate-400 dark:text-zinc-600 group-hover:text-indigo-400 text-xl mb-1"></i>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload Data</p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.json,.md,image/*" />
        </div>
        
        {selectedIds.size > 1 ? (
          <button type="button" onClick={handleCompare} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 animate-in slide-in-from-top-2 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"><i className="fa-solid fa-layer-group"></i>Compare {selectedIds.size} Selected</button>
        ) : documents.length > 0 ? (
          <button type="button" onClick={handleSynthesizeAction} className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all"><i className="fa-solid fa-sparkles"></i>Synthesize All Data</button>
        ) : null}

        {documents.map((doc) => (
          <div key={doc.id} className={`group p-3 bg-white dark:bg-zinc-900/50 border rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer ${selectedIds.has(doc.id) ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-200 dark:border-zinc-800'}`} onClick={() => toggleSelect(doc.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 max-w-[85%]"><div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${selectedIds.has(doc.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>{selectedIds.has(doc.id) ? <i className="fa-solid fa-check text-[10px]"></i> : <div className="w-2 h-2 rounded-full border border-slate-300 dark:border-zinc-600"></div>}</div><div className="flex items-center gap-2 truncate"><i className={`fa-solid ${doc.type === 'image' ? 'fa-image text-emerald-500' : doc.type === 'json' ? 'fa-file-code text-orange-400' : 'fa-file-lines text-blue-400'} text-[10px]`}></i><p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">{doc.name}</p></div></div>
              <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveDocument(doc.id); }} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-zinc-600 hover:text-red-500 transition-opacity"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
            <div className="text-center py-10 flex flex-col items-center">
                <i className="fa-solid fa-database text-slate-200 dark:text-zinc-800 text-4xl mb-3"></i>
                <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest mb-4">Memory Idle</p>
                <button 
                  onClick={handleLoadDemo} 
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all shadow-sm"
                >
                  Load Demo Data
                </button>
            </div>
        )}
      </div>
      <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800">
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm"><div className="flex justify-between items-center mb-1.5"><p className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">Memory Volume</p><span className={`text-[9px] font-bold ${documents.length > 0 ? 'text-indigo-500' : 'text-slate-400'}`}>{memorySize}</span></div><div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(documents.length * 10, 100)}%` }}></div></div></div>
          <div><p className="text-[9px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-2 ml-1">Action Area</p><div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onOpenDocs} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md hover:shadow-indigo-500/10 transition-all group">
              <i className="fa-solid fa-book-open text-slate-400 group-hover:text-indigo-500 mb-1.5 text-sm transition-colors"></i>
              <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Docs</span>
            </button>
             <button type="button" onClick={handleLoadDemo} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:shadow-blue-500/10 transition-all group">
              <i className="fa-solid fa-flask text-slate-400 group-hover:text-blue-500 mb-1.5 text-sm transition-colors"></i>
              <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Demo</span>
            </button>
            <button type="button" onClick={onExportSession} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/10 transition-all group">
              <i className="fa-solid fa-file-export text-slate-400 group-hover:text-emerald-500 mb-1.5 text-sm transition-colors"></i>
              <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Export</span>
            </button>
            <button type="button" onClick={handleClearMemoryAction} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-red-400 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group border-b-2 border-red-100 dark:border-red-900/20">
              <i className="fa-solid fa-trash-can text-slate-400 group-hover:text-red-600 transition-colors"></i>
              <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400 uppercase tracking-wider text-center">Clear Memory</span>
            </button>
          </div></div>
        </div>
      </div>
    </div>
  );
}