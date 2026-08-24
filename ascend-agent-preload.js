/**
 * ASCEND agent preload — simulates agent work before Technical Assessment is shown.
 * Dispatches `ascend:assessment-ready` when complete so lazy-reveal can start.
 * Privileged roles wait for `ascend:wms-connected` first.
 * Uso: <script src="ascend-agent-preload.js" defer></script>
 */
(function () {
  var PHASES = [
    { progress: 8, message: 'Connecting to Acme Logistics source environment…' },
    { progress: 18, message: 'Capturing intelligent snapshot of the source inventory…' },
    { progress: 28, message: 'Scanning artifacts across functional groups…' },
    { progress: 40, message: 'Detected 1,847 artifacts in the source environment' },
    { progress: 52, message: 'Running delta analysis on 1,204 database tables…' },
    { progress: 64, message: 'Mapping migration paths (API, MOCA, Manual)…' },
    { progress: 74, message: 'Generating AI recommendations per artifact…' },
    { progress: 84, message: 'Computing key metrics and governance outputs…' },
    { progress: 93, message: 'Validating assessment against ASCEND readiness standards…' },
    { progress: 100, message: 'Assessment ready. Loading dashboard…' }
  ];

  var PHASE_MS = 2000;
  var INITIAL_DELAY = 400;
  var DONE_PAUSE_MS = 600;
  var FADE_MS = 400;
  var REDUCED_MS = 2000;

  var preloadLayer = document.getElementById('assessmentPreloadLayer');
  var preloadEl = document.getElementById('assessmentPreload');
  var contentEl = document.getElementById('assessmentContent');
  var msgEl = document.getElementById('preloadMsg');
  var pctEl = document.getElementById('preloadPct');
  var barEl = document.getElementById('preloadBar');
  var barFillEl = document.getElementById('preloadBarFill');
  var stepsEl = document.getElementById('preloadSteps');
  var etaEl = document.getElementById('preloadEta');

  if (!preloadLayer || !preloadEl || !contentEl) return;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var etaEndTime = 0;
  var etaTimer = null;
  var started = false;

  function isPrivilegedRole() {
    if (window.AscendRole && window.AscendRole.isPrivileged) {
      return window.AscendRole.isPrivileged();
    }
    var params = new URLSearchParams(window.location.search);
    var role = (params.get('role') || 'consultant').toLowerCase();
    if (role === 'standard') return false;
    return role === 'consultant' || role === 'superuser' || role === 'super';
  }

  function shortLabel(message) {
    return message.replace(/\u2026$|…$/g, '').trim();
  }

  function formatRemaining(ms) {
    var sec = Math.max(0, Math.ceil(ms / 1000));
    if (sec <= 1) return 'Estimated time remaining: 1 sec';
    return 'Estimated time remaining: ' + sec + ' sec';
  }

  function renderEta() {
    if (!etaEl) return;
    var remaining = Math.max(0, etaEndTime - Date.now());
    etaEl.textContent = formatRemaining(remaining);
  }

  function stopEtaCountdown() {
    if (etaTimer) {
      clearTimeout(etaTimer);
      etaTimer = null;
    }
  }

  function startEtaCountdown(durationMs) {
    stopEtaCountdown();
    etaEndTime = Date.now() + durationMs;
    renderEta();
    function tick() {
      renderEta();
      if (Date.now() >= etaEndTime) {
        etaTimer = null;
        return;
      }
      etaTimer = setTimeout(tick, 1000);
    }
    etaTimer = setTimeout(tick, 1000);
  }

  function remainingFromPhase(phaseIndex) {
    var phasesLeft = Math.max(0, PHASES.length - phaseIndex);
    return phasesLeft * PHASE_MS + DONE_PAUSE_MS + FADE_MS;
  }

  function buildSteps() {
    if (!stepsEl) return;
    stepsEl.innerHTML = '';
    PHASES.forEach(function (phase, index) {
      var li = document.createElement('li');
      li.className = 'preload-step';
      li.id = 'preloadStep' + index;
      li.innerHTML =
        '<span class="preload-step-icon" aria-hidden="true"><i class="pi pi-circle-fill" style="font-size:7px;"></i></span>' +
        '<span class="preload-step-text">' + shortLabel(phase.message) + '</span>';
      stepsEl.appendChild(li);
    });
  }

  function setProgress(value) {
    var pct = Math.round(value);
    if (barFillEl) barFillEl.style.width = pct + '%';
    if (barEl) barEl.setAttribute('aria-valuenow', String(pct));
    if (pctEl) pctEl.textContent = pct + '%';
  }

  function setStepState(activeIndex) {
    if (!stepsEl) return;
    var items = stepsEl.querySelectorAll('.preload-step');
    items.forEach(function (item, index) {
      item.classList.remove('is-done', 'is-active');
      var icon = item.querySelector('.preload-step-icon');
      if (!icon) return;
      if (index < activeIndex) {
        item.classList.add('is-done');
        icon.innerHTML = '<i class="pi pi-check"></i>';
      } else if (index === activeIndex) {
        item.classList.add('is-active');
        icon.innerHTML = '<i class="pi pi-spinner"></i>';
      } else {
        icon.innerHTML = '<i class="pi pi-circle-fill" style="font-size:7px;"></i>';
      }
    });
  }

  function applyPhase(index) {
    var phase = PHASES[index];
    if (!phase) return;
    if (msgEl) msgEl.textContent = phase.message;
    setProgress(phase.progress);
    setStepState(index);
    startEtaCountdown(remainingFromPhase(index));
  }

  function finishPreload() {
    stopEtaCountdown();
    if (etaEl) etaEl.textContent = 'Estimated time remaining: 1 sec';
    preloadEl.classList.add('is-done');
    setTimeout(function () {
      document.body.classList.remove('assessment-preloading');
      preloadLayer.hidden = true;
      preloadLayer.setAttribute('aria-hidden', 'true');
      preloadEl.setAttribute('aria-hidden', 'true');
      contentEl.removeAttribute('aria-hidden');
      window.scrollTo(0, 0);
      document.dispatchEvent(new CustomEvent('ascend:assessment-ready'));
    }, FADE_MS);
  }

  function runPhases(startIndex) {
    if (startIndex >= PHASES.length) {
      startEtaCountdown(DONE_PAUSE_MS + FADE_MS);
      setTimeout(finishPreload, DONE_PAUSE_MS);
      return;
    }
    applyPhase(startIndex);
    setTimeout(function () {
      runPhases(startIndex + 1);
    }, PHASE_MS);
  }

  function startAgentPreload() {
    if (started) return;
    started = true;

    document.body.classList.add('assessment-preloading');
    buildSteps();
    setProgress(0);
    if (msgEl) msgEl.textContent = 'Initializing ASCEND Assistant…';
    startEtaCountdown(
      INITIAL_DELAY + PHASES.length * PHASE_MS + DONE_PAUSE_MS + FADE_MS
    );

    if (prefersReduced) {
      applyPhase(PHASES.length - 1);
      startEtaCountdown(REDUCED_MS + FADE_MS);
      setTimeout(finishPreload, REDUCED_MS);
      return;
    }

    setTimeout(function () {
      runPhases(0);
    }, INITIAL_DELAY);
  }

  if (isPrivilegedRole()) {
    document.addEventListener('ascend:wms-connected', startAgentPreload, { once: true });
  } else {
    startAgentPreload();
  }
})();
