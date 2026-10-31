(function () {
  'use strict';

  const B = VRAGENBANK;
  const SLEUTEL = 'pubquiz-v1';
  const $ = (s) => document.querySelector(s);

  // Bouwt een element; tekst gaat altijd via textContent (geen HTML-injectie).
  function el(tag, opties, ...kinderen) {
    const e = document.createElement(tag);
    const o = opties || {};
    if (o.klasse) e.className = o.klasse;
    if (o.tekst != null) e.textContent = o.tekst;
    if (o.attr) for (const k in o.attr) e.setAttribute(k, o.attr[k]);
    kinderen.flat().forEach((k) => k && e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k));
    return e;
  }

  const cat = (id) => B.categorieen.find((c) => c.id === id);

  function schud(lijst) {
    const a = lijst.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Vragen die al gebruikt zijn (geprint). Die komen niet opnieuw in een nieuwe quiz.
  const GEBRUIKT = 'pubquiz-gebruikt-v1';
  let gebruikt = new Set();
  function laadGebruikt() {
    try { gebruikt = new Set(JSON.parse(localStorage.getItem(GEBRUIKT)) || []); } catch (e) { gebruikt = new Set(); }
  }
  function bewaarGebruikt() {
    try { localStorage.setItem(GEBRUIKT, JSON.stringify(Array.from(gebruikt))); } catch (e) { /* negeren */ }
  }

  // Vragen van een categorie die bij de leeftijdsgroep passen.
  // Standaard alleen nieuwe vragen; met alles=true ook de gebruikte.
  function pool(catId, groep, alles) {
    return ALLE[catId].filter((q) => q.g.includes(String(groep)) && (alles || !gebruikt.has(q.id)));
  }

  function nieuweRonde(catId, groep, perRonde) {
    return { cat: catId, ids: schud(pool(catId, groep)).slice(0, perRonde).map((q) => q.id) };
  }

  // Vraag-id's zijn gebaseerd op de vraagtekst, zodat uitbreiden van de bank
  // geen opgeslagen quizzen of 'gebruikt'-lijsten door elkaar haalt.
  function hash(t) {
    let h = 5381;
    for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  const ALLE = {};   // categorie -> lijst met vragen
  const OP_ID = {};  // id -> vraag
  B.categorieen.forEach((c) => {
    ALLE[c.id] = B.vragen[c.id].map((q) => {
      const v = { id: c.id + ':' + hash(q[0]), v: q[0], a: q[1], g: q[2], o: q[3] };
      OP_ID[v.id] = v;
      return v;
    });
  });
  const vraagUitId = (id) => OP_ID[id] || null;

  let state = null; // { meta, groep, perRonde, rondes: [{ cat, ids: [] }] }

  // ---------- Opslaan (alleen gemak; werkt ook zonder) ----------
  function bewaar() {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(state)); } catch (e) { /* negeren */ }
  }
  function laad() {
    try {
      const s = JSON.parse(localStorage.getItem(SLEUTEL));
      if (s && Array.isArray(s.rondes) && s.rondes.every((r) => cat(r.cat) && r.ids.every(vraagUitId))) return s;
    } catch (e) { /* negeren */ }
    return null;
  }

  // ---------- Intake ----------
  function bouwIntake() {
    const groepen = $('#groepen');
    B.groepen.forEach((g) => {
      const input = el('input', { attr: { type: 'radio', name: 'groep', value: String(g.id) } });
      if (g.id === 2) input.checked = true;
      groepen.appendChild(el('label', { klasse: 'keuze' }, input, el('span', {}, g.naam, el('small', { tekst: g.leeftijd }))));
    });

    const cats = $('#categorieen');
    B.categorieen.forEach((c) => {
      const input = el('input', { attr: { type: 'checkbox', name: 'cat', value: c.id, checked: 'checked' } });
      cats.appendChild(el('label', { klasse: 'keuze' }, input, el('span', { tekst: c.icoon + ' ' + c.naam })));
    });

    $('#alles').addEventListener('click', () => cats.querySelectorAll('input').forEach((i) => (i.checked = true)));
    $('#niets').addEventListener('click', () => cats.querySelectorAll('input').forEach((i) => (i.checked = false)));

    ['change', 'input'].forEach((ev) => $('#intake').addEventListener(ev, updateRest));
    $('#wisGebruikt').addEventListener('click', () => {
      if (!gebruikt.size || !confirm('Alle gebruikte vragen weer beschikbaar maken?')) return;
      gebruikt = new Set();
      bewaarGebruikt();
      updateRest();
      if (state) render();
    });
    $('#datum').value = new Date().toISOString().slice(0, 10);
    $('#intake').addEventListener('submit', (e) => {
      e.preventDefault();
      maakQuiz();
    });
  }

  // Hoeveel volle quizzen zijn er nog zonder herhaling mogelijk?
  function updateRest() {
    const gekozen = Array.from(document.querySelectorAll('input[name=cat]:checked')).map((i) => i.value);
    const groepEl = document.querySelector('input[name=groep]:checked');
    const perRonde = Math.min(15, Math.max(5, parseInt($('#aantal').value, 10) || 10));
    const t = $('#rest');
    if (!gekozen.length || !groepEl) { t.textContent = ''; return; }
    const groep = Number(groepEl.value);
    const aantal = Math.min(...gekozen.map((c) => Math.floor(pool(c, groep).length / perRonde)));
    t.textContent = `Nog ${aantal} volle ${aantal === 1 ? 'quiz' : 'quizzen'} mogelijk zonder herhaling voor deze keuze (${perRonde} vragen per ronde). ` +
      `Gebruikte vragen: ${gebruikt.size}.`;
  }

  function toonFout(tekst) {
    const f = $('#fout');
    f.textContent = tekst || '';
    f.hidden = !tekst;
  }

  function maakQuiz() {
    const gekozen = Array.from(document.querySelectorAll('input[name=cat]:checked')).map((i) => i.value);
    if (!gekozen.length) return toonFout('Kies minimaal één thema.');
    const groep = Number(document.querySelector('input[name=groep]:checked').value);
    const perRonde = Math.min(15, Math.max(5, parseInt($('#aantal').value, 10) || 10));
    toonFout('');

    state = {
      meta: {
        naam: $('#naam').value.trim() || 'Pubquiz',
        datum: $('#datum').value,
        quizmaster: $('#quizmaster').value.trim()
      },
      groep,
      perRonde,
      rondes: gekozen.map((c) => nieuweRonde(c, groep, perRonde))
    };
    bewaar();
    render();
    $('#resultaat').scrollIntoView({ behavior: 'smooth' });
  }

  // ---------- Weergave op het scherm ----------
  function datumTekst(d) {
    if (!d) return '';
    const dt = new Date(d + 'T12:00:00');
    return isNaN(dt) ? d : dt.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function render() {
    if (!state) return;
    const groep = B.groepen[state.groep];
    const totaal = state.rondes.reduce((n, r) => n + r.ids.length, 0);
    $('#resultaat').hidden = false;
    $('#samenvatting').textContent =
      `${state.meta.naam} · ${groep.naam} (${groep.leeftijd}) · ${state.rondes.length} rondes · ${totaal} vragen`;

    const wortel = $('#rondes');
    wortel.textContent = '';
    state.rondes.forEach((r, ri) => {
      const c = cat(r.cat);
      const beschikbaar = pool(r.cat, state.groep).length + r.ids.filter((id) => !gebruikt.has(id)).length;
      const lijst = el('ol');
      r.ids.forEach((id, vi) => {
        const q = vraagUitId(id);
        const wissel = el('button', { klasse: 'wissel', tekst: '↻', attr: { type: 'button', title: 'Vervang deze vraag door een andere' } });
        wissel.addEventListener('click', () => vervang(ri, vi));
        lijst.appendChild(el('li', {},
          el('span', { klasse: 'nr', tekst: vi + 1 + '.' }),
          el('div', {},
            el('div', { tekst: q.v }),
            q.o ? el('div', { klasse: 'opties', tekst: opties(q) }) : null,
            el('div', { klasse: 'antwoord', tekst: 'Antwoord: ' + q.a })),
          wissel));
      });
      const kop = el('h3', { tekst: `Ronde ${ri + 1}: ${c.icoon} ${c.naam}` });
      const nota = r.ids.length < state.perRonde
        ? el('p', { klasse: 'let', tekst: `Let op: er zijn nog maar ${r.ids.length} nieuwe vragen in dit thema voor deze groep. Wis eventueel de gebruikte vragen.` })
        : null;
      wortel.appendChild(el('div', { klasse: 'ronde' }, kop, nota, lijst));
    });

    bouwPrint();
  }

  function opties(q) {
    return q.o.map((t, i) => String.fromCharCode(65 + i) + '. ' + t).join('    ');
  }

  function vervang(ri, vi) {
    const r = state.rondes[ri];
    const vrij = pool(r.cat, state.groep).filter((q) => !r.ids.includes(q.id));
    if (!vrij.length) {
      alert('Er zijn geen nieuwe vragen meer beschikbaar voor dit thema en deze leeftijdsgroep.');
      return;
    }
    r.ids[vi] = vrij[Math.floor(Math.random() * vrij.length)].id;
    bewaar();
    render();
  }

  // ---------- Printweergave ----------
  function printKop(titel) {
    const regels = [datumTekst(state.meta.datum), state.meta.quizmaster ? 'Quizmaster: ' + state.meta.quizmaster : '']
      .filter(Boolean).join(' · ');
    return el('div', { klasse: 'print-kop' }, el('h1', { tekst: state.meta.naam }),
      el('p', { tekst: [titel, regels].filter(Boolean).join(' · ') }));
  }

  function bouwPrint() {
    // Vragenlijst voor de deelnemers: één ronde per pagina
    const v = $('#print-vragen');
    v.textContent = '';
    state.rondes.forEach((r, ri) => {
      const c = cat(r.cat);
      const lijst = el('ol', { klasse: 'vragenlijst' });
      r.ids.forEach((id) => {
        const q = vraagUitId(id);
        lijst.appendChild(el('li', {}, el('div', { tekst: q.v }), q.o ? el('div', { klasse: 'opties', tekst: opties(q) }) : null));
      });
      v.appendChild(el('section', { klasse: 'pagina' }, printKop('Vragenlijst'), el('h2', { tekst: `Ronde ${ri + 1}: ${c.naam}` }), lijst));
    });

    // Antwoordformulier per team
    const f = $('#print-formulier');
    f.textContent = '';
    const sectie = el('section', { klasse: 'pagina' }, printKop('Antwoordformulier'),
      el('div', { klasse: 'team' }, el('span', { tekst: 'Teamnaam:' }), el('span', { tekst: 'Aantal spelers:' })));
    state.rondes.forEach((r, ri) => {
      const c = cat(r.cat);
      const blok = el('div', { klasse: 'formronde' }, el('h3', { tekst: `Ronde ${ri + 1}: ${c.naam}` }));
      r.ids.forEach((_, vi) => blok.appendChild(el('div', { klasse: 'regel' }, el('b', { tekst: vi + 1 + '.' }), el('i'))));
      blok.appendChild(el('div', { klasse: 'score', tekst: `Score ronde: ......... / ${r.ids.length}` }));
      sectie.appendChild(blok);
    });
    const totaal = state.rondes.reduce((n, r) => n + r.ids.length, 0);
    sectie.appendChild(el('h3', { tekst: `Totaalscore: ......... / ${totaal}` }));
    f.appendChild(sectie);

    // Antwoordenoverzicht voor de quizmaster
    const a = $('#print-antwoorden');
    a.textContent = '';
    const groep = B.groepen[state.groep];
    const over = el('table', { klasse: 'antw' },
      el('tr', {}, el('th', { tekst: 'Ronde' }), el('th', { tekst: 'Thema' }), el('th', { tekst: 'Vragen' })));
    state.rondes.forEach((r, ri) => {
      over.appendChild(el('tr', {}, el('td', { tekst: String(ri + 1) }), el('td', { tekst: cat(r.cat).naam }), el('td', { tekst: String(r.ids.length) })));
    });
    over.appendChild(el('tr', {}, el('td'), el('th', { tekst: 'Totaal' }), el('th', { tekst: String(totaal) })));
    const antw = el('section', { klasse: 'pagina' },
      printKop('Antwoordenoverzicht (alleen voor de quizmaster)'),
      el('p', { tekst: `Leeftijdsgroep: ${groep.naam} (${groep.leeftijd})` }), over);
    state.rondes.forEach((r, ri) => {
      const tabel = el('table', { klasse: 'antw' }, el('tr', {}, el('th', { tekst: 'Nr' }), el('th', { tekst: 'Vraag' }), el('th', { tekst: 'Antwoord' })));
      r.ids.forEach((id, vi) => {
        const q = vraagUitId(id);
        tabel.appendChild(el('tr', {}, el('td', { klasse: 'n', tekst: String(vi + 1) }), el('td', { tekst: q.v }), el('td', { klasse: 'a', tekst: q.a })));
      });
      antw.appendChild(el('h3', { tekst: `Ronde ${ri + 1}: ${cat(r.cat).naam}` }));
      antw.appendChild(tabel);
    });
    a.appendChild(antw);
  }

  function markeerGebruikt() {
    state.rondes.forEach((r) => r.ids.forEach((id) => gebruikt.add(id)));
    bewaarGebruikt();
    updateRest();
  }

  function print(soort) {
    markeerGebruikt();
    const klasse = 'print-' + soort;
    const opruimen = () => {
      document.body.classList.remove('print-vragen', 'print-formulier', 'print-antwoorden', 'print-alles');
      window.removeEventListener('afterprint', opruimen);
    };
    opruimen();
    document.body.classList.add(klasse);
    window.addEventListener('afterprint', opruimen);
    window.print();
  }

  // ---------- Opstarten ----------
  function start() {
    laadGebruikt();
    bouwIntake();
    document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => print(b.dataset.print)));

    $('#opnieuw').addEventListener('click', () => {
      state.rondes = state.rondes.map((r) => nieuweRonde(r.cat, state.groep, state.perRonde));
      bewaar();
      render();
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm('Weet je het zeker? De huidige quiz wordt gewist.')) return;
      state = null;
      try { localStorage.removeItem(SLEUTEL); } catch (e) { /* negeren */ }
      $('#resultaat').hidden = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const opgeslagen = laad();
    if (opgeslagen) {
      state = opgeslagen;
      $('#naam').value = state.meta.naam;
      $('#datum').value = state.meta.datum || '';
      $('#quizmaster').value = state.meta.quizmaster || '';
      $('#aantal').value = state.perRonde;
      const gr = document.querySelector(`input[name=groep][value="${state.groep}"]`);
      if (gr) gr.checked = true;
      document.querySelectorAll('input[name=cat]').forEach((i) => (i.checked = state.rondes.some((r) => r.cat === i.value)));
      render();
    }
    updateRest();
  }

  start();
})();
