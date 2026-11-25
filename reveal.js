/* Scroll-reveal, gelijk aan Globen (Osmo "Elements Reveal on Scroll", GSAP + ScrollTrigger):
   - per blok: de directe onderdelen van een blok komen 100ms na elkaar binnen;
   - een blok start zodra zijn bovenkant 92% van het scherm bereikt ("top 92%", eenmalig);
   - elk onderdeel schuift 2em omhoog en fadet in (autoAlpha), 0,8s, ease power4.inOut;
   - kaarten (met achtergrond of rand) komen als geheel binnen, tekstkolommen per kop/alinea/knop.
   Vereist js/gsap.min.js en js/ScrollTrigger.min.js. Zonder die scripts, zonder JavaScript of met
   "minder beweging" blijft alles gewoon zichtbaar. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var STAGGER = 0.1;          // s tussen onderdelen van een blok (Globen: 100ms)
  var DURATION = 0.8;         // s
  var DISTANCE = '2em';
  var EASE = 'power4.inOut';
  var START = 'top 92%';
  // Alleen wat de animatie zelf zet weer opruimen; de site gebruikt veel inline styles.
  var CLEAR = 'transform,opacity,visibility';

  var SKIP_TAGS = /^(SCRIPT|STYLE|TEMPLATE|LINK|META|BR|svg)$/i;

  function isTransparentBox(cs) {
    var bg = cs.backgroundColor;
    var noBg = (bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg)) && cs.backgroundImage === 'none';
    var noBorder = !parseFloat(cs.borderTopWidth) && !parseFloat(cs.borderBottomWidth) &&
                   !parseFloat(cs.borderLeftWidth) && !parseFloat(cs.borderRightWidth);
    return noBg && noBorder && cs.boxShadow === 'none';
  }

  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  }

  // Een "wrapper" is een onzichtbare layout-doos: daarvan animeren we de kinderen, niet de doos zelf.
  function isWrapper(el, cs) {
    if (cs.display === 'contents') return true;
    if (!/^(DIV|SECTION|ARTICLE|HEADER|MAIN|ASIDE|NAV)$/.test(el.tagName)) return false;
    if (!el.children.length || hasOwnText(el)) return false;
    return isTransparentBox(cs);
  }

  function skip(el, cs) {
    return SKIP_TAGS.test(el.tagName) || el.classList.contains('rv-skip') ||
      cs.position === 'absolute' || cs.position === 'fixed' || cs.position === 'sticky' ||
      el.getAttribute('aria-hidden') === 'true';
  }

  var groups = new Map(); // blok -> [onderdelen]

  function collect(el) {
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      var cs = getComputedStyle(child);
      if (skip(child, cs)) continue;
      if (isWrapper(child, cs)) { collect(child); continue; }
      var trigger = el;
      while (getComputedStyle(trigger).display === 'contents') trigger = trigger.parentElement;
      if (!groups.has(trigger)) groups.set(trigger, []);
      groups.get(trigger).push(child);
    }
  }

  // Elementen met een eigen transform alleen laten infaden, zodat hun transform intact blijft.
  function ownTransform(el) { return !!el.style.transform; }

  function init() {
    var roots = [].filter.call(document.querySelectorAll('section, footer'), function (r) {
      return !r.parentElement.closest('section, footer');
    });
    roots.forEach(function (root) {
      if (!skip(root, getComputedStyle(root))) collect(root);
    });

    groups.forEach(function (items, trigger) {
      var hasTransform = items.map(ownTransform);
      items.forEach(function (el, i) {
        gsap.set(el, hasTransform[i] ? { autoAlpha: 0 } : { y: DISTANCE, autoAlpha: 0 });
      });
      ScrollTrigger.create({
        trigger: trigger,
        start: START,
        once: true,
        onEnter: function () {
          var tl = gsap.timeline();
          items.forEach(function (el, i) {
            var to = { autoAlpha: 1, duration: DURATION, ease: EASE,
                       onComplete: function () { gsap.set(el, { clearProps: hasTransform[i] ? 'opacity,visibility' : CLEAR }); } };
            if (!hasTransform[i]) to.y = 0;
            tl.to(el, to, i * STAGGER);
          });
        }
      });
    });
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
