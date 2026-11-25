// POST /api/rapport: het dakrapport (pdf), overgenomen van de Vermeulen-dakscan (src/lib/rapport + api/dakscan/rapport).
//  - standaard: maakt het rapport, mailt het naar de klant (KLANT_FROM, in testmodus naar LEAD_TO) en stuurt Nicky
//    de aanvraag met het rapport als bijlage. Geeft { ok, mail }.
//  - ?download=1: geeft dezelfde pdf terug (downloadknop op het bedankscherm).
// Score en uitkomst rekent de server zelf opnieuw uit, zoals bij Vermeulen (bereken() in scan.ts).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const R = require('@react-pdf/renderer');
const React = require('react');
const H = require('./_huisstijl.js');
const { Document, Page, View, Text, Image, Link, Svg, Polygon, Rect, Circle, Path, Defs, LinearGradient, Stop, Font, StyleSheet, renderToBuffer } = R;
const h = React.createElement;

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HIER, '..');
const FONTS = path.join(HIER, '_fonts');
const WMS = 'https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0';

/* ---------- dakscore: exact zoals Vermeulen (scan.ts) ---------- */
const LEVENSDUUR = { plat: 25, schuin: 50, combinatie: 35, onbekend: 40 };
const CURVE = [[0, 9.6], [0.5, 8.4], [0.8, 7.0], [1.0, 5.8], [1.3, 4.0], [1.7, 2.8]];
const TYPE_CORRECTIE = { plat: -0.6, combinatie: -0.3, schuin: 0, onbekend: -0.3 };
const LEEFTIJD_VERNIEUWD = { recent: 5, middel: 15, lang: 25 };
const VERNIEUWD = ['nee', 'recent', 'middel', 'lang', 'weetniet'];
const lerp = (x) => {
  if (x <= CURVE[0][0]) return CURVE[0][1];
  for (let i = 1; i < CURVE.length; i++) { const [x1, y1] = CURVE[i], [x0, y0] = CURVE[i - 1]; if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0); }
  return CURVE[CURVE.length - 1][1];
};
function bereken(bouwjaar, daktype, aw = {}, jaar = new Date().getFullYear()) {
  const levensduur = LEVENSDUUR[daktype];
  const woning = bouwjaar ? Math.max(0, jaar - bouwjaar) : undefined;
  const v = aw.vernieuwd ? LEEFTIJD_VERNIEUWD[aw.vernieuwd] : undefined;
  const leeftijd = v !== undefined ? Math.min(v, woning ?? v) : woning;
  let raw = leeftijd === undefined ? 6.0 : lerp(leeftijd / levensduur) + TYPE_CORRECTIE[daktype];
  if (aw.klachten) raw = Math.min(5.4, raw - 2.0);
  const score = Math.round(Math.min(9.8, Math.max(1.5, raw)) * 10) / 10;
  const uitkomst = score >= 7.5 ? 'groen' : score >= 5.5 ? 'oranje' : 'rood';
  return leeftijd === undefined ? { score, uitkomst, levensduur } : { score, uitkomst, levensduur, leeftijd, rest: levensduur - leeftijd };
}
const cijfer = (n) => n.toFixed(1).replace('.', ',');
const leeftijdKlasse = (l) => (l === undefined ? undefined : l >= 45 ? '45+ jaar' : l >= 30 ? '30–45 jaar' : l >= 20 ? '20–30 jaar' : l >= 10 ? '10–20 jaar' : '0–10 jaar');

/* ---------- teksten (Vermeulen, aangepast voor Brück) ---------- */
const T = {
  label: 'Persoonlijk dakrapport', titel: 'Dakrapport', opgesteldVoor: 'Opgesteld voor',
  intro: 'Bedankt voor het doen van de dakscan. In dit rapport lees je hoe je dak ervoor staat volgens officiële gegevens en de luchtfoto, waar je op moet letten en hoeveel subsidie je kunt krijgen als je je dak laat isoleren.',
  fotoTekst: 'De gele lijn is de omtrek van je woning volgens het Kadaster.', fotoLabel: 'Jouw woning',
  fotoBron: 'Luchtfoto: Beeldmateriaal Nederland (PDOK). Pandgegevens: BAG en 3D BAG.',
  scoreTitel: 'Jouw dakscore',
  scoreUitleg: 'De dakscore is een cijfer van 1 tot 10. Hij volgt uit de leeftijd van je dak en de gebruikelijke levensduur van jouw type dak. Is het dak vernieuwd, dan rekenen we vanaf dat moment; anders vanaf het bouwjaar van je woning. Lekkage, vocht of losse pannen tellen ook mee. Platte daken zijn gevoeliger voor water en scoren bij dezelfde leeftijd iets lager.',
  klachtenTekst: 'Je gaf aan dat je lekkage, vocht of losse pannen ziet. Dat telt mee in je score. Laat dit liever snel nakijken: kleine schade wordt bij een dak vaak snel groter.',
  schaal: ['Actie nodig', 'Aandacht nodig', 'Goede staat'],
  gegevensTitel: 'Je dakgegevens', gegevensTekst: 'Deze gegevens komen uit openbare bronnen van het Kadaster. Tijdens een bezoek meet Nicky alles precies op.',
  uitleg: {
    dakoppervlak: 'Alle dakvlakken samen, berekend uit het 3D-model van je woning.',
    daktype: 'Afgeleid uit de verhouding tussen platte en schuine dakvlakken.',
    dakhelling: 'De gemiddelde hoek van de schuine dakvlakken.',
    bouwjaar: 'Volgens de BAG. Is je dak al eens vernieuwd, dan is het dak jonger dan de woning.',
    leeftijd: 'We gaan uit van het oorspronkelijke dak uit het bouwjaar.',
    levensduur: 'Bitumen en EPDM gaan gemiddeld 20 tot 30 jaar mee, dakpannen 50 jaar of langer.',
    leeftijdVernieuwd: 'Volgens jouw opgave is het dak {wanneer} vernieuwd.',
  },
  aandachtTitel: 'Aandachtspunten voor jouw dak', zelfTitel: 'Dit kun je zelf checken',
  zelfPunten: [
    ['Kijk na een flinke regenbui op zolder of onder het dakbeschot naar vochtplekken of verkleuring.', 'alle'],
    ['Kijk of de dakgoten vrij zijn van bladeren en of het water goed wegloopt.', 'alle'],
    ['Bekijk vanaf de straat of er pannen verschoven, gebroken of begroeid zijn.', 'schuin'],
    ['Let op blazen, scheuren of plassen die na een dag nog op je platte dak staan.', 'plat'],
    ['Controleer het lood en de kit rond de schoorsteen en dakramen.', 'alle'],
  ],
  subsidieTitel: 'Subsidie voor dakisolatie',
  subsidieTekst: 'Laat je je dak isoleren, dan krijg je ISDE-subsidie van de overheid. We rekenen met de regels van RVO.',
  subsidieLabel: 'Indicatie ISDE-subsidie', subsidieBerekening: '{m2} dak × {tarief} per m²',
  subsidieGedeeld: 'In je pand zitten {n} adressen. We rekenen met jouw deel van het dak.',
  subsidieOnderMinimum: 'Je dak is kleiner dan {min} m². Daarvoor geldt geen ISDE-subsidie. Misschien heeft je gemeente een eigen regeling.',
  subsidieOnbekend: 'We konden je dakoppervlak niet bepalen. Tijdens een bezoek meet Nicky je dak op en rekent hij je subsidie precies uit.',
  subsidiePunten: [
    'Je vraagt de ISDE aan bij RVO na het werk, binnen 24 maanden.',
    'Het werk moet door een bedrijf worden uitgevoerd. Brück levert alle gegevens die RVO vraagt.',
    'Laat je binnen 24 maanden nog iets isoleren, dan verdubbelt het bedrag per m².',
  ],
  subsidieDisclaimer: 'Aan deze indicatie kun je geen rechten ontlenen. Voorwaarden en bedragen van RVO kunnen veranderen. Check altijd rvo.nl.',
  stappenTitel: 'Hoe nu verder?',
  stappenInspectie: [
    ['Nicky neemt binnen 2 werkdagen contact op', 'Jullie plannen samen een moment dat jou uitkomt.'],
    ['Nicky bekijkt je dak', 'Gratis en vrijblijvend. Hij kijkt op het dak en meet alles op.'],
    ['Je krijgt eerlijk advies', 'Je hoort wat nodig is en wat kan wachten. Pas daarna volgt een offerte, als je dat wilt.'],
  ],
  stappenZonder: [
    ['Lees je rapport rustig door', 'Check de punten die je zelf kunt bekijken.'],
    ['Wil je dat Nicky komt kijken?', 'Bel of app hem. Hij bekijkt je dak gratis en vrijblijvend.'],
    ['Je krijgt eerlijk advies', 'Je hoort wat nodig is en wat kan wachten.'],
  ],
  contactTitel: 'Vragen over je rapport?', contactTekst: 'Bel, app of mail Nicky. Hij denkt graag met je mee.',
  disclaimer: 'Dit rapport is een indicatie op basis van openbare gegevens (BAG, 3D BAG en luchtfoto\'s van PDOK). Het dak kan in werkelijkheid jonger, ouder of anders opgebouwd zijn. Pas op locatie zien we echt hoe je dak ervoor staat. Aan dit rapport kun je geen rechten ontlenen.',
};
const SCORES = {
  groen: ['Je dak ziet er goed uit', 'Op basis van de gegevens lijkt je dak in goede staat. Wil je zeker weten dat alles klopt? Dan komt Nicky vrijblijvend even kijken.',
    [['Laat je dakgoten één keer per jaar controleren, zeker onder bomen.', 'alle'], ['Controleer na een storm of pannen en nokvorsten nog goed liggen.', 'schuin'], ['Houd je platte dak vrij van bladeren en takken, zodat het water weg kan.', 'plat']]],
  oranje: ['Je dak verdient aandacht', 'De gegevens laten signalen zien die we serieus nemen. Nu nog klein, maar wachten maakt het groter.',
    [['Daken van deze leeftijd hebben vaak last van verschoven of poreuze pannen.', 'schuin'], ['Op een plat dak van deze leeftijd zie je vaak blazen, scheuren of losse naden.', 'plat'], ['Controleer de dakgoten en het lood rond de schoorsteen.', 'alle']]],
  rood: ['Je dak heeft snel actie nodig', 'De gegevens en je antwoorden wijzen op een dak dat snel aandacht nodig heeft. Lekt het nu? Bel Nicky direct op 06 19 62 33 66.',
    [['Bij oudere bitumen daken zie je vaak blaasvorming en naadlekkage.', 'plat'], ['Bij oudere pannendaken zie je vaak poreuze pannen en loszittende nokvorsten.', 'schuin'], ['Laat het dak op korte termijn inspecteren.', 'alle']]],
};
const DAKTYPES = { plat: 'Plat dak', schuin: 'Hellend dak', combinatie: 'Plat en hellend', onbekend: 'Onbekend' };
const VERN_TXT = { nee: 'Nee', recent: 'Minder dan 10 jaar geleden', middel: '10 tot 20 jaar geleden', lang: 'Meer dan 20 jaar geleden', weetniet: 'Weet ik niet' };
const vul = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));
const filter = (lijst, daktype) => lijst.filter(([, t]) => t === 'alle' || daktype === 'combinatie' || t === daktype).map(([p]) => p);
const euro = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const euroM2 = (n) => '€' + n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TARIEF = { tarief1: 16.25, min: 20, max: 200 }; // ISDE dakisolatie, één maatregel (zelfde als Vermeulen)

/* ---------- invoer controleren (zoals Vermeulen input.ts) ---------- */
const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const inRd = (x, y) => x > -10000 && x < 300000 && y > 280000 && y < 630000;
const emailGeldig = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const telGeldig = (v) => v.replace(/[^\d]/g, '').length >= 10;
function leesInput(b) {
  if (!b || typeof b !== 'object') return { fout: 'body' };
  const s = b.scan || {}, a = s.adres || {};
  const naam = str(b.naam, 120), telefoon = str(b.telefoon, 40), email = str(b.email, 200);
  if (!naam || !emailGeldig(email) || !telGeldig(telefoon)) return { fout: 'contact' };
  const rd = Array.isArray(a.rd) ? a.rd.map(num) : [];
  const kader = Array.isArray(s.kader) ? s.kader.map(num) : [];
  if (rd.length !== 2 || rd.some((x) => x === undefined) || !inRd(rd[0], rd[1])) return { fout: 'adres' };
  if (kader.length !== 3 || kader.some((x) => x === undefined) || !inRd(kader[0], kader[1]) || kader[2] <= 0 || kader[2] > 2000) return { fout: 'kader' };
  const contour = Array.isArray(s.contour) ? s.contour.slice(0, 2000).map((p) => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [])).filter((p) => p.length === 2 && p[0] !== undefined && p[1] !== undefined && inRd(p[0], p[1])) : undefined;
  const daktype = Object.keys(LEVENSDUUR).includes(s.daktype) ? s.daktype : 'onbekend';
  const bj = num(s.bouwjaar);
  const aw = s.antwoorden || {};
  const posInt = (v, max) => { const n = num(v); return n !== undefined && n > 0 && n < max ? n : undefined; };
  return {
    naam, telefoon, email, vraag: str(b.vraag, 2000) || undefined, inspectie: b.inspectie === true, website: str(b.website),
    scan: {
      adres: { weergave: str(a.weergave), straat: str(a.straat, 120), huis: str(a.huis, 20), postcode: str(a.postcode, 10), plaats: str(a.plaats, 80), gemeente: str(a.gemeente, 80) || undefined, rd },
      bouwjaar: bj && bj > 1000 && bj < 2100 ? Math.round(bj) : undefined, daktype,
      oppervlak: posInt(s.oppervlak, 100000), oppervlakSchuin: posInt(s.oppervlakSchuin, 100000), oppervlakPlat: posInt(s.oppervlakPlat, 100000),
      helling: posInt(s.helling, 90), adressen: posInt(s.adressen, 10000), pandId: str(s.pandId, 40) || undefined,
      kader, contour: contour && contour.length > 2 ? contour : undefined,
      antwoorden: { vernieuwd: VERNIEUWD.includes(aw.vernieuwd) ? aw.vernieuwd : undefined, klachten: typeof aw.klachten === 'boolean' ? aw.klachten : undefined },
    },
  };
}

/* ---------- luchtfoto en lettertypes ---------- */
async function luchtfoto(kader, contour, verhouding) {
  const [x, y, size] = kader;
  let [cx, cy, hh] = [x + size / 2, y + size / 2, size];
  if (contour && contour.length) {
    const xs = contour.map((p) => p[0]), ys = contour.map((p) => p[1]);
    const ex = Math.max(...xs) - Math.min(...xs), ey = Math.max(...ys) - Math.min(...ys);
    cx = (Math.max(...xs) + Math.min(...xs)) / 2; cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    hh = Math.max(42, ey * 1.6 + 16, (ex * 1.6 + 16) / verhouding);
  }
  const w = hh * verhouding;
  const [x0, y0, x1, y1] = [cx - w / 2, cy - hh / 2, cx + w / 2, cy + hh / 2];
  const px = 1600;
  const url = `${WMS}?service=WMS&request=GetMap&version=1.3.0&layers=Actueel_orthoHR&styles=&crs=EPSG:28992&bbox=${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)}&width=${px}&height=${Math.round(px / verhouding)}&format=image/jpeg`;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok || !(r.headers.get('content-type') || '').includes('jpeg')) return undefined;
    const data = Buffer.from(await r.arrayBuffer());
    const punten = contour ? contour.map(([a, b]) => `${(a - x0).toFixed(2)},${(y1 - b).toFixed(2)}`).join(' ') : undefined;
    return { data, w, h: hh, punten, lijn: (2.2 * w) / 515 };
  } catch { return undefined; } finally { clearTimeout(t); }
}

let fontsKlaar = false;
function fonts() {
  if (fontsKlaar) return;
  Font.register({ family: 'Factory', src: path.join(FONTS, 'factory-sans-600.woff2') });
  Font.register({ family: 'Saira', fonts: [[400, 'Regular'], [500, 'Medium'], [600, 'SemiBold'], [700, 'Bold'], [800, 'ExtraBold']].map(([w, n]) => ({ src: path.join(FONTS, `Saira-${n}.ttf`), fontWeight: w })) });
  Font.registerHyphenationCallback((w) => [w]);
  fontsKlaar = true;
}
const bestand = (rel) => { try { return fs.readFileSync(path.join(ROOT, rel)); } catch { return undefined; } };
// De Factory Sans-subset van de site mist een paar tekens (o.a. 0 ? - /). Die zetten we in Saira ExtraBold,
// net als de browser op de site doet. F(tekst) geeft dus tekst met losse Saira-stukjes erin.
const MIST = /([!#\-\/0=?@\u00AD\u00B5\u012C\u012D\u013F\u0140\u0149-\u014B\u0180-\u024F]+)/;
const F = (t) => String(t).split(MIST).filter(Boolean).map((x, i) => (MIST.test(x) ? h(Text, { key: i, style: { fontFamily: 'Saira', fontWeight: 800 } }, x) : x));

/* ---------- het rapport ---------- */
const GEEL = '#DFA701', ZWART = '#0B0B0B', TEKST = '#3A3A3A', GRIJS = '#6A6A6A', LIJN = '#ECE7DA', LICHT = '#FBF6E4';
const KLEUR = { groen: { ink: '#2F8A47', tint: '#EAF6EC', pill: '#7CC68D', pillTxt: ZWART }, oranje: { ink: '#C9690F', tint: '#FDF1E3', pill: '#E8913A', pillTxt: ZWART }, rood: { ink: '#C0432C', tint: '#FBECE9', pill: '#E5674F', pillTxt: '#FFFFFF' } };
const FOTO_H = 250, W = 515;
const s = StyleSheet.create({
  page: { fontFamily: 'Saira', fontSize: 10, color: ZWART, paddingTop: 36, paddingBottom: 54, paddingHorizontal: 40, backgroundColor: '#FFFFFF' },
  label: { fontSize: 8, fontWeight: 800, letterSpacing: 1.3, textTransform: 'uppercase', color: '#B88A00' },
  h1: { fontFamily: 'Factory', fontSize: 46, lineHeight: 1, textTransform: 'uppercase', color: ZWART },
  h2: { fontFamily: 'Factory', fontSize: 24, lineHeight: 1, textTransform: 'uppercase', color: ZWART },
  p: { fontSize: 10, lineHeight: 1.6, color: TEKST },
  klein: { fontSize: 8, lineHeight: 1.5, color: GRIJS },
  footer: { position: 'absolute', left: 40, right: 40, bottom: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: LIJN, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: GRIJS },
});
const Kop = (d) => h(View, { fixed: true, style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: LIJN } },
  h(Image, { src: d.logo, style: { height: 34, width: 65 } }),
  h(Text, { style: { fontSize: 8, fontWeight: 700, color: GRIJS } }, `${T.titel}  ·  ${d.adresKop}, ${d.adresSub}`));
const Voet = (d) => [
  h(View, { key: 'band', fixed: true, style: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: GEEL } }),
  h(View, { key: 'voet', fixed: true, style: s.footer },
    h(Text, null, h(Text, { style: { fontWeight: 800, color: ZWART } }, H.BRUCK.naam), `   ${H.BRUCK.tel}   ${H.BRUCK.mail}   ${d.website}`),
    h(Text, { render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` })),
];
const Bol = () => h(View, { style: { width: 5, height: 5, backgroundColor: GEEL, marginTop: 5, marginRight: 9 } });
const Vink = () => h(Svg, { width: 14, height: 14, viewBox: '0 0 14 14', style: { marginRight: 9, marginTop: 1 } },
  h(Rect, { x: 0, y: 0, width: 14, height: 14, fill: GEEL }),
  h(Path, { d: 'M4 7.2 6.1 9.2 10 5', stroke: ZWART, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }));
function Kleurbalk(d) {
  const BW = 300, x = Math.min(0.96, Math.max(0.04, d.marker)) * BW;
  return h(View, null,
    h(Svg, { width: BW, height: 16, viewBox: `0 0 ${BW} 16` },
      h(Defs, null, h(LinearGradient, { id: 'g', x1: '0', y1: '0', x2: '1', y2: '0' }, h(Stop, { offset: '0', stopColor: '#E5674F' }), h(Stop, { offset: '0.5', stopColor: '#E8913A' }), h(Stop, { offset: '1', stopColor: '#7CC68D' }))),
      h(Rect, { x: 0, y: 4.5, width: BW, height: 7, fill: 'url(#g)' }),
      h(Circle, { cx: x, cy: 8, r: 6.5, fill: '#FFFFFF', stroke: ZWART, strokeWidth: 2.5 })),
    h(View, { style: { width: BW, flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 } }, T.schaal.map((l, i) => h(Text, { key: i, style: { fontSize: 7.5, fontWeight: 700, color: GRIJS } }, l))));
}
function Luchtfoto(d, w, hh) {
  const f = d.foto;
  return h(View, { style: { width: w, height: hh, overflow: 'hidden', backgroundColor: '#E9E6E1', position: 'relative' } }, ...(f ? [
    h(Image, { key: 'i', src: f.data, style: { position: 'absolute', left: 0, top: 0, width: w, height: hh, objectFit: 'cover' } }),
    f.punten ? h(Svg, { key: 's', width: w, height: hh, viewBox: `0 0 ${f.w} ${f.h}`, style: { position: 'absolute', left: 0, top: 0 } }, h(Polygon, { points: f.punten, fill: GEEL, fillOpacity: 0.22, stroke: GEEL, strokeWidth: f.lijn, strokeLinejoin: 'round' })) : null,
    f.punten ? h(View, { key: 'l', style: { position: 'absolute', left: 14, bottom: 14, backgroundColor: ZWART, paddingVertical: 6, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' } },
      h(View, { style: { width: 9, height: 9, borderWidth: 1.8, borderColor: GEEL, backgroundColor: '#5A4A10', marginRight: 6 } }), h(Text, { style: { fontSize: 8.5, fontWeight: 800, color: '#FFFFFF' } }, T.fotoLabel)) : null,
  ] : []));
}

function Rapport(d) {
  const k = KLEUR[d.uitkomst];
  return h(Document, { title: `${T.titel} ${d.adresKop}, ${d.adresSub}`, author: H.BRUCK.naam, creator: H.BRUCK.naam, producer: H.BRUCK.naam, language: 'nl' },
    // 1. voorblad
    h(Page, { size: 'A4', style: s.page },
      h(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' } },
        h(Image, { src: d.logo, style: { height: 54, width: 104 } }),
        h(View, { style: { alignItems: 'flex-end', paddingTop: 4 } },
          h(Text, { style: { ...s.label, color: GRIJS } }, T.titel),
          h(Text, { style: { fontSize: 9, fontWeight: 700, marginTop: 4 } }, d.datum),
          h(Text, { style: { fontSize: 9, color: GRIJS, marginTop: 2 } }, `${T.opgesteldVoor} `, h(Text, { style: { fontWeight: 700, color: ZWART } }, d.naam)))),
      h(View, { style: { marginTop: 30 } },
        h(Text, { style: s.label }, T.label),
        h(Text, { style: { ...s.h1, marginTop: 10 } }, ...F(d.adresKop)),
        h(Text, { style: { fontSize: 15, fontWeight: 700, color: TEKST, marginTop: 6 } }, d.adresSub),
        h(Text, { style: { ...s.p, marginTop: 12, maxWidth: 450 } }, T.intro)),
      h(View, { style: { marginTop: 18 } }, Luchtfoto(d, W, FOTO_H), h(Text, { style: { ...s.klein, marginTop: 7 } }, (d.foto && d.foto.punten ? T.fotoTekst + ' ' : '') + T.fotoBron)),
      h(View, { style: { marginTop: 14 }, wrap: false },
        h(View, { style: { flexDirection: 'row', backgroundColor: k.tint, paddingVertical: 18, paddingHorizontal: 22 } },
          h(View, { style: { width: 150 } },
            h(Text, { style: { fontSize: 8, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: TEKST } }, T.scoreTitel),
            h(View, { style: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 } },
              h(Text, { style: { fontFamily: 'Factory', fontSize: 66, lineHeight: 1, color: k.ink } }, ...F(d.score)),
              h(Text, { style: { fontSize: 13, fontWeight: 700, color: GRIJS, marginLeft: 6, marginBottom: 6 } }, '/ 10'))),
          h(View, { style: { flex: 1, paddingLeft: 10 } },
            h(View, { style: { alignSelf: 'flex-start', backgroundColor: k.pill, paddingVertical: 5, paddingHorizontal: 11 } }, h(Text, { style: { fontSize: 9, fontWeight: 800, color: k.pillTxt } }, d.scoreLabel)),
            h(Text, { style: { ...s.p, marginTop: 9, marginBottom: 12 } }, d.scoreTekst),
            Kleurbalk(d))),
        h(Text, { style: { ...s.klein, marginTop: 7 } }, T.scoreUitleg)),
      ...Voet(d)),
    // 2. dakgegevens, aandachtspunten, zelf checken
    h(Page, { size: 'A4', style: s.page }, Kop(d),
      h(View, { wrap: false },
        h(Text, { style: s.h2 }, ...F(T.gegevensTitel)),
        h(Text, { style: { ...s.p, marginTop: 10 } }, T.gegevensTekst),
        h(View, { style: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginRight: -10 } }, d.feiten.map((f, i) =>
          h(View, { key: i, style: { width: (W - 20) / 3, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: LIJN, paddingVertical: 11, paddingHorizontal: 12 } },
            h(Text, { style: { fontSize: 8, fontWeight: 700, color: GRIJS } }, f.label),
            h(Text, { style: { fontSize: 14, fontWeight: 800, marginTop: 3 } }, f.value),
            f.uitleg ? h(Text, { style: { fontSize: 8, lineHeight: 1.45, color: GRIJS, marginTop: 6 } }, f.uitleg) : null)))),
      h(View, { style: { marginTop: 26, flexDirection: 'row' }, wrap: false }, [
        { titel: T.aandachtTitel, lijst: d.aandacht, vink: false, bg: LICHT },
        { titel: T.zelfTitel, lijst: d.zelf, vink: true, bg: '#F3F3F1' },
      ].map((b, i) => h(View, { key: i, style: { flex: 1, marginLeft: i ? 14 : 0, backgroundColor: b.bg, padding: 18 } },
        h(Text, { style: { fontFamily: 'Factory', fontSize: 18, lineHeight: 1, textTransform: 'uppercase' } }, ...F(b.titel)),
        h(View, { style: { marginTop: 10 } }, b.lijst.map((p, j) => h(View, { key: j, style: { flexDirection: 'row', marginTop: j ? 8 : 0 } }, b.vink ? Vink() : Bol(), h(Text, { style: { fontSize: 9.5, lineHeight: 1.5, color: TEKST, flex: 1 } }, p))))))),
      ...Voet(d)),
    // 3. subsidie, vervolgstappen, contact
    h(Page, { size: 'A4', style: s.page }, Kop(d),
      h(View, { wrap: false },
        h(Text, { style: s.h2 }, ...F(T.subsidieTitel)),
        h(Text, { style: { ...s.p, marginTop: 10 } }, T.subsidieTekst),
        h(View, { style: { flexDirection: 'row', marginTop: 12, backgroundColor: LICHT, padding: 20 } },
          h(View, { style: { width: 210, paddingRight: 18, borderRightWidth: 1, borderRightColor: '#EADFB8' } },
            h(Text, { style: { fontSize: 8, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: TEKST } }, T.subsidieLabel),
            d.subsidie.bedrag ? h(Text, { style: { fontFamily: 'Factory', fontSize: 42, lineHeight: 1, color: '#B88A00', marginTop: 12 } }, ...F(d.subsidie.bedrag)) : null,
            d.subsidie.berekening ? h(Text, { style: { fontSize: 9.5, fontWeight: 700, marginTop: 12 } }, d.subsidie.berekening) : null,
            ...d.subsidie.notities.map((n, i) => h(Text, { key: 'n' + i, style: { fontSize: 8.5, lineHeight: 1.5, color: TEKST, marginTop: 6 } }, n))),
          h(View, { style: { flex: 1, paddingLeft: 18, justifyContent: 'center' } }, T.subsidiePunten.map((p, i) => h(View, { key: i, style: { flexDirection: 'row', marginBottom: i < T.subsidiePunten.length - 1 ? 7 : 0 } }, Bol(), h(Text, { style: { fontSize: 9.5, lineHeight: 1.5, color: TEKST, flex: 1 } }, p))))),
        h(Text, { style: { ...s.klein, marginTop: 8 } }, T.subsidieDisclaimer)),
      h(View, { style: { marginTop: 28 }, wrap: false },
        h(Text, { style: s.h2 }, ...F(T.stappenTitel)),
        h(View, { style: { flexDirection: 'row', marginTop: 12 } }, d.stappen.map(([titel, tekst], i) => h(View, { key: i, style: { flex: 1, marginLeft: i ? 10 : 0, borderWidth: 1, borderColor: LIJN, padding: 12 } },
          h(View, { style: { width: 22, height: 22, backgroundColor: i === 0 ? GEEL : LICHT, alignItems: 'center', justifyContent: 'center' } }, h(Text, { style: { fontSize: 10, fontWeight: 800, color: ZWART } }, String(i + 1))),
          h(Text, { style: { fontSize: 10, fontWeight: 800, marginTop: 8 } }, titel),
          h(Text, { style: { fontSize: 8.5, lineHeight: 1.5, color: TEKST, marginTop: 3 } }, tekst))))),
      h(View, { style: { marginTop: 28, flexDirection: 'row', alignItems: 'center', backgroundColor: ZWART, padding: 18 }, wrap: false },
        d.nicky ? h(Image, { src: d.nicky, style: { width: 62, height: 62, borderRadius: 31, marginRight: 16 } }) : null,
        h(View, { style: { flex: 1, paddingRight: 14 } },
          h(Text, { style: { fontSize: 13, fontWeight: 800, color: '#FFFFFF' } }, T.contactTitel),
          h(Text, { style: { fontSize: 9, lineHeight: 1.5, color: '#CFCFCF', marginTop: 3 } }, T.contactTekst)),
        h(View, { style: { width: 200 } }, [['Telefoon', H.BRUCK.tel, H.BRUCK.telHref], ['WhatsApp', H.BRUCK.tel, H.BRUCK.whatsapp], ['E-mail', H.BRUCK.mail, 'mailto:' + H.BRUCK.mail]].map(([l, v, href], i) =>
          h(View, { key: i, style: { flexDirection: 'row', alignItems: 'center', marginTop: i ? 6 : 0 } },
            h(Text, { style: { width: 58, fontSize: 7.5, fontWeight: 700, color: '#9A9A9A', textTransform: 'uppercase', letterSpacing: 0.6 } }, l),
            h(Link, { src: href, style: { fontSize: 9.5, fontWeight: 800, color: i === 1 ? '#25D366' : i === 0 ? GEEL : '#FFFFFF', textDecoration: 'none' } }, v))))),
      h(Text, { style: { ...s.klein, marginTop: 14, fontSize: 7.5 } }, T.disclaimer),
      ...Voet(d)));
}

async function maakRapport(input, site) {
  fonts();
  const scan = input.scan, a = scan.adres, aw = scan.antwoorden || {};
  const sc = bereken(scan.bouwjaar, scan.daktype, aw);
  const vernieuwd = aw.vernieuwd && aw.vernieuwd !== 'nee' && aw.vernieuwd !== 'weetniet' ? VERN_TXT[aw.vernieuwd].toLowerCase() : '';
  const [scoreLabel, scoreTekst, punten] = SCORES[sc.uitkomst];
  const levensduur = sc.rest === undefined ? 'Onbekend' : sc.rest >= sc.levensduur * 0.4 ? `Nog ruim ${Math.max(5, Math.floor(sc.rest / 5) * 5)} jaar` : sc.rest > 0 ? 'Einde levensduur in zicht' : 'Levensduur verstreken';
  const helling = scan.daktype === 'plat' ? 'Vrijwel vlak' : scan.helling ? `ca. ${scan.helling}°` : 'Onbekend';
  const delen = scan.oppervlakSchuin && scan.oppervlakPlat ? `${scan.oppervlakSchuin} m² schuin + ${scan.oppervlakPlat} m² plat` : '';
  const feiten = [
    { label: 'Dakoppervlak', value: scan.oppervlak ? `${scan.oppervlak} m²` : 'Onbekend', uitleg: [delen, T.uitleg.dakoppervlak].filter(Boolean).join('. ') },
    { label: 'Daktype', value: DAKTYPES[scan.daktype], uitleg: T.uitleg.daktype },
    { label: 'Dakhelling', value: helling, uitleg: T.uitleg.dakhelling },
    { label: 'Bouwjaar woning', value: scan.bouwjaar ? String(scan.bouwjaar) : 'Onbekend', uitleg: T.uitleg.bouwjaar },
    { label: 'Geschatte leeftijd dak', value: leeftijdKlasse(sc.leeftijd) || 'Onbekend', uitleg: vernieuwd ? vul(T.uitleg.leeftijdVernieuwd, { wanneer: vernieuwd }) : T.uitleg.leeftijd },
    { label: 'Verwachte levensduur', value: levensduur, uitleg: T.uitleg.levensduur },
  ];
  // Subsidie-indicatie (ISDE dakisolatie, één maatregel), per adres in het pand.
  const adressen = Math.max(1, scan.adressen || 1);
  const m2 = scan.oppervlak ? Math.round(scan.oppervlak / adressen) : undefined;
  const notities = []; let bedrag, berekening;
  if (m2 === undefined) notities.push(T.subsidieOnbekend);
  else {
    const gerekend = Math.min(Math.max(0, m2), TARIEF.max);
    if (!(m2 >= TARIEF.min)) notities.push(vul(T.subsidieOnderMinimum, { min: TARIEF.min }));
    else { bedrag = euro(Math.round(gerekend * TARIEF.tarief1)); berekening = vul(T.subsidieBerekening, { m2: `${gerekend} m²`, tarief: euroM2(TARIEF.tarief1) }); }
    if (adressen > 1) notities.push(vul(T.subsidieGedeeld, { n: adressen }));
  }
  const pc = (p) => p.replace(/^(\d{4})\s*([A-Za-z]{2})$/, '$1 $2').toUpperCase();
  const adresKop = `${a.straat} ${a.huis}`.trim() || a.weergave;
  const adresSub = [pc(a.postcode), a.plaats].filter(Boolean).join(' ');
  const foto = await luchtfoto(scan.kader, scan.contour, W / FOTO_H);
  const logo = bestand('img/2eb862934a76df52611f70dd21ad94cc.png');
  if (!logo) throw new Error('logo ontbreekt');
  const d = {
    naam: input.naam, datum: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(new Date()),
    adresKop, adresSub, score: cijfer(sc.score), uitkomst: sc.uitkomst, scoreLabel,
    scoreTekst: [scoreTekst, aw.klachten ? T.klachtenTekst : ''].filter(Boolean).join(' '), marker: sc.score / 10, feiten,
    aandacht: filter(punten, scan.daktype), zelf: filter(T.zelfPunten, scan.daktype),
    subsidie: { bedrag, berekening, notities }, stappen: input.inspectie ? T.stappenInspectie : T.stappenZonder,
    foto, logo, nicky: bestand('img/nicky-rond.jpg'), website: site.replace(/^https?:\/\//, ''),
  };
  const pdf = await renderToBuffer(Rapport(d));
  const bestandsnaam = (`Dakrapport ${adresKop} ${a.plaats}`.replace(/[^\p{L}\p{N} ._-]+/gu, '').trim() || 'Dakrapport') + '.pdf';
  return { pdf, bestandsnaam, adres: `${adresKop}, ${a.plaats}`, score: d.score, uitkomst: sc.uitkomst, scoreLabel, sc, feiten, vernieuwd: aw.vernieuwd };
}

/* ---------- mails ---------- */
function mails(input, r, site) {
  const scan = input.scan, voornaam = input.naam.split(/\s+/)[0] || input.naam;
  const kaart = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(scan.adres.weergave || r.adres)}`;
  const luchtfotoUrl = (() => { const [x, y, s2] = scan.kader; return `${WMS}?service=WMS&request=GetMap&version=1.3.0&layers=Actueel_orthoHR&styles=&crs=EPSG:28992&bbox=${x.toFixed(1)},${y.toFixed(1)},${(x + s2).toFixed(1)},${(y + s2).toFixed(1)}&width=1000&height=1000&format=image/jpeg`; })();
  const f = Object.fromEntries(r.feiten.map((x) => [x.label, x.value]));
  const velden = [
    ['Soort', input.inspectie ? 'Inspectie en rapport (warme lead)' : 'Rapport aangevraagd'],
    ['Telefoon', input.telefoon], ['E-mail', input.email], ['Adres', scan.adres.weergave || r.adres],
    ['Dakscore', `${r.score} (${r.scoreLabel})`], ['Daktype', f['Daktype']], ['Dakoppervlak', f['Dakoppervlak'] + (scan.oppervlakSchuin && scan.oppervlakPlat ? ` (${scan.oppervlakSchuin} m² schuin + ${scan.oppervlakPlat} m² plat)` : '')],
    ['Dakhelling', f['Dakhelling']], ['Bouwjaar woning', f['Bouwjaar woning']],
    ['Dak vernieuwd', scan.antwoorden && scan.antwoorden.vernieuwd ? VERN_TXT[scan.antwoorden.vernieuwd] : ''],
    ['Lekkage, vocht of losse pannen', scan.antwoorden && scan.antwoorden.klachten !== undefined ? (scan.antwoorden.klachten ? 'ja' : 'nee') : ''],
    ['Geschatte leeftijd dak', f['Geschatte leeftijd dak']], ['Verwachte levensduur', f['Verwachte levensduur']],
    ['Adressen in pand', scan.adressen ? String(scan.adressen) : ''], ['BAG-pand', scan.pandId || ''],
  ];
  const lead = {
    subject: `Dakscan: ${input.inspectie ? 'inspectie en rapport' : 'rapport'}, ${r.adres} – ${input.naam}`,
    html: H.layout({
      site, label: input.inspectie ? 'Dakscan: inspectie aangevraagd' : 'Dakscan: rapport aangevraagd', titel: input.naam,
      intro: input.inspectie ? `Wil een gratis dakinspectie. Neem ${H.REACTIE} contact op om een moment te plannen. Het dakrapport zit als bijlage bij deze mail.` : `Heeft het dakrapport aangevraagd (zit als bijlage bij deze mail). Geen inspectie gevraagd.`,
      inhoud: H.scoreBlok(r.score, r.scoreLabel, '') + H.rijen(velden) +
        (input.vraag ? '<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>' + H.tekstBlok(input.vraag) : '') +
        H.knoppen([H.knop(H.telHref(input.telefoon), `Bel ${voornaam}`, true), H.knop(`mailto:${input.email}`, `Mail ${voornaam}`, false), H.knop(kaart, 'Adres op kaart', false), H.knop(luchtfotoUrl, 'Luchtfoto', false)]),
    }),
  };
  const klant = {
    subject: `Je dakrapport voor ${r.adres}`,
    html: H.layout({
      site, voorKlant: true, label: 'Jouw dakrapport', titel: `Hoi ${voornaam},`,
      intro: `Bedankt voor het doen van de dakscan. In de bijlage vind je je persoonlijke dakrapport voor <strong style="color:#FFFFFF">${H.esc(r.adres)}</strong>.`,
      inhoud: H.scoreBlok(r.score, r.scoreLabel, SCORES[r.uitkomst][1]) +
        H.alinea(input.inspectie ? `Nicky neemt <strong style="color:#FFFFFF">${H.REACTIE}</strong> contact met je op om een moment te plannen waarop hij je dak gratis komt bekijken. Liever sneller? Bel of app gerust.` : 'Wil je dat Nicky je dak komt bekijken? Bel of app gerust, of beantwoord deze mail.') +
        H.knoppen([H.knop(H.BRUCK.telHref, `Bel Nicky: ${H.BRUCK.tel}`, true), H.knop(H.BRUCK.whatsapp, 'WhatsApp', false), H.knop(`mailto:${H.BRUCK.mail}`, 'Mail Nicky', false)]),
    }),
  };
  return { lead, klant };
}

const fout = (res, status, code) => res.status(status).json({ ok: false, fout: code });

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }
  const download = String(req.query && req.query.download) === '1';
  if (H.teVaak(H.ipVan(req), download ? 'download' : 'rapport', download ? 20 : 6)) return fout(res, 429, 'te-vaak');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const input = leesInput(body);
  if (input.fout) return fout(res, 400, input.fout);
  if (input.website) return res.status(200).json({ ok: true, mail: false }); // honeypot
  const c = H.config();

  let r;
  try { r = await maakRapport(input, c.site); }
  catch (e) { console.error('[rapport] pdf maken mislukt:', e); if (download) return fout(res, 500, 'pdf'); }

  if (download) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${r.bestandsnaam.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(r.bestandsnaam)}`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(r.pdf);
  }
  if (!c.apiKey) { console.error('RESEND_API_KEY ontbreekt'); return res.status(200).json({ ok: true, mail: false }); }
  if (!r) {
    // Rapport mislukt: de aanvraag gaat toch naar Nicky, zonder bijlage.
    try {
      await H.send(c.apiKey, { from: c.from, to: [c.to], reply_to: input.email, subject: (c.test ? '[TEST] ' : '') + `Dakscan (zonder rapport): ${input.naam}`, html: H.layout({ site: c.site, label: 'Dakscan', titel: input.naam, intro: 'Het rapport kon niet gemaakt worden. Gegevens hieronder.', inhoud: H.rijen([['Telefoon', input.telefoon], ['E-mail', input.email], ['Adres', input.scan.adres.weergave]]) }) });
      return res.status(200).json({ ok: true, mail: false });
    } catch (e) { console.error('[rapport] lead mislukt', e.message); return fout(res, 502, 'send'); }
  }
  const m = mails(input, r, c.site);
  const bijlage = [{ filename: r.bestandsnaam, content: r.pdf.toString('base64') }];
  try {
    await H.send(c.apiKey, { from: c.from, to: [c.to], reply_to: input.email, subject: (c.test ? '[TEST] ' : '') + m.lead.subject, html: m.lead.html, attachments: bijlage });
  } catch (e) { console.error('[rapport] lead versturen mislukt', e.message); return fout(res, 502, 'send'); }
  let mail = false;
  try { await H.stuurKlant(c, { subject: m.klant.subject, html: m.klant.html, attachments: bijlage }, input.email); mail = true; }
  catch (e) { console.error('[rapport] klantmail mislukt', e.message); }
  return res.status(200).json({ ok: true, mail });
}

export { maakRapport, leesInput, bereken }; // voor lokaal testen
