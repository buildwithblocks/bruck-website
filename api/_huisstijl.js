// Gedeelde huisstijl en hulpfuncties voor de mails (api/lead.js en api/rapport.mjs).
// Bestanden in api/ die met _ beginnen publiceert Vercel niet als losse functie.

const BRUCK = {
  naam: 'Brück Dak en Zinkwerk',
  tel: '06 19 62 33 66',
  telHref: 'tel:+31619623366',
  whatsapp: 'https://wa.me/31619623366',
  mail: 'bruckdakenzinkwerk@outlook.com',
  adres: 'Goudwindestraat 39, 6576 CD Ooij',
  kvk: '85783439',
};
const REACTIE = 'binnen 2 werkdagen';
const GEEL = '#DFA701', DONKER = '#161616', ZWART = '#0B0B0B';
const FONT = "font-family:'Saira',Arial,Helvetica,sans-serif";
const SCORE_KLEUR = { 'Goed': '#7CC68D', 'Verdient aandacht': '#E8913A', 'Snel actie nodig': '#E5674F' }; // zelfde kleuren als de dakscan

const clean = (v, max = 300) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const cleanText = (v, max = 4000) => String(v == null ? '' : v).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const telDigits = (v) => v.replace(/\D/g, '');
const telHref = (v) => { const d = telDigits(v); return d ? 'tel:' + (d.startsWith('0') ? '+31' + d.slice(1) : '+' + d) : ''; };

// ---------- bouwstenen: ontwerp B "volledig donker", in de stijl van de website ----------
// Tabel-opmaak met bgcolor-attributen, zodat Outlook, Gmail en Apple Mail de donkere vlakken goed tonen.

const BG = '#0B0B0B', VLAK = '#161616', KAART = '#1F1F1F', LIJN = '#2C2C2C', ZACHT = '#B8B8B8', GRIJS = '#8A8A8A';

function rijen(rows) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' +
    rows.filter(([, v]) => v).map(([k, v]) =>
      `<tr><td style="padding:12px 16px 12px 0;border-bottom:1px solid ${LIJN};${FONT};font-size:14px;color:${GRIJS};white-space:nowrap;vertical-align:top">${esc(k)}</td>` +
      `<td style="padding:12px 0;border-bottom:1px solid ${LIJN};${FONT};font-size:15px;font-weight:bold;color:#FFFFFF;text-align:right">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('') +
    '</table>';
}

function knop(href, label, primair) {
  const stijl = primair
    ? `background:${GEEL};color:${ZWART};border:1px solid ${GEEL}`
    : `background:${VLAK};color:#FFFFFF;border:1px solid #6A6A6A`;
  return `<td style="padding:0 8px 8px 0"><a href="${esc(href)}" style="display:inline-block;padding:14px 22px;${stijl};${FONT};font-size:14px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;text-decoration:none">${esc(label)}</a></td>`;
}
const knoppen = (lijst) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr>${lijst.join('')}</tr></table>`;

function scoreBlok(score, label, advies) {
  const kleur = SCORE_KLEUR[label] || GEEL;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${KAART}" style="background:${KAART};margin:0 0 24px"><tr><td style="padding:28px">` +
    `<div style="${FONT};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${GRIJS}">Jouw dakscore</div>` +
    `<div style="${FONT};font-size:56px;line-height:1;font-weight:bold;color:${GEEL};margin-top:8px">${esc(score)}</div>` +
    (label ? `<div style="${FONT};font-size:20px;font-weight:bold;color:${kleur};margin-top:10px">${esc(label)}</div>` : '') +
    (advies ? `<div style="${FONT};font-size:15px;line-height:1.5;color:${ZACHT};margin-top:4px">${esc(advies)}</div>` : '') +
    `</td></tr></table>`;
}

const tekstBlok = (tekst) => `<div style="padding:18px 20px;background:${KAART};border-left:4px solid ${GEEL};${FONT};font-size:15px;line-height:1.6;color:#FFFFFF">${esc(tekst).replace(/\n/g, '<br>')}</div>`;
const alinea = (html) => `<p style="margin:24px 0 0;${FONT};font-size:15px;line-height:1.6;color:${ZACHT}">${html}</p>`;

function layout({ site, label, titel, intro, inhoud, voorKlant }) {
  const logo = `${site}/img/email-logo.png`;
  const voet = voorKlant
    ? `<div style="${FONT};font-size:14px;line-height:1.7;color:${GRIJS}">` +
      `<strong style="color:#FFFFFF">${BRUCK.naam}</strong><br>${BRUCK.adres}<br>` +
      `<a href="${BRUCK.whatsapp}" style="color:${GEEL};text-decoration:none">WhatsApp</a> · ` +
      `<a href="${BRUCK.telHref}" style="color:${GEEL};text-decoration:none">${BRUCK.tel}</a> · ` +
      `<a href="mailto:${BRUCK.mail}" style="color:${GEEL};text-decoration:none">${BRUCK.mail}</a><br>` +
      `<a href="${site}" style="color:${GRIJS}">${site.replace(/^https?:\/\//, '')}</a> · KvK ${BRUCK.kvk}</div>`
    : `<div style="${FONT};font-size:13px;color:${GRIJS}">Verstuurd via de website van ${BRUCK.naam}.</div>`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${esc(titel)}</title></head>` +
    `<body style="margin:0;padding:0;background:${BG}" bgcolor="${BG}">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BG}" style="background:${BG}"><tr><td align="center" style="padding:24px 12px">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">` +
    // kop met logo
    `<tr><td bgcolor="${VLAK}" style="background:${VLAK};padding:32px 32px 8px">` +
    `<a href="${site}"><img src="${logo}" width="112" alt="${BRUCK.naam}" style="display:block;width:112px;height:auto;border:0"></a></td></tr>` +
    // inhoud
    `<tr><td bgcolor="${VLAK}" style="background:${VLAK};padding:24px 32px 32px">` +
    (label ? `<div style="${FONT};font-size:13px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:${GEEL}">${esc(label)}</div>` : '') +
    `<h1 style="margin:8px 0 12px;${FONT};font-size:30px;line-height:1.1;font-weight:bold;text-transform:uppercase;color:#FFFFFF">${esc(titel)}</h1>` +
    (intro ? `<p style="margin:0 0 24px;${FONT};font-size:16px;line-height:1.6;color:${ZACHT}">${intro}</p>` : '') +
    inhoud + `</td></tr>` +
    // voet
    `<tr><td bgcolor="${BG}" style="background:${BG};padding:24px 32px;border-top:1px solid ${LIJN}">${voet}</td></tr>` +
    `</table></td></tr></table></body></html>`;
}

async function send(apiKey, msg) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
}


// Instellingen uit de omgevingsvariabelen (zie de uitleg bovenin api/lead.js).
function config() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.LEAD_FROM || 'Brück dakscan <dakscan@bruckdakwerken.nl>',
    klantFrom: process.env.KLANT_FROM || 'Brück Dak en Zinkwerk <rapport@bruckdakwerken.nl>',
    to: process.env.LEAD_TO || 'info@buildwithblocks.nl',
    test: process.env.LEAD_TEST !== '0',
    site: (process.env.SITE_URL || 'https://bruck-dakwerken.vercel.app').replace(/\/+$/, ''),
  };
}

// Klantmail versturen: in testmodus naar LEAD_TO, live naar de klant, nooit vanaf buildwithblocks.nl.
async function stuurKlant(c, msg, email) {
  if (c.test) return send(c.apiKey, Object.assign({}, msg, { from: c.klantFrom, to: [c.to], subject: `[TEST klantmail → ${email}] ${msg.subject}` }));
  if (!c.klantFrom || /buildwithblocks\.nl/i.test(c.klantFrom)) { console.error('Geen klantmail verstuurd: KLANT_FROM ontbreekt of is geen domein van Brück'); return; }
  return send(c.apiKey, Object.assign({ reply_to: c.to }, msg, { from: c.klantFrom, to: [email] }));
}

// Simpele rate limit per IP (in het geheugen van deze serverinstantie), zoals bij Vermeulen. Grove bescherming tegen misbruik.
const HITS = new Map();
const VENSTER = 10 * 60 * 1000;
function teVaak(ip, soort, max) {
  const k = soort + ':' + ip, nu = Date.now();
  const lijst = (HITS.get(k) || []).filter((t) => nu - t < VENSTER);
  lijst.push(nu); HITS.set(k, lijst);
  if (HITS.size > 5000) for (const [key, v] of HITS) if (!v.some((t) => nu - t < VENSTER)) HITS.delete(key);
  return lijst.length > max;
}
const ipVan = (req) => String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim() || (req.headers && req.headers['x-real-ip']) || 'onbekend';

module.exports = { BRUCK, REACTIE, GEEL, DONKER, ZWART, FONT, SCORE_KLEUR, clean, cleanText, esc, isEmail, telDigits, telHref,
  rijen, knop, knoppen, scoreBlok, tekstBlok, alinea, layout, send, config, stuurKlant, teVaak, ipVan };
