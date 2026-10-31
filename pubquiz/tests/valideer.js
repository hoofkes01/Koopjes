// Controleert de vragenbank: aanwezige velden, dubbele vragen en genoeg vragen per groep.
const B = require('../js/vragen.js');
const MIN_PER_GROEP = 10;
let fouten = 0;
const fout = (m) => { console.error('FOUT: ' + m); fouten++; };

const catIds = B.categorieen.map((c) => c.id);
for (const id of Object.keys(B.vragen)) if (!catIds.includes(id)) fout(`Onbekende categorie in vragen: ${id}`);

for (const c of B.categorieen) {
  const lijst = B.vragen[c.id];
  if (!lijst) { fout(`Geen vragen voor ${c.id}`); continue; }
  const gezien = new Set();
  lijst.forEach((q, i) => {
    const [v, a, g, o] = q;
    const label = `${c.id}[${i}]`;
    if (!v || !a || !g) return fout(`${label}: vraag, antwoord of groepen ontbreekt`);
    if (!/^[0-4]+$/.test(g)) fout(`${label}: ongeldige groepen "${g}"`);
    if (new Set(g).size !== g.length) fout(`${label}: dubbele groep in "${g}"`);
    if (gezien.has(v)) fout(`${label}: dubbele vraag`);
    gezien.add(v);
    if (o && !o.includes(a)) fout(`${label}: antwoord staat niet in de opties`);
  });
  const tellingen = B.groepen.map((gr) => lijst.filter((q) => q[2].includes(String(gr.id))).length);
  tellingen.forEach((n, gi) => {
    if (n < MIN_PER_GROEP) fout(`${c.id}: groep ${B.groepen[gi].naam} heeft maar ${n} vragen (minimaal ${MIN_PER_GROEP})`);
  });
  console.log(`${c.naam.padEnd(28)} totaal ${String(lijst.length).padStart(2)} | per groep: ${tellingen.join(' / ')}`);
}

if (fouten) { console.error(`\n${fouten} fout(en) gevonden.`); process.exit(1); }
console.log('\nVragenbank is in orde.');
