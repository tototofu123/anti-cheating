# ExamGuard – Anti-Cheating Visualization

A browser-based visualization dashboard that monitors student behavior during online exams and flags attempts to send exam content to AI tools (ChatGPT, Copilot, etc.).

## Features

### Admin Dashboard (`index.html`)
- **Real-time summary cards** – total students, danger alerts, high-risk count, total events
- **Student risk table** – per-student risk score, risk level badge (Low / Medium / High / Critical), event count, and a mini activity sparkbar
- **Risk-over-time chart** – line chart showing cumulative suspicious activity bucketed by minute
- **Event type breakdown** – doughnut chart showing copy, paste, tab-switch, DevTools, and other events
- **Activity heatmap** – hourly heat map of suspicious events across the exam session
- **Live activity feed** – scrolling log of the latest 20 events with severity icons, student name, and relative timestamp
- **Student detail panel** – per-student AI usage likelihood ring, event history, and risk score bar

### Student Exam Page (`exam.html`)
- Realistic mock exam (multiple choice + short answer + essay)
- Countdown timer with colour-coded urgency (normal → warning → danger)
- **Behavior monitoring** via `js/monitor.js`:
  - Tab visibility change (`visibilitychange` API)
  - Window blur / focus loss
  - `copy` and `paste` clipboard events
  - Keyboard shortcuts: Ctrl+C, Ctrl+V, Ctrl+A
  - Right-click / context menu
  - Screenshot key (PrintScreen)
  - Suspiciously rapid keystroke bursts (clipboard-inject detection)
  - Browser DevTools open detection (size heuristic)
- **In-page warning toasts** shown to the student for each flagged action
- Events are broadcast via `localStorage` so the dashboard picks them up in real time

## Quick Start

No build step required – just open the files in a browser.

```bash
# Serve locally (any static server works)
npx serve .
# Then open http://localhost:3000
```

Or simply open `index.html` directly in your browser (some features like
`localStorage` cross-tab communication work best when served over HTTP).

1. Open **`index.html`** in one browser tab → admin monitoring dashboard
2. Open **`exam.html`** in another tab → student exam demo
3. Enter a name and start the exam, then perform suspicious actions (switch tabs, copy text, right-click…)
4. Watch the dashboard update in real time

## File Structure

```
anti-cheating/
├── index.html        # Admin monitoring dashboard
├── exam.html         # Student exam page (being monitored)
├── css/
│   └── style.css     # All styles
└── js/
    ├── dashboard.js  # Dashboard logic, charts, live feed
    └── monitor.js    # Student-side behavior detection
```

## Technology

- **Vanilla HTML/CSS/JS** – zero build tooling, zero backend required
- **[Chart.js 4](https://www.chartjs.org/)** – loaded from CDN for risk timeline and breakdown charts
- **localStorage** – lightweight real-time channel between exam tab and dashboard tab
