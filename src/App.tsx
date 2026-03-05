import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileText, Copy, Download, Settings, Sun, Moon,
  X, CheckCircle, AlertCircle, Loader2, Zap, Trash2, Save
} from "lucide-react";

const MODEL = "gemini-2.5-flash-preview-05-20";
const SYSTEM_PROMPT = `Kamu adalah parser soal ujian yang sangat teliti.
Tugasmu: Analisis input (dokumen PDF) dan ekstrak soal beserta pilihan jawabannya.
Output WAJIB JSON Array murni tanpa markdown.
Format JSON Target:
[
  {
    "question": "Pertanyaan...",
    "answers": ["a. A", "b. B", "c. C", "d. D"]
  }
]`;

export default function App() {
  const [filePayload, setFilePayload] = useState<{ data: string; mimeType: string } | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileName, setFileName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSettings) setTempApiKey(apiKey);
  }, [showSettings]);

  const processFile = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      setError("Format file tidak didukung. Harap upload file .pdf");
      return;
    }
    setIsProcessingFile(true);
    setError(null);
    setJsonOutput(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setFilePayload({ data: base64, mimeType: "application/pdf" });
      setFileName(file.name);
      setIsProcessingFile(false);
    };
    reader.onerror = () => {
      setError("Gagal membaca file.");
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleExtract = async () => {
    if (!apiKey) { setError("API Key belum diisi. Buka Settings ⚙️ untuk menyimpan API Key."); return; }
    if (!filePayload) { setError("Upload file PDF terlebih dahulu."); return; }
    setIsLoading(true);
    setError(null);
    setJsonOutput(null);
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
      const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{
          parts: [
            { inline_data: { mime_type: filePayload.mimeType, data: filePayload.data } },
            { text: "Ekstrak semua soal dari dokumen ini." }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Request gagal");
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Model tidak menghasilkan output.");
      const parsed = JSON.parse(text);
      setJsonOutput(JSON.stringify(parsed, null, 2));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Terjadi kesalahan.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    navigator.clipboard.writeText(jsonOutput);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soal_${fileName.replace(".pdf", "")}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setFilePayload(null);
    setJsonOutput(null);
    setError(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveSettings = () => {
    localStorage.setItem("gemini_api_key", tempApiKey);
    setApiKey(tempApiKey);
    setShowSettings(false);
  };

  const bg = isDarkMode ? "bg-zinc-950 text-white" : "bg-amber-50 text-black";
  const cardClass = isDarkMode
    ? "bg-zinc-900 border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)]"
    : "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]";
  const btnPrimary = isDarkMode
    ? "bg-pink-600 hover:bg-pink-500 border-2 border-white text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.8)] active:translate-x-1 active:translate-y-1 active:shadow-none"
    : "bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none";
  const btnIcon = isDarkMode
    ? "bg-zinc-800 border-2 border-white hover:bg-zinc-700 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.6)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
    : "bg-white border-2 border-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none";

  return (
    <div className={`min-h-screen font-mono ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 ${isDarkMode ? "bg-zinc-950 border-b-2 border-white" : "bg-amber-50 border-b-2 border-black"} px-4 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 flex items-center justify-center ${isDarkMode ? "bg-pink-600 border-2 border-white" : "bg-yellow-400 border-2 border-black"} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
              <Zap size={18} className="text-black" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">SoalExtractor</h1>
              <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>PDF → JSON Converter</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className={`p-2 rounded-none transition-all ${btnIcon}`} title="Clear">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-none transition-all ${btnIcon}`}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setShowSettings(true)} className={`p-2 rounded-none transition-all ${btnIcon}`}>
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[calc(100vh-120px)]">
        {/* Left Panel */}
        <div className="flex flex-col gap-4">
          <div className={`p-4 ${cardClass}`}>
            <div className="flex items-center gap-2 mb-3">
              <Upload size={16} />
              <span className="font-black text-sm uppercase tracking-widest">Upload PDF</span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed transition-all p-8 text-center
                ${isDragging
                  ? isDarkMode ? "border-pink-400 bg-pink-900/20" : "border-yellow-500 bg-yellow-100"
                  : isDarkMode ? "border-zinc-600 hover:border-pink-400 hover:bg-pink-900/10" : "border-zinc-400 hover:border-black hover:bg-yellow-50"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-sm font-bold">Memproses file...</p>
                </div>
              ) : filePayload ? (
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 ${isDarkMode ? "bg-pink-600 border-2 border-white" : "bg-yellow-400 border-2 border-black"}`}>
                    <FileText size={24} />
                  </div>
                  <p className="font-black text-sm break-all">{fileName}</p>
                  <span className={`text-xs font-black px-2 py-0.5 ${isDarkMode ? "bg-green-500 text-black" : "bg-green-400 border border-black text-black"}`}>
                    ✓ READY
                  </span>
                  <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Klik untuk ganti file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 ${isDarkMode ? "border-2 border-zinc-600" : "border-2 border-zinc-300"}`}>
                    <Upload size={28} className={isDarkMode ? "text-zinc-400" : "text-zinc-500"} />
                  </div>
                  <div>
                    <p className="font-black text-sm">Drag & Drop PDF di sini</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>atau klik untuk browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-100 border-2 border-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-red-800 text-sm font-bold">{error}</p>
            </div>
          )}

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={isLoading || !filePayload}
            className={`w-full py-3 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${isLoading || !filePayload
                ? isDarkMode ? "bg-zinc-700 border-2 border-zinc-600 text-zinc-500 cursor-not-allowed" : "bg-zinc-200 border-2 border-zinc-400 text-zinc-400 cursor-not-allowed"
                : btnPrimary
              }`}
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Mengekstrak...</>
            ) : (
              <><Zap size={16} /> Ekstrak Soal</>
            )}
          </button>
        </div>

        {/* Right Panel */}
        <div className={`flex flex-col ${cardClass}`}>
          <div className={`flex items-center justify-between p-3 border-b-2 ${isDarkMode ? "border-white" : "border-black"}`}>
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="font-black text-sm uppercase tracking-widest">JSON Output</span>
            </div>
            {jsonOutput && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-black transition-all ${btnIcon}`}
                >
                  {copySuccess ? <CheckCircle size={12} className="text-green-500" /> : <Copy size={12} />}
                  {copySuccess ? "COPIED!" : "COPY"}
                </button>
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-black transition-all ${btnIcon}`}
                >
                  <Download size={12} /> DOWNLOAD
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="animate-spin" />
                <p className="font-black text-sm">Menghubungi Gemini API...</p>
                <p className={`text-xs ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Mohon tunggu sebentar</p>
              </div>
            ) : jsonOutput ? (
              <pre className={`text-xs leading-relaxed whitespace-pre-wrap break-all ${isDarkMode ? "text-green-400" : "text-black"}`}>
                {jsonOutput}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 opacity-40">
                <div className={`p-4 border-2 ${isDarkMode ? "border-zinc-600" : "border-zinc-300"}`}>
                  <FileText size={32} className={isDarkMode ? "text-zinc-500" : "text-zinc-400"} />
                </div>
                <p className="font-black text-sm">Belum ada output</p>
                <p className={`text-xs ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>Upload PDF dan klik Ekstrak Soal</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-3 text-xs font-bold ${isDarkMode ? "text-zinc-500 border-t-2 border-zinc-800" : "text-zinc-500 border-t-2 border-zinc-200"}`}>
        Made with ❤️ by Coffee ☕
      </footer>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md ${isDarkMode ? "bg-zinc-900 border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.8)]" : "bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"}`}>
            <div className={`flex items-center justify-between p-4 border-b-2 ${isDarkMode ? "border-white" : "border-black"}`}>
              <div className="flex items-center gap-2">
                <Settings size={16} />
                <span className="font-black text-sm uppercase tracking-widest">Settings</span>
              </div>
              <button onClick={() => setShowSettings(false)} className={`p-1 transition-all ${btnIcon}`}>
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block font-black text-xs uppercase tracking-widest mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIza..."
                  className={`w-full px-3 py-2 font-mono text-sm border-2 outline-none transition-all
                    ${isDarkMode
                      ? "bg-zinc-800 border-white text-white placeholder:text-zinc-500 focus:border-pink-400"
                      : "bg-white border-black text-black placeholder:text-zinc-400 focus:border-yellow-500"
                    }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                  Dapatkan API key di <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">aistudio.google.com</a>
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                className={`w-full py-3 font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${btnPrimary}`}
              >
                <Save size={16} /> Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
