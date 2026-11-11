/* Terminverwaltung */

'use strict';


document.addEventListener('DOMContentLoaded', () => {
  const logoBereich  = document.getElementById('logo-bereich');
  const logoDropdown = document.getElementById('logo-dropdown');

  if (logoBereich && logoDropdown) {
    logoBereich.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const offen = logoDropdown.classList.toggle('offen');
      logoBereich.setAttribute('aria-expanded', offen);
    });

    logoBereich.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const offen = logoDropdown.classList.toggle('offen');
        logoBereich.setAttribute('aria-expanded', offen);
      }
      if (e.key === 'Escape') {
        logoDropdown.classList.remove('offen');
        logoBereich.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', (e) => {
      if (!logoBereich.contains(e.target)) {
        logoDropdown.classList.remove('offen');
        logoBereich.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const heute = datumFormatieren(new Date());
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    if (!inp.value) inp.min = heute;
  });

  const seite = window.location.pathname.split('/').pop() || 'index.html';
  if (seite === 'index.html' || seite === '') initStartseite();
  if (seite === 'termin.html')  initTerminseite();
  if (seite === 'admin.html')   initAdmin();
  if (seite === 'kontakt.html') initKontakt();
});


function datumFormatieren(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const t = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${t}`;
}

function datumAnzeigen(iso) {
  if (!iso) return '–';
  const [y, m, t] = iso.split('-');
  return `${t}.${m}.${y}`;
}

function wochentag(iso) {
  return ['So','Mo','Di','Mi','Do','Fr'][new Date(iso).getDay()];
}

function monatName(nr) {
  return ['Januar','Februar','März','April','Mai','Juni',
          'Juli','August','September','Oktober','November','Dezember'][nr];
}

function eindeutigeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getTermine() {
  try { return JSON.parse(localStorage.getItem('tc_termine') || '[]'); }
  catch { return []; }
}

function setTermine(arr) {
  localStorage.setItem('tc_termine', JSON.stringify(arr));
}

function istDoppelbuchung(datum, uhrzeit) {
  return getTermine().some(t =>
    t.datum === datum && t.uhrzeit === uhrzeit && t.status !== 'abgesagt'
  );
}

function initStartseite() {
}


let aktiverSchritt = 1;

function initTerminseite() {
  const params  = new URLSearchParams(window.location.search);
  const tierVor = params.get('tier');
  if (tierVor) {
    const name   = tierVor.charAt(0).toUpperCase() + tierVor.slice(1);
    const option = document.querySelector(`[data-wert="${name}"]`);
    if (option) {
      option.classList.add('ausgewaehlt');
      option.setAttribute('aria-checked', 'true');
      const h = document.getElementById('tierart');
      if (h) h.value = name;
    }
  }

  document.querySelectorAll('#tierart-auswahl .tier-option').forEach(opt => {
    opt.addEventListener('click', () => tierOptionWaehlen(opt));
    opt.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tierOptionWaehlen(opt); }
    });
  });

  document.querySelectorAll('#zeitslot-grid .zeitslot:not(.belegt)').forEach(slot => {
    slot.addEventListener('click', () => zeitslotWaehlen(slot));
  });

  document.querySelectorAll('input[name="kontakt-methode"]').forEach(r => {
    r.addEventListener('change', kontaktMethodeAktualisieren);
  });

  const heute = datumFormatieren(new Date());
  ['wunschdatum', 'alternativtermin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.min = heute;
  });
}

function tierOptionWaehlen(opt) {
  document.querySelectorAll('#tierart-auswahl .tier-option').forEach(o => {
    o.classList.remove('ausgewaehlt');
    o.setAttribute('aria-checked', 'false');
  });
  opt.classList.add('ausgewaehlt');
  opt.setAttribute('aria-checked', 'true');
  const h = document.getElementById('tierart');
  if (h) h.value = opt.dataset.wert;
  fehlerVerstecken('fehler-tierart');
}

function zeitslotWaehlen(slot) {
  document.querySelectorAll('#zeitslot-grid .zeitslot').forEach(s => s.classList.remove('ausgewaehlt'));
  slot.classList.add('ausgewaehlt');
  const h = document.getElementById('uhrzeit');
  if (h) h.value = slot.dataset.zeit;
  fehlerVerstecken('fehler-uhrzeit');
}

function kontaktMethodeAktualisieren() {
  const m   = document.querySelector('input[name="kontakt-methode"]:checked')?.value;
  const gE  = document.getElementById('gruppe-email');
  const gT  = document.getElementById('gruppe-telefon');
  if (!gE || !gT) return;
  gE.style.display = (m === 'email'   || m === 'beide') ? 'block' : 'none';
  gT.style.display = (m === 'telefon' || m === 'beide') ? 'block' : 'none';
}

function fehlerZeigen(id)     { document.getElementById(id)?.classList.add('sichtbar'); }
function fehlerVerstecken(id) { document.getElementById(id)?.classList.remove('sichtbar'); }

function feldFehler(fId, eId) {
  document.getElementById(fId)?.classList.add('fehler');
  fehlerZeigen(eId);
}
function feldOk(fId, eId) {
  document.getElementById(fId)?.classList.remove('fehler');
  fehlerVerstecken(eId);
}

function naechsterSchritt(von) {
  if (!schritValidieren(von)) return;
  schrittwechseln(von, von + 1);
}

function vorherigerSchritt(von) {
  schrittwechseln(von, von - 1);
}

function schrittwechseln(von, zu) {
  document.getElementById(`schritt-${von}`)?.classList.remove('aktiv');
  document.getElementById(`schritt-${zu}`)?.classList.add('aktiv');
  aktiverSchritt = zu;

  for (let i = 1; i <= 4; i++) {
    const lbl = document.getElementById(`schritt-label-${i}`);
    if (!lbl) continue;
    lbl.classList.remove('aktiv', 'erledigt');
    if (i < zu)      lbl.classList.add('erledigt');
    else if (i === zu) lbl.classList.add('aktiv');
  }

  document.getElementById('schritte-leiste')?.setAttribute('aria-valuenow', zu);
  if (zu === 4) zusammenfassungFuellen();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function schritValidieren(s) {
  let ok = true;

  if (s === 1) {
    const tierart = document.getElementById('tierart')?.value;
    if (!tierart) { fehlerZeigen('fehler-tierart'); ok = false; }
    else fehlerVerstecken('fehler-tierart');

    const tiername = document.getElementById('tiername')?.value?.trim();
    if (!tiername) { feldFehler('tiername', 'fehler-tiername'); ok = false; }
    else feldOk('tiername', 'fehler-tiername');

    const verh = document.querySelectorAll('input[name="verhalten"]:checked');
    if (!verh.length) { fehlerZeigen('fehler-verhalten'); ok = false; }
    else fehlerVerstecken('fehler-verhalten');

    const prob = document.getElementById('problematik')?.value?.trim();
    if (!prob) { feldFehler('problematik', 'fehler-problematik'); ok = false; }
    else feldOk('problematik', 'fehler-problematik');
  }

  if (s === 2) {
    const datum = document.getElementById('wunschdatum')?.value;
    if (!datum) { feldFehler('wunschdatum', 'fehler-datum'); ok = false; }
    else feldOk('wunschdatum', 'fehler-datum');

    const uhrzeit = document.getElementById('uhrzeit')?.value;
    if (!uhrzeit) { fehlerZeigen('fehler-uhrzeit'); ok = false; }
    else {
      fehlerVerstecken('fehler-uhrzeit');
      if (datum && istDoppelbuchung(datum, uhrzeit)) {
        const el = document.getElementById('fehler-uhrzeit');
        if (el) { el.textContent = ' Dieser Zeitslot ist bereits belegt.'; el.classList.add('sichtbar'); }
        ok = false;
      }
    }

    const str = document.getElementById('adresse-strasse')?.value?.trim();
    const ort = document.getElementById('adresse-ort')?.value?.trim();
    if (!str || !ort) { fehlerZeigen('fehler-adresse'); ok = false; }
    else fehlerVerstecken('fehler-adresse');
  }

  if (s === 3) {
    const vn = document.getElementById('vorname')?.value?.trim();
    if (!vn) { feldFehler('vorname', 'fehler-vorname'); ok = false; }
    else feldOk('vorname', 'fehler-vorname');

    const nn = document.getElementById('nachname')?.value?.trim();
    if (!nn) { feldFehler('nachname', 'fehler-nachname'); ok = false; }
    else feldOk('nachname', 'fehler-nachname');

    const m = document.querySelector('input[name="kontakt-methode"]:checked')?.value;
    if (!m) { fehlerZeigen('fehler-kontakt-methode'); ok = false; }
    else fehlerVerstecken('fehler-kontakt-methode');

    if (m === 'email' || m === 'beide') {
      const em = document.getElementById('email')?.value?.trim();
      if (!em || !em.includes('@')) { feldFehler('email', 'fehler-email'); ok = false; }
      else feldOk('email', 'fehler-email');
    }

    if (m === 'telefon' || m === 'beide') {
      const tel = document.getElementById('telefon')?.value?.trim();
      if (!tel) { feldFehler('telefon', 'fehler-telefon'); ok = false; }
      else feldOk('telefon', 'fehler-telefon');
    }

    const dsgvo = document.getElementById('dsgvo-zustimmung')?.checked;
    if (!dsgvo) { fehlerZeigen('fehler-dsgvo'); ok = false; }
    else fehlerVerstecken('fehler-dsgvo');
  }

  return ok;
}

function zusammenfassungFuellen() {
  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '–'; };

  s('zsf-tierart',    document.getElementById('tierart')?.value);
  s('zsf-tiername',   document.getElementById('tiername')?.value);
  s('zsf-rasse',      document.getElementById('tier-rasse')?.value);

  const alter   = document.getElementById('tier-alter')?.value;
  const groesse = document.getElementById('tier-groesse')?.value;
  s('zsf-alter', [alter, groesse].filter(Boolean).join(' / '));

  const verh = Array.from(document.querySelectorAll('input[name="verhalten"]:checked')).map(c => c.value).join(', ');
  s('zsf-verhalten',  verh);
  s('zsf-problematik', document.getElementById('problematik')?.value);

  const datum = document.getElementById('wunschdatum')?.value;
  s('zsf-datum',   datum ? `${wochentag(datum)}, ${datumAnzeigen(datum)}` : '');
  s('zsf-uhrzeit', document.getElementById('uhrzeit')?.value);

  const str = document.getElementById('adresse-strasse')?.value || '';
  const plz = document.getElementById('adresse-plz')?.value || '';
  const ort = document.getElementById('adresse-ort')?.value || '';
  s('zsf-adresse', [str, `${plz} ${ort}`.trim()].filter(Boolean).join(', '));

  s('zsf-name',    `${document.getElementById('vorname')?.value || ''} ${document.getElementById('nachname')?.value || ''}`.trim());
  s('zsf-email',   document.getElementById('email')?.value);
  s('zsf-telefon', document.getElementById('telefon')?.value);
}

function terminAbsenden() {
  const btn = document.getElementById('absenden-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Wird gespeichert ...'; }

  const verhalten = Array.from(document.querySelectorAll('input[name="verhalten"]:checked')).map(c => c.value);
  const str = document.getElementById('adresse-strasse')?.value || '';
  const plz = document.getElementById('adresse-plz')?.value || '';
  const ort = document.getElementById('adresse-ort')?.value || '';

  const t = {
    id:         eindeutigeId(),
    datum:      document.getElementById('wunschdatum')?.value || '',
    uhrzeit:    document.getElementById('uhrzeit')?.value || '',
    tierart:    document.getElementById('tierart')?.value || '',
    tiername:   document.getElementById('tiername')?.value || '',
    rasse:      document.getElementById('tier-rasse')?.value || '',
    alter:      document.getElementById('tier-alter')?.value || '',
    groesse:    document.getElementById('tier-groesse')?.value || '',
    verhalten:  verhalten.join(', '),
    problem:    document.getElementById('problematik')?.value || '',
    seitWann:   document.getElementById('seit-wann')?.value || '',
    tierarzt:   document.querySelector('input[name="tierarzt"]:checked')?.value || '',
    adresse:    `${str}, ${plz} ${ort}`.trim().replace(/^,\s*/, ''),
    anfahrt:    document.getElementById('anfahrt-hinweis')?.value || '',
    alternativ: document.getElementById('alternativtermin')?.value || '',
    vorname:    document.getElementById('vorname')?.value || '',
    nachname:   document.getElementById('nachname')?.value || '',
    email:      document.getElementById('email')?.value || '',
    telefon:    document.getElementById('telefon')?.value || '',
    erreichbar: document.getElementById('erreichbar')?.value || '',
    methode:    document.querySelector('input[name="kontakt-methode"]:checked')?.value || '',
    sonstiges:  document.getElementById('sonstiges')?.value || '',
    status:     'neu',
    erstellt:   new Date().toISOString(),
    notiz:      ''
  };

  if (istDoppelbuchung(t.datum, t.uhrzeit)) {
    alert(' Dieser Zeitslot ist bereits belegt. Bitte einen anderen wählen.');
    if (btn) { btn.disabled = false; btn.textContent = ' Termin anfragen'; }
    schrittwechseln(4, 2);
    return;
  }

  const alle = getTermine();
  alle.push(t);
  setTermine(alle);

  setTimeout(() => {
    document.querySelector('.formular-bereich').style.display = 'none';
    document.getElementById('erfolgs-meldung')?.classList.add('sichtbar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 400);
}


function initKontakt() {}

function kontaktAbsenden() {
  const name      = document.getElementById('k-name')?.value?.trim();
  const email     = document.getElementById('k-email')?.value?.trim();
  const betreff   = document.getElementById('k-betreff')?.value;
  const nachricht = document.getElementById('k-nachricht')?.value?.trim();
  const dsgvo     = document.getElementById('k-dsgvo')?.checked;

  if (!name || !email || !betreff || !nachricht || !dsgvo) {
    alert('Bitte alle Pflichtfelder ausfüllen und der Datenschutzerklärung zustimmen.');
    return;
  }
  if (!email.includes('@')) {
    alert('Bitte eine gültige E-Mail-Adresse eingeben.');
    return;
  }

  const nachrichten = JSON.parse(localStorage.getItem('tc_nachrichten') || '[]');
  nachrichten.push({
    id:      eindeutigeId(),
    datum:   new Date().toISOString(),
    name,   email,
    telefon: document.getElementById('k-telefon')?.value || '',
    betreff, nachricht,
    gelesen: false
  });
  localStorage.setItem('tc_nachrichten', JSON.stringify(nachrichten));

  document.getElementById('kontakt-formular').style.display = 'none';
  document.getElementById('kontakt-erfolg').style.display   = 'block';
}

/* ADMIN – LOGIN */

const ADMIN_PASSWORT = 'admin123';

function adminLogin() {
  const eingabe = document.getElementById('admin-passwort')?.value;
  const fehler  = document.getElementById('login-fehler');

  if (eingabe === ADMIN_PASSWORT) {
    sessionStorage.setItem('admin_eingeloggt', '1');
    document.getElementById('login-bereich').style.display = 'none';
    document.getElementById('admin-bereich').classList.add('sichtbar');
    adminInitialisieren();
    if (fehler) fehler.style.display = 'none';
  } else {
    if (fehler) fehler.style.display = 'block';
    const inp = document.getElementById('admin-passwort');
    if (inp) { inp.value = ''; inp.focus(); }
  }
}

function adminLogout() {
  sessionStorage.removeItem('admin_eingeloggt');
  document.getElementById('admin-bereich').classList.remove('sichtbar');
  document.getElementById('login-bereich').style.display = 'flex';
  const inp = document.getElementById('admin-passwort');
  if (inp) inp.value = '';
}

function initAdmin() {
  if (sessionStorage.getItem('admin_eingeloggt') === '1') {
    document.getElementById('login-bereich').style.display = 'none';
    document.getElementById('admin-bereich').classList.add('sichtbar');
    adminInitialisieren();
  }
  if (!getTermine().length) demoDatenLaden();
}

function adminInitialisieren() {
  kalenderInitialisieren();
  termineTabelleFuellen();
  statistikenAktualisieren();
  const nd = document.getElementById('neu-datum');
  if (nd) nd.value = datumFormatieren(new Date());
}

/* ADMIN – STATISTIKEN */

function statistikenAktualisieren() {
  const alle   = getTermine();
  const heute  = datumFormatieren(new Date());
  const jetzt  = new Date();
  const monat  = `${jetzt.getFullYear()}-${String(jetzt.getMonth()+1).padStart(2,'0')}`;

  const ws = new Date(jetzt);
  ws.setDate(jetzt.getDate() - ((jetzt.getDay() + 6) % 7));
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  const wsStr = datumFormatieren(ws);
  const weStr = datumFormatieren(we);

  const s = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  s('stat-heute',  alle.filter(t => t.datum === heute && t.status !== 'abgesagt').length);
  s('stat-woche',  alle.filter(t => t.datum >= wsStr && t.datum <= weStr && t.status !== 'abgesagt').length);
  s('stat-monat',  alle.filter(t => t.datum.startsWith(monat) && t.status !== 'abgesagt').length);
  s('stat-offen',  alle.filter(t => t.status === 'neu').length);
  s('stat-gesamt', alle.filter(t => t.status !== 'abgesagt').length);
}

/* ADMIN – KALENDER */

let kalenderDatum          = new Date();
let kalenderAnsichtAktuell = 'woche';

function kalenderInitialisieren() { kalenderRendern(); }

function kalenderAnsicht(a) {
  kalenderAnsichtAktuell = a;
  ['tag','woche','monat'].forEach(x => {
    document.getElementById(`btn-${x}`)?.classList.toggle('aktiv', x === a);
  });
  kalenderRendern();
}

function kalenderNavigieren(r) {
  if      (kalenderAnsichtAktuell === 'tag')   kalenderDatum.setDate(kalenderDatum.getDate() + r);
  else if (kalenderAnsichtAktuell === 'woche') kalenderDatum.setDate(kalenderDatum.getDate() + r * 7);
  else                                          kalenderDatum.setMonth(kalenderDatum.getMonth() + r);
  kalenderRendern();
}

function kalenderHeute() { kalenderDatum = new Date(); kalenderRendern(); }

function kalenderRendern() {
  if      (kalenderAnsichtAktuell === 'monat') kalenderMonat();
  else if (kalenderAnsichtAktuell === 'woche') kalenderWoche();
  else                                          kalenderTag();
}

function kalenderMonat() {
  const termine = getTermine();
  const jahr    = kalenderDatum.getFullYear();
  const monat   = kalenderDatum.getMonth();
  const heute   = datumFormatieren(new Date());

  document.getElementById('kalender-titel').textContent = `${monatName(monat)} ${jahr}`;

  const erster    = new Date(jahr, monat, 1).getDay();
  const versatz   = erster === 0 ? 6 : erster - 1;
  const tageCount = new Date(jahr, monat + 1, 0).getDate();

  let html = `<div class="kalender-grid-kopf">
    ${['Mo','Di','Mi','Do','Fr','Sa','So'].map(t => `<div class="kalender-tag-kopf">${t}</div>`).join('')}
  </div><div class="kalender-grid-body">`;

  for (let i = 0; i < versatz; i++) html += `<div class="kalender-zelle anderer-monat"></div>`;

  for (let tag = 1; tag <= tageCount; tag++) {
    const iso  = `${jahr}-${String(monat+1).padStart(2,'0')}-${String(tag).padStart(2,'0')}`;
    const tage = termine.filter(t => t.datum === iso && t.status !== 'abgesagt');
    html += `<div class="kalender-zelle${iso === heute ? ' heute' : ''}" onclick="kalenderTagWaehlen('${iso}')">`;
    html += `<div class="zelle-datum">${tag}</div>`;
    tage.slice(0, 3).forEach(t => {
      html += `<div class="kalender-termin" onclick="event.stopPropagation();terminDetail('${t.id}')">${t.uhrzeit} ${t.tiername} · ${t.vorname} ${t.nachname}</div>`;
    });
    if (tage.length > 3) html += `<div style="font-size:0.72rem;color:var(--text-hell);padding:2px 4px">+${tage.length - 3} weitere</div>`;
    html += `</div>`;
  }

  const rest = (versatz + tageCount) % 7;
  if (rest > 0) for (let i = 0; i < 7 - rest; i++) html += `<div class="kalender-zelle anderer-monat"></div>`;
  html += `</div>`;

  document.getElementById('kalender-container').innerHTML = html;
}

function kalenderWoche() {
  const termine = getTermine();
  const heute   = datumFormatieren(new Date());
  const mo      = new Date(kalenderDatum);
  mo.setDate(kalenderDatum.getDate() - ((kalenderDatum.getDay() + 6) % 7));

  const tage = Array.from({length:7}, (_, i) => { const d = new Date(mo); d.setDate(mo.getDate()+i); return d; });
  document.getElementById('kalender-titel').textContent =
    `${datumAnzeigen(datumFormatieren(tage[0]))} – ${datumAnzeigen(datumFormatieren(tage[6]))}`;

  const stunden  = ['08','09','10','11','12','13','14','15','16','17','18'];
  const tagNamen = ['Mo','Di','Mi','Do','Fr','Sa','So'];

  let html = `<div class="wochen-grid"><div class="wochen-kopf"></div>`;
  tage.forEach((d, i) => {
    const iso = datumFormatieren(d);
    html += `<div class="wochen-kopf${iso === heute ? ' heute-kopf' : ''}">${tagNamen[i]}<br>${d.getDate()}.${d.getMonth()+1}.</div>`;
  });

  stunden.forEach(st => {
    html += `<div class="zeit-label">${st}:00</div>`;
    tage.forEach(d => {
      const iso   = datumFormatieren(d);
      const slots = termine.filter(t => t.datum === iso && t.uhrzeit === `${st}:00` && t.status !== 'abgesagt');
      html += `<div class="wochen-zelle${iso === heute ? ' heute-spalte' : ''}" onclick="kalenderTagWaehlen('${iso}')">`;
      slots.forEach(t => {
        html += `<div class="wochen-termin" onclick="event.stopPropagation();terminDetail('${t.id}')">${t.tiername}<br><span style="font-weight:400;opacity:0.85">${t.vorname} ${t.nachname}</span></div>`;
      });
      html += `</div>`;
    });
  });
  html += `</div>`;
  document.getElementById('kalender-container').innerHTML = html;
}

function kalenderTag() {
  const termine  = getTermine();
  const iso      = datumFormatieren(kalenderDatum);
  const wd       = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const stunden  = ['08','09','10','11','12','13','14','15','16','17','18'];

  document.getElementById('kalender-titel').textContent = `${wd[kalenderDatum.getDay()]}, ${datumAnzeigen(iso)}`;

  let html = `<div class="tages-grid">`;
  stunden.forEach(st => {
    const slots = termine.filter(t => t.datum === iso && t.uhrzeit === `${st}:00` && t.status !== 'abgesagt');
    html += `<div class="zeit-label">${st}:00</div><div class="tages-zelle">`;
    slots.forEach(t => {
      html += `<div class="kalender-termin" onclick="terminDetail('${t.id}')" style="font-size:0.85rem;padding:8px 10px">
        ${t.uhrzeit} Uhr · <strong>${t.tiername}</strong><br>
        <span style="font-weight:400;color:var(--text-hell)">👤 ${t.vorname} ${t.nachname} · ${t.adresse?.split(',')[0] || ''}</span>
      </div>`;
    });
    html += `</div>`;
  });
  html += `</div>`;
  document.getElementById('kalender-container').innerHTML = html;
}

function kalenderTagWaehlen(iso) {
  kalenderDatum = new Date(iso + 'T12:00:00');
  kalenderAnsicht('tag');
}

/* ADMIN – TERMIN DETAIL MODAL */

function terminDetail(id) {
  const t = getTermine().find(x => x.id === id);
  if (!t) return;

  const verhSym  = { freundlich:'😊', scheu:'😟', beisst:'🦷', kratzt:'🐾', tritt:'🦶', unberechenbar:'⚠️' };
  const verhAnz  = t.verhalten ? t.verhalten.split(', ').map(v => `${verhSym[v]||''} ${v}`).join(' · ') : '–';
  const statAnz  = { neu:'🔔 Neu', bestaetigt:'✅ Bestätigt', abgesagt:'❌ Abgesagt' };

  document.getElementById('modal-inhalt').innerHTML = `
    <div class="termin-detail-zeile"><span class="detail-label">📅 Datum</span><span class="detail-wert">${wochentag(t.datum)}, ${datumAnzeigen(t.datum)} um ${t.uhrzeit} Uhr</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">🐴 Pferd</span><span class="detail-wert">${t.tiername}${t.rasse ? ' ('+t.rasse+')' : ''}${t.alter ? ' · '+t.alter : ''}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">📏 Größe/Gewicht</span><span class="detail-wert">${t.groesse||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">⚠️ Verhalten</span><span class="detail-wert">${verhAnz}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">🩺 Beschwerden</span><span class="detail-wert">${t.problem||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">⏱ Seit wann</span><span class="detail-wert">${t.seitWann||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">📍 Adresse</span><span class="detail-wert">${t.adresse||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">🗺 Anfahrt</span><span class="detail-wert">${t.anfahrt||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">👤 Besitzer</span><span class="detail-wert">${t.vorname} ${t.nachname}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">✉️ E-Mail</span><span class="detail-wert">${t.email||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">📞 Telefon</span><span class="detail-wert">${t.telefon||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">🕐 Erreichbar</span><span class="detail-wert">${t.erreichbar||'–'}</span></div>
    <div class="termin-detail-zeile"><span class="detail-label">📊 Status</span><span class="detail-wert">${statAnz[t.status]||t.status}</span></div>
    ${t.notiz ? `<div class="termin-detail-zeile"><span class="detail-label">📝 Notiz</span><span class="detail-wert">${t.notiz}</span></div>` : ''}
    <div class="termin-detail-zeile"><span class="detail-label">🕓 Erstellt</span><span class="detail-wert">${new Date(t.erstellt).toLocaleString('de-DE')}</span></div>
  `;

  document.getElementById('modal-aktionen').innerHTML = `
    ${t.status !== 'bestaetigt' ? `<button class="btn btn-klein btn-best" onclick="terminStatusAendern('${id}','bestaetigt')">✅ Bestätigen</button>` : ''}
    ${t.status !== 'abgesagt'   ? `<button class="btn btn-klein btn-abges" onclick="terminStatusAendern('${id}','abgesagt')">❌ Absagen</button>` : ''}
    <button class="btn btn-klein btn-del" onclick="terminLoeschen('${id}')">🗑 Löschen</button>
    <button class="btn btn-klein" style="background:var(--grau-border)" onclick="modalZu()">Schließen</button>
  `;

  document.getElementById('modal-overlay')?.classList.add('offen');
}

function terminStatusAendern(id, status) {
  const alle = getTermine();
  const idx  = alle.findIndex(t => t.id === id);
  if (idx === -1) return;
  alle[idx].status = status;
  setTermine(alle);
  modalZu();
  termineTabelleFuellen();
  statistikenAktualisieren();
  kalenderRendern();
}

function terminLoeschen(id) {
  if (!confirm('Termin wirklich löschen?')) return;
  setTermine(getTermine().filter(t => t.id !== id));
  modalZu();
  termineTabelleFuellen();
  statistikenAktualisieren();
  kalenderRendern();
}

function modalZu() {
  document.getElementById('modal-overlay')?.classList.remove('offen');
}

function modalSchliessen(e) {
  if (e.target === document.getElementById('modal-overlay')) modalZu();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') modalZu(); });

/* ADMIN – TERMINE TABELLE */

let gefilterteTermine = [];

function termineTabelleFuellen() {
  gefilterteTermine = getTermine().sort((a, b) => {
    if (a.datum !== b.datum) return a.datum < b.datum ? -1 : 1;
    return a.uhrzeit < b.uhrzeit ? -1 : 1;
  });
  tabelleDarstellen(gefilterteTermine);
}

function termineFiltern() {
  const such   = (document.getElementById('suche-input')?.value || '').toLowerCase();
  const stFilt = document.getElementById('suche-status')?.value || '';
  const tieFilt= document.getElementById('suche-tierart')?.value || '';

  gefilterteTermine = getTermine()
    .sort((a, b) => a.datum !== b.datum ? (a.datum < b.datum ? -1 : 1) : (a.uhrzeit < b.uhrzeit ? -1 : 1))
    .filter(t => {
      const txt = `${t.tiername} ${t.tierart} ${t.vorname} ${t.nachname} ${t.adresse} ${t.problem}`.toLowerCase();
      return (!such || txt.includes(such)) && (!stFilt || t.status === stFilt) && (!tieFilt || t.tierart === tieFilt);
    });

  tabelleDarstellen(gefilterteTermine);
}

function tabelleDarstellen(liste) {
  const tbody = document.getElementById('termine-tbody');
  if (!tbody) return;

  if (!liste.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-hell)">Keine Termine gefunden.</td></tr>`;
    return;
  }

  const badge = {
    neu:        '<span class="status-badge status-neu">🔔 Neu</span>',
    bestaetigt: '<span class="status-badge status-best">✅ Bestätigt</span>',
    abgesagt:   '<span class="status-badge status-abges">❌ Abgesagt</span>'
  };

  tbody.innerHTML = liste.map(t => `
    <tr>
      <td style="white-space:nowrap">${datumAnzeigen(t.datum)}<br><small style="color:var(--text-hell)">${t.uhrzeit} Uhr</small></td>
      <td><strong>${t.tiername}</strong><br><small style="color:var(--text-hell)">${t.rasse||''}</small></td>
      <td>${t.tierart}</td>
      <td>${t.vorname} ${t.nachname}<br><small style="color:var(--text-hell)">${t.telefon||t.email||''}</small></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.problem}">${(t.problem||'').slice(0,50)}${(t.problem?.length||0)>50?'…':''}</td>
      <td style="white-space:nowrap">${(t.adresse||'').split(',').slice(-1)[0]?.trim()||'–'}</td>
      <td>${badge[t.status]||t.status}</td>
      <td style="white-space:nowrap">
        <button class="btn-klein btn-best"  onclick="terminDetail('${t.id}')" title="Details">🔍</button>
        ${t.status !== 'bestaetigt' ? `<button class="btn-klein btn-best"  onclick="terminStatusAendern('${t.id}','bestaetigt')">✅</button>` : ''}
        ${t.status !== 'abgesagt'   ? `<button class="btn-klein btn-abges" onclick="terminStatusAendern('${t.id}','abgesagt')">❌</button>` : ''}
        <button class="btn-klein btn-del" onclick="terminLoeschen('${t.id}')">🗑</button>
      </td>
    </tr>
  `).join('');
}

/* ADMIN – NEUER TERMIN MANUELL */

function neuTerminSpeichern() {
  const tierart  = document.getElementById('neu-tierart')?.value;
  const tiername = document.getElementById('neu-tiername')?.value?.trim();
  const problem  = document.getElementById('neu-problem')?.value?.trim();
  const datum    = document.getElementById('neu-datum')?.value;
  const uhrzeit  = document.getElementById('neu-uhrzeit')?.value;
  const adresse  = document.getElementById('neu-adresse')?.value?.trim();
  const vorname  = document.getElementById('neu-vorname')?.value?.trim();
  const nachname = document.getElementById('neu-nachname')?.value?.trim();

  if (!tierart || !tiername || !problem || !datum || !uhrzeit || !adresse || !vorname || !nachname) {
    alert('Bitte alle Pflichtfelder ausfüllen.');
    return;
  }

  const status = document.getElementById('neu-status')?.value || 'bestaetigt';

  if (status !== 'abgesagt' && istDoppelbuchung(datum, uhrzeit)) {
    if (!confirm(`⚠️ ${datumAnzeigen(datum)} um ${uhrzeit} Uhr ist bereits belegt.\nTrotzdem speichern?`)) return;
  }

  const t = {
    id:        eindeutigeId(),
    datum, uhrzeit, tierart, tiername,
    rasse:     document.getElementById('neu-rasse')?.value || '',
    groesse:   document.getElementById('neu-groesse')?.value || '',
    problem, adresse,
    anfahrt:   document.getElementById('neu-hinweis')?.value || '',
    verhalten: '',
    vorname, nachname,
    email:     document.getElementById('neu-email')?.value || '',
    telefon:   document.getElementById('neu-telefon')?.value || '',
    notiz:     document.getElementById('neu-notiz')?.value || '',
    status,
    erstellt:  new Date().toISOString()
  };

  const alle = getTermine();
  alle.push(t);
  setTermine(alle);

  const erf = document.getElementById('neu-erfolg');
  if (erf) { erf.style.display = 'block'; setTimeout(() => erf.style.display = 'none', 3000); }

  neuFormularLeeren();
  termineTabelleFuellen();
  statistikenAktualisieren();
  kalenderRendern();
}

function neuFormularLeeren() {
  ['neu-tierart','neu-tiername','neu-rasse','neu-groesse','neu-problem',
   'neu-adresse','neu-hinweis','neu-vorname','neu-nachname','neu-email','neu-telefon','neu-notiz']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const nd = document.getElementById('neu-datum');
  if (nd) nd.value = datumFormatieren(new Date());
  const nu = document.getElementById('neu-uhrzeit');
  if (nu) nu.value = '09:00';
  const ns = document.getElementById('neu-status');
  if (ns) ns.value = 'bestaetigt';
}

/* ADMIN – TABS */

function adminTab(tab) {
  ['kalender','termine','neu'].forEach(t => {
    const panel = document.getElementById(`panel-${t}`);
    const btn   = document.getElementById(`tab-${t}`);
    if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
    if (btn) { btn.classList.toggle('aktiv', t === tab); btn.setAttribute('aria-selected', t === tab); }
  });
  if (tab === 'termine')  termineTabelleFuellen();
  if (tab === 'kalender') { kalenderRendern(); statistikenAktualisieren(); }
}

/* DEMO-DATEN */

function demoDatenLaden() {
  const h = new Date();
  const d = (off) => { const x = new Date(h); x.setDate(h.getDate()+off); return datumFormatieren(x); };

  setTermine([
    { id:eindeutigeId(), datum:d(0),  uhrzeit:'09:00', tierart:'Pferd', tiername:'Bella',   rasse:'Warmblut',    alter:'8 Jahre',  groesse:'550 kg', verhalten:'freundlich',        problem:'Rückenblockierung, stolpert beim Galoppwechsel', seitWann:'3 Wochen', tierarzt:'ja',   adresse:'Musterstraße 12, 80331 München',                       anfahrt:'Stalleingang rechts', vorname:'Maria',  nachname:'Mustermann', email:'maria@beispiel.de',   telefon:'0176 11111111', erreichbar:'ab 16 Uhr', methode:'beide',   sonstiges:'', status:'bestaetigt', erstellt:new Date().toISOString(), notiz:'' },
    { id:eindeutigeId(), datum:d(1),  uhrzeit:'11:00', tierart:'Pferd', tiername:'Sultan',  rasse:'Andalusier',  alter:'12 Jahre', groesse:'490 kg', verhalten:'freundlich, tritt', problem:'Widersetzt sich beim Satteln, Halsbereich',     seitWann:'1 Monat',  tierarzt:'ja',   adresse:'Reiterhof Sonnenschein, Dorfstraße 1, 85604 Zorneding', anfahrt:'Letztes Gebäude rechts',  vorname:'Klaus',  nachname:'Wagner',     email:'wagner@beispiel.de',  telefon:'0179 44444444', erreichbar:'',         methode:'email',   sonstiges:'', status:'neu',        erstellt:new Date().toISOString(), notiz:'' },
    { id:eindeutigeId(), datum:d(2),  uhrzeit:'14:00', tierart:'Pferd', tiername:'Luna',    rasse:'Friese',      alter:'6 Jahre',  groesse:'580 kg', verhalten:'freundlich',        problem:'Taktfehler im Trab, ungleichmäßige Muskulatur', seitWann:'2 Wochen', tierarzt:'nein', adresse:'Birkenweg 3, 82031 Grünwald',                           anfahrt:'Nebeneingang',           vorname:'Anna',   nachname:'Huber',      email:'anna@beispiel.de',    telefon:'0178 33333333', erreichbar:'Nachm.', methode:'telefon', sonstiges:'', status:'bestaetigt', erstellt:new Date().toISOString(), notiz:'Folgebehandlung' },
    { id:eindeutigeId(), datum:d(5),  uhrzeit:'10:00', tierart:'Pferd', tiername:'Amadeus', rasse:'Hanoverianer',alter:'10 Jahre', groesse:'560 kg', verhalten:'freundlich',        problem:'Steifigkeit, Probleme beim Einstellen',         seitWann:'3 Monate', tierarzt:'ja',   adresse:'Gestüt Alpenblick, Bergstraße 7, 83684 Tegernsee',      anfahrt:'Schild am Ortseingang',  vorname:'Sandra', nachname:'Bauer',      email:'bauer@beispiel.de',   telefon:'0176 55555555', erreichbar:'',         methode:'beide',   sonstiges:'', status:'neu',        erstellt:new Date().toISOString(), notiz:'' },
    { id:eindeutigeId(), datum:d(-3), uhrzeit:'09:00', tierart:'Pferd', tiername:'Chico',   rasse:'Paint Horse', alter:'5 Jahre',  groesse:'470 kg', verhalten:'freundlich',        problem:'Galoppwechsel rechts fehlt, Rücken angespannt',  seitWann:'1 Monat',  tierarzt:'nein', adresse:'Lindenstraße 8, 81371 München',                         anfahrt:'',                       vorname:'Peter',  nachname:'Schmidt',    email:'schmidt@beispiel.de', telefon:'0177 22222222', erreichbar:'',         methode:'email',   sonstiges:'', status:'bestaetigt', erstellt:new Date().toISOString(), notiz:'2. Behandlung' }
  ]);
}
