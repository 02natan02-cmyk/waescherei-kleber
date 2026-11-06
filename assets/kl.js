/* Wäscherei Kleber – Entwurf 2 · Waschmaschine mit Physik, Waschstraße, Sockenspiel, Heißmangel, Lamellen, Kleiderstange, Wäschezettel */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const sget = k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, sset = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  const inView = (el, cb, m = '150px') => { if (!el) return; new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: m }).observe(el); };
  const toastEl = $('[data-toast]'); let tt;
  const toast = (m, ms = 3200) => { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), ms); };
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------------- Hinweis-Chips („← ziehen →“, „Antippen“) ----------------
     Erscheinen beim ersten Sichtkontakt einmal sanft, stehen ruhig (kein Wackeln) und verschwinden nach der ersten echten Berührung. */
  const HAND = '<svg class="nd-hand" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11.2V4.6a1.6 1.6 0 0 1 3.2 0V10h.4V8.6a1.6 1.6 0 0 1 3.2 0v1.6h.4v-.4a1.6 1.6 0 0 1 3.2 0v5.3c0 4-2.7 6.9-6.6 6.9h-.9c-2 0-3.5-.8-4.7-2.4l-3-4.3a1.6 1.6 0 0 1 2.5-2z"/></svg>';
  function nudge(host, text, { kind = 'drag', on = [host], delay = 700, cls = '' } = {}) {
    if (!host) return { kill() {} };
    const n = document.createElement('span'); n.className = `nudge nd-${kind} ${cls}`; n.setAttribute('aria-hidden', 'true');
    n.innerHTML = kind === 'drag' ? `<i class="nd-ar">←</i>${HAND}<b>${text}</b><i class="nd-ar">→</i>` : `<i class="nd-ring"></i>${HAND}<b>${text}</b>`;
    host.appendChild(n);
    let gone = false, shown = false;
    const kill = () => { if (gone) return; gone = true; n.classList.remove('on'); n.classList.add('bye'); setTimeout(() => n.remove(), 600); };
    on.forEach(t => t && ['pointerdown', 'keydown', 'input'].forEach(ev => t.addEventListener(ev, e => { if (e.isTrusted) kill(); }, { passive: true })));
    if (RM) n.classList.add('rm');
    inView(host, v => { if (v && !shown && !gone) { shown = true; setTimeout(() => { if (!gone) { n.classList.add('on'); setTimeout(kill, 5200); } }, delay); } }, '-12% 0px');
    return { kill, el: n };
  }

  /* ---------------- Schwebende Elemente weichen Inhalten aus ---------------- */
  function avoid(el, sel, { cls = 'clash', pad = 0, skip = null } = {}) {
    if (!el) return;
    let raf = 0;
    const chk = () => {
      raf = 0; if (getComputedStyle(el).display === 'none') return;
      if (skip && skip()) { el.classList.remove(cls); return; }
      const r = el.getBoundingClientRect(); if (!r.width) return;
      const R = { l: r.left + 2, r: r.right - 2, t: r.top + 2, b: r.bottom + pad };
      let hit = false;
      for (const t of document.querySelectorAll(sel)) { const q = t.getBoundingClientRect(); if (q.width && q.right > R.l && q.left < R.r && q.bottom > R.t && q.top < R.b) { hit = true; break; } }
      el.classList.toggle(cls, hit);
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(chk); };
    addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); setInterval(req, 600); req();
  }

  /* ---------------- Intro ---------------- */
  const intro = $('[data-intro]');
  const ready = () => { document.body.classList.remove('is-loading'); document.dispatchEvent(new Event('kl-ready')); };
  const onReady = fn => { if (document.body.classList.contains('is-loading')) document.addEventListener('kl-ready', fn, { once: true }); else fn(); };
  // Intro nur beim allerersten Besuch (localStorage), mit „Überspringen“; ?intro zeigt es zur Vorführung noch einmal
  if (intro) {
    const force = /[?&]intro(&|=|$)/.test(location.search);
    if (!force && (RM || document.documentElement.classList.contains('no-intro') || store.get('kl-intro') || sget('kl-intro'))) { intro.remove(); ready(); }
    else {
      store.set('kl-intro', 1); sset('kl-intro', 1);
      requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.add('go')));
      const end = () => { if (intro.classList.contains('out')) return; intro.classList.add('out'); ready(); setTimeout(() => intro.remove(), 900); };
      setTimeout(end, 2300); intro.addEventListener('click', end);
      const sk = $('[data-introskip]', intro); if (sk) { sk.addEventListener('click', end); setTimeout(() => { try { sk.focus({ preventScroll: true }); } catch (e) {} }, 50); }
    }
  } else ready();

  /* ---------------- Größere Schrift (A+) ---------------- */
  const root = document.documentElement, apl = $$('[data-aplus]');
  const setGross = on => { root.classList.toggle('gross', on); apl.forEach(b => b.setAttribute('aria-pressed', on)); if (on) store.set('kl-gross', 1); else { try { localStorage.removeItem('kl-gross'); } catch (e) {} } dispatchEvent(new Event('resize')); };
  apl.forEach(b => { b.setAttribute('aria-pressed', root.classList.contains('gross')); b.addEventListener('click', () => { const on = !root.classList.contains('gross'); setGross(on); toast(on ? 'Größere Schrift ist eingeschaltet.' : 'Normale Schriftgröße.'); }); });

  /* ---------------- Header / Menü ---------------- */
  const hdr = $('[data-hdr]'), burger = $('[data-burger]'), mnav = $('[data-mnav]'); let ly = 0;
  const onS = () => { const y = scrollY; if (!hdr) return; hdr.classList.toggle('scrolled', y > 30);
    // nur bei deutlicher Bewegung umschalten – sonst blendet sich der Kopf beim langsamen Scrollen wieder ein
    if (y <= 600 || y < ly - 4 || (mnav && !mnav.hidden)) hdr.classList.remove('hide'); else if (y > ly + 4) hdr.classList.add('hide'); ly = y; };
  addEventListener('scroll', onS, { passive: true }); onS();
  if (burger && mnav) { burger.addEventListener('click', () => { const o = mnav.hidden; mnav.hidden = !o; burger.setAttribute('aria-expanded', o); }); $$('a', mnav).forEach(a => a.addEventListener('click', () => { mnav.hidden = true; burger.setAttribute('aria-expanded', false); })); }

  /* ---------------- Öffnungszeiten live ---------------- */
  const H = (window.KL || {}).hours || [];
  const DN = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'], DS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  function berlin() { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()); const g = k => (p.find(x => x.type === k) || {}).value; return { d: { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[g('weekday')], m: (+g('hour') % 24) * 60 + +g('minute') }; }
  const mins = s => { const [h, m] = s.split(':'); return +h * 60 + +m; };
  function status() {
    const { d, m } = berlin(), h = H[d]; let open = false, sub = '';
    if (h && m >= mins(h[0]) && m < mins(h[1])) { open = true; sub = 'bis ' + h[1] + ' Uhr'; }
    else {
      for (let i = 0; i < 8; i++) { const dd = (d + i) % 7, hh = H[dd]; if (!hh) continue; if (i === 0 && m >= mins(hh[0])) continue; sub = 'öffnet ' + (i === 0 ? 'heute' : i === 1 ? 'morgen' : DS[dd]) + ' ' + hh[0]; break; }
    }
    const ds = $('[data-doorsign]'); if (ds) { ds.classList.toggle('open', open); ds.classList.toggle('closed', !open); $('[data-dsb]').textContent = open ? 'Geöffnet' : 'Geschlossen'; $('[data-dss]').textContent = sub; }
    const dn = $('[data-dsnow]'); if (dn) { dn.textContent = (open ? 'Jetzt geöffnet' : 'Jetzt geschlossen') + (sub ? ' · ' + sub.replace(' Uhr', '') : ''); dn.classList.toggle('open', open); dn.classList.toggle('closed', !open); }
    const d2 = $('[data-door2]'); if (d2) { const was = d2.classList.contains('open'); d2.classList.toggle('open', open); d2.classList.toggle('closed', !open); $('[data-ds2b]').textContent = open ? 'Geöffnet' : 'Geschlossen'; $('[data-ds2s]').textContent = sub; if (was !== open) { d2.classList.remove('flip'); void d2.offsetWidth; d2.classList.add('flip'); } }
    const todayIdx = (d + 1) % 7; $$('[data-hours] li').forEach(li => li.classList.toggle('today', +li.dataset.day === todayIdx));
  }
  status(); setInterval(status, 60000);

  /* ---------------- Öffnungszeiten im Hero (kompakt, live) ---------------- */
  const oz = $('[data-oz]');
  const hu = t => { const [h, m] = t.split(':'); return +m ? `${+h}:${m}` : `${+h}`; };   // „9:00“ → „9“
  function ozUpd() {
    if (!oz) return;
    const { d, m } = berlin(), h = H[d];
    const open = !!(h && m >= mins(h[0]) && m < mins(h[1]));
    let nx = null; if (!open) for (let i = 0; i < 8; i++) { const dd = (d + i) % 7, hh = H[dd]; if (!hh) continue; if (i === 0 && m >= mins(hh[0])) continue; nx = { i, dd, t: hh[0] }; break; }
    oz.classList.toggle('open', open); oz.classList.toggle('closed', !open);
    $('[data-ozstt]', oz).textContent = open ? 'Jetzt geöffnet' : 'Jetzt geschlossen';
    const when = nx ? (nx.i === 0 ? 'heute' : nx.i === 1 ? 'morgen' : 'am ' + DN[nx.dd]) : '';
    $('[data-oznext]', oz).textContent = open ? `· bis ${hu(h[1])} Uhr` : nx ? `· öffnet ${when} um ${hu(nx.t)} Uhr` : '';
  }
  ozUpd(); setInterval(ozUpd, 30000);

  /* ---------------- Programm-Drehknopf ---------------- */
  const dialEl = $('[data-dial]');
  if (dialEl) {
    const stops = $$('[data-dst]', dialEl), knob = $('[data-dialknob]', dialEl);
    const secs = stops.map(a => $(a.getAttribute('href')));
    const stEl = $('#geschichte'), ftEl = $('.ftr');
    const upd = () => {
      dialEl.classList.toggle('on', scrollY > innerHeight * .6);
      const sr = stEl && stEl.getBoundingClientRect(), pinned = sr && sr.top <= 2 && sr.bottom >= innerHeight - 2, nearEnd = ftEl && ftEl.getBoundingClientRect().top < innerHeight - 40;
      dialEl.classList.toggle('away', !!(pinned || nearEnd));
      let k = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .45) k = i; });
      stops.forEach((a, i) => a.classList.toggle('on', i === k)); knob.style.setProperty('--k', stops[k].style.getPropertyValue('--a')); $('[data-dialt]').textContent = stops[k].dataset.t;
      $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === stops[k].getAttribute('href')));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // Programmknopf und Entwurfs-Hinweis dürfen nie über Karten, Bügeln, Zetteln oder Texten liegen
  const CONTENT = '.lm, .lm-end p, .story-ct, .story-go, .hg-tag, .cl-it, .pair, .line-rope, .tape, .h1, .h2, .lead, .kick, .b, .ba, .sc, .tk, .tk-steps, .mg-machine, .mg-ctrl, .mg-photos figure, .namebox, .bl-v, .bl-count, .sg-drum, .sg-stats, .shop-front, .shop-boards, .vo-score, .stats, .rack-ctl, .wm, .basket, .wm-hint, .ftr-in, .ftr-b';
  avoid(dialEl, CONTENT, { pad: 30 });
  const concept = $('.concept'), ftr0 = $('.ftr');
  if (concept && ftr0) {
    const cu = () => { concept.classList.toggle('away', ftr0.getBoundingClientRect().top < innerHeight - 40); concept.classList.toggle('mini', scrollY > innerHeight * .45); };
    addEventListener('scroll', cu, { passive: true }); cu();
    avoid(concept, CONTENT, { skip: () => !concept.classList.contains('mini') });
  }

  /* ---------------- Zähler ---------------- */
  $$('[data-count]').forEach(el => inView(el, v => { if (!v || el._done) return; el._done = 1; const n = +el.dataset.count; let t0; const st = ts => { if (!t0) t0 = ts; const k = clamp((ts - t0) / 1400, 0, 1); el.textContent = Math.round(n * ease(k)); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); }, '0px'));

  /* ================= Seifenblasen im Hero ================= */
  const hero = $('[data-hero]'), bcv = $('[data-bubbles]');
  if (hero && bcv) {
    const x = bcv.getContext('2d'); let W, Hh, bs = [], vis = true, pops = [];
    const rs = () => { W = hero.clientWidth; Hh = hero.clientHeight; bcv.width = W * DPR; bcv.height = Hh * DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0); };
    rs(); addEventListener('resize', rs); inView(hero, v => vis = v, '0px');
    const mk = (y) => ({ x: Math.random() * W, y: y ?? Hh + 30, r: 6 + Math.random() * 22, v: .3 + Math.random() * .7, ph: Math.random() * 6.28, h: Math.random() * 360 });
    const NB = innerWidth < 700 ? 6 : 12; for (let i = 0; i < NB; i++) bs.push(mk(Math.random() * Hh));
    hero.addEventListener('pointerdown', e => { const r = hero.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; bs = bs.filter(b => { if (Math.hypot(b.x - px, b.y - py) < b.r + 6) { for (let i = 0; i < 10; i++) pops.push({ x: b.x, y: b.y, vx: Math.cos(i / 10 * 6.28) * 2.4, vy: Math.sin(i / 10 * 6.28) * 2.4, a: 1 }); return false; } return true; }); });
    const loop = () => {
      if (vis && !RM) {
        x.clearRect(0, 0, W, Hh);
        while (bs.length < NB) bs.push(mk());
        for (const b of bs) {
          b.y -= b.v; b.ph += .02; b.x += Math.sin(b.ph) * .4; if (b.y < -40) Object.assign(b, mk());
          const g = x.createRadialGradient(b.x - b.r * .3, b.y - b.r * .3, b.r * .1, b.x, b.y, b.r);
          g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.7, `hsla(${b.h + b.ph * 40},90%,80%,.10)`); g.addColorStop(.92, `hsla(${b.h + 120 + b.ph * 40},90%,70%,.35)`); g.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r, 0, 6.28); x.fill();
          x.strokeStyle = 'rgba(21,70,168,.12)'; x.lineWidth = 1; x.stroke();
        }
        pops = pops.filter(p => (p.a -= .05) > 0); for (const p of pops) { p.x += p.vx; p.y += p.vy; x.fillStyle = `rgba(42,99,212,${p.a * .6})`; x.fillRect(p.x, p.y, 2.4, 2.4); }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ================= Sprites (Wäsche, Socken) ================= */
  const PAL = ['#e63946', '#1d6fd8', '#ffd23f', '#2a9d8f', '#f4a261', '#9b5de5', '#ffffff', '#06d6a0', '#ef476f', '#264653'];
  function cnv(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR); const x = c.getContext('2d'); x.scale(DPR, DPR); return [c, x]; }
  function shade(x, w, h) { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.25)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)'); x.fillStyle = g; x.fill(); }
  const SP = {
    shirt(w, h, col) { const [c, x] = cnv(w, h); x.beginPath(); x.moveTo(w * .3, 0); x.lineTo(w * .7, 0); x.lineTo(w, h * .2); x.lineTo(w * .86, h * .38); x.lineTo(w * .78, h * .3); x.lineTo(w * .78, h); x.lineTo(w * .22, h); x.lineTo(w * .22, h * .3); x.lineTo(w * .14, h * .38); x.lineTo(0, h * .2); x.closePath(); x.fillStyle = col; x.fill(); shade(x, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(w / 2, 0, w * .13, h * .1, 0, 0, Math.PI); x.fill(); x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 1; x.beginPath(); x.moveTo(w * .4, h * .5); x.quadraticCurveTo(w * .5, h * .62, w * .62, h * .48); x.stroke(); return c; },
    towel(w, h, col) { const [c, x] = cnv(w, h); x.beginPath(); x.roundRect ? x.roundRect(0, 0, w, h, 6) : x.rect(0, 0, w, h); x.fillStyle = col; x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(w * .08, 0, w * .06, h); x.fillRect(w * .86, 0, w * .06, h); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .08})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.beginPath(); x.rect(0, 0, w, h); shade(x, w, h); return c; },
    sheet(w, h) { const [c, x] = cnv(w, h); x.fillStyle = '#fbfcff'; x.fillRect(0, 0, w, h); x.fillStyle = '#9cc0ff'; for (let i = 0; i < w; i += 14) x.fillRect(i, 0, 4, h); x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1.2; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, Math.random() * h); x.bezierCurveTo(w * .3, Math.random() * h, w * .6, Math.random() * h, w, Math.random() * h); x.stroke(); } x.beginPath(); x.rect(0, 0, w, h); shade(x, w, h); return c; },
    duck(w) { const [c, x] = cnv(w, w); x.fillStyle = '#ffd23f'; x.beginPath(); x.ellipse(w * .5, w * .62, w * .42, w * .3, 0, 0, 6.28); x.fill(); x.beginPath(); x.arc(w * .62, w * .32, w * .22, 0, 6.28); x.fill(); x.fillStyle = '#ff8c1a'; x.beginPath(); x.moveTo(w * .8, w * .3); x.lineTo(w * .98, w * .36); x.lineTo(w * .8, w * .42); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(w * .66, w * .27, w * .04, 0, 6.28); x.fill(); x.beginPath(); x.ellipse(w * .5, w * .62, w * .42, w * .3, 0, 0, 6.28); shade(x, w, w); return c; },
  };
  // Socken: Muster
  const SOCKS = [
    { b: '#e63946', p: 'stripe', c2: '#ffffff' }, { b: '#1d6fd8', p: 'dots', c2: '#ffffff' }, { b: '#ffd23f', p: 'plain', c2: '#ff8c1a' }, { b: '#2a9d8f', p: 'argyle', c2: '#e9c46a' },
    { b: '#222831', p: 'plain', c2: '#ffffff' }, { b: '#ff8fab', p: 'hearts', c2: '#d00045' }, { b: '#ffffff', p: 'stripe', c2: '#1546a8' }, { b: '#f4a261', p: 'zig', c2: '#5c2c06' }];
  function sockSprite(s, L, sel) {
    // Lokale Geometrie: Schaft senkrecht (0..L*.62), Fuß nach rechts
    const lw = L * .36, w = L * .78, h = L;
    const [c, x] = cnv(w, h);
    const path = () => { x.beginPath(); x.moveTo(2, 2); x.lineTo(2 + lw, 2); x.lineTo(2 + lw, h * .58); x.quadraticCurveTo(2 + lw, h * .66, 2 + lw + (w - lw - 4) * .4, h * .68); x.lineTo(w - 2 - lw * .4, h * .68); x.arc(w - 2 - lw * .48, h * .68 + lw * .48, lw * .48, -Math.PI / 2, Math.PI / 2); x.lineTo(lw * .7, h * .68 + lw * .96); x.quadraticCurveTo(2, h * .68 + lw * .96, 2, h * .68); x.closePath(); };
    path(); x.fillStyle = s.b; x.fill(); x.save(); path(); x.clip();
    x.fillStyle = s.c2;
    if (s.p === 'stripe') for (let y = 12; y < h; y += 13) x.fillRect(0, y, w, 5);
    if (s.p === 'dots') for (let y = 8; y < h; y += 10) for (let xx = 6 + (y / 10 % 2) * 5; xx < w; xx += 10) { x.beginPath(); x.arc(xx, y, 2.2, 0, 6.28); x.fill(); }
    if (s.p === 'argyle') { for (let y = 0; y < h; y += 18) for (let xx = 0; xx < w; xx += 18) { x.beginPath(); x.moveTo(xx + 9, y); x.lineTo(xx + 18, y + 9); x.lineTo(xx + 9, y + 18); x.lineTo(xx, y + 9); x.closePath(); x.globalAlpha = .55; x.fill(); x.globalAlpha = 1; } }
    if (s.p === 'hearts') for (let y = 10; y < h; y += 14) for (let xx = 7 + (y / 14 % 2) * 6; xx < w; xx += 13) { x.beginPath(); x.moveTo(xx, y + 3); x.bezierCurveTo(xx - 5, y - 2, xx - 5, y - 6, xx, y - 3); x.bezierCurveTo(xx + 5, y - 6, xx + 5, y - 2, xx, y + 3); x.fill(); }
    if (s.p === 'zig') { x.lineWidth = 3; x.strokeStyle = s.c2; for (let y = 10; y < h; y += 14) { x.beginPath(); for (let xx = 0; xx <= w; xx += 8) x.lineTo(xx, y + ((xx / 8) % 2 ? 4 : -4)); x.stroke(); } }
    // Bündchen, Ferse, Spitze
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 0, w, h * .12); x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 4; i < lw; i += 4) x.fillRect(i, 2, 1.5, h * .12);
    x.fillStyle = s.p === 'plain' ? s.c2 : 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(2 + lw * .2, h * .68 + lw * .2, lw * .55, 0, 6.28); x.fill(); x.beginPath(); x.arc(w - 2 - lw * .48, h * .68 + lw * .48, lw * .5, -1.2, 1.2); x.fill();
    x.restore(); path(); shade(x, w, h);
    if (sel) { x.lineWidth = 6; x.strokeStyle = '#ffffff'; x.stroke(); x.lineWidth = 2.5; x.strokeStyle = '#1546a8'; x.stroke(); }
    else { x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.25)'; x.stroke(); }
    return { c, w, h, lw };
  }

  /* ================= Physik-Trommel (Hero) ================= */
  function makeDrum(cv, opts) {
    const M = window.Matter; if (!M) return null;
    const { Engine, Bodies, Body, Composite, Query, Constraint, Events } = M;
    const eng = Engine.create(); eng.gravity.y = 1; eng.positionIterations = 8; eng.velocityIterations = 6;
    let W = 0, R = 0, cx = 0, cy = 0, drum = null, ang = 0, omega = opts.omega || .018, items = [], water = opts.water ?? 0, waterT = water;
    const ctx = cv.getContext('2d');
    function build() {
      const r = cv.getBoundingClientRect(); W = r.width; if (!W) return false; cv.width = W * DPR; cv.height = W * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = W / 2; cx = cy = R;
      if (drum) Composite.remove(eng.world, drum);
      const parts = [], N = 48, th = R * .5;
      for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, rr = R + th / 2 - 2; parts.push(Bodies.rectangle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, th, (2 * Math.PI * (R + th)) / N + 6, { angle: a })); }
      (opts.baffles ?? 3) && [0, 1, 2].slice(0, opts.baffles ?? 3).forEach(k => { const a = k / 3 * Math.PI * 2 + .3, L = R * .2, rr = R - L / 2 + 2; parts.push(Bodies.rectangle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, L, R * .09, { angle: a, chamfer: { radius: R * .03 } })); });
      drum = Body.create({ parts, isStatic: true, friction: .9, frictionStatic: 1 });
      Body.setPosition(drum, { x: cx, y: cy }); Body.setAngle(drum, ang);
      Composite.add(eng.world, drum); return true;
    }
    function addItem(kind, x0, y0, extra = {}) {
      const k = R / 220, col = extra.col || PAL[Math.random() * PAL.length | 0];
      let b, spr, sw, sh;
      if (kind === 'shirt') { sw = 78 * k; sh = 66 * k; b = Bodies.rectangle(0, 0, sw * .82, sh * .9, { chamfer: { radius: 10 * k } }); spr = SP.shirt(sw, sh, col); }
      else if (kind === 'towel') { sw = 86 * k; sh = 44 * k; b = Bodies.rectangle(0, 0, sw, sh, { chamfer: { radius: 8 * k } }); spr = SP.towel(sw, sh, col); }
      else if (kind === 'sheet') { sw = 110 * k; sh = 58 * k; b = Bodies.rectangle(0, 0, sw, sh, { chamfer: { radius: 10 * k } }); spr = SP.sheet(sw, sh); }
      else if (kind === 'duck') { sw = sh = 46 * k; b = Bodies.circle(0, 0, sw * .42); spr = SP.duck(sw); }
      else { // Socke
        const s = extra.sock || SOCKS[Math.random() * SOCKS.length | 0], L = (extra.L || 62) * k, g = sockSprite(s, L);
        const leg = Bodies.rectangle(2 + g.lw / 2, L * .36, g.lw, L * .7), foot = Bodies.rectangle(g.w / 2, L * .68 + g.lw * .48, g.w - 6, g.lw * .9);
        b = Body.create({ parts: [leg, foot] }); spr = g.c; sw = g.w; sh = g.h; b._sock = s; b._L = L;
        b._off = { x: b.position.x - g.w / 2, y: b.position.y - g.h / 2 };
      }
      if (!b._off) b._off = { x: 0, y: 0 };
      Body.set(b, { friction: .6, frictionAir: .02, restitution: .15, density: kind === 'duck' ? .0006 : .0012 });
      Body.setPosition(b, { x: x0 ?? cx + (Math.random() - .5) * R * .6, y: y0 ?? cy - R * .4 });
      Body.setAngle(b, Math.random() * 6.28); Body.setVelocity(b, extra.v || { x: (Math.random() - .5) * 4, y: 2 });
      b._spr = spr; b._sw = sw; b._sh = sh; b._kind = kind;
      items.push(b); Composite.add(eng.world, b); return b;
    }
    function removeItem(b) { Composite.remove(eng.world, b); items = items.filter(i => i !== b); }
    // ein Teil nach oben holen: wird zuletzt gezeichnet und bei Treffern bevorzugt
    function toTop(b) { const i = items.indexOf(b); if (i < 0 || i === items.length - 1) return; items.splice(i, 1); items.push(b); }
    let spin = 0; // 0..1 Schleuderstärke
    const holes = [];
    function drawBack() {
      // Trommel-Edelstahl mit Lochmuster
      const g = ctx.createRadialGradient(cx, cy, R * .1, cx, cy, R); g.addColorStop(0, '#5d6a80'); g.addColorStop(.75, '#38445a'); g.addColorStop(1, '#1d2537'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(10,14,24,.55)'; const blur = spin > .5;
      for (let ring = 1; ring <= 6; ring++) { const rr = R * (.22 + ring * .12), n = Math.round(10 + ring * 7); for (let i = 0; i < n; i++) { const a = i / n * 6.28 + ring; ctx.beginPath(); if (blur) { ctx.globalAlpha = .25; ctx.arc(0, 0, rr, a, a + .12); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,14,24,.5)'; ctx.stroke(); ctx.globalAlpha = 1; } else { ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, R * .016, 0, 6.28); ctx.fill(); } } }
      // Rippen
      for (let k = 0; k < (opts.baffles ?? 3); k++) { const a = k / 3 * Math.PI * 2 + .3; ctx.save(); ctx.rotate(a); const L = R * .2; const gg = ctx.createLinearGradient(R - L, 0, R, 0); gg.addColorStop(0, '#c9d1dc'); gg.addColorStop(1, '#7d8798'); ctx.fillStyle = gg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(R - L, -R * .045, L + 4, R * .09, R * .03) : ctx.rect(R - L, -R * .045, L + 4, R * .09); ctx.fill(); ctx.restore(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(cx, cy, R * .12, 0, 6.28); ctx.fill();
    }
    let t = 0;
    function drawWater(front) {
      if (water < .01) return;
      const lvl = cy + R - water * 2 * R; t += .05;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.clip();
      ctx.beginPath(); ctx.moveTo(0, W); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, lvl + Math.sin(x / 26 + t) * 4 + Math.sin(x / 11 - t * 1.7) * 2 + Math.sin(ang * 2) * (x - cx) * .06); ctx.lineTo(W, W); ctx.closePath();
      ctx.fillStyle = front ? `rgba(120,190,255,${opts.waterCol || .28})` : 'rgba(40,90,170,.35)'; ctx.fill();
      if (front) { // Schaum
        for (let x = 0; x <= W; x += 9) { const y = lvl + Math.sin(x / 26 + t) * 4 + Math.sin(x / 11 - t * 1.7) * 2 + Math.sin(ang * 2) * (x - cx) * .06; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x, y - 1, 3 + Math.abs(Math.sin(x * 1.3 + t)) * 4, 0, 6.28); ctx.fill(); }
      }
      ctx.restore();
    }
    function drawItems(selSet) {
      for (const b of items) {
        ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
        if (b._kind === 'sock') { const on = selSet && selSet.has(b); if (on) { ctx.scale(1.14, 1.14); ctx.shadowColor = 'rgba(255,210,63,.95)'; ctx.shadowBlur = 16; } ctx.translate(-b._off.x - b._sw / 2, -b._off.y - b._sh / 2); ctx.drawImage(on ? (b._sel || (b._sel = sockSprite(b._sock, b._L, true).c)) : b._spr, 0, 0, b._sw, b._sh); }
        else ctx.drawImage(b._spr, -b._sw / 2, -b._sh / 2, b._sw, b._sh);
        ctx.restore();
      }
    }
    function step(dt) {
      if (!drum) return;
      const k = dt / 16.667;   // Drehung und Wasserstand laufen in Echtzeit – auf 60-Hz- und 120-Hz-Bildschirmen gleich schnell
      ang += omega * k; Body.setAngle(drum, ang, true);
      water += (waterT - water) * (1 - Math.pow(.98, k));
      const wl = cy + R - water * 2 * R;
      for (const b of items) {
        if (spin > .05) { const dx = b.position.x - cx, dy = b.position.y - cy, d = Math.hypot(dx, dy) || 1; Body.applyForce(b, b.position, { x: dx / d * b.mass * .0035 * spin, y: dy / d * b.mass * .0035 * spin }); }
        if (water > .02 && b.position.y > wl) { Body.applyForce(b, b.position, { x: 0, y: -b.mass * eng.gravity.y * eng.gravity.scale * (b._kind === 'duck' ? 1.6 : .55) }); b.frictionAir = .06; } else b.frictionAir = .02;
        // Sicherheit: aus der Trommel gefallen?
        if (Math.hypot(b.position.x - cx, b.position.y - cy) > R * 1.05) { Body.setPosition(b, { x: cx, y: cy }); Body.setVelocity(b, { x: 0, y: 0 }); }
      }
      eng.gravity.y = 1 - spin * .85;
      Engine.update(eng, dt);
    }
    // ein Rechenschritt pro Bild (mit der echten Bildzeit) – kein Aussetzen jedes zweiten Bildes, darum kein Ruckeln
    function frame(dt) { dt = Math.min(dt, 50); const n = Math.max(1, Math.ceil(dt / 16.667)), h = Math.max(4, dt / n); for (let i = 0; i < n; i++) step(h); }
    // Ziehen mit Maus / Finger
    let grab = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * W / r.height }; };
    cv.addEventListener('pointerdown', e => {
      const p = pt(e), hits = Query.point(items, p); let hit = hits[hits.length - 1]; if (!hit && opts.onPick) { let best = null, bd = 1e9; for (const b of items) { if (b._gone) continue; const d = Math.hypot(b.position.x - p.x, b.position.y - p.y); if (d < bd) { bd = d; best = b; } } if (bd < R * (e.pointerType === 'mouse' ? .13 : .21)) hit = best; } if (!hit) return;
      if (opts.onPick) { opts.onPick(hit); return; }
      if (e.pointerType !== 'mouse') { Body.setVelocity(hit, { x: (Math.random() - .5) * 10, y: -10 }); return; }
      grab = Constraint.create({ pointA: p, bodyB: hit, pointB: { x: p.x - hit.position.x, y: p.y - hit.position.y }, stiffness: .2, damping: .1, length: 0 });
      Composite.add(eng.world, grab); cv.setPointerCapture(e.pointerId); cv.classList.add('grab');
    });
    cv.addEventListener('pointermove', e => { if (grab) grab.pointA = pt(e); });
    const rel = () => { if (grab) { Composite.remove(eng.world, grab); grab = null; cv.classList.remove('grab'); } };
    cv.addEventListener('pointerup', rel); cv.addEventListener('pointercancel', rel);
    return {
      build, addItem, removeItem, toTop, step, frame, drawBack, drawWater, drawItems, ctx,
      get items() { return items; }, get R() { return R; }, get W() { return W; },
      set omega(v) { omega = v; }, get omega() { return omega; },
      set spin(v) { spin = v; }, get spin() { return spin; },
      set waterT(v) { waterT = v; }, eng, M,
    };
  }

  function whenMatter(cb) { if (window.Matter) cb(); else { const s = $('script[src*="matter"]'); if (s) s.addEventListener('load', cb, { once: true }); setTimeout(() => { if (window.Matter) cb(); }, 1500); } }
  let matterReady = false;
  whenMatter(() => { if (matterReady) return; matterReady = true; initHeroDrum(); initSocks(); });

  /* ---------------- Hero-Waschmaschine ---------------- */
  function initHeroDrum() {
    const cv = $('[data-drum]'), wm = $('[data-wm]'); if (!cv) return;
    const D = makeDrum(cv, { omega: .02, water: .3, baffles: 3 }); if (!D) return;
    const PROGS = [{ n: 'Bunt 40°', w: .3, o: .02, t: 72 }, { n: 'Koch 90°', w: .36, o: .024, t: 118 }, { n: 'Fein 30°', w: .26, o: .013, t: 48 }, { n: 'Wolle 20°', w: .22, o: .009, t: 39 }, { n: 'Hemden 40°', w: .28, o: .016, t: 58 }];
    let pi = 0, running = true, spinT = 0, vis = false, remain = PROGS[0].t * 60, last = performance.now();
    const lcdP = $('[data-lcdprog]'), lcdT = $('[data-lcdtime]'), btnS = $('[data-start]'), btnSp = $('[data-spin]'), knob = $('[data-knob]');
    const fill = () => { const n = innerWidth < 640 ? 9 : 13; const kinds = ['shirt', 'shirt', 'towel', 'sock', 'sock', 'sheet', 'sock', 'towel', 'shirt', 'duck', 'sock', 'shirt', 'sock']; for (let i = 0; i < n; i++) D.addItem(kinds[i], D.R + (Math.random() - .5) * D.R * .8, D.R + (Math.random() - .3) * D.R * .5); };
    const init = () => { if (D.build()) { if (!D.items.length) fill(); } };
    init(); addEventListener('resize', () => { const old = D.W; D.build(); if (Math.abs(D.W - old) > 40) { D.items.slice().forEach(b => D.removeItem(b)); fill(); } });
    inView(cv, v => vis = v, '100px');
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const h1w = $$('[data-h1] .w');
    function spinNow() {
      if (spinT > 0) return; spinT = 1; btnSp.classList.add('on'); D.waterT = 0; lcdP.textContent = 'Schleudern';
      if (!RM) h1w.forEach((w, i) => w.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 900, delay: i * 90, easing: 'cubic-bezier(.5,0,.3,1)' }));
    }
    knob.addEventListener('click', () => { pi = (pi + 1) % PROGS.length; knob.style.setProperty('--kn', (pi * 72) + 'deg'); lcdP.textContent = PROGS[pi].n; remain = PROGS[pi].t * 60; if (!spinT) D.waterT = PROGS[pi].w; });
    const lcd = $('.wm-lcd', wm), startI = $('[data-starti]', btnS);
    btnS.addEventListener('click', () => {
      running = !running; startI.textContent = running ? '❚❚' : '▶︎'; $('span', btnS).textContent = running ? 'Pause' : 'Start';
      btnS.classList.toggle('paused', !running); lcd.classList.toggle('paused', !running);
    });
    btnSp.addEventListener('click', spinNow);
    const ICON = { shirt: () => SP.shirt(30, 26, '#1d6fd8'), sock: () => sockSprite(SOCKS[1], 30).c, towel: () => SP.towel(30, 17, '#2a9d8f'), sheet: () => SP.sheet(30, 20), duck: () => SP.duck(28) };
    $$('[data-addw]').forEach(b => { b.setAttribute('aria-label', b.title + ' in die Trommel legen'); try { const im = new Image(); im.alt = ''; im.src = ICON[b.dataset.addw]().toDataURL(); im.width = 28; im.height = 28; b.textContent = ''; b.appendChild(im); } catch (er) { } });
    $$('[data-addw]').forEach(b => b.addEventListener('click', () => drop(b)));
    function drop(b) {
      if (D.items.length > 26) { const old = D.items[0]; D.removeItem(old); }
      D.addItem(b.dataset.addw, D.R + (Math.random() - .5) * D.R * .3, D.R * .35, { v: { x: (Math.random() - .5) * 3, y: 6 } });
      const r = b.getBoundingClientRect(), f = document.createElement('span'), ic = $('img', b); if (ic) f.appendChild(ic.cloneNode()); else f.textContent = b.textContent; f.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;font-size:24px;z-index:500;pointer-events:none;transition:transform .6s cubic-bezier(.22,1,.36,1),opacity .6s cubic-bezier(.22,1,.36,1)`; document.body.appendChild(f);
      const cr = cv.getBoundingClientRect(); if (RM) { f.remove(); return; } requestAnimationFrame(() => { f.style.transform = `translate(${cr.left + cr.width / 2 - r.left}px,${cr.top + cr.height * .3 - r.top}px) scale(.6) rotate(-40deg)`; f.style.opacity = '0'; }); setTimeout(() => f.remove(), 650);
    }
    // Impuls: ruhiger Hinweis in der Trommel (kein Wackeln)
    const basket = $('[data-basket]');
    nudge($('[data-door]', wm), TOUCH ? 'Wäsche antippen' : 'Wäsche greifen &amp; werfen', { kind: TOUCH ? 'tap' : 'drag', on: [wm, basket], delay: 1200, cls: 'nd-drum' });
    let rmUntil = 0;
    const wake = () => { if (!RM) return; const was = rmUntil > performance.now(); rmUntil = performance.now() + 2500; if (!was) { last = performance.now(); requestAnimationFrame(loop); } };
    [knob, btnS, btnSp, ...$$('[data-addw]')].forEach(el => el.addEventListener('click', wake)); cv.addEventListener('pointerdown', wake);
    function loop(now) {
      const dt = Math.min(50, now - last); last = now;
      if (vis && D.W) {
        // Programm & Schleudern
        let target = running && !RM ? PROGS[pi].o : 0;
        if (spinT > 0) { spinT += dt; const k = spinT / 1000; D.spin = k < 1.2 ? clamp((k - .5) / .7, 0, 1) : k < 5 ? 1 : clamp(1 - (k - 5) / 1.2, 0, 1); target = lerp(target, .24, D.spin); if (k > 6.4) { spinT = 0; D.spin = 0; btnSp.classList.remove('on'); D.waterT = PROGS[pi].w; lcdP.textContent = PROGS[pi].n; } }
        D.omega = lerp(D.omega, target, .04);
        if (running) { remain -= dt / 1000 * 6; if (remain < 0) remain = PROGS[pi].t * 60; }
        lcdT.textContent = fmt(remain / 60 * 60 / 60);
        D.frame(dt);
        const c = D.ctx; c.clearRect(0, 0, D.W, D.W); D.drawBack(); D.drawWater(false); D.drawItems(); D.drawWater(true);
      }
      if (!RM || now < rmUntil) requestAnimationFrame(loop);
    }
    if (!RM) requestAnimationFrame(loop); else { for (let i = 0; i < 90; i++) D.step(16.67); D.drawBack(); D.drawWater(false); D.drawItems(); D.drawWater(true); }
  }

  /* ================= Sockenspiel ================= */
  function initSocks() {
    const cv = $('[data-sgcv]'); if (!cv) return;
    const sel = new Set(); let pairs = 0, t0 = 0, running = false, vis = false, last = performance.now(), acc = 0, shakeT = 0;
    let selT = 0, hintB = null, hintT = 0, lastPairT = 0, idleHints = 0, focusOn = false;
    const tEl = $('[data-sgtime]'), pEl = $('[data-sgpairs]'), bEl = $('[data-sgbest]'), line = $('[data-sgline]'), done = $('[data-sgdone]'), res = $('[data-sgres]');
    const wrap = $('[data-sgwrap]'), startBtn = $('[data-sgstart]'), shakeBtn = $('[data-sgshake]');
    const fmt = ms => { const s = ms / 1000; return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')},${Math.floor((s % 1) * 10)}`; };
    const best = +store.get('kl-socks') || 0; if (best) bEl.textContent = fmt(best);
    const L = () => innerWidth < 640 ? 80 : 70;
    const D = makeDrum(cv, { omega: .006, water: 0, baffles: 3, onPick: b => pick(b) });
    if (!D) return; window.__klSocks = D;
    const Body = D.M.Body;
    function fill() {
      D.items.slice().forEach(b => D.removeItem(b)); line.innerHTML = ''; sel.clear(); hintB = null; pairs = 0; pEl.textContent = '0 / 8';
      const list = []; SOCKS.forEach((s, i) => { list.push(i, i); }); list.sort(() => Math.random() - .5);
      list.forEach(i => D.addItem('sock', D.R + (Math.random() - .5) * D.R * .9, D.R + (Math.random() - .2) * D.R * .7, { sock: SOCKS[i], L: L() }));
    }
    function start() {
      fill(); running = true; t0 = lastPairT = performance.now(); idleHints = 0; done.hidden = true; shakeT = 1; startBtn.textContent = 'Neu mischen';
      // auf dem Handy die Trommel samt Spielstand ins Bild holen
      if (innerWidth < 1000) { const st = $('.sg-stats').getBoundingClientRect(), r = wrap.getBoundingClientRect(); if (st.top < 0 || r.bottom > innerHeight - 72) scrollTo({ top: scrollY + st.top - 12, behavior: RM ? 'auto' : 'smooth' }); }
    }
    const shakeAnim = () => { if (!RM) cv.animate([{ opacity: 1 }, { opacity: .72 }, { opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' }); };   // ruhiges Abblenden statt Schütteln
    function pick(b) {
      if (b._gone) return;
      if (!running) { start(); return; }
      if (sel.has(b)) { sel.delete(b); return; }
      // gewählte Socke nach oben holen und kurz anheben – so liegt sie nie verdeckt
      D.toTop(b); Body.setVelocity(b, { x: b.velocity.x * .3, y: -3.2 });
      sel.add(b); selT = performance.now(); hintB = null;
      if (sel.size < 2) return;
      const [a, c] = [...sel];
      if (a._sock === c._sock) {
        a._gone = c._gone = true; sel.clear(); pairs++; pEl.textContent = pairs + ' / 8'; lastPairT = performance.now();
        setTimeout(() => {
          D.removeItem(a); D.removeItem(c);
          const el = document.createElement('div'); el.className = 'pair'; const g = sockSprite(a._sock, 60); const [pc, px] = cnv(54, 92); px.drawImage(g.c, 0, 6, g.w * .82, g.h * .82); px.drawImage(g.c, 10, 10, g.w * .82, g.h * .82); el.appendChild(pc); line.appendChild(el);
          if (pairs === 8) finish();
        }, 160);
      } else {
        // falsches Paar: wackeln, die zuletzt angetippte Socke bleibt ausgewählt
        shakeAnim(); sel.delete(a);
      }
    }
    function finish() {
      running = false; const ms = performance.now() - t0; const b = +store.get('kl-socks') || 0;
      const rec = !b || ms < b; if (rec) { store.set('kl-socks', Math.round(ms)); bEl.textContent = fmt(ms); }
      res.textContent = `Ihre Zeit: ${fmt(ms)}${rec ? ' – neue Bestzeit!' : ''} Bei uns geht keine Socke verloren.`; done.hidden = false; startBtn.textContent = 'Spiel starten';
    }
    startBtn.addEventListener('click', start); $('[data-sgagain]').addEventListener('click', start);
    nudge(wrap, TOUCH ? 'Zwei gleiche Socken antippen' : 'Zwei gleiche Socken anklicken', { kind: 'tap', on: [cv, startBtn, shakeBtn], delay: 900, cls: 'nd-socks' });
    shakeBtn.addEventListener('click', () => { shakeT = 1; shakeBtn.classList.remove('pulse'); });
    const init = () => { if (D.build() && !D.items.length) { const list = []; SOCKS.forEach((s, i) => list.push(i, i)); list.forEach(i => D.addItem('sock', D.R + (Math.random() - .5) * D.R * .9, D.R + (Math.random() - .2) * D.R * .7, { sock: SOCKS[i], L: L() })); } };
    init(); addEventListener('resize', () => D.build());
    inView(cv, v => vis = v, '50px');
    function loop(now) {
      const dt = Math.min(50, now - last); last = now;
      if (vis && D.W) {
        let target = RM ? .002 : .006; if (shakeT > 0) { shakeT += dt; const k = shakeT / 1000; target = k < 1.6 ? .07 : target; if (k > 1.6) shakeT = 0; }
        D.omega = lerp(D.omega, target, .05);
        if (running) {
          // Hilfe 1: ist eine Socke ausgewählt und nach 4 s noch kein Partner gefunden, hüpft der Partner nach oben
          if (sel.size === 1 && !hintB && now - selT > 4000) { const [a] = [...sel]; const pb = D.items.find(x => x !== a && !x._gone && x._sock === a._sock); if (pb) { hintB = pb; hintT = now; D.toTop(pb); Body.setVelocity(pb, { x: (Math.random() - .5) * 2, y: -5 }); } }
          // Hilfe 2: lange kein Paar – Tipp anzeigen und "Trommel drehen" hervorheben
          if (now - lastPairT > 15000 && idleHints < 2) { idleHints++; lastPairT = now; toast('Tipp: Socke antippen und kurz warten – der Partner hüpft hoch. Oder „Trommel drehen“.', 4200); shakeBtn.classList.remove('pulse'); void shakeBtn.offsetWidth; shakeBtn.classList.add('pulse'); }
        }
        D.frame(dt);
        const c = D.ctx; c.clearRect(0, 0, D.W, D.W); D.drawBack(); D.drawItems(sel);
        if (hintB && !hintB._gone && D.items.includes(hintB) && now - hintT < 2800) { const k = .5 + .5 * Math.sin((now - hintT) / 110); c.save(); c.strokeStyle = `rgba(255,210,63,${.3 + .6 * k})`; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.arc(hintB.position.x, hintB.position.y, D.R * .2, 0, 6.28); c.stroke(); c.restore(); }
        if (running) tEl.textContent = fmt(now - t0);
      }
      // Fokus beim Spielen auf dem Handy: Kopfzeile und Bedienleiste machen Platz
      const focus = running && vis && innerWidth < 1000; if (focus !== focusOn) { focusOn = focus; document.body.classList.toggle('sg-play', focus); }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ================= Waschstraße (Geschichte) ================= */
  const story = $('[data-story]');
  if (story && !RM) {
    const pin = $('[data-storypin]'), track = $('[data-storytrack]'), bar = $('[data-storybar]'), lms = $$('.lm', track), nEl = $('[data-storyn]');
    const manual = new Map();
    function size() { const extra = track.scrollWidth - innerWidth, f = innerWidth < 640 ? .72 : 1; story.style.setProperty('--sh', (extra * f + innerHeight * 1.15) + 'px'); return extra; }
    let extra = size(); addEventListener('resize', () => { extra = size(); upd(); });
    function upd() {
      const r = story.getBoundingClientRect(), total = story.offsetHeight - innerHeight, p = clamp(-r.top / total, 0, 1);
      track.style.transform = `translateX(${-p * extra}px)`; bar.style.setProperty('--sp', (p * 100) + '%');
      const cx = innerWidth / 2;
      const pinned = r.top <= 2 && r.bottom >= innerHeight - 2; story.classList.toggle('go', pinned && p < .035);
      let ci = 0, cd = 1e9;
      lms.forEach((m, i) => {
        const b = m.getBoundingClientRect(), mid = b.left + b.width / 2, onScreen = b.right > -50 && b.left < innerWidth + 50;
        if (Math.abs(mid - cx) < cd) { cd = Math.abs(mid - cx); ci = i; }
        m.classList.toggle('vis', onScreen);
        const near = Math.abs(mid - cx) < Math.max(b.width * .55, innerWidth * .16);
        const want = manual.has(i) ? manual.get(i) : near;
        if (m.classList.contains('open') !== want) { m.classList.toggle('open', want); $('.lm-door', m).setAttribute('aria-expanded', want); }
        if (!near && manual.has(i) && Math.abs(mid - cx) > innerWidth * .6) manual.delete(i);
      });
      if (nEl) { const t = String(ci + 1).padStart(2, '0'); if (nEl.textContent !== t) { nEl.textContent = t; nEl.classList.remove('tick'); void nEl.offsetWidth; nEl.classList.add('tick'); } }
    }
    addEventListener('scroll', upd, { passive: true }); upd();
    lms.forEach((m, i) => $('.lm-door', m).addEventListener('click', () => { manual.set(i, !m.classList.contains('open')); upd(); }));
  } else if (story) {
    $$('.lm', story).forEach(m => m.classList.add('vis', 'open'));
    // ohne Animationen ist die Waschstraße eine normale Querleiste – auch die braucht einen klaren Hinweis
    const tr = $('[data-storytrack]', story), h = nudge($('[data-storypin]', story), TOUCH ? 'wischen' : 'seitlich scrollen', { kind: 'drag', on: [tr], delay: 300, cls: 'nd-story' });
    if (tr) tr.addEventListener('scroll', () => h.kill(), { passive: true, once: true });
  }

  /* ================= Heißmangel ================= */
  const mg = $('[data-mangle]');
  if (mg) {
    const cv = $('[data-mgcv]'), x = cv.getContext('2d'), rng = $('[data-mgr]'), roll = $('[data-mgroll]'), temp = $('[data-mgtemp]'), pkg = $('[data-pkg]'), tag = $('[data-pktag]'), nameIn = $('[data-pkname]');
    const W = 900, Hh = innerWidth < 640 ? 640 : 420; cv.width = W; cv.height = Hh;
    const SW = Math.round(W * .44), SH = Math.round(Hh * .78), RX = W * .5;
    // Laken glatt
    const smooth = document.createElement('canvas'); smooth.width = SW; smooth.height = SH; const s = smooth.getContext('2d');
    s.fillStyle = '#fbfcff'; s.fillRect(0, 0, SW, SH); s.fillStyle = '#d4e3ff'; for (let i = 0; i < SH; i += 24) s.fillRect(0, i, SW, 3); s.fillStyle = '#1546a8'; s.fillRect(0, 10, SW, 6); s.fillRect(0, SH - 16, SW, 6);
    s.strokeStyle = 'rgba(21,70,168,.12)'; s.lineWidth = 1; s.beginPath(); s.moveTo(SW / 2, 0); s.lineTo(SW / 2, SH); s.moveTo(0, SH / 2); s.lineTo(SW, SH / 2); s.stroke();
    // Laken zerknittert: Höhenfeld aus vielen scharfen Knitterfalten (Grate mit Auslauf), daraus Licht + leichte Verzerrung
    let wr = null;
    function wrinkled() {
      if (wr) return wr;
      wr = document.createElement('canvas'); wr.width = SW; wr.height = SH; const w = wr.getContext('2d');
      const src = s.getImageData(0, 0, SW, SH), dst = w.createImageData(SW, SH);
      const cr = []; for (let i = 0; i < 46; i++) { const th = (Math.random() - .5) * 1.6 + (Math.random() < .35 ? Math.PI / 2 : 0); cr.push({ x: Math.random() * SW, y: Math.random() * SH, c: Math.cos(th), s: Math.sin(th), a: (Math.random() < .5 ? -1 : 1) * (.5 + Math.random()), w: 3 + Math.random() * 12, L: 30 + Math.random() * 120 }); }
      const PW = SW + 1, hf = new Float32Array(PW * (SH + 1));
      for (let yy = 0; yy <= SH; yy++) for (let xx = 0; xx <= SW; xx++) { let h = 0; for (const q of cr) { const dx = xx - q.x, dy = yy - q.y, t = dx * q.c + dy * q.s; if (t > q.L * 2.2 || t < -q.L * 2.2) continue; const d = -dx * q.s + dy * q.c; if (d > q.w * 6 || d < -q.w * 6) continue; h += q.a * Math.exp(-Math.sqrt(d * d + 1) / q.w - (t * t) / (q.L * q.L)); } hf[yy * PW + xx] = h; }
      for (let yy = 0; yy < SH; yy++) for (let xx = 0; xx < SW; xx++) {
        const h = hf[yy * PW + xx], hx = hf[yy * PW + xx + 1] - h, hy = hf[(yy + 1) * PW + xx] - h;
        const sx = clamp(Math.round(xx - hx * 9), 0, SW - 1), sy = clamp(Math.round(yy - hy * 9 + h * 2), 0, SH - 1);
        const si = (sy * SW + sx) * 4, di = (yy * SW + xx) * 4, light = clamp(1 + (hx * -.7 + hy * -1) * 1.9 - Math.abs(h) * .025, .6, 1.1);
        dst.data[di] = src.data[si] * light; dst.data[di + 1] = src.data[si + 1] * light; dst.data[di + 2] = src.data[si + 2] * light; dst.data[di + 3] = 255;
      }
      w.putImageData(dst, 0, 0); return wr;
    }
    let p = 0, steam = [], fold = 0, folding = false, heat = 0;
    function draw() {
      x.clearRect(0, 0, W, Hh);
      // Tisch
      const tg = x.createLinearGradient(0, 0, 0, Hh); tg.addColorStop(0, '#e9eef5'); tg.addColorStop(1, '#cdd6e2'); x.fillStyle = tg; x.fillRect(0, 0, W, Hh);
      x.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < W; i += 40) x.fillRect(i, 0, 1, Hh);
      const top = (Hh - SH) / 2, left = RX - SW + p * SW; // linke Kante des Lakens
      if (!folding) {
        // vor der Walze: zerknittert
        const cut = clamp(RX - left, 0, SW);
        if (cut > 0) { x.save(); x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 14; x.drawImage(wrinkled(), 0, 0, cut, SH, left, top, cut, SH); x.restore(); }
        // hinter der Walze: glatt
        if (cut < SW) { x.save(); x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 8; x.drawImage(smooth, cut, 0, SW - cut, SH, RX, top, SW - cut, SH); x.restore(); }
      } else {
        // Falten: Laken klappt zweimal
        const f = ease(clamp(fold, 0, 1)), cw = SW * (1 - .5 * f), chh = SH * (1 - .5 * clamp(fold - 1, 0, 1));
        x.save(); x.shadowColor = 'rgba(0,0,0,.25)'; x.shadowBlur = 14; x.drawImage(smooth, RX + 20, top + (SH - chh), cw, chh); x.restore();
      }
      // Dampf
      steam = steam.filter(q => (q.a -= .012) > 0);
      for (const q of steam) { q.x += q.vx; q.y += q.vy; q.r += .6; const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r); g.addColorStop(0, `rgba(255,255,255,${q.a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 6.28); x.fill(); }
    }
    let raf;
    const stEl = $('[data-mgst]'), lamp = $('[data-mglamp]'); let stTxt = '';
    const setSt = t => { if (stEl && t !== stTxt) { stTxt = t; stEl.textContent = t; } };
    const status = () => { setSt(!pkg.hidden ? 'Fertig – in Papier eingeschlagen ✓' : folding ? 'Wird gefaltet …' : p <= .001 ? 'Bereit – Laken einziehen' : p >= 1 ? 'Glatt – wird gefaltet …' : 'Mangelt – weiterziehen →'); if (lamp) lamp.classList.toggle('on', heat > .45); };
    function loop() { draw(); heat = lerp(heat, p > 0 && p < 1 ? 1 : .2, .05); roll.style.setProperty('--heat', (heat * .7).toFixed(2)); temp.textContent = Math.round(lerp(20, 180, heat)); if (folding) { fold += .02; if (fold >= 2) { folding = false; showPkg(); } } status(); if (steam.length || folding || heat > .22) raf = requestAnimationFrame(loop); else raf = 0; }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    let lastP = 0;
    function setP(v) {
      const np = clamp(v, 0, 1), d = np - p; p = np;
      roll.style.backgroundPosition = `0 ${p * 1400}px`; $('i', roll.parentElement) && ($('i', roll.parentElement).style.backgroundPosition = `0 ${p * 1400}px, 0 0`);
      if (Math.abs(d) > .001) for (let i = 0; i < 2; i++) steam.push({ x: RX + 30 + Math.random() * 20, y: (Hh - SH) / 2 + Math.random() * SH, vx: 1 + Math.random() * 1.5, vy: -1 - Math.random(), r: 8 + Math.random() * 10, a: .5 });
      rng.value = p * 100; kick();
      if (p >= 1 && !folding && pkg.hidden) { folding = true; fold = 0; kick(); }
    }
    let user = false; // sobald der Besucher selbst zieht, hört der Vorführ-Impuls sofort auf
    rng.addEventListener('input', () => { user = true; setP(rng.value / 100); });
    let dr = null;
    cv.addEventListener('pointerdown', e => { user = true; dr = { x: e.clientX, p }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!dr) return; const r = cv.getBoundingClientRect(); setP(dr.p + (e.clientX - dr.x) / (r.width * .44)); });
    const drEnd = () => dr = null; cv.addEventListener('pointerup', drEnd); cv.addEventListener('pointercancel', drEnd); cv.addEventListener('lostpointercapture', drEnd);
    cv.style.touchAction = 'pan-y'; cv.style.cursor = 'ew-resize';
    const mgHint = nudge($('.mg-machine', mg), 'Laken ziehen', { kind: 'drag', on: [cv, rng], delay: 1000, cls: 'nd-mangel' });
    function showPkg() { if (typeof mgHint !== 'undefined') mgHint.kill(); tag.textContent = (nameIn.value || '').trim() || 'Sie'; pkg.hidden = false; toast('Gemangelt, gefaltet, in Papier eingeschlagen – wie an der Theke.'); }
    // der Name auf dem Paket wandert – solange dort nichts Eigenes steht – auch auf den Wäschezettel
    const tkName = $('[data-tkname]');
    nameIn.addEventListener('input', () => { const v = nameIn.value.trim(); tag.textContent = v || 'Sie'; if (tkName && (!tkName.value || tkName._auto)) { tkName.value = v; tkName._auto = !!v; } });
    if (tkName) tkName.addEventListener('input', () => { tkName._auto = false; });
    $('[data-mgagain]').addEventListener('click', () => { pkg.hidden = true; folding = false; fold = 0; p = 0; rng.value = 0; draw(); status(); rng.focus({ preventScroll: true }); });
    // Laken erst berechnen, wenn die Mangel in die Nähe kommt (spart Rechenzeit beim Laden)
    inView(mg, v => { if (v && !wr) draw(); }, '400px');
    // Anstoß beim ersten Sichtkontakt
    let shown = false; inView(mg, v => { if (v && !shown && !RM) { shown = true; let k = 0; const auto = () => { if (user || folding || !pkg.hidden) return; k += .012; setP(k * .22); if (k < 1) requestAnimationFrame(auto); }; requestAnimationFrame(auto); } }, '-20% 0px');
  }

  /* ================= Lamellen ================= */
  const bl = $('[data-blinds]');
  if (bl) {
    const sled = $('[data-sled]'), slats = $$('[data-blset] i'), cnt = $('[data-blcount]'), doneEl = $('[data-bldone]'), fx = $('[data-blfx]'), fc = fx.getContext('2d');
    let pos = 0, drag = null, sp = [], auto = 0;
    const rsF = () => { fx.width = bl.clientWidth; fx.height = bl.clientHeight; }; rsF(); addEventListener('resize', () => { rsF(); setPos(pos); });
    function setPos(px) {
      const max = bl.clientWidth - sled.offsetWidth; pos = clamp(px, 0, max); sled.style.transform = `translateX(${pos}px)`;
      const sr = sled.getBoundingClientRect(), br = bl.getBoundingClientRect(); let n = 0;
      // am rechten Anschlag zählt die ganze Schlittenbreite – sonst bleibt auf schmalen Bildschirmen die letzte Lamelle schmutzig
      const edge = pos >= max - 2 ? sr.right : sr.left + sr.width / 2;
      slats.forEach(s => { const r = s.getBoundingClientRect(); if (r.left + r.width / 2 < edge) { if (!s.classList.contains('clean')) { s.classList.add('clean'); for (let i = 0; i < 14; i++) sp.push({ x: r.left - br.left + r.width / 2, y: 30 + Math.random() * (br.height - 60), vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, a: 1, s: 1 + Math.random() * 3 }); } } if (s.classList.contains('clean')) n++; });
      cnt.textContent = n; doneEl.hidden = n < slats.length; sled.setAttribute('aria-valuenow', n);
      if (n === slats.length && !bl._t) { bl._t = 1; toast('Alle 14 Lamellen sauber – Lamelle für Lamelle, wie in Marks Maschine.'); }
      kick();
    }
    let raf;
    const loop = () => { fc.clearRect(0, 0, fx.width, fx.height); sp = sp.filter(q => (q.a -= .02) > 0); for (const q of sp) { q.x += q.vx; q.y += q.vy; fc.fillStyle = `rgba(255,255,255,${q.a})`; fc.beginPath(); fc.moveTo(q.x, q.y - q.s * 2); fc.lineTo(q.x + q.s * .6, q.y); fc.lineTo(q.x, q.y + q.s * 2); fc.lineTo(q.x - q.s * .6, q.y); fc.fill(); } if (sp.length) raf = requestAnimationFrame(loop); else raf = 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    let user = false; // eigener Zug des Besuchers stoppt den Vorführ-Zug sofort
    sled.addEventListener('pointerdown', e => { user = true; drag = { x: e.clientX, p: pos }; sled.setPointerCapture(e.pointerId); });
    sled.addEventListener('pointermove', e => { if (drag) setPos(drag.p + e.clientX - drag.x); });
    sled.addEventListener('pointerup', () => drag = null); sled.addEventListener('pointercancel', () => drag = null); sled.addEventListener('lostpointercapture', () => drag = null);
    sled.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { user = true; setPos(pos + 30); e.preventDefault(); } if (e.key === 'ArrowLeft') { user = true; setPos(pos - 30); e.preventDefault(); } });
    nudge(sled, 'Schlitten ziehen', { kind: 'drag', on: [sled], delay: 1100, cls: 'nd-sled' });
    // kleiner Vorführ-Zug beim ersten Anblick (läuft nur vorwärts und nie gegen den Besucher)
    let once = false; inView(bl, v => { if (v && !once && !RM) { once = true; let t = 0; const a = () => { if (user || drag) return; t += .02; const want = ease(Math.min(t, 1)) * bl.clientWidth * .18; if (want > pos) setPos(want); if (t < 1) requestAnimationFrame(a); }; setTimeout(() => requestAnimationFrame(a), 400); } }, '-25% 0px');
  }

  /* ================= Kleiderstange ================= */
  const rail = $('[data-rail]');
  const picked = new Set();
  let tkProg = () => {};
  // Anhänger, Zähler und Zettel immer im selben Zustand halten (auch wenn auf dem Zettel ein Haken entfernt wird)
  function syncTags() {
    $$('.hg-tag').forEach(t => { const on = picked.has(t.dataset.pick); t.classList.toggle('picked', on); t.setAttribute('aria-pressed', on); const em = $('em', t); if (em) em.textContent = on ? '✓ Auf dem Zettel' : '+ Auf den Zettel'; });
    const pn = $('[data-picked]'); if (pn) pn.textContent = picked.size; tkProg();
  }
  function unpickSvc(v) { const cb = $(`.tk input[name="Leistung"][value="${v}"]`); if (cb) cb.checked = false; picked.delete(v); syncTags(); toast('„' + v + '“ wurde vom Wäschezettel genommen.'); }
  function pickSvc(v, fromEl) {
    const vals = v.split(','); vals.forEach(val => { const cb = $(`.tk input[name="Leistung"][value="${val}"]`); if (cb) cb.checked = true; picked.add(val); });
    syncTags();
    if (fromEl) { const r = fromEl.getBoundingClientRect(), f = document.createElement('span'); f.className = 'fly'; f.textContent = '+ ' + vals.join(', '); f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; document.body.appendChild(f); const dock = $('[data-dock] a.on') && innerWidth < 640 ? $('[data-dock] a.on') : $('#zettel'); const tr2 = dock.getBoundingClientRect(); requestAnimationFrame(() => { f.style.transform = `translate(${(innerWidth < 640 ? tr2.left + tr2.width / 2 : innerWidth / 2) - r.left}px,${(innerWidth < 640 ? tr2.top : Math.min(innerHeight - 40, tr2.top)) - r.top}px) scale(.6)`; f.style.opacity = '0'; }); setTimeout(() => f.remove(), 850); }
  }
  if (rail) {
    // alle Bügel stehen ruhig nebeneinander; beim ersten Anblick gleiten sie einmal sanft herein
    if (!RM) { rail.classList.add('pre'); inView(rail, v => { if (v) rail.classList.add('in'); }, '-10% 0px'); }
    $$('.hg-tag', rail).forEach(t => t.addEventListener('click', () => { if (picked.has(t.dataset.pick)) unpickSvc(t.dataset.pick); else pickSvc(t.dataset.pick, t); }));
  }
  $$('[data-pick]').forEach(a => { if (a.classList.contains('hg-tag')) return; a.addEventListener('click', () => { pickSvc(a.dataset.pick); toast('✓ ' + a.dataset.pick.split(',').join(' & ') + ' steht auf Ihrem Wäschezettel.'); }); });

  /* ================= Wäschezettel ================= */
  const tk = $('[data-tk]');
  if (tk) {
    $$('input[name="Kunde"]', tk).forEach(r => r.addEventListener('change', () => tk.classList.toggle('biz', $('input[name="Kunde"]:checked', tk).value !== 'Privat')));
    $$('input[name="Leistung"]', tk).forEach(cb => cb.addEventListener('change', () => { if (cb.checked) picked.add(cb.value); else picked.delete(cb.value); syncTags(); }));
    // „So geht's“: Schritte haken sich mit dem Zettel ab
    const steps = $$('[data-tksteps] li');
    tkProg = () => {
      if (!steps.length) return;
      const sent = tk.classList.contains('sent'), any = !!$('input[name="Leistung"]:checked', tk);
      const done = [any || sent, sent, false], cur = sent ? 2 : any ? 1 : 0;
      steps.forEach((li, i) => { li.classList.toggle('done', done[i]); li.classList.toggle('cur', i === cur); });
    };
    tk.addEventListener('change', tkProg); tkProg();
    // Abgeben per WhatsApp: sauberen Nachrichtentext bauen und WhatsApp öffnen (kein Formulardienst, kein Server)
    const nameIn = $('[data-tkname]'), err = $('[data-tkerr]'), ok = $('[data-tkok]'), waLink = $('[data-tkwa]');
    const val = n => { const el = tk.elements[n]; return el && el.value ? el.value.trim() : ''; };
    function waText() {
      const svc = $$('input[name="Leistung"]:checked', tk).map(c => c.value), biz = $('input[name="Kunde"]:checked', tk).value !== 'Privat';
      const L = ['*Wäschezettel* – Wäscherei Kleber', ''];
      L.push('*Was dürfen wir tun?*'); if (svc.length) svc.forEach(v => L.push('• ' + v)); else L.push('(noch nichts angekreuzt)');
      L.push('', '*Für:* ' + (biz ? 'Praxis / Firma' : 'Privat'), '*Name:* ' + val('Name'));
      const add = (k, n) => { const v = val(n); if (v) L.push(`*${k}:* ${v}`); };
      add('Telefon', 'Telefon'); if (biz) add('Firma / Praxis', 'Firma'); add('Abholadresse', 'Abholadresse');
      const msg = val('Nachricht'); if (msg) L.push('', '*Nachricht:*', msg);
      return L.join('\n');
    }
    const openWA = url => {
      // Handy: WhatsApp-App direkt (gleiches Fenster), PC: WhatsApp Web in neuem Tab – wenn blockiert, gleiches Fenster
      if (TOUCH) { location.href = url; return; }
      let w = null; try { w = window.open(url, '_blank', 'noopener'); } catch (e) {} if (!w) location.href = url;
    };
    if (nameIn) nameIn.addEventListener('input', () => { if (nameIn.value.trim()) { err.hidden = true; nameIn.removeAttribute('aria-invalid'); } });
    tk.addEventListener('submit', e => {
      e.preventDefault();
      if (!val('Name')) { err.hidden = false; nameIn.setAttribute('aria-invalid', 'true'); nameIn.focus(); return; }
      err.hidden = true;
      const url = `https://wa.me/${tk.dataset.wa}?text=${encodeURIComponent(waText())}`;
      if (okWA !== null) ok.innerHTML = okWA;
      const wl = $('[data-tkwa]', ok); if (wl) wl.href = url;
      $('[data-stampdate]').textContent = new Date().toLocaleDateString('de-DE'); tk.classList.add('sent'); ok.hidden = false; tkProg();
      const btn = $('[data-tksend] span', tk); if (btn) btn.textContent = 'Nochmal per WhatsApp abgeben';
      openWA(url);
    });
    // Alternative: per E-Mail (Peter 29.10.) – öffnet das eigene Mailprogramm mit demselben Text, ohne WhatsApp-Sternchen
    const okWA = ok ? ok.innerHTML : null;
    const mailBtn = $('[data-tkmail]', tk);
    if (mailBtn) mailBtn.addEventListener('click', () => {
      if (!val('Name')) { err.hidden = false; nameIn.setAttribute('aria-invalid', 'true'); nameIn.focus(); return; }
      err.hidden = true;
      const body = waText().replace(/\*/g, '');
      const url = `mailto:${tk.dataset.mail}?subject=${encodeURIComponent('Wäschezettel – ' + val('Name'))}&body=${encodeURIComponent(body)}`;
      $('[data-stampdate]').textContent = new Date().toLocaleDateString('de-DE'); tk.classList.add('sent'); ok.hidden = false; tkProg();
      ok.innerHTML = `<b>Danke!</b> Ihr E-Mail-Programm ist geöffnet – bitte dort nur noch auf Senden tippen. Hat sich nichts geöffnet? Schreiben Sie direkt an <a href="mailto:${tk.dataset.mail}">${tk.dataset.mail}</a>`;
      location.href = url;
    });
  }

  /* ================= Früher / Heute ================= */
  const ba = $('[data-ba]');
  if (ba) {
    const r = $('[data-bar]'); let user = false;
    r.addEventListener('input', () => { user = true; ba.style.setProperty('--p', r.value + '%'); });
    r.addEventListener('pointerdown', () => { user = true; });
    nudge(ba, 'ziehen', { kind: 'drag', on: [r], delay: 1200, cls: 'nd-ba' });
    let once = false; inView(ba, v => { if (v && !once && !RM) { once = true; let t = 0; const a = () => { if (user) return; t += .012; const k = Math.sin(t * Math.PI * 2) * 26; ba.style.setProperty('--p', (50 + k) + '%'); r.value = 50 + k; if (t < 1) requestAnimationFrame(a); else { ba.style.setProperty('--p', '50%'); r.value = 50; } }; requestAnimationFrame(a); } }, '-20% 0px');
  }

  /* ================= Dock ================= */
  const dock = $('[data-dock]'), dz = $('.dk-z'); if (dock && dz) { const z = $('#zettel'); inView(z, v => dz.classList.toggle('on', !v), '0px'); }
})();
