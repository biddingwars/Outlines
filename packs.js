/* ============================================================================
   packs.js — the content-pack registry and lazy loader (the Bidding Wars
   pattern). Only META is known at startup; a pack's data lives in its own
   pack-<id>.js, loaded the first time it is needed and cached by the service
   worker. Each pack file calls Packs.register({ data, outlines }); the pack is
   validated and prepared by the engine (a pack that fails is refused).
   ========================================================================== */
(function (root) {
  'use strict';
  const META = [
    { id: 'countries', file: 'pack-countries.js', count: 196, title: { en: 'Countries', de: 'Länder', it: 'Paesi', es: 'Países', fr: 'Pays', pt: 'Países', id: 'Negara', zh: '国家', hi: 'देश', ja: '国', ko: '나라', ar: 'الدول', th: 'ประเทศ' } },
    { id: 'states', file: 'pack-states.js', count: 50, title: { en: 'US States', de: 'US-Bundesstaaten', it: 'Stati USA', es: 'Estados de EE. UU.', fr: 'États américains', pt: 'Estados dos EUA', id: 'Negara Bagian AS', zh: '美国各州', hi: 'अमेरिकी राज्य', ja: 'アメリカの州', ko: '미국의 주', ar: 'الولايات الأمريكية', th: 'รัฐของสหรัฐฯ' } },
  ];
  const loaded = new Map(), pending = new Map();

  function register(raw) {
    const pack = root.Engine.preparePack(raw.data, raw.outlines);   // throws if invalid
    loaded.set(pack.id, pack);
    return pack;
  }

  function loadScript(file) {
    return new Promise(function (resolve, reject) {
      const s = root.document.createElement('script');
      s.src = file; s.async = true;
      s.onload = resolve;
      s.onerror = function () { s.remove(); reject(new Error('Could not load ' + file)); };
      root.document.head.appendChild(s);
    });
  }

  function load(id) {
    if (loaded.has(id)) return Promise.resolve(loaded.get(id));
    if (pending.has(id)) return pending.get(id);
    const m = META.find(x => x.id === id);
    if (!m) return Promise.reject(new Error('Unknown pack "' + id + '"'));
    const p = loadScript(m.file)
      .then(() => { if (!loaded.has(id)) throw new Error(m.file + ' did not register "' + id + '"'); return loaded.get(id); })
      .finally(() => pending.delete(id));
    pending.set(id, p);
    return p;
  }

  root.Packs = {
    META, register, load,
    get: id => loaded.get(id) || null,
    meta: id => META.find(x => x.id === id) || null,
    ids: () => META.map(m => m.id),
  };
})(self);
