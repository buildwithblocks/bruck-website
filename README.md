# Brück Dak en Zinkwerk website

Statische site (HTML, afbeeldingen in `img/`, fonts in `fonts/`).

## Live zetten op Vercel

1. `npx vercel` in deze map (of importeer de map/repo in het Vercel-dashboard, framework: Other, geen build command, output directory: `.`).
2. `npx vercel --prod` voor productie.
3. Domein koppelen: Vercel-dashboard > Project > Settings > Domains.

`vercel.json` zet `cleanUrls` aan, zodat /epdm werkt naast /epdm.html.
