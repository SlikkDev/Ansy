// Theme toggle. The pre-paint script in <head> has already set data-theme;
// this only wires the button. Without JS the button stays hidden (CSS).
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  var meta = document.querySelector('meta[name="theme-color"]');

  function sync() {
    var light = root.getAttribute('data-theme') === 'light';
    btn.setAttribute('aria-pressed', String(light));
    if (meta) meta.setAttribute('content', light ? '#F8F5F0' : '#080808');
  }

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ansy-theme', next); } catch (e) {}
    sync();
  });

  sync();
})();
