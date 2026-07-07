<div align="center">
  <img src="public/logo.png" alt="Aurora Logo" width="120" height="120" style="border-radius: 20px; box-shadow: 0 0 20px rgba(167, 139, 250, 0.4);" />
  <h1>Aurora Audio Toolkit</h1>
  <p><strong>Your out-of-this-world online audio toolkit.</strong></p>
  <p>Processed entirely securely in your browser using WebAssembly.</p>
</div>

---

## 🌌 The Vision
Aurora is a sleek, highly-performant web application designed to replace clunky desktop audio editors with a frictionless, browser-based experience. Featuring an ethereal, glassmorphic UI, Aurora provides lightning-fast audio manipulation.

**Original Idea & Concept by:** [WhatTheHackkk](https://github.com/WhatTheHackkk)  
**Developed & Architected by:** Antigravity AI  

## ✨ Features
With Aurora, your files never leave your device. All processing is done locally in your browser using **FFmpeg WASM** and the **Web Audio API**.

*   🎛 **Equalizer:** Adjust frequencies precisely.
*   🔉 **Bass Booster & Volume Changer:** Complete amplification control.
*   🎧 **3D Audio & Auto Panner:** Immersive spatial effects.
*   ⏳ **Tempo & Pitch Shifter:** Modify time and frequency domains independently.
*   ✂️ **Trimmer / Cutter:** Extract exact clips.
*   🔄 **Reverse Audio:** Play audio backwards effortlessly.
*   🔀 **Converter:** Lossless conversion across formats.
*   *Coming Soon: Machine-learning powered Vocal Remover & Noise Reducer.*

## 🛠 Tech Stack
*   **Frontend Framework:** React + Vite
*   **Styling & UI:** Custom CSS + Framer Motion (for 3D ethereal physics)
*   **Audio Engine:** Web Audio API (`OfflineAudioContext`)
*   **Media Processing:** FFmpeg.wasm (`@ffmpeg/ffmpeg`)
*   **Hosting:** Firebase Hosting (with COOP/COEP headers for SharedArrayBuffer support)

## 🚀 Running Locally
Because FFmpeg requires `SharedArrayBuffer`, the development server must be run with specific Cross-Origin headers.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

## 🔒 Privacy First
Unlike other online audio converters, Aurora does not upload your files to a remote server. The audio is decoded, processed, and encoded directly inside your browser's memory, ensuring 100% privacy.
