# Anti-Cheating Frontend Sandbox

Pure frontend demo that simulates anti-cheating controls for browser-based exams.

This project is for testing and education. It demonstrates deterrence and signal collection patterns, not guaranteed security.

## Run

Because the app is `type="module"`, open it through a local web server (not `file://`).

Quick options:

- Python: `python -m http.server 5500`
- Node (npx): `npx serve .`

Then open `http://localhost:5500` (or the printed URL).

## What It Demonstrates

The simulator includes 40 toggleable methods across these categories:

- HTML obfuscation and rendering tricks
- CSS visual restrictions and print controls
- JS behavior tripwires (tab switch, paste/copy, motion, shortcuts)
- Logic/anti-analysis patterns (checksums, state scrambling, WASM sim)
- Screen-capture deterrence (watermark, pulse, print wipe)
- Environment signals (latency, device motion, load heuristics)

## Important Limits

All logic runs in the client browser, so determined users can bypass parts of it.

- Cannot truly block OS-level app switching or process access
- Cannot guarantee prevention of external-device cheating
- DevTools detection is heuristic and can produce false positives

Use this as a layered deterrence sandbox, not as a standalone secure proctoring system.

## Files

- `index.html` - exam shell and monitor UI
- `styles.css` - layout and visual method hooks
- `app.js` - method logic, tripwires, scoring, lock flow
