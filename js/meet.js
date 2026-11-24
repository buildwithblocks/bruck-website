/* Bezoekers en conversies meten met Vercel Web Analytics (cookieloos). Staat op elke pagina in de <head>.
 * Events verschijnen in Vercel (Analytics › Events) en in het Build with Blocks-portaal (Statistieken › Conversies).
 * Custom events tellen alleen op Vercel Pro en op productie. Alles wat met "Lead -" begint is een aanvraag met
 * contactgegevens. Hooguit 2 eigenschappen per event. Een fout mag de site nooit breken. */
(function () {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);

  window.meet = function (naam, data) {
    try { window.va('event', data ? { name: naam, data: data } : { name: naam }); } catch (e) { /* niets */ }
  };

  // Klikken op bellen, mailen en WhatsApp, op elke pagina.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    var href = a ? a.getAttribute('href') || '' : '';
    var soort = href.indexOf('tel:') === 0 ? 'Contact: bellen' : href.indexOf('mailto:') === 0 ? 'Contact: mailen' : /wa\.me|whatsapp/i.test(href) ? 'Contact: WhatsApp' : null;
    if (soort) window.meet(soort, { pagina: location.pathname });
  }, true);
})();
