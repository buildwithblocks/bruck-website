// Aanvragen uit de dakscan en het contactformulier versturen via Resend.
//
// Omgevingsvariabelen (Vercel > Settings > Environment Variables):
//   RESEND_API_KEY  verplicht
//   LEAD_FROM       afzender van de INTERNE mails (aanvraag naar Nicky, en in testmodus alles), op een in Resend
//                   geverifieerd domein. Standaard "Brück dakscan <dakscan@bruckdakwerken.nl>".
//   KLANT_FROM      afzender van de mails AAN KLANTEN (dakrapport, bevestiging). Standaard
//                   "Brück Dak en Zinkwerk <rapport@bruckdakwerken.nl>"; bruckdakwerken.nl moet in Resend geverifieerd zijn.
//                   Een buildwithblocks.nl-afzender wordt geweigerd: klanten krijgen nooit mail van dat domein.
//   LEAD_TO         ontvanger van de aanvragen (standaard info@buildwithblocks.nl zolang we testen;
//                   later bruckdakenzinkwerk@outlook.com)
//   LEAD_TEST       testmodus staat standaard AAN: alle mails (ook de bevestiging voor de klant) gaan naar LEAD_TO,
//                   met [TEST] in het onderwerp. Zet LEAD_TEST op "0" om live te gaan.
//   SITE_URL        basis-URL voor logo en links (standaard https://bruck-dakwerken.vercel.app)

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

// ---------- de mails ----------

function maakMails(b, site) {
  const type = b.type === 'contact' ? 'contact' : 'dakscan';
  const voornaam = clean(b.voornaam, 80);
  const naam = [voornaam, clean(b.achternaam, 80)].filter(Boolean).join(' ');
  const email = clean(b.email, 160);
  const tel = clean(b.telefoon, 40);
  const klantKnoppen = knoppen([knop(BRUCK.telHref, `Bel Nicky: ${BRUCK.tel}`, true), knop(`mailto:${BRUCK.mail}`, 'Mail Nicky', false)]);
  const leadKnoppen = (extra) => knoppen([
    tel ? knop(telHref(tel), `Bel ${voornaam}`, true) : '',
    knop(`mailto:${email}`, `Mail ${voornaam}`, false), ...(extra || [])]);

  if (type === 'dakscan') {
    const adres = clean(b.adresVol, 160) || [clean(b.postcode, 12), clean(b.huisnummer, 10), clean(b.toevoeging, 10)].filter(Boolean).join(' ');
    const daktype = clean(b.daktype, 40), opp = clean(b.oppervlak, 20);
    const score = clean(b.score, 8), label = clean(b.label, 40), advies = clean(b.advies, 200);
    const kaart = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adres)}`;
    return {
      leadSubject: `Dakscan: ${naam} – ${adres}${score ? ` – score ${score}` : ''}`,
      leadHtml: layout({
        site, label: 'Nieuwe dakscan', titel: naam,
        intro: `Neem ${REACTIE} contact op om een gratis inspectie in te plannen.`,
        inhoud: (score ? scoreBlok(score, label, '') : '') +
          rijen([['Telefoon', tel], ['E-mail', email], ['Adres', adres], ['Bouwjaar', clean(b.bouwjaar, 6)], ['Daktype', daktype],
                 ['Dakoppervlak', opp], ['Dak vernieuwd', clean(b.vernieuwd, 60)], ['Lekkage of vocht', clean(b.lekkage, 10)],
                 ['Mag contact opnemen', b.toestemming === false ? 'Nee' : 'Ja']]) +
          leadKnoppen([knop(kaart, 'Adres op kaart', false)]),
      }),
      klantSubject: 'Je dakrapport van Brück Dak en Zinkwerk',
      klantHtml: layout({
        site, voorKlant: true, label: 'Jouw dakrapport', titel: `Bedankt, ${voornaam}!`,
        intro: `Hieronder vind je de uitkomst van je dakscan. Nicky neemt <strong style="color:#FFFFFF">${REACTIE}</strong> contact met je op om een <strong style="color:#FFFFFF">gratis inspectie</strong> in te plannen.`,
        inhoud: (score ? scoreBlok(score, label, advies) : '') +
          rijen([['Adres', adres], ['Bouwjaar', clean(b.bouwjaar, 6)], ['Daktype', daktype], ['Dakoppervlak', opp],
                 ['Dak vernieuwd', clean(b.vernieuwd, 60)], ['Lekkage of vocht', clean(b.lekkage, 10)]]) +
          alinea('Liever niet wachten? Bel of app Nicky direct, of beantwoord deze mail.') +
          klantKnoppen,
      }),
    };
  }

  const bericht = cleanText(b.bericht);
  return {
    leadSubject: `Contactformulier: ${naam}`,
    leadHtml: layout({
      site, label: 'Nieuw bericht via de website', titel: naam,
      intro: `Neem ${REACTIE} contact op.`,
      inhoud: rijen([['Telefoon', tel], ['E-mail', email], ['Bedrijf', clean(b.bedrijf, 120)]]) +
        '<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>' + tekstBlok(bericht) +
        leadKnoppen(),
    }),
    klantSubject: 'We hebben je bericht ontvangen',
    klantHtml: layout({
      site, voorKlant: true, label: 'Bericht ontvangen', titel: `Bedankt, ${voornaam}!`,
      intro: `We hebben je bericht goed ontvangen. Nicky neemt <strong style="color:#FFFFFF">${REACTIE}</strong> contact met je op.`,
      inhoud: tekstBlok(bericht) +
        alinea('Haast? Bel of app Nicky direct.') + klantKnoppen,
    }),
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false }); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'invalid' });

  // Honeypot: bots vullen dit verborgen veld in. Doe alsof het gelukt is.
  if (clean(b.website)) return res.status(200).json({ ok: true });

  const type = b.type === 'contact' ? 'contact' : 'dakscan';
  const email = clean(b.email, 160);
  if (!clean(b.voornaam) || !isEmail(email)) return res.status(400).json({ ok: false, error: 'velden' });
  if (type === 'dakscan' && telDigits(clean(b.telefoon, 40)).length < 10) return res.status(400).json({ ok: false, error: 'velden' });
  if (type === 'contact' && !cleanText(b.bericht)) return res.status(400).json({ ok: false, error: 'velden' });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM || 'Brück dakscan <dakscan@bruckdakwerken.nl>';
  const klantFrom = process.env.KLANT_FROM || 'Brück Dak en Zinkwerk <rapport@bruckdakwerken.nl>';
  const to = process.env.LEAD_TO || 'info@buildwithblocks.nl';
  const test = process.env.LEAD_TEST !== '0';
  const site = (process.env.SITE_URL || 'https://bruck-dakwerken.vercel.app').replace(/\/+$/, '');
  if (!apiKey) { console.error('RESEND_API_KEY ontbreekt'); return res.status(500).json({ ok: false, error: 'config' }); }

  const m = maakMails(b, site);

  try {
    await send(apiKey, { from, to: [to], reply_to: email, subject: (test ? '[TEST] ' : '') + m.leadSubject, html: m.leadHtml });
    try {
      if (test) {
        // Testmodus: de klantmail gaat alleen naar LEAD_TO, ter controle.
        await send(apiKey, { from: klantFrom, to: [to], subject: `[TEST klantmail → ${email}] ${m.klantSubject}`, html: m.klantHtml });
      } else if (klantFrom && !/buildwithblocks\.nl/i.test(klantFrom)) {
        await send(apiKey, { from: klantFrom, to: [email], reply_to: to, subject: m.klantSubject, html: m.klantHtml });
      } else {
        console.error('Geen klantmail verstuurd: KLANT_FROM ontbreekt of is geen domein van Brück');
      }
    } catch (e) { console.error('Bevestiging klant mislukt', e.message); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Lead versturen mislukt', e.message);
    return res.status(502).json({ ok: false, error: 'send' });
  }
};

module.exports.maakMails = maakMails; // voor het lokaal bekijken van de mails
