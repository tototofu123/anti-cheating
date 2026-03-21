This document outlines 40 strategies to detect or prevent AI cheating in a pure frontend environment (HTML/JS/CSS/WASM).
Category 1: HTML Structure & Obfuscation
Z-Index Overlays: Using transparent div layers over text to prevent simple mouse-drags, while keeping text visible.
SVG Text Injection: Rendering sensitive questions as SVGs instead of standard text tags.
Ghost Elements: Inserting thousands of "Hidden" or display: none elements containing fake "incorrect" data to confuse AI scrapers.
Shadow DOM Encapsulation: Wrapping content in a closed Shadow Root to hide the DOM from simple scripts/extensions.
Zero-Width Character Injection: Injecting \u200B between every character to break AI string tokenization.
Canvas-Based Rendering: Drawing text onto a <canvas> so it exists as pixels, not selectable text.
DOM Order Scrambling: Randomizing the order of words in the HTML and using CSS Flexbox/Grid order to rearrange them visually.
Category 2: CSS Visual Protections
The "Blur-on-Blur" Method: Using CSS filters to blur the document when the window loses focus.
Pseudo-Element Content: Placing question text inside ::before or ::after content properties.
User-Select Lock: Using user-select: none to disable highlighting.
Dynamic Color Shifts: Shifting text colors to low contrast when a screen-capture or print event is detected.
Custom Font Glyph Mapping: Using font files where character mapping is scrambled (e.g., 'A' renders as 'X').
Pseudo-Content Fragmentation: Breaking questions into fragments spread across different pseudo-selectors.
Category 3: JS Behavioral Prevention
Keystroke "Cadence" Analysis: Detecting the millisecond speed between keys to spot AI-generated "pasted" input.
Tab Hijack & Question Swap: Monitoring visibilitychange and swapping question sets if the user leaves the tab.
Multi-Tab Block (BroadcastChannel): Using the BroadcastChannel API to ensure only one instance of the exam is open.
Right-Click & DevTools Trap: Blocking contextmenu and using a debugger loop to pause the browser if DevTools is opened.
Mouse Trajectory Validation: Analyzing mouse movement paths for "robotic" straight-line movement.
Clipboard Poisoning: Intercepting the copy event to replace the user's clipboard with fake data.
Console Flooding: Continuously printing garbage data to the console to obscure debugging.
Category 4: "SQL" & Logic Prevention
Local Honey-Pot Validation: Simulating fake APIs in the frontend to trap and flag users who try to modify them.
Frontend Checksum: Validating answers against a Salted Hash (SHA-256) in the client.
State Scrambling: Storing critical state in obfuscated variables (e.g., _0x8f2a) that regenerate.
WebAssembly (WASM) Logic: Moving core detection logic into a .wasm binary that is unreadable via "Inspect Element."
Category 5: Anti-Analysis (Prevent Download/Read)
Control-Flow Flattening: Obfuscating JS to turn simple logic into complex switch-case loops.
Debugger Loops: A background interval that runs while(true) { debugger; } to freeze the page if DevTools is active.
Self-Destructing State: Clearing all sessionStorage if a "print" or "screenshot" event is detected.
Viewport Detection: Triggering a lock if the window width is suddenly reduced (side-by-side detection).
Category 6: GitHub & Deployment Tricks
Encoded Data Files: Hosting Base64 encoded JSON files that are decoded only at runtime.
Build-Time Injection: Using GitHub Actions to inject question data during the build process so it isn't in the raw source.
Category 7: Screen Capture & Recording Prevention
Dynamic Moving Watermarks: Overlaying the user's ID/IP as a moving, low-opacity watermark. If a screen is recorded or capped, the leak is traceable.
Print-Event DOM Wipe: Using window.onbeforeprint to immediately clear or hide the entire body content.
CSS Print Media Queries: Using @media print { body { display: none; } } to ensure printed documents are blank.
Brightness Pulse: Subtly pulsing the background color at a frequency that causes flickering or "banding" in many digital video recordings.
Display Capture Detection: Attempting to check if getDisplayMedia is active by monitoring media stream status (where permitted by browser).
Category 8: Advanced Environmental Analysis
Device Motion Monitoring: On mobile/tablets, using DeviceMotionEvent to detect if the user is picking up the phone or tilting it to see a second screen.
Battery/CPU Drain Analysis: Monitoring performance spikes that often correlate with screen-recording software or heavy background AI processes.
WebCrypto Local Encryption: Encrypting answer strings in local memory using the WebCrypto API, making them unsearchable via memory inspection tools.
Network Latency Check: Periodic "pings" to detect the lag introduced by VPNs or proxy-based "AI-Middleman" tools.
Temporal Font Mapping: Changing the custom font mapping every 60 seconds so any scraped text becomes gibberish within a minute.
Technical Summary Table
Method
Category
Tech Stack
Prevention Logic
Moving Watermark
Screen Cap
CSS/JS
Prevents anonymous sharing of recorded exams.
Print Wipe
Screen Cap
JS/CSS
Detects Ctrl+P and clears the DOM instantly.
Device Motion
Hardware
JS API
Detects physical device movement on mobile.
WASM Shield
Logic
WebAssembly
Binary-encoded validation logic.
Zero-Width Space
HTML
UTF-8
Breaks string tokenization for AI scrapers.
Canvas Draw
HTML
Canvas API
Renders text as pixels to bypass scrapers.
Debugger Trap
JS
DevTools API
Freezes page if Inspect Element is opened. use the ui ux promax skill in antigtravity / global skills for designing websiteImplementation Guide: Methods 1 - 10
This patch covers HTML structure and CSS-based visual protections.
1. Z-Index Overlays
How it's implemented: Create a transparent div with a higher z-index than the text container.
Technical Detail: By setting pointer-events: none on the text and putting a transparent layer on top, the user cannot click, drag, or highlight the text underneath. This stops simple "Click and Drag" highlighting which is the first step of most copy-pasted cheating.
2. SVG Text Injection
How it's implemented: Instead of using <p> or <div>, wrap the question text in an <svg> tag using the <text> element.
Technical Detail: You can further complicate this by converting text to <path> data (vector outlines). Most browser-based AI scrapers look for text nodes in the DOM. SVG paths are treated as graphics, making them "invisible" to simple text-parsing scripts.
3. Ghost Elements (DOM Noise)
How it's implemented: Programmatically inject hundreds of <span> elements with opacity: 0 or font-size: 0px throughout the question.
Technical Detail: These "Ghost" elements contain random, wrong answers or nonsensical strings. While a human sees "What is 2+2?", an AI scraper using .innerText or .textContent will see "WhWhatat iis s 22+22?? [wrong_string_992]".
4. Shadow DOM Encapsulation
How it's implemented: Use element.attachShadow({mode: 'closed'}).
Technical Detail: By using "closed" mode, the internal DOM tree of your component is hidden from the main document’s JavaScript. Many browser extensions and automated scripts crawl the document starting from document.body. They cannot easily access the contents of a closed Shadow Root.
5. Zero-Width Character Injection
How it's implemented: Iterate through your question string and insert \u200B (Zero-Width Space) between every single character.
Technical Detail: The browser renders the text normally for humans. However, AI tokenizers (like the one used by GPT-4) rely on identifying whole words. A string like C\u200B h\u200B e\u200B a\u200B t is seen as 5 separate, meaningless tokens, breaking the AI's ability to understand the context.
6. Canvas-Based Rendering
How it's implemented: Use the HTML5 <canvas> API ctx.fillText().
Technical Detail: This removes the text from the DOM entirely. The question is now just a collection of pixels in a bitmap. To a scraper, the canvas is just a "picture," meaning it would require an OCR (Optical Character Recognition) step to cheat, which most standard browser-based AI tools don't do in real-time.
7. DOM Order Scrambling
How it's implemented: Store the question words in a random order in the HTML, e.g., <span>sky</span> <span>The</span> <span>blue</span> <span>is</span>.
Technical Detail: Use CSS Flexbox with the order property to rearrange them visually: span:nth-child(1) { order: 4; }. The scraper reads a jumbled sentence, but the human reads a perfect one.
8. The "Blur-on-Blur" Method
How it's implemented: Listen for window.onblur.
Technical Detail: When the user switches to another window (like ChatGPT), apply document.body.style.filter = 'blur(20px)'. This prevents the user from "peeking" at the question while they are in another tab.
9. Pseudo-Element Content
How it's implemented: Use CSS ::before { content: "Your Question Here"; }.
Technical Detail: Since the text is inside a CSS property, it is not part of the DOM tree as a text node. Most "Select All" commands or "Read Page" extensions will ignore this content entirely.
10. User-Select Lock
How it's implemented: Apply CSS user-select: none; to the root element.
Technical Detail: This disables the browser's native text selection. Combined with pointer-events: none on specific spans, it makes it nearly impossible for a non-technical user to highlight and copy the text. Implementation Guide: Methods 11 - 20
This patch covers CSS visual tricks and JavaScript-based behavioral analysis.
11. Dynamic Color Shifts
How it's implemented: Bind a listener to the window.onbeforeprint event or use an interval to shift CSS variables.
Technical Detail: By changing the --text-color to match the --bg-color (e.g., #FFFFFF on #FFFFFF) the moment a screenshot-related shortcut is detected or a print event starts, the screen appears blank to the "capture."
12. Custom Font Glyph Mapping
How it's implemented: Create a custom .woff2 font file where the glyph for 'A' is drawn as 'E', 'B' as 'Z', etc.
Technical Detail: In your HTML, you type "Ethir". Because the custom font is applied, the user sees "Athar". An AI bot reading the DOM will see "Ethir" and provide an answer for a question that doesn't exist to the human eye.
13. Pseudo-Content Fragmentation
How it's implemented: Split a single question into multiple <span> tags and use the :after pseudo-selector to fill in gaps.
Technical Detail: HTML: <span class="q1">Wh</span><span class="q2">is</span>
CSS: .q1:after { content: 'at '; } .q2:before { content: ' it'; }
A scraper sees "Wh is", but the user sees "What is it".
14. Keystroke "Cadence" Analysis
How it's implemented: Record the performance.now() timestamp for every keydown and keyup event.
Technical Detail: Calculate the "dwell time" (how long a key is held) and "flight time" (time between keys). AI injection scripts often "type" at a perfectly static interval (e.g., exactly 20ms between keys) or all at once (0ms). Human typing is "bursty" and inconsistent.
15. Tab Hijack & Question Swap
How it's implemented: Listen for the visibilitychange API.
Technical Detail: If document.visibilityState === 'hidden', start a timer. If it exceeds a threshold (e.g., 2 seconds), use a state manager to pull a different set of question data from a local JSON object and re-render the UI.
16. Multi-Tab Block (BroadcastChannel)
How it's implemented: Instantiate new BroadcastChannel('exam_gate').
Technical Detail: When a tab loads, it broadcasts a "PING". If another tab is already open, it replies with "ALREADY_OPEN". The new tab then immediately executes window.close() or redirects to a lock screen.
17. Right-Click & DevTools Trap
How it's implemented: document.addEventListener('contextmenu', e => e.preventDefault()).
Technical Detail: Additionally, monitor for keyboard shortcuts like Ctrl+Shift+I or F12. While not 100% foolproof, it stops casual users from opening the "Inspect" panel to look at the source.
18. Mouse Trajectory Validation
How it's implemented: Listen for mousemove and store the last 50 coordinates.
Technical Detail: Calculate the derivative of the path. Human movements have slight tremors and natural curves. Robotic movements are either perfectly straight lines (automated scripts) or "teleports" (instant moves), which trigger an anomaly score.
19. Clipboard Poisoning
How it's implemented: Listen for the copy event on the window.
Technical Detail: Use event.clipboardData.setData('text/plain', 'Violation Detected: Content Encrypted'). This ensures that even if they manage to highlight text, the data they paste into ChatGPT is garbage.
20. Console Flooding
How it's implemented: Run an interval: setInterval(() => { console.log("%c STOP!", "color: red; font-size: 40px;"); console.clear(); }, 100).
Technical Detail: This creates a "strobing" effect in the console that makes it extremely difficult for a user to read any legitimate logs or try to debug the variable states. Implementation Guide: Methods 21 - 30
This patch focuses on logic obfuscation and anti-analysis techniques.
21. Local Honey-Pot Validation
How it's implemented: Create a global variable or function named something obvious like window.getCorrectAnswer().
Technical Detail: This function returns a wrong answer. If your JS detects that this function was called (via a Proxy or a simple counter), it knows the user is poking around the source code and flags them.
22. Frontend Checksum (Salted Hashing)
How it's implemented: Use SubtleCrypto.digest('SHA-256', ...) to hash the user's input + a secret "salt" string.
Technical Detail: Compare the result against a pre-calculated hash stored in your code. This means the correct answer is never stored as plain text in the JS, so the user can't search the source for the answer.
23. State Scrambling
How it's implemented: Use a function to "rotate" the keys of your state object every minute.
Technical Detail: Instead of state.score, you use state[scramble('score')]. The mapping changes dynamically, so a user trying to manually edit the score in the console cannot find the correct property name.
24. WebAssembly (WASM) Logic
How it's implemented: Compile a C++ or Rust function to .wasm.
Technical Detail: Move the "cheating detection" math into this binary file. Unlike JS, which can be read in the "Sources" tab, WASM is a binary format that is much harder for a student to reverse-engineer or modify in real-time.
25. Control-Flow Flattening
How it's implemented: Use a tool like javascript-obfuscator during your build step.
Technical Detail: It turns simple if/else logic into a complex "dispatcher" loop. The code still works the same, but for a human reading "Inspect Element," the logic flow is impossible to follow.
26. Debugger Loops
How it's implemented: setInterval(() => { (function(){}).constructor("debugger")() }, 50).
Technical Detail: This forces the browser to trigger a breakpoint if the DevTools are open. The page effectively "freezes" for the cheater, making it impossible to inspect the DOM while the exam is running.
27. Self-Destructing State
How it's implemented: Wrap all sensitive variables in a closure that listens for "destructive" events.
Technical Detail: If a resize, blur, or print event is fired, the closure immediately sets its internal variables to null. The user loses their progress, acting as a high-stakes deterrent.
28. Viewport Detection
How it's implemented: Monitor window.innerWidth and window.innerHeight.
Technical Detail: If the aspect ratio changes suddenly or the width drops below 800px, it usually means the user has "snapped" the browser to half the screen to open an AI tool on the other side.
29. Encoded Data Files
How it's implemented: Store questions in a .txt file as a Base64 string or an XOR-encrypted blob.
Technical Detail: The JS fetches the file and decrypts it only when the "Start" button is pressed. This prevents the user from seeing the questions in the "Network" tab before the exam starts.
30. Build-Time Injection
How it's implemented: Use environment variables in your GitHub Actions or Vite config.
Technical Detail: Inject a unique EXAM_SESSION_ID into the code at build time. This ensures that every deployment is slightly different, preventing "universal" cheat scripts from working across different instances of your site. Implementation Guide: Methods 31 - 40
This final patch covers screen capture prevention and hardware-level environment checks.
31. Dynamic Moving Watermarks
How it's implemented: Use a div with position: fixed and a low opacity.
Technical Detail: Use requestAnimationFrame to slowly move the user's IP or ID across the screen. This ensures that any photograph or screen recording of the test can be traced back to the specific user who leaked it.
32. Print-Event DOM Wipe
How it's implemented: window.onbeforeprint = () => { document.body.innerHTML = ''; }.
Technical Detail: This is a "scorched earth" policy. If the user tries to save the page as a PDF (a common way to send the whole test to an AI), the content simply disappears before the print preview can generate.
33. CSS Print Media Queries
How it's implemented: @media print { .question-text { display: none; } }.
Technical Detail: This is the CSS fallback for Method 32. It ensures that even if the JS wipe is bypassed, the resulting PDF is empty.
34. Brightness Pulse (Flicker)
How it's implemented: Rapidly cycle a black overlay's opacity between 0 and 0.03.
Technical Detail: Humans rarely notice a 3% change in brightness, but digital camera sensors and recording software often pick this up as "flickering" or "banding" lines, ruining the quality of a recorded video.
35. Display Capture Detection
How it's implemented: Attempt to call navigator.mediaDevices.enumerateDevices().
Technical Detail: While you can't always stop a recording, you can detect if a "Virtual Camera" or "Screen Monitor" device is active. If detected, you can prevent the exam from starting.
36. Device Motion Monitoring
How it's implemented: window.addEventListener('devicemotion', event => { ... }).
Technical Detail: On mobile, you can detect the exact "tilt" of the phone. If the user tilts the phone 90 degrees (likely to take a photo of their monitor with their phone camera), you can trigger an alert.
37. Battery/CPU Drain Analysis
How it's implemented: Use the Battery Status API and monitor the frame rate via requestAnimationFrame.
Technical Detail: Screen recording software (like OBS) is CPU intensive. If the frame rate drops suddenly while the battery drain increases, the system can flag a "Background Recording Suspected" warning.
38. WebCrypto Local Encryption
How it's implemented: Use window.crypto.subtle.encrypt to store the user's answers in memory.
Technical Detail: If a cheater uses a "Memory Scanner" tool to try and find the answers in the browser's RAM, they will only find encrypted blobs instead of plain text strings.
39. Network Latency Check
How it's implemented: Send a small "ping" request to your server (or a public API) every 30 seconds.
Technical Detail: AI-Proxy tools and certain VPNs introduce a specific "jitter" or lag pattern. If the latency spikes or becomes too consistent, it suggests the traffic is being routed through an external analyzer.
40. Temporal Font Mapping
How it's implemented: Every 60 seconds, switch the @font-face to a different scrambled font.
Technical Detail: If a user takes a screenshot, they only have 60 seconds to process it before the text mapping changes. This forces the cheater to work faster than is typically possible for high-quality AI analysis. 