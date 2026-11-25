# Brück Dak en Zinkwerk – website

Klantsite van Build with Blocks (Tim) voor Brück Dak en Zinkwerk (Nicky, Ooij). Antwoord in het Nederlands.

## Opbouw
- Statische site: één HTML-bestand per pagina, opmaak in inline styles. Elke pagina heeft een kleine
  template-runtime (`<template id="dc-tpl">`, `sc-for`, `sc-if`, `{{ waarde }}` uit `renderVals()` in het script
  onderaan). Let op: `sc-for` rendert een lijst maar één keer bij het laden; dynamische lijsten bouw je met gewone DOM.
- `reveal.js` + `js/gsap.min.js` + `js/ScrollTrigger.min.js`: scroll-reveal zoals globen.vercel.app
  (per blok, 100 ms stagger, 2em, 0,8 s, power4.inOut, start op 80%). Ruimt na afloop alleen transform/opacity/visibility op.
- `js/dakscan-data.js`: echte dakgegevens per adres (PDOK Locatieserver, BAG, 3D BAG, PDOK-luchtfoto), overgenomen
  van de Vermeulen-dakscan (`~/Projecten/vermeulen-daktechniek/src/components/dakscan/scan.ts`).
- De dakscore in `dakscan.html` rekent exact als Vermeulen (`bereken()` in scan.ts); houd die gelijk.
- De homepage-balk geeft postcode/huisnummer/"dak vernieuwd" via sessionStorage (`bruck-dakscan`) door aan de dakscan.
- `dakscan.html` is een gesloten omgeving: geen menu, footer of contactblok, alleen een topbalk (Terug naar home,
  logo) met de 5 benoemde stappen; "Vorige" en de volgende knop staan per stap in een vaste balk onderin (stap 2–4).
  Een keuze uit de lijst met toevoegingen scant direct dat adres (`scanAdres`), zonder opnieuw te zoeken.
- De dakscan volgt de Vermeulen-dakscan (laadscherm min. 2,6 s, formulier bij niet-gevonden adres, rijke uitslag,
  één naamveld + vraag + inspectie-vinkje, WhatsApp met ingevuld bericht). Bedankpagina: vervolgstappen links,
  rechts subsidiecheck en "Direct contact" (WhatsApp primair met "Reactie binnen 1 werkdag", bellen, mailen).
- `api/lead.js`: contactformulier en dakscan "adres niet gevonden" (Resend, ontwerp "volledig donker").
- `api/rapport.mjs`: dakrapport-pdf (@react-pdf/renderer, 3 pagina's, overgenomen van Vermeulen `src/lib/rapport`).
  Rekent de score opnieuw uit, haalt de luchtfoto bij PDOK, mailt de klant (rapport@) en Nicky (met pdf als bijlage).
  `?download=1` geeft de pdf terug. Rate limit 6 per IP per 10 min (download 20). Gedeelde mailopmaak in `api/_huisstijl.js`.
- Lettertypes voor de pdf in `api/_fonts/`. De Factory Sans-subset van de site mist `0 ? - / ! # = @`; `F()` in
  rapport.mjs zet die tekens in Saira. Gebruik NIET de Factory Sans uit ~/Library/Fonts: dat is een demo met watermerk.
- `vercel.json` zet `installCommand: npm ci` (nodig voor de pdf-functie) en neemt fonts, logo en Nicky-foto mee.

## Deployen (via GitHub)
- Vercel-project `bruck-dakwerken` (team build-with-blocks), live op https://bruck-dakwerken.vercel.app.
- Het project is gekoppeld aan github.com/buildwithblocks/bruck-website:
  - push naar `main` = automatisch live (productie);
  - push naar een andere branch = automatisch een preview-link.
- Werkwijze, lokaal én in de cloud: eerst `git pull`, dan wijzigen, dan committen en pushen. Niet meer handmatig
  `vercel deploy` gebruiken, zodat GitHub en de live site altijd gelijk lopen.
- In een cloud-sessie: werk op een branch en laat Tim de preview-link checken voor je naar `main` merget,
  tenzij hij zegt dat het direct live mag.
- Lokaal op een nieuwe Mac: `npx vercel login` en `npx vercel link --yes --project bruck-dakwerken` (alleen nodig
  voor `vercel env`/logs). Er is geen build-stap (framework Other, output `.`).
- Lokaal bekijken: `python3 -m http.server 4620` in deze map (cleanUrls werken lokaal niet; gebruik `.html`).

## Mails (Resend) – testmodus staat AAN tot de livegang
- Omgevingsvariabelen in Vercel: `RESEND_API_KEY` (staat erin, key mag alleen bruckdakwerken.nl).
- Afzenders: intern `dakscan@bruckdakwerken.nl`, klanten `rapport@bruckdakwerken.nl`. Nooit vanaf buildwithblocks.nl
  naar klanten (Tim wil dat expliciet niet).
- Nu gaat alles naar info@buildwithblocks.nl met [TEST]. Bij de livegang (pas dan, op verzoek van Tim):
  `LEAD_TO`=bruckdakenzinkwerk@outlook.com, `LEAD_TEST`=0, `SITE_URL`=https://bruckdakwerken.nl, en opnieuw deployen.

## Domein
- bruckdakwerken.nl staat bij Hostinger (DNS via dns-parking.com, Hostinger-mail). Nog niet aan Vercel gekoppeld.

## Stijlregels
- Donker (#161616, vlakken #1F1F1F, formulieren #0B0B0B), accent #DFA701 (hover #C99600), rechte hoeken,
  subtiele lijnen (rgba(255,255,255,.12–.15)). Koppen Factory Sans in hoofdletters, tekst Saira.
- Spacing zoals de homepage: geel label → kop 16px, hero-kop → tekst 24px, kop → tekst 32px,
  tussenkop → tekst 8px, tekst → tussenkop 40px, tekst → knop 28px.
- Geen accenten in koppen met de display-font (gebruik "1" of "een" in plaats van "één").
- Hover-effecten: knoppen en kaarten worden #C99600; pijl-knoppen wisselen de pijl (uit rechts, in van links).

## Nog open
- Placeholders voor Nicky: garantie "[X] jaar" (FAQ homepage), duur "[X] dagen" (dienstpagina's), "[X]+ jaar ervaring".
- Stap-meting per dakscan-stap (Vercel custom events vragen Pro; anders Plausible).
