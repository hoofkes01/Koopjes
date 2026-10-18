// Vercel-functie: zoekt het internet af naar de goedkoopste aanbieding via Claude met webzoeken.
const SYSTEEM = `Je zoekt voor een Nederlandse koper de goedkoopste goede aanbieding van een product.
Regels:
- Zoek actuele prijzen in Nederland (en bij EU-webwinkels die naar Nederland leveren). Neem altijd mee: Tweakers Pricewatch, Kieskeurig, Beslist, Google Shopping, Bol, Amazon.nl, MediaMarkt, Coolblue, Makro en iBOOD (ibood.com/nl). Neem Marktplaats mee als tweedehands is toegestaan.
- Reken met de totaalprijs inclusief verzendkosten. Noem geen prijs die je niet in een gevonden bron hebt gezien.
- Controleer dat het om het juiste model gaat (let op jaarversies en typenummers).
- Noem winkels met slechte beoordelingen of onbekende winkels apart als risico.
- Als je een site niet kon lezen (bijvoorbeeld iBOOD), zeg dat expliciet.
Antwoord ALLEEN met JSON, zonder uitleg eromheen:
{"samenvatting":"1-2 zinnen","resultaten":[{"winkel":"","product":"","prijs_totaal":"€ 0","link":"https://...","opmerking":""}],"niet_gelezen":["sites die je niet kon lezen"]}
Maximaal 6 resultaten, goedkoopste eerst.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ fout: "Alleen POST" });
  if (process.env.ACCESS_CODE && req.headers["x-code"] !== process.env.ACCESS_CODE)
    return res.status(401).json({ fout: "Toegangscode klopt niet" });
  const { product, tweedehands } = req.body || {};
  if (!product || typeof product !== "string" || product.length > 200)
    return res.status(400).json({ fout: "Geef een product op (max 200 tekens)" });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.MODEL || "claude-sonnet-5-5",
      max_tokens: 2000,
      system: SYSTEEM,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 10 }],
      messages: [{ role: "user", content: `Product: ${product}\nTweedehands toegestaan: ${tweedehands ? "ja" : "nee"}` }]
    })
  });
  const data = await r.json();
  if (!r.ok) return res.status(502).json({ fout: data?.error?.message || "Fout bij zoeken" });

  const tekst = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  try {
    const json = JSON.parse(tekst.slice(tekst.indexOf("{"), tekst.lastIndexOf("}") + 1));
    return res.status(200).json(json);
  } catch {
    return res.status(200).json({ samenvatting: tekst, resultaten: [], niet_gelezen: [] });
  }
}
