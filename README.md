# Resume Match AI: Intelligent Career Suite

A hyper-modern career benchmarking platform designed to empower candidates with high-fidelity ATS audits, semantic resume matching, and real-time voice interview simulations.

## 🚀 Key Features

- **Match Engine**: Leverages TF-IDF vectorization and Cosine Similarity to calculate semantic alignment between profiles and roles.
- **ATS Audit System**: A heuristic-driven parser that audits resume structure, keyword signatures, and formatting for industry compatibility.
- **Neural Voice Simulator**: A low-latency, full-duplex interview theater utilizing Web Audio PCM streaming for realistic practice.
- **Intelligence Archive**: Localized data persistence for tracking career benchmarking history.

## 🛠️ Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Logic Engine**: Custom NLP Engine (TF-IDF/Cosine Similarity)
- **Voice Pipeline**: Web Audio API (PCM 16kHz/24kHz)
- **Intelligence**: Google Gemini API Integration
- **Visualization**: Recharts (Vector Space Mapping)
- **Parsing**: PDF.js (Client-side localized extraction)

## 📐 System Architecture

1. **Extraction**: Documents are parsed locally via `pdf.js` to ensure data privacy.
2. **Vectorization**: Text content is tokenized, stop-words are filtered, and term-frequency vectors are generated.
3. **Similarity Analysis**: The dot product of normalized vectors provides the "Match Score."
4. **Streaming**: Voice input is processed through a ScriptProcessorNode, converted to base64 fragments, and evaluated in real-time.

---
© 2024 Resume Match AI. All Rights Reserved.