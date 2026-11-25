/* Dakgegevens voor één adres, uit openbare bronnen (geen sleutel nodig). Overgenomen van de Vermeulen-dakscan.
   - PDOK Locatieserver: adrescontrole en locatie (RD + WGS84)
   - BAG (PDOK OGC API): bouwjaar en pandcontour
   - 3D BAG (TU Delft / 3DGI): dakoppervlak plat/schuin, waaruit het daktype volgt
   - PDOK Luchtfoto (WMS): actuele luchtfoto rond de woning
   Valt een bron weg, dan blijft dat gegeven leeg en werkt de scan gewoon door. */
(function () {
  var LOC = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free';
  var BAG = 'https://api.pdok.nl/kadaster/bag/ogc/v2/collections';
  var BAG3D = 'https://api.3dbag.nl/collections/pand/items/NL.IMBAG.Pand.';
  var WMS = 'https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0';
  var RD = 'http://www.opengis.net/def/crs/EPSG/0/28992';

  function getJson(url, ms) {
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, ms || 8000);
    return fetch(url, { signal: ctrl.signal })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .finally(function () { clearTimeout(t); });
  }

  function point(wkt) {
    var m = wkt && wkt.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  }

  function toAdres(d) {
    var rd = point(d.centroide_rd), ll = point(d.centroide_ll);
    if (!rd || !ll) return null;
    return {
      weergave: d.weergavenaam, straat: d.straatnaam, huis: d.huis_nlt || String(d.huisnummer),
      postcode: d.postcode, plaats: d.woonplaatsnaam, rd: rd, ll: ll, vboId: d.adresseerbaarobject_id,
      gemeente: d.gemeentenaam || undefined,
    };
  }

  /* Adres opzoeken. Resultaat: { adres } of { keuzes: [...] } (meerdere toevoegingen) of null (niet gevonden).
     Gooit bij een netwerkfout. De toevoeging mag ook in het huisnummer staan ("12a"). */
  function zoekAdres(postcode, huisnummer, toevoeging) {
    var pc = String(postcode || '').replace(/\s+/g, '').toUpperCase();
    var nr = parseInt(huisnummer, 10);
    if (!nr) return Promise.resolve(null);
    var extra = (String(huisnummer).replace(/^\d+/, '') + (toevoeging || '')).replace(/[\s-]/g, '').toUpperCase();
    var q = new URLSearchParams({ q: pc + ' ' + nr + (extra ? ' ' + extra : ''), rows: '50' });
    q.append('fq', 'type:adres'); q.append('fq', 'postcode:' + pc); q.append('fq', 'huisnummer:' + nr);
    return getJson(LOC + '?' + q).then(function (j) {
      var docs = j.response.docs.filter(function (d) { return (d.postcode || '').replace(/\s/g, '').toUpperCase() === pc && d.huisnummer === nr; });
      if (!docs.length) return null;
      var nlt = function (d) { return (d.huis_nlt || String(d.huisnummer)).replace(/[\s-]/g, '').toUpperCase(); };
      var pick = function (d) { var a = d ? toAdres(d) : null; return a ? { adres: a } : null; };
      if (extra) return pick(docs.find(function (x) { return nlt(x) === nr + extra; }));
      if (docs.length === 1) return pick(docs[0]);
      var uniek = new Map();
      docs.forEach(function (d) { var a = toAdres(d); if (a && !uniek.has(nlt(d))) uniek.set(nlt(d), a); });
      var keuzes = Array.from(uniek.values()).sort(function (a, b) { return a.huis.localeCompare(b.huis, 'nl', { numeric: true }); });
      return keuzes.length ? { keuzes: keuzes } : null;
    });
  }

  function pandVan(vboId) {
    if (!vboId) return Promise.resolve({});
    return getJson(BAG + '/verblijfsobject/items?f=json&identificatie=' + vboId).then(function (vbo) {
      var f = vbo.features[0], href = f && f.properties['pand.href'] && f.properties['pand.href'][0];
      if (!href) return {};
      return getJson(href + (href.indexOf('?') > -1 ? '&' : '?') + 'f=json&crs=' + encodeURIComponent(RD)).then(function (p) {
        var ring = p.geometry && p.geometry.type === 'Polygon' ? p.geometry.coordinates[0] : null;
        var bj = p.properties.bouwjaar;
        return {
          id: p.properties.identificatie,
          bouwjaar: bj && bj > 1000 && bj < 2100 ? bj : undefined,
          contour: ring ? ring.map(function (c) { return [c[0], c[1]]; }) : undefined,
          adressen: typeof p.properties.aantal_verblijfsobjecten === 'number' ? p.properties.aantal_verblijfsobjecten : undefined,
        };
      });
    });
  }

  function dakVan(pandId) {
    if (!pandId) return Promise.resolve({ daktype: 'onbekend' });
    return getJson(BAG3D + pandId).then(function (j) {
      var objs = Object.values(j.feature.CityObjects);
      var a = (objs.find(function (o) { return o.attributes && o.attributes.b3_dak_type !== undefined; }) || {}).attributes;
      if (!a) return { daktype: 'onbekend' };
      var n = function (k) { return typeof a[k] === 'number' ? a[k] : 0; };
      var plat = n('b3_opp_dak_plat'), schuin = n('b3_opp_dak_schuin'), grond = n('b3_opp_grond'), totaal = plat + schuin, daktype = 'onbekend';
      if (totaal > 0) { var p = plat / totaal; daktype = p > 0.85 ? 'plat' : p < 0.15 ? 'schuin' : 'combinatie'; }
      else if (typeof a.b3_dak_type === 'string') daktype = /horizontal/.test(a.b3_dak_type) ? 'plat' : a.b3_dak_type === 'slanted' ? 'schuin' : 'onbekend';
      // Helling van de schuine delen: verhouding tussen grondvlak en echte dakoppervlakte (afgerond op 5 graden).
      var helling;
      if (schuin > 0 && grond > 0) {
        var proj = Math.max(1, grond - plat), cos = Math.min(1, proj / schuin), deg = Math.acos(cos) * 180 / Math.PI;
        if (deg >= 5) helling = Math.round(deg / 5) * 5;
      }
      var rs = Math.round(schuin), rp = Math.round(plat);
      return { daktype: daktype, oppervlak: totaal > 0 ? rs + rp : undefined, oppervlakSchuin: rs || undefined, oppervlakPlat: rp || undefined, helling: helling };
    });
  }

  function kaderVan(adres, contour) {
    var cx = adres.rd[0], cy = adres.rd[1], half = 30;
    if (contour && contour.length) {
      var xs = contour.map(function (c) { return c[0]; }), ys = contour.map(function (c) { return c[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      cx = (x0 + x1) / 2; cy = (y0 + y1) / 2; half = Math.max(30, Math.max(x1 - x0, y1 - y0) / 2 + 12);
    }
    return [cx - half, cy - half, half * 2];
  }

  function luchtfotoUrl(k, px) {
    px = px || 1000;
    return WMS + '?service=WMS&request=GetMap&version=1.3.0&layers=Actueel_orthoHR&styles=&crs=EPSG:28992&bbox=' +
      k[0].toFixed(1) + ',' + k[1].toFixed(1) + ',' + (k[0] + k[2]).toFixed(1) + ',' + (k[1] + k[2]).toFixed(1) +
      '&width=' + px + '&height=' + px + '&format=image/jpeg';
  }

  /* Contour als SVG-punten in een vlak van 1000 x 1000 (zelfde kader als de luchtfoto). */
  function svgPunten(contour, k) {
    if (!contour || contour.length < 3) return '';
    return contour.map(function (c) {
      return Math.round((c[0] - k[0]) / k[2] * 1000) + ',' + Math.round((1 - (c[1] - k[1]) / k[2]) * 1000);
    }).join(' ');
  }

  function scanDak(adres) {
    return pandVan(adres.vboId).catch(function () { return {}; }).then(function (pand) {
      return dakVan(pand.id).catch(function () { return { daktype: 'onbekend' }; }).then(function (dak) {
        var k = kaderVan(adres, pand.contour);
        return {
          adres: adres, bouwjaar: pand.bouwjaar, pandId: pand.id, daktype: dak.daktype, oppervlak: dak.oppervlak,
          oppervlakSchuin: dak.oppervlakSchuin, oppervlakPlat: dak.oppervlakPlat, helling: dak.helling, adressen: pand.adressen,
          kader: k, contour: pand.contour, luchtfoto: luchtfotoUrl(k), punten: svgPunten(pand.contour, k),
        };
      });
    });
  }

  window.BruckScan = { zoekAdres: zoekAdres, scanDak: scanDak };
})();
