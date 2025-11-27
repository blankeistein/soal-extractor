import React, { useEffect, useState } from 'react';
import {
  Code,
  FileJson,
  Copy,
  Trash2,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  FileText,
  FileType,
  Moon,
  Sun,
  Coffee
} from 'lucide-react';

type FilePayloadType = {
  data: string;
  mimeType: string;
}

const ExtractionTool = () => {
  const [filePayload, setFilePayload] = useState<FilePayloadType | null>(null);
  const [jsonOutput, setJsonOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileName, setFileName] = useState('');

  // 🌓 Theme State (Default Light ☀️)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ⚙️ Configuration
  const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // 🔄 Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove prefix data url (e.g., "data:application/pdf;base64,")
        const base64Data = reader.result?.toString().split(',')[1] || "";
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 📂 Logic Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setError(null);
    setFileName(file.name);
    setJsonOutput(null);
    setFilePayload(null);

    try {
      // Validasi tipe file yang didukung
      const validTypes = [
        "application/pdf",
      ];

      if (!validTypes.includes(file.type)) {
        throw new Error("Format file tidak didukung. Gunakan .pdf");
      }

      // 🚀 Direct Base64 Conversion untuk PDF
      const base64 = await fileToBase64(file);

      setFilePayload({
        mimeType: file.type,
        data: base64
      });

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Gagal memproses file.");
      }
      setFileName('');
      setFilePayload(null);
    } finally {
      setIsProcessingFile(false);
      e.target.value = "";
    }
  };

  const handleExtract = async () => {
    if (!filePayload) {
      setError("Upload file terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setJsonOutput(null);

    const systemPrompt = `
      Kamu adalah parser soal ujian yang sangat teliti.
      Tugasmu: Analisis input (dokumen PDF/DOCX) dan ekstrak soal beserta pilihan jawabannya.
      Output WAJIB JSON Array murni tanpa markdown.
      
      Format JSON Target:
      [
        {
          "question": "Pertanyaan...",
          "answers": ["a. A", "b. B", "c. C", "d. D"]
        }
      ]
    `;

    const contentParts = [];

    // Instruksi utama
    contentParts.push({ text: "Tolong ekstrak soal dari dokumen ini menjadi JSON." });

    // File Payload (PDF atau DOCX)
    if (filePayload) {
      contentParts.push({
        inlineData: {
          mimeType: filePayload.mimeType,
          data: filePayload.data
        }
      });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Gagal menghubungi Gemini API");
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Tidak ada output dari model.");

      const cleanedText = rawText.replace(/```json|```/g, '').trim();
      const parsedJson = JSON.parse(cleanedText);
      setJsonOutput(parsedJson);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!jsonOutput) return;
    const text = JSON.stringify(jsonOutput, null, 2);
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const handleDownload = () => {
    if (!jsonOutput) return;
    const blob = new Blob([JSON.stringify(jsonOutput, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setFilePayload(null);
    setJsonOutput(null);
    setError(null);
    setFileName('');
  };

  const boxClass = `
    bg-white dark:bg-zinc-900 
    border-2 border-black dark:border-white 
    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]
    transition-all duration-300
  `;

  const btnPrimaryClass = `
    w-full py-4 font-bold border-2 border-black dark:border-white
    bg-yellow-400 dark:bg-pink-600 text-black dark:text-white
    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]
    hover:translate-x-[2px] hover:translate-y-[2px] 
    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]
    active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
    transition-all flex items-center justify-center gap-2
  `;

  const btnIconClass = `
    p-2 border-2 border-black dark:border-white 
    bg-white dark:bg-zinc-800 text-black dark:text-white
    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)]
    hover:translate-x-[1px] hover:translate-y-[1px] 
    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]
    active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
    transition-all disabled:opacity-50
  `;

  return (
    <>
      <div className="min-h-screen font-mono transition-colors duration-300 bg-amber-50 dark:bg-zinc-950 text-black dark:text-white p-4 md:p-8 flex flex-col">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">

          {/* Header Section */}
          <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b-4 border-black dark:border-white">
            <div className="flex items-center gap-4">
              <div className="p-1 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <img src="/icon.png" className='w-12 h-12' />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                  SOAL<span className="text-blue-600 dark:text-purple-400">Extractor</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-2 py-0.5">V3.0</span>
                  <p className="text-sm font-bold opacity-70">Direct PDF</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              className={btnIconClass}
              title="Toggle Theme"
            >
              {
                isDarkMode ?
                  <Sun size={24} strokeWidth={2.5} /> :
                  <Moon size={24} strokeWidth={2.5} />
              }
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">

            {/* LEFT: Input Area */}
            <div className={`${boxClass} p-6 flex flex-col gap-6 h-full`}>
              <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-4">
                <div className="flex items-center gap-2 font-black text-xl uppercase">
                  <FileJson strokeWidth={2.5} />
                  <h3>Source</h3>
                </div>
                {(fileName || filePayload) && (
                  <button
                    onClick={handleClear}
                    className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={16} /> CLEAR
                  </button>
                )}
              </div>

              {/* Dropzone Area */}
              <div className="relative group flex-1 min-h-[250px]">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isProcessingFile}
                />
                <div className={`
                  w-full h-full border-4 border-dashed border-black dark:border-white 
                  transition-all flex flex-col items-center justify-center gap-4 text-center p-6
                  ${isProcessingFile ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-yellow-100 dark:hover:bg-pink-900/20'}
                  ${(filePayload || fileName) ? 'bg-blue-50 dark:bg-purple-900/20 border-solid' : ''}
                `}>
                  {isProcessingFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="animate-spin" size={40} strokeWidth={2.5} />
                      <span className="font-bold text-lg">UPLOADING...</span>
                    </div>
                  ) : fileName ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className={`p-4 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] ${fileName.endsWith('.pdf') ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                        {fileName.endsWith('.pdf') ? <FileType size={40} strokeWidth={2.5} /> : <FileText size={40} strokeWidth={2.5} />}
                      </div>
                      <div>
                        <p className="text-xl font-black truncate max-w-[250px] uppercase">{fileName}</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1 bg-black/5 dark:bg-white/10 py-1 px-3 rounded-full">
                          <CheckCircle size={14} />
                          READY
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                        <Upload size={32} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-xl font-black mb-1 uppercase">Drop File Here</p>
                        <p className="font-bold opacity-60">PDF</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-600 dark:border-red-400 text-red-700 dark:text-red-300 p-4 font-bold flex items-center gap-3">
                  <AlertCircle size={24} />
                  {error}
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={isLoading || !filePayload}
                className={btnPrimaryClass}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Zap size={24} fill="currentColor" />
                    <span>EXTRACT TO JSON</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT: Output Area */}
            <div className={`${boxClass} p-6 flex flex-col gap-6 h-full relative`}>
              <div className="flex justify-between items-center border-b-2 border-black dark:border-white pb-4 z-10">
                <div className="flex items-center gap-2 font-black text-xl uppercase text-green-600 dark:text-green-400">
                  <Code strokeWidth={2.5} />
                  <h3>Result</h3>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={!jsonOutput}
                    className={btnIconClass}
                    title="Download .json"
                  >
                    <Download size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!jsonOutput}
                    className={`${btnIconClass} flex items-center gap-2 px-4`}
                  >
                    {copySuccess ? <CheckCircle size={20} /> : <Copy size={20} strokeWidth={2.5} />}
                    <span className="hidden md:inline font-bold">{copySuccess ? 'OK!' : 'COPY'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 relative bg-gray-100 dark:bg-zinc-950 border-2 border-black dark:border-white overflow-hidden max-h-[520px]">
                {!jsonOutput ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                    <div className="w-20 h-20 border-4 border-dashed border-current flex items-center justify-center mb-4 rounded-full">
                      <Code size={40} />
                    </div>
                    <p className="font-bold uppercase">No Data Yet</p>
                  </div>
                ) : (
                  <pre className="w-full h-full p-6 overflow-auto custom-scrollbar text-sm font-bold leading-relaxed">
                    <code className="language-json">
                      {JSON.stringify(jsonOutput, null, 2)}
                    </code>
                  </pre>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ☕ Footer Area */}
        <footer className="mt-12 py-6 border-t-4 border-black dark:border-white text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-black uppercase tracking-wider transform hover:-rotate-2 transition-transform cursor-default">
            <span>Made with</span>
            <span className="text-red-500 animate-pulse">❤️</span>
            <span>by Coffee</span>
            <Coffee size={20} className="text-amber-700 dark:text-amber-500" strokeWidth={3} />
          </div>
        </footer>
      </div>
    </>
  );
};

export default ExtractionTool;