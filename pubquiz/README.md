# Pubquiz Maker

Webapp (geen server, geen installatie) om een pubquiz samen te stellen en uit te printen.

## Gebruik
Open `index.html` in een browser (of zet de map online via GitHub Pages).

1. **Intake**: quiznaam, datum, quizmaster en de **leeftijdsgroep** van het publiek:
   Kinderen (6-12), Tieners (13-17), Jong volwassenen (18-35), Volwassenen (36-55), Senioren (56+).
2. **Thema’s** (elk thema is een ronde): film, muziek algemeen, geschiedenis < 100 jaar,
   geschiedenis > 100 jaar, carnavalshits en carnaval, aardrijkskunde, kunst en cultuur,
   wetenschap en financiën. Zet aan of uit wat je wilt.
3. **Quiz samenstellen**: de app kiest willekeurig vragen die bij de groep passen.
   Met ↻ vervang je één vraag, met ‘Andere vragen kiezen’ schud je alles opnieuw.
4. **Printen**:
   - Vragenlijst voor de deelnemers (één ronde per pagina)
   - Antwoordformulier per team (lege regels, score per ronde en totaal)
   - Antwoordenoverzicht voor de quizmaster (overzicht per ronde + alle antwoorden)
   - Alles in één keer

## Vragenbank
Staat in `js/vragen.js`. Elke vraag: `[vraag, antwoord, groepen, opties?]`, waarbij `groepen`
de cijfers zijn van de leeftijdsgroepen waarvoor de vraag past (0 t/m 4). Niveau: gemiddeld IQ,
algemene kennis.

Let op: ‘geschiedenis < 100 jaar’ betekent na 1926, ‘> 100 jaar’ ervoor (peiljaar 2026).
Controleer bij tijdgevoelige vragen of het antwoord nog klopt.

## Controle van de vragenbank
```
npm test
```
Controleert op dubbele vragen, ontbrekende velden en minimaal 10 vragen per thema per leeftijdsgroep.
