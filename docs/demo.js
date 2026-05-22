/**
 * BirdNET Geomodel – Interactive Web Demo
 *
 * Runs the ONNX FP16 model entirely client-side via ONNX Runtime Web.
 * Four modes:
 *   1. Range Map    – species probability heatmap on a Leaflet map
 *   2. Richness Map – predicted species count per cell
 *   3. Species List – click a location to see predicted species
 *   4. Bar Charts   – click a location to see 48-week phenology bars
 *
 * The model input is (batch, 3) = [lat, lon, week] and output is
 * (batch, n_species) sigmoid probabilities.
 */

(function () {
  "use strict";

  // ---- Configuration -------------------------------------------------------
  var MODEL_URL = "geomodel_fp16.onnx";
  var LABELS_URL = "labels.txt";
  var TAX_URL = "taxonomy.csv";

  // ---- i18n / species names ------------------------------------------------
  var lang = "en";            // current UI + species-name language code
  var langTaxCol = "com_name"; // taxonomy.csv column for current language
  var taxByCode = {};          // species_code -> { com_name, class_name, common_name_xx, ... }
  var secondLang = "";         // optional 2nd species-name language ("" = off)
  var secondTaxCol = "";       // taxonomy column for the 2nd language

  function t(key, vars) { return window.GeoI18N.t(lang, key, vars); }

  // Common name for a label in language `code` (taxonomy column `taxCol`),
  // falling back to the English common name then the scientific name. When the
  // language column is missing/empty or merely repeats the English name, the
  // English name is shown in brackets to flag it as unresolved, e.g.
  // "[Barn Swallow]". The scientific-name fallback is never bracketed.
  function nameInCol(label, code, taxCol) {
    var row = label && taxByCode[label.key];
    if (row) {
      var en = row.com_name || "";
      var loc = row[taxCol] || "";
      if (code === "en") return en || loc || (label && (label.common || label.sci || label.key)) || "";
      if (loc && (!en || loc.toLowerCase() !== en.toLowerCase())) return loc;
      if (en) return "[" + en + "]";
      if (loc) return "[" + loc + "]";
    }
    if (label && label.common) return code === "en" ? label.common : "[" + label.common + "]";
    return (label && (label.sci || label.key)) || "";
  }

  function speciesName(label) { return nameInCol(label, lang, langTaxCol); }

  // Name in the optional second language ("" when the feature is off).
  function secondName(label) { return secondLang ? nameInCol(label, secondLang, secondTaxCol) : ""; }
  function setSecondLang(code) {
    secondLang = code || "";
    secondTaxCol = secondLang ? window.GeoI18N.langByCode(secondLang).taxCol : "";
  }

  // ---- Species-group filter (taxonomic class) ------------------------------
  // Groups present in the model: aves, mammalia, amphibia, insecta.
  var speciesGroup = "all";   // "all" or a class_name value
  var hiRes = false;          // high-resolution grid for range/richness
  var hiResFactor = 3;        // points-per-axis multiplier when hiRes is on
  var distMapToken = 0;       // guards against stale distribution-map fetches
  var recentToken = 0;        // guards against stale recent-detections fetches
  var labelClass = [];        // class_name per label index (built after load)

  function buildLabelClass() {
    labelClass = labels.map(function (l) {
      var row = taxByCode[l.key];
      return (row && row.class_name) || "";
    });
  }

  // Is the species at label index `i` in the active group?
  function inGroup(i) { return speciesGroup === "all" || labelClass[i] === speciesGroup; }

  // Richness cache key — distinct per group so counts don't collide.
  function richKey() { return "__richness__@" + speciesGroup; }

  // Grid resolution per zoom level (degrees per cell). Finer cells at deeper
  // zoom keep the heatmap detailed without exploding the cell count.
  var ZOOM_STEP = { 2: 3, 3: 2, 4: 1, 5: 0.5, 6: 0.5, 7: 0.25, 8: 0.25, 9: 0.125, 10: 0.0625, 11: 0.03125 };
  var MAX_ZOOM = 11;

  // Perceptual scaling: gamma < 1 stretches low values for visibility
  var DISPLAY_GAMMA = 0.5;

  // Preselected species (species code for quick access)
  // Curated to showcase: long-distance migrants, year-round residents,
  // pelagic seabirds, island endemics, raptors, and non-bird taxa.
  var FEATURED_SPECIES = [
    // Long-distance migrants
    { key: "barswa",  sci: "Hirundo rustica",        common: "Barn Swallow" },
    { key: "arcter",  sci: "Sterna paradisaea",      common: "Arctic Tern" },
    { key: "comcuc",  sci: "Cuculus canorus",         common: "Common Cuckoo" },
    { key: "rthhum",  sci: "Archilochus colubris",   common: "Ruby-throated Hummingbird" },
    { key: "eubeat1", sci: "Merops apiaster",         common: "European Bee-eater" },
    // Year-round residents
    { key: "gretit1", sci: "Parus major",             common: "Great Tit" },
    { key: "norcar",  sci: "Cardinalis cardinalis",   common: "Northern Cardinal" },
    { key: "supfai1", sci: "Malurus cyaneus",         common: "Superb Fairywren" },
    { key: "greroa",  sci: "Geococcyx californianus", common: "Greater Roadrunner" },
    // Pelagic seabirds
    { key: "bripet",  sci: "Hydrobates pelagicus",    common: "European Storm-Petrel" },
    { key: "wispet",  sci: "Oceanites oceanicus",     common: "Wilson\u2019s Storm-Petrel" },
    { key: "atlpuf",  sci: "Fratercula arctica",      common: "Atlantic Puffin" },
    { key: "bkbalb",  sci: "Thalassarche melanophris",common: "Black-browed Albatross" },
    // Island endemics
    { key: "hawgoo",  sci: "Branta sandvicensis",     common: "Hawaiian Goose (N\u0113n\u0113)" },
    { key: "kea1",    sci: "Nestor notabilis",        common: "Kea" },
    { key: "galhaw1", sci: "Buteo galapagoensis",     common: "Gal\u00e1pagos Hawk" },
    { key: "galpen1", sci: "Spheniscus mendiculus",   common: "Gal\u00e1pagos Penguin" },
    { key: "kagu1",   sci: "Rhynochetos jubatus",     common: "Kagu" },
    // Nocturnal species
    { key: "tawowl1", sci: "Strix aluco",             common: "Tawny Owl" },
    { key: "grhowl",  sci: "Bubo virginianus",        common: "Great Horned Owl" },
    { key: "eurnig1", sci: "Caprimulgus europaeus",   common: "Eurasian Nightjar" },
    { key: "compot1", sci: "Nyctibius griseus",       common: "Common Potoo" },
    // Non-bird taxa
    { key: "42069",   sci: "Vulpes vulpes",           common: "Red Fox" },
    { key: "41663",   sci: "Procyon lotor",           common: "Common Raccoon" },
    { key: "46001",   sci: "Sciurus vulgaris",        common: "Eurasian Red Squirrel" },
  ];

  // ---- Colormap ------------------------------------------------------------
  var COLORMAP = (function () {
    var stops = [
      [0.0,   0,   0,   4],
      [0.14, 31,  12,  72],
      [0.28, 85,  15, 109],
      [0.42, 136,  8,  79],
      [0.56, 186, 54,  36],
      [0.70, 227, 105,  5],
      [0.84, 249, 174,  10],
      [1.0,  252, 255, 164],
    ];
    var ramp = new Array(256);
    for (var i = 0; i < 256; i++) {
      var t = i / 255;
      var lo = stops[0], hi = stops[stops.length - 1];
      for (var s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s][0] && t <= stops[s + 1][0]) {
          lo = stops[s]; hi = stops[s + 1]; break;
        }
      }
      var f = (t - lo[0]) / (hi[0] - lo[0] || 1);
      ramp[i] = [
        Math.round(lo[1] + f * (hi[1] - lo[1])),
        Math.round(lo[2] + f * (hi[2] - lo[2])),
        Math.round(lo[3] + f * (hi[3] - lo[3])),
      ];
    }
    return ramp;
  })();

  function colormapLookup(p) {
    var idx = Math.max(0, Math.min(255, Math.round(p * 255)));
    return COLORMAP[idx] || [0, 0, 0];
  }

  // ---- Utilities -----------------------------------------------------------
  function perceptualNorm(raw, maxVal) {
    var out = new Float32Array(raw.length);
    if (maxVal > 0) {
      for (var i = 0; i < raw.length; i++)
        out[i] = Math.pow(raw[i] / maxVal, DISPLAY_GAMMA);
    }
    return out;
  }

  function wrapLon(v) { return ((((v + 180) % 360) + 360) % 360) - 180; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function setStatus(msg) {
    var el = document.getElementById("demo-status");
    if (el) el.textContent = msg;
  }

  function weekText(w) {
    var months = window.GeoI18N.months(lang);
    var period = window.GeoI18N.periods(lang);
    var mi = Math.floor((w - 1) / 4);
    var pi = (w - 1) % 4;
    return t("week.fmt", { w: w, period: period[pi], month: months[mi] || months[11] });
  }

  // Current BirdNET week (1–48) for today's date.
  function weekOfToday() {
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
    return Math.max(1, Math.min(48, Math.floor((dayOfYear - 1) / 365 * 48) + 1));
  }

  // ---- State ---------------------------------------------------------------
  var worker = null;
  var inferenceId = 0;
  var pendingInferences = new Map();
  var labels = [];
  var labelsByKey = {};
  var map = null;
  var overlayCanvas = null;
  var offscreenCanvas = null;   // small one-texel-per-cell buffer for smoothing
  var cachedRender = null;
  var renderCache = new Map();
  var RENDER_CACHE_MAX = 50;
  var marker = null;
  var currentMode = "range";
  var rendering = false;
  var renderGeneration = 0;
  var moveEndTimer = null;
  var lastCsvData = null;   // { filename, content } for current data product

  // Migration animation state
  var animateAll = false;   // when true, range/richness precompute all 48 weeks
  var animating = false;    // animation playback in progress
  var animTimer = null;
  var ANIM_INTERVAL = 350;  // ms between animation frames

  // Location-analysis state (Timeline / Probability / Arrivals / Scatter)
  var analysisData = null;  // { lat, lon, allProbs:Float32Array, nSpecies }
  var analysisTab = "timeline";
  var scatterSort = { column: "arrival", dir: "desc" };

  // Species the user has chosen to hide ("Do not show"). species_code -> true.
  var hiddenSpecies = {};
  var menuKey = null, menuName = "", menuSci = "";  // species the menu targets

  function isHidden(key) { return !!hiddenSpecies[key]; }
  function loadHidden() {
    hiddenSpecies = {};
    (window.GeoState.get("hidden", []) || []).forEach(function (k) { hiddenSpecies[k] = true; });
  }
  function persistHidden() { window.GeoState.save({ hidden: Object.keys(hiddenSpecies) }); }
  function hideSpecies(key) {
    if (!key) return;
    hiddenSpecies[key] = true;
    persistHidden(); refreshHiddenUI(); refreshCurrentView();
  }
  function unhideSpecies(key) {
    delete hiddenSpecies[key];
    persistHidden(); refreshHiddenUI(); refreshCurrentView();
  }

  // Clickable species-name span (opens the species menu).
  function nameLinkHtml(label) {
    var n = escapeHtml(speciesName(label));
    return '<span class="sp-link" data-key="' + escapeHtml(label.key) + '" data-name="' + n +
           '" data-sci="' + escapeHtml(label.sci || "") + '">' + n + "</span>";
  }

  function openExternal(url) { window.open(url, "_blank", "noopener"); }

  // Wikipedia article (chosen language) for a species; scientific name is the
  // most reliable search term and resolves to the localized article.
  function wikipediaUrl(sci) {
    var wl = lang === "zh-CN" ? "zh" : lang;
    return "https://" + wl + ".wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(sci);
  }

  // Open the species' Wikipedia article in the UI language, falling back to the
  // English article when the locale-language Wikipedia has no page for it.
  // The tab is opened synchronously (preserving the user gesture) and its URL
  // is set once the locale page's existence is known.
  function openWikipedia(sci) {
    var wl = lang === "zh-CN" ? "zh" : lang;
    var enUrl = "https://en.wikipedia.org/wiki/Special:Search?search=" + encodeURIComponent(sci);
    if (wl === "en") { openExternal(enUrl); return; }
    var w = window.open("about:blank", "_blank");
    var go = function (url) { if (w) { w.location.href = url; } else { openExternal(url); } };
    fetch("https://" + wl + ".wikipedia.org/w/api.php?origin=*&format=json&action=query&redirects=1&titles=" + encodeURIComponent(sci))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var pages = j.query && j.query.pages;
        var page = pages && pages[Object.keys(pages)[0]];
        var exists = page && page.missing === undefined && page.pageid !== undefined;
        go(exists ? "https://" + wl + ".wikipedia.org/wiki/" + encodeURIComponent(String(page.title || sci).replace(/ /g, "_")) : enUrl);
      })
      .catch(function () { go(enUrl); });
  }

  // Macaulay Library media catalog: eBird taxon code for birds (label keys are
  // eBird codes), else a free-text search by scientific name.
  function macaulayUrl(key, sci) {
    if (/^[a-z]/i.test(key) && !/^\d+$/.test(key)) {
      return "https://search.macaulaylibrary.org/catalog?taxonCode=" + encodeURIComponent(key);
    }
    return "https://search.macaulaylibrary.org/catalog?q=" + encodeURIComponent(sci);
  }

  // Best-effort direct factsheet slug (works only when BirdLife's genus matches
  // eBird's); used as a no-JS fallback href and last resort.
  function slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function birdlifeUrl(en, sci) {
    return "https://datazone.birdlife.org/species/factsheet/" + slugify(en) + "-" + slugify(sci);
  }

  // Open the species' BirdLife DataZone factsheet. BirdLife uses its own
  // taxonomy (e.g. Sandhill Crane is Grus canadensis there, Antigone canadensis
  // in eBird), so a slug built from eBird names can 404 / hit the wrong species.
  // Instead we look up the species' numeric BirdLife ID from Wikidata
  // (property P5257) and open /species/factsheet/<id>, which redirects to the
  // correct factsheet. The tab is opened synchronously (user gesture) and its
  // URL is set once the ID is fetched; falls back to the slug on any failure.
  function openBirdLife(en, sci) {
    var w = window.open("about:blank", "_blank");
    var done = false;
    var go = function (url) { if (done) return; done = true; if (w) { w.location.href = url; } else { openExternal(url); } };
    var fallback = birdlifeUrl(en, sci);
    setTimeout(function () { go(fallback); }, 6000);   // don't leave a blank tab if Wikidata is slow
    var wd = "https://www.wikidata.org/w/api.php?origin=*&format=json&action=";
    fetch(wd + "wbsearchentities&type=item&language=en&search=" + encodeURIComponent(sci))
      .then(function (r) { return r.json(); })
      .then(function (s) {
        var qid = s.search && s.search[0] && s.search[0].id;
        if (!qid) { go(fallback); return; }
        return fetch(wd + "wbgetclaims&property=P5257&entity=" + qid)
          .then(function (r) { return r.json(); })
          .then(function (c) {
            var cl = c.claims && c.claims.P5257;
            var v = cl && cl[0] && cl[0].mainsnak.datavalue && cl[0].mainsnak.datavalue.value;
            go(v ? "https://datazone.birdlife.org/species/factsheet/" + encodeURIComponent(v) : fallback);
          });
      })
      .catch(function () { go(fallback); });
  }
  function isBirdKey(key) { return /^aves$/i.test((taxByCode[key] || {}).class_name || ""); }

  // ---- Recent detections pop-up (iNaturalist) -----------------------------
  function hideRecent() { document.getElementById("recent-modal").style.display = "none"; }

  // WKT bounding box of radius ~km around a point (longitude scaled by latitude),
  // counter-clockwise as GBIF expects.
  function gbifGeometry(lat, lon, km) {
    var dLat = km / 111.32;
    var cos = Math.cos(lat * Math.PI / 180);
    var dLon = km / (111.32 * (cos > 0.01 ? cos : 0.01));
    var s = Math.max(-90, lat - dLat), n = Math.min(90, lat + dLat), w = lon - dLon, e = lon + dLon;
    return "POLYGON((" + w + " " + s + "," + e + " " + s + "," + e + " " + n + "," + w + " " + n + "," + w + " " + s + "))";
  }
  // Reverse-geocode the ISO-3166 alpha-2 country code for a point (cached).
  var countryCache = {};
  function countryCode(lat, lon) {
    var k = lat.toFixed(2) + "," + lon.toFixed(2);
    if (countryCache[k] !== undefined) return Promise.resolve(countryCache[k]);
    return fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=3&addressdetails=1&lat=" + lat + "&lon=" + lon, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var cc = j && j.address && j.address.country_code ? j.address.country_code.toUpperCase() : "";
        countryCache[k] = cc; return cc;
      })
      .catch(function () { countryCache[k] = ""; return ""; });
  }

  // Show recent observations of a species near the clicked location, from the
  // public iNaturalist API (no key, covers all taxa), most recent first.
  function showRecent(name, sci, lat, lon) {
    var modal = document.getElementById("recent-modal");
    var body = document.getElementById("recent-body");
    document.getElementById("recent-title").textContent = name;
    body.innerHTML = '<div class="spinner" style="margin:24px auto"></div>';
    modal.style.display = "flex";
    var webUrl = "https://www.inaturalist.org/observations?taxon_name=" + encodeURIComponent(sci) +
      "&lat=" + lat.toFixed(4) + "&lng=" + lon.toFixed(4) + "&radius=100&order_by=observed_on&order=desc";
    var token = ++recentToken;
    // GBIF link, filtered by location (a bounding box around the point) and —
    // once reverse-geocoded — country.
    var gbifBase = "https://www.gbif.org/occurrence/search?q=" + encodeURIComponent(sci) +
      "&geometry=" + encodeURIComponent(gbifGeometry(lat, lon, 5));   // ~5 km radius
    var countryParam = "";
    var gbifHref = function () { return gbifBase + countryParam; };
    var viewAll = function () {
      return '<div class="recent-links"><a href="' + escapeHtml(webUrl) + '" target="_blank" rel="noopener">' + escapeHtml(t("recent.viewall")) + '</a>' +
        ' · <a class="recent-gbif" href="' + escapeHtml(gbifHref()) + '" target="_blank" rel="noopener">GBIF</a></div>';
    };
    countryCode(lat, lon).then(function (cc) {
      if (!cc) return;
      countryParam = "&country=" + cc;
      if (token !== recentToken) return;
      var a = document.querySelector("#recent-body .recent-gbif");
      if (a) a.setAttribute("href", gbifHref());
    });
    var api = "https://api.inaturalist.org/v1/observations?verifiable=true&order_by=observed_on&order=desc&per_page=25&taxon_name=" +
      encodeURIComponent(sci) + "&lat=" + lat.toFixed(4) + "&lng=" + lon.toFixed(4) + "&radius=100";
    fetch(api).then(function (r) { return r.json(); }).then(function (j) {
      if (token !== recentToken) return;
      var obs = (j && j.results) || [];
      if (!obs.length) { body.innerHTML = '<p class="recent-none">' + escapeHtml(t("recent.none")) + "</p>" + viewAll(); return; }
      var rows = obs.map(function (o) {
        var when = o.observed_on || (o.time_observed_at || "").slice(0, 10) || "—";
        var place = escapeHtml(o.place_guess || "");
        var who = escapeHtml((o.user && (o.user.login || o.user.name)) || "");
        var href = "https://www.inaturalist.org/observations/" + o.id;
        return '<tr><td class="rc-date">' + escapeHtml(when) + '</td><td class="rc-place">' +
          '<a href="' + href + '" target="_blank" rel="noopener">' + (place || "(map)") + "</a></td>" +
          '<td class="rc-who">' + who + "</td></tr>";
      }).join("");
      body.innerHTML = '<table class="recent-table"><tbody>' + rows + "</tbody></table>" + viewAll();
    }).catch(function () {
      if (token !== recentToken) return;
      body.innerHTML = '<p class="recent-none">' + escapeHtml(t("recent.none")) + "</p>" + viewAll();
    });
  }

  // ---- Distribution-map pop-up --------------------------------------------
  // Look up a range/distribution map image for a species on Wikipedia
  // (English has the broadest coverage). We fetch the rendered article and
  // scan its <img> tags: range maps are usually named with "distribution",
  // "range", "map", "ebird" or "IUCN", but some are just an SVG named after
  // the species — so we also fuzzy-match the Latin and English names and
  // treat a species-named SVG as a likely range map. Returns {thumb, full}.
  function distMapName(s) {
    if (!s) return [];
    var l = s.toLowerCase();
    return [l.replace(/[^a-z0-9]+/g, "_"), l.replace(/[^a-z0-9]+/g, "")].filter(function (x) { return x.length > 3; });
  }
  function distMapFile(src) {
    try { return decodeURIComponent(src.split("?")[0].split("/").pop()).toLowerCase(); }
    catch (e) { return src.toLowerCase(); }
  }
  async function wikiRangeImage(sci, en) {
    var r = await fetch("https://en.wikipedia.org/w/api.php?origin=*&format=json&redirects=1&action=parse&prop=text&page=" + encodeURIComponent(sci));
    var j = await r.json();
    var html = j.parse && j.parse.text && j.parse.text["*"];
    if (!html) return null;
    var nameTok = distMapName(sci).concat(distMapName(en));
    var re = /<img\b[^>]*>/gi, m, best = null, bestScore = 0;
    while ((m = re.exec(html))) {
      var src = (m[0].match(/\bsrc="([^"]+)"/) || [])[1];
      if (!src || !/\.(png|svg|jpe?g)/i.test(src)) continue;
      var alt = (m[0].match(/\balt="([^"]*)"/) || [])[1] || "";
      var fn = distMapFile(src);            // filename only (URL path always has /wikipedia/commons/)
      var l = fn + " " + alt.toLowerCase();
      // Site chrome / status & locator icons — never a range map.
      if (/commons-logo|ambox|oojs|edit-ltr|status[_ ]?iucn|loudspeaker|symbol|poster|sound|question|padlock|pencil|magnify|increase|decrease|steady|gnome|crystal|wiki(media|pedia)/.test(l)) continue;
      var s = 0;
      if (l.indexOf("distribution") >= 0) s += 10;
      if (l.indexOf("range") >= 0) s += 6;
      if (l.indexOf("ebird") >= 0) s += 6;
      if (l.indexOf("occurrence") >= 0 || l.indexOf("occurence") >= 0) s += 6;
      if (l.indexOf("iucn") >= 0) s += 6;
      if (/[_ \-]map[_.\-]|map\.(png|svg|jpe?g)/.test(l)) s += 4;
      if (/locator|globe|blank/.test(l)) s -= 5;
      var nameHit = nameTok.some(function (tk) { return fn.indexOf(tk) >= 0; });
      if (nameHit) s += 3;
      var mapish = /distribution|range|ebird|occurrence|occurence|iucn/.test(l) || /[_ \-]map[_.\-]|map\.(png|svg|jpe?g)/.test(l);
      var svgName = /\.svg/.test(fn) && nameHit;   // species-named SVG → likely the range map
      if ((mapish || svgName) && s > bestScore) { bestScore = s; best = src; }
    }
    if (!best) return null;
    if (best.indexOf("//") === 0) best = "https:" + best;
    // `best` is the page's own thumbnail (already generated, so it loads
    // reliably). The full image is the un-thumbnailed original. We avoid
    // requesting an arbitrary thumbnail width — Wikimedia won't always
    // generate one on demand, which left the inline image broken.
    var full = best.replace(/\/thumb\/(.+)\/[^\/]+$/, "/$1");
    return { thumb: best, full: full };
  }

  function hideDistMap() { document.getElementById("distmap-modal").style.display = "none"; }

  function showDistMap(name, sci, key) {
    var modal = document.getElementById("distmap-modal");
    var body = document.getElementById("distmap-body");
    document.getElementById("distmap-title").textContent = name;
    body.innerHTML = '<div class="spinner" style="margin:24px auto"></div>';
    modal.style.display = "flex";
    var lbl = key && labelsByKey[key];
    var en = (lbl && lbl.common) || name;   // English common name helps match filenames
    var bird = key && isBirdKey(key);
    // Reference links shown in the pop-up: Wikipedia, plus BirdLife (birds only).
    function refLinks(fullUrl) {
      var h = "";
      if (fullUrl) h += '<a href="' + escapeHtml(fullUrl) + '" target="_blank" rel="noopener">' + escapeHtml(t("distmap.download")) + '</a> · ';
      h += '<a class="dm-wiki" data-sci="' + escapeHtml(sci) + '" href="' + escapeHtml(wikipediaUrl(sci)) + '" target="_blank" rel="noopener">Wikipedia</a>';
      if (bird) h += ' · <a class="dm-birdlife" data-en="' + escapeHtml(en) + '" data-sci="' + escapeHtml(sci) + '" href="' + escapeHtml(birdlifeUrl(en, sci)) + '" target="_blank" rel="noopener">BirdLife</a>';
      return h;
    }
    function showNone() {
      body.innerHTML = '<p class="distmap-none">' + escapeHtml(t("distmap.none")) + '</p>' +
        '<div class="distmap-links">' + refLinks(null) + '</div>';
    }
    var token = ++distMapToken;
    wikiRangeImage(sci, en).then(function (res) {
      if (token !== distMapToken) return;   // a newer request superseded this
      if (res) {
        body.innerHTML = '<div class="distmap-links">' + refLinks(res.full) + '</div>';
        // Display the full original (loads reliably; CSS scales it to fit),
        // falling back to the page's own thumbnail if the original fails.
        var img = document.createElement("img");
        img.className = "distmap-img";
        img.alt = name;
        img.onerror = function () {
          if (img.src !== res.thumb) { img.src = res.thumb; }    // fall back to page thumbnail
          else { img.style.display = "none"; }                   // both failed: keep links only
        };
        img.src = res.full;
        body.insertBefore(img, body.firstChild);
      } else {
        showNone();
      }
    }).catch(function () {
      if (token !== distMapToken) return;
      showNone();
    });
  }

  // "Filter" action: drop the name into the analysis filter box and apply it.
  function applyNameFilter(name) {
    var f = document.getElementById("an-filter");
    if (f) f.value = name;
    if (currentMode === "barchart" && analysisData) renderActiveTab();
  }

  // Base map tile layers
  var baseLayer = null;
  var CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
  var BASEMAPS = {
    dark:  { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",  attribution: CARTO_ATTR, subdomains: "abcd" },
    light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTR, subdomains: "abcd" },
    // Street/political (standard OpenStreetMap)
    streets: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
               attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', subdomains: "abc" },
    // Topographic / terrain (contours + relief)
    topo:  { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
             attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)', subdomains: "abc" },
    // Satellite imagery
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                 attribution: 'Imagery &copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics' } };

  // Capture script location at parse time (before DOMContentLoaded fires)
  var SCRIPT_BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src : window.location.href;

  // ---- Bootstrap -----------------------------------------------------------
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    var root = document.getElementById("demo-root");
    if (!root) return;

    root.innerHTML =
      '<div id="demo-loading"><div class="spinner"></div><span data-i18n="app.loading">Loading\u2026</span></div>' +
      '<div id="demo-app" style="display:none">' +
        '<div id="demo-controls">' +
          '<div class="ctrl-group">' +
            '<label for="mode-select" data-i18n="ctrl.mode">Mode</label>' +
            '<select id="mode-select">' +
              '<option value="range" data-i18n="mode.range">Species Range</option>' +
              '<option value="richness" data-i18n="mode.richness">Species Richness</option>' +
              '<option value="list" data-i18n="mode.list">Species List (click map)</option>' +
              '<option value="barchart" data-i18n="mode.barchart">Migration Timeline (click map)</option>' +
            '</select>' +
          '</div>' +
          '<div class="ctrl-group" id="species-search-wrap">' +
            '<label for="species-search" data-i18n="ctrl.species">Species</label>' +
            '<input id="species-search" type="text" autocomplete="off" data-i18n-ph="ph.species" placeholder="Search species\u2026" />' +
            '<div id="species-results"></div>' +
          '</div>' +
          '<div class="ctrl-group" id="week-select-wrap">' +
            '<label for="week-select" data-i18n="ctrl.week">Week</label>' +
            '<select id="week-select"></select>' +
          '</div>' +
          '<div class="ctrl-group ctrl-group-btn" id="play-btn-wrap">' +
            '<button id="play-btn" class="demo-btn" data-i18n="btn.play">\u25b6 Play migration</button>' +
          '</div>' +
          '<div class="ctrl-group" id="savedloc-wrap">' +
            '<label data-i18n="ctrl.savedloc">Saved locations</label>' +
            '<button type="button" id="savedloc-toggle" class="dd-toggle"><span id="savedloc-btn-text"></span><span class="dd-caret" aria-hidden="true">▾</span></button>' +
            '<div id="savedloc-panel" class="dd-panel" style="display:none"></div>' +
          '</div>' +
          '<div class="ctrl-group" id="hidden-wrap" style="display:none">' +
            '<label data-i18n="ctrl.hidden">Hidden species</label>' +
            '<button type="button" id="hidden-btn" class="dd-toggle"><span id="hidden-btn-text"></span><span class="dd-caret" aria-hidden="true">▾</span></button>' +
            '<div id="hidden-panel" class="dd-panel" style="display:none"></div>' +
          '</div>' +
          '<div class="ctrl-group" id="checklists-wrap" style="display:none">' +
            '<label data-i18n="ctrl.checklists">Checklists</label>' +
            '<button type="button" id="checklists-toggle" class="dd-toggle"><span id="checklists-btn-text"></span><span class="dd-caret" aria-hidden="true">▾</span></button>' +
            '<div id="checklists-panel" class="dd-panel" style="display:none"></div>' +
          '</div>' +
          '<div class="ctrl-group ctrl-group-btn" id="saveloc-btn-wrap" style="display:none">' +
            '<button id="saveloc-btn" class="demo-btn" data-i18n="btn.saveloc">\u2605 Save</button>' +
          '</div>' +
        '</div>' +
        '<div id="demo-status">&nbsp;</div>' +
        '<div id="demo-map-wrap">' +
          '<div id="demo-map"></div>' +
          '<div id="demo-computing" style="display:none">' +
            '<div class="spinner"></div>' +
            '<div id="computing-text">Computing\u2026</div>' +
            '<div id="computing-progress-wrap"><div id="computing-progress-bar"></div></div>' +
          '</div>' +
          '<div id="demo-legend"></div>' +
        '</div>' +
        '<div id="map-controls">' +
          '<div class="ctrl-group">' +
            '<label for="lang-select" data-i18n="ctrl.language">Language</label>' +
            '<select id="lang-select"></select>' +
          '</div>' +
          '<div class="ctrl-group">' +
            '<label for="basemap-select" data-i18n="ctrl.basemap">Base map</label>' +
            '<select id="basemap-select">' +
              '<option value="dark" data-i18n="basemap.dark">Dark</option>' +
              '<option value="light" data-i18n="basemap.light">Light</option>' +
              '<option value="streets" data-i18n="basemap.streets">Streets</option>' +
              '<option value="topo" data-i18n="basemap.topo">Topographic</option>' +
              '<option value="satellite" data-i18n="basemap.satellite">Satellite</option>' +
            '</select>' +
          '</div>' +
          '<div class="ctrl-group">' +
            '<label for="group-select" data-i18n="ctrl.group">Species group</label>' +
            '<select id="group-select">' +
              '<option value="all" data-i18n="group.all">All groups</option>' +
              '<option value="aves" data-i18n="group.aves">Birds</option>' +
              '<option value="mammalia" data-i18n="group.mammalia">Mammals</option>' +
              '<option value="amphibia" data-i18n="group.amphibia">Amphibians</option>' +
              '<option value="insecta" data-i18n="group.insecta">Insects</option>' +
            '</select>' +
          '</div>' +
          '<div class="ctrl-group" id="hires-wrap" style="display:none">' +
            '<div class="hires-row">' +
              '<label class="hires-label"><input type="checkbox" id="hires-toggle" /> <span data-i18n="ctrl.hires">High resolution</span></label>' +
              '<select id="hires-factor" title="Resolution factor (points per axis)">' +
                '<option>1</option><option>2</option><option selected>3</option><option>5</option><option>7</option><option>9</option><option>11</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="ctrl-group" id="secondlang-wrap" style="display:none">' +
            '<label for="secondlang-select" data-i18n="ctrl.secondlang">2nd name</label>' +
            '<select id="secondlang-select"></select>' +
          '</div>' +
          '<div class="ctrl-group" id="compare-wrap" style="display:none">' +
            '<label for="compare-select" data-i18n="ctrl.compare">Compare to</label>' +
            '<select id="compare-select">' +
              '<option value="" data-i18n="compare.none">— none —</option>' +
              '<option value="prev" selected data-i18n="compare.prev">Previous week</option>' +
              '<option value="next" data-i18n="compare.next">Next week</option>' +
              '<option value="mean" data-i18n="compare.mean">Annual mean</option>' +
              '<option value="annualmax" data-i18n="compare.max">Annual max</option>' +
              '<option value="annualtop" data-i18n="compare.annualtop">Annual Top</option>' +
            '</select>' +
          '</div>' +
          '<div class="ctrl-group" id="barchart-threshold-wrap" style="display:none">' +
            '<label data-i18n="ctrl.bcthreshold">Probability range</label>' +
            '<div id="prob-range">' +
              '<div class="pr-track"></div>' +
              '<input type="range" id="prob-min" min="0" max="100" step="1" value="5" />' +
              '<input type="range" id="prob-max" min="0" max="100" step="1" value="100" />' +
            '</div>' +
            '<div id="prob-range-vals"><span id="prob-min-val">5%</span> – <span id="prob-max-val">100%</span></div>' +
          '</div>' +
        '</div>' +
        '<div id="csv-btn-wrap" style="display:none">' +
          '<button id="csv-download-btn" class="demo-btn" data-i18n="btn.csv" title="Download CSV">\u2b07 CSV</button>' +
        '</div>' +
        '<div id="species-panel">' +
          '<h3 id="sp-title" data-i18n="panel.spTitle">Species at location</h3>' +
          '<div class="sp-coords" id="sp-coords"></div>' +
          '<div class="sp-actions"><button id="new-checklist-btn" class="demo-btn" data-i18n="btn.newchecklist">＋ Checklist</button></div>' +
          '<table id="species-list-table">' +
            '<thead><tr><th data-i18n="th.rank">#</th><th data-i18n="th.species">Species</th><th class="name2" id="sp-name2-head"></th><th data-i18n="th.sci">Scientific name</th><th data-i18n="th.prob">Probability</th><th></th><th id="sp-delta-head"></th></tr></thead>' +
            '<tbody id="sp-tbody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div id="barchart-panel">' +
          '<h3 id="bc-title" data-i18n="panel.bcTitle">Location analysis</h3>' +
          '<div id="an-tabs">' +
            '<button class="an-tab" data-tab="timeline" data-i18n="tab.timeline">Timeline</button>' +
            '<button class="an-tab" data-tab="prob" data-i18n="tab.prob">Probability</button>' +
            '<button class="an-tab" data-tab="arrival" data-i18n="tab.arrival">Arrivals</button>' +
            '<button class="an-tab" data-tab="focus" data-i18n="tab.focus">Focus</button>' +
            '<button class="an-tab" data-tab="scatter" data-i18n="tab.scatter">Scatter</button>' +
          '</div>' +
          '<div id="an-controls">' +
            '<input id="an-filter" type="text" autocomplete="off" data-i18n-ph="ph.filter" placeholder="Filter species…" />' +
            '<label id="an-topn-wrap"><span data-i18n="ctrl.topN">Top N</span> ' +
              '<input id="an-topn" type="number" min="1" max="500" value="55" /> ' +
              '<span data-i18n="ctrl.rankby">Rank by</span> ' +
              '<select id="an-rankby">' +
                '<option value="arrival" data-i18n="rank.arrival">Arrivals</option>' +
                '<option value="prob" data-i18n="rank.prob">Probability</option>' +
                '<option value="both" data-i18n="rank.both">Both</option>' +
              '</select></label>' +
          '</div>' +
          '<div class="sp-coords" id="bc-coords"></div>' +
          '<div id="bc-container"></div>' +
        '</div>' +
        '<div id="checklist-panel" style="display:none">' +
          '<div class="chk-actions">' +
            '<button id="chk-print" class="demo-btn" data-i18n="btn.print">Print</button>' +
            '<button id="chk-csv" class="demo-btn" data-i18n="btn.csv">⬇ CSV</button>' +
            '<button id="chk-delete" class="demo-btn demo-btn-danger" data-i18n="btn.delete">Delete</button>' +
            '<button id="chk-close" class="demo-btn demo-btn-light" data-i18n="btn.close">Close</button>' +
          '</div>' +
          '<div id="chk-body"></div>' +
        '</div>' +
        '<div id="sp-menu" style="display:none">' +
          '<button type="button" class="sp-menu-item" data-act="recent" data-i18n="menu.recent">Recent detections</button>' +
          '<button type="button" class="sp-menu-item" data-act="distmap" data-i18n="menu.distmap">Distribution map</button>' +
          '<button type="button" class="sp-menu-item" data-act="wiki" data-i18n="menu.wiki">Wikipedia</button>' +
          '<button type="button" class="sp-menu-item" data-act="birdlife" data-i18n="menu.birdlife">BirdLife</button>' +
          '<button type="button" class="sp-menu-item" data-act="macaulay" data-i18n="menu.macaulay">Macaulay Library</button>' +
          '<button type="button" class="sp-menu-item" data-act="filter" data-i18n="menu.filter">Filter</button>' +
          '<button type="button" class="sp-menu-item" data-act="hide" data-i18n="menu.hide">Do not show</button>' +
        '</div>' +
        '<div id="distmap-modal" style="display:none"><div id="distmap-box">' +
          '<button type="button" id="distmap-close" aria-label="Close">×</button>' +
          '<h3 id="distmap-title"></h3>' +
          '<div id="distmap-body"></div>' +
        '</div></div>' +
        '<div id="recent-modal" style="display:none"><div id="recent-box">' +
          '<button type="button" id="recent-close" aria-label="Close">×</button>' +
          '<h3 id="recent-title"></h3>' +
          '<div id="recent-body"></div>' +
        '</div></div>' +
        '<details id="about-panel">' +
          '<summary data-i18n="about.title">About the model &amp; how values are computed</summary>' +
          '<div id="about-body"></div>' +
        '</details>' +
        '<div id="demo-footer" data-i18n="footer.attrib"></div>' +
        '<div id="last-change"></div>' +
        '<div id="visit-counter"><img src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fpcmoan70.github.io%2Fmigration_calendar&label=page%20visits&labelColor=%230f1b24&countColor=%232f6f4f" alt="page visits" /></div>' +
        '<div id="perf-modal" style="display:none"><div id="perf-modal-box">' +
          '<p data-i18n="popup.perf"></p>' +
          '<button id="perf-modal-ok" class="demo-btn" data-i18n="popup.ok">OK</button>' +
        '</div></div>' +
      '</div>';

    // Restore saved language before building the UI text.
    setLang(window.GeoState.get("lang", defaultLang()), true);

    try {
      await Promise.all([initWorker(), loadLabels(), loadTaxonomy()]);
      buildLabelClass();
      document.getElementById("demo-loading").style.display = "none";
      document.getElementById("demo-app").style.display = "block";
      populateLangSelect();
      populateWeekSelect();
      restoreControls();
      populateSecondLangSelect();
      updateAnalysisControls();
      applyI18n();
      initMap();
      bindControls();
      refreshSavedLocations();
      refreshHiddenUI();
      refreshChecklists();
      setStatus(t("status.selectSpecies"));
      showLastChange();
      showPerfModal();
    } catch (e) {
      document.getElementById("demo-loading").innerHTML =
        '<span style="color:red">' + t("app.failed", { msg: e.message }) + '</span>';
      console.error(e);
    }
  }

  // ---- Model & labels ------------------------------------------------------
  async function initWorker() {
    setStatus("Loading ONNX model\u2026");
    worker = new Worker(new URL("inference-worker.js", SCRIPT_BASE).href);
    worker.onerror = function (err) { console.error("Worker error:", err); };

    await new Promise(function (resolve, reject) {
      worker.onmessage = function (e) {
        if (e.data.type === "init") {
          if (e.data.ok) resolve();
          else reject(new Error(e.data.error || "Worker init failed"));
        }
      };
      worker.postMessage({ type: "init", modelUrl: new URL(MODEL_URL, SCRIPT_BASE).href });
    });

    worker.onmessage = function (e) {
      var msg = e.data;
      if (msg.type !== "infer") return;
      var p = pendingInferences.get(msg.id);
      if (!p) return;
      pendingInferences.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(new Float32Array(msg.data));
    };
  }

  async function loadLabels() {
    var resp = await fetch(new URL(LABELS_URL, SCRIPT_BASE).href);
    var text = await resp.text();
    labels = text.trim().split("\n").map(function (line, i) {
      var parts = line.split("\t");
      return { key: parts[0], sci: parts[1] || "", common: parts[2] || parts[1] || "", index: i };
    });
    labelsByKey = {};
    labels.forEach(function (l) { labelsByKey[l.key] = l; });
  }

  // ---- Taxonomy (multilingual common names) --------------------------------
  // Parses taxonomy.csv into taxByCode keyed by species_code (== labels key).
  async function loadTaxonomy() {
    var resp = await fetch(new URL(TAX_URL, SCRIPT_BASE).href);
    var text = await resp.text();
    var rows = parseCsv(text);
    if (!rows.length) return;
    var header = rows[0];
    var codeCol = header.indexOf("species_code");
    if (codeCol < 0) return;
    // Only retain columns we actually use (com_name + class_name + languages).
    var wanted = { com_name: true, class_name: true };
    window.GeoI18N.LANGS.forEach(function (L) { wanted[L.taxCol] = true; });
    var keep = [];
    for (var c = 0; c < header.length; c++) if (wanted[header[c]]) keep.push(c);
    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      var code = row[codeCol];
      if (!code) continue;
      var obj = {};
      for (var k = 0; k < keep.length; k++) {
        var ci = keep[k];
        if (row[ci]) obj[header[ci]] = row[ci];
      }
      taxByCode[code] = obj;
    }
  }

  // Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, newlines).
  function parseCsv(text) {
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\n") {
        row.push(field); field = ""; rows.push(row); row = [];
      } else if (ch === "\r") {
        /* ignore */
      } else {
        field += ch;
      }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
  }

  // ---- Language & i18n -----------------------------------------------------
  function defaultLang() {
    var nav = (navigator.language || "en");
    var codes = window.GeoI18N.LANGS.map(function (L) { return L.code; });
    if (codes.indexOf(nav) >= 0) return nav;
    var base = nav.split("-")[0];
    return codes.indexOf(base) >= 0 ? base : "en";
  }

  function setLang(code, skipRefresh) {
    var L = window.GeoI18N.langByCode(code);
    lang = L.code;
    langTaxCol = L.taxCol;
    document.documentElement.setAttribute("lang", lang);
    if (skipRefresh) return;
    window.GeoState.save({ lang: lang });
    applyI18n();
    populateWeekSelect();   // re-label weeks in the new language
    populateSecondLangSelect();   // re-localize the "(none)" option
    refreshSavedLocations();
    refreshHiddenUI();      // re-localize hidden-species chip names
    refreshCurrentView();   // re-render species names in the active panel
  }

  function populateLangSelect() {
    var sel = document.getElementById("lang-select");
    sel.innerHTML = window.GeoI18N.LANGS.map(function (L) {
      return '<option value="' + L.code + '"' + (L.code === lang ? " selected" : "") + ">" + L.name + "</option>";
    }).join("");
  }

  // Second-name language selector: "(none)" + every language.
  function populateSecondLangSelect() {
    var sel = document.getElementById("secondlang-select");
    var html = '<option value="">' + escapeHtml(t("compare.none")) + "</option>";
    html += window.GeoI18N.LANGS.map(function (L) {
      return '<option value="' + L.code + '"' + (L.code === secondLang ? " selected" : "") + ">" + L.name + "</option>";
    }).join("");
    sel.innerHTML = html;
  }

  // Apply translations to every [data-i18n] / [data-i18n-ph] element.
  function applyI18n() {
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute("data-i18n"));
    var phs = document.querySelectorAll("[data-i18n-ph]");
    for (var j = 0; j < phs.length; j++) phs[j].setAttribute("placeholder", t(phs[j].getAttribute("data-i18n-ph")));
    var selSp = document.getElementById("species-search");
    if (selSp && selSp.dataset.selectedKey && labelsByKey[selSp.dataset.selectedKey]) {
      var lbl = labelsByKey[selSp.dataset.selectedKey];
      selSp.setAttribute("placeholder", speciesName(lbl) + " (" + lbl.sci + ")");
    }
    var about = document.getElementById("about-body");
    if (about) about.innerHTML = t("about.html");   // raw HTML doc, localized
    updateLegend();
  }

  // Build the 48-week dropdown with localized labels.
  function populateWeekSelect() {
    var sel = document.getElementById("week-select");
    var cur = +sel.value || 1;
    var html = "";
    for (var w = 1; w <= 48; w++) html += '<option value="' + w + '">' + weekText(w) + "</option>";
    sel.innerHTML = html;
    sel.value = cur;
  }

  // Re-render whatever panel/overlay is currently shown (after a language change).
  function refreshCurrentView() {
    if (currentMode === "list" && marker) {
      var ll = marker.getLatLng();
      renderSpeciesList(ll.lat, ll.lng);
    } else if (currentMode === "barchart" && analysisData) {
      renderActiveTab();
    } else if ((currentMode === "range" || currentMode === "richness") && cachedRender) {
      showCachedWeek();
    }
  }

  // ---- Map setup -----------------------------------------------------------
  function initMap() {
    var view = window.GeoState.get("view", null);
    var center = (view && view.lat != null) ? [view.lat, view.lon] : [30, 0];
    var zoom = (view && view.zoom != null) ? view.zoom : 2;
    // Constrain to a single world copy so panning can't yield out-of-range
    // longitudes (e.g. a click returning lon = 635) and the range overlay
    // always projects onto the visible map.
    map = L.map("demo-map", {
      center: center, zoom: zoom, minZoom: 2, maxZoom: MAX_ZOOM,
      worldCopyJump: true,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1.0,
    });

    setBasemap(window.GeoState.get("basemap", "dark"));

    map.on("click", onMapClick);
    map.on("moveend", function () {
      var c = map.getCenter();
      window.GeoState.save({ view: { lat: c.lat, lon: c.lng, zoom: map.getZoom() } });
      if (currentMode !== "range" && currentMode !== "richness") return;
      if (animating) return;   // don't re-render mid-animation
      paintOverlay();
      clearTimeout(moveEndTimer);
      moveEndTimer = setTimeout(triggerRender, 300);
    });

    // Initial render for map modes (renders richness, or range if a species
    // was restored; range without a species is a no-op).
    if (currentMode === "range" || currentMode === "richness") triggerRender();
  }

  function triggerRender() {
    if (currentMode === "richness") renderRichness();
    else if (currentMode === "range") renderRangeMap();
  }

  function setBasemap(which) {
    var cfg = BASEMAPS[which] || BASEMAPS.dark;
    if (baseLayer) map.removeLayer(baseLayer);
    // subdomains must not be undefined — Leaflet reads .length even when the
    // URL has no {s} placeholder (e.g. the Esri satellite layer).
    baseLayer = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: MAX_ZOOM, subdomains: cfg.subdomains || "abc" });
    baseLayer.addTo(map);
    baseLayer.bringToBack();
    document.body.setAttribute("data-basemap", which);
    var sel = document.getElementById("basemap-select");
    if (sel) sel.value = which;
    window.GeoState.save({ basemap: which });
  }

  // ---- Controls ------------------------------------------------------------
  // Show/hide controls and panels appropriate to the active mode.
  function updateModeVisibility() {
    var isRange = currentMode === "range";
    var isMap = currentMode === "range" || currentMode === "richness";
    document.getElementById("species-search-wrap").style.display = isRange ? "" : "none";
    // Species List + Species Range both produce a per-point species list (which
    // uses "Compare to" and the 2nd-name column), so show these in both.
    var listish = currentMode === "list" || currentMode === "range";
    document.getElementById("compare-wrap").style.display = listish ? "" : "none";
    document.getElementById("secondlang-wrap").style.display = listish ? "" : "none";
    // The probability min–max slider applies to the Species List, the checklist
    // (derived from it) and the analysis tabs.
    document.getElementById("barchart-threshold-wrap").style.display = (currentMode === "range" || currentMode === "list" || currentMode === "barchart") ? "" : "none";
    // Week applies in every mode (incl. Migration timeline, where it sets the
    // "current week" used by the Probability / Arrivals / Scatter tabs).
    document.getElementById("week-select-wrap").style.display = "";
    document.getElementById("play-btn-wrap").style.display = isMap ? "" : "none";
    document.getElementById("hires-wrap").style.display = isMap ? "" : "none";
    relocateCsvButton();
  }

  // Show the "Last change" timestamp (written into last-change.txt by the
  // pre-commit hook on every commit/push to main).
  function showLastChange() {
    var el = document.getElementById("last-change");
    if (!el) return;
    fetch("last-change.txt", { cache: "no-store" }).then(function (r) {
      return r.ok ? r.text() : "";
    }).then(function (txt) {
      txt = (txt || "").trim();
      if (txt) el.textContent = t("footer.lastchange", { t: txt });
    }).catch(function () { /* offline — leave blank */ });
  }

  // One-time performance note shown over the page on load.
  function showPerfModal() {
    var m = document.getElementById("perf-modal");
    if (m) m.style.display = "flex";
  }
  function hidePerfModal() {
    var m = document.getElementById("perf-modal");
    if (m) m.style.display = "none";
  }

  // In Species List mode the CSV button sits next to the "＋ Checklist" button;
  // in every other mode it lives directly below the map.
  function relocateCsvButton() {
    var wrap = document.getElementById("csv-btn-wrap");
    if (!wrap) return;
    if (currentMode === "list") {
      var sa = document.querySelector("#species-panel .sp-actions");
      if (sa && wrap.parentNode !== sa) sa.appendChild(wrap);
    } else {
      var anchor = document.getElementById("map-controls");
      if (anchor && wrap.previousElementSibling !== anchor) {
        anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
      }
    }
  }

  function bindControls() {
    var modeEl = document.getElementById("mode-select");
    modeEl.addEventListener("change", function () {
      stopAnimation();
      currentMode = modeEl.value;
      window.GeoState.save({ mode: currentMode });
      updateModeVisibility();
      document.getElementById("species-panel").style.display = "none";
      document.getElementById("barchart-panel").style.display = "none";
      hideCsvBtn();
      hideSaveLocBtn();
      if (cachedRender) clearOverlay();
      if (marker) { map.removeLayer(marker); marker = null; }
      updateLegend();
      if (currentMode === "range" || currentMode === "richness") triggerRender();
    });

    document.getElementById("lang-select").addEventListener("change", function () {
      setLang(this.value);
    });

    document.getElementById("secondlang-select").addEventListener("change", function () {
      setSecondLang(this.value);
      window.GeoState.save({ secondLang: secondLang });
      rerenderPointList();
    });

    document.getElementById("basemap-select").addEventListener("change", function () {
      setBasemap(this.value);
    });

    document.getElementById("hires-toggle").addEventListener("change", function () {
      hiRes = this.checked;
      window.GeoState.save({ hiRes: hiRes });
      if (currentMode === "range" || currentMode === "richness") { clearOverlay(); triggerRender(); }
    });

    document.getElementById("hires-factor").addEventListener("change", function () {
      hiResFactor = +this.value || 1;
      window.GeoState.save({ hiResFactor: hiResFactor });
      if (hiRes && (currentMode === "range" || currentMode === "richness")) { clearOverlay(); triggerRender(); }
    });

    document.getElementById("perf-modal-ok").addEventListener("click", hidePerfModal);
    document.getElementById("perf-modal").addEventListener("click", function (e) {
      if (e.target === this) hidePerfModal();   // click outside the box
    });
    document.getElementById("distmap-close").addEventListener("click", hideDistMap);
    document.getElementById("distmap-modal").addEventListener("click", function (e) {
      if (e.target === this) hideDistMap();
    });
    document.getElementById("recent-close").addEventListener("click", hideRecent);
    document.getElementById("recent-modal").addEventListener("click", function (e) {
      if (e.target === this) hideRecent();
    });
    // Pop-up reference links: Wikipedia uses the locale→English fallback;
    // BirdLife resolves the factsheet via its numeric ID.
    document.getElementById("distmap-body").addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var wk = e.target.closest(".dm-wiki");
      if (wk) { e.preventDefault(); openWikipedia(wk.getAttribute("data-sci")); return; }
      var bl = e.target.closest(".dm-birdlife");
      if (bl) { e.preventDefault(); openBirdLife(bl.getAttribute("data-en"), bl.getAttribute("data-sci")); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { hidePerfModal(); hideDistMap(); hideRecent(); }
    });

    document.getElementById("group-select").addEventListener("change", function () {
      speciesGroup = this.value;
      window.GeoState.save({ group: speciesGroup });
      // Re-render whatever depends on the species set.
      if (currentMode === "richness") triggerRender();
      else if (currentMode === "barchart" && analysisData) renderActiveTab();
      else rerenderPointList();   // list or range (per-point list)
      // Refresh an open species-search dropdown.
      var resEl = document.getElementById("species-results");
      if (resEl && resEl.style.display === "block") showSearch(document.getElementById("species-search"), resEl);
    });

    // Analysis tab bar
    var tabs = document.querySelectorAll("#an-tabs .an-tab");
    for (var ti = 0; ti < tabs.length; ti++) {
      tabs[ti].addEventListener("click", function () {
        analysisTab = this.getAttribute("data-tab");
        window.GeoState.save({ analysisTab: analysisTab });
        updateAnalysisControls();
        renderActiveTab();
      });
    }
    document.getElementById("an-filter").addEventListener("input", function () { renderActiveTab(); });
    document.getElementById("an-topn").addEventListener("input", function () {
      if (analysisTab === "scatter") renderActiveTab();
    });
    document.getElementById("an-rankby").addEventListener("change", function () {
      window.GeoState.save({ scatterRankBy: this.value });
      if (analysisTab === "scatter") renderActiveTab();
    });

    document.getElementById("week-select").addEventListener("change", function () {
      window.GeoState.save({ week: +this.value });
      if (currentMode === "range" || currentMode === "richness") showCachedWeek();  // re-filter cached cells
      if (currentMode === "barchart" && analysisData) renderActiveTab();
      rerenderPointList();   // update the per-point list (list or range with a marker)
      updateLegend();
    });

    document.getElementById("compare-select").addEventListener("change", function () {
      window.GeoState.save({ compare: this.value });
      rerenderPointList();
    });

    // Two-sided probability range (min/max) shared by the Species List and the
    // analysis tabs (and used when building a checklist).
    function onProbRange(e) {
      var loEl = document.getElementById("prob-min"), hiEl = document.getElementById("prob-max");
      var lo = +loEl.value, hi = +hiEl.value;
      // Keep min ≤ max by pushing whichever handle the user is dragging.
      if (lo > hi) { if (e && e.target === loEl) hiEl.value = lo, hi = lo; else loEl.value = hi, lo = hi; }
      document.getElementById("prob-min-val").textContent = lo + "%";
      document.getElementById("prob-max-val").textContent = hi + "%";
      window.GeoState.save({ probMin: lo, probMax: hi });
      if (currentMode === "barchart" && analysisData) { renderActiveTab(); return; }
      // Range: re-filter the cached overlay (no re-inference). List/Range: also
      // refresh the per-point list. The probability range never recomputes the map.
      if (currentMode === "range" && cachedRender) showCachedWeek();
      rerenderPointList();
    }
    document.getElementById("prob-min").addEventListener("input", onProbRange);
    document.getElementById("prob-max").addEventListener("input", onProbRange);

    document.getElementById("play-btn").addEventListener("click", toggleAnimation);

    // Stop the migration animation when the tab is hidden so it never runs
    // unattended in a backgrounded window.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && animating) stopAnimation();
    });

    document.getElementById("saveloc-btn").addEventListener("click", saveCurrentLocation);

    // Dropdown popovers (Hidden species, Saved locations).
    function wireDropdown(btnId, panelId) {
      document.getElementById(btnId).addEventListener("click", function (e) {
        e.stopPropagation();
        var p = document.getElementById(panelId);
        var willOpen = p.style.display === "none";
        closeDropdowns();
        p.style.display = willOpen ? "block" : "none";
      });
    }
    wireDropdown("hidden-btn", "hidden-panel");
    wireDropdown("savedloc-toggle", "savedloc-panel");
    wireDropdown("checklists-toggle", "checklists-panel");

    // Checklist actions
    document.getElementById("new-checklist-btn").addEventListener("click", makeChecklistFromList);
    document.getElementById("chk-print").addEventListener("click", function () { window.print(); });
    document.getElementById("chk-csv").addEventListener("click", function () {
      var c = getChecklist(currentChecklistId);
      if (c) downloadCsv("checklist_" + c.name.replace(/[^\w-]+/g, "_") + ".csv", buildChecklistCsv(c));
    });
    document.getElementById("chk-delete").addEventListener("click", function () {
      if (!currentChecklistId) return;
      var id = currentChecklistId;
      saveChecklists(getChecklists().filter(function (c) { return c.id !== id; }));
      closeChecklist(); refreshChecklists(); refreshCurrentView();
    });
    document.getElementById("chk-close").addEventListener("click", function () { closeChecklist(); refreshCurrentView(); });

    document.getElementById("csv-download-btn").addEventListener("click", function () {
      if (lastCsvData) downloadCsv(lastCsvData.filename, lastCsvData.content);
    });

    // Species-name context menu: clicking a name (in any list/table) opens a
    // small menu with "Filter" and "Do not show".
    var spMenu = document.getElementById("sp-menu");
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest(".sp-link") : null;
      if (link) {
        e.preventDefault();
        menuKey = link.getAttribute("data-key");
        menuName = link.getAttribute("data-name");
        menuSci = link.getAttribute("data-sci") || "";
        // BirdLife DataZone covers birds only — hide the item for other groups.
        var blBtn = spMenu.querySelector('[data-act="birdlife"]');
        if (blBtn) blBtn.style.display = isBirdKey(menuKey) ? "" : "none";
        spMenu.style.left = e.pageX + "px";
        spMenu.style.top = e.pageY + "px";
        spMenu.style.display = "block";
        return;
      }
      if (!spMenu.contains(e.target)) spMenu.style.display = "none";
      // Close the dropdown popovers when clicking outside a panel/toggle.
      if (!e.target.closest(".dd-panel") && !e.target.closest(".dd-toggle")) closeDropdowns();
    });
    spMenu.querySelectorAll(".sp-menu-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var act = this.getAttribute("data-act");
        if (act === "hide") hideSpecies(menuKey);
        else if (act === "filter") applyNameFilter(menuName);
        else if (act === "wiki") openWikipedia(menuSci || menuName);
        else if (act === "birdlife") openBirdLife((labelsByKey[menuKey] && labelsByKey[menuKey].common) || menuName, menuSci || menuName);
        else if (act === "macaulay") openExternal(macaulayUrl(menuKey, menuSci || menuName));
        else if (act === "distmap") showDistMap(menuName, menuSci || menuName, menuKey);
        else if (act === "recent") { var rl = marker ? marker.getLatLng() : map.getCenter(); showRecent(menuName, menuSci || menuName, rl.lat, rl.lng); }
        spMenu.style.display = "none";
      });
    });

    var searchEl = document.getElementById("species-search");
    var resultsEl = document.getElementById("species-results");
    var selIdx = -1;

    searchEl.addEventListener("focus", function () { showSearch(searchEl, resultsEl); });
    searchEl.addEventListener("input", function () { selIdx = -1; showSearch(searchEl, resultsEl); });
    searchEl.addEventListener("keydown", function (e) {
      var items = resultsEl.querySelectorAll(".sr-item");
      if (e.key === "ArrowDown") { e.preventDefault(); selIdx = Math.min(selIdx + 1, items.length - 1); highlightItem(items, selIdx); }
      else if (e.key === "ArrowUp") { e.preventDefault(); selIdx = Math.max(selIdx - 1, 0); highlightItem(items, selIdx); }
      else if (e.key === "Enter" && selIdx >= 0 && items[selIdx]) { e.preventDefault(); items[selIdx].click(); }
      else if (e.key === "Escape") { resultsEl.style.display = "none"; }
    });
    document.addEventListener("click", function (e) {
      if (!resultsEl.contains(e.target) && e.target !== searchEl) resultsEl.style.display = "none";
    });
  }

  function showSearch(inputEl, resultsEl) {
    var q = inputEl.value.trim().toLowerCase();
    var matches;
    if (q.length === 0) {
      matches = FEATURED_SPECIES.map(function (f) { return labelsByKey[f.key]; })
        .filter(Boolean).filter(function (l) { return inGroup(l.index); });
    } else {
      matches = labels.filter(function (l) {
        if (!inGroup(l.index)) return false;
        return speciesName(l).toLowerCase().includes(q) ||
               l.common.toLowerCase().includes(q) ||
               l.sci.toLowerCase().includes(q) || l.key.includes(q);
      }).slice(0, 30);
    }
    resultsEl.innerHTML = matches.map(function (l) {
      return '<div class="sr-item" data-key="' + l.key + '">' + escapeHtml(speciesName(l)) + ' <span class="sr-sci">' + escapeHtml(l.sci) + '</span></div>';
    }).join("");
    resultsEl.style.display = matches.length ? "block" : "none";
    resultsEl.querySelectorAll(".sr-item").forEach(function (el) {
      el.addEventListener("click", function () {
        selectSpecies(el.dataset.key);
        inputEl.value = "";
        resultsEl.style.display = "none";
      });
    });
  }

  function highlightItem(items, idx) {
    items.forEach(function (el, i) { el.classList.toggle("active", i === idx); });
    if (items[idx]) items[idx].scrollIntoView({ block: "nearest" });
  }

  function selectSpecies(key) {
    var lbl = labelsByKey[key];
    if (!lbl) return;
    var el = document.getElementById("species-search");
    el.placeholder = speciesName(lbl) + " (" + lbl.sci + ")";
    el.dataset.selectedKey = key;
    window.GeoState.save({ species: key });
    stopAnimation();
    if (currentMode === "range") renderRangeMap();
  }

  // ---- Inference -----------------------------------------------------------
  // opts.task: "raw" (default, full output) | "column" (opts.speciesIdx) |
  // "richness" (opts.threshold, optional opts.mask). The worker reduces the
  // output so only small arrays cross the thread boundary.
  async function runInference(flatInputs, batchSize, opts) {
    opts = opts || {};
    var id = ++inferenceId;
    return new Promise(function (resolve, reject) {
      pendingInferences.set(id, { resolve: resolve, reject: reject });
      var buf = new Float32Array(flatInputs).buffer;
      var msg = { type: "infer", id: id, flatInputs: buf, batchSize: batchSize, task: opts.task || "raw" };
      if (opts.task === "column") msg.speciesIdx = opts.speciesIdx;
      if (opts.task === "richness") { msg.threshold = opts.threshold; if (opts.mask) msg.mask = opts.mask; }
      worker.postMessage(msg, [buf]);   // mask (if any) is cloned, not transferred
    });
  }

  // Progress bar inside the computing overlay (0..1).
  function setComputeProgress(frac) {
    var bar = document.getElementById("computing-progress-bar");
    if (bar) bar.style.width = Math.max(0, Math.min(1, frac)) * 100 + "%";
  }

  // Uint8Array(nSpecies) marking the active group, or null for "all".
  function groupMask() {
    if (speciesGroup === "all") return null;
    var m = new Uint8Array(labels.length);
    for (var i = 0; i < labels.length; i++) m[i] = labelClass[i] === speciesGroup ? 1 : 0;
    return m;
  }

  // Total inference chunks across all weeks (for the progress bar).
  function totalChunks(weekMissing, chunk) {
    var n = 0;
    for (var i = 0; i < weekMissing.length; i++) n += Math.ceil(weekMissing[i].missing.length / chunk) || 1;
    return n;
  }

  // ---- Overlay -------------------------------------------------------------
  function ensureOverlayCanvas() {
    if (overlayCanvas) return;
    overlayCanvas = document.createElement("canvas");
    overlayCanvas.className = "heatmap-overlay";
    overlayCanvas.style.position = "absolute";
    overlayCanvas.style.pointerEvents = "none";
    map.getPane("overlayPane").appendChild(overlayCanvas);
  }

  function clearOverlay() {
    cachedRender = null;
    if (overlayCanvas) { overlayCanvas.width = 0; overlayCanvas.height = 0; }
  }

  // Renders the cell grid as a smooth heatmap. To avoid colour/alpha fringing
  // (which image smoothing of an RGBA grid produces around the range edges),
  // we bilinearly interpolate the PROBABILITY SCALAR — in both longitude
  // (linear in screen-x) and latitude (non-linear in Web Mercator, so each row
  // is mapped back to its latitude) — and only then colourise each pixel. The
  // buffer is built at ~screen resolution so it is drawn essentially 1:1.
  function paintOverlay() {
    if (!cachedRender || !map) return;
    ensureOverlayCanvas();

    var g = cachedRender.grid, probs = cachedRender.probs;
    var size = map.getSize();
    if (overlayCanvas.width !== size.x || overlayCanvas.height !== size.y) {
      overlayCanvas.width = size.x;
      overlayCanvas.height = size.y;
    }
    L.DomUtil.setPosition(overlayCanvas, map.containerPointToLayerPoint([0, 0]));
    var ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, size.x, size.y);

    var nw = map.latLngToContainerPoint([g.north, g.west]);
    var se = map.latLngToContainerPoint([g.south, g.east]);
    var destX = nw.x, destW = se.x - nw.x, destY = nw.y, destH = se.y - nw.y;
    if (destW <= 0 || destH <= 0) return;

    // Output buffer at (capped) screen resolution.
    var BW = Math.max(2, Math.min(Math.round(destW), 1100));
    var BH = Math.max(2, Math.min(Math.round(destH), 760));
    if (!offscreenCanvas) offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = BW;
    offscreenCanvas.height = BH;
    var octx = offscreenCanvas.getContext("2d");
    var img = octx.createImageData(BW, BH);
    var data = img.data;

    // Fractional cell-COLUMN index per output column (lon is linear in x).
    var col0 = new Int32Array(BW), col1 = new Int32Array(BW), colFrac = new Float64Array(BW);
    for (var ox = 0; ox < BW; ox++) {
      var cf = (ox + 0.5) / BW * g.nLon - 0.5;
      var c0 = Math.floor(cf);
      colFrac[ox] = Math.max(0, Math.min(1, cf - c0));
      col0[ox] = Math.max(0, Math.min(g.nLon - 1, c0));
      col1[ox] = Math.max(0, Math.min(g.nLon - 1, c0 + 1));
    }

    for (var oy = 0; oy < BH; oy++) {
      var sy = destY + (oy + 0.5) / BH * destH;
      var lat = map.containerPointToLatLng([destX, sy]).lat;   // Mercator-correct latitude
      var rf = (g.north - lat) / g.step - 0.5;
      var r0 = Math.floor(rf), fr = Math.max(0, Math.min(1, rf - r0));
      r0 = Math.max(0, Math.min(g.nLat - 1, r0));
      var r1 = Math.max(0, Math.min(g.nLat - 1, r0 + 1));
      var base0 = r0 * g.nLon, base1 = r1 * g.nLon, rowOff = oy * BW * 4;
      for (var ox2 = 0; ox2 < BW; ox2++) {
        var a = col0[ox2], b = col1[ox2], fc = colFrac[ox2];
        // bilinear on the scalar probability
        var top = probs[base0 + a] + (probs[base0 + b] - probs[base0 + a]) * fc;
        var bot = probs[base1 + a] + (probs[base1 + b] - probs[base1 + a]) * fc;
        var p = top + (bot - top) * fr;
        var col = colormapLookup(p);
        var o = rowOff + ox2 * 4;
        data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2];
        data[o + 3] = p >= 0.01 ? Math.round(Math.min(1, 0.25 + p * 0.75) * 255) : 0;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offscreenCanvas, destX, destY, destW, destH);
  }

  // ---- Viewport grid -------------------------------------------------------
  function viewportGrid() {
    var b = map.getBounds();
    var south = Math.max(b.getSouth(), -90), north = Math.min(b.getNorth(), 90);
    var west = b.getWest(), east = b.getEast();
    if (east - west >= 360) { west = -180; east = 180; }
    else { west = wrapLon(west); east = wrapLon(east); if (east <= west) east += 360; }
    if (north - south < 0.1) north = south + 0.1;
    if (east - west < 0.1) east = west + 0.1;
    // High-resolution mode multiplies the points per axis by hiResFactor
    // (1/hiResFactor the cell size).
    var step = (ZOOM_STEP[map.getZoom()] || 3) / (hiRes ? hiResFactor : 1);
    south = Math.max(Math.floor(south / step) * step, -90);
    north = Math.min(Math.ceil(north / step) * step, 90);
    west = Math.floor(west / step) * step;
    east = Math.ceil(east / step) * step;
    return { south: south, north: north, west: west, east: east, step: step,
             nLat: Math.round((north - south) / step), nLon: Math.round((east - west) / step) };
  }

  // ---- Cell cache ----------------------------------------------------------
  function cacheKey(speciesKey, week) { return speciesKey + ":" + week; }
  function cellId(lat, lon) { return Math.round(lat * 100) + "," + Math.round(lon * 100); }

  function getCellMap(key, step) {
    var entry = renderCache.get(key);
    if (!entry || entry.step !== step) {
      entry = { step: step, cells: new Map() };
      renderCache.set(key, entry);
      if (renderCache.size > RENDER_CACHE_MAX) renderCache.delete(renderCache.keys().next().value);
    }
    return entry.cells;
  }

  function viewportMissing(cellMap, grid) {
    var pts = [];
    for (var iLat = 0; iLat < grid.nLat; iLat++) {
      var lat = grid.north - (iLat + 0.5) * grid.step;
      for (var iLon = 0; iLon < grid.nLon; iLon++) {
        var lon = wrapLon(grid.west + (iLon + 0.5) * grid.step);
        if (!cellMap.has(cellId(lat, lon))) pts.push({ lat: lat, lon: lon });
      }
    }
    return pts;
  }

  function buildViewportArray(cellMap, grid) {
    var arr = new Float32Array(grid.nLat * grid.nLon);
    var i = 0;
    for (var iLat = 0; iLat < grid.nLat; iLat++) {
      var lat = grid.north - (iLat + 0.5) * grid.step;
      for (var iLon = 0; iLon < grid.nLon; iLon++) {
        var lon = wrapLon(grid.west + (iLon + 0.5) * grid.step);
        arr[i++] = cellMap.get(cellId(lat, lon)) || 0;
      }
    }
    return arr;
  }

  function normalizeProbs(raw) {
    var maxProb = 0;
    for (var i = 0; i < raw.length; i++) if (raw[i] > maxProb) maxProb = raw[i];
    var norm = perceptualNorm(raw, maxProb);
    // Hide cells whose raw probability falls outside the min–max range slider
    // so the same control filters the species-range overlay.
    var pmin = +document.getElementById("prob-min").value / 100;
    var pmax = +document.getElementById("prob-max").value / 100;
    if (pmin > 0 || pmax < 1) {
      for (var j = 0; j < raw.length; j++) if (raw[j] < pmin || raw[j] > pmax) norm[j] = 0;
    }
    return { probs: norm, maxProb: maxProb };
  }

  // Weeks to compute for a range/richness render: just the selected week
  // normally, or all 48 when precomputing for migration animation.
  function weeksToCompute() {
    if (animateAll) {
      var a = [];
      for (var w = 1; w <= 48; w++) a.push(w);
      return a;
    }
    return [+document.getElementById("week-select").value];
  }

  // Cells per inference call. The model emits labels.length (~12k) floats per
  // cell, so we cap the output buffer at ~32 MB to bound worker memory and
  // avoid tab crashes when sweeping large viewports / all 48 weeks.
  function inferChunk() {
    return Math.max(256, Math.floor(8000000 / labels.length));
  }

  // ---- Range map -----------------------------------------------------------
  async function renderRangeMap() {
    var key = document.getElementById("species-search").dataset.selectedKey;
    if (!key || !labelsByKey[key]) return;
    if (rendering) { renderGeneration++; return; }
    var gen = ++renderGeneration;
    var lbl = labelsByKey[key], speciesIdx = lbl.index, name = speciesName(lbl);
    var selectedWeek = +document.getElementById("week-select").value;
    var weeks = weeksToCompute(), nSpecies = labels.length, CHUNK = inferChunk();
    var g = viewportGrid(), totalPoints = g.nLat * g.nLon;

    // Find weeks with missing cells
    var weekMissing = [];
    weeks.forEach(function (w) {
      var cm = getCellMap(cacheKey(key, w), g.step);
      var miss = viewportMissing(cm, g);
      if (miss.length > 0) weekMissing.push({ week: w, missing: miss, cellMap: cm });
    });

    // Fast path: all cached
    if (weekMissing.length === 0) {
      var nr = normalizeProbs(buildViewportArray(getCellMap(cacheKey(key, selectedWeek), g.step), g));
      cachedRender = { grid: g, probs: nr.probs, maxProb: nr.maxProb };
      paintOverlay();
      setStatus(t("status.rangeCached", { name: name, week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: (Math.round(g.step * 100) / 100) }));
      updateLegend();
      updateMapCsv();
      return;
    }

    rendering = true;
    showComputingOverlay(true, name);
    var chunksTotal = totalChunks(weekMissing, CHUNK), chunksDone = 0;
    try {
      for (var wi = 0; wi < weekMissing.length; wi++) {
        var wm = weekMissing[wi];
        setStatus(t("status.computing", { name: name, week: weekText(wm.week), n: wm.missing.length, i: wi + 1, total: weekMissing.length }));
        var inputs = new Float32Array(wm.missing.length * 3);
        for (var i = 0; i < wm.missing.length; i++) {
          inputs[i * 3] = wm.missing[i].lat;
          inputs[i * 3 + 1] = wm.missing[i].lon;
          inputs[i * 3 + 2] = wm.week;
        }
        var rawProbs = new Float32Array(wm.missing.length);
        for (var start = 0; start < wm.missing.length; start += CHUNK) {
          if (gen !== renderGeneration) return;
          var end = Math.min(start + CHUNK, wm.missing.length);
          // Worker returns just this species' column (end-start floats).
          var out = await runInference(inputs.subarray(start * 3, end * 3), end - start, { task: "column", speciesIdx: speciesIdx });
          for (var j = 0; j < end - start; j++) rawProbs[start + j] = out[j];
          setComputeProgress(++chunksDone / chunksTotal);
        }
        if (gen !== renderGeneration) return;
        for (var k = 0; k < wm.missing.length; k++) wm.cellMap.set(cellId(wm.missing[k].lat, wm.missing[k].lon), rawProbs[k]);
        if (wm.week === selectedWeek) {
          var nr2 = normalizeProbs(buildViewportArray(wm.cellMap, g));
          cachedRender = { grid: g, probs: nr2.probs, maxProb: nr2.maxProb };
          paintOverlay();
        }
      }
      var nrF = normalizeProbs(buildViewportArray(getCellMap(cacheKey(key, selectedWeek), g.step), g));
      cachedRender = { grid: g, probs: nrF.probs, maxProb: nrF.maxProb };
      paintOverlay();
      setStatus(t("status.rangeDone", { name: name, week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: (Math.round(g.step * 100) / 100) }));
      updateLegend();
      updateMapCsv();
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
    finally { rendering = false; showComputingOverlay(false); if (gen !== renderGeneration) triggerRender(); }
  }

  // ---- Cached week switch --------------------------------------------------
  function showCachedWeek() {
    var week = +document.getElementById("week-select").value;
    var g = viewportGrid();

    if (currentMode === "richness") {
      var cm = getCellMap(cacheKey(richKey(),week), g.step);
      if (viewportMissing(cm, g).length === 0) {
        var raw = buildViewportArray(cm, g);
        var maxVal = 0;
        for (var i = 0; i < raw.length; i++) if (raw[i] > maxVal) maxVal = raw[i];
        cachedRender = { grid: g, probs: perceptualNorm(raw, maxVal), maxVal: maxVal, product: "richness" };
        paintOverlay();
        setStatus(t("status.richnessCached", { week: weekText(week), n: g.nLat * g.nLon, step: (Math.round(g.step * 100) / 100) }));
        updateLegend();
        updateMapCsv();
      } else { renderRichness(); }
      return;
    }

    var key = document.getElementById("species-search").dataset.selectedKey;
    if (!key || !labelsByKey[key]) return;
    var cm2 = getCellMap(cacheKey(key, week), g.step);
    if (viewportMissing(cm2, g).length === 0) {
      var nr = normalizeProbs(buildViewportArray(cm2, g));
      cachedRender = { grid: g, probs: nr.probs, maxProb: nr.maxProb };
      paintOverlay();
      setStatus(t("status.rangeCached", { name: speciesName(labelsByKey[key]), week: weekText(week), n: g.nLat * g.nLon, step: (Math.round(g.step * 100) / 100) }));
      updateLegend();
      updateMapCsv();
    } else { renderRangeMap(); }
  }

  // ---- Species richness ----------------------------------------------------
  var RICHNESS_THRESHOLD = 0.05;

  async function renderRichness() {
    if (rendering) { renderGeneration++; return; }
    var gen = ++renderGeneration;
    var selectedWeek = +document.getElementById("week-select").value;
    var weeks = weeksToCompute(), nSpecies = labels.length, CHUNK = inferChunk();
    var g = viewportGrid(), totalPoints = g.nLat * g.nLon;
    var richName = t("legend.count");

    var weekMissing = [];
    weeks.forEach(function (w) {
      var cm = getCellMap(cacheKey(richKey(),w), g.step);
      var miss = viewportMissing(cm, g);
      if (miss.length > 0) weekMissing.push({ week: w, missing: miss, cellMap: cm });
    });

    if (weekMissing.length === 0) {
      var raw = buildViewportArray(getCellMap(cacheKey(richKey(),selectedWeek), g.step), g);
      var maxVal = 0;
      for (var i = 0; i < raw.length; i++) if (raw[i] > maxVal) maxVal = raw[i];
      cachedRender = { grid: g, probs: perceptualNorm(raw, maxVal), maxVal: maxVal, product: "richness" };
      paintOverlay();
      setStatus(t("status.richnessCached", { week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: (Math.round(g.step * 100) / 100) }));
      updateLegend();
      updateMapCsv();
      return;
    }

    rendering = true;
    showComputingOverlay(true, richName);
    var mask = groupMask();
    var chunksTotal = totalChunks(weekMissing, CHUNK), chunksDone = 0;
    try {
      for (var wi = 0; wi < weekMissing.length; wi++) {
        var wm = weekMissing[wi];
        setStatus(t("status.computing", { name: richName, week: weekText(wm.week), n: wm.missing.length, i: wi + 1, total: weekMissing.length }));
        var inputs = new Float32Array(wm.missing.length * 3);
        for (var ii = 0; ii < wm.missing.length; ii++) {
          inputs[ii * 3] = wm.missing[ii].lat;
          inputs[ii * 3 + 1] = wm.missing[ii].lon;
          inputs[ii * 3 + 2] = wm.week;
        }
        var counts = new Float32Array(wm.missing.length);
        for (var start = 0; start < wm.missing.length; start += CHUNK) {
          if (gen !== renderGeneration) return;
          var end = Math.min(start + CHUNK, wm.missing.length);
          // Worker counts species ≥ threshold (optionally masked to a group)
          // and returns one count per cell.
          var out = await runInference(inputs.subarray(start * 3, end * 3), end - start,
            { task: "richness", threshold: RICHNESS_THRESHOLD, mask: mask });
          for (var j = 0; j < end - start; j++) counts[start + j] = out[j];
          setComputeProgress(++chunksDone / chunksTotal);
        }
        if (gen !== renderGeneration) return;
        for (var k = 0; k < wm.missing.length; k++) wm.cellMap.set(cellId(wm.missing[k].lat, wm.missing[k].lon), counts[k]);
        if (wm.week === selectedWeek) {
          var rawW = buildViewportArray(wm.cellMap, g);
          var maxV = 0;
          for (var m = 0; m < rawW.length; m++) if (rawW[m] > maxV) maxV = rawW[m];
          cachedRender = { grid: g, probs: perceptualNorm(rawW, maxV), maxVal: maxV, product: "richness" };
          paintOverlay();
        }
      }
      var rawF = buildViewportArray(getCellMap(cacheKey(richKey(),selectedWeek), g.step), g);
      var maxF = 0;
      for (var n = 0; n < rawF.length; n++) if (rawF[n] > maxF) maxF = rawF[n];
      cachedRender = { grid: g, probs: perceptualNorm(rawF, maxF), maxVal: maxF, product: "richness" };
      paintOverlay();
      setStatus(t("status.richnessDone", { week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: (Math.round(g.step * 100) / 100) }));
      updateLegend();
      updateMapCsv();
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
    finally { rendering = false; showComputingOverlay(false); if (gen !== renderGeneration) triggerRender(); }
  }

  // ---- Species list --------------------------------------------------------
  // Re-render the per-point species list at the current marker. Used by control
  // changes (compare, 2nd name, group, week, probability range) — applies in
  // both Species List and Species Range mode (both show the list on click).
  function rerenderPointList() {
    if ((currentMode === "list" || currentMode === "range") && marker) {
      var ll = marker.getLatLng();
      renderSpeciesList(ll.lat, ll.lng);
    }
  }

  function onMapClick(e) {
    // List + Range both show the per-point species list on click; Migration
    // Timeline shows the analysis. (In Range mode the range overlay stays.)
    if (currentMode !== "list" && currentMode !== "barchart" && currentMode !== "range") return;
    if (marker) map.removeLayer(marker);
    // Normalize: latitude clamped to [-90, 90]; longitude wrapped to [-180, 180]
    // (a click on a panned world-copy can otherwise give e.g. lon = 635).
    var lat = Math.max(-90, Math.min(90, e.latlng.lat));
    var lon = wrapLon(e.latlng.lng);
    marker = L.marker([lat, lon]).addTo(map);
    if (currentMode === "barchart") renderAnalysis(lat, lon);
    else renderSpeciesList(lat, lon);
  }

  // Compute the per-species comparison probabilities for the "change" column.
  // Returns { probs: Float32Array|null, refLabel: string } where probs is
  // aligned to the label index, or null when no comparison is selected.
  async function computeComparison(lat, lon, week) {
    var mode = document.getElementById("compare-select").value;
    var nSpecies = labels.length, wkIdx = week - 1;
    if (mode === "prev" || mode === "next") {
      var cw = mode === "prev" ? (week - 1 < 1 ? 48 : week - 1) : (week + 1 > 48 ? 1 : week + 1);
      var out = await runInference(new Float32Array([lat, lon, cw]), 1);
      return { probs: out, refLabel: weekText(cw), kind: "delta" };
    }
    if (mode === "mean" || mode === "annualmax" || mode === "annualtop") {
      var inputs = new Float32Array(48 * 3);
      for (var w = 0; w < 48; w++) { inputs[w * 3] = lat; inputs[w * 3 + 1] = lon; inputs[w * 3 + 2] = w + 1; }
      var all = await runInference(inputs, 48);
      var agg = new Float32Array(nSpecies), s, wk, v;
      if (mode === "annualmax") {
        // Per-species peak probability; the list shows current ÷ peak (ratio).
        for (s = 0; s < nSpecies; s++) {
          var mx = 0;
          for (wk = 0; wk < 48; wk++) { v = all[wk * nSpecies + s]; if (v > mx) mx = v; }
          agg[s] = mx;
        }
        return { probs: agg, refLabel: t("compare.max"), kind: "ratio" };
      }
      if (mode === "annualtop") {
        // Per-species "Annual Top" (focus) value at the current week (0–100).
        var scratch = new Float32Array(48);
        for (s = 0; s < nSpecies; s++) {
          var mxt = 0;
          for (wk = 0; wk < 48; wk++) { v = all[wk * nSpecies + s]; scratch[wk] = v; if (v > mxt) mxt = v; }
          agg[s] = window.GeoAnalysis.focusSeries(scratch, mxt)[wkIdx];
        }
        return { probs: agg, refLabel: t("compare.annualtop"), kind: "focus" };
      }
      for (s = 0; s < nSpecies; s++) {
        var sum = 0;
        for (wk = 0; wk < 48; wk++) sum += all[wk * nSpecies + s];
        agg[s] = sum / 48;
      }
      return { probs: agg, refLabel: t("compare.mean"), kind: "delta" };
    }
    return { probs: null, refLabel: "", kind: null };
  }

  function deltaCell(delta) {
    var pct = (delta * 100);
    var cls = delta > 0.001 ? "delta-up" : (delta < -0.001 ? "delta-down" : "delta-flat");
    var arrow = delta > 0.001 ? "\u25b2" : (delta < -0.001 ? "\u25bc" : "\u00b7");
    return '<td class="' + cls + '">' + arrow + " " + (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%</td>";
  }

  // Cell for "Annual max" comparison: current week as a fraction of the
  // species' annual peak (0\u2013100%), tinted red(off-peak)\u2192green(at peak).
  function ratioCell(ratio) {
    var r = Math.max(0, Math.min(1, ratio));
    var bg = "hsl(" + (10 + r * 120) + ", 60%, 42%)";
    return '<td class="ratio-cell" style="background:' + bg + '">' + (r * 100).toFixed(0) + "%</td>";
  }

  // Cell for the "Annual Top" comparison: focus value 0–100, tinted red→green.
  function focusCell(v) {
    var n = Math.max(0, Math.min(100, v));
    var bg = "hsl(" + (10 + (n / 100) * 120) + ", 60%, 42%)";
    return '<td class="ratio-cell" style="background:' + bg + '">' + Math.round(n) + "</td>";
  }

  // Species List comparison cell as a probability-style bar (used when every
  // value in the column is positive). pct scaled by kind: focus is already
  // 0–100; ratio/delta are fractions → ×100.
  function cmpBarCell(kind, v) {
    var pct = Math.max(0, Math.min(100, kind === "focus" ? v : v * 100));
    var label = kind === "focus" ? String(Math.round(v))
      : kind === "ratio" ? (v * 100).toFixed(0) + "%"
      : (v * 100).toFixed(1) + "%";
    return '<td class="cmp-bar-cell"><span class="cmp-num">' + label + '</span><div class="cmp-bar" style="width:' + pct.toFixed(1) + '%"></div></td>';
  }

  // Reverse-geocoded place names for the coords line, cached per location.
  var placeCache = {};
  function placeKey(lat, lon) { return lat.toFixed(3) + "," + lon.toFixed(3); }

  // Set a coords/summary line, prefixed with the resolved place name. The base
  // summary shows immediately; the place name is prepended once resolved (and
  // re-applied on later renders at the same location via the cache).
  function setCoordsWithPlace(el, lat, lon, baseSummary) {
    if (!el) return;
    var k = placeKey(lat, lon);
    el.dataset.base = baseSummary;
    el.dataset.placeKey = k;
    var apply = function (name) { el.textContent = (name ? name + " · " : "") + el.dataset.base; };
    if (placeCache[k] !== undefined) { apply(placeCache[k]); return; }
    el.textContent = baseSummary;
    reverseGeocode(lat, lon).then(function (name) {
      placeCache[k] = name || "";
      if (el.dataset.placeKey === k) apply(placeCache[k]);
    });
  }

  async function renderSpeciesList(lat, lon) {
    var week = +document.getElementById("week-select").value;
    var pmin = +document.getElementById("prob-min").value / 100;
    var pmax = +document.getElementById("prob-max").value / 100;
    setStatus(t("status.predicting", { lat: lat.toFixed(2), lon: lon.toFixed(2), week: week }));
    try {
      var out = await runInference(new Float32Array([lat, lon, week]), 1);
      var cmp = await computeComparison(lat, lon, week);
      var hasCompare = !!cmp.probs;
      var kind = cmp.kind;   // "delta" | "ratio" | "focus"
      var results = [];
      for (var i = 0; i < labels.length; i++) {
        if (out[i] >= pmin && out[i] <= pmax && inGroup(i) && !isHidden(labels[i].key)) {
          var cval = 0;
          if (hasCompare) {
            cval = kind === "ratio" ? (cmp.probs[i] > 0 ? out[i] / cmp.probs[i] : 0)
                 : kind === "focus" ? cmp.probs[i]
                 : (out[i] - cmp.probs[i]);
          }
          results.push({ label: labels[i], prob: out[i], cmpVal: cval });
        }
      }
      results.sort(function (a, b) { return b.prob - a.prob; });
      // When every comparison value is positive, show it as a probability-style
      // bar; otherwise (e.g. week-over-week change) show the value with
      // negatives in red.
      var cmpAllPositive = hasCompare && results.every(function (r) { return r.cmpVal >= 0; });

      document.getElementById("sp-delta-head").textContent =
        !hasCompare ? "" : kind === "focus" ? cmp.refLabel : t(kind === "ratio" ? "th.ratio" : "th.delta", { ref: cmp.refLabel });
      // Optional second-language name column.
      var tbl = document.getElementById("species-list-table");
      tbl.classList.toggle("has-name2", !!secondLang);
      document.getElementById("sp-name2-head").textContent = secondLang ? window.GeoI18N.langByCode(secondLang).name : "";
      setCoordsWithPlace(document.getElementById("sp-coords"), lat, lon,
        t("sp.summary", { lat: lat.toFixed(4), lon: lon.toFixed(4), week: week, n: results.length, p: (pmin * 100).toFixed(0) }));
      document.getElementById("sp-tbody").innerHTML = results.map(function (r, idx) {
        var cmpCell = !hasCompare ? "<td></td>" : cmpAllPositive ? cmpBarCell(kind, r.cmpVal) : deltaCell(r.cmpVal);
        var name2Cell = '<td class="name2">' + (secondLang ? escapeHtml(secondName(r.label)) : "") + '</td>';
        return '<tr><td>' + (idx + 1) + '</td><td>' + nameLinkHtml(r.label) + '</td>' + name2Cell + '<td style="font-style:italic">' +
               escapeHtml(r.label.sci) + '</td><td>' + (r.prob * 100).toFixed(1) + '%</td><td class="prob-bar-cell"><div class="prob-bar" style="width:' +
               Math.round(r.prob * 100) + '%"></div></td>' + cmpCell + '</tr>';
      }).join("");
      document.getElementById("species-panel").style.display = "block";
      document.getElementById("barchart-panel").style.display = "none";
      setStatus(t("status.spResult", { n: results.length, p: (pmin * 100).toFixed(0), lat: lat.toFixed(2), lon: lon.toFixed(2) }));

      // Build CSV for species list (includes 2nd-name + comparison columns when active)
      var header = "rank,species_code,common_name";
      if (secondLang) header += ",common_name_" + secondLang;
      header += ",scientific_name,probability";
      if (hasCompare) header += "," + (kind === "ratio" ? "fraction_of_" : kind === "focus" ? "annual_top_" : "delta_vs_") + cmp.refLabel.replace(/[",\s]+/g, "_");
      var csvLines = [header];
      results.forEach(function (r, idx) {
        var line = (idx + 1) + ',"' + r.label.key + '","' + speciesName(r.label).replace(/"/g, '""') + '"';
        if (secondLang) line += ',"' + secondName(r.label).replace(/"/g, '""') + '"';
        line += ',"' + r.label.sci.replace(/"/g, '""') + '",' + r.prob.toFixed(6);
        if (hasCompare) line += "," + r.cmpVal.toFixed(6);
        csvLines.push(line);
      });
      lastCsvData = {
        filename: "Geomodel_species_list_" + lat.toFixed(2) + "_" + lon.toFixed(2) + "_week" + week + ".csv",
        content: csvLines.join("\n")
      };
      showCsvBtn();
      showSaveLocBtn();
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
  }

  // ---- Computing overlay ---------------------------------------------------
  function showComputingOverlay(show, name) {
    var el = document.getElementById("demo-computing");
    if (!el) return;
    el.style.display = show ? "flex" : "none";
    if (show) {
      document.getElementById("computing-text").textContent = name || "";
      document.getElementById("computing-progress-bar").style.width = "0%";
    }
  }

  // ---- Legend ---------------------------------------------------------------
  function updateLegend() {
    var el = document.getElementById("demo-legend");
    if (!el) return;
    if ((currentMode !== "range" && currentMode !== "richness") || !cachedRender) { el.style.display = "none"; return; }

    var isRichness = currentMode === "richness";
    var maxVal = isRichness && cachedRender.maxVal ? Math.round(cachedRender.maxVal) : 0;
    var maxProb = !isRichness && cachedRender.maxProb ? cachedRender.maxProb : 1;

    var html = '<div class="legend-title">' + (isRichness ? t("legend.count") : t("legend.prob")) + '</div><div class="legend-bar">';
    var stops = [];
    for (var i = 0; i <= 10; i++) {
      var lt = i / 10, c = colormapLookup(lt);
      stops.push("rgb(" + c[0] + "," + c[1] + "," + c[2] + ") " + Math.round(lt * 100) + "%");
    }
    html += '<div class="legend-gradient" style="background:linear-gradient(to right,' + stops.join(",") + ')"></div>';
    html += '<div class="legend-ticks">';
    [0, 0.5, 1].forEach(function (tick) {
      var rawT = Math.pow(tick, 1 / DISPLAY_GAMMA);
      html += "<span>" + (isRichness ? Math.round(rawT * maxVal) : Math.round(rawT * maxProb * 100) + "%") + "</span>";
    });
    html += "</div></div>";
    el.innerHTML = html;
    el.style.display = "block";
  }

  // ---- CSV helpers ---------------------------------------------------------
  function downloadCsv(filename, content) {
    var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showCsvBtn() {
    document.getElementById("csv-btn-wrap").style.display = "";
  }

  function hideCsvBtn() {
    document.getElementById("csv-btn-wrap").style.display = "none";
    lastCsvData = null;
  }

  function buildRangeMapCsv() {
    var key = document.getElementById("species-search").dataset.selectedKey;
    if (!key || !labelsByKey[key]) return null;
    var week = +document.getElementById("week-select").value;
    var g = viewportGrid();
    var cm = getCellMap(cacheKey(key, week), g.step);
    var lines = ["latitude,longitude,probability"];
    for (var iLat = 0; iLat < g.nLat; iLat++) {
      var lat = g.north - (iLat + 0.5) * g.step;
      for (var iLon = 0; iLon < g.nLon; iLon++) {
        var lon = wrapLon(g.west + (iLon + 0.5) * g.step);
        var val = cm.get(cellId(lat, lon)) || 0;
        if (val > 0.001) lines.push(lat.toFixed(4) + "," + lon.toFixed(4) + "," + val.toFixed(6));
      }
    }
    var lbl = labelsByKey[key];
    return {
      filename: "Geomodel_range_" + speciesName(lbl).replace(/\s+/g, "_") + "_week" + week + ".csv",
      content: lines.join("\n")
    };
  }

  function buildRichnessCsv() {
    var week = +document.getElementById("week-select").value;
    var g = viewportGrid();
    var cm = getCellMap(cacheKey(richKey(),week), g.step);
    var lines = ["latitude,longitude,species_count"];
    for (var iLat = 0; iLat < g.nLat; iLat++) {
      var lat = g.north - (iLat + 0.5) * g.step;
      for (var iLon = 0; iLon < g.nLon; iLon++) {
        var lon = wrapLon(g.west + (iLon + 0.5) * g.step);
        var val = cm.get(cellId(lat, lon)) || 0;
        lines.push(lat.toFixed(4) + "," + lon.toFixed(4) + "," + Math.round(val));
      }
    }
    return {
      filename: "BirdNET_Geomodel_richness_week" + week + ".csv",
      content: lines.join("\n")
    };
  }

  // ---- Location analysis (Timeline / Probability / Arrivals / Scatter) -----
  // Runs ONE 48-week prediction at the clicked point; all four tabs derive
  // from the cached result. Re-clicking recomputes; tab/filter/sort changes
  // re-render from cache without new inference.
  async function renderAnalysis(lat, lon) {
    var nSpecies = labels.length;
    document.getElementById("species-panel").style.display = "none";
    document.getElementById("barchart-panel").style.display = "none";
    showComputingOverlay(true, t("panel.bcTitle"));
    setStatus(t("status.predicting48", { lat: lat.toFixed(2), lon: lon.toFixed(2) }));
    try {
      var inputs = new Float32Array(48 * 3);
      for (var w = 0; w < 48; w++) { inputs[w * 3] = lat; inputs[w * 3 + 1] = lon; inputs[w * 3 + 2] = w + 1; }
      var allProbs = await runInference(inputs, 48); // 48 * nSpecies, week-major
      analysisData = { lat: lat, lon: lon, allProbs: allProbs, nSpecies: nSpecies };
      document.getElementById("barchart-panel").style.display = "block";
      updateAnalysisControls();
      renderActiveTab();
      showSaveLocBtn();
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
    finally { showComputingOverlay(false); }
  }

  // Build the context object the analysis renderers consume.
  function analysisCtx() {
    return {
      allProbs: analysisData.allProbs,
      nSpecies: analysisData.nSpecies,
      labels: labels,
      week: +document.getElementById("week-select").value,
      thresholdFrac: +document.getElementById("prob-min").value / 100,
      thresholdMax: +document.getElementById("prob-max").value / 100,
      filterText: document.getElementById("an-filter").value.trim(),
      topN: +document.getElementById("an-topn").value,
      scatterRankBy: document.getElementById("an-rankby").value,
      scatterSort: scatterSort,
      inGroup: inGroup,
      isHidden: function (key) { return isHidden(key); },
      nameLink: nameLinkHtml,
      speciesName: speciesName,
      escapeHtml: escapeHtml,
      months: window.GeoI18N.months(lang),
      t: t,
      onSortChange: function (s) { scatterSort = s; renderActiveTab(); },
    };
  }

  // Show the active tab as selected and toggle the Top-N control (scatter only).
  function updateAnalysisControls() {
    var tabs = document.querySelectorAll("#an-tabs .an-tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("is-active", tabs[i].getAttribute("data-tab") === analysisTab);
    }
    document.getElementById("an-topn-wrap").style.display = analysisTab === "scatter" ? "" : "none";
  }

  function renderActiveTab() {
    if (!analysisData) return;
    var container = document.getElementById("bc-container");
    var ctx = analysisCtx();
    var lat = analysisData.lat, lon = analysisData.lon;
    var nVisible = window.GeoAnalysis.visibleSpecies(ctx).length;

    setCoordsWithPlace(document.getElementById("bc-coords"), lat, lon,
      t("sp.summary", { lat: lat.toFixed(4), lon: lon.toFixed(4), week: ctx.week, n: nVisible, p: (ctx.thresholdFrac * 100).toFixed(0) }));
    setStatus(t("status.spResult", { n: nVisible, p: (ctx.thresholdFrac * 100).toFixed(0), lat: lat.toFixed(2), lon: lon.toFixed(2) }));

    if (analysisTab === "timeline") renderTimelineTab(container, ctx);
    else if (analysisTab === "scatter") window.GeoAnalysis.renderScatter(container, ctx);
    else window.GeoAnalysis.renderHeatmap(container, ctx, analysisTab);   // "prob" | "arrival" | "focus"

    // CSV reflects the active tab.
    var built = window.GeoAnalysis.buildCsv(ctx, analysisTab);
    lastCsvData = { filename: "Geomodel_" + analysisTab + "_" + lat.toFixed(2) + "_" + lon.toFixed(2) + ".csv", content: built.content };
    showCsvBtn();
  }

  // Timeline tab: per-species 48-week phenology bars (sorted by annual mean).
  function renderTimelineTab(container, ctx) {
    var wkIdx = ctx.week - 1;
    var rows = window.GeoAnalysis.visibleSpecies(ctx);
    rows.forEach(function (r) {
      var sum = 0; for (var w = 0; w < 48; w++) sum += r.probs[w];
      r.avg = sum / 48;
    });
    // Sort by current-week probability (largest first).
    rows.sort(function (a, b) { return b.probs[wkIdx] - a.probs[wkIdx]; });

    var globalMax = 0;
    rows.forEach(function (r) { for (var w = 0; w < 48; w++) if (r.probs[w] > globalMax) globalMax = r.probs[w]; });
    if (globalMax < 0.01) globalMax = 0.01;

    if (rows.length === 0) { container.innerHTML = '<p class="an-empty">' + escapeHtml(t("analysis.empty")) + "</p>"; return; }

    var MONTH_LABELS = ctx.months;
    var html = "";
    for (var ri = 0; ri < rows.length; ri++) {
      var r = rows[ri];
      html += '<div class="bc-species"><div class="bc-header">' +
        '<span class="bc-rank">' + (ri + 1) + '</span>' +
        '<span class="bc-name">' + nameLinkHtml(r.label) + '</span>' +
        '<span class="bc-sci">' + escapeHtml(r.label.sci) + '</span>' +
        '<span class="bc-avg">' + t("bc.avg", { p: (r.avg * 100).toFixed(1) }) + '</span>' +
        '</div><div class="bc-bars">';
      for (var w3 = 0; w3 < 48; w3++) {
        var prob = r.probs[w3];
        var pct = (prob / globalMax) * 100;
        var opacity = Math.max(0.15, prob / globalMax);
        var monthClass = (w3 % 4 === 0) ? " bc-month-start" : "";
        var curClass = (w3 === wkIdx) ? " bc-cur" : "";
        html += '<div class="bc-bar' + monthClass + curClass + '" style="height:' + pct.toFixed(1) + '%;opacity:' + opacity.toFixed(2) + '" title="' + (w3 + 1) + ": " + (prob * 100).toFixed(1) + '%"></div>';
      }
      html += '</div><div class="bc-months">';
      for (var m = 0; m < 12; m++) html += "<span>" + escapeHtml(MONTH_LABELS[m]) + "</span>";
      html += "</div></div>";
    }
    container.innerHTML = html;
  }

  // ---- Update CSV for range/richness after render --------------------------
  function updateMapCsv() {
    // Rebuilding the CSV string scans every viewport cell; skip it during
    // animation playback (it refreshes when the animation stops).
    if (animating) return;
    if (currentMode === "range") {
      lastCsvData = buildRangeMapCsv();
      if (lastCsvData) showCsvBtn(); else hideCsvBtn();
    } else if (currentMode === "richness") {
      lastCsvData = buildRichnessCsv();
      if (lastCsvData) showCsvBtn(); else hideCsvBtn();
    }
  }

  // ---- Migration animation -------------------------------------------------
  // Precomputes all 48 weeks for the current viewport, then steps through them
  // so the user watches the predicted range/richness shift across the year.
  function setPlayBtn(playing) {
    var b = document.getElementById("play-btn");
    if (b) b.textContent = playing ? t("btn.pause") : t("btn.play");
  }

  function stopAnimation() {
    animating = false;
    animateAll = false;
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    setPlayBtn(false);
  }

  async function toggleAnimation() {
    if (animating) { stopAnimation(); return; }
    if (currentMode === "range" && !document.getElementById("species-search").dataset.selectedKey) {
      setStatus(t("status.selectSpecies"));
      return;
    }
    animating = true;
    setPlayBtn(true);

    // Precompute every week for the current viewport.
    animateAll = true;
    if (currentMode === "richness") await renderRichness();
    else await renderRangeMap();
    animateAll = false;
    if (!animating) return;

    // Step through cached weeks.
    var wsel = document.getElementById("week-select");
    var w = +wsel.value || 1;
    (function step() {
      if (!animating) return;
      wsel.value = w;
      showCachedWeek();
      w = (w % 48) + 1;
      animTimer = setTimeout(step, ANIM_INTERVAL);
    })();
  }

  // ---- Saved locations -----------------------------------------------------
  function showSaveLocBtn() { document.getElementById("saveloc-btn-wrap").style.display = ""; }
  function hideSaveLocBtn() { document.getElementById("saveloc-btn-wrap").style.display = "none"; }

  // Saved locations in a dropdown popover: each row navigates on click and
  // has an × to delete it.
  function refreshSavedLocations() {
    var btnText = document.getElementById("savedloc-btn-text");
    var panel = document.getElementById("savedloc-panel");
    if (!btnText || !panel) return;
    var locs = window.GeoState.locations();
    btnText.textContent = t("ctrl.savedloc") + " (" + locs.length + ")";
    if (!locs.length) {
      panel.innerHTML = '<div class="dd-empty">' + escapeHtml(t("ph.savedloc")) + "</div>";
      return;
    }
    panel.innerHTML = locs.map(function (l) {
      var n = escapeHtml(l.name);
      return '<div class="dd-row">' +
        '<button type="button" class="dd-name dd-go" data-id="' + l.id + '" title="' + n + '">' + n + "</button>" +
        '<button type="button" class="dd-del" data-id="' + l.id + '" title="' + escapeHtml(t("loc.delete")) + '" aria-label="' + escapeHtml(t("loc.delete")) + '">×</button>' +
        "</div>";
    }).join("");
    panel.querySelectorAll(".dd-go").forEach(function (b) {
      b.addEventListener("click", function () { closeDropdowns(); goToSavedLocation(this.getAttribute("data-id")); });
    });
    panel.querySelectorAll(".dd-del").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        window.GeoState.removeLocation(this.getAttribute("data-id"));
        refreshSavedLocations();
      });
    });
  }

  function closeDropdowns() {
    ["hidden-panel", "savedloc-panel", "checklists-panel"].forEach(function (idp) {
      var p = document.getElementById(idp);
      if (p) p.style.display = "none";
    });
  }

  // ---- Checklists ----------------------------------------------------------
  // A checklist is a snapshot of the Species List at a location: localized +
  // scientific names, probability, and Δ = arrival score (next-prev)/max_year.
  // Stored in localStorage; multiple named lists; rows are checkable + printable.
  var currentChecklistId = null;

  function getChecklists() { return window.GeoState.get("checklists", []) || []; }
  function saveChecklists(arr) { window.GeoState.save({ checklists: arr }); }
  function getChecklist(id) { return getChecklists().filter(function (c) { return c.id === id; })[0]; }
  function updateChecklist(cl) {
    saveChecklists(getChecklists().map(function (c) { return c.id === cl.id ? cl : c; }));
  }

  // Reverse-geocode to a place name for the header (falls back to coordinates).
  async function reverseGeocode(lat, lon) {
    try {
      var r = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=" + lat + "&lon=" + lon, { headers: { Accept: "application/json" } });
      if (r.ok) { var j = await r.json(); return j.display_name || j.name || null; }
    } catch (e) { /* offline / blocked — use coordinates */ }
    return null;
  }

  async function makeChecklistFromList() {
    if (!marker) return;
    var ll = marker.getLatLng(), lat = ll.lat, lon = ll.lng;
    var week = +document.getElementById("week-select").value;
    var pmin = +document.getElementById("prob-min").value / 100;
    var pmax = +document.getElementById("prob-max").value / 100;
    var nSpecies = labels.length, wkIdx = week - 1;
    setStatus(t("status.buildingChecklist"));
    try {
      // 48-week prediction so each species gets a Δ (arrival) value.
      var inputs = new Float32Array(48 * 3);
      for (var w = 0; w < 48; w++) { inputs[w * 3] = lat; inputs[w * 3 + 1] = lon; inputs[w * 3 + 2] = w + 1; }
      var all = await runInference(inputs, 48);   // raw 48 * nSpecies
      // Optional comparison column mirroring the Species List "Compare to".
      var cmpMode = document.getElementById("compare-select").value;
      var scratch = new Float32Array(48);
      var items = [];
      for (var i = 0; i < nSpecies; i++) {
        var cur = all[wkIdx * nSpecies + i];
        if (cur < pmin || cur > pmax || !inGroup(i) || isHidden(labels[i].key)) continue;
        var mx = 0;
        for (var k = 0; k < 48; k++) { var v = all[k * nSpecies + i]; scratch[k] = v; if (v > mx) mx = v; }
        var prev = all[((wkIdx + 47) % 48) * nSpecies + i], next = all[((wkIdx + 1) % 48) * nSpecies + i];
        var delta = mx > 1e-6 ? (next - prev) / mx : 0;
        var cmpVal = null;
        if (cmpMode === "prev") cmpVal = cur - all[((wkIdx + 47) % 48) * nSpecies + i];
        else if (cmpMode === "next") cmpVal = cur - all[((wkIdx + 1) % 48) * nSpecies + i];
        else if (cmpMode === "mean") { var sm = 0; for (var m = 0; m < 48; m++) sm += all[m * nSpecies + i]; cmpVal = cur - sm / 48; }
        else if (cmpMode === "annualmax") cmpVal = mx > 0 ? cur / mx : 0;
        else if (cmpMode === "annualtop") cmpVal = window.GeoAnalysis.focusSeries(scratch, mx)[wkIdx];
        items.push({ key: labels[i].key, sci: labels[i].sci, name: speciesName(labels[i]), name2: secondName(labels[i]), prob: cur, delta: delta, cmp: cmpVal, checked: false, locality: "", notes: "" });
      }
      items.sort(function (a, b) { return b.prob - a.prob; });
      // Column kind/label for the comparison value (if any).
      var cmpKind = (cmpMode === "annualmax") ? "ratio" : (cmpMode === "annualtop") ? "focus" : (cmpMode === "" ? null : "delta");
      var cmpLabel = cmpMode === "prev" ? weekText(week - 1 < 1 ? 48 : week - 1)
        : cmpMode === "next" ? weekText(week + 1 > 48 ? 1 : week + 1)
        : cmpMode === "mean" ? t("compare.mean")
        : cmpMode === "annualmax" ? t("compare.max")
        : cmpMode === "annualtop" ? t("compare.annualtop") : "";
      var place = (await reverseGeocode(lat, lon)) || (lat.toFixed(3) + ", " + lon.toFixed(3));
      var nm = window.prompt(t("chk.namePrompt"), place);
      if (nm === null) { setStatus(""); return; }
      var cl = { id: "chk-" + Date.now(), name: nm.trim() || place, place: place, lat: lat, lon: lon, week: week, lang: lang, lang2: secondLang, lang2Name: secondLang ? window.GeoI18N.langByCode(secondLang).name : "", createdAt: new Date().toISOString(), cmpKind: cmpKind, cmpLabel: cmpLabel, items: items };
      var arr = getChecklists(); arr.push(cl); saveChecklists(arr);
      refreshChecklists();
      openChecklist(cl.id);
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
  }

  // Dropdown listing saved checklists (open / delete).
  function refreshChecklists() {
    var wrap = document.getElementById("checklists-wrap");
    var btnText = document.getElementById("checklists-btn-text");
    var panel = document.getElementById("checklists-panel");
    if (!wrap || !btnText || !panel) return;
    var cls = getChecklists();
    wrap.style.display = cls.length ? "" : "none";
    if (!cls.length) panel.style.display = "none";
    btnText.textContent = t("ctrl.checklists") + " (" + cls.length + ")";
    panel.innerHTML = cls.map(function (c) {
      var n = escapeHtml(c.name);
      return '<div class="dd-row"><button type="button" class="dd-name dd-open-chk" data-id="' + c.id + '" title="' + n + '">' + n + "</button>" +
        '<button type="button" class="dd-csv dd-csv-chk" data-id="' + c.id + '" title="' + escapeHtml(t("btn.csv")) + '">⬇</button>' +
        '<button type="button" class="dd-del dd-del-chk" data-id="' + c.id + '" title="' + escapeHtml(t("btn.delete")) + '">×</button></div>';
    }).join("");
    panel.querySelectorAll(".dd-open-chk").forEach(function (b) {
      b.addEventListener("click", function () { closeDropdowns(); openChecklist(this.getAttribute("data-id")); });
    });
    panel.querySelectorAll(".dd-csv-chk").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var c = getChecklist(this.getAttribute("data-id"));
        if (c) downloadCsv("checklist_" + c.name.replace(/[^\w-]+/g, "_") + ".csv", buildChecklistCsv(c));
      });
    });
    panel.querySelectorAll(".dd-del-chk").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = this.getAttribute("data-id");
        saveChecklists(getChecklists().filter(function (c) { return c.id !== id; }));
        if (currentChecklistId === id) closeChecklist();
        refreshChecklists();
      });
    });
  }

  function openChecklist(id) {
    var cl = getChecklist(id);
    if (!cl) return;
    currentChecklistId = id;
    document.getElementById("species-panel").style.display = "none";
    document.getElementById("barchart-panel").style.display = "none";
    renderChecklistBody(cl);
    document.getElementById("checklist-panel").style.display = "block";
  }

  function closeChecklist() {
    currentChecklistId = null;
    document.getElementById("checklist-panel").style.display = "none";
  }

  function renderChecklistBody(cl) {
    var body = document.getElementById("chk-body");
    var date = (cl.createdAt || "").slice(0, 10);
    var meta = escapeHtml(cl.place || (cl.lat.toFixed(3) + ", " + cl.lon.toFixed(3))) + " · " + escapeHtml(weekText(cl.week)) + " · " + escapeHtml(date);
    var checked = cl.items.filter(function (it) { return it.checked; }).length;
    var html = '<h3 class="chk-title">' + escapeHtml(cl.name) + "</h3>";
    html += '<div class="chk-meta">' + meta + ' · <span id="chk-progress">' + checked + " / " + cl.items.length + "</span></div>";
    var cmpHead = cl.cmpKind ? "<th>" + escapeHtml(cl.cmpLabel || "") + "</th>" : "";
    var name2Head = cl.lang2 ? "<th>" + escapeHtml(cl.lang2Name || cl.lang2) + "</th>" : "";
    html += '<table class="chk-table"><thead><tr><th class="chk-cb"></th><th>' + escapeHtml(t("th.rank")) + "</th><th>" + escapeHtml(t("th.species")) +
      "</th>" + name2Head + "<th>" + escapeHtml(t("th.sci")) + "</th><th>" + escapeHtml(t("th.prob")) + "</th><th>" + escapeHtml(t("th.change")) +
      "</th>" + cmpHead + "<th>" + escapeHtml(t("th.locality")) + "</th><th>" + escapeHtml(t("th.notes")) + "</th></tr></thead><tbody>";
    cl.items.forEach(function (it, idx) {
      var dcls = it.delta > 0.001 ? "delta-up" : (it.delta < -0.001 ? "delta-down" : "delta-flat");
      var cmpCell = !cl.cmpKind ? "" : (it.cmp == null ? "<td></td>"
        : cl.cmpKind === "ratio" ? ratioCell(it.cmp)
        : cl.cmpKind === "focus" ? focusCell(it.cmp)
        : deltaCell(it.cmp));
      var name2Cell = cl.lang2 ? "<td>" + escapeHtml(it.name2 || "") + "</td>" : "";
      html += '<tr><td class="chk-cb"><input type="checkbox" class="chk-box" data-idx="' + idx + '"' + (it.checked ? " checked" : "") + "></td>" +
        "<td>" + (idx + 1) + "</td><td>" + escapeHtml(it.name) + "</td>" + name2Cell + '<td style="font-style:italic">' + escapeHtml(it.sci) + "</td>" +
        "<td>" + (it.prob * 100).toFixed(1) + '%</td><td class="' + dcls + '">' + (it.delta * 100).toFixed(1) + "%</td>" + cmpCell +
        '<td><input type="text" class="chk-text" data-idx="' + idx + '" data-field="locality" value="' + escapeHtml(it.locality || "") + '"></td>' +
        '<td><input type="text" class="chk-text" data-idx="' + idx + '" data-field="notes" value="' + escapeHtml(it.notes || "") + '"></td></tr>';
    });
    html += "</tbody></table>";
    html += '<p class="chk-note">' + t("chk.note") + "</p>";
    body.innerHTML = html;
    body.querySelectorAll(".chk-box").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var c = getChecklist(currentChecklistId);
        if (!c) return;
        c.items[+this.getAttribute("data-idx")].checked = this.checked;
        updateChecklist(c);
        var prog = document.getElementById("chk-progress");
        if (prog) prog.textContent = c.items.filter(function (it) { return it.checked; }).length + " / " + c.items.length;
      });
    });
    body.querySelectorAll(".chk-text").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var c = getChecklist(currentChecklistId);
        if (!c) return;
        c.items[+this.getAttribute("data-idx")][this.getAttribute("data-field")] = this.value;
        updateChecklist(c);
      });
    });
  }

  function buildChecklistCsv(cl) {
    var esc = function (v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var cmpCol = cl.cmpKind ? "," + (cl.cmpKind === "ratio" ? "fraction_of_" : cl.cmpKind === "focus" ? "annual_top_" : "delta_vs_") + String(cl.cmpLabel || "").replace(/[",\s]+/g, "_") : "";
    var name2Col = cl.lang2 ? ",common_name_" + cl.lang2 : "";
    var lines = ["# " + cl.name + " | " + (cl.place || "") + " | week " + cl.week + " | " + (cl.createdAt || "").slice(0, 10)];
    lines.push("checked,rank,common_name" + name2Col + ",scientific_name,probability,change" + cmpCol + ",locality,notes");
    cl.items.forEach(function (it, idx) {
      var row = [it.checked ? 1 : 0, idx + 1, esc(it.name)];
      if (cl.lang2) row.push(esc(it.name2 || ""));
      row.push(esc(it.sci), it.prob.toFixed(6), it.delta.toFixed(6));
      if (cl.cmpKind) row.push(it.cmp == null ? "" : it.cmp.toFixed(6));
      row.push(esc(it.locality || ""), esc(it.notes || ""));
      lines.push(row.join(","));
    });
    return lines.join("\n");
  }

  // Editable "Hidden species" list shown in a dropdown popover; each row has
  // an × to remove the species from the hidden ("sanction") list.
  function refreshHiddenUI() {
    var wrap = document.getElementById("hidden-wrap");
    var btnText = document.getElementById("hidden-btn-text");
    var panel = document.getElementById("hidden-panel");
    if (!wrap || !btnText || !panel) return;
    var keys = Object.keys(hiddenSpecies);
    wrap.style.display = keys.length ? "" : "none";
    if (!keys.length) panel.style.display = "none";
    btnText.textContent = t("ctrl.hidden") + " (" + keys.length + ")";
    panel.innerHTML = keys.map(function (k) {
      var lbl = labelsByKey[k];
      var n = escapeHtml(lbl ? speciesName(lbl) : k);
      return '<div class="dd-row"><span class="dd-name" title="' + n + '">' + n + "</span>" +
        '<button type="button" class="dd-del" data-key="' + escapeHtml(k) + '" title="' + escapeHtml(t("loc.unhide")) + '" aria-label="' + escapeHtml(t("loc.unhide")) + '">×</button></div>';
    }).join("");
    panel.querySelectorAll(".dd-del").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); unhideSpecies(this.getAttribute("data-key")); });
    });
  }

  function saveCurrentLocation() {
    if (!marker) return;
    var ll = marker.getLatLng();
    var def = t("loc.defaultName", { lat: ll.lat.toFixed(3), lon: ll.lng.toFixed(3) });
    var name = window.prompt(t("loc.savePrompt"), def);
    if (name === null) return;
    window.GeoState.addLocation(name.trim() || def, ll.lat, ll.lng);
    refreshSavedLocations();
  }

  function goToSavedLocation(id) {
    if (!id) return;
    var loc = window.GeoState.locations().filter(function (l) { return l.id === id; })[0];
    if (!loc) return;
    if (currentMode !== "list" && currentMode !== "barchart") {
      currentMode = "list";
      document.getElementById("mode-select").value = "list";
      updateModeVisibility();
    }
    map.setView([loc.lat, loc.lon], Math.max(map.getZoom(), 3));
    if (marker) map.removeLayer(marker);
    marker = L.marker([loc.lat, loc.lon]).addTo(map);
    if (currentMode === "barchart") renderAnalysis(loc.lat, loc.lon);
    else renderSpeciesList(loc.lat, loc.lon);
  }

  // ---- Restore persisted control values ------------------------------------
  function restoreControls() {
    // Always start in Species List mode (overrides any saved mode).
    currentMode = "list";
    document.getElementById("mode-select").value = currentMode;

    // Always start on the current week of the year (overrides any saved week).
    document.getElementById("week-select").value = weekOfToday();

    var cmp = window.GeoState.get("compare", null);
    if (cmp !== null) document.getElementById("compare-select").value = cmp;

    setSecondLang(window.GeoState.get("secondLang", ""));

    analysisTab = window.GeoState.get("analysisTab", "timeline");
    document.getElementById("an-rankby").value = window.GeoState.get("scatterRankBy", "arrival");

    speciesGroup = window.GeoState.get("group", "all");
    document.getElementById("group-select").value = speciesGroup;

    // Always start with high resolution off; remember the chosen factor.
    hiRes = false;
    document.getElementById("hires-toggle").checked = false;
    hiResFactor = +window.GeoState.get("hiResFactor", 3) || 3;
    document.getElementById("hires-factor").value = String(hiResFactor);

    // Always start with the full probability range 5%–100% on load.
    document.getElementById("prob-min").value = 5;
    document.getElementById("prob-max").value = 100;
    document.getElementById("prob-min-val").textContent = "5%";
    document.getElementById("prob-max-val").textContent = "100%";

    loadHidden();

    var sp = window.GeoState.get("species", null);
    if (sp && labelsByKey[sp]) {
      var el = document.getElementById("species-search");
      el.dataset.selectedKey = sp;
      el.placeholder = speciesName(labelsByKey[sp]) + " (" + labelsByKey[sp].sci + ")";
    }
    updateModeVisibility();
  }

})();
