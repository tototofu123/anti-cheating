const QUESTION_COUNT = 20;
const TEXT_POOL_SIZE = 100;
const EXAM_SECONDS = 20 * 60;
const DEVTOOLS_GAP_THRESHOLD = 150;

const els = {
  questionNav: document.getElementById("questionNav"),
  questionHost: document.getElementById("questionHost"),
  answerForm: document.getElementById("answerForm"),
  questionTypeBadge: document.getElementById("questionTypeBadge"),
  progressBadge: document.getElementById("progressBadge"),
  timer: document.getElementById("timer"),
  sessionState: document.getElementById("sessionState"),
  candidateId: document.getElementById("candidateId"),
  violationLog: document.getElementById("violationLog"),
  methodSummary: document.getElementById("methodSummary"),
  methodToggles: document.getElementById("methodToggles"),
  examShell: document.getElementById("examShell"),
  watermark: document.getElementById("watermark"),
  brightnessPulse: document.getElementById("brightnessPulse"),
  lockTemplate: document.getElementById("lockTemplate"),
  triggerCaptureBtn: document.getElementById("triggerCaptureBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  strikeMeterFill: document.getElementById("strikeMeterFill")
};

const state = {
  questions: [],
  current: 0,
  answers: {},
  encryptedAnswers: {},
  selectedChoice: null,
  strikes: 0,
  violations: [],
  startedAt: Date.now(),
  remaining: EXAM_SECONDS,
  lock: false,
  lockReason: "",
  hiddenAt: null,
  keystrokes: [],
  mousePoints: [],
  fontMode: 0,
  lastWidth: window.innerWidth,
  violationTimes: [],
  violationCooldowns: new Map(),
  suppressedViolations: 0,
  inputReplay: new Map(),
  fullscreenArmed: false,
  keyMap: { score: "score_a" },
  scrambledState: { score_a: 0 },
  currentSessionId: document.querySelector('meta[name="build-session"]')?.content || "local-session"
};

const textPromptPool = buildTextPromptPool(TEXT_POOL_SIZE);
const checksums = new Map();

const methods = [
  { id: 1, name: "Z-Index Overlay", category: "HTML", enabled: true },
  { id: 2, name: "SVG Text Injection", category: "HTML", enabled: true },
  { id: 3, name: "Ghost Elements", category: "HTML", enabled: true },
  { id: 4, name: "Shadow DOM Encapsulation", category: "HTML", enabled: true },
  { id: 5, name: "Zero-Width Injection", category: "HTML", enabled: true },
  { id: 6, name: "Canvas Rendering", category: "HTML", enabled: true },
  { id: 7, name: "DOM Order Scrambling", category: "HTML", enabled: true },
  { id: 8, name: "Blur-on-Blur", category: "CSS", enabled: true },
  { id: 9, name: "Pseudo-Element Content", category: "CSS", enabled: true },
  { id: 10, name: "User-Select Lock", category: "CSS", enabled: true },
  { id: 11, name: "Dynamic Color Shift", category: "CSS", enabled: true },
  { id: 12, name: "Font Glyph Mapping (Sim)", category: "CSS", enabled: true },
  { id: 13, name: "Pseudo Fragmentation", category: "CSS", enabled: true },
  { id: 14, name: "Keystroke Cadence", category: "JS", enabled: true },
  { id: 15, name: "Tab Swap", category: "JS", enabled: true },
  { id: 16, name: "Multi-Tab Block", category: "JS", enabled: true },
  { id: 17, name: "Right-Click / DevTools Trap", category: "JS", enabled: true },
  { id: 18, name: "Mouse Trajectory", category: "JS", enabled: true },
  { id: 19, name: "Clipboard Poisoning", category: "JS", enabled: true },
  { id: 20, name: "Console Flooding", category: "JS", enabled: false },
  { id: 21, name: "Honey-Pot Function", category: "Logic", enabled: true },
  { id: 22, name: "Salted Checksum", category: "Logic", enabled: true },
  { id: 23, name: "State Scrambling", category: "Logic", enabled: true },
  { id: 24, name: "WASM Validator", category: "Logic", enabled: true },
  { id: 25, name: "Control Flow Flattening (Sim)", category: "Logic", enabled: true },
  { id: 26, name: "Debugger Loop", category: "Logic", enabled: false },
  { id: 27, name: "Self-Destruct State", category: "Logic", enabled: true },
  { id: 28, name: "Viewport Detection", category: "Logic", enabled: true },
  { id: 29, name: "Encoded Prompt Store", category: "Anti-Analysis", enabled: true },
  { id: 30, name: "Build-Time Injection", category: "GitHub", enabled: true },
  { id: 31, name: "Moving Watermark", category: "Screen", enabled: true },
  { id: 32, name: "Print Event Wipe", category: "Screen", enabled: true },
  { id: 33, name: "Print CSS Blackout", category: "Screen", enabled: true },
  { id: 34, name: "Brightness Pulse", category: "Screen", enabled: true },
  { id: 35, name: "Display Capture Signal", category: "Screen", enabled: true },
  { id: 36, name: "Device Motion", category: "Env", enabled: true },
  { id: 37, name: "Battery / CPU Heuristic", category: "Env", enabled: true },
  { id: 38, name: "WebCrypto Encryption", category: "Env", enabled: true },
  { id: 39, name: "Latency Jitter Check", category: "Env", enabled: true },
  { id: 40, name: "Temporal Font Mapping", category: "Env", enabled: true }
];

const methodMap = new Map(methods.map((m) => [m.id, m]));

init();

async function init() {
  const candidateId = `CAND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  els.candidateId.textContent = candidateId;
  els.watermark.textContent = `${candidateId} | ${state.currentSessionId}`;
  els.watermark.className = "watermark";

  setupMethodToggles();
  applyMethodSideEffects();
  setupStaticListeners();
  setupSingleTabGuard();
  setupHoneyPot();
  setupWasm();
  startWatermarkMotion();
  startBrightnessPulse();
  startLatencyChecks();
  startCpuHeuristic();
  startFontRemapCycle();
  rotateScrambleKey();
  setupDevtoolsSignals();
  setupFullscreenGuard();

  state.questions = await buildQuestionSet();
  renderNav();
  renderQuestion();
  startTimer();
  updateSummary();
}

function methodOn(id) {
  return Boolean(methodMap.get(id)?.enabled);
}

function setupMethodToggles() {
  const frag = document.createDocumentFragment();
  for (const m of methods) {
    const wrap = document.createElement("label");
    wrap.className = "toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.mid = String(m.id);
    input.checked = m.enabled;

    const strong = document.createElement("strong");
    strong.textContent = `${m.id}. ${m.name}`;

    const small = document.createElement("small");
    small.textContent = m.category;

    wrap.appendChild(input);
    wrap.appendChild(strong);
    wrap.appendChild(small);
    frag.appendChild(wrap);
  }
  els.methodToggles.appendChild(frag);
  els.methodToggles.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const id = Number(input.dataset.mid);
    const method = methodMap.get(id);
    if (!method) {
      return;
    }
    method.enabled = input.checked;
    applyMethodSideEffects();
    updateSummary();
  });
}

function applyMethodSideEffects() {
  document.body.classList.toggle("lock-select", methodOn(10));
  document.body.classList.toggle("print-blackout", methodOn(33));
}

function setupStaticListeners() {
  els.prevBtn.addEventListener("click", () => goToQuestion(state.current - 1));
  els.nextBtn.addEventListener("click", () => goToQuestion(state.current + 1));
  els.submitBtn.addEventListener("click", gradeExam);
  els.triggerCaptureBtn.addEventListener("click", () => {
    if (!methodOn(35)) {
      return;
    }
    registerViolation("Manual display capture signal", "warn");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      state.hiddenAt = Date.now();
    } else if (methodOn(15) && state.hiddenAt) {
      const diff = Date.now() - state.hiddenAt;
      state.hiddenAt = null;
      if (diff > 1200) {
        registerViolation("Tab switch detected. Question swapped.", "warn");
        void swapCurrentQuestion();
      }
    }
  });

  window.addEventListener("blur", () => {
    if (methodOn(8)) {
      document.body.classList.add("blurry");
    }
  });
  window.addEventListener("focus", () => document.body.classList.remove("blurry"));

  document.addEventListener("contextmenu", (event) => {
    if (!methodOn(17)) {
      return;
    }
    event.preventDefault();
    registerViolation("Right click blocked", "warn");
  });

  document.addEventListener("keydown", (event) => {
    const badCombo = event.key === "F12" || (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase()));
    if (methodOn(17) && badCombo) {
      event.preventDefault();
      registerViolation("DevTools shortcut blocked", "warn");
    }

    if (methodOn(34) && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
      event.preventDefault();
      registerViolation("Print shortcut blocked", "danger");
    }
  });

  document.addEventListener("copy", (event) => {
    if (!methodOn(19)) {
      return;
    }
    event.preventDefault();
    if (event.clipboardData) {
      event.clipboardData.setData("text/plain", "Violation detected. Content protected.");
    }
    registerViolation("Copy intercepted and poisoned", "warn");
  });

  document.addEventListener("paste", (event) => {
    if (!methodOn(19)) {
      return;
    }
    event.preventDefault();
    registerViolation("Paste blocked", "warn");
  });

  window.addEventListener("resize", () => {
    if (!methodOn(28)) {
      return;
    }
    const widthDrop = state.lastWidth - window.innerWidth;
    if (window.innerWidth < 840 || widthDrop > 260) {
      registerViolation("Viewport suspicious resize", "warn");
    }
    state.lastWidth = window.innerWidth;
  });

  document.addEventListener("mousemove", (event) => {
    if (!methodOn(18)) {
      return;
    }
    state.mousePoints.push({ x: event.clientX, y: event.clientY, t: performance.now() });
    if (state.mousePoints.length > 30) {
      state.mousePoints.shift();
      analyzeMousePattern();
    }
  });

  window.onbeforeprint = () => {
    if (!methodOn(32)) {
      return;
    }
    state.answers = {};
    state.encryptedAnswers = {};
    registerViolation("Print event wipe executed", "danger");
    if (methodOn(27)) {
      selfDestruct();
    }
    els.examShell.classList.add("locked");
  };

  window.addEventListener("devicemotion", (event) => {
    if (!methodOn(36)) {
      return;
    }
    const ax = Math.abs(event.accelerationIncludingGravity?.x || 0);
    const ay = Math.abs(event.accelerationIncludingGravity?.y || 0);
    if (ax + ay > 23) {
      registerViolation("Strong device motion detected", "warn");
    }
  });

  els.answerForm.addEventListener("keydown", (event) => {
    if (!methodOn(14)) {
      return;
    }
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    state.keystrokes.push(performance.now());
    if (state.keystrokes.length > 20) {
      state.keystrokes.shift();
      analyzeKeystrokes();
    }
  });

  if (methodOn(26)) {
    setInterval(() => {
      // eslint-disable-next-line no-debugger
      debugger;
    }, 1500);
  }

  if (methodOn(20)) {
    setInterval(() => {
      console.log("SECURITY", Date.now(), Math.random());
      console.clear();
    }, 1000);
  }
}

function setupFullscreenGuard() {
  const arm = async () => {
    if (state.fullscreenArmed || state.lock) {
      return;
    }
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        registerViolation("Fullscreen was not granted", "info");
      }
    }
    state.fullscreenArmed = true;
    window.removeEventListener("pointerdown", arm);
    window.removeEventListener("keydown", arm);
  };

  window.addEventListener("pointerdown", arm, { once: true });
  window.addEventListener("keydown", arm, { once: true });

  document.addEventListener("fullscreenchange", () => {
    if (state.lock || !state.fullscreenArmed) {
      return;
    }
    if (!document.fullscreenElement) {
      registerViolation("Exited fullscreen enclosure", "danger");
      if (methodOn(15)) {
        void swapCurrentQuestion();
      }
    }
  });
}

function setupSingleTabGuard() {
  const tabId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const channel = methodOn(16) && "BroadcastChannel" in window ? new BroadcastChannel("exam_shield_gate") : null;
  const ownerKey = "exam_shield_owner";

  if (methodOn(16)) {
    const existing = safeParse(safeStorageGet(ownerKey));
    if (existing && existing.tabId !== tabId && Date.now() - existing.t < 5000) {
      registerViolation("Active owner tab already exists", "danger");
      lockSession("Single-tab policy: owner tab already active");
      return;
    }
    safeStorageSet(ownerKey, JSON.stringify({ tabId, t: Date.now() }));
  }

  if (channel) {
    channel.postMessage({ type: "ping", tabId });
    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || !methodOn(16)) {
        return;
      }
      if (msg.type === "ping" && msg.tabId !== tabId) {
        channel.postMessage({ type: "exists", tabId });
      }
      if (msg.type === "exists" && msg.tabId !== tabId) {
        registerViolation("Second tab detected", "danger");
        lockSession("Single-tab policy: second tab detected");
      }
    };
  }

  const heartbeatKey = "exam_shield_active_tab";
  const pulse = () => {
    if (!methodOn(16)) {
      return;
    }
    safeStorageSet(ownerKey, JSON.stringify({ tabId, t: Date.now() }));
    safeStorageSet(heartbeatKey, JSON.stringify({ tabId, t: Date.now() }));
  };
  setInterval(pulse, 1500);
  pulse();

  window.addEventListener("storage", (event) => {
    if (!methodOn(16)) {
      return;
    }
    if (event.key === ownerKey && event.newValue) {
      const owner = safeParse(event.newValue);
      if (owner && owner.tabId !== tabId && Date.now() - owner.t < 5000) {
        registerViolation("Owner token moved to another tab", "danger");
        lockSession("Single-tab policy: owner token conflict");
      }
      return;
    }
    if (event.key !== heartbeatKey || !event.newValue) {
      return;
    }
    const data = safeParse(event.newValue);
    if (!data) {
      return;
    }
    if (data.tabId !== tabId && Date.now() - data.t < 2600) {
      registerViolation("Storage heartbeat conflict", "danger");
      lockSession("Single-tab policy: heartbeat conflict");
    }
  });

  window.addEventListener("beforeunload", () => {
    const owner = safeParse(safeStorageGet(ownerKey));
    if (owner?.tabId === tabId) {
      safeStorageRemove(ownerKey);
    }
  });
}

function setupDevtoolsSignals() {
  if (!methodOn(17)) {
    return;
  }

  let devtoolsOpen = false;
  setInterval(() => {
    if (!methodOn(17) || state.lock) {
      return;
    }
    const widthGap = window.outerWidth - window.innerWidth;
    const heightGap = window.outerHeight - window.innerHeight;
    const open = widthGap > DEVTOOLS_GAP_THRESHOLD || heightGap > DEVTOOLS_GAP_THRESHOLD;
    if (open && !devtoolsOpen) {
      registerViolation("Possible DevTools panel detected", "warn");
    }
    devtoolsOpen = open;
  }, 900);

  let marker = performance.now();
  setInterval(() => {
    if (!methodOn(17) || state.lock || document.hidden || !document.hasFocus()) {
      marker = performance.now();
      return;
    }
    const now = performance.now();
    const drift = now - marker - 1200;
    marker = now;
    if (drift > 900) {
      registerViolation("Execution freeze suggests debugger pause", "warn");
    }
  }, 1200);
}

function setupHoneyPot() {
  Object.defineProperty(window, "getCorrectAnswer", {
    configurable: false,
    enumerable: true,
    value() {
      if (methodOn(21)) {
        registerViolation("Honey-pot function invoked", "danger");
      }
      return "wrong-answer";
    }
  });
}

async function setupWasm() {
  if (!methodOn(24) || !("WebAssembly" in window)) {
    window.wasmAdd = (a, b) => a + b;
    return;
  }
  const bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f,
    0x03, 0x02, 0x01, 0x00,
    0x07, 0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00,
    0x0a, 0x09, 0x01, 0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
  ]);
  const mod = await WebAssembly.instantiate(bytes);
  window.wasmAdd = mod.instance.exports.add;
}

function startWatermarkMotion() {
  let x = 15;
  let y = 30;
  let dx = 0.08;
  let dy = 0.04;
  const tick = () => {
    if (methodOn(31)) {
      x += dx;
      y += dy;
      if (x > 65 || x < 5) {
        dx *= -1;
      }
      if (y > 80 || y < 8) {
        dy *= -1;
      }
      els.watermark.style.left = `${x}%`;
      els.watermark.style.top = `${y}%`;
      els.watermark.style.display = "block";
    } else {
      els.watermark.style.display = "none";
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function startBrightnessPulse() {
  let visible = false;
  setInterval(() => {
    if (!methodOn(34)) {
      els.brightnessPulse.style.opacity = "0";
      return;
    }
    visible = !visible;
    els.brightnessPulse.style.opacity = visible ? "0.03" : "0";
  }, 120);
}

function startLatencyChecks() {
  setInterval(async () => {
    if (!methodOn(39) || state.lock) {
      return;
    }
    const start = performance.now();
    try {
      await fetch(window.location.href, { method: "HEAD", cache: "no-store" });
      const t = performance.now() - start;
      if (t > 800) {
        registerViolation(`High latency detected (${Math.round(t)}ms)`, "warn");
      }
    } catch {
      registerViolation("Network ping failed", "warn");
    }
  }, 30000);
}

function startCpuHeuristic() {
  let last = performance.now();
  let drops = 0;
  const loop = () => {
    const now = performance.now();
    const delta = now - last;
    last = now;
    if (methodOn(37) && delta > 120) {
      drops += 1;
      if (drops > 8) {
        registerViolation("Performance jitter suggests heavy background load", "warn");
        drops = 0;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function startFontRemapCycle() {
  setInterval(() => {
    if (!methodOn(40)) {
      return;
    }
    state.fontMode = (state.fontMode + 1) % 3;
    renderQuestion();
  }, 60000);
}

function rotateScrambleKey() {
  setInterval(() => {
    if (!methodOn(23)) {
      return;
    }
    const newKey = `score_${Math.random().toString(36).slice(2, 6)}`;
    const oldKey = state.keyMap.score;
    state.scrambledState[newKey] = state.scrambledState[oldKey] || 0;
    delete state.scrambledState[oldKey];
    state.keyMap.score = newKey;
  }, 60000);
}

function startTimer() {
  const t = setInterval(() => {
    if (state.lock) {
      clearInterval(t);
      return;
    }
    state.remaining -= 1;
    if (state.remaining <= 0) {
      state.remaining = 0;
      clearInterval(t);
      gradeExam();
    }
    const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
    const ss = String(state.remaining % 60).padStart(2, "0");
    els.timer.textContent = `${mm}:${ss}`;
  }, 1000);
}

async function buildQuestionSet() {
  const questions = [];
  for (let i = 0; i < QUESTION_COUNT; i += 1) {
    if (i % 2 === 0) {
      questions.push(makeMathQuestion(i + 1));
    } else {
      const prompt = textPromptPool[Math.floor(Math.random() * textPromptPool.length)];
      const q = {
        id: i + 1,
        type: "text",
        renderMode: pickRenderMode(),
        prompt: `Type exactly: "${prompt}"`,
        answer: prompt,
        checksum: await saltedHash(prompt)
      };
      checksums.set(q.id, q.checksum);
      questions.push(q);
    }
  }
  return questions;
}

function makeMathQuestion(id) {
  const a = Math.floor(Math.random() * 60) + 10;
  const b = Math.floor(Math.random() * 40) + 1;
  const op = Math.random() > 0.45 ? "+" : "-";
  const expr = `${a} ${op} ${b}`;
  const value = safeEvaluate(expr);
  const choices = shuffle([value, value + 1, value - 2, value + 3]);
  return {
    id,
    type: "mcq",
    renderMode: pickRenderMode(),
    prompt: `Solve: ${expr}`,
    choices,
    answer: String(value)
  };
}

function safeEvaluate(expr) {
  const hasMathJs = typeof window !== "undefined" && window.math && typeof window.math.evaluate === "function";
  if (hasMathJs) {
    try {
      return Number(window.math.evaluate(expr));
    } catch {
      return simpleEval(expr);
    }
  }
  return simpleEval(expr);
}

function simpleEval(expr) {
  const m = expr.match(/^\s*(-?\d+)\s*([+-])\s*(-?\d+)\s*$/);
  if (!m) {
    return 0;
  }
  const a = Number(m[1]);
  const op = m[2];
  const b = Number(m[3]);
  return op === "+" ? a + b : a - b;
}

function pickRenderMode() {
  const modes = ["dom", "svg", "canvas", "pseudo", "shadow", "scramble"];
  return modes[Math.floor(Math.random() * modes.length)];
}

function renderNav() {
  els.questionNav.innerHTML = "";
  state.questions.forEach((question, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(index + 1);
    if (index === state.current) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => goToQuestion(index));
    els.questionNav.appendChild(btn);
  });
}

function goToQuestion(index) {
  if (state.lock) {
    return;
  }
  if (index < 0 || index >= state.questions.length) {
    return;
  }
  state.current = index;
  renderNav();
  renderQuestion();
}

function renderQuestion() {
  const q = state.questions[state.current];
  els.questionTypeBadge.textContent = q.type === "mcq" ? "MCQ" : "TYPE";
  els.progressBadge.textContent = `Q${state.current + 1} / ${state.questions.length}`;

  const prompt = applyVisualTransforms(q.prompt);

  els.questionHost.innerHTML = "";
  const card = document.createElement("div");
  card.className = "question-card";
  renderPromptByMode(card, prompt, q.renderMode);

  if (methodOn(3)) {
    const ghost = document.createElement("span");
    ghost.style.opacity = "0";
    ghost.style.fontSize = "0";
    ghost.textContent = "wrong_key_1982 mismatch_value dead_end";
    card.appendChild(ghost);
  }

  els.questionHost.appendChild(card);

  if (methodOn(1)) {
    const overlay = document.createElement("div");
    overlay.className = "z-overlay";
    overlay.title = "Protected Layer";
    els.questionHost.appendChild(overlay);
  }

  renderAnswerInput(q);
}

function renderPromptByMode(card, prompt, mode) {
  const activeMode = mode;
  if (activeMode === "svg" && methodOn(2)) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 900 130");
    svg.classList.add("svg-box");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "20");
    text.setAttribute("y", "62");
    text.setAttribute("font-size", "28");
    text.textContent = prompt;
    svg.appendChild(text);
    card.appendChild(svg);
    return;
  }

  if (activeMode === "canvas" && methodOn(6)) {
    const canvas = document.createElement("canvas");
    canvas.className = "canvas-box";
    canvas.width = 920;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f1b2b";
      ctx.font = "24px IBM Plex Sans";
      ctx.fillText(prompt, 24, 60);
    }
    card.appendChild(canvas);
    return;
  }

  if (activeMode === "pseudo" && methodOn(9)) {
    const pseudo = document.createElement("div");
    pseudo.className = "pseudo-question";
    pseudo.dataset.pseudo = prompt;
    card.appendChild(pseudo);
    return;
  }

  if (activeMode === "shadow" && methodOn(4)) {
    const host = document.createElement("div");
    card.appendChild(host);
    const root = host.attachShadow({ mode: "closed" });
    const span = document.createElement("span");
    span.textContent = prompt;
    span.style.fontSize = "1.06rem";
    root.appendChild(span);
    return;
  }

  if (activeMode === "scramble" && methodOn(7)) {
    const sourceWords = prompt.split(" ");
    const words = shuffle(sourceWords.map((word, index) => ({ word, index })));
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.flexWrap = "wrap";
    words.forEach((item) => {
      const span = document.createElement("span");
      span.textContent = item.word;
      span.style.order = String(item.index);
      wrap.appendChild(span);
    });
    card.appendChild(wrap);
    return;
  }

  if (methodOn(13)) {
    const frag = document.createElement("span");
    const left = prompt.slice(0, Math.floor(prompt.length / 2));
    const right = prompt.slice(Math.floor(prompt.length / 2));
    frag.textContent = left;
    const mid = document.createElement("span");
    mid.className = "pseudo-question";
    mid.dataset.pseudo = right;
    card.appendChild(frag);
    card.appendChild(mid);
    return;
  }

  const p = document.createElement("p");
  p.textContent = prompt;
  card.appendChild(p);
}

function renderAnswerInput(question) {
  els.answerForm.innerHTML = "";
  if (question.type === "mcq") {
    question.choices.forEach((choice) => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `q_${question.id}`;
      radio.value = String(choice);
      radio.checked = state.answers[question.id] === String(choice);
      radio.addEventListener("change", () => {
        state.answers[question.id] = String(choice);
        encryptedStore(question.id, String(choice));
      });
      label.appendChild(radio);
      label.append(` ${choice}`);
      els.answerForm.appendChild(label);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = state.answers[question.id] || "";
    input.addEventListener("input", async (event) => {
      const value = event.target.value;
      replayInputSignal(question.id, value);
      state.answers[question.id] = value;
      encryptedStore(question.id, value);
      if (methodOn(22)) {
        const expected = checksums.get(question.id);
        if (value.length > 4 && expected && (await saltedHash(value)) !== expected && value === question.answer) {
          registerViolation("Checksum mismatch anomaly", "warn");
        }
      }
    });
    els.answerForm.appendChild(input);
  }
}

function replayInputSignal(questionId, value) {
  const now = performance.now();
  const prev = state.inputReplay.get(questionId) || { t: now, len: 0 };
  const dt = now - prev.t;
  const delta = value.length - prev.len;

  if (methodOn(14) && delta > 60 && dt < 120) {
    registerViolation("Large instant text insertion detected", "warn");
  }

  state.inputReplay.set(questionId, { t: now, len: value.length });
}

function analyzeKeystrokes() {
  const diffs = [];
  for (let i = 1; i < state.keystrokes.length; i += 1) {
    diffs.push(state.keystrokes[i] - state.keystrokes[i - 1]);
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const variance = diffs.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / diffs.length;
  if (avg < 35 || variance < 20) {
    registerViolation("Typing cadence too uniform", "warn");
  }
}

function analyzeMousePattern() {
  const points = state.mousePoints;
  if (points.length < 10) {
    return;
  }
  let straight = 0;
  for (let i = 2; i < points.length; i += 1) {
    const dx1 = points[i - 1].x - points[i - 2].x;
    const dy1 = points[i - 1].y - points[i - 2].y;
    const dx2 = points[i].x - points[i - 1].x;
    const dy2 = points[i].y - points[i - 1].y;
    if (Math.abs(dx1 - dx2) < 0.3 && Math.abs(dy1 - dy2) < 0.3) {
      straight += 1;
    }
  }
  if (straight > 12) {
    registerViolation("Robotic mouse path detected", "warn");
    state.mousePoints = [];
  }
}

async function swapCurrentQuestion() {
  const current = state.questions[state.current];
  const replacement = current.type === "mcq" ? makeMathQuestion(current.id) : await makeTextQuestion(current.id);
  state.questions[state.current] = replacement;
  delete state.answers[current.id];
  renderQuestion();
}

async function makeTextQuestion(id) {
  const prompt = textPromptPool[Math.floor(Math.random() * textPromptPool.length)];
  const checksum = await saltedHash(prompt);
  checksums.set(id, checksum);
  return {
    id,
    type: "text",
    renderMode: pickRenderMode(),
    prompt: `Type exactly: "${prompt}"`,
    answer: prompt,
    checksum
  };
}

function applyVisualTransforms(text) {
  let out = text;
  if (methodOn(5)) {
    out = out.split("").join("\u200B");
  }
  if (methodOn(12) || methodOn(40)) {
    out = remapChars(out, state.fontMode);
  }
  if (methodOn(11) && state.strikes > 0) {
    document.documentElement.style.setProperty("--text", state.strikes >= 2 ? "#607288" : "#203249");
  }
  return out;
}

function remapChars(value, mode) {
  if (mode === 0) {
    return value;
  }
  const maps = [
    new Map([["a", "e"], ["e", "a"], ["i", "o"], ["o", "i"]]),
    new Map([["s", "z"], ["t", "x"], ["h", "k"], ["n", "m"]])
  ];
  const map = maps[(mode - 1) % maps.length];
  return value
    .split("")
    .map((ch) => {
      const lo = ch.toLowerCase();
      const to = map.get(lo);
      if (!to) {
        return ch;
      }
      return ch === lo ? to : to.toUpperCase();
    })
    .join("");
}

function registerViolation(message, level = "warn") {
  const now = new Date().toLocaleTimeString();
  const nowMs = Date.now();
  const key = `${level}:${message}`;
  const lastSeen = state.violationCooldowns.get(key) || 0;
  if (nowMs - lastSeen < 1200) {
    state.suppressedViolations += 1;
    return;
  }
  state.violationCooldowns.set(key, nowMs);

  if (state.violationCooldowns.size > 300) {
    for (const [k, t] of state.violationCooldowns) {
      if (nowMs - t > 30000) {
        state.violationCooldowns.delete(k);
      }
    }
  }

  state.violations.unshift({ message, level, time: now });
  state.violations = state.violations.slice(0, 80);
  state.violationTimes.push(nowMs);
  state.violationTimes = state.violationTimes.filter((t) => nowMs - t < 12000);
  if (level !== "info") {
    state.strikes += level === "danger" ? 2 : 1;
  }

  if (state.violationTimes.length >= 4) {
    state.strikes += 1;
    state.violationTimes = [];
    state.violations.unshift({
      message: "Burst violation rate detected",
      level: "danger",
      time: new Date().toLocaleTimeString()
    });
  }

  if (state.strikes >= 6) {
    lockSession("Strike limit reached");
  }
  updateSummary();
  renderLog();
}

function renderLog() {
  els.violationLog.innerHTML = "";
  for (const entry of state.violations.slice(0, 25)) {
    const div = document.createElement("div");
    div.className = "log-entry";
    const strong = document.createElement("strong");
    strong.textContent = `[${entry.time}]`;
    div.appendChild(strong);
    div.append(` ${entry.message}`);
    if (entry.level === "danger") {
      div.style.borderLeftColor = "var(--danger)";
    }
    els.violationLog.appendChild(div);
  }
}

function updateSummary() {
  const enabled = methods.filter((m) => m.enabled).length;
  const byCategory = {
    HTML: methods.filter((m) => m.enabled && m.category === "HTML").length,
    CSS: methods.filter((m) => m.enabled && m.category === "CSS").length,
    JS: methods.filter((m) => m.enabled && m.category === "JS").length,
    Logic: methods.filter((m) => m.enabled && m.category === "Logic").length,
    Screen: methods.filter((m) => m.enabled && m.category === "Screen").length,
    Env: methods.filter((m) => m.enabled && m.category === "Env").length,
    Other: methods.filter((m) => m.enabled && ["Anti-Analysis", "GitHub"].includes(m.category)).length
  };
  const latest = state.violations[0];
  els.methodSummary.innerHTML = "";
  appendSummaryLine("Enabled Methods", `${enabled}/40`);
  appendSummaryLine("Strikes", String(state.strikes));
  appendSummaryLine("Build Session", state.currentSessionId);
  appendSummaryLine(
    "Category Split",
    `H:${byCategory.HTML} C:${byCategory.CSS} J:${byCategory.JS} L:${byCategory.Logic} S:${byCategory.Screen} E:${byCategory.Env} O:${byCategory.Other}`
  );
  appendSummaryLine("Suppressed Repeats", String(state.suppressedViolations));
  appendSummaryLine("Latest Signal", latest ? latest.message : "none");
  els.sessionState.textContent = state.lock ? "Locked" : state.strikes > 0 ? "Flagged" : "Clean";
  els.sessionState.style.color = state.lock ? "var(--danger)" : state.strikes > 0 ? "var(--warn)" : "var(--accent)";

  if (els.strikeMeterFill) {
    const ratio = Math.max(0, Math.min(100, (state.strikes / 6) * 100));
    els.strikeMeterFill.style.width = `${ratio}%`;
  }
}

function appendSummaryLine(label, value) {
  const strong = document.createElement("strong");
  strong.textContent = `${label}:`;
  els.methodSummary.appendChild(strong);
  els.methodSummary.append(` ${value}`);
  els.methodSummary.appendChild(document.createElement("br"));
}

function lockSession(reason = "Policy violations exceeded") {
  if (state.lock) {
    return;
  }
  state.lock = true;
  state.lockReason = reason;
  els.examShell.classList.add("locked");
  const lockView = els.lockTemplate.content.cloneNode(true);
  const reasonNode = lockView.querySelector("[data-lock-reason]");
  if (reasonNode) {
    reasonNode.textContent = reason;
  }
  document.body.appendChild(lockView);
  updateSummary();
}

function selfDestruct() {
  Object.keys(state.answers).forEach((key) => {
    delete state.answers[key];
  });
  sessionStorage.clear();
}

async function encryptedStore(questionId, value) {
  if (!methodOn(38) || !window.crypto?.subtle) {
    state.encryptedAnswers[questionId] = value;
    return;
  }
  const enc = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey("raw", enc.encode(state.currentSessionId.padEnd(16, "_")), { name: "AES-GCM" }, false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payload = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(value));
    state.encryptedAnswers[questionId] = {
      iv: toBase64(iv),
      data: toBase64(new Uint8Array(payload))
    };
  } catch {
    state.encryptedAnswers[questionId] = value;
    registerViolation("Encryption fallback used", "info");
  }
}

function gradeExam() {
  if (state.lock) {
    return;
  }
  let score = 0;
  for (const q of state.questions) {
    const userAnswer = state.answers[q.id] ?? "";
    let correct = false;
    if (q.type === "mcq") {
      correct = String(userAnswer) === String(q.answer);
    } else if (methodOn(25)) {
      correct = flowDispatcher(userAnswer, q.answer);
    } else {
      correct = userAnswer === q.answer;
    }
    if (correct) {
      score = window.wasmAdd ? window.wasmAdd(score, 1) : score + 1;
    }
  }
  state.scrambledState[state.keyMap.score] = score;
  alert(`Exam complete. Score: ${score}/${state.questions.length}. Strikes: ${state.strikes}`);
}

function flowDispatcher(user, answer) {
  let stateId = 0;
  let result = false;
  while (stateId !== 3) {
    switch (stateId) {
      case 0:
        stateId = user.length < 1 ? 3 : 1;
        break;
      case 1:
        result = user === answer;
        stateId = 2;
        break;
      case 2:
        stateId = 3;
        break;
      default:
        stateId = 3;
        break;
    }
  }
  return result;
}

async function saltedHash(value) {
  const salt = `${state.currentSessionId}:salt:v1`;
  if (!window.crypto?.subtle) {
    return `plain:${value}::${salt}`;
  }
  try {
    const data = new TextEncoder().encode(`${value}::${salt}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return toBase64(new Uint8Array(digest));
  } catch {
    return `plain:${value}::${salt}`;
  }
}

function buildTextPromptPool(size) {
  const starts = ["hi", "today", "please", "always", "never", "maybe", "quickly", "calmly", "bright", "gentle"];
  const mids = ["how are you", "focus on the task", "read this line", "stay honest", "type with care", "keep learning", "show your work", "watch each step", "be precise", "check signs"];
  const ends = ["today", "right now", "for this exam", "without tools", "in this session", "with full attention", "for all questions", "before submit", "and continue", "for practice"];
  const pool = [];
  while (pool.length < size) {
    const text = `${pick(starts)} ${pick(mids)} ${pick(ends)}`;
    if (!pool.includes(text)) {
      pool.push(text);
    }
  }
  return pool;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toBase64(uint8) {
  let bin = "";
  for (const b of uint8) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeParse(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
