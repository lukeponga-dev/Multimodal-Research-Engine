
import React, { useState } from 'react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'guide' | 'architecture';

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('guide');

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-book-open text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 leading-tight">Nexus Documentation</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Platform Guide & Technical Reference</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 px-6">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'guide' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
          >
            <i className="fa-solid fa-user-astronaut mr-2"></i> User Guide
            {activeTab === 'guide' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'architecture' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300'}`}
          >
            <i className="fa-solid fa-code mr-2"></i> Architecture
            {activeTab === 'architecture' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/30 dark:bg-black/20">
          
          {activeTab === 'guide' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-star text-amber-400"></i> System Overview
                </h3>
                <p className="text-sm md:text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Nexus is an advanced research agent designed to synthesize large-scale datasets. By combining <strong>Persistent Context Memory</strong> with <strong>Gemini 3's Deep Reasoning</strong>, Nexus acts as a specialized intelligence layer for complex analytical tasks.
                </p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                     <i className="fa-solid fa-brain text-lg"></i>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider mb-2">Pro Engine</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                    Powered by <strong>Gemini 3 Pro</strong>. Optimized for high-complexity reasoning, logic, and deep document analysis. Uses a maximum thinking budget (32k tokens) to solve multi-step problems.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">DEEP REASONING</span>
                    <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">COMPLEX SYNTHESIS</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                     <i className="fa-solid fa-bolt text-lg"></i>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-zinc-100 text-sm uppercase tracking-wider mb-2">Flash Engine</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-4">
                     Powered by <strong>Gemini 3 Flash</strong>. Designed for speed and rapid interaction. Ideal for summarization, quick data lookups, and near-instant processing of context.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">LOW LATENCY</span>
                    <span className="bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">RAPID EXTRACTION</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-database text-blue-500"></i> Context Memory (RAG)
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:dark:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 hover:dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-hard-drive text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm dark:text-zinc-200 mb-1">Local Data Persistence</h5>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        All documents and images uploaded to the sidebar are stored locally in your browser using IndexedDB. This ensures your research context persists across sessions without needing re-upload.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl hover:bg-white hover:dark:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-200 hover:dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-eye text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm dark:text-zinc-200 mb-1">Multimodal Context</h5>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Nexus is natively multimodal. You can upload charts, diagrams, or UI mockups. The agent can "see" these images when they are in memory or attached to a message, allowing for visual cross-referencing.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

               <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-toolbox text-slate-400"></i> Tools & Capabilities
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-600 dark:text-zinc-400">
                  <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> <span><strong>Google Search Grounding:</strong> Verifies facts in real-time.</span></li>
                  <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> <span><strong>Live Vision:</strong> Camera analysis of physical objects.</span></li>
                  <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> <span><strong>Voice I/O:</strong> Speech-to-text & Text-to-speech.</span></li>
                  <li className="flex items-center gap-2"><i className="fa-solid fa-check text-green-500"></i> <span><strong>Session Export:</strong> Download full research reports.</span></li>
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
               
               <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-dna text-indigo-500"></i> Cognitive Substrate
                </h3>
                <div className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed space-y-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                  <p>
                    Nexus Research is built around the <strong>Gemini 3 API</strong> as its core reasoning and synthesis engine. Gemini 3 is not used as a peripheral chatbot layer; it functions as the system’s primary cognitive substrate. All major capabilities—context persistence, cross-domain reasoning, and multimodal synthesis—flow directly through Gemini 3.
                  </p>
                  <p>
                    The application leverages <strong>Gemini 3 Deep Reasoning</strong> to maintain long-horizon continuity across evolving inputs, including documents, datasets, logs, and images. Instead of treating each interaction as an isolated prompt, Gemini 3 operates over a dynamically weighted context stream. This enables the system to compare experimental runs, identify regressions or improvements, and explain causal relationships without requiring users to restate prior context.
                  </p>
                  <p>
                    <strong>Gemini 3’s multimodal capabilities</strong> are central to the experience. Text, structured data (CSV), PDFs, and visual artifacts are fused into a single reasoning loop, allowing the same agent to transition seamlessly between scientific analysis and software debugging through automatic mode adaptation.
                  </p>
                  <p>
                     The project also utilizes <strong>low latency Gemini 3 synthesis paths (“Flash mode”)</strong> to support rapid iteration while preserving coherence, demonstrating that speed and depth are not mutually exclusive.
                  </p>
                </div>
               </section>

               <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-layer-group text-indigo-500"></i> Technical Stack
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-zinc-800 text-xs md:text-sm">
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/50 w-1/3">Core Framework</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-zinc-200 font-mono">React 19, TypeScript</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/50">Styling</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-zinc-200 font-mono">Tailwind CSS (CDN)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/50">AI SDK</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-zinc-200 font-mono">@google/genai v1.37.0</td>
                      </tr>
                      <tr>
                         <td className="px-4 py-3 font-bold text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950/50">Storage</td>
                         <td className="px-4 py-3 text-slate-800 dark:text-zinc-200 font-mono">IndexedDB (IDBWrapper)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-microchip text-indigo-500"></i> Gemini 3 Integration
                </h3>
                <div className="space-y-4">
                  <div className="border-l-2 border-indigo-500 pl-4 py-1">
                    <h5 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Model Configuration</h5>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 mb-2">
                      The application dynamically switches between models based on user selection.
                    </p>
                    <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                      <code className="text-[10px] text-green-400 font-mono">
                        const config = &#123;<br/>
                        &nbsp;&nbsp;model: isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',<br/>
                        &nbsp;&nbsp;thinkingConfig: &#123; thinkingBudget: isPro ? 32768 : 24576 &#125;,<br/>
                        &nbsp;&nbsp;tools: [&#123; googleSearch: &#123;&#125; &#125;]<br/>
                        &#125;;
                      </code>
                    </div>
                  </div>
                   <div className="border-l-2 border-emerald-500 pl-4 py-1">
                    <h5 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Multimodal Pipeline</h5>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                      Images and text documents are flattened into a structured `contents` array. Images are converted to base64 strings (inlineData) and injected alongside text prompts, allowing the model to "read" the entire context window in a single pass.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-indigo-500"></i> Privacy & Data Flow
                </h3>
                 <p className="text-xs md:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <i className="fa-solid fa-circle-info text-amber-500 mr-2"></i>
                  <strong>Local-First Design:</strong> This application runs entirely client-side. The "Memory" (IndexedDB) is isolated to your specific browser profile. Data is only transmitted to Google's GenAI API endpoints during active inference requests. No intermediate backend server stores your research data.
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex justify-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Nexus Research v1.2.0 • Build {new Date().toISOString().split('T')[0]}
          </p>
        </div>
      </div>
    </div>
  );
}