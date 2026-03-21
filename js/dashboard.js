/**
 * dashboard.js – Real-time admin monitoring dashboard.
 *
 * Reads events emitted by monitor.js via localStorage and renders:
 *   • Summary stats cards
 *   • Student risk table
 *   • Activity feed
 *   • Per-student detail panel
 *   • Charts (risk over time, event breakdown)
 */

(function () {
  'use strict';

  // ─── Demo student seed data ───────────────────────────────────────────────
  // In production these would come from a backend. For this visualization
  // demo we seed realistic data and blend in live localStorage events.
  const SEED_STUDENTS = [
    { id: 'S001', name: 'Alice Johnson',   avatar: 'AJ', color: '#4f8ef7' },
    { id: 'S002', name: 'Bob Martinez',    avatar: 'BM', color: '#e74c3c' },
    { id: 'S003', name: 'Carol Lee',       avatar: 'CL', color: '#2ecc71' },
    { id: 'S004', name: 'David Kim',       avatar: 'DK', color: '#f39c12' },
    { id: 'S005', name: 'Emma Wilson',     avatar: 'EW', color: '#9b59b6' },
    { id: 'S006', name: 'Frank Chen',      avatar: 'FC', color: '#1abc9c' },
    { id: 'S007', name: 'Grace Patel',     avatar: 'GP', color: '#e67e22' },
    { id: 'S008', name: 'Henry Nguyen',    avatar: 'HN', color: '#3498db' },
  ];

  // Per-student state
  const students = {};
  SEED_STUDENTS.forEach(function (s) {
    students[s.id] = Object.assign({}, s, {
      risk:       0,
      eventCount: 0,
      events:     [],
      riskHistory:[],  // [{t, risk}]
      startTime:  Date.now() - Math.floor(Math.random() * 600000),
    });
  });

  // ─── Demo seeder ─────────────────────────────────────────────────────────
  // Populate realistic events so the dashboard looks live on first open.
  const DEMO_EVENTS = [
    { type:'tab_switch',  label:'Tab switched / window hidden', severity:'danger', risk:25 },
    { type:'copy',        label:'Content copied (142 chars)',   severity:'danger', risk:30 },
    { type:'copy',        label:'Content copied (38 chars)',    severity:'warn',   risk:30 },
    { type:'paste',       label:'Content pasted (95 chars)',    severity:'danger', risk:20 },
    { type:'devtools',    label:'Browser DevTools opened',      severity:'danger', risk:40 },
    { type:'right_click', label:'Right-click detected',         severity:'warn',   risk:10 },
    { type:'focus_loss',  label:'Window lost focus',            severity:'warn',   risk:15 },
    { type:'shortcut_copy', label:'Ctrl+C shortcut detected',   severity:'warn',   risk:25 },
    { type:'rapid_paste', label:'Suspiciously rapid typing',    severity:'danger', risk:35 },
    { type:'screenshot_key', label:'Screenshot key pressed',    severity:'danger', risk:30 },
    { type:'select_all',  label:'Ctrl+A (select all)',          severity:'warn',   risk:15 },
  ];

  function seedDemoEvents() {
    const now     = Date.now();
    const seedIds = ['S001','S002','S003','S004','S005','S006','S007','S008'];
    // Distribute 30 events over the last 15 minutes
    for (let i = 0; i < 30; i++) {
      const sid   = seedIds[Math.floor(Math.random() * seedIds.length)];
      const tpl   = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)];
      const ageMs = Math.floor(Math.random() * 900000);
      applyEvent({
        id:        now - ageMs + i,
        student:   students[sid].name,
        studentId: sid,
        type:      tpl.type,
        label:     tpl.label,
        severity:  tpl.severity,
        risk:      tpl.risk,
        ts:        new Date(now - ageMs).toISOString(),
      });
    }
  }

  // ─── Event application ───────────────────────────────────────────────────
  const allEvents    = [];   // global feed (sorted newest-first for display)
  const seenEventIds = new Set();

  function applyEvent(evt) {
    if (seenEventIds.has(evt.id)) return;
    seenEventIds.add(evt.id);

    // Accumulate into student
    const s = students[evt.studentId];
    if (!s) return;
    s.risk       += evt.risk || 0;
    s.eventCount += 1;
    s.events.push(evt);
    s.riskHistory.push({ t: new Date(evt.ts).getTime(), risk: s.risk });

    // Global feed
    allEvents.unshift(evt);
    if (allEvents.length > 200) allEvents.pop();
  }

  // ─── Risk helpers ─────────────────────────────────────────────────────────
  function riskLevel(risk) {
    if (risk === 0)    return 'low';
    if (risk < 50)     return 'low';
    if (risk < 120)    return 'medium';
    if (risk < 220)    return 'high';
    return 'critical';
  }

  function riskLabel(level) {
    const map = { low:'Low', medium:'Medium', high:'High', critical:'Critical' };
    return map[level] || level;
  }

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const elTotalStudents   = document.getElementById('stat-total');
  const elActiveAlerts    = document.getElementById('stat-alerts');
  const elHighRisk        = document.getElementById('stat-highrisk');
  const elEventsTotal     = document.getElementById('stat-events');
  const elStudentTbody    = document.getElementById('student-tbody');
  const elActivityFeed    = document.getElementById('activity-feed');
  const elDetailPanel     = document.getElementById('detail-panel');
  const elDetailEmpty     = document.getElementById('detail-empty');
  const elFilterBtns      = document.querySelectorAll('.filter-btn');
  const elSearch          = document.getElementById('search-input');

  // ─── Charts (Chart.js) ────────────────────────────────────────────────────
  let riskChart     = null;
  let breakdownChart= null;

  function initCharts() {
    // Risk-over-time line chart
    const ctxRisk = document.getElementById('risk-chart');
    if (ctxRisk && window.Chart) {
      riskChart = new Chart(ctxRisk, {
        type: 'line',
        data: {
          labels:   [],
          datasets: [{
            label: 'Total Risk Score',
            data:  [],
            borderColor:     '#4f8ef7',
            backgroundColor: 'rgba(79,142,247,0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointHoverRadius: 5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: '#8b91a8', maxTicksLimit: 8 },
              grid:  { color: '#2e3348' },
            },
            y: {
              ticks: { color: '#8b91a8' },
              grid:  { color: '#2e3348' },
              beginAtZero: true,
            },
          },
        },
      });
    }

    // Event-type breakdown doughnut
    const ctxBreak = document.getElementById('breakdown-chart');
    if (ctxBreak && window.Chart) {
      breakdownChart = new Chart(ctxBreak, {
        type: 'doughnut',
        data: {
          labels: ['Tab Switch','Copy','Paste','DevTools','Other'],
          datasets: [{
            data: [0,0,0,0,0],
            backgroundColor: ['#e74c3c','#f39c12','#e67e22','#9b59b6','#4f8ef7'],
            borderWidth: 0,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: { duration: 400 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#8b91a8', padding: 12, font: { size: 11 } },
            },
          },
        },
      });
    }
  }

  function updateCharts() {
    if (!riskChart) return;

    // Risk over time – bucket events into 1-minute intervals
    const buckets = {};
    allEvents.forEach(function (e) {
      const min = Math.floor(new Date(e.ts).getTime() / 60000);
      buckets[min] = (buckets[min] || 0) + (e.risk || 0);
    });

    const sortedMins = Object.keys(buckets).sort(function(a,b){return a-b;});
    const labels = sortedMins.map(function(m) {
      const d = new Date(parseInt(m) * 60000);
      return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    });
    const values = sortedMins.map(function(m){ return buckets[m]; });

    riskChart.data.labels   = labels;
    riskChart.data.datasets[0].data = values;
    riskChart.update('none');

    // Breakdown
    if (breakdownChart) {
      const counts = { tab_switch:0, copy:0, paste:0, devtools:0, other:0 };
      allEvents.forEach(function (e) {
        if      (e.type === 'tab_switch') counts.tab_switch++;
        else if (e.type === 'copy' || e.type === 'shortcut_copy') counts.copy++;
        else if (e.type === 'paste'|| e.type === 'shortcut_paste') counts.paste++;
        else if (e.type === 'devtools') counts.devtools++;
        else counts.other++;
      });
      breakdownChart.data.datasets[0].data = [
        counts.tab_switch, counts.copy, counts.paste, counts.devtools, counts.other,
      ];
      breakdownChart.update('none');
    }
  }

  // ─── UI Rendering ─────────────────────────────────────────────────────────
  let currentFilter   = 'all';
  let selectedStudent = null;

  function getFilteredStudents() {
    let list = Object.values(students);
    if (currentFilter !== 'all') {
      list = list.filter(function(s){ return riskLevel(s.risk) === currentFilter; });
    }
    const q = (elSearch ? elSearch.value : '').toLowerCase().trim();
    if (q) {
      list = list.filter(function(s){ return s.name.toLowerCase().includes(q); });
    }
    // Sort by risk descending
    list.sort(function(a,b){ return b.risk - a.risk; });
    return list;
  }

  function renderStats() {
    const list      = Object.values(students);
    const total     = list.length;
    const highRisk  = list.filter(function(s){ const l=riskLevel(s.risk); return l==='high'||l==='critical'; }).length;
    const alerts    = allEvents.filter(function(e){ return e.severity==='danger'; }).length;
    const evtTotal  = allEvents.length;

    if (elTotalStudents) elTotalStudents.textContent = total;
    if (elActiveAlerts)  elActiveAlerts.textContent  = alerts;
    if (elHighRisk)      elHighRisk.textContent      = highRisk;
    if (elEventsTotal)   elEventsTotal.textContent   = evtTotal;
  }

  function miniBarHTML(s) {
    const last8 = s.riskHistory.slice(-8);
    const maxR  = Math.max(1, ...last8.map(function(x){ return x.risk; }));
    return '<div class="mini-bar">' + last8.map(function(x) {
      const h = Math.max(4, Math.round((x.risk / maxR) * 18));
      return '<span style="height:' + h + 'px"></span>';
    }).join('') + '</div>';
  }

  function renderStudentTable() {
    if (!elStudentTbody) return;
    const list = getFilteredStudents();
    elStudentTbody.innerHTML = list.map(function(s) {
      const level = riskLevel(s.risk);
      const sel   = selectedStudent === s.id ? 'selected' : '';
      return '<tr class="' + sel + '" data-id="' + s.id + '">' +
        '<td>' +
          '<div class="student-name">' +
            '<div class="avatar" style="background:' + s.color + '22;color:' + s.color + '">' + s.avatar + '</div>' +
            '<span>' + escapeHtml(s.name) + '</span>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge-' + level + '">' + riskLabel(level) + '</span></td>' +
        '<td>' + s.risk + '</td>' +
        '<td>' + s.eventCount + '</td>' +
        '<td>' + miniBarHTML(s) + '</td>' +
      '</tr>';
    }).join('');

    // Row click → detail
    elStudentTbody.querySelectorAll('tr').forEach(function(tr) {
      tr.addEventListener('click', function() {
        selectStudent(tr.dataset.id);
      });
    });
  }

  function renderActivityFeed() {
    if (!elActivityFeed) return;
    const top20 = allEvents.slice(0, 20);
    elActivityFeed.innerHTML = top20.map(function(e) {
      return '<div class="activity-item">' +
        '<div class="activity-icon ' + e.severity + '">' + severityIcon(e.severity) + '</div>' +
        '<div class="activity-content">' +
          '<div class="activity-title">' + escapeHtml(e.label) + '</div>' +
          '<div class="activity-meta">' + escapeHtml(e.student) + ' · ' + formatTime(e.ts) + '</div>' +
        '</div>' +
        '<div class="activity-time">' + relativeTime(e.ts) + '</div>' +
      '</div>';
    }).join('');
  }

  function selectStudent(id) {
    selectedStudent = id;
    renderStudentTable();
    renderDetailPanel();
  }

  function renderDetailPanel() {
    if (!elDetailPanel || !elDetailEmpty) return;
    if (!selectedStudent || !students[selectedStudent]) {
      elDetailPanel.style.display = 'none';
      elDetailEmpty.style.display = 'flex';
      return;
    }

    elDetailPanel.style.display = 'flex';
    elDetailEmpty.style.display = 'none';

    const s     = students[selectedStudent];
    const level = riskLevel(s.risk);
    const pct   = Math.min(100, Math.round((s.risk / 300) * 100));
    const scoreColor = level === 'low' ? '#2ecc71' : level === 'medium' ? '#f39c12' : '#e74c3c';

    // AI usage likelihood – heuristic based on copy/paste/devtools events
    const aiEvents = s.events.filter(function(e){
      return ['copy','shortcut_copy','paste','devtools','rapid_paste','tab_switch'].includes(e.type);
    }).length;
    const aiPct    = Math.min(100, Math.round((aiEvents / Math.max(1, s.eventCount)) * 100));
    const circumference = 2 * Math.PI * 28;
    const aiOffset = circumference - (aiPct / 100) * circumference;
    const aiColor  = aiPct < 30 ? '#2ecc71' : aiPct < 60 ? '#f39c12' : '#e74c3c';

    const recentEvents = s.events.slice().reverse().slice(0, 15);

    document.getElementById('detail-content').innerHTML =
      '<div class="detail-student-header">' +
        '<div class="detail-avatar" style="background:' + s.color + '22;color:' + s.color + '">' + s.avatar + '</div>' +
        '<div>' +
          '<div class="detail-name">' + escapeHtml(s.name) + '</div>' +
          '<div class="detail-sub">ID: ' + s.id + ' · ' + s.eventCount + ' events</div>' +
        '</div>' +
      '</div>' +

      '<div class="detail-stats">' +
        '<div class="detail-stat">' +
          '<div class="detail-stat-val text-' + (level==='low'?'success':level==='medium'?'warning':'danger') + '">' + s.risk + '</div>' +
          '<div class="detail-stat-lbl">Risk Score</div>' +
          '<div class="score-bar mt-1"><div class="score-fill" style="width:' + pct + '%;background:' + scoreColor + '"></div></div>' +
        '</div>' +
        '<div class="detail-stat">' +
          '<div class="detail-stat-val">' + s.eventCount + '</div>' +
          '<div class="detail-stat-lbl">Events</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel" style="padding:1rem">' +
        '<div class="panel-title fs-sm mb-1" style="margin-bottom:0.5rem">AI Usage Likelihood</div>' +
        '<div class="ai-meter">' +
          '<div class="ai-ring">' +
            '<svg viewBox="0 0 70 70" width="70" height="70">' +
              '<circle class="ring-bg"   cx="35" cy="35" r="28"/>' +
              '<circle class="ring-fill" cx="35" cy="35" r="28"' +
                ' stroke="' + aiColor + '"' +
                ' stroke-dasharray="' + circumference + '"' +
                ' stroke-dashoffset="' + aiOffset + '"' +
              '/>' +
            '</svg>' +
            '<div class="ai-ring-label" style="color:' + aiColor + '">' + aiPct + '%</div>' +
          '</div>' +
          '<div class="ai-info">' +
            '<div class="ai-info-title">' + (aiPct < 30 ? 'Unlikely' : aiPct < 60 ? 'Possible' : 'Likely') + ' AI Assist</div>' +
            '<div class="ai-info-desc">' + aiEvents + ' suspicious AI-related events out of ' + s.eventCount + ' total</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div>' +
        '<div class="panel-title fs-sm" style="margin-bottom:0.5rem">Recent Events</div>' +
        '<div class="events-list">' +
          (recentEvents.length === 0
            ? '<div class="text-muted fs-sm" style="padding:0.5rem">No events yet</div>'
            : recentEvents.map(function(e){
                return '<div class="event-row ' + e.severity + '">' +
                  '<div class="event-dot"></div>' +
                  '<div class="event-text">' + escapeHtml(e.label) + '</div>' +
                  '<div class="event-time">' + formatTime(e.ts) + '</div>' +
                '</div>';
              }).join('')
          ) +
        '</div>' +
      '</div>';
  }

  // ─── Utils ────────────────────────────────────────────────────────────────
  function severityIcon(sev) {
    if (sev === 'danger') return '🚨';
    if (sev === 'warn')   return '⚠️';
    if (sev === 'info')   return 'ℹ️';
    return '✓';
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.getHours().toString().padStart(2,'0') + ':' +
           d.getMinutes().toString().padStart(2,'0') + ':' +
           d.getSeconds().toString().padStart(2,'0');
  }

  function relativeTime(iso) {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff <  60)  return diff + 's ago';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    return Math.floor(diff/3600) + 'h ago';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ─── Poll localStorage for live events ───────────────────────────────────
  let lastPollLen = 0;

  function pollLocalStorage() {
    try {
      const raw    = localStorage.getItem('acm_events') || '[]';
      const events = JSON.parse(raw);
      if (events.length !== lastPollLen) {
        lastPollLen = events.length;
        events.forEach(applyEvent);
        renderAll();
      }
    } catch (_) {}
  }

  // ─── Simulate live events for demo ───────────────────────────────────────
  // Adds a random event every few seconds so the dashboard feels live.
  function simulateLiveEvent() {
    const ids   = Object.keys(students);
    const sid   = ids[Math.floor(Math.random() * ids.length)];
    const tpl   = DEMO_EVENTS[Math.floor(Math.random() * DEMO_EVENTS.length)];
    applyEvent({
      id:        Date.now(),
      student:   students[sid].name,
      studentId: sid,
      type:      tpl.type,
      label:     tpl.label,
      severity:  tpl.severity,
      risk:      tpl.risk,
      ts:        new Date().toISOString(),
    });
    renderAll();
  }

  // ─── Render loop ─────────────────────────────────────────────────────────
  function renderAll() {
    renderStats();
    renderStudentTable();
    renderActivityFeed();
    if (selectedStudent) renderDetailPanel();
    updateCharts();
  }

  // ─── Heatmap ─────────────────────────────────────────────────────────────
  function renderHeatmap() {
    const el = document.getElementById('heatmap');
    if (!el) return;

    // Count events per hour slot (0-23)
    const hourCounts = new Array(24).fill(0);
    allEvents.forEach(function(e) {
      const h = new Date(e.ts).getHours();
      hourCounts[h]++;
    });
    const max = Math.max(1, ...hourCounts);

    el.innerHTML = hourCounts.map(function(c, h) {
      const opacity = 0.1 + (c / max) * 0.9;
      const color   = c === 0 ? 'var(--color-surface-2)' : 'rgba(231,76,60,' + opacity + ')';
      return '<div class="heatmap-cell" style="background:' + color + '" title="' + h + ':00 – ' + c + ' events"></div>';
    }).join('');
  }

  // ─── Filter buttons ───────────────────────────────────────────────────────
  elFilterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      elFilterBtns.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      renderStudentTable();
    });
  });

  if (elSearch) {
    elSearch.addEventListener('input', function() {
      renderStudentTable();
    });
  }

  // ─── Boot ────────────────────────────────────────────────────────────────
  function init() {
    seedDemoEvents();
    initCharts();
    renderAll();
    renderHeatmap();

    // Poll for live exam-page events
    setInterval(pollLocalStorage, 1500);

    // Simulate a new live event every 4-8 seconds for demo
    function scheduleSimulation() {
      const delay = 4000 + Math.random() * 4000;
      setTimeout(function() {
        simulateLiveEvent();
        renderHeatmap();
        scheduleSimulation();
      }, delay);
    }
    scheduleSimulation();

    // Auto-select first student
    const firstId = Object.keys(students)[0];
    if (firstId) selectStudent(firstId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
