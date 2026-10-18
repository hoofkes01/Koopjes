# Koopjes

Zoekpagina voor de goedkoopste aanbieding. `index.html` is de pagina, `api/zoek.js` de server-functie die via Claude met webzoeken zoekt.

## Online zetten (Vercel)
1. Importeer deze repo op vercel.com.
2. Zet bij Settings > Environment Variables:
   - `ANTHROPIC_API_KEY`: je sleutel van console.anthropic.com
   - `ACCESS_CODE`: een zelfgekozen code (anders kan iedereen op jouw rekening zoeken)
3. Deploy. Kosten: grofweg enkele cent per zoekopdracht; stel een maandlimiet in bij Anthropic.
