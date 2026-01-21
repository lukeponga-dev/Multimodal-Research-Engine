
import React from 'react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-book-open text-lg"></i></div><div><h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">Nexus Documentation</h2><p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Platform Guide & Technical Reference</p></div></div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"><i className="fa-solid fa-xmark text-lg"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          <section><h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2"><i className="fa-solid fa-star text-amber-400"></i> System Overview</h3><p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">Nexus is an advanced research agent designed to synthesize large-scale datasets. By combining <strong>Persistent Context Memory</strong> with <strong>Gemini 3's Deep Reasoning</strong>, Nexus acts as a specialized intelligence layer for complex analytical tasks.</p></section>
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30"><h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-sm uppercase tracking-wider mb-2">Pro Engine</h4><p className="text-xs text-indigo-900/70 dark:text-indigo-200/60 leading-relaxed mb-4">Optimized for high-complexity reasoning, logic, and deep document analysis. Uses a maximum thinking budget (32k tokens) to solve multi-step problems.</p><div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400"><i className="fa-solid fa-check"></i> DEEP REASONING<i className="fa-solid fa-check ml-2"></i> COMPLEX SYNTHESIS</div></div><div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"><h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-sm uppercase tracking-wider mb-2">Flash Engine</h4><p className="text-xs text-emerald-900/70 dark:text-emerald-200/60 leading-relaxed mb-4">Designed for speed and rapid interaction. Ideal for summarization, quick data lookups, and near-instant processing of context.</p><div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><i className="fa-solid fa-bolt"></i> LOW LATENCY<i className="fa-solid fa-check ml-2"></i> RAPID EXTRACTION</div></div></section>
          <section><h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2"><i className="fa-solid fa-database text-blue-500"></i> Context Memory (RAG)</h3><div className="space-y-4"><div className="flex gap-4"><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"><i className="fa-solid fa-file-arrow-up text-slate-500"></i></div><div><h5 className="font-bold text-sm dark:text-zinc-200">Data Persistence</h5><p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">All documents and images uploaded to the sidebar are stored locally in your browser. They are injected into every research prompt to ensure the agent has full visibility of your project scope.</p></div></div><div className="flex gap-4"><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0"><i className="fa-solid fa-camera text-slate-500"></i></div><div><h5 className="font-bold text-sm dark:text-zinc-200">Multimodal Intelligence</h5><p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">Nexus can "see" images in your memory. Uploading charts, diagrams, or UI mockups allows the agent to cross-reference visual data with textual documentation.</p></div></div></div></section>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex justify-center"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nexus v1.2.0 • Powered by Gemini 3 Intelligence</p></div>
      </div>
    </div>
  );
}
