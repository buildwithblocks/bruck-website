/* Mobiel en tablet menu (tot 1200 px; daarboven past de desktopnav met FAQ), ontwerp A in de stijl van Globen.
   Eén gedeeld script voor alle pagina's met de vaste navigatie ([data-floating-nav]):
   - zet een WhatsApp-knop en een hamburger in de bestaande balk (de desktopnav en -knoppen verdwijnen onder 1024 px);
   - bouwt het off-canvas menu: grote links die per regel omhoog schuiven, Diensten om uit te klappen,
     Start dakscan (primair) en Subsidiecheck (secundair), en contact zoals het blok boven de footer.
   De balk zelf blijft het gedrag van de site houden: sticky, transparant bovenaan, donker na scrollen. */
(function () {
  var BP = 1200;
  var WA_URL = 'https://wa.me/31619623366';
  var DIENSTEN = [['Dakwerken', 'dakwerken.html'], ['Zinkwerken', 'zinkwerken.html'], ['Dakpannen', 'dakpannen.html'], ['EPDM', 'epdm.html'], ['Dakisolatie', 'dakisolatie.html'], ['Lekkages', 'lekkages.html']];
  var HOOFD = [['Projecten', 'projecten.html'], ['Over ons', 'over-ons.html'], ['FAQ', 'faq.html'], ['Contact', 'contact.html']];

  var PIJL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  var PLUS = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var WAP = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z';
  var WA = function (s) { return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + WAP + '"/></svg>'; };
  var MAIL = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="1"/><path d="m22 6-10 7L2 6"/></svg>';
  var TEL = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0B0B0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';

  var CSS = [
    ':root{--mm-io:cubic-bezier(.76,0,.24,1)}',
    '.mm-knoppen{display:none;margin-left:auto;gap:8px;align-items:center}',
    '.mm-ikoon{width:48px;height:48px;border:0;border-radius:0;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;padding:0;text-decoration:none;font:inherit;transition:background-color .3s ease,color .3s ease}',
    '@media (hover:hover){.mm-ikoon:hover{background:#DFA701;color:#0B0B0B}#mm .mm-hoofd a:hover,#mm .mm-hoofd button:hover{color:#DFA701}#mm .mm-sub a:hover{color:#fff}#mm .mm-sub a:hover svg{transform:translateX(3px)}}',
    '.mm-ikoon:focus:not(:focus-visible){outline:none}.mm-ikoon:focus-visible{outline:2px solid #DFA701;outline-offset:2px}',
    '.mm-ham{position:relative;width:20px;height:14px}',
    '.mm-ham i{position:absolute;left:0;right:0;height:1.5px;background:currentColor;transition:transform .5s var(--mm-io),opacity .3s ease,top .5s var(--mm-io)}',
    '.mm-ham i:nth-child(1){top:0}.mm-ham i:nth-child(2){top:6px}.mm-ham i:nth-child(3){top:12px}',
    '.mm-open .mm-ham i:nth-child(1){top:6px;transform:rotate(45deg)}.mm-open .mm-ham i:nth-child(2){opacity:0}.mm-open .mm-ham i:nth-child(3){top:6px;transform:rotate(-45deg)}',
    '@media (max-width:' + (BP - 1) + 'px){',
    ' [data-floating-nav] nav[aria-label="Hoofdmenu"],[data-floating-nav] .mm-desk{display:none !important}',
    ' [data-floating-nav] header{gap:16px !important}',
    ' .mm-knoppen{display:flex}',
    '}',
    'html.mm-lock,html.mm-lock body{overflow:hidden}',
    '.mm-open [data-floating-nav]{background:#161616 !important;border-bottom-color:rgba(255,255,255,.08) !important}',
    '#mm{position:fixed;inset:0;z-index:99;visibility:hidden;pointer-events:none;background:#161616;color:#fff;font-family:"Saira","Helvetica Neue",Arial,sans-serif;clip-path:inset(0 0 100% 0);transition:clip-path .55s var(--mm-io) .14s,visibility 0s .7s}',
    '.mm-open #mm{visibility:visible;pointer-events:auto;clip-path:inset(0 0 0 0);transition:clip-path .55s var(--mm-io),visibility 0s}',
    '#mm .mm-scroll{position:absolute;inset:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:112px clamp(20px,5vw,52px) calc(36px + env(safe-area-inset-bottom))}',
    '#mm .mm-scroll::-webkit-scrollbar{display:none}',
    '#mm .mm-in{max-width:640px}',
    '#mm .mm-groot{font-family:"Factory Sans","Helvetica Neue",Arial,sans-serif;font-weight:600;text-transform:uppercase;letter-spacing:-.02em;color:#fff;text-decoration:none}',
    '#mm .mm-m{display:block;overflow:hidden}',
    '#mm .mm-m>*{display:flex;transform:translateY(110%);transition:transform .35s cubic-bezier(.55,0,1,.45),color .3s ease}',
    '.mm-open #mm .mm-m>*{transform:none;transition:transform .6s var(--mm-io),color .3s ease;transition-delay:calc(.2s + var(--i,0) * .05s),0s}',
    '#mm .mm-rv{opacity:0;transform:translateY(2em);transition:opacity .25s ease,transform .35s cubic-bezier(.55,0,1,.45)}',
    '.mm-open #mm .mm-rv{opacity:1;transform:none;transition:opacity .6s var(--mm-io),transform .6s var(--mm-io);transition-delay:calc(.2s + var(--i,0) * .05s)}',
    '#mm .mm-lijn{height:1px;background:rgba(255,255,255,.08);transform:scaleX(0);transform-origin:left;transition:transform .3s ease}',
    '.mm-open #mm .mm-lijn{transform:scaleX(1);transition:transform .75s var(--mm-io);transition-delay:calc(.24s + var(--i,0) * .05s)}',
    '#mm .mm-hoofd a,#mm .mm-hoofd button{align-items:center;justify-content:space-between;width:100%;padding:14px 0;background:none;border:0;cursor:pointer;font-size:clamp(36px,6.4vw,56px);line-height:1;text-align:left}',
    '#mm .mm-hoofd .mm-actief{color:#DFA701}',
    '#mm .mm-hoofd button svg{flex:none;color:#DFA701;transition:transform .5s cubic-bezier(.23,1,.32,1)}',
    '#mm .mm-hoofd button[aria-expanded="true"] svg{transform:rotate(45deg)}',
    '#mm .mm-sub{display:grid;grid-template-rows:0fr;transition:grid-template-rows .5s var(--mm-io) .1s}',
    '#mm .mm-sub.mm-uit{grid-template-rows:1fr;transition:grid-template-rows .55s var(--mm-io)}',
    '#mm .mm-sub>div{min-height:0;overflow:hidden}',
    '#mm .mm-sub a{display:flex;justify-content:space-between;align-items:center;padding:10px 0;font-size:17px;font-weight:600;color:rgba(255,255,255,.75);text-decoration:none;opacity:0;transform:translateY(1em);transition:color .3s ease,opacity .2s ease,transform .3s ease}',
    '#mm .mm-sub.mm-uit a{opacity:1;transform:none;transition:color .3s ease,opacity .5s var(--mm-io),transform .55s var(--mm-io);transition-delay:0s,calc(.06s + var(--j) * .04s),calc(.06s + var(--j) * .04s)}',
    '#mm .mm-sub a:last-child{padding-bottom:18px}',
    '#mm .mm-sub a svg{color:#DFA701;transition:transform .3s ease}',
    '#mm .mm-sub a.mm-actief{color:#fff}',
    '#mm .mm-cta{display:grid;gap:10px;margin-top:28px}',
    '#mm .mm-btn{height:52px;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 20px;box-sizing:border-box;font-family:inherit;font-size:14px;font-weight:700;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:0;transition:background-color .3s ease,border-color .3s ease,color .3s ease}',
    '#mm .mm-btn.p{background:#DFA701;color:#0B0B0B;border:0}#mm .mm-btn.p:hover{background:#C99600}',
    '#mm .mm-btn.s{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.85)}#mm .mm-btn.s:hover{background:#C99600;border-color:#C99600;color:#0B0B0B}',
    '#mm .mm-st{display:inline-flex;overflow:hidden;line-height:1.2;vertical-align:middle}',
    '#mm .mm-st .mm-ch{display:inline-block;white-space:pre;text-shadow:0 1.2em currentColor;transition:transform .5s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--c) * 16ms)}',
    '#mm .mm-btn:hover .mm-ch,#mm .mm-btn:focus-visible .mm-ch{transform:translateY(-1.2em);transition-delay:calc(140ms + var(--c) * 16ms)}',
    '#mm .mm-ar{display:inline-flex;overflow:hidden;padding:0 8px;margin:0 -8px}',
    '#mm .mm-btn:hover .mm-ar svg{animation:mmAr .6s cubic-bezier(.2,.8,.2,1)}',
    '@keyframes mmAr{0%{transform:none}45%{transform:translateX(140%)}46%{transform:translateX(-140%)}100%{transform:none}}',
    '#mm .mm-contact{margin-top:28px}',
    '#mm .mm-label{display:block;font-size:14px;font-weight:700;color:#DFA701;text-transform:uppercase}',
    '#mm .mm-contact h2{margin:6px 0 0;font-family:inherit;font-size:18px;font-weight:700;line-height:1.3;letter-spacing:0;text-transform:none}',
    '#mm .mm-rijen{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:24px}',
    '#mm .mm-crow{position:relative;display:flex;align-items:center;gap:10px;padding:10px 12px;background:transparent;border:1px solid rgba(255,255,255,.18);color:#fff;text-decoration:none;transition:background-color .3s ease,border-color .3s ease}',
    '#mm .mm-crow.wa{grid-column:1 / -1;gap:14px;padding:12px 16px 12px 12px}',
    '#mm .mm-crow:hover{background:#DFA701;border-color:#DFA701;color:#0B0B0B}#mm .mm-crow:hover *{color:#0B0B0B}',
    '#mm .mm-foto{flex:none;position:relative;width:44px;height:44px}',
    '#mm .mm-foto img{display:block;width:44px;height:44px;border-radius:50%;object-fit:cover}',
    '#mm .mm-badge{position:absolute;right:-4px;bottom:-4px;width:20px;height:20px;border-radius:50%;background:#25D366;box-shadow:0 0 0 3px #161616;display:inline-flex;align-items:center;justify-content:center;color:#fff !important}',
    '#mm .mm-crow:hover .mm-badge{box-shadow:0 0 0 3px #DFA701}#mm .mm-crow:hover .mm-badge svg{color:#fff}',
    '#mm .mm-banner{position:absolute;top:0;right:14px;transform:translateY(-50%);padding:4px 10px;background:#DFA701;color:#0B0B0B;font-size:12px;font-weight:700;white-space:nowrap;transition:background-color .3s ease,color .3s ease}',
    '#mm .mm-crow:hover .mm-banner{background:#0B0B0B;color:#DFA701 !important}',
    '#mm .mm-vk{flex:none;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;background:#DFA701;transition:background-color .3s ease}',
    '#mm .mm-crow:hover .mm-vk{background:#0B0B0B}#mm .mm-crow:hover .mm-vk svg{stroke:#DFA701}',
    '#mm .mm-t1{display:block;font-size:15px;font-weight:700;line-height:1.35}',
    '#mm .mm-t2{display:block;margin-top:2px;font-size:13px;color:rgba(255,255,255,.75)}',
    '#mm .mm-crow.wa .mm-t1{font-size:17px}',
    '@media (prefers-reduced-motion:reduce){#mm,#mm *,.mm-ham i{transition-duration:.01ms !important;transition-delay:0s !important;animation:none !important}}',
  ].join('\n');

  var hier = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  var isHier = function (href) { return href.replace(/\.html$/, '') === hier; };
  var st = function (t) { return '<span class="mm-st" aria-hidden="true">' + t.split('').map(function (c, k) { return '<span class="mm-ch" style="--c:' + k + '">' + c + '</span>'; }).join('') + '</span>'; };

  function bouw() {
    var i = 0;
    var regel = function (inh) { var r = '<div class="mm-m" style="--i:' + i + '">' + inh + '</div><div class="mm-lijn" style="--i:' + (i + 1) + '"></div>'; i++; return r; };
    var dienstActief = DIENSTEN.some(function (d) { return isHier(d[1]); });
    var html = '<div class="mm-scroll"><div class="mm-in"><nav class="mm-hoofd" aria-label="Mobiel menu">' +
      regel('<button type="button" class="mm-groot' + (dienstActief ? ' mm-actief' : '') + '" aria-expanded="false" aria-controls="mm-diensten" data-mm-sub>Diensten' + PLUS + '</button>') +
      '<div class="mm-sub" id="mm-diensten"><div>' + DIENSTEN.map(function (d, j) {
        return '<a href="' + d[1] + '" style="--j:' + j + '"' + (isHier(d[1]) ? ' class="mm-actief" aria-current="page"' : '') + ' tabindex="-1">' + d[0] + PIJL + '</a>';
      }).join('') + '</div></div>' +
      HOOFD.map(function (h) { return regel('<a class="mm-groot' + (isHier(h[1]) ? ' mm-actief" aria-current="page' : '') + '" href="' + h[1] + '">' + h[0] + '</a>'); }).join('') +
      '</nav>' +
      '<div class="mm-cta"><a class="mm-btn p mm-rv" style="--i:' + (i++) + '" href="dakscan.html" aria-label="Start dakscan">' + st('Start dakscan') + '<span class="mm-ar">' + PIJL + '</span></a>' +
      '<a class="mm-btn s mm-rv" style="--i:' + (i++) + '" href="subsidiecheck.html" aria-label="Subsidiecheck">' + st('Subsidiecheck') + '</a></div>' +
      '<div class="mm-contact"><span class="mm-label mm-rv" style="--i:' + (i++) + '">Contact</span>' +
      '<h2 class="mm-rv" style="--i:' + (i++) + '">Vragen? Vraag het aan Nicky</h2>' +
      '<div class="mm-rijen">' +
      '<a class="mm-crow wa mm-rv" style="--i:' + (i++) + '" href="' + WA_URL + '" target="_blank" rel="noopener"><span class="mm-foto"><img src="img/nicky-rond.jpg" alt="" width="44" height="44" loading="lazy"><span class="mm-badge">' + WA(11) + '</span></span><span><span class="mm-t1">WhatsApp</span><span class="mm-t2">Stuur Nicky een appje</span></span><span class="mm-banner">Reactie binnen 1 werkdag</span></a>' +
      '<a class="mm-crow mm-rv" style="--i:' + (i++) + '" href="mailto:bruckdakenzinkwerk@outlook.com"><span class="mm-vk">' + MAIL + '</span><span class="mm-t1">Mail ons</span></a>' +
      '<a class="mm-crow mm-rv" style="--i:' + i + '" href="tel:+31619623366"><span class="mm-vk">' + TEL + '</span><span class="mm-t1">Bel ons</span></a>' +
      '</div></div></div></div>';
    var el = document.createElement('div');
    el.id = 'mm'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Menu'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = html;
    return el;
  }

  function start() {
    var nav = document.querySelector('[data-floating-nav]'), header = nav && nav.querySelector('header');
    if (!header) return false;
    if (document.getElementById('mm')) return true;
    var s = document.createElement('style'); s.id = 'mm-css'; s.textContent = CSS; document.head.appendChild(s);
    // desktopknoppen markeren zodat ze onder 1024 px verdwijnen
    [].forEach.call(header.children, function (c) { if (c.tagName === 'DIV') c.classList.add('mm-desk'); });

    var knoppen = document.createElement('div');
    knoppen.className = 'mm-knoppen';
    knoppen.innerHTML = '<a class="mm-ikoon" href="' + WA_URL + '" target="_blank" rel="noopener" aria-label="WhatsApp Nicky">' + WA(20) + '</a>' +
      '<button class="mm-ikoon" type="button" aria-label="Menu openen" aria-expanded="false" aria-controls="mm"><span class="mm-ham" aria-hidden="true"><i></i><i></i><i></i></span></button>';
    header.appendChild(knoppen);
    var ham = knoppen.querySelector('button');
    var menu = bouw();
    document.body.appendChild(menu);
    var subKnop = menu.querySelector('[data-mm-sub]'), sub = menu.querySelector('.mm-sub'), scroll = menu.querySelector('.mm-scroll');
    var root = document.documentElement, open = false, sluitTimer;

    function klap(o) {
      subKnop.setAttribute('aria-expanded', o ? 'true' : 'false');
      sub.classList.toggle('mm-uit', o);
      [].forEach.call(sub.querySelectorAll('a'), function (a) { a.tabIndex = o ? 0 : -1; });
    }
    function zet(o, focusTerug) {
      if (o === open) return;
      open = o;
      clearTimeout(sluitTimer);
      root.classList.toggle('mm-open', o);
      root.classList.toggle('mm-lock', o);
      ham.setAttribute('aria-expanded', o ? 'true' : 'false');
      ham.setAttribute('aria-label', o ? 'Menu sluiten' : 'Menu openen');
      menu.setAttribute('aria-hidden', o ? 'false' : 'true');
      if (o) { scroll.scrollTop = 0; window.meet && window.meet('Menu: geopend'); }
      else {
        sluitTimer = setTimeout(function () { klap(false); }, 700);
        if (focusTerug) ham.focus();
      }
    }
    ham.addEventListener('click', function () { zet(!open); });
    subKnop.addEventListener('click', function () { klap(subKnop.getAttribute('aria-expanded') !== 'true'); });
    // links sluiten het menu (ook als ze naar dezelfde pagina gaan)
    menu.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a'); if (a && !a.target) zet(false); });
    document.addEventListener('keydown', function (e) {
      if (!open) return;
      if (e.key === 'Escape') { zet(false, true); return; }
      if (e.key === 'Tab') { // focus binnen menu en hamburger houden
        var f = [ham].concat([].slice.call(menu.querySelectorAll('a,button')).filter(function (x) { return x.tabIndex !== -1 && x.offsetParent !== null; }));
        var k = f.indexOf(document.activeElement);
        if (e.shiftKey && k <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && k === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    var mq = window.matchMedia('(min-width: ' + BP + 'px)');
    var opDesktop = function () { if (mq.matches) zet(false); };
    mq.addEventListener ? mq.addEventListener('change', opDesktop) : mq.addListener(opDesktop);
    window.addEventListener('pageshow', function () { zet(false); }); // terug-knop (bfcache)
    return true;
  }

  function probeer(n) { if (!start() && n < 40) setTimeout(function () { probeer(n + 1); }, 50); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { probeer(0); });
  else probeer(0);
})();
