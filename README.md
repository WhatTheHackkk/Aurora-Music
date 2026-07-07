# Aurora Music 🎵✨

Welcome to **Aurora Music**, an ethereal and highly advanced audio manipulation engine right in your browser. Built entirely with the Web Audio API and React, Aurora Music provides a seamless, dynamic, and visually stunning way to edit, process, and completely transform your audio files on the fly—without any server-side processing!

**Live Demo**: [Aurora Music PWA](https://aurora-audio.web.app)

## 🚀 Features

Aurora Music features an incredibly responsive and beautiful mobile-first UI with real-time audio visualization, delivering an immersive experience. Here are some of the key effects included:

- **Ethereal Visualizer**: A stunning, hardware-accelerated canvas visualizer that reacts to the music's frequencies in real time with beautiful glowing gradients.
- **Nightcore Preset**: Instantly speed up your audio and pitch shift it upwards for that high-energy, fast-paced Nightcore feel.
- **8D Audio Generator**: Creates an immersive 360-degree rotating audio experience utilizing spatial panning, Haas-effect echoing, and reverb.
- **Vocal Remover**: Advanced phase-cancellation algorithm that isolates the instrumental by removing center-panned frequencies (usually lead vocals).
- **Slowed + Reverb**: Perfect for that lo-fi, dreamy, and ethereal late-night vibe.
- **Bass Booster**: Supercharge the low-end frequencies to feel every beat.
- **Equalizer**: A highly responsive 5-band EQ to surgically alter specific frequencies.
- **Auto Panner & 3D Echo**: Add movement and spatial width to any audio track.

## 🛠 How It Was Made

This project represents the cutting-edge capabilities of modern web browsers. It entirely eliminates the need for expensive backend rendering infrastructure by pushing all DSP (Digital Signal Processing) to the client.

**Core Technologies Used:**
- **React 18 & Vite**: For lightning-fast UI rendering and component architecture.
- **Web Audio API**: The absolute core of the app. Features extensive use of `OfflineAudioContext`, `BiquadFilterNode`, `ConvolverNode` (for algorithmic reverb generation), `AnalyserNode`, and `StereoPannerNode`.
- **Framer Motion**: For buttery-smooth page transitions and micro-animations.
- **FFmpeg (WebAssembly)**: Integrated into a Web Worker via `@ffmpeg/ffmpeg` for offline high-fidelity 32-bit float encoding, converting the raw audio buffer directly into an uncompressed WAV file at maximum quality without blocking the main UI thread.
- **Service Workers & PWA**: Fully installable as a mobile application across iOS and Android with full offline support.

## 💡 Credits

- **Ideas & Concept Design**: [@WhatTheHackkk](https://github.com/WhatTheHackkk)
- **Architecture & Implementation**: Antigravity (AI Coding Assistant)

We designed this to blow people's minds with its stunning visual aesthetics and its sheer processing power—all inside a simple, free-to-use web app.

## 💻 Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/WhatTheHackkk/Aurora-Music.git
   ```
2. Navigate into the directory and install dependencies:
   ```bash
   cd Aurora-Music
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---
*Created with magic and passion.* ✨
