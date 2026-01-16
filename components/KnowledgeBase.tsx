
import React, { useRef } from 'react';
import { DocumentItem } from '../types';

interface KnowledgeBaseProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onRemoveDocument: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onClearHistory: () => void;
  onExportSession: () => void;
  onOpenDocs: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ 
  documents, 
  onAddDocument, 
  onRemoveDocument,
  isOpen = false,
  onClose,
  onClearHistory,
  onExportSession,
  onOpenDocs
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`
      fixed md:relative inset-y-0 left-0 z-50 w-80 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 
      transform transition-transform duration-300 ease-in-out flex flex-col h-full
      ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm shadow-sm">
             <i className="fa-solid fa-nexus"></i>
           </div>
           <h2 className="font-bold text-slate-800 dark:text-zinc-100 text-sm tracking-tight">
             Context Memory
           </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold">
            {documents.length}
          </span>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 dark:text-zinc-500">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <div className="group relative border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 flex flex-col items-center justify-center cursor-pointer" 
             onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-cloud-arrow-up text-slate-400 dark:text-zinc-600 group-hover:text-indigo-400 text-xl mb-1"></i>
          <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload Data</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".txt,.json,.md,image/*"
          />
        </div>

        {documents.map((doc) => (
          <div key={doc.id} className="group p-3 bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[85%]">
                <i className={`fa-solid ${
                  doc.type === 'image' ? 'fa-image text-emerald-500' : 
                  doc.type === 'json' ? 'fa-file-code text-orange-400' : 'fa-file-lines text-blue-400'
                } text-xs`}></i>
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">{doc.name}</p>
              </div>
              <button 
                onClick={() => onRemoveDocument(doc.id)}
                className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 text-slate-400 dark:text-zinc-600 hover:text-red-500 transition-opacity"
              >
                <i className="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <i className="fa-solid fa-database text-slate-200 dark:text-zinc-800 text-4xl mb-3"></i>
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest">Memory Idle</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 space-y-3">
        {/* Docs Trigger */}
        <button 
          onClick={onOpenDocs}
          className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 shadow-sm flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-100 dark:bg-zinc-700 rounded-md flex items-center justify-center text-slate-500 dark:text-zinc-400 group-hover:text-indigo-500 transition-colors">
              <i className="fa-solid fa-book-open text-[10px]"></i>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200 transition-colors">System Docs</p>
          </div>
          <i className="fa-solid fa-chevron-right text-[8px] text-slate-300 group-hover:text-indigo-400 transition-all"></i>
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onExportSession}
            className="text-[10px] font-bold py-2.5 px-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-file-export"></i> Export
          </button>
          <button 
            onClick={onClearHistory}
            className="text-[10px] font-bold py-2.5 px-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-trash-can"></i> Clear
          </button>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-xl p-3 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Memory Payload</p>
            <span className="text-[9px] font-bold">{Math.min(documents.length * 10, 100)}%</span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-1 bg-white rounded-full transition-all duration-500" style={{ width: `${Math.min(documents.length * 10, 100)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
