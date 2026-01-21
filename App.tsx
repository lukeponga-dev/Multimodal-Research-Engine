import React, { useState, useCallback, useEffect, useRef } from 'react';
import KnowledgeBase from './components/KnowledgeBase.tsx';
import ChatInterface from './components/ChatInterface.tsx';
import DocsModal from './components/DocsModal.tsx';
import { DocumentItem, ChatMessage, AppStatus, ModelType, ChatAttachment } from './types.ts';
import { performResearch } from './geminiService.ts';
import { db } from './db.ts';

const STORAGE_KEYS = {
  THEME: 'nexus_theme_v1',
  MODEL: 'nexus_model_v1'
};

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<ModelType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODEL);
    // Default to 'gemini-3-pro-preview' as the primary model for research tasks
    return (saved as ModelType) || 'gemini-3-pro-preview';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [useSearch, setUseSearch] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  
  const initData = async () => {
    setInitError(null);
    setIsInitializing(true);
    try {
      const [loadedDocs, loadedMsgs] = await Promise.all([
        db.getAllDocuments(),
        db.getAllMessages()
      ]);
      setDocuments(loadedDocs);
      setMessages(loadedMsgs.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err) {
      console.error("Failed to load persistent data:", err);
      setInitError("Nexus could not access its local memory bank. This usually happens due to restricted browser permissions or a full storage profile.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddDocument = async (doc: DocumentItem) => {
    await db.addDocument(doc);
    setDocuments(prev => [...prev, doc]);
  };

  const handleRemoveDocument = async (id: string) => {
    await db.removeDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleLoadDemoData = async () => {
    const demoDocs: DocumentItem[] = [
      {
        id: 'demo-protocol',
        name: 'evaluation_protocol.txt',
        type: 'text',
        timestamp: Date.now(),
        content: `Protocol: Adaptive Model Evaluation Under Latency Constraints

Abstract
This protocol evaluates model performance across repeated experimental runs under fixed compute and latency constraints. Primary objectives include accuracy improvement, latency stability, and variance reduction across batches.

Constraints
- Batch size fixed at 32
- Maximum allowable p95 latency: 120 ms
- Dataset held constant across runs
- No architectural changes between runs; only parameter tuning permitted

Metrics Tracked
- Accuracy (%)
- Precision
- Recall
- p95 Latency (ms)
- Error variance across batches

Evaluation Notes
Improvements in accuracy must not introduce latency regressions beyond the specified threshold. Variance spikes should be treated as instability indicators even if mean accuracy improves. Any recommendation must be justified using both quantitative and visual evidence.`
      },
      {
        id: 'demo-protocol-visual',
        name: 'protocol_page_1.png',
        type: 'image',
        mimeType: 'image/png',
        timestamp: Date.now(),
        // Placeholder for the screenshot provided (Gray document representation)
        content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAADIAQMAAAAwS4omAAAAA1BMVEX///+nxBvIAAAANElEQVRIie3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeALWLAABq15NlAAAAABJRU5ErkJggg=='
      },
      {
        id: 'demo-protocol-ocr',
        name: 'protocol_page_1_ocr.txt',
        type: 'text',
        timestamp: Date.now(),
        content: `Protocol: Adaptive Model Evaluation Under Latency Constraints
Abstract
This protocol evaluates model performance across repeated experimental runs under 
fixed compute and latency constraints. Primary objectives include accuracy improvement, 
latency stability, and variance reduction across batches.
Constraints
- Batch size fixed at 32
- Maximum allowable p95 latency: 120 ms
- Dataset held constant across runs
- No architectural changes between runs; only parameter tuning permitted
Metrics Tracked
- Accuracy (%)
- Precision
- Recall
- p95 Latency (ms)
- Error variance across batches
Evaluation Notes
Improvements in accuracy must not introduce latency regressions beyond the specified 
threshold. Variance spikes should be treated as instability indicators even if mean 
accuracy improves. Any recommendation must be justified using both quantitative and 
visual evidence.`
      },
      {
        id: 'demo-run1',
        name: 'experimental_run_1.csv',
        type: 'text',
        timestamp: Date.now(),
        content: `metric,value
accuracy,82.4
precision,80.1
recall,78.9
p95_latency_ms,94
error_variance,0.021`
      },
      {
        id: 'demo-run2',
        name: 'experimental_run_2.csv',
        type: 'text',
        timestamp: Date.now(),
        content: `metric,value
accuracy,87.6
precision,85.9
recall,84.1
p95_latency_ms,131
error_variance,0.047`
      }
    ];

    try {
      // Filter out duplicates based on ID to avoid errors if clicked multiple times
      const newDocs = demoDocs.filter(demo => !documents.some(d => d.id === demo.id));
      if (newDocs.length === 0) {
        alert("Demo data is already loaded.");
        return;
      }
      
      await Promise.all(newDocs.map(doc => db.addDocument(doc)));
      setDocuments(prev => [...prev, ...newDocs]);
    } catch (e) {
      console.error("Failed to load demo data", e);
      alert("Failed to load demo data.");
    }
  };

  const handleClearHistory = async () => {
    // Immediate clear for "Start Fresh" / "New Chat" experience
    try {
      await db.clearMessages();
      setMessages([]);
      setStatus(AppStatus.IDLE);
    } catch (e) {
      console.error("Failed to clear chat history", e);
    }
  };

  const handleClearMemory = async () => {
    if (confirm("Delete all data from context memory? This action cannot be undone.")) {
      try {
        await db.clearDocuments();
        setDocuments([]);
      } catch (e) {
        console.error("Failed to clear memory", e);
        alert("Failed to clear context memory.");
      }
    }
  };

  const handleResetStorage = async () => {
    if (confirm("This will PERMANENTLY delete all memory documents and chat history. Are you sure?")) {
      try {
        await Promise.all([db.clearMessages(), db.clearDocuments()]);
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        alert("Failed to clear some data. Please clear your browser storage manually.");
      }
    }
  };

  const handleExportSession = () => {
    if (messages.length === 0 && documents.length === 0) {
      alert("No research data to export.");
      return;
    }

    const timestamp = new Date().toLocaleString();
    let mdContent = `# Nexus Research Report\n`;
    mdContent += `**Generated on:** ${timestamp}\n`;
    mdContent += `**Model Used:** ${selectedModel === 'gemini-3-pro-preview' ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}\n\n`;

    mdContent += `## 🧠 Knowledge Base (Memory)\n`;
    if (documents.length === 0) {
      mdContent += `*No documents uploaded.*\n\n`;
    } else {
      documents.forEach(doc => {
        mdContent += `### 📄 ${doc.name} (${doc.type})\n`;
        if (doc.type === 'image') {
          mdContent += `*[Image data attached in memory]*\n\n`;
        } else {
          mdContent += `\`\`\`${doc.type === 'json' ? 'json' : 'text'}\n${doc.content.substring(0, 1000)}${doc.content.length > 1000 ? '...' : ''}\n\`\`\`\n\n`;
        }
      });
    }

    mdContent += `## 💬 Research Dialogue\n\n`;
    if (messages.length === 0) {
      mdContent += `*No conversation history.*\n\n`;
    } else {
      messages.forEach(msg => {
        const role = msg.role === 'user' ? 'Researcher' : 'Nexus Intelligence';
        mdContent += `#### **${role}:**\n${msg.text}\n\n`;
        if (msg.attachments) {
            msg.attachments.forEach(att => {
                mdContent += `*[Snapshot Attached]*\n`;
            });
        }
        if (msg.sources && msg.sources.length > 0) {
          mdContent += `**Sources:**\n`;
          msg.sources.forEach(src => {
            mdContent += `- [${src.title}](${src.uri})\n`;
          });
          mdContent += `\n`;
        }
        mdContent += `---\n\n`;
      });
    }

    mdContent += `\n*EOF - Generated by Nexus AI Research Agent*`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nexus_Research_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = useCallback(async (text: string, attachments: ChatAttachment[] = []) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      attachments,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    db.addMessage(userMsg).catch(console.error);

    setStatus(AppStatus.LOADING);

    try {
      const { text: responseText, sources } = await performResearch(
        text,
        [...messages, userMsg],
        documents,
        selectedModel,
        attachments,
        useSearch
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        sources,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
      db.addMessage(aiMsg).catch(console.error);
      setStatus(AppStatus.IDLE);

      // Auto-speak logic is now handled in ChatInterface via useEffect

    } catch (error) {
      console.error("Research Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Research cycle interrupted. Check your API key or data volume.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      db.addMessage(errorMsg).catch(console.error);
      setStatus(AppStatus.ERROR);
    }
  }, [messages, documents, useSearch, selectedModel]);

  const handleCompareDocuments = useCallback(async (selectedDocs: DocumentItem[]) => {
    if (selectedDocs.length < 2) return;
    
    const docNames = selectedDocs.map(d => d.name).join(', ');
    const comparePrompt = `Synthesize a comprehensive "Compare and Contrast" report for the following items in my context memory: ${docNames}. 
    Please highlight key thematic differences, specific technical variances, and shared similarities. 
    Structure the report with clear headings and a concluding summary of insights.`;
    
    handleSendMessage(comparePrompt);
  }, [handleSendMessage]);

  if (isInitializing) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-slate-400 dark:text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Nexus Memory...</p>
          </div>
       </div>
    );
  }

  if (initError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-zinc-800 text-center animate-in fade-in zoom-in duration-300">
           <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl"></i>
           </div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100 mb-4">Initialization Failure</h2>
           <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-8">
             {initError}
           </p>
           <div className="flex flex-col gap-3">
              <button 
                onClick={initData}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-rotate"></i> Try Again
              </button>
              <button 
                onClick={handleResetStorage}
                className="w-full py-4 bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
              >
                Reset System Data
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-zinc-950' : 'bg-white'}`}>
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-md transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <KnowledgeBase 
        documents={documents} 
        onAddDocument={handleAddDocument} 
        onRemoveDocument={handleRemoveDocument} 
        onCompareDocuments={handleCompareDocuments}
        onLoadDemoData={handleLoadDemoData}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onClearHistory={handleClearHistory}
        onClearMemory={handleClearMemory}
        onExportSession={handleExportSession}
        onOpenDocs={() => setIsDocsOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatInterface 
          messages={messages} 
          status={status} 
          useSearch={useSearch}
          setUseSearch={setUseSearch}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onSendMessage={handleSendMessage} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </div>
  );
}