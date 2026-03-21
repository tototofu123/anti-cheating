/**
 * monitor.js – Client-side behaviour monitoring for the exam page.
 *
 * Detects suspicious actions that are commonly used when students try to
 * send exam content to AI tools (ChatGPT, etc.) and broadcasts each event
 * via localStorage so the dashboard can react in real-time.
 */

(function () {
  'use strict';

  // ─── Config ────────────────────────────────────────────────────────────────
  const STUDENT_ID   = getStudentId();
  const STUDENT_NAME = localStorage.getItem('examStudentName') || 'Student';
  const CHANNEL_KEY  = 'acm_events';   // localStorage key shared with dashboard

  // Risk weights per event type
  const RISK = {
    tab_switch:       25,
    copy:             30,
    paste:            20,
    right_click:      10,
    devtools:         40,
    shortcut_copy:    25,
    shortcut_paste:   20,
    focus_loss:       15,
    select_all:       15,
    rapid_paste:      35,
    screenshot_key:   30,
  };

  // ─── State ─────────────────────────────────────────────────────────────────
  let totalRisk   = 0;
  let eventCount  = 0;
  let lastKeyTime = 0;
  let pasteBuffer = [];

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function getStudentId() {
    let id = localStorage.getItem('examStudentId');
    if (!id) {
      id = 'S' + Math.random().toString(36).slice(2, 7).toUpperCase();
      localStorage.setItem('examStudentId', id);
    }
    return id;
  }

  function timestamp() {
    return new Date().toISOString();
  }

  function emit(type, label, severity) {
    const weight = RISK[type] || 10;
    totalRisk   += weight;
    eventCount  += 1;

    const event = {
      id:        Date.now() + Math.random(),
      student:   STUDENT_NAME,
      studentId: STUDENT_ID,
      type,
      label,
      severity,  // 'info' | 'warn' | 'danger'
      risk:      weight,
      totalRisk,
      ts:        timestamp(),
    };

    // Persist into localStorage so dashboard polls it
    try {
      const raw    = localStorage.getItem(CHANNEL_KEY) || '[]';
      const events = JSON.parse(raw);
      events.push(event);
      // Keep a rolling window of last 500 events
      if (events.length > 500) events.splice(0, events.length - 500);
      localStorage.setItem(CHANNEL_KEY, JSON.stringify(events));
    } catch (_) { /* storage full – ignore */ }

    // Dispatch a custom DOM event for in-page reactions
    window.dispatchEvent(new CustomEvent('acm:event', { detail: event }));
  }

  // ─── Detection: Tab visibility ─────────────────────────────────────────────
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      emit('tab_switch', 'Tab switched / window hidden', 'danger');
    }
  });

  // ─── Detection: Window blur / focus ────────────────────────────────────────
  let blurStart = null;
  window.addEventListener('blur', function () {
    blurStart = Date.now();
    emit('focus_loss', 'Window lost focus', 'warn');
  });

  window.addEventListener('focus', function () {
    if (blurStart) {
      const away = Math.round((Date.now() - blurStart) / 1000);
      if (away > 3) {
        emit('focus_loss', `Window regained focus after ${away}s away`, 'warn');
      }
      blurStart = null;
    }
  });

  // ─── Detection: Copy ───────────────────────────────────────────────────────
  document.addEventListener('copy', function (e) {
    const sel = window.getSelection ? window.getSelection().toString() : '';
    const len = sel.length;
    emit('copy', `Content copied (${len} chars)`, len > 50 ? 'danger' : 'warn');
  });

  // ─── Detection: Paste ──────────────────────────────────────────────────────
  document.addEventListener('paste', function (e) {
    const data = (e.clipboardData || window.clipboardData);
    const text = data ? data.getData('text/plain') : '';
    emit('paste', `Content pasted (${text.length} chars)`, text.length > 20 ? 'danger' : 'warn');
  });

  // ─── Detection: Right-click ────────────────────────────────────────────────
  document.addEventListener('contextmenu', function (e) {
    emit('right_click', 'Right-click / context menu opened', 'warn');
    // We do NOT prevent default – just monitor.
  });

  // ─── Detection: Keyboard shortcuts ────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'c') {
      emit('shortcut_copy', 'Ctrl+C shortcut detected', 'warn');
    }

    if (ctrl && e.key === 'v') {
      emit('shortcut_paste', 'Ctrl+V shortcut detected', 'warn');
    }

    if (ctrl && e.key === 'a') {
      emit('select_all', 'Ctrl+A (select all) detected', 'warn');
    }

    // PrintScreen / screenshot attempt
    if (e.key === 'PrintScreen' || e.key === 'F13') {
      emit('screenshot_key', 'Screenshot key pressed', 'danger');
    }

    // Rapid keystroke detection (paste disguised as typing)
    const now  = Date.now();
    const diff = now - lastKeyTime;
    lastKeyTime = now;

    if (diff < 20 && !ctrl) {
      pasteBuffer.push(now);
      if (pasteBuffer.length >= 8) {
        emit('rapid_paste', 'Suspiciously rapid typing detected (possible clipboard inject)', 'danger');
        pasteBuffer = [];
      }
    } else {
      pasteBuffer = [];
    }
  });

  // ─── Detection: DevTools (heuristic) ──────────────────────────────────────
  (function detectDevTools() {
    const threshold = 160;
    let devToolsOpen = false;

    setInterval(function () {
      const widthDiff  = window.outerWidth  - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen     = widthDiff > threshold || heightDiff > threshold;

      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        emit('devtools', 'Browser DevTools opened', 'danger');
      } else if (!isOpen && devToolsOpen) {
        devToolsOpen = false;
      }
    }, 1500);
  })();

  // ─── In-page warning toast ─────────────────────────────────────────────────
  let toast = null;
  let toastTimer = null;

  function ensureToast() {
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'warning-toast';
      document.body.appendChild(toast);
    }
  }

  const TOAST_MESSAGES = {
    tab_switch:     '⚠️ Tab switch detected! Your activity is being monitored.',
    copy:           '⚠️ Copying exam content is not allowed.',
    paste:          '⚠️ Pasting content is not allowed.',
    right_click:    '⚠️ Right-click is disabled during the exam.',
    devtools:       '🚨 DevTools detected! This violation has been logged.',
    shortcut_copy:  '⚠️ Ctrl+C detected. Copying is monitored.',
    shortcut_paste: '⚠️ Ctrl+V detected. Pasting is monitored.',
    select_all:     '⚠️ Ctrl+A detected.',
    rapid_paste:    '🚨 Unusual input speed detected.',
    screenshot_key: '🚨 Screenshot attempt detected.',
    focus_loss:     '⚠️ You left the exam window. This has been logged.',
  };

  window.addEventListener('acm:event', function (e) {
    const msg = TOAST_MESSAGES[e.detail.type];
    if (!msg) return;
    ensureToast();
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3500);
  });

  // ─── Expose public API ────────────────────────────────────────────────────
  window.ACM = {
    getStudentId:   function () { return STUDENT_ID; },
    getTotalRisk:   function () { return totalRisk; },
    getEventCount:  function () { return eventCount; },
    clearEvents:    function () { localStorage.removeItem(CHANNEL_KEY); },
  };

  // ─── Announce student presence ────────────────────────────────────────────
  emit('info', `${STUDENT_NAME} started the exam`, 'info');

})();
