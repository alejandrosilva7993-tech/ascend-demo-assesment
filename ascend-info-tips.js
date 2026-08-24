/**
 * ASCEND info tips — tooltip flotante para los iconos de información de cards y secciones.
 * Trigger: cualquier elemento con [data-ascend-tip="texto"]. Se muestra en hover, focus
 * y tap; se oculta con mouseleave, blur o Escape.
 * Uso: <script src="ascend-info-tips.js" defer></script>
 */
(function () {
  var GAP = 10;
  var EDGE = 12;
  var ARROW_INSET = 14;
  var TIP_ID = 'ascendInfoTip';

  var tip = null;
  var arrow = null;
  var activeTrigger = null;

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = TIP_ID;
    tip.className = 'ascend-tip';
    tip.setAttribute('role', 'tooltip');
    var text = document.createElement('span');
    text.className = 'ascend-tip__text';
    arrow = document.createElement('span');
    arrow.className = 'ascend-tip__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    tip.appendChild(text);
    tip.appendChild(arrow);
    document.body.appendChild(tip);
    return tip;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  function place() {
    if (!activeTrigger) return;
    if (!activeTrigger.isConnected) {
      hide();
      return;
    }
    var r = activeTrigger.getBoundingClientRect();
    var w = tip.offsetWidth;
    var h = tip.offsetHeight;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    var below = r.bottom + GAP;
    var above = r.top - GAP - h;
    var fitsBelow = below + h <= vh - EDGE;
    var top = fitsBelow || above < EDGE ? below : above;

    tip.classList.toggle('ascend-tip--below', top >= r.bottom);
    tip.classList.toggle('ascend-tip--above', top < r.bottom);

    var center = r.left + r.width / 2;
    var left = clamp(center - w / 2, EDGE, vw - EDGE - w);

    tip.style.top = Math.round(top) + 'px';
    tip.style.left = Math.round(left) + 'px';
    arrow.style.left = Math.round(clamp(center - left, ARROW_INSET, w - ARROW_INSET) - 4) + 'px';
  }

  function show(trigger) {
    var text = trigger.getAttribute('data-ascend-tip');
    if (!text) return;
    ensureTip();
    if (activeTrigger && activeTrigger !== trigger) {
      activeTrigger.classList.remove('is-active');
      activeTrigger.removeAttribute('aria-describedby');
    }
    activeTrigger = trigger;
    tip.querySelector('.ascend-tip__text').textContent = text;
    trigger.classList.add('is-active');
    trigger.setAttribute('aria-describedby', TIP_ID);
    tip.classList.add('is-open');
    place();
  }

  function hide() {
    if (activeTrigger) {
      activeTrigger.classList.remove('is-active');
      activeTrigger.removeAttribute('aria-describedby');
      activeTrigger = null;
    }
    if (tip) tip.classList.remove('is-open');
  }

  function triggerFrom(node) {
    if (!node || !node.closest) return null;
    return node.closest('[data-ascend-tip]');
  }

  document.addEventListener('mouseover', function (e) {
    var trigger = triggerFrom(e.target);
    if (trigger) show(trigger);
    else if (activeTrigger) hide();
  });

  document.addEventListener('focusin', function (e) {
    var trigger = triggerFrom(e.target);
    if (trigger) show(trigger);
    else if (activeTrigger) hide();
  });

  document.addEventListener('focusout', function (e) {
    if (triggerFrom(e.target) === activeTrigger) hide();
  });

  document.addEventListener('click', function (e) {
    var trigger = triggerFrom(e.target);
    if (!trigger) {
      hide();
      return;
    }
    e.preventDefault();
    if (trigger === activeTrigger && tip && tip.classList.contains('is-open')) hide();
    else show(trigger);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') hide();
  });

  window.addEventListener('scroll', place, true);
  window.addEventListener('resize', place);
})();
