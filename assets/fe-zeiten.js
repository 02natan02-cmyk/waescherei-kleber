/* Falcon Eye · Öffnungszeiten aus dem Google-Profil (fe-zeiten.js)
   Lädt /daten/oeffnungszeiten.json (nachts von der GitHub-Aktion aus Google geholt) und meldet sie per Ereignis:
   document.addEventListener('fe-zeiten', e => { e.detail.aktuell  // 7 Tage Mo..So, je [[von,bis],…] oder [] = geschlossen
                                                 e.detail.zeile(i) // „9–17 Uhr“ / „geschlossen“
                                                 e.detail.gruppen()// [{tage:'Mo & Do', zeit:'10–17 Uhr'}, …]
                                                 e.detail.hinweise // ['Geschlossen von Montag, 9.11. bis Mittwoch, 11.11.', …] });
   Hinweis-Banner bei Urlaub, Feiertag, geänderten Zeiten oder „vorübergehend geschlossen“: erscheint automatisch
   in einem Element mit [data-zeiten-hinweis] (z. B. in der Öffnungszeiten-Karte), sonst als kleiner Banner unten.
   Farben per CSS: --fezh-bg, --fezh-fg, --fezh-rand. data-banner="aus" am Skript = Seite zeigt es selbst.
   Fehlt die Datei oder ist sie kaputt, passiert nichts – die Seite zeigt ihre eingebauten Zeiten.
   „aktuell“ berücksichtigt Feiertage und Sonderzeiten der nächsten 7 Tage (Berliner Zeit). */
(function () {
  var s = document.currentScript, url = (s && s.dataset.src) || '/daten/oeffnungszeiten.json';
  var DS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  function hu(t) { var p = t.split(':'); return +p[1] ? (+p[0]) + ':' + p[1] : String(+p[0]); }
  function fertig(j) {
    if (!j || !Array.isArray(j.woche) || j.woche.length !== 7) return;
    var eff = j.woche.map(function (x) { return (x || []).slice(); }), jetzt = Date.now();
    for (var i = 0; i < 7; i++) {
      var iso = new Date(jetzt + i * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
      var wd = (new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7;
      if (j.tage && Object.prototype.hasOwnProperty.call(j.tage, iso)) eff[wd] = j.tage[iso];
    }
    j.aktuell = eff;
    j.zeile = function (i) { var z = eff[i]; return z && z.length ? z.map(function (a) { return hu(a[0]) + '–' + hu(a[1]); }).join(', ') + ' Uhr' : 'geschlossen'; };
    j.gruppen = function () {
      var g = [];
      for (var i = 0; i < 7; i++) { var t = j.zeile(i), f = g.find(function (x) { return x.zeit === t; }); if (f) f.idx.push(i); else g.push({ zeit: t, idx: [i] }); }
      return g.map(function (x) {
        var r = [], a = x.idx;
        for (var k = 0; k < a.length; k++) { var st = k; while (k + 1 < a.length && a[k + 1] === a[k] + 1) k++; r.push(k - st >= 2 ? DS[a[st]] + '–' + DS[a[k]] : a.slice(st, k + 1).map(function (n) { return DS[n]; }).join(' & ')); }
        return { tage: r.length > 1 ? r.slice(0, -1).join(', ') + ' & ' + r[r.length - 1] : r[0], zeit: x.zeit };
      });
    };
    // Abweichungen der nächsten 7 Tage (Urlaub, Feiertag, geänderte Zeiten) und „vorübergehend geschlossen“
    var WT = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    var txt = function (z) { return z && z.length ? z.map(function (a) { return hu(a[0]) + '–' + hu(a[1]); }).join(', ') + ' Uhr' : 'geschlossen'; };
    var dif = [];
    for (var k = 0; k < 7; k++) {
      var iso2 = new Date(jetzt + k * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
      if (!j.tage || !Object.prototype.hasOwnProperty.call(j.tage, iso2)) continue;
      var w2 = (new Date(iso2 + 'T12:00:00Z').getUTCDay() + 6) % 7;
      if (JSON.stringify(j.tage[iso2]) !== JSON.stringify(j.woche[w2] || [])) dif.push({ k: k, iso: iso2, wd: w2, zu: !j.tage[iso2].length, zeit: txt(j.tage[iso2]) });
    }
    var tag = function (d) { var p = d.iso.split('-'); return (d.k === 0 ? 'heute' : d.k === 1 ? 'morgen' : WT[d.wd]) + ', ' + (+p[2]) + '.' + (+p[1]) + '.'; };
    var hin = [];
    if (j.status === 'CLOSED_TEMPORARILY') hin.push('Wir sind vorübergehend geschlossen.');
    else for (var m = 0; m < dif.length; m++) {
      var st = m; while (dif[st].zu && m + 1 < dif.length && dif[m + 1].zu && dif[m + 1].k === dif[m].k + 1) m++;
      if (dif[st].zu && m > st) hin.push('Geschlossen von ' + tag(dif[st]) + ' bis ' + tag(dif[m]) + '.');
      else hin.push((dif[st].zu ? 'Geschlossen ' : 'Geänderte Zeiten ') + tag(dif[st]) + (dif[st].zu ? '.' : ': ' + dif[st].zeit + '.'));
    }
    if (hin.length && dif.length && dif[dif.length - 1].zu && dif[dif.length - 1].k === 6) hin.push('Die genauen Zeiten danach stehen in unserem Google-Profil.');
    hin = hin.map(function (t) { return t.replace(/\.\.$/, '.'); });
    j.hinweise = hin;
    var modus = s && s.dataset.banner;  // "aus" = Seite zeigt es selbst (Ereignis), sonst Banner
    if (hin.length && modus !== 'aus') {
      var ort = document.querySelector('[data-zeiten-hinweis]');
      var el = document.createElement('div'); el.className = 'fe-zh' + (ort ? '' : ' fe-zh-fest'); el.setAttribute('role', 'status');
      el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm-2 7h14v10H5V9zm4.6 1.8L8.2 12.2 10.8 15 8.2 17.8l1.4 1.4L12.2 16l2.6 2.8 1.4-1.4L13.6 15l2.6-2.8-1.4-1.4-2.6 2.8-2.6-2.8z"/></svg><span><b>Bitte beachten</b> ' + hin.join(' ') + '</span>' + (ort ? '' : '<button type="button" aria-label="Hinweis schließen">×</button>');
      var css = document.createElement('style');
      css.textContent = '.fe-zh{display:flex;gap:.6em;align-items:flex-start;padding:.75em 1em;border-radius:12px;background:var(--fezh-bg,#fff4d6);color:var(--fezh-fg,#3b2a00);border:1px solid var(--fezh-rand,#f0c955);font:inherit;font-size:.95em;line-height:1.4;margin:.6em 0;box-shadow:0 6px 20px rgba(0,0,0,.12)}.fe-zh svg{flex:0 0 1.3em;width:1.3em;height:1.3em;fill:currentColor;margin-top:.1em}.fe-zh b{display:block}.fe-zh-fest{position:fixed;z-index:9999;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:max(84px,calc(env(safe-area-inset-bottom) + 84px));max-width:560px;margin:0 auto;animation:fezh .5s ease both}.fe-zh button{margin-left:auto;background:none;border:0;font-size:1.4em;line-height:1;color:inherit;cursor:pointer;min-width:44px;min-height:44px;margin:-.5em -.6em -.5em auto}@keyframes fezh{from{transform:translateY(30px);opacity:0}}@media (prefers-reduced-motion:reduce){.fe-zh-fest{animation:none}}';
      document.head.appendChild(css);
      if (ort) ort.appendChild(el); else { document.body.appendChild(el); el.querySelector('button').onclick = function () { el.remove(); }; }
    }
    window.FEZeiten = j;
    document.dispatchEvent(new CustomEvent('fe-zeiten', { detail: j }));
  }
  try { fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(fertig).catch(function () {}); } catch (e) {}
})();
