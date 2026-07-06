/**
 * ASCEND WMS preconfig — privileged users only (?role=consultant|superuser|super).
 * Dispatches `ascend:wms-connected` after successful Connect before agent preload.
 * Uso: <script src="ascend-wms-preconfig.js" defer></script>
 */
(function () {
  var CONNECT_MS = 1200;
  var SUCCESS_PAUSE_MS = 2400;

  window.AscendRole = {
    getRole: function () {
      var params = new URLSearchParams(window.location.search);
      return (params.get('role') || 'consultant').toLowerCase();
    },
    isPrivileged: function () {
      var role = this.getRole();
      return role === 'consultant' || role === 'superuser' || role === 'super';
    },
    isStandard: function () {
      return this.getRole() === 'standard';
    }
  };

  var SNAP_BADGE_SUB = 'CHS01 · MOCA read-only';

  function showSnapBadge() {
    var subEl = document.getElementById('snapBadgeSub');
    if (subEl) subEl.textContent = SNAP_BADGE_SUB;
    document.body.classList.add('source-connected');
  }

  if (window.AscendRole.isStandard()) {
    document.body.classList.remove('wms-preconfig-active');
    showSnapBadge();
    return;
  }

  var layer = document.getElementById('wmsPreconfigLayer');
  var form = document.getElementById('wmsConnectForm');
  var btn = document.getElementById('wmsConnectBtn');
  var statusEl = document.getElementById('wmsConnectStatus');
  var providerEl = document.getElementById('wmsProvider');
  var labelEl = document.getElementById('wmsLabel');
  var baseUrlEl = document.getElementById('wmsBaseUrl');
  var userEl = document.getElementById('wmsUser');
  var passwordEl = document.getElementById('wmsPassword');
  var passwordToggle = document.getElementById('wmsPasswordToggle');

  if (!layer || !form) return;

  document.body.classList.add('wms-preconfig-active');

  if (passwordToggle && passwordEl) {
    passwordToggle.addEventListener('click', function () {
      var show = passwordEl.type === 'password';
      passwordEl.type = show ? 'text' : 'password';
      passwordToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      passwordToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      var icon = passwordToggle.querySelector('i');
      if (icon) icon.className = show ? 'pi pi-eye-slash' : 'pi pi-eye';
    });
  }

  function setStatus(mode, html) {
    if (!statusEl) return;
    var sev = { idle: 'neutral', testing: 'info', ok: 'success', fail: 'error' };
    statusEl.hidden = false;
    statusEl.className =
      'ascend-msg ascend-msg--' + (sev[mode] || 'neutral') + ' conn-status ' + mode + ' ascend-msg--block';
    statusEl.innerHTML = html;
  }

  function validateForm() {
    var baseUrl = baseUrlEl && baseUrlEl.value ? baseUrlEl.value.trim() : '';
    var user = userEl && userEl.value ? userEl.value.trim() : '';
    var password = passwordEl && passwordEl.value ? passwordEl.value : '';
    if (!providerEl || !providerEl.value || !baseUrl || !user || !password) {
      setStatus(
        'fail',
        '<i class="pi pi-times-circle" aria-hidden="true"></i><span class="ascend-msg__text">Provider, Base URL, User, and Password are required.</span>'
      );
      return false;
    }
    return true;
  }

  function finishConnect() {
    showSnapBadge();

    document.body.classList.remove('wms-preconfig-active');
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new CustomEvent('ascend:wms-connected'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="pi pi-spin pi-spinner" aria-hidden="true"></i> Connecting…';
    }
    setStatus(
      'testing',
      '<i class="pi pi-spinner" aria-hidden="true"></i><span class="ascend-msg__text">Registering WMS connection…</span>'
    );

    setTimeout(function () {
      setStatus(
        'ok',
        '<i class="pi pi-check-circle" aria-hidden="true"></i><span class="ascend-msg__text">Connection registered successfully.</span>'
      );
      setTimeout(finishConnect, SUCCESS_PAUSE_MS);
    }, CONNECT_MS);
  });
})();
