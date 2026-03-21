export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function toBase64(uint8) {
  let bin = "";
  for (const b of uint8) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

export function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeParse(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function simpleEval(expr) {
  const m = expr.match(/^\s*(-?\d+)\s*([+-])\s*(-?\d+)\s*$/);
  if (!m) {
    return 0;
  }
  const a = Number(m[1]);
  const op = m[2];
  const b = Number(m[3]);
  return op === "+" ? a + b : a - b;
}

export function safeEvaluate(expr) {
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

export function buildTextPromptPool(size) {
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
