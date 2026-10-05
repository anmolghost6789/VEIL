# VEIL//

> **Talk. Draw. Call. Then Disappear.**  
> *Underground, zero-log ephemeral communications terminal.*

---

## ⚡ Overview

**VEIL//** is a privacy-first, ephemeral peer-to-peer web communication suite designed with a **Neo-Brutalist + Y2K Cyber-Editorial** terminal aesthetic. 

Every room, message, whiteboard drawing, and call is strictly volatile: **zero database persistence, zero disk logs, zero chat histories**. 

---

## 🛡️ Key Features

### 1. ⚡ 0ms Optimistic Ephemeral Messaging
- Instant local UI feedback with zero network latency.
- Configurable auto-destruct TTL (Time-To-Live countdowns from 10s to 300s).
- Self-expunging messages: disappear from both peers' screens upon countdown expiry.
- Dual-consent permanent message saving (requires explicit permission from both participants).

### 2. 🔄 Resilient Refresh Session Recovery
- Ephemeral tab session recovery via browser `sessionStorage`.
- Refreshing the browser (`F5` / `Cmd+R`) restores active room state, participants, and unexpired messages without losing context or dropping to the invite screen.
- Auto-purges immediately upon tab close, expiration, or room destruction.

### 3. 📹 Encrypted WebRTC Audio & Video Calling
- Direct browser-to-browser peer communication using W3C Perfect Negotiation & polite peer rollback.
- Live camera stream with picture-in-picture local preview.
- One-click screen sharing and audio spectrum visualizers.
- Dynamic signal re-sync mechanism for seamless reconnections.

### 4. 🔒 Anti-Screenshot & Screen Capture Shield
- **Blur-on-Unfocus**: Window blur or tab switching immediately triggers a heavy blur filter (`blur(35px)`) and a redacted cyber barrier, neutralizing desktop snipping tools (Windows Snipping Tool, Lightshot, Snagit).
- **Shortcut Interception**: Intercepts `PrintScreen`, `Win+Shift+S`, `Ctrl+Shift+S`, `Ctrl+P`, and wipes clipboard memory with a security warning.
- **Print CSS Blackout**: `@media print` completely blanks out the DOM.
- **Dynamic Ephemeral Watermarking**: Monospace background watermark tying the session to the room and timestamp to deter external camera captures.

### 5. 🎨 Collaborative Cyber Whiteboard
- Real-time vector drawing canvas with stroke synchronization.
- Multiple cyber color palettes (Acid Lime, Cyber Cyan, Magenta, Neon Yellow, Pure White).
- Synchronized clear and pen size controls.

### 6. 🌐 Dual-Mode Deployment Architecture
- **Server Mode (Full-Duplex)**: Real-time Socket.IO backend for local or containerized environments.
- **Serverless P2P Mode (Vercel)**: Automatically falls back to decentralized WebRTC DataChannels using PeerJS with STUN relays for 100% serverless hosting.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone & Install
```bash
git clone https://github.com/anmolghost6789/VEIL.git
cd VEIL
npm install
```

### 2. Run Locally (Single Command)
```bash
npm run dev
```
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`

---

## ☁️ Deployment

### Deploying on Vercel
1. Import the repository `anmolghost6789/VEIL` into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client` (or leave default with root `vercel.json`).
3. Set **Framework Preset** to `Vite`.
4. Deploy. VEIL will automatically operate in serverless P2P mode with zero server dependencies required.

---

## 📜 License
MIT © [VEIL Underground Systems](https://github.com/anmolghost6789/VEIL)