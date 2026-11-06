/* Kleines Bewertungs-Banner: „Bewerten Sie uns gern bei Google“ mit Direktlink – ab und zu, nie aufdringlich.
   Einbinden: <script src="assets/fe-bewertung.js" data-url="https://search.google.com/local/writereview?placeid=…" defer></script>
   Optional:  data-name="Google" · data-anrede="du" · data-accent="#b5632f" · data-delay="35" (Sekunden Lesezeit) · data-bottom="22" · data-bottom-m="90" (px, Handy bis 760 px)
              data-side="left|right|center" · data-skip="planer" (Pfade ohne Banner, RegExp) · data-url="#demo" (Beispielseite: nur Hinweis)
   Regeln: erscheint höchstens einmal pro Besuch, erst nach Lesezeit und etwas Scrollen, verschwindet von selbst; nur ein Link, kein Fremd-Skript, keine Cookies. */
(function () {
  'use strict';
  if (window.FEReview) return;
  var S = document.currentScript || document.querySelector('script[src*="fe-bewertung"]'), D = (S && S.dataset) || {};
  var URL_ = D.url || '', NAME = D.name || 'Google', DU = D.anrede === 'du', ACC = D.accent || '#b5632f', DELAY = Math.max(5, +D.delay || 35) * 1000;
  var SIDE = D.side || 'left', DEMO = URL_ === '#demo';
  if (!URL_ || (D.skip && new RegExp(D.skip).test(location.pathname))) { window.FEReview = { show: function () { } }; return; }
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = function () { try { return sessionStorage.getItem('ferv'); } catch (e) { return '1'; } }, mark = function (v) { try { sessionStorage.setItem('ferv', v); } catch (e) { } };
  var T = DU ? { h: 'Zufrieden mit uns?', t: 'Bewerte uns gern bei ' + NAME + ' – das hilft uns sehr weiter.', b: 'Jetzt bewerten' }
             : { h: 'Zufrieden mit uns?', t: 'Bewerten Sie uns gern bei ' + NAME + ' – das hilft uns sehr weiter.', b: 'Jetzt bewerten' };
  var pos = SIDE === 'right' ? 'right:16px;' : SIDE === 'center' ? 'left:50%;margin-left:calc(min(400px,100vw - 32px)/-2);' : 'left:16px;';
  var css = '.ferv,.ferv *{box-sizing:border-box}.ferv{--a:' + ACC + ';position:fixed;' + pos + 'bottom:calc(var(--b,22px) + env(safe-area-inset-bottom,0px));z-index:2147481990;width:min(400px,calc(100vw - 32px));background:#fffdf9;color:#1d1b19;border-radius:18px;padding:14px 44px 14px 14px;box-shadow:0 18px 46px rgba(0,0,0,.26),0 0 0 1px rgba(0,0,0,.05);display:flex;gap:12px;align-items:center;font:inherit;transform:translateY(calc(100% + 40px));opacity:0;transition:transform .6s cubic-bezier(.2,.9,.25,1.12),opacity .4s}' +
    '.ferv.in{transform:none;opacity:1}.ferv-st{flex:0 0 auto;display:flex;gap:1px}.ferv-st svg{width:19px;height:19px}.ferv-st path{fill:#e5ddd2;transition:fill .3s}.ferv.in .ferv-st path{animation:fervS .5s forwards}' +
    '.ferv.in .ferv-st svg:nth-child(1) path{animation-delay:.5s}.ferv.in .ferv-st svg:nth-child(2) path{animation-delay:.65s}.ferv.in .ferv-st svg:nth-child(3) path{animation-delay:.8s}.ferv.in .ferv-st svg:nth-child(4) path{animation-delay:.95s}.ferv.in .ferv-st svg:nth-child(5) path{animation-delay:1.1s}' +
    '@keyframes fervS{0%{fill:#e5ddd2;transform:scale(1)}50%{fill:#f6b400;transform:scale(1.35)}100%{fill:#f6b400;transform:scale(1)}}.ferv-st path{transform-box:fill-box;transform-origin:center}' +
    '.ferv-tx{flex:1;min-width:0;font-size:14px;line-height:1.35}.ferv-tx b{display:block;font-size:15px;margin:3px 0 2px}.ferv-a{display:inline-flex;align-items:center;gap:6px;margin-top:8px;background:var(--a);color:#fff!important;text-decoration:none!important;font-weight:700;font-size:14px;padding:9px 14px;border-radius:999px;transition:filter .2s,transform .15s}.ferv-a:hover{filter:brightness(1.08)}.ferv-a:active{transform:scale(.97)}' +
    '.ferv-x{position:absolute;top:8px;right:8px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(0,0,0,.06);color:#4a443d;font-size:17px;line-height:1;cursor:pointer}.ferv-x:hover{background:rgba(0,0,0,.12)}' +
    '.ferv-n{display:block;margin-top:8px;font-size:12.5px;color:#7a7067}' +
    '@media (max-width:760px){.ferv{bottom:calc(var(--bm,var(--b,22px)) + env(safe-area-inset-bottom,0px))}}@media (max-width:560px){.ferv{left:12px;right:12px;margin-left:0;width:auto}}' +
    '@media (prefers-reduced-motion:reduce){.ferv,.ferv *{animation:none!important;transition:none!important}.ferv-st path{fill:#f6b400}}';
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>';
  var el = null, hideT = 0, shown = false;
  function show() {
    if (shown || seen() || document.querySelector('.fefb:not([hidden]),.fefb-inv')) return; shown = true; mark('1');
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('aside'); el.className = 'ferv'; el.setAttribute('aria-label', 'Bewertung'); if (D.bottom) el.style.setProperty('--b', (+D.bottom || 22) + 'px'); if (D.bottomM) el.style.setProperty('--bm', (+D.bottomM || 22) + 'px');
    el.innerHTML = '<span class="ferv-tx"><span class="ferv-st" aria-hidden="true">' + STAR + STAR + STAR + STAR + STAR + '</span><b>' + T.h + '</b>' + T.t + '<br><a class="ferv-a" href="' + (DEMO ? '#' : URL_.replace(/"/g, '&quot;')) + '"' + (DEMO ? '' : ' target="_blank" rel="noopener"') + '>' + T.b + ' <span aria-hidden="true">★</span></a></span><button type="button" class="ferv-x" aria-label="Schließen">×</button>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('in'); }); });
    el.addEventListener('click', function (e) {
      if (e.target.closest('.ferv-x')) { hide(); return; }
      var a = e.target.closest('.ferv-a'); if (!a) return;
      if (DEMO) { e.preventDefault(); if (!el.querySelector('.ferv-n')) a.insertAdjacentHTML('afterend', '<span class="ferv-n">Beispielseite – im echten Projekt öffnet sich hier die ' + NAME + '-Bewertung des Studios.</span>'); clearTimeout(hideT); hideT = setTimeout(hide, 6000); return; }
      setTimeout(hide, 400);
    });
    el.addEventListener('pointerenter', function () { clearTimeout(hideT); });
    el.addEventListener('pointerleave', function () { clearTimeout(hideT); hideT = setTimeout(hide, 9000); });
    hideT = setTimeout(hide, 18000);
  }
  function hide() { clearTimeout(hideT); if (!el) return; var x = el; el = null; x.classList.remove('in'); setTimeout(function () { x.remove(); }, RM ? 0 : 650); }
  // Erst nach Lesezeit (nur sichtbare Zeit zählt) und etwas Scrollen – oder wenn die Seite kaum scrollt
  var t0 = 0, acc = 0, depth = 0, iv = 0;
  function tick() {
    var now = Date.now(); if (!document.hidden && t0) acc += now - t0; t0 = now;
    var h = document.documentElement, max = Math.max(1, h.scrollHeight - innerHeight); depth = Math.max(depth, max < 300 ? 1 : (scrollY || h.scrollTop) / max);
    if (acc >= DELAY && depth >= .35) { clearInterval(iv); show(); }
  }
  function start() { if (seen()) return; t0 = Date.now(); iv = setInterval(tick, 1000); }
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
  window.FEReview = { show: function () { shown = false; try { sessionStorage.removeItem('ferv'); } catch (e) { } show(); }, hide: hide };
})();
