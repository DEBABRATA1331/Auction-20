# AUCTION 20

**AUCTION 20** is an interactive, live cartoon-character auction and championship simulator designed specifically for Google Meet and Zoom screen-sharing broadcast.

Hosted by a single operator, players participate in a live bidding war with a ₹20 purse, draft their dream 5-hero squads, and earn bonus points for deep benches. At the conclusion, an automated mathematical evaluation compares every team's core combat power, tactical stat balance, and budget ROI to declare the champion and generate shareable story/status graphics.

---

## Key Features

- **No Timers**: Host operates at their own pace for live audience commentary.
- **Red, Black & Yellow Aesthetic**: High-contrast, sleek broadcast visuals built with mobile-first responsive alignments.
- **Hidden Character Stats**: Subcategories (*Power, Defence, Speed, Intelligence, Special*), ratings (*16/25*), and rarity badges are strictly hidden from auction view—players must guess based on cartoon lore!
- **Core 5 + Extra Squad Bonus**:
  - Mandatory team size: 5 heroes.
  - Extra players award `+1.0` bonus point each (capped at `+3.0` points max).
- **Comprehensive Mathematical Verdict**:
  - Evaluates Combat Power (/60), Extra Squad Bonus (/10), Tactical Balance (/15), and Budget ROI (/15) for a composite score out of 100.
  - Automatically identifies archetypes and provides analytical reasoning for victory.
- **Story / Status Card Export**:
  - Generates a 9:16 high-resolution 1080×1920 card optimized for WhatsApp Status and Instagram Story.
  - Instant PNG download and native Web Share API support.
- **Audio Synthesizer**: Built-in Web Audio API sound effects for gavel strikes, bids, sold chimes, skips, drumrolls, and victory fanfare.
- **Original Character Photos**: Real-time Wikipedia API image resolution with local caching and `/public/characters/<id>.png` override support.

---

## Tech Stack

- **React 19**
- **TypeScript**
- **Vite**
- **Vanilla CSS** (Mobile-first responsive design)
- **Lucide React** (Vector icons, zero emojis)
- **Canvas-Confetti**

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

```bash
git clone https://github.com/DEBABRATA1331/Auction-20.git
cd Auction-20
npm install
npm run dev
```

The application will start at `http://localhost:3000`.
