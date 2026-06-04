/**
 * ASCEND lazy-reveal — revela .lazy-row en orden DOM: primero al cargar, luego cada
 * bloque siguiente solo cuando entra en viewport (cadena estricta, sin saltos).
 * Uso: <script src="ascend-lazy-reveal.js" defer></script>
 */
(function () {
  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    var st = window.getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden';
  }

  var rows = Array.prototype.filter.call(
    document.querySelectorAll('.main .lazy-row'),
    isVisible
  );
  if (!rows.length) return;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reveal(el) {
    el.classList.add('revealed');
  }

  if (prefersReduced) {
    rows.forEach(reveal);
    return;
  }

  var IO_OPTS = { threshold: 0.07, rootMargin: '0px 0px -40px 0px' };
  var INITIAL_DELAY = 80;
  var FALLBACK_STAGGER = 200;

  function observeThenReveal(index, done) {
    if (index >= rows.length) {
      if (done) done();
      return;
    }
    var el = rows[index];

    if (!('IntersectionObserver' in window)) {
      reveal(el);
      if (done) done();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        reveal(el);
        if (done) done();
      });
    }, IO_OPTS);

    io.observe(el);
  }

  function chainFrom(index) {
    if (index >= rows.length) return;
    observeThenReveal(index, function () {
      chainFrom(index + 1);
    });
  }

  setTimeout(function () {
    reveal(rows[0]);
    if (rows.length === 1) return;
    if (!('IntersectionObserver' in window)) {
      rows.slice(1).forEach(function (el, i) {
        setTimeout(function () {
          reveal(el);
        }, (i + 1) * FALLBACK_STAGGER);
      });
      return;
    }
    chainFrom(1);
  }, INITIAL_DELAY);
})();
