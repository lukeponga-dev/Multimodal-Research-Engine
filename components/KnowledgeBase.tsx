import React, { useRef, useMemo, useState } from 'react';
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
  onClearMemory,
  onExportSession,
  onOpenDocs
}: KnowledgeBaseProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDanger: boolean;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false
  });

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

  const confirmAction = (title: string, message: string, onConfirm: () => void, isDanger = true) => {
    setShowConfirm({ show: true, title, message, onConfirm, isDanger });
  };

  const handleClearMemoryAction = () => {
    confirmAction(
      "Clear All Memory?",
      "This will permanently delete all uploaded documents and data artifacts from your local storage. This action cannot be undone.",
      () => {
        onClearMemory();
        setShowConfirm(prev => ({ ...prev, show: false }));
        if (window.innerWidth < 768 && onClose) onClose();
      }
    );
  };

  const handleClearHistoryAction = () => {
    confirmAction(
      "Wipe Chat History?",
      "Permanently delete all research messages and dialogue from this session? Your uploaded data in context memory will remain untouched.",
      () => {
        onClearHistory();
        setShowConfirm(prev => ({ ...prev, show: false }));
        if (window.innerWidth < 768 && onClose) onClose();
      }
    );
  };

  const handleRemoveDocAction = (doc: DocumentItem) => {
    confirmAction(
      "Remove Document?",
      `Are you sure you want to remove "${doc.name}" from context memory?`,
      () => {
        onRemoveDocument(doc.id);
        if (previewId === doc.id) setPreviewId(null);
        setShowConfirm(prev => ({ ...prev, show: false }));
      }
    );
  };

  const handleLoadDemo = () => {
    onLoadDemoData();
    if (window.innerWidth < 768 && onClose) onClose();
  };

  const parseCSVPreview = (content: string) => {
    const rows = content.split('\n').filter(row => row.trim() !== '').slice(0, 6);
    return rows.map(row => row.split(',').slice(0, 5));
  };

  return (
    <div className={`fixed md:relative inset-y-0 left-0 z-50 w-full max-w-xs md:w-80 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}`}>
      
      {/* Custom Confirmation Modal Overlay */}
      {showConfirm.show && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-6 w-full max-w-[280px] text-center animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${showConfirm.isDanger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
              <i className={`fa-solid ${showConfirm.isDanger ? 'fa-triangle-exclamation' : 'fa-circle-question'} text-xl`}></i>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-zinc-100 mb-2">{showConfirm.title}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">{showConfirm.message}</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={showConfirm.onConfirm}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 ${showConfirm.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirm Delete
              </button>
              <button 
                onClick={() => setShowConfirm(prev => ({ ...prev, show: false }))}
                className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div key={doc.id} className="flex flex-col gap-1">
              <div className={`group p-3 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-between overflow-hidden ${previewId === doc.id ? 'border-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                <div className="flex items-center gap-3 truncate pr-2 flex-1 cursor-pointer" onClick={() => doc.type === 'csv' && setPreviewId(previewId === doc.id ? null : doc.id)}>
                  <i className={`fa-solid ${getIconClass(doc.type)} text-[12px]`}></i>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 truncate">{doc.name}</p>
                  {doc.type === 'csv' && (
                    <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Preview</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDocAction(doc)} 
                    className="p-1.5 text-slate-400 dark:text-zinc-600 hover:text-red-500 transition-colors"
                    title="Remove from Memory"
                  >
                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                  </button>
                </div>
              </div>

              {/* CSV Preview Table */}
              {previewId === doc.id && doc.type === 'csv' && (
                <div className="mx-1 mt-0.5 p-2 bg-slate-100 dark:bg-zinc-800/80 rounded-lg border border-slate-200 dark:border-zinc-700 shadow-inner animate-in slide-in-from-top-1 duration-200 overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Data Preview</span>
                    <button onClick={() => setPreviewId(null)} className="text-[9px] text-indigo-500 hover:text-indigo-600 font-bold">Hide</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[9px] text-slate-600 dark:text-zinc-400 border-collapse">
                      <thead>
                        <tr className="bg-slate-200 dark:bg-zinc-900">
                          {parseCSVPreview(doc.content)[0]?.map((col, idx) => (
                            <th key={idx} className="p-1 text-left border border-slate-300 dark:border-zinc-700 font-bold truncate max-w-[60px]">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parseCSVPreview(doc.content).slice(1).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-slate-200 dark:border-zinc-700">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="p-1 border-r border-slate-200 dark:border-zinc-700 truncate max-w-[60px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[8px] text-slate-400 dark:text-zinc-500 mt-1.5 italic text-center">Showing first 5 rows • All data will be sent to Nexus</p>
                </div>
              )}
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
              <button type="button" onClick={handleClearMemoryAction} className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:border-red-400 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group border-b-2 border-red-100 dark:border-red-900/20 active:scale-95 col-span-2">
                <i className="fa-solid fa-trash-can text-slate-400 group-hover:text-red-600 transition-colors mb-1"></i>
                <span className="text-[9px] font-bold text-slate-600 dark:text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400 uppercase tracking-wider text-center">Clear Memory Bank</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}