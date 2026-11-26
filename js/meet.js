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

  // Stappen van de dakscan en subsidiecheck: "<Flow> <nr> - <naam>". Elke stap telt één keer per bezoek (sessie),
  // ook bij terugklikken of herladen. Leg in Vercel de stappen naast elkaar om te zien waar mensen afhaken.
  window.meetStap = function (flow, nr, naam, data) {
    var sleutel = 'bruck-stap-' + flow + '-' + nr, gezien = window.__stappen || (window.__stappen = {});
    try { if (sessionStorage.getItem(sleutel)) return; sessionStorage.setItem(sleutel, '1'); }
    catch (e) { if (gezien[sleutel]) return; }
    gezien[sleutel] = 1;
    window.meet(flow + ' ' + nr + ' - ' + naam, data);
  };

  // Waar op de pagina staat de contactoptie? header, menu, hero, footer of pagina.
  function plek(el) {
    if (el.closest('.mm-ikoon')) return 'header';
    if (el.closest('.mm-scroll, .mm-in, [class^="mm-"]')) return 'menu';
    if (el.closest('[data-floating-nav]')) return 'header';
    if (el.closest('footer')) return 'footer';
    var sec = el.closest('section');
    if (sec && sec === document.querySelector('section')) return 'hero';
    return 'pagina';
  }

  // Alleen contact meten: bellen, mailen en WhatsApp (de aanvragen zelf meten de formulieren als "Lead - …").
  function soortVan(href) {
    if (href.indexOf('tel:') === 0) return 'Contact: bellen';
    if (href.indexOf('mailto:') === 0) return 'Contact: mailen';
    if (/wa\.me|whatsapp/i.test(href)) return 'Contact: WhatsApp';
    return null;
  }

  document.addEventListener('click', function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var soort = soortVan(a.getAttribute('href') || '');
      if (soort) window.meet(soort, { pagina: location.pathname, plek: plek(a) });
    } catch (err) { /* niets */ }
  }, true);
})();
