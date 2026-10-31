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

## Omvang en herhaling
Voor de drie volwassen groepen (18-35, 36-55, 56+) zitten er per thema minimaal 100 vragen in de bank,
genoeg voor 10 quizzen van 10 vragen per ronde zonder herhaling. Kinderen en tieners hebben minder vragen
(kinderen: 10 tot 20 per thema, tieners: 13 tot 30).

De app onthoudt in de browser welke vragen je hebt geprint. Die komen niet meer voor in een nieuwe quiz.
Met ‘Gebruikte vragen wissen’ begin je opnieuw. Vraag-id’s zijn gebaseerd op de vraagtekst, dus je kunt
vragen toevoegen zonder dat de ‘gebruikt’-lijst in de war raakt (pas wel geen bestaande vraagtekst aan
als je die lijst wilt behouden).

## Uitbreiden
Nieuwe vragen komen in `js/extra/` (per thema een bestand; voeg een `<script>`-regel toe in `index.html`).
`npm test` controleert daarna of alles nog klopt.

## Juistheid van de antwoorden
De vragen zijn geschreven op basis van algemeen bekende, onomstreden feiten. Twijfelgevallen zijn weggelaten
of aangepast en een steekproef is online gecontroleerd. Niet elke vraag is apart nagezocht: loop de
antwoorden door voordat je een quiz gebruikt, vooral bij tijdgevoelige vragen (bijvoorbeeld het aantal
Songfestival-winnaars, het btw-tarief of de bevolkingsgrootte van landen).
