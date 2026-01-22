
# Nexus Research Agent

Nexus is a high-performance, multimodal research agent built with React 19, TypeScript, and the Google Gemini 3 API. It is designed to synthesize large datasets, reason deeply over complex problems, and provide real-time information via Google Search grounding.

## 🏛️ Core Architecture

Nexus Research is built around the **Gemini 3 API** as its core reasoning and synthesis engine. Gemini 3 is not used as a peripheral chatbot layer; it functions as the system’s primary cognitive substrate. All major capabilities—context persistence, cross-domain reasoning, and multimodal synthesis—flow directly through Gemini 3.

The application leverages **Gemini 3 Deep Reasoning** to maintain long-horizon continuity across evolving inputs, including documents, datasets, logs, and images. Instead of treating each interaction as an isolated prompt, Gemini 3 operates over a dynamically weighted context stream. This enables the system to compare experimental runs, identify regressions or improvements, and explain causal relationships without requiring users to restate prior context.

**Gemini 3’s multimodal capabilities** are central to the experience. Text, structured data (CSV), PDFs, and visual artifacts are fused into a single reasoning loop, allowing the same agent to transition seamlessly between scientific analysis and software debugging through automatic mode adaptation.

The project also utilizes **low latency Gemini 3 synthesis paths (“Flash mode”)** to support rapid iteration while preserving coherence, demonstrating that speed and depth are not mutually exclusive.

## 🚀 Key Features

### 🧠 Dual Intelligence Models
- **Nexus Pro (Gemini 3 Pro):** Utilizes "Deep Thinking" capabilities with a massive token budget (32k thinking budget) for complex reasoning, coding tasks, and deep analysis.
- **Nexus Flash (Gemini 3 Flash):** Optimized for low-latency, high-speed synthesis and rapid information retrieval.

### 💾 Persistent Context Memory (Knowledge Base)
- **Local Storage:** Uses IndexedDB to store documents and conversation history directly in the browser. Data persists across sessions.
- **RAG-like Context:** Upload text files, JSON, Markdown, and Images to the Knowledge Base. Nexus injects this content into its context window to answer questions based on your specific data.
- **Multimedia Analysis:** Upload images to memory or use the "Live Vision" camera feature. Nexus can analyze visual data alongside textual documentation.

### ⚡ Real-time Capabilities
- **Google Search Grounding:** Verify facts and fetch up-to-the-minute news/data with built-in search tool integration.
- **Live Vision:** Real-time camera integration to capture and analyze the physical environment.
- **Voice Interaction:**
  - **Speech-to-Text:** Real-time audio visualization and transcription.
  - **Text-to-Speech:** High-quality AI voice response generation.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **AI SDK:** `@google/genai` (v1.37.0+)
- **State/Storage:** IndexedDB (Client-side persistence)
- **Audio:** Web Audio API (Visualization, PCM Decoding)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nexus-research-agent
   ```

2. **Environment Configuration:**
   You must have a Google Gemini API Key.
   Ensure your build environment injects the API key as `process.env.API_KEY`.

   *Note: If running in a simple environment, you may need to configure your bundler (Vite/Webpack) to expose this variable.*

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run the Application:**
   ```bash
   npm start
   ```

## 📖 Usage Guide

1. **Select Your Engine:**
   - Use the dropdown in the header to switch between **Pro** (Deep Reasoning) and **Flash** (Speed).

2. **Build Your Knowledge Base:**
   - Open the Sidebar.
   - Click the upload area to add `.txt`, `.json`, `.md` files or Images.
   - These documents are now part of Nexus's permanent memory until you delete them.

3. **Multimodal Interaction:**
   - **Text:** Type queries normally.
   - **Vision:** Click the Camera icon to take a snapshot of your surroundings.
   - **Voice:** Hold the Microphone icon to speak. Nexus will transcribe and auto-reply.

4. **Search Grounding:**
   - Toggle the "Search" switch in the header to enable/disable real-time Google Search access.

5. **Memory Management:**
   - Use the "Clear Chat" button to wipe the current conversation.
   - Use "Clear All" to wipe both conversation and uploaded documents from the database.
   - Use "Export" to download a Markdown report of your entire session.

## 🔒 Privacy Note

This application stores your "Knowledge Base" documents locally in your browser using IndexedDB. However, when you send a message, the content of these documents is sent to the Google Gemini API for processing.

## 📄 License

MIT