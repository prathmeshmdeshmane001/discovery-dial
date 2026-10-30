# Discovery Dial — Interactive Spotify Feature Prototype

> **Author & Developer:** Prathamesh Deshmane ([@prathmeshmdeshmane001](https://github.com/prathmeshmdeshmane001) · prathmeshmdeshmane@gmail.com)  
> **Project Context:** NextLeap Cohort 42 · Spotify Feature Concept · July 2026

An interactive prototype for a Spotify music-discovery feature: a dial that lets active explorers control how much new, unfamiliar music gets mixed into their listening — while an AI relevance layer keeps every new track matched to their chosen vibe. **Discovery you steer, not noise.**

Built for the NextLeap PM graduation project (Spotify track). Demonstrates the validated solution: explorers want fresh music and control, with novelty that stays relevant.

---

## Live Demo & Research Links

| Resource | Description |
|---|---|
| [Discovery Dial Prototype (Live Vercel)](https://discovery-dial-xi.vercel.app) | Live interactive prototype — no login required |
| [Review Analysis Pipeline](https://spotify-discovery-engine-icedwrwrsufiahmd2st5fs.streamlit.app) | The research pipeline that validated this feature |
| [Pipeline GitHub](https://github.com/pbehuray/spotify-discovery-engine) | 456-review classification pipeline source code |

---

## What It Does

1. **Pick a vibe** — Indie, Ambient, Late-night techno, Hyperpop, Jazz, Shoegaze.
2. **Set the discovery dial** — Smooth draggable dial from Comfort (0% new tracks) to Maximum discovery (up to 50–100% new tracks).
3. **Build your mix** — New tracks are interleaved with familiar ones at your chosen ratio.
4. **AI reasoning per new track** — Groq / Llama 3.1 8B Instant generates contextual liner notes explaining why each new pick fits your vibe but expands your taste ("relevant, not random").
5. **Relevance Anchor badges** — Each new track is scored by energy proximity to the vibe's anchor:
   - ★ Green — Strong match (energy diff ≤ 0.75)
   - ★ Yellow — Good match (energy diff ≤ 1.75)
   - ★ Orange — Wider stretch (energy diff > 1.75, intentional at higher dial settings)
6. **Relevance Filters** — Filter mix dynamically by All, Strong match, Good match, or Wider stretch.
7. **Interactive Playback & Timeline** — Simulated playback with real-time scrub bar, elapsed/duration time, play/pause, next/prev, shuffle, repeat, and volume controls.
8. **Save, Skip, Play** — Save tracks to your session, skip without penalizing your novelty ratio, and play tracks in order.
9. **Session DSR Counter** — Tracks how many new tracks you have saved across the session (live proxy for Discovery Success Rate, the North Star metric).
10. **Playlist Creator** — Create custom named playlists and add tracks directly via the row action menu.
11. **Instant Search** — Filter tracks in real-time by title, artist, or mood.

---

## Why This Feature Exists

Research findings from the review analysis pipeline (456 reviews · 6 sources · Groq LLM classifier):

| Finding | Value |
|---|---|
| Discovery-related complaints | 34.9% of all reviews (159 of 456) |
| Dominant frustrated segment | `active_explorer` — 113 reviews (71% of complaints) |
| Top frustration | `stale_recommendations` — 65 reviews |
| Key crosstab | `active_explorer` + `stale_recommendations` = 53 reviews |
| Top unmet need | "new music" — 36 reviews |
| Root causes (tied) | `lack_of_variety` (20) + `lack_of_control` (20) |

Survey (N=26): 17 of 26 want *"smart by default, but let me steer."* 5 of 6 interviews positively validated the dial concept.

**Core insight:** Active explorers want a steering wheel, not a better autopilot.

---

## Architecture & Code Structure

```
discovery-dial/
├── api/
│   └── reason.js          # Serverless function calling Groq API (Llama 3.1) with robust fallbacks
├── src/
│   ├── App.jsx            # Main interactive UI (Spotify-native 3-column shell)
│   ├── engine.js          # Core algorithmic engine: mix building, relevance scoring, heuristics
│   ├── tracks.js          # Curated representative dataset: 75 tracks across 6 vibes
│   ├── styles.css         # Spotify dark theme design system & responsive styling
│   └── main.jsx           # React DOM root entry point
├── tests/
│   └── discovery-dial.test.js # Unit test suite (Node test runner)
├── index.html             # HTML entry template
├── package.json           # Dependencies, metadata & scripts
├── vercel.json            # Vercel deployment configuration
├── vite.config.js         # Vite configuration with built-in /api/reason dev middleware
└── .env.example           # Environment variables template
```

### Key Engineering Improvements

- **Separated Algorithmic Engine (`src/engine.js`)**: Isolated `buildMix()`, `relevanceScore()`, and `formatTime()` from React UI for maximum testability and performance.
- **Draggable Discovery Dial**: Upgraded from click-only to full touch and pointer-drag support with `onPointerDown`, `window.pointermove`, and `pointerup`.
- **Integrated Vite Dev Middleware**: Added custom connect middleware in `vite.config.js` so that `POST /api/reason` works in local `npm run dev` with your `.env` `GROQ_API_KEY` without requiring Vercel CLI.
- **Fail-safe Fallback Generator**: Fixed raw `"fallback"` / `"dedup_fallback"` string bugs in `api/reason.js`. It now returns diverse, music-critic style fallback notes across all tracks.
- **Interactive Audio Scrubber & Controls**: Added responsive progress scrub bar, volume adjustments, shuffle/repeat toggling, and track selection logic.
- **Automated Test Suite**: Built-in test suite executing with `npm test` verifying dataset integrity, relevance math, mix ratios, and API resilience.

---

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React 18 + Vite 5 |
| **Styling** | Spotify-native dark theme CSS + responsive flex/grid |
| **Algorithmic Engine** | Pure JavaScript (`src/engine.js`) |
| **AI Reasoning** | Groq Cloud API · Llama 3.1 8B Instant (`api/reason.js`) |
| **Local Dev Server** | Vite with custom API simulation middleware |
| **Deployment** | Vercel (Static frontend + Node.js Serverless Function) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`) |

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node 20 / 24)
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/prathmeshmdeshmane001/discovery-dial.git
cd discovery-dial
npm install
```

### 2. Configure Environment (Optional for Live AI)

```bash
cp .env.example .env
```

Add your Groq API key in `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
> *Get a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys). If omitted, the app automatically runs in deterministic fallback mode with full offline functionality.*

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Run Tests

```bash
npm test
```

### 5. Build for Production

```bash
npm run build
```

---

## Deployment Instructions

### Deploy to Vercel (Recommended)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial release: Discovery Dial Spotify prototype"
   git remote add origin https://github.com/prathmeshmdeshmane001/discovery-dial.git
   git push -u origin main
   ```
2. Navigate to [vercel.com](https://vercel.com) and click **Add New...** → **Project**.
3. Import the `discovery-dial` repository.
4. In **Environment Variables**, add:
   - `GROQ_API_KEY`: your Groq API key.
5. Click **Deploy**. Vercel will build the Vite bundle and deploy `/api/reason` as a serverless function automatically.

---

## Author & Ownership

- **Original Developer & Owner:** Prathamesh Deshmane
- **GitHub:** [@prathmeshmdeshmane001](https://github.com/prathmeshmdeshmane001)
- **Email:** prathmeshmdeshmane@gmail.com
- **Cohort:** NextLeap Cohort 42 (July 2026)

---

## License & Concept Disclaimer

This project is a design and product prototype created for educational and portfolio demonstration purposes (NextLeap PM track). It is not affiliated with, endorsed by, or sponsored by Spotify AB.
