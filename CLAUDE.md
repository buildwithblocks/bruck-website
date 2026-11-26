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
  met knop "Terug naar de website"; rechts subsidiecheck en "Direct contact" (WhatsApp primair met "Reactie binnen 1 werkdag", bellen, mailen).
- `api/lead.js`: contactformulier en dakscan "adres niet gevonden" (Resend, ontwerp "volledig donker").
- `api/rapport.mjs`: dakrapport-pdf (@react-pdf/renderer, 3 pagina's, overgenomen van Vermeulen `src/lib/rapport`).
  Rekent de score opnieuw uit, haalt de luchtfoto bij PDOK, mailt de klant (rapport@) en Nicky (met pdf als bijlage).
  Het rapport komt alleen per mail (geen download). Rate limit 6 per IP per 10 min. Gedeelde mailopmaak in `api/_huisstijl.js`
  (mobiel via media queries; `contactBlok()` = contact zoals op de site, met plaatjes uit `img/mail/`).
- Lettertypes voor de pdf in `api/_fonts/`. De Factory Sans-subset van de site mist `0 ? - / ! # = @`; `F()` in
  rapport.mjs zet die tekens in Saira. Gebruik NIET de Factory Sans uit ~/Library/Fonts: dat is een demo met watermerk.
- `vercel.json` zet `installCommand: npm ci` (nodig voor de pdf-functie) en neemt fonts, logo en Nicky-foto mee.

- `faq.html`: alle FAQ's per onderwerp (zoekveld, meelopend onderwerpmenu, links naar #vraag). Gemaakt uit de
  `faqs`-lijsten van de pagina's; pas je daar een vraag aan, pas hem dan ook hier aan. FAQ-blokken op de pagina's
  hebben allemaal de knop "Neem contact op" naar contact.html.
- `js/menu.js`: mobiel en tablet menu (onder 1200 px), op elke pagina met `[data-floating-nav]` (niet de dakscan).
  Zet WhatsApp + hamburger in de bestaande balk en bouwt het off-canvas menu (stijl Globen): grote links, Diensten
  uitklapbaar, Start dakscan (primair) + Subsidiecheck (secundair), contact zoals boven de footer. Nieuwe pagina of
  dienst? Pas `DIENSTEN`/`HOOFD` in menu.js aan en verhoog `?v=` in de script-tags. Desktopnav: Projecten, Over ons, FAQ, Contact.
- Contactvolgorde overal: eerst WhatsApp (app), dan bellen, dan mailen (teksten, knoppen, menu, pdf en mails).
- Knoppen: alleen primaire (geel) en secundaire (witte rand) knoppen, geen icoon-tekstlinks als knop.

- `subsidiecheck.html`: subsidiecheck overgenomen van Vermeulen (adres → toevoeging → bedrag vervaagd tot gegevens
  ingevuld → bedrag, ISDE-regel, woning, dakscanknop). ISDE dak: €16,25/m², min 20 m², max 200 m², standaard 65 m²;
  dak per adres = 3D BAG gedeeld door aantal adressen. Lead via `/api/lead` type `subsidie`. Oude
  subsidiecheck-dak/-uitslag zijn weg (redirect in vercel.json).
- `bedankt.html`: bedankpagina na het contactformulier (noindex, voornaam via sessionStorage `bruck-contact-naam`).
- `privacy.html`: privacyverklaring (footerlink Privacy, links bij de akkoord-zin in de dakscan). Werk die bij als er
  een nieuwe dienst bijkomt die persoonsgegevens verwerkt (formulier, mailtool, statistieken).

## SEO (seo/)
- `node seo/bouw.mjs` (Node in ~/.local/node/bin) na elke wijziging in `seo/`. Het script:
  - bouwt de lokale pagina's `dakdekker-<plaats>.html` uit `seo/locaties/<plaats>.json` met sjabloon
    `seo/sjablonen/locatie.html` (afgeleid van dakwerken.html; zelfde opzet voor elke plaats);
  - zet in elke pagina tussen `<!-- SEO:start -->` en `<!-- SEO:end -->` de description, robots, canonical
    (https://bruckdakwerken.nl), Open Graph en JSON-LD (RoofingContractor, WebPage, BreadcrumbList, Service bij
    plaatsen, FAQPage uit `faqSrc` of de FAQ-pagina). Titles en descriptions van vaste pagina's: `seo/paginas.json`;
  - schrijft `sitemap.xml` en `robots.txt`.
- Pas het SEO-blok of de lokale pagina's nooit met de hand aan; altijd via `seo/` en het script.
- Plaatspagina's staan niet in het menu; ze linken naar elkaar ("Ook actief in") en de FAQ-pagina linkt ernaar.
- Nieuwe pagina? Voeg hem toe aan `seo/paginas.json` en draai het script (anders geen SEO-blok).
- vercel.json: 301's van alle oude WordPress-URL's (pagina's, /offerte-aanvragen, /diensten, Yoast-sitemaps, /home,
  /wp-admin), `cleanUrls`, `trailingSlash: false`, en `X-Robots-Tag: noindex` op bruck-dakwerken.vercel.app.
- Interne links altijd naar de schone URL (`/dakwerken`, `/` voor home), nooit `pagina.html`.
- `404.html` is de foutpagina (noindex, `<base href="/">`); `seo/bouw.mjs` slaat hem over.

### SEO-regels (van Tim, 26 nov 2026)
- In titels, descriptions, alt-teksten en structured data altijd de volledige naam **Brück Dak en Zinkwerk**, nooit
  alleen "Brück" (de persoon "Nicky van Brück" mag wel).
- Homepage: geen plaatsnaam in de titel, liefst ook niet in de description.
- Elke titel en description is uniek op de site. Lokale pagina's zijn geen sjabloontekst: titel begint met
  "Dakdekker <plaats>", daarna wat specifiek is voor die plaats (uit de tekst van de pagina zelf).
- Titel max. 60 tekens, description max. 155 tekens.
- Privacy en bedankt: noindex en niet in de sitemap.
- Deelafbeelding (og:image) is op elke pagina dezelfde: `img/deelafbeelding.jpg` (1200x630). De eigen hero-foto van
  een pagina gaat via `afbeelding` in de structured data (primaryImageOfPage).
- Alt-teksten beschrijven wat er echt op de foto staat; bekijk de foto voor je er een schrijft. Geen verzonnen feiten
  (bijv. levensduur, prijzen) in teksten of descriptions: alleen wat al op de site staat of wat Nicky bevestigt.
- Google Bedrijfsprofiel (kgmid /g/11t0qx58sl) staat als sameAs/hasMap in de structured data.

### SEO-agent
- De algemene SEO-agent (repo buildwithblocks/seo-agent) werkt in deze repo. Nieuwe landingspagina's: maak een
  dienstpagina naar het voorbeeld van een bestaande (bijv. `epdm.html`) of een plaatspagina via `seo/locaties/`,
  voeg hem toe aan `seo/paginas.json`, draai `node seo/bouw.mjs` en link hem vanuit een passende pagina.
  Nieuwe diensten ook in het menu (`js/menu.js`, DIENSTEN) en de footer (op alle pagina's) zetten.
- Er is geen build-stap en geen typecheck: controleer lokaal met `python3 scripts/dev-server.py` (poort 4620) dat de
  pagina laadt, alle links werken en er geen fouten in de console staan.

## Deployen (via GitHub)
- Vercel-project `bruck-dakwerken` (team build-with-blocks, Pro), live op https://bruckdakwerken.nl
  (testadres https://bruck-dakwerken.vercel.app, noindex).
- Het project is gekoppeld aan github.com/buildwithblocks/bruck-website:
  - push naar `main` = automatisch live (productie);
  - push naar een andere branch = automatisch een preview-link.
- Werkwijze, lokaal én in de cloud: eerst `git pull`, dan wijzigen, dan committen en pushen. Niet meer handmatig
  `vercel deploy` gebruiken, zodat GitHub en de live site altijd gelijk lopen.
- In een cloud-sessie: werk op een branch en laat Tim de preview-link checken voor je naar `main` merget,
  tenzij hij zegt dat het direct live mag.
- Lokaal op een nieuwe Mac: `npx vercel login` en `npx vercel link --yes --project bruck-dakwerken` (alleen nodig
  voor `vercel env`/logs). Er is geen build-stap (framework Other, output `.`).
- Lokaal bekijken: `python3 scripts/dev-server.py` (poort 4620, schone URL's zoals op Vercel).

## Mails (Resend) – live sinds 26 nov 2026
- Omgevingsvariabelen in Vercel (Production): `RESEND_API_KEY`, `LEAD_TO`=bruckdakenzinkwerk@outlook.com,
  `LEAD_TEST`=0, `SITE_URL`=https://bruckdakwerken.nl. Aanvragen gaan naar Nicky, klanten krijgen hun eigen mail.
- Afzenders: intern `dakscan@bruckdakwerken.nl`, klanten `rapport@bruckdakwerken.nl`. Nooit vanaf buildwithblocks.nl
  naar klanten (Tim wil dat expliciet niet).
- Stuur geen testaanvragen in zonder overleg: die komen echt bij Nicky binnen.

## Domein
- bruckdakwerken.nl bij Hostinger (DNS via dns-parking.com, Hostinger-mail). Gekoppeld aan Vercel op 26 nov 2026:
  A @ 216.150.1.1 + 216.150.16.1, CNAME www → Vercel (www stuurt 308 door naar het hoofddomein), geen AAAA.
  MX/SPF (Hostinger-mail) en de Resend-records (`send.`, `resend._domainkey`) nooit aanraken.
- Sitemap ingediend in Google Search Console (26 nov 2026, 23 pagina's).
- Meten: Vercel Web Analytics + custom events via `js/meet.js` (klikken op bellen/mailen/WhatsApp en knoppen naar
  dakscan/contact/subsidiecheck, met pagina en plek; leads als "Lead - …").

## Stijlregels
- Donker (#161616, vlakken #1F1F1F, formulieren #0B0B0B), accent #DFA701 (hover #C99600), rechte hoeken,
  subtiele lijnen (rgba(255,255,255,.12–.15)). Koppen Factory Sans in hoofdletters, tekst Saira.
- Spacing loopt via `css/ritme.css` (op elke pagina gelinkt). Gebruik in inline styles altijd de variabelen,
  nooit vaste px voor deze afstanden. Desktop ≥1200 / tablet 768–1199 / mobiel ≤767:
  - Secties (padding boven/onder): `--sec-xl` 200/120/80, `--sec-l` 160/96/64, `--sec-m` 104/72/48,
    `--sec-s` 80/56/40, `--sec-xs` 40/32/24.
  - Binnen secties: `--sp-80` 80/56/40, `--sp-64` 64/48/36, `--sp-56` 56/40/32, `--sp-48` 48/36/28,
    `--sp-40` 40/32/24, `--sp-32` 32/24/18, `--sp-28` 28/24/18 (tekst → knop),
    `--sp-24` 24/20/14 (hero-kop → tekst), `--kop-tekst` 20/16/12 (h2 → bodytekst),
    `--label-kop` 10/10/8 (geel label → kop).
  - Ruimte tussen opeenvolgende secties: desktop 175 / tablet 150 / mobiel 125, via `data-m-onder` (vorige
    sectie, onderpadding 0) en `data-m-boven` (volgende sectie) op de `<section>`; hero bovenaan en footer niet.
    Homepage-intro (#intro-inhoud) volgt dezelfde waarden.
  - Mobiel extra (onderaan `css/ritme.css`): bodytekst 15px, blokken met clamp-padding 24px, label "Reactie binnen
    1 werkdag" kleiner. Nieuwe sectie tussen andere secties? Geef haar en de vorige die attributen.
  - Vast op alle schermen: knoppen naast elkaar 10px, tussenkop → tekst 8px, kleine tussenruimtes ≤ 20px.
- Footer staat in `css/footer.css` (ontwerp A): kop "Hoe staat jouw dak ervoor?" (geen plaatsnamen in koppen) + dakscan, logo/adres/KvK +
  "App Nicky"-rij in contactstijl, kolommen Diensten / Direct regelen / Over Brück, onderbalk met
  Made by Build with Blocks. Tekstlinks: hover alleen kleur (wit), geen onderstreping. Op alle pagina's
  dezelfde markup; wijzig die overal tegelijk.
- Geen accenten in koppen met de display-font (gebruik "1" of "een" in plaats van "één").
- Hover-effecten: knoppen en kaarten worden #C99600; pijl-knoppen wisselen de pijl (uit rechts, in van links).

## Teksten
- Schrijf zoals Nicky praat: concreet, kort, gewone woorden. Geen AI-achtige reclametaal zoals "zonder gedoe",
  "zonder zorgen", "waar je op kunt bouwen", "op hoog niveau", "staat voor je klaar", "denkt graag met je mee",
  "aan het goede adres", "zonder kleine lettertjes", "van A tot Z", rijtjes van drie bijvoeglijke naamwoorden of
  woordgrappen in koppen. Liever zeggen wat Nicky doet en wat de klant krijgt.
- Geen plaatsnamen en geen "Brück" (ü) in koppen met Factory Sans; in lopende tekst mag het wel.

## Nog open
- Nicky moet de feiten in de teksten van de lokale pagina's nog nalopen.
