/**
 * ASCEND WMS preconfig — privileged users only (?role=consultant|superuser|super).
 * Two-phase dialog: credentials → warehouse selection.
 * Dispatches `ascend:wms-connected` after successful Connect before agent preload.
 * Uso: <script src="ascend-wms-preconfig.js" defer></script>
 */
(function () {
  var CONNECT_MS = 1200;
  var SUCCESS_PAUSE_MS = 2400;
  var DISCOVERY_MS = 900;

  var WAREHOUSES = [
    { id: 'CHS01', name: 'Charleston DC', locations: '12,480 locations', volume: '3.2k orders/day', sync: 'Synced 4m ago' },
    { id: 'ATL02', name: 'Atlanta Regional', locations: '8,140 locations', volume: '1.9k orders/day', sync: 'Synced 6m ago' },
    { id: 'DFW03', name: 'Dallas–Fort Worth Hub', locations: '21,700 locations', volume: '5.4k orders/day', sync: 'Synced 2m ago' },
    { id: 'LAX04', name: 'Los Angeles Cross-dock', locations: '4,320 locations', volume: '2.6k orders/day', sync: 'Synced 11m ago' },
    { id: 'MTY05', name: 'Monterrey Fulfillment', locations: '6,905 locations', volume: '1.1k orders/day', sync: 'Synced 9m ago' }
  ];

  var PROVIDER_BADGE = {
    'by-moca': 'MOCA read-only',
    'by-api': 'API read-only',
    'legacy-wms': 'Legacy read-only'
  };

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

  function showSnapBadge(sub) {
    var subEl = document.getElementById('snapBadgeSub');
    if (subEl) subEl.textContent = sub || SNAP_BADGE_SUB;
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
  var backBtn = document.getElementById('wmsBackBtn');
  var statusEl = document.getElementById('wmsConnectStatus');
  var stepBadge = document.getElementById('wmsStepBadge');
  var credentialsStep = document.getElementById('wmsStepCredentials');
  var warehouseStep = document.getElementById('wmsStepWarehouse');
  var providerEl = document.getElementById('wmsProvider');
  var labelEl = document.getElementById('wmsLabel');
  var baseUrlEl = document.getElementById('wmsBaseUrl');
  var userEl = document.getElementById('wmsUser');
  var passwordEl = document.getElementById('wmsPassword');
  var passwordToggle = document.getElementById('wmsPasswordToggle');
  var warehouseList = document.getElementById('wmsWarehouseList');
  var connTitle = document.getElementById('wmsConnSummaryTitle');
  var connSub = document.getElementById('wmsConnSummarySub');

  if (!layer || !form) return;

  var step = 'credentials';

  document.body.classList.add('wms-preconfig-active');

  if (passwordToggle && passwordEl) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
    passwordToggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePasswordVisibility();
      }
    });
  }

  function togglePasswordVisibility() {
    if (!passwordToggle || !passwordEl) return;
    var show = passwordEl.type === 'password';
    passwordEl.type = show ? 'text' : 'password';
    passwordToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
    passwordToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    passwordToggle.className = show ? 'pi pi-eye-slash field-pw-icon' : 'pi pi-eye field-pw-icon';
  }

  function setStatus(mode, html) {
    if (!statusEl) return;
    var sev = { idle: 'neutral', testing: 'info', ok: 'success', fail: 'error' };
    statusEl.hidden = false;
    statusEl.className =
      'ascend-msg ascend-msg--' + (sev[mode] || 'neutral') + ' conn-status ' + mode + ' ascend-msg--block';
    statusEl.innerHTML = html;
  }

  function validateCredentials() {
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

  function providerName() {
    if (!providerEl || providerEl.selectedIndex < 0) return 'WMS';
    return providerEl.options[providerEl.selectedIndex].text;
  }

  function selectedWarehouse() {
    var checked = form.querySelector('input[name="wmsWarehouse"]:checked');
    return checked ? checked.value : '';
  }

  function renderConnectionSummary() {
    if (connTitle) connTitle.textContent = providerName();
    if (connSub) {
      var parts = [];
      if (baseUrlEl && baseUrlEl.value.trim()) parts.push(baseUrlEl.value.trim());
      if (userEl && userEl.value.trim()) parts.push(userEl.value.trim());
      if (labelEl && labelEl.value.trim()) parts.push(labelEl.value.trim());
      connSub.textContent = parts.join(' · ');
    }
  }

  function renderWarehouses() {
    if (!warehouseList) return;
    warehouseList.innerHTML = '';

    if (!WAREHOUSES.length) {
      warehouseList.innerHTML = '<p class="wms-wh-empty">No warehouses available on this connection.</p>';
      return;
    }

    WAREHOUSES.forEach(function (wh) {
      var card = document.createElement('label');
      card.className = 'wms-wh-card';

      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'wmsWarehouse';
      radio.value = wh.id;
      radio.className = 'wms-wh-radio';

      var check = document.createElement('span');
      check.className = 'wms-wh-check';
      check.setAttribute('aria-hidden', 'true');
      check.innerHTML = '<i class="pi pi-check"></i>';

      var body = document.createElement('span');
      body.className = 'wms-wh-body';

      var id = document.createElement('span');
      id.className = 'wms-wh-id';
      id.textContent = wh.id + ' ';
      var name = document.createElement('span');
      name.className = 'wms-wh-name';
      name.textContent = wh.name;
      id.appendChild(name);

      var meta = document.createElement('span');
      meta.className = 'wms-wh-meta';
      meta.textContent = [wh.locations, wh.volume, wh.sync].join(' · ');

      body.appendChild(id);
      body.appendChild(meta);
      card.appendChild(radio);
      card.appendChild(check);
      card.appendChild(body);
      warehouseList.appendChild(card);
    });
  }

  function goToWarehouseStep() {
    step = 'warehouse';
    renderConnectionSummary();
    renderWarehouses();

    if (credentialsStep) credentialsStep.hidden = true;
    if (warehouseStep) {
      warehouseStep.hidden = false;
      warehouseStep.classList.remove('wms-step');
      void warehouseStep.offsetWidth;
      warehouseStep.classList.add('wms-step');
    }
    if (stepBadge) stepBadge.textContent = 'Step 2 of 2';
    if (backBtn) backBtn.hidden = false;
    if (btn) {
      btn.textContent = 'Connect';
      btn.disabled = true;
    }
    setStatus(
      'ok',
      '<i class="pi pi-check-circle" aria-hidden="true"></i><span class="ascend-msg__text">Credentials verified. Select the warehouse to assess.</span>'
    );

    var firstRadio = warehouseList && warehouseList.querySelector('.wms-wh-radio');
    if (firstRadio) firstRadio.focus();
  }

  function goToCredentialsStep() {
    step = 'credentials';

    var checked = form.querySelector('input[name="wmsWarehouse"]:checked');
    if (checked) checked.checked = false;

    if (warehouseStep) warehouseStep.hidden = true;
    if (credentialsStep) credentialsStep.hidden = false;
    if (stepBadge) stepBadge.textContent = 'Step 1 of 2';
    if (backBtn) backBtn.hidden = true;
    if (btn) {
      btn.textContent = 'Continue';
      btn.disabled = false;
    }
    setStatus(
      'idle',
      '<i class="pi pi-minus-circle" aria-hidden="true"></i><span class="ascend-msg__text">Review the connection, then continue to pick a warehouse.</span>'
    );
    if (providerEl) providerEl.focus();
  }

  function badgeSub() {
    var whId = selectedWarehouse() || 'CHS01';
    var mode = PROVIDER_BADGE[providerEl && providerEl.value] || 'read-only';
    return whId + ' · ' + mode;
  }

  function finishConnect() {
    showSnapBadge(badgeSub());

    document.body.classList.remove('wms-preconfig-active');
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new CustomEvent('ascend:wms-connected'));
  }

  function runCredentialsStep() {
    if (!validateCredentials()) return;

    if (btn) btn.disabled = true;
    setStatus(
      'testing',
      '<i class="pi pi-spinner" aria-hidden="true"></i><span class="ascend-msg__text">Verifying credentials…</span>'
    );

    setTimeout(function () {
      setStatus(
        'testing',
        '<i class="pi pi-spinner" aria-hidden="true"></i><span class="ascend-msg__text">Discovering available warehouses…</span>'
      );
      setTimeout(goToWarehouseStep, DISCOVERY_MS);
    }, CONNECT_MS);
  }

  function runWarehouseStep() {
    var whId = selectedWarehouse();
    if (!whId) {
      setStatus(
        'fail',
        '<i class="pi pi-times-circle" aria-hidden="true"></i><span class="ascend-msg__text">Select a warehouse to connect.</span>'
      );
      return;
    }

    if (btn) btn.disabled = true;
    if (backBtn) backBtn.disabled = true;
    if (warehouseList) {
      warehouseList.querySelectorAll('.wms-wh-radio').forEach(function (radio) {
        radio.disabled = true;
      });
    }
    setStatus(
      'testing',
      '<i class="pi pi-spinner" aria-hidden="true"></i><span class="ascend-msg__text">Registering WMS connection for ' +
        whId +
        '…</span>'
    );

    setTimeout(function () {
      setStatus(
        'ok',
        '<i class="pi pi-check-circle" aria-hidden="true"></i><span class="ascend-msg__text">Connection registered successfully.</span>'
      );
      setTimeout(finishConnect, SUCCESS_PAUSE_MS);
    }, CONNECT_MS);
  }

  if (warehouseList) {
    warehouseList.addEventListener('change', function (e) {
      if (step !== 'warehouse' || !e.target.classList.contains('wms-wh-radio')) return;
      if (btn) btn.disabled = false;
      setStatus(
        'ok',
        '<i class="pi pi-check-circle" aria-hidden="true"></i><span class="ascend-msg__text">Warehouse ' +
          e.target.value +
          ' selected. Connect to start the assessment.</span>'
      );
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (step === 'warehouse') goToCredentialsStep();
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (step === 'credentials') runCredentialsStep();
    else runWarehouseStep();
  });
})();
