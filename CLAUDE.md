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
- `api/lead.js`: Vercel-functie die dakscan- en contactaanvragen mailt via Resend (ontwerp "volledig donker").

## Deployen
- Vercel-project `bruck-dakwerken` (team build-with-blocks), live op https://bruck-dakwerken.vercel.app.
- Op een nieuwe machine eerst: `npx vercel login` en `npx vercel link --yes --project bruck-dakwerken`.
- Deployen: `npx vercel deploy --prod --yes`. Er is geen build-stap (framework Other, output `.`).
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
- Contactformulier (contact.html) heeft nog de oude stijl (ronde hoeken, grijze velden).
- Stap-meting per dakscan-stap (Vercel custom events vragen Pro; anders Plausible).
