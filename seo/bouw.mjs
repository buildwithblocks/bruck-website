// Bouwt de lokale SEO-pagina's en zet de SEO-tags op alle pagina's. Draai na elke wijziging in seo/:
//   node seo/bouw.mjs
// - seo/locaties/*.json      -> dakdekker-<plaats>.html (sjabloon: seo/sjablonen/locatie.html)
// - seo/paginas.json          -> title, description en kruimelpad van de vaste pagina's
// - in elke pagina: blok tussen <!-- SEO:start --> en <!-- SEO:end --> in de <head> (meta, canonical, Open Graph, JSON-LD)
// - sitemap.xml en robots.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lees = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const schrijf = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const kaal = (t) => String(t).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const cfg = JSON.parse(lees('seo/paginas.json'));
const BASIS = cfg.basis.replace(/\/$/, '');
const url = (bestand) => (bestand === 'index.html' ? BASIS + '/' : BASIS + '/' + bestand.replace(/\.html$/, ''));
const vandaag = new Date().toISOString().slice(0, 10);

const BEDRIJF = {
  '@type': 'RoofingContractor', '@id': BASIS + '/#bedrijf', name: 'Brück Dak en Zinkwerk', url: BASIS + '/',
  logo: BASIS + '/img/2eb862934a76df52611f70dd21ad94cc.png', image: BASIS + '/' + cfg.standaardAfbeelding,
  telephone: '+31619623366', email: 'bruckdakenzinkwerk@outlook.com', founder: { '@type': 'Person', name: 'Nicky van Brück' },
  address: { '@type': 'PostalAddress', streetAddress: 'Goudwindestraat 39', postalCode: '6576 CD', addressLocality: 'Ooij', addressCountry: 'NL' },
  geo: { '@type': 'GeoCoordinates', latitude: 51.8549581, longitude: 5.93868089 }, // PDOK, Goudwindestraat 39 Ooij
  identifier: { '@type': 'PropertyValue', propertyID: 'KvK', value: '85783439' },
  // Google Bedrijfsprofiel (Knowledge Graph-ID /g/11t0qx58sl), gedeeld door Tim op 26 nov 2026.
  hasMap: 'https://share.google/7mUppOPvDw3Y99BtH',
  sameAs: ['https://www.google.com/search?kgmid=/g/11t0qx58sl', 'https://www.facebook.com/bruckdakenzinkwerk/', 'https://www.instagram.com/bruckdakenzinkwerk/'],
};

/* ---------- lokale pagina's ---------- */
const locaties = fs.readdirSync(path.join(ROOT, 'seo/locaties')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(lees('seo/locaties/' + f))).sort((a, b) => (a.volgorde || 99) - (b.volgorde || 99));
BEDRIJF.areaServed = locaties.map((l) => ({ '@type': 'City', name: l.plaats }));

const sjabloon = lees('seo/sjablonen/locatie.html');
const LINK = 'style="color: #DFA701; text-decoration: underline; text-underline-offset: 3px"';
const P1 = 'margin: var(--kop-tekst) 0 0; max-width: 490px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.75)';
const PN = 'margin: 16px 0 0; max-width: 490px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.75)';
const jsStr = (t) => JSON.stringify(String(t));

function plaatsenBlok(huidig) {
  const links = locaties.filter((l) => l.slug !== huidig).map((l) =>
    `<a href="/${l.slug}" style="display: inline-flex; align-items: center; height: 44px; padding: 0 16px; border: 1px solid rgba(255,255,255,0.18); color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600">${esc(l.plaats)}</a>`).join('');
  return `<section data-m-onder data-m-boven style="padding: 0 clamp(16px, 3.6vw, 52px)">
  <div style="max-width: 1240px; margin: 0 auto">
    <span style="display: block; font-size: 14px; font-weight: 700; color: #DFA701; text-transform: uppercase">Werkgebied</span>
    <h2 style="margin: var(--label-kop) 0 0; font-family: 'Factory Sans', 'Helvetica Neue', 'Helvetica', Arial, sans-serif; font-weight: 600; font-size: clamp(30px, 3.4vw, 44px); line-height: 1.05; letter-spacing: -0.03em; text-transform: uppercase; color: #FFFFFF">Ook actief in</h2>
    <p style="margin: var(--kop-tekst) 0 0; max-width: 560px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.75)">Onder andere in deze plaatsen. Woon je ergens anders in de buurt? App of bel Nicky, dan kijken we wat er kan.</p>
    <div style="margin-top: var(--sp-28); display: flex; flex-wrap: wrap; gap: 10px">${links}</div>
  </div>
</section>`;
}

for (const l of locaties) {
  const intro = l.alineas.map((a, i) => `<p style="${i ? PN : P1}">${a.replace(/<a href=/g, `<a ${LINK} href=`)}</p>`).join('');
  const faq = '[\n      ' + l.faq.map((f) => `{ q: ${jsStr(f.vraag)}, a: ${jsStr(f.antwoord)} }`).join(',\n      ') + '\n    ]';
  const vul = { TITLE: esc(l.seo.title), H1: l.h1, HERO_INTRO: esc(l.heroIntro), HERO_IMG: l.heroImg, HERO_ALT: esc(l.heroAlt || ''), LABEL: esc(l.label), INTRO_TITEL: esc(l.introTitel),
    INTRO_HTML: intro, IMG: l.img, IMG_ALT: esc(l.imgAlt), FAQ_TITEL: l.faqTitel, FAQ_SRC: faq, PLAATSEN: plaatsenBlok(l.slug) };
  const html = sjabloon.replace(/%%([A-Z0-9_]+)%%/g, (m, k) => (k in vul ? vul[k] : m));
  schrijf(l.slug + '.html', html);
  cfg.paginas[l.slug + '.html'] = { title: l.seo.title, description: l.seo.description, kruimel: 'Dakdekker ' + l.plaats, afbeelding: l.heroImg, afbeeldingAlt: l.heroAlt, locatie: l };
}

/* ---------- SEO-blok in elke pagina ---------- */
function faqsVan(html, bestand) {
  const uit = [];
  const m = bestand === 'faq.html' ? null : html.match(/const faqSrc = \[([\s\S]*?)\];/);
  if (m) {
    const re = /q:\s*(['"])((?:\\.|(?!\1).)*)\1\s*,\s*a:\s*(['"])((?:\\.|(?!\3).)*)\3/g; let x;
    while ((x = re.exec(m[1]))) uit.push([x[2].replace(/\\(['"])/g, '$1'), x[4].replace(/\\(['"])/g, '$1')]);
  }
  if (bestand === 'faq.html') {
    const re = /<span class="fq-q">([\s\S]*?)<\/span>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g; let x;
    while ((x = re.exec(html))) uit.push([kaal(x[1]), kaal(x[2])]);
  }
  return uit;
}

function seoBlok(bestand, html) {
  const p = cfg.paginas[bestand]; if (!p) return null;
  // Deelafbeelding (Open Graph) is op elke pagina dezelfde; de hoofdfoto van de pagina zelf gaat in de structured data.
  const u = url(bestand), og = BASIS + '/' + cfg.standaardAfbeelding, img = BASIS + '/' + (p.afbeelding || cfg.standaardAfbeelding);
  const graph = [bestand === 'index.html' ? BEDRIJF : { '@type': 'RoofingContractor', '@id': BEDRIJF['@id'], name: BEDRIJF.name, url: BEDRIJF.url, telephone: BEDRIJF.telephone, address: BEDRIJF.address }];
  graph.push({ '@type': 'WebPage', '@id': u + '#pagina', url: u, name: p.title, description: p.description, inLanguage: 'nl-NL', isPartOf: { '@type': 'WebSite', '@id': BASIS + '/#site', url: BASIS + '/', name: 'Brück Dak en Zinkwerk' }, about: { '@id': BEDRIJF['@id'] }, primaryImageOfPage: { '@type': 'ImageObject', url: img } });
  if (p.kruimel) graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: BASIS + '/' }, { '@type': 'ListItem', position: 2, name: p.kruimel, item: u }] });
  if (p.locatie) graph.push({ '@type': 'Service', name: 'Dakdekker ' + p.locatie.plaats, serviceType: 'Dakdekker', provider: { '@id': BEDRIJF['@id'] }, areaServed: { '@type': 'City', name: p.locatie.plaats }, url: u });
  const faqs = faqsVan(html, bestand);
  if (faqs.length) graph.push({ '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const r = [
    '<!-- SEO:start (gegenereerd door seo/bouw.mjs, niet met de hand aanpassen) -->',
    `<meta name="description" content="${esc(p.description)}">`,
    p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">',
    `<link rel="canonical" href="${u}">`,
    '<meta property="og:locale" content="nl_NL">', '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Brück Dak en Zinkwerk">',
    `<meta property="og:title" content="${esc(p.title)}">`, `<meta property="og:description" content="${esc(p.description)}">`,
    `<meta property="og:url" content="${u}">`, `<meta property="og:image" content="${og}">`, '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(cfg.standaardAfbeeldingAlt)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`,
    '<!-- SEO:end -->'].join('\n');
  return r;
}

const bestanden = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
for (const f of bestanden) {
  let html = lees(f);
  const blok = seoBlok(f, html);
  if (!blok) { console.warn('geen SEO-gegevens voor', f); continue; }
  html = html.replace(/\n?<!-- SEO:start[\s\S]*?<!-- SEO:end -->/, '');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(cfg.paginas[f].title)}</title>\n${blok}`);
  schrijf(f, html);
}

/* ---------- sitemap en robots ---------- */
const inSitemap = bestanden.filter((f) => cfg.paginas[f] && !cfg.paginas[f].noindex).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
schrijf('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  inSitemap.map((f) => `  <url><loc>${url(f)}</loc><lastmod>${vandaag}</lastmod></url>`).join('\n') + '\n</urlset>\n');
schrijf('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${BASIS}/sitemap.xml\n`);
console.log(`${locaties.length} lokale pagina's, SEO op ${bestanden.length} pagina's, ${inSitemap.length} in de sitemap`);
