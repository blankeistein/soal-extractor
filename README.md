# 🧠 Soal Extractor (Neo-Brutalism Edition)

> **Convert raw PDF/DOCX exam papers into clean JSON automatically.**
> 
> Powered by Google Gemini 2.5 Multimodal Vision API.

## ✨ Features

*   **⚡ Multimodal Processing:** Upload **PDF** or **DOCX** directly. The app sends the raw file (Base64) to Gemini for visual analysis.
    
*   **🎨 Neo-Brutalism UI:** Bold borders, hard shadows, and high contrast design.
    
*   **🌓 Dark/Light Mode:** Toggleable themes for developer eye comfort (Default: Light ☀️).
    
*   **🛡️ Type Safe Output:** Guaranteed JSON Array format for easy integration.
    
*   **🚀 Developer Friendly:** One-click copy & download JSON features.
    

## 🛠️ Tech Stack

*   **Framework:** React 18 (Vite)
    
*   **Styling:** Tailwind CSS
    
*   **Icons:** Lucide React
    
*   **AI:** Google Gemini API (via REST)
    

## 🚀 Getting Started

### 1\. Clone & Install

Pastikan kamu sudah setup project Vite + React + Tailwind.

```
# Install dependencies (Lucide icons)
npm install lucide-react
```

### 2\. Environment Variables

Jangan hardcode API Key! Buat file `.env` di root project:

```
VITE_GEMINI_API_KEY=paste_your_api_key_here
```

> **Note:** Pastikan file `question_extractor.jsx` menggunakan: `const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;`

### 3\. Run Development Server

```
npm run dev
```

## 📂 Project Structure

```
src/
├── components/
│   └── QuestionExtractor.jsx  <-- Main Component
├── App.jsx                    <-- Import extractor here
├── index.css                  <-- Tailwind directives
└── main.jsx
```

## 🔌 API Usage (Under the hood)

Aplikasi ini menggunakan endpoint `generateContent` dengan payload `inlineData` untuk mengirim file secara langsung (Direct File Processing):

```
// Payload Structure sent to Gemini
{
  contents: [{
    parts: [
      { text: "Extract this..." },
      { inlineData: { mimeType: "application/pdf", data: "Base64String..." } }
    ]
  }]
}
```

## 🤝 Contributing

Feel free to fork and submit PRs. Keep the design **BOLD**!

<div align="center"> <strong>Made with ❤️ by Coffee ☕</strong> </div>