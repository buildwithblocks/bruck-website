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

const { BRUCK, REACTIE, clean, cleanText, isEmail, telDigits, telHref, rijen, knop, knoppen, scoreBlok, tekstBlok, alinea, layout, send, config, stuurKlant, teVaak, ipVan } = require('./_huisstijl');

// ---------- de mails ----------

function maakMails(b, site) {
  const type = b.type === 'contact' || b.type === 'nietgevonden' ? b.type : 'dakscan';
  // Eén naamveld (dakscan, zoals Vermeulen) of voor- en achternaam (contactformulier).
  const naam = clean(b.naam, 120) || [clean(b.voornaam, 80), clean(b.achternaam, 80)].filter(Boolean).join(' ');
  const voornaam = clean(b.voornaam, 80) || naam.split(/\s+/)[0] || naam;
  const email = clean(b.email, 160);
  const tel = clean(b.telefoon, 40);
  const klantKnoppen = knoppen([knop(BRUCK.whatsapp, 'App Nicky', true), knop(BRUCK.telHref, `Bel Nicky: ${BRUCK.tel}`, false), knop(`mailto:${BRUCK.mail}`, 'Mail Nicky', false)]);
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
          alinea('Liever niet wachten? App of bel Nicky direct, of beantwoord deze mail.') +
          klantKnoppen,
      }),
    };
  }

  if (type === 'nietgevonden') {
    const adres = clean(b.adresVol, 160);
    const vraag = cleanText(b.bericht);
    return {
      leadSubject: `Dakscan: adres niet gevonden – ${naam} – ${adres}`,
      leadHtml: layout({
        site, label: 'Dakscan: adres niet gevonden', titel: naam,
        intro: `Het adres stond niet in de BAG (bijvoorbeeld nieuwbouw). Zoek het na en neem ${REACTIE} contact op.`,
        inhoud: rijen([['Telefoon', tel], ['E-mail', email], ['Ingevuld adres', adres]]) +
          (vraag ? '<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>' + tekstBlok(vraag) : '') + leadKnoppen(),
      }),
      klantSubject: 'We hebben je aanvraag ontvangen',
      klantHtml: layout({
        site, voorKlant: true, label: 'Aanvraag ontvangen', titel: `Bedankt, ${voornaam}!`,
        intro: `We konden je adres niet automatisch vinden. Nicky zoekt het na en neemt <strong style="color:#FFFFFF">${REACTIE}</strong> contact met je op.`,
        inhoud: rijen([['Adres', adres]]) + alinea('Haast? App of bel Nicky direct.') + klantKnoppen,
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
        alinea('Haast? App of bel Nicky direct.') + klantKnoppen,
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

  if (teVaak(ipVan(req), 'lead', 6)) return res.status(429).json({ ok: false, error: 'te-vaak' });

  const type = b.type === 'contact' || b.type === 'nietgevonden' ? b.type : 'dakscan';
  const email = clean(b.email, 160);
  if (!(clean(b.naam) || clean(b.voornaam)) || !isEmail(email)) return res.status(400).json({ ok: false, error: 'velden' });
  if (type !== 'contact' && telDigits(clean(b.telefoon, 40)).length < 10) return res.status(400).json({ ok: false, error: 'velden' });
  if (type === 'contact' && !cleanText(b.bericht)) return res.status(400).json({ ok: false, error: 'velden' });

  const c = config();
  const { apiKey, from, to, test, site } = c;
  if (!apiKey) { console.error('RESEND_API_KEY ontbreekt'); return res.status(500).json({ ok: false, error: 'config' }); }

  const m = maakMails(b, site);

  try {
    await send(apiKey, { from, to: [to], reply_to: email, subject: (test ? '[TEST] ' : '') + m.leadSubject, html: m.leadHtml });
    try {
      await stuurKlant(c, { subject: m.klantSubject, html: m.klantHtml }, email);
    } catch (e) { console.error('Bevestiging klant mislukt', e.message); }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Lead versturen mislukt', e.message);
    return res.status(502).json({ ok: false, error: 'send' });
  }
};

module.exports.maakMails = maakMails; // voor het lokaal bekijken van de mails
