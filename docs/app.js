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
  var hiResFactor = 1;        // points-per-axis multiplier for range/richness (1 = normal)
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

  // The header (settings) icon reflects the active species group. All icons are
  // monochrome SVGs in one style (currentColor; small details in deep teal),
  // not emoji — so they match the app palette.
  var EYE = "#0b3a3a";   // deep-teal detail (eyes/nose) on the white silhouette
  var GROUP_ICON = {
    // Binoculars (All) — line style.
    all: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="6.7" cy="14.6" r="4.3"/><circle cx="17.3" cy="14.6" r="4.3"/>' +
      '<path d="M3.7 11.8 L5.4 5.4 A1.2 1.2 0 0 1 6.6 4.5 H8.6 A1 1 0 0 1 9.6 5.5 V11"/>' +
      '<path d="M20.3 11.8 L18.6 5.4 A1.2 1.2 0 0 0 17.4 4.5 H15.4 A1 1 0 0 0 14.4 5.5 V11"/>' +
      '<line x1="9.6" y1="8" x2="14.4" y2="8"/></g>',
    // Songbird (Birds) — side profile: round head + body, beak, cocked tail, legs.
    aves: '<g fill="currentColor">' +
      '<circle cx="8.5" cy="8.5" r="4"/>' +
      '<ellipse cx="13" cy="14" rx="6.5" ry="5"/>' +
      '<polygon points="5,7.2 1.8,8.6 5,9.8"/>' +
      '<polygon points="17,10 23,5.6 19,13"/>' +
      '<path d="M11 18.4 L10.4 22 M14 18.6 L14.6 22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/>' +
      '</g>' +
      '<circle cx="8" cy="7.6" r="1.2" fill="' + EYE + '"/>',
    // Fox (Mammals) — pointed ears + triangular face, eyes + nose.
    mammalia: '<g fill="currentColor"><polygon points="3,4 9.2,9 5.2,11"/><polygon points="21,4 14.8,9 18.8,11"/>' +
      '<path d="M5,8.6 H19 L12,21 Z"/></g>' +
      '<circle cx="9" cy="12" r="1.15" fill="' + EYE + '"/><circle cx="15" cy="12" r="1.15" fill="' + EYE + '"/>' +
      '<circle cx="12" cy="17.4" r="1.3" fill="' + EYE + '"/>',
    // Bee (Insects) — head + antennae + wings + striped abdomen (3 bars).
    insecta: '<g fill="currentColor"><circle cx="12" cy="6.3" r="2.4"/>' +
      '<path d="M10.4 4.7 L8.8 2.6 M13.6 4.7 L15.2 2.6" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="7.4" cy="10.2" rx="2.4" ry="3.2" transform="rotate(-28 7.4 10.2)"/>' +
      '<ellipse cx="16.6" cy="10.2" rx="2.4" ry="3.2" transform="rotate(28 16.6 10.2)"/>' +
      '<rect x="8.4" y="9.6" width="7.2" height="2.4" rx="1.2"/>' +
      '<rect x="8.4" y="13" width="7.2" height="2.4" rx="1.2"/>' +
      '<rect x="9.6" y="16.4" width="4.8" height="2.4" rx="1.2"/></g>',
    // Frog (Amphibians) — two eye bumps on top + wide body + front legs.
    amphibia: '<g fill="currentColor"><circle cx="8.4" cy="7" r="3"/><circle cx="15.6" cy="7" r="3"/>' +
      '<path d="M3 15.5 a9 7 0 0 1 18 0 q0 3 -3 3 H6 q-3 0 -3 -3 Z"/>' +
      '<path d="M6.5 18 l-2 3 M17.5 18 l2 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>' +
      '<circle cx="8.4" cy="7" r="1.15" fill="' + EYE + '"/><circle cx="15.6" cy="7" r="1.15" fill="' + EYE + '"/>',
  };
  function settingsIconHtml(group) {
    return '<svg class="bird-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (GROUP_ICON[group] || GROUP_ICON.all) + "</svg>";
  }
  function updateSettingsIcon() {
    var btn = document.getElementById("settings-toggle");
    if (btn) btn.innerHTML = settingsIconHtml(speciesGroup);
  }

  // The banner is fixed; publish its height so the page content and the
  // full-screen overlays (Species List / Checklist) start below it.
  function syncHeaderHeight() {
    var h = document.getElementById("site-header");
    if (h) document.documentElement.style.setProperty("--header-h", h.offsetHeight + "px");
  }

  // Grid resolution per zoom level (degrees per cell). Finer cells at deeper
  // zoom keep the heatmap detailed without exploding the cell count.
  var ZOOM_STEP = { 2: 3, 3: 2, 4: 1, 5: 0.5, 6: 0.5, 7: 0.25, 8: 0.25, 9: 0.125, 10: 0.0625, 11: 0.03125,
    12: 0.015625, 13: 0.0078125, 14: 0.00390625, 15: 0.001953125, 16: 0.0009765625, 17: 0.00048828125, 18: 0.000244140625 };
  var MAX_ZOOM = 18;
  // Snap the map's zoom to steps of ~2.65x (log2 ≈ 1.404) — one H3 resolution
  // per zoom level — so the chosen H3 cell size stays constant on screen as you
  // zoom (H3 resolutions are ~2.65x apart, vs the usual 2x per zoom level).
  var H3_ZOOM_STEP = (typeof window !== "undefined" && window.h3)
    ? Math.log(window.h3.getHexagonEdgeLengthAvg(5, "m") ? window.h3.getHexagonEdgeLengthAvg(4, "m") / window.h3.getHexagonEdgeLengthAvg(5, "m") : 2.6458) / Math.LN2
    : 1.404;

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

  // Format a grid step (degrees) for the status line — keep significant digits
  // for the fine steps used at deep zoom (so it never shows "0°").
  function fmtStep(s) { return s >= 0.1 ? (Math.round(s * 100) / 100) : +s.toPrecision(2); }

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
  // Species-Range H3 cell-value cache: "speciesCode:week" -> { h3index: rawProb }.
  // Accumulates cells across every zoom/pan so revisiting an area needs no new
  // inference; merged on render. Persisted to localStorage, capped (MB) via a
  // Settings control; oldest (species,week) tags are evicted to fit the cap.
  var h3RangeCache = new Map();
  var H3_CACHE_KEY = "geomodel-h3cache-v1";
  var h3CacheMB = 2;          // localStorage budget for the range cache (0 = off)
  var h3SaveTimer = null;
  function h3RangeCacheFor(tag) {
    var m = h3RangeCache.get(tag);
    if (!m) { m = {}; h3RangeCache.set(tag, m); if (h3RangeCache.size > 600) h3RangeCache.delete(h3RangeCache.keys().next().value); }
    return m;
  }
  function loadH3Cache() {
    if (h3CacheMB <= 0) return;
    try {
      var obj = JSON.parse(localStorage.getItem(H3_CACHE_KEY) || "{}");
      Object.keys(obj).forEach(function (tag) { h3RangeCache.set(tag, obj[tag]); });   // insertion order = oldest first
    } catch (e) { /* corrupt / unavailable — ignore */ }
  }
  function h3CacheToJson() {
    var obj = {};
    h3RangeCache.forEach(function (cells, tag) {
      var o = {};
      for (var c in cells) { var v = cells[c]; o[c] = v < 0.0001 ? 0 : +v.toFixed(4); }   // round to shrink
      obj[tag] = o;
    });
    return obj;
  }
  function scheduleH3Save() {
    if (h3SaveTimer) clearTimeout(h3SaveTimer);
    h3SaveTimer = setTimeout(saveH3Cache, 2500);
  }
  function saveH3Cache() {
    h3SaveTimer = null;
    if (h3CacheMB <= 0) { try { localStorage.removeItem(H3_CACHE_KEY); } catch (e) {} return; }
    var capChars = h3CacheMB * 1e6;   // ~1 char ≈ 1 byte for this ascii/numeric data
    var obj = h3CacheToJson(), str = JSON.stringify(obj);
    // Evict oldest tags (Map order) until within the cap.
    while (str.length > capChars && Object.keys(obj).length > 1) {
      delete obj[Object.keys(obj)[0]];
      str = JSON.stringify(obj);
    }
    try { localStorage.setItem(H3_CACHE_KEY, str); }
    catch (e) {   // quota exceeded — drop half the tags and retry once
      var keys = Object.keys(obj); for (var i = 0; i < keys.length / 2; i++) delete obj[keys[i]];
      try { localStorage.setItem(H3_CACHE_KEY, JSON.stringify(obj)); } catch (e2) { try { localStorage.removeItem(H3_CACHE_KEY); } catch (e3) {} }
    }
  }
  var marker = null;
  var currentMode = "range";
  var fieldData = null;       // current probability-ranked species for the field checklist
  var fieldQuery = "";        // fuzzy filter text for the field checklist
  var fieldFilter = "all";    // checklist row filter: "all" | "seen" | "missing"
  var fieldPlaceToken = 0;    // guards against stale field-place lookups
  var fieldLat = 0, fieldLon = 0;   // current field-checklist point
  var fieldKey = null;        // listId (placeKey@day) of the field checklist currently open
  var fieldNameCache = {};    // placeKey -> resolved place name (auto-title for new lists)
  var fieldGeoWatch = null;   // geolocation watch id while a checklist is open
  var fieldGeoLast = null;    // freshest device position {lat,lon,ts} while a checklist is open
  var entryEditKey = null;    // species whose observations the entry-edit page is showing
  var rendering = false;
  var renderGeneration = 0;
  var moveEndTimer = null;
  var lastCsvData = null;   // { filename, content } for current data product
  var lastSpeciesPdf = null;   // { name2Head, cmpHead, rows } for the species-list PDF

  // Migration animation state
  var animateAll = false;   // when true, range/richness precompute all 48 weeks
  var animating = false;    // animation playback in progress
  var animReady = false;    // all 48 weeks cached → progress bar stays scrubbable
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

  // Xeno-canto audio recordings — search by scientific name (graceful for any
  // taxon, vs. a species page that would 404 on a naming mismatch).
  function xenoCantoUrl(sci) {
    return "https://xeno-canto.org/explore?query=" + encodeURIComponent(String(sci || "").trim());
  }

  // eBird species page (label keys are eBird taxon codes) — shows recent
  // sightings and a map; falls back to a search for non-code keys.
  function ebirdUrl(key, sci) {
    if (/^[a-z]/i.test(key) && !/^\d+$/.test(key)) return "https://ebird.org/species/" + encodeURIComponent(key);
    return "https://ebird.org/species/search?q=" + encodeURIComponent(String(sci || "").trim());
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

  // GBIF occurrences in a 25 km box over a date range. GBIF has no server-side
  // date sort, so we page the date-filtered results (up to ~900) and sort
  // client-side, returning the 100 most recent.
  async function gbifRecent(sci, lat, lon, range) {
    var base = "https://api.gbif.org/v1/occurrence/search?hasCoordinate=true&limit=300&scientificName=" +
      encodeURIComponent(sci) + "&geometry=" + encodeURIComponent(gbifGeometry(lat, lon, 12.5)) +
      "&eventDate=" + encodeURIComponent(range);
    var all = [], offset = 0, total = Infinity, pages = 0;
    while (offset < total && pages < 3) {
      var j = await (await fetch(base + "&offset=" + offset)).json();
      total = j.count || 0;
      var res = j.results || [];
      for (var i = 0; i < res.length; i++) all.push(res[i]);
      offset += 300; pages++;
      if (res.length < 300) break;
    }
    all.sort(function (a, b) { return String(b.eventDate || "").localeCompare(String(a.eventDate || "")); });
    return all.slice(0, 100).map(function (o) {
      return {
        src: "GBIF",
        dt: o.eventDate || "",
        date: (o.eventDate || "").slice(0, 10) || "—",
        lat: o.decimalLatitude != null ? o.decimalLatitude : null,
        lon: o.decimalLongitude != null ? o.decimalLongitude : null,
        place: o.locality || o.verbatimLocality || o.stateProvince || o.county || o.country || "",
        who: (Array.isArray(o.recordedBy) ? o.recordedBy.join(", ") : o.recordedBy) || o.datasetName || "",
        note: o.occurrenceRemarks || "",
        url: o.key ? "https://www.gbif.org/occurrence/" + o.key : ""
      };
    });
  }

  // iNaturalist observations (live everywhere) for the same window, newest first.
  async function inatRecent(sci, lat, lon, d1, d2) {
    var url = "https://api.inaturalist.org/v1/observations?verifiable=true&order_by=observed_on&order=desc&per_page=100" +
      "&d1=" + d1 + "&d2=" + d2 + "&taxon_name=" + encodeURIComponent(sci) +
      "&lat=" + lat.toFixed(4) + "&lng=" + lon.toFixed(4) + "&radius=25";
    var j = await (await fetch(url)).json();
    return ((j && j.results) || []).map(function (o) {
      // Coordinates: geojson is [lon, lat]; fall back to the "lat,lon" string.
      var la = null, lo = null;
      if (o.geojson && o.geojson.coordinates) { lo = o.geojson.coordinates[0]; la = o.geojson.coordinates[1]; }
      else if (o.location) { var pr = String(o.location).split(","); la = parseFloat(pr[0]); lo = parseFloat(pr[1]); }
      return {
        src: "iNaturalist",
        dt: o.time_observed_at || o.observed_on || "",
        date: o.observed_on || (o.time_observed_at || "").slice(0, 10) || "—",
        lat: isFinite(la) ? la : null,
        lon: isFinite(lo) ? lo : null,
        place: o.place_guess || "",
        who: (o.user && (o.user.login || o.user.name)) || "",
        note: o.description || "",
        url: "https://www.inaturalist.org/observations/" + o.id
      };
    });
  }

  // User's personal eBird API token (kept in localStorage; never shared).
  function ebirdKey() { return (window.GeoState.get("ebirdKey", "") || "").trim(); }

  // Recent eBird observations of one species near a point. The app's species
  // keys ARE eBird species codes, so this is a single call. eBird caps the
  // lookback at 30 days and the radius at 50 km. Needs the user's API token.
  async function ebirdRecent(key, lat, lon) {
    var tok = ebirdKey();
    if (!tok || !key) return [];
    var url = "https://api.ebird.org/v2/data/obs/geo/recent/" + encodeURIComponent(key) +
      "?lat=" + lat.toFixed(4) + "&lng=" + lon.toFixed(4) + "&dist=25&back=30&maxResults=100&includeProvisional=true";
    var r = await fetch(url, { headers: { "X-eBirdApiToken": tok } });
    if (!r.ok) return [];
    var j = await r.json();
    return ((j && j.length) ? j : []).map(function (o) {
      return {
        src: "eBird",
        dt: o.obsDt || "",
        date: (o.obsDt || "").slice(0, 10) || "—",
        lat: o.lat != null ? o.lat : null,
        lon: o.lng != null ? o.lng : null,
        place: o.locName || "",
        who: (o.howMany != null ? "×" + o.howMany : ""),
        note: "",   // the basic geo/recent endpoint carries no observer comments
        url: o.subId ? "https://ebird.org/checklist/" + o.subId : ""
      };
    });
  }

  var lastRecentRows = [], lastRecentMeta = null;
  // CSV of the merged sightings list (one row per observation, all sources).
  function recentCsv() {
    var m = lastRecentMeta || {};
    var lines = ["# " + (m.name || "") + " (" + (m.sci || "") + ") | " + (m.lat != null ? m.lat.toFixed(4) + "°, " + m.lon.toFixed(4) + "°" : "")];
    lines.push("date,source,lat,lon,place,observer_or_count,notes,url");
    lastRecentRows.forEach(function (r) {
      lines.push([csvEsc(r.date), r.src, r.lat != null ? r.lat : "", r.lon != null ? r.lon : "",
        csvEsc(r.place), csvEsc(r.who), csvEsc(r.note || ""), csvEsc(r.url)].join(","));
    });
    return lines.join("\n");
  }

  // Show recent observations of a species near the clicked location: GBIF,
  // iNaturalist and (with the user's eBird key, for birds) eBird, fetched in
  // parallel and merged into one list sorted by time, most recent first.
  // Downloadable as CSV. eBird's window is 30 days; GBIF/iNaturalist use ~2 months.
  async function showRecent(name, sci, lat, lon, key) {
    var body = document.getElementById("recent-body");
    document.getElementById("recent-title").textContent = name;
    body.innerHTML = '<div class="spinner" style="margin:24px auto"></div>';
    document.getElementById("recent-modal").style.display = "flex";
    var token = ++recentToken;

    var to = new Date(), from = new Date(); from.setMonth(from.getMonth() - 2);
    var fmtD = function (d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
    var d1 = fmtD(from), d2 = fmtD(to), range = d1 + "," + d2;

    var inatWeb = "https://www.inaturalist.org/observations?taxon_name=" + encodeURIComponent(sci) +
      "&lat=" + lat.toFixed(4) + "&lng=" + lon.toFixed(4) + "&radius=25&d1=" + d1 + "&d2=" + d2 + "&order_by=observed_on&order=desc";
    var gbifBase = "https://www.gbif.org/occurrence/search?q=" + encodeURIComponent(sci) +
      "&geometry=" + encodeURIComponent(gbifGeometry(lat, lon, 12.5));
    var countryParam = "";
    var ebLink = (key && isBirdKey(key)) ? '<a href="' + escapeHtml(ebirdUrl(key, sci)) + '" target="_blank" rel="noopener">eBird</a> · ' : "";
    var links = function () {
      return '<div class="recent-links">' + ebLink + '<a class="recent-gbif" href="' + escapeHtml(gbifBase + countryParam) + '" target="_blank" rel="noopener">GBIF</a>' +
        ' · <a href="' + escapeHtml(inatWeb) + '" target="_blank" rel="noopener">' + escapeHtml(t("recent.viewall")) + '</a></div>';
    };
    countryCode(lat, lon).then(function (cc) {
      if (!cc) return;
      countryParam = "&country=" + cc;
      if (token !== recentToken) return;
      var a = document.querySelector("#recent-body .recent-gbif");
      if (a) a.setAttribute("href", gbifBase + countryParam);
    });

    var srcSlug = function (s) { return s === "iNaturalist" ? "inat" : (s || "").toLowerCase(); };
    function render(rows) {
      if (token !== recentToken) return;
      if (!rows.length) { body.innerHTML = '<p class="recent-none">' + escapeHtml(t("recent.none")) + "</p>" + links(); return; }
      var counts = {};
      rows.forEach(function (r) { counts[r.src] = (counts[r.src] || 0) + 1; });
      var cap = Object.keys(counts).map(function (s) { return s + " " + counts[s]; }).join(" · ");
      var html = rows.map(function (r) {
        var place = r.place || "(map)";
        var cell = r.url ? '<a href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener">' + escapeHtml(place) + "</a>" : escapeHtml(place);
        var badge = '<span class="rc-src rc-src-' + srcSlug(r.src) + '">' + escapeHtml(r.src || "") + "</span>";
        return '<tr><td class="rc-date">' + escapeHtml(r.date) + '</td><td class="rc-srccell">' + badge + '</td><td class="rc-place">' + cell + '</td><td class="rc-who">' + escapeHtml(r.who) + "</td></tr>";
      }).join("");
      body.innerHTML = '<div class="recent-head"><span class="recent-src">' + escapeHtml(cap + " · " + d1 + " – " + d2) + "</span>" +
        '<button type="button" id="recent-dl">' + escapeHtml(t("recent.download")) + "</button></div>" +
        '<table class="recent-table"><tbody>' + html + "</tbody></table>" + links();
    }

    try {
      var wantEbird = key && isBirdKey(key) && ebirdKey();
      var results = await Promise.all([
        gbifRecent(sci, lat, lon, range).catch(function () { return []; }),
        inatRecent(sci, lat, lon, d1, d2).catch(function () { return []; }),
        wantEbird ? ebirdRecent(key, lat, lon).catch(function () { return []; }) : Promise.resolve([])
      ]);
      if (token !== recentToken) return;
      var rows = results[0].concat(results[1], results[2]);
      rows.sort(function (a, b) { return String(b.dt || b.date || "").localeCompare(String(a.dt || a.date || "")); });
      lastRecentRows = rows;
      lastRecentMeta = { name: name, sci: sci, lat: lat, lon: lon };
      render(rows);
    } catch (e) {
      if (token !== recentToken) return;
      body.innerHTML = '<p class="recent-none">' + escapeHtml(t("recent.none")) + "</p>" + links();
    }
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
    dark:  { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",  attribution: CARTO_ATTR, subdomains: "abcd", maxNativeZoom: 20 },
    light: { url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", attribution: CARTO_ATTR, subdomains: "abcd", maxNativeZoom: 20 },
    // Street/political (standard OpenStreetMap)
    streets: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
               attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', subdomains: "abc", maxNativeZoom: 19 },
    // Topographic / terrain (contours + relief)
    topo:  { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
             attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)', subdomains: "abc", maxNativeZoom: 17 },
    // Satellite imagery
    satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                 attribution: 'Imagery &copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics', maxNativeZoom: 19 } };

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
          '<div class="ctrl-group" id="mode-wrap">' +
            '<label for="mode-select" data-i18n="ctrl.mode">Mode</label>' +
            '<select id="mode-select">' +
              '<option value="range" data-i18n="mode.range">Species Range</option>' +
              '<option value="richness" data-i18n="mode.richness">Species Richness</option>' +
              '<option value="list" data-i18n="mode.list">📍 Species List</option>' +
              '<option value="barchart" data-i18n="mode.barchart">📍 Migration</option>' +
            '</select>' +
          '</div>' +
          '<div class="ctrl-group" id="species-search-wrap">' +
            '<label for="species-search" data-i18n="ctrl.species">Species</label>' +
            '<input id="species-search" type="text" autocomplete="off" data-i18n-ph="ph.species" placeholder="Search species\u2026" />' +
            '<div id="species-results"></div>' +
          '</div>' +
          '<div class="ctrl-group ctrl-group-btn" id="play-btn-wrap">' +
            '<button id="play-btn" class="demo-btn" data-i18n="btn.play">\u25b6 Play migration</button>' +
          '</div>' +
          '<div class="ctrl-group" id="hidden-wrap" style="display:none">' +
            '<label data-i18n="ctrl.hidden">Hidden species</label>' +
            '<button type="button" id="hidden-btn" class="dd-toggle"><span id="hidden-btn-text"></span><span class="dd-caret" aria-hidden="true">▾</span></button>' +
            '<div id="hidden-panel" class="dd-panel" style="display:none"></div>' +
          '</div>' +
          '<div class="ctrl-group" id="checklists-wrap" style="display:none">' +
            '<button type="button" id="checklists-toggle" class="hdr-icon-btn" aria-haspopup="true" title="Checklists" aria-label="Checklists">' +
              '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                '<path d="M9 5h11M9 12h11M9 19h11"/><path d="M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2"/></svg>' +
              '<span id="checklists-btn-text" class="hdr-count"></span>' +
            '</button>' +
            '<div id="checklists-panel" class="dd-panel" style="display:none"></div>' +
          '</div>' +
          '<div class="ctrl-group" id="settings-wrap">' +
            '<button type="button" id="settings-toggle" class="settings-icon-btn" aria-haspopup="true" aria-label="Settings" title="Settings"></button>' +
            '<div id="settings-panel" class="dd-panel settings-panel" style="display:none">' +
              '<div class="ctrl-group">' +
                '<label for="lang-select" data-i18n="ctrl.language">Language</label>' +
                '<select id="lang-select"></select>' +
              '</div>' +
              '<div class="ctrl-group" id="secondlang-wrap" style="display:none">' +
                '<label for="secondlang-select" data-i18n="ctrl.secondlang">2nd name</label>' +
                '<select id="secondlang-select"></select>' +
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
              '<div class="ctrl-group" id="week-select-wrap">' +
                '<label for="week-select" data-i18n="ctrl.week">Week</label>' +
                '<select id="week-select"></select>' +
              '</div>' +
              '<div class="ctrl-group" id="compare-wrap" style="display:none">' +
                '<label for="compare-select" data-i18n="ctrl.compare">Compare to</label>' +
                '<select id="compare-select">' +
                  '<option value="" data-i18n="compare.none">\u2014 none \u2014</option>' +
                  '<option value="prev" selected data-i18n="compare.prev">Previous week</option>' +
                  '<option value="next" data-i18n="compare.next">Next week</option>' +
                  '<option value="mean" data-i18n="compare.mean">Annual mean</option>' +
                  '<option value="annualmax" data-i18n="compare.max">Annual max</option>' +
                  '<option value="annualtop" data-i18n="compare.annualtop">Annual Top</option>' +
                '</select>' +
              '</div>' +
              '<div class="ctrl-group" id="maptype-wrap">' +
                '<label for="maptype-select" data-i18n="ctrl.basemap">Map type</label>' +
                '<select id="maptype-select">' +
                  '<option value="dark" data-i18n="basemap.dark">Dark</option>' +
                  '<option value="light" data-i18n="basemap.light">Light</option>' +
                  '<option value="streets" data-i18n="basemap.streets">Streets</option>' +
                  '<option value="topo" data-i18n="basemap.topo">Topographic</option>' +
                  '<option value="satellite" data-i18n="basemap.satellite">Satellite</option>' +
                '</select>' +
              '</div>' +
              '<div class="ctrl-group" id="hires-wrap" style="display:none">' +
                '<label for="hires-factor" data-i18n="ctrl.hires">High resolution</label>' +
                '<select id="hires-factor" title="Resolution factor (points per axis)">' +
                  '<option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="5">5</option><option value="7">7</option><option value="9">9</option><option value="11">11</option>' +
                '</select>' +
              '</div>' +
              '<div class="ctrl-group">' +
                '<label for="h3cache-mb" data-i18n="ctrl.cachemb">Map data cache</label>' +
                '<select id="h3cache-mb">' +
                  '<option value="0" data-i18n="opt.off">Off</option><option value="1">1 MB</option><option value="2">2 MB</option><option value="5">5 MB</option>' +
                '</select>' +
              '</div>' +
              '<div class="ctrl-group" id="ebird-key-wrap">' +
                '<label for="ebird-key" data-i18n="ctrl.ebirdkey">eBird API key</label>' +
                '<input id="ebird-key" type="text" autocomplete="off" spellcheck="false" />' +
                '<a id="ebird-key-link" href="https://ebird.org/api/keygen" target="_blank" rel="noopener" data-i18n="ctrl.ebirdkeyget">Get a free key</a>' +
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
              '<div class="settings-divider"></div>' +
              '<button type="button" id="about-open" class="settings-about" data-i18n="ctrl.about">About &amp; how it works</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="demo-status">&nbsp;</div>' +
        '<div id="range-species" style="display:none"></div>' +
        '<div id="demo-map-wrap">' +
          '<div id="demo-map"></div>' +
          '<div id="demo-computing" style="display:none">' +
            '<div class="spinner"></div>' +
            '<div id="computing-text">Computing\u2026</div>' +
            '<div id="computing-progress-wrap"><div id="computing-progress-bar"></div></div>' +
          '</div>' +
          '<div id="demo-legend"></div>' +
        '</div>' +
        '<div id="play-progress" style="display:none"><div class="pp-fill"></div><div class="pp-marker"></div><div class="pp-months"></div></div>' +
        '<div id="csv-btn-wrap" style="display:none">' +
          '<button id="csv-download-btn" class="demo-btn" data-i18n="btn.csv" title="Download CSV">\u2b07 CSV</button>' +
        '</div>' +
        '<div id="species-panel">' +
          '<div class="sp-page-bar">' +
            '<button id="sp-back" class="fp-back" title="Back to map">‹</button>' +
            '<h3 id="sp-title" data-i18n="panel.spTitle">Species at location</h3>' +
          '</div>' +
          '<div class="sp-coords" id="sp-coords"></div>' +
          '<div class="sp-actions">' +
            '<button id="sp-checklist-btn" class="demo-btn" data-i18n="btn.checklist">✓ Checklist</button>' +
            '<button id="sp-pdf-btn" class="demo-btn demo-btn-light" title="Download PDF">⬇ PDF</button>' +
          '</div>' +
          '<table id="species-list-table">' +
            '<thead><tr><th data-i18n="th.species">Species</th><th class="name2" id="sp-name2-head"></th><th data-i18n="th.sci">Scientific name</th><th data-i18n="th.prob">Probability</th><th></th><th id="sp-delta-head"></th></tr></thead>' +
            '<tbody id="sp-tbody"></tbody>' +
          '</table>' +
        '</div>' +
        '<div id="field-page" style="display:none">' +
          '<div class="field-page-bar">' +
            '<button id="field-back" class="fp-back" title="Back to map">‹</button>' +
            '<button id="field-nearby" class="fp-nearby" title="Nearby places" aria-label="Nearby places">▾</button>' +
            '<input id="field-coords" class="field-place" type="text" autocomplete="off" data-i18n-ph="ph.fieldtitle" placeholder="Location name" />' +
            '<button type="button" id="field-far" class="fp-far" style="display:none" aria-label="!">!</button>' +
            '<span class="field-seen" id="field-seen"></span>' +
            '<span class="field-actions">' +
              '<button id="field-pdf" class="demo-btn" title="Download PDF">⬇ PDF</button>' +
              '<button id="field-csv" class="demo-btn" data-i18n="btn.csv" title="Download CSV">⬇ CSV</button>' +
              '<button id="field-log" class="demo-btn" data-i18n="btn.logcsv" title="Download observation log">⬇ Log</button>' +
              '<button id="field-clear" class="demo-btn demo-btn-light" data-i18n="btn.clear">Clear</button>' +
            '</span>' +
          '</div>' +
          '<div id="field-far-msg" class="fp-far-msg" data-i18n="chk.farWarn" style="display:none"></div>' +
          '<div class="fc-filterbar">' +
            '<input id="field-search" type="text" autocomplete="off" data-i18n-ph="ph.filter" placeholder="Filter species…" />' +
            '<div id="field-filter" class="chk-filter">' +
              '<button type="button" class="chk-filter-btn is-active" data-ffilter="all" data-i18n="chk.all">All</button>' +
              '<button type="button" class="chk-filter-btn" data-ffilter="seen" data-i18n="chk.seen">Seen</button>' +
              '<button type="button" class="chk-filter-btn" data-ffilter="missing" data-i18n="chk.missing">Missing</button>' +
            '</div>' +
          '</div>' +
          '<div id="field-list"></div>' +
          '<div id="fc-picker" style="display:none">' +
            '<div class="fcp-head"><span id="fcp-name"></span><button type="button" id="fcp-close" aria-label="Close">×</button></div>' +
            '<div class="fcp-step-row">' +
              '<button type="button" class="fcp-step" data-fcp="dec" aria-label="−1">−</button>' +
              '<span class="fcp-val" id="fcp-val">0</span>' +
              '<button type="button" class="fcp-step" data-fcp="inc" aria-label="+1">+</button>' +
            '</div>' +
            '<div class="fcp-nums">' +
              '<button type="button" class="fcp-num" data-n="1">1</button>' +
              '<button type="button" class="fcp-num" data-n="2">2</button>' +
              '<button type="button" class="fcp-num" data-n="3">3</button>' +
              '<button type="button" class="fcp-num" data-n="4">4</button>' +
              '<button type="button" class="fcp-num" data-n="5">5</button>' +
              '<button type="button" class="fcp-num" data-n="6">6</button>' +
              '<button type="button" class="fcp-num" data-n="7">7</button>' +
              '<button type="button" class="fcp-num" data-n="8">8</button>' +
              '<button type="button" class="fcp-num" data-n="9">9</button>' +
              '<button type="button" class="fcp-num" data-n="10">10</button>' +
            '</div>' +
          '</div>' +
          '<div id="fc-act-picker" style="display:none">' +
            '<div class="fcp-head"><span id="fca-name"></span><button type="button" id="fca-close" aria-label="Close">×</button></div>' +
            '<input id="fca-search" type="text" autocomplete="off" data-i18n-ph="chk.actSearch" placeholder="Search or write…" />' +
            '<div id="fca-list"></div>' +
          '</div>' +
          '<div id="place-picker" style="display:none">' +
            '<div class="fcp-head"><span data-i18n="place.nearby">Nearby places</span><button type="button" id="place-close" aria-label="Close">×</button></div>' +
            '<div id="place-list"></div>' +
          '</div>' +
        '</div>' +
        '<div id="entry-page" style="display:none">' +
          '<div class="field-page-bar">' +
            '<button id="entry-back" class="fp-back" title="Back">‹</button>' +
            '<span id="entry-title" class="field-place"></span>' +
            '<span class="field-actions">' +
              '<button id="entry-merge" class="demo-btn" data-i18n="chk.merge">Merge</button>' +
            '</span>' +
          '</div>' +
          '<div id="entry-list"></div>' +
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
        '<div id="sp-menu" style="display:none">' +
          '<button type="button" class="sp-menu-item sp-menu-app" data-act="apprange" data-i18n="menu.apprange">Species distribution</button>' +
          '<button type="button" class="sp-menu-item sp-menu-app" data-act="appmig" data-i18n="menu.appmig">Migration</button>' +
          '<button type="button" class="sp-menu-item" data-act="recent" data-i18n="menu.recent">Recent detections</button>' +
          '<button type="button" class="sp-menu-item" data-act="distmap" data-i18n="menu.distmap">Distribution map</button>' +
          '<button type="button" class="sp-menu-item" data-act="wiki" data-i18n="menu.wiki">Wikipedia</button>' +
          '<button type="button" class="sp-menu-item" data-act="birdlife" data-i18n="menu.birdlife">BirdLife</button>' +
          '<button type="button" class="sp-menu-item" data-act="ebird" data-i18n="menu.ebird">eBird (recent sightings)</button>' +
          '<button type="button" class="sp-menu-item" data-act="macaulay" data-i18n="menu.macaulay">Macaulay Library</button>' +
          '<button type="button" class="sp-menu-item" data-act="xeno" data-i18n="menu.xeno">Xeno-canto (audio)</button>' +
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
        '<div id="about-modal" style="display:none"><div id="about-box">' +
          '<button type="button" id="about-close" aria-label="Close">×</button>' +
          '<h3 data-i18n="about.title">About the model &amp; how values are computed</h3>' +
          '<div id="about-body"></div>' +
        '</div></div>' +
        '<div id="last-change"></div>' +
        '<div id="visit-counter"><img src="https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fpcmoan70.github.io%2Fmigration_calendar&label=page%20visits&labelColor=%230f1b24&countColor=%232f6f4f" alt="page visits" /></div>' +
        '<div id="perf-modal" style="display:none"><div id="perf-modal-box">' +
          '<h2 class="perf-title" data-i18n="popup.title">Species distributions and checklists</h2>' +
          '<p data-i18n="popup.perf"></p>' +
          '<p class="perf-feedback"><span data-i18n="popup.feedback"></span> <a href="mailto:vesmir09@gmail.com">vesmir09@gmail.com</a></p>' +
          '<p class="perf-attrib" data-i18n="footer.attrib"></p>' +
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
      // The header banner holds the bird (settings) icon, the Mode dropdown and
      // the Checklist dropdown.
      var hdr = document.getElementById("site-header");
      var sw = document.getElementById("settings-wrap");
      if (hdr && sw) hdr.appendChild(sw);
      var modeWrap = document.getElementById("mode-wrap");
      if (hdr && modeWrap) hdr.appendChild(modeWrap);
      var chkWrap = document.getElementById("checklists-wrap");
      if (hdr && chkWrap) hdr.appendChild(chkWrap);
      syncHeaderHeight();
      window.addEventListener("resize", syncHeaderHeight);
      populateLangSelect();
      populateWeekSelect();
      restoreControls();
      populateSecondLangSelect();
      updateAnalysisControls();
      applyI18n();
      initMap();
      bindControls();
      refreshHiddenUI();
      refreshChecklists();
      setStatus(t("status.selectSpecies"));
      showLastChange();
      showPerfModal();
      initOfflineIndicator();
    } catch (e) {
      document.getElementById("demo-loading").innerHTML =
        '<span style="color:red">' + t("app.failed", { msg: e.message }) + '</span>';
      console.error(e);
    }
  }

  // Small badge shown only while the browser is offline, reassuring the user
  // the app is running from its cache. Re-localized on language change via the
  // data-i18n attribute picked up by applyI18n().
  function initOfflineIndicator() {
    var badge = document.createElement("div");
    badge.id = "offline-badge";
    badge.setAttribute("data-i18n", "status.offline");
    badge.textContent = t("status.offline");
    document.body.appendChild(badge);
    function sync() {
      badge.classList.toggle("show", !navigator.onLine);
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
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
    refreshHiddenUI();      // re-localize hidden-species chip names
    refreshChecklists();    // re-localize the "Checklist (N)" button text
    if (document.getElementById("field-page").style.display === "flex") renderFieldList();  // re-localize activity labels if open
    refreshCurrentView();   // re-render species names in the active panel
  }

  function populateLangSelect() {
    var sel = document.getElementById("lang-select");
    // Fully-translated (★) languages first, then the rest; alphabetical by
    // displayed name within each group.
    var ordered = window.GeoI18N.LANGS.slice().sort(function (a, b) {
      if (!!a.full !== !!b.full) return a.full ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    sel.innerHTML = ordered.map(function (L) {
      // ★ marks languages whose interface is fully translated (others fall
      // back to English for UI text).
      var label = L.name + (L.full ? " ★" : "");
      return '<option value="' + L.code + '"' + (L.code === lang ? " selected" : "") + ">" + label + "</option>";
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
      center: center, zoom: zoom,
      // Keep min/max zoom on the H3 step ladder (multiples of H3_ZOOM_STEP) so
      // the clamped end stops don't land off-grid with larger cells.
      minZoom: window.h3 ? Math.ceil(2 / H3_ZOOM_STEP) * H3_ZOOM_STEP : 2,
      maxZoom: window.h3 ? Math.floor(MAX_ZOOM / H3_ZOOM_STEP) * H3_ZOOM_STEP : MAX_ZOOM,
      worldCopyJump: true,
      maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1.0,
      // Zoom in ~2.65x steps (one H3 resolution per level) so hex cells keep a
      // constant on-screen size; only when the H3 overlay is available.
      zoomSnap: window.h3 ? H3_ZOOM_STEP : 1,
      zoomDelta: window.h3 ? H3_ZOOM_STEP : 1,
    });

    setBasemap(window.GeoState.get("basemap", "dark"));

    map.on("click", onMapClick);

    // "Locate me" crosshair control — zooms to the device's current location.
    var LocateControl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        var c = L.DomUtil.create("div", "leaflet-bar leaflet-control");
        var a = L.DomUtil.create("a", "geo-locate-btn", c);
        a.href = "#";
        a.title = t("ctrl.locate");
        a.setAttribute("aria-label", t("ctrl.locate"));
        a.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
          '<circle cx="12" cy="12" r="6"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>' +
          '<line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>';
        L.DomEvent.on(a, "click", function (e) {
          L.DomEvent.preventDefault(e); L.DomEvent.stopPropagation(e);
          map.locate({ setView: true, maxZoom: 11, enableHighAccuracy: true, timeout: 10000 });
        });
        return c;
      }
    });
    map.addControl(new LocateControl());
    map.on("locationerror", function () { setStatus(t("status.locateError")); });

    // After locating, populate the click-driven modes at the current position.
    map.on("locationfound", function (e) {
      if (["list", "barchart", "range"].indexOf(currentMode) >= 0) onMapClick(e);
    });

    map.on("moveend", function () {
      var c = map.getCenter();
      window.GeoState.save({ view: { lat: c.lat, lon: c.lng, zoom: map.getZoom() } });
      // Re-rank an open species search by likelihood at the new centre.
      var sRes = document.getElementById("species-results"), sInp = document.getElementById("species-search");
      if (sRes && sInp && sRes.style.display === "block") showSearch(sInp, sRes);
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
    baseLayer = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: MAX_ZOOM, maxNativeZoom: cfg.maxNativeZoom || MAX_ZOOM, subdomains: cfg.subdomains || "abc" });
    baseLayer.addTo(map);
    baseLayer.bringToBack();
    document.body.setAttribute("data-basemap", which);
    var sel = document.getElementById("maptype-select");
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
    // The probability min–max slider (in Settings) applies to the Species List,
    // the checklist (derived from it), the analysis tabs and the field checklist.
    var probVisible = (currentMode === "range" || currentMode === "list" || currentMode === "barchart");
    document.getElementById("barchart-threshold-wrap").style.display = probVisible ? "" : "none";
    // Week applies in every mode (incl. Migration timeline, where it sets the
    // "current week" used by the Probability / Arrivals / Scatter tabs).
    document.getElementById("week-select-wrap").style.display = "";
    document.getElementById("play-btn-wrap").style.display = isMap ? "" : "none";
    // High-resolution only affects the range/richness map overlays.
    document.getElementById("hires-wrap").style.display = isMap ? "" : "none";
    updateRangeSpecies();   // clickable species name above the map (range only)
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
      // Below the map (the map-controls bar was removed when its controls
      // moved into Settings).
      var anchor = document.getElementById("demo-map-wrap");
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
      var spPanel = document.getElementById("species-panel");
      spPanel.classList.remove("as-page");
      spPanel.style.display = "none";
      document.getElementById("barchart-panel").style.display = "none";
      document.getElementById("field-page").style.display = "none";
      stopFieldGeoWatch();
      hideCsvBtn();
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


    document.getElementById("hires-factor").addEventListener("change", function () {
      hiResFactor = +this.value || 1;
      window.GeoState.save({ hiResFactor: hiResFactor });
      if (currentMode === "range" || currentMode === "richness") { clearOverlay(); triggerRender(); }
    });

    // Range cache budget (MB) → persist to localStorage; 0 disables and clears.
    h3CacheMB = +window.GeoState.get("h3CacheMB", 2) || 0;
    document.getElementById("h3cache-mb").value = String(h3CacheMB);
    loadH3Cache();
    document.getElementById("h3cache-mb").addEventListener("change", function () {
      h3CacheMB = +this.value || 0;
      window.GeoState.save({ h3CacheMB: h3CacheMB });
      saveH3Cache();   // re-fit to the new cap (or clear when Off)
    });

    // Personal eBird API key (enables eBird recent-sightings in the Recent panel).
    var ebKeyEl = document.getElementById("ebird-key");
    ebKeyEl.value = window.GeoState.get("ebirdKey", "") || "";
    ebKeyEl.addEventListener("change", function () { window.GeoState.save({ ebirdKey: this.value.trim() }); });

    document.getElementById("maptype-select").addEventListener("change", function () {
      setBasemap(this.value);
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
    document.getElementById("recent-modal").addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest("#recent-dl")) return;
      if (!lastRecentRows.length) return;
      var nm = (lastRecentMeta && lastRecentMeta.name) || "sightings";
      downloadCsv("sightings_" + String(nm).replace(/[^\w-]+/g, "_") + ".csv", recentCsv());
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
      updateSettingsIcon();
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
    // Field checklist: fuzzy filter, in-row entry, export, clear.
    document.getElementById("field-search").addEventListener("input", function () {
      fieldQuery = this.value; renderFieldList();
    });
    // All / Seen / Missing toggle.
    document.getElementById("field-filter").addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".chk-filter-btn");
      if (!b) return;
      fieldFilter = b.getAttribute("data-ffilter");
      this.querySelectorAll(".chk-filter-btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      renderFieldList();
    });
    // Compose-line edits: the checkbox commits/clears the "seen" flag; the
    // activity and note inputs update the (uncommitted) compose draft.
    function fieldRowUpdate(el) {
      var key = el.getAttribute && el.getAttribute("data-key");
      if (!key) return;
      var card = el.closest(".fc-card");
      if (el.classList.contains("fc-seen")) {
        fcTick(key, el.checked);
        if (card) card.classList.toggle("fc-on", el.checked);
        renderFieldList();
      } else if (el.classList.contains("fc-note")) {
        cd(key).note = el.value;
        if (card) card.classList.toggle("fc-note-on", !!el.value);
      }
      updateFieldSeen();
    }
    var fieldList = document.getElementById("field-list");
    fieldList.addEventListener("input", function (e) { fieldRowUpdate(e.target); });
    fieldList.addEventListener("change", function (e) { fieldRowUpdate(e.target); });
    // ＋ commits the compose draft; the # opens the count picker; tapping the
    // recent-entries area opens the edit page; tapping empty card reveals note.
    fieldList.addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var add = e.target.closest(".fc-add");
      if (add) { fcCommitCompose(add.getAttribute("data-key")); renderFieldList(); return; }
      var ents = e.target.closest(".fc-entries");
      if (ents) { openEntryEdit(ents.getAttribute("data-key")); return; }
      var btn = e.target.closest(".fc-count");
      if (btn) {
        var card0 = btn.closest(".fc-card"), nm = card0 && card0.querySelector(".fc-name");
        openFcPicker(btn.getAttribute("data-key"), nm ? nm.textContent : "");
        return;
      }
      var actBtn = e.target.closest(".fc-act-btn");
      if (actBtn) {
        var cardA = actBtn.closest(".fc-card"), nmA = cardA && cardA.querySelector(".fc-name");
        openFcActPicker(actBtn.getAttribute("data-key"), nmA ? nmA.textContent : "");
        return;
      }
      if (e.target.closest(".fc-act-btn") || e.target.closest(".fc-tick") || e.target.closest(".fc-note") || e.target.closest(".fc-add")) return;
      var card = e.target.closest(".fc-card");
      if (card) { card.classList.add("fc-note-on"); var note = card.querySelector(".fc-note"); if (note) note.focus(); }
    });
    fieldList.addEventListener("scroll", function () { hideFcPicker(); hideFcActPicker(); });
    var fcap = document.getElementById("fc-act-picker");
    fcap.addEventListener("click", function (e) {
      var it = e.target.closest && e.target.closest(".fca-item");
      if (it) { setFcAct(fcActKey, it.getAttribute("data-act")); hideFcActPicker(); return; }
      if (e.target.id === "fca-close") hideFcActPicker();
    });
    var fcaSearch = document.getElementById("fca-search");
    fcaSearch.addEventListener("input", renderFcActList);
    fcaSearch.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); setFcAct(fcActKey, resolveActQuery(this.value)); hideFcActPicker(); }
      else if (e.key === "Escape") { hideFcActPicker(); }
    });
    document.addEventListener("click", function (e) {
      var p = document.getElementById("fc-act-picker");
      if (!p || p.style.display === "none") return;
      if (e.target.closest("#fc-act-picker") || e.target.closest(".fc-act-btn")) return;
      hideFcActPicker();
    });
    var fcp = document.getElementById("fc-picker");
    fcp.addEventListener("click", function (e) {
      var num = e.target.closest && e.target.closest(".fcp-num");
      if (num) { setFcCount(fcPickerKey, +num.getAttribute("data-n")); hideFcPicker(); return; }
      if (e.target.id === "fcp-close") hideFcPicker();
    });
    fcp.addEventListener("pointerdown", function (e) {
      var st = e.target.closest && e.target.closest(".fcp-step");
      if (st) { e.preventDefault(); fcStartHold(st.getAttribute("data-fcp") === "inc" ? 1 : -1); }
    });
    document.addEventListener("pointerup", fcStopHold);
    document.addEventListener("pointercancel", fcStopHold);
    document.addEventListener("click", function (e) {
      var p = document.getElementById("fc-picker");
      if (!p || p.style.display === "none") return;
      if (e.target.closest("#fc-picker") || e.target.closest(".fc-count")) return;
      hideFcPicker();
    });
    document.getElementById("field-csv").addEventListener("click", function () {
      downloadCsv("field_checklist.csv", fieldChecklistCsv());
    });
    document.getElementById("field-log").addEventListener("click", function () {
      downloadCsv("field_checklist_log.csv", fieldLogCsv());
    });
    document.getElementById("field-pdf").addEventListener("click", exportFieldPdf);
    document.getElementById("field-clear").addEventListener("click", function () {
      fcClear(); renderFieldList();
    });
    // "Nearby places" picker for the title.
    document.getElementById("field-nearby").addEventListener("click", function (e) { e.stopPropagation(); openPlacePicker(); });
    document.getElementById("place-close").addEventListener("click", hidePlacePicker);
    document.getElementById("place-list").addEventListener("click", function (e) {
      if (!e.target.closest) return;
      var merge = e.target.closest(".pp-merge");
      if (merge) { fcMerge(merge.getAttribute("data-id")); hidePlacePicker(); renderFieldList(); setStatus(t("chk.merged")); return; }
      var it = e.target.closest(".pp-item");
      if (it && it.getAttribute("data-name")) { setFieldTitle(it.getAttribute("data-name")); hidePlacePicker(); }
    });

    // Editable location title — persist into the field-checklist record.
    document.getElementById("field-coords").addEventListener("change", function () {
      persistFieldTitle(this.value.trim());
    });

    // Back: close the full-screen field page and return to the map.
    document.getElementById("field-back").addEventListener("click", function () {
      hideFcPicker(); hidePlacePicker(); stopFieldGeoWatch();
      document.getElementById("field-page").style.display = "none";
      if (map) map.invalidateSize();
    });
    // Tap the red "!" to toggle the short "far from this location" explanation.
    document.getElementById("field-far").addEventListener("click", function (e) {
      e.stopPropagation();
      var m = document.getElementById("field-far-msg");
      m.style.display = m.style.display === "none" ? "" : "none";
    });

    // Entry-edit page: back, per-entry edits, delete, and merge selected.
    document.getElementById("entry-back").addEventListener("click", closeEntryEdit);
    var entryList = document.getElementById("entry-list");
    entryList.addEventListener("change", function (e) {
      var el = e.target, id = el.getAttribute && el.getAttribute("data-id"); if (!id) return;
      if (el.classList.contains("ent-count")) { var v = el.value.trim(); fcUpdateEntry(id, { count: v === "" ? null : (/^[0-9]+$/.test(v) ? +v : v) }); }
      else if (el.classList.contains("ent-act")) fcUpdateEntry(id, { act: el.value || "" });
      else if (el.classList.contains("ent-note")) fcUpdateEntry(id, { note: el.value });
    });
    entryList.addEventListener("click", function (e) {
      var del = e.target.closest && e.target.closest(".ent-del");
      if (!del) return;
      fcDeleteEntry(del.getAttribute("data-id"));
      var rec = curFieldRecord(false);
      if (!rec || !fcEntriesFor(rec, entryEditKey).length) closeEntryEdit(); else renderEntryEdit();
    });
    document.getElementById("entry-merge").addEventListener("click", function () {
      var ids = Array.prototype.map.call(document.querySelectorAll("#entry-list .ent-sel:checked"), function (c) { return c.getAttribute("data-id"); });
      if (ids.length < 2) { setStatus(t("chk.mergehint")); return; }
      fcMergeEntries(ids); renderEntryEdit();
    });

    // Back from the full-screen Species-List page to the map.
    document.getElementById("sp-back").addEventListener("click", function () {
      var sp = document.getElementById("species-panel");
      sp.classList.remove("as-page");
      sp.style.display = "none";
      if (map) map.invalidateSize();
    });

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
      // Range: re-filter the cached overlay (no re-inference — the filter is
      // applied at draw time). List/Range: also refresh the per-point list.
      if (currentMode === "range" && cachedRender) paintOverlay();
      rerenderPointList();
    }
    document.getElementById("prob-min").addEventListener("input", onProbRange);
    document.getElementById("prob-max").addEventListener("input", onProbRange);

    document.getElementById("play-btn").addEventListener("click", toggleAnimation);

    // Scrub the migration progress bar to jump to any week/date. Dragging
    // pauses playback (the bar stays visible while an animation is cached).
    (function () {
      var pp = document.getElementById("play-progress");
      var dragging = false;
      pp.addEventListener("pointerdown", function (e) {
        if (animating) stopAnimation();
        dragging = true;
        try { pp.setPointerCapture(e.pointerId); } catch (_) {}
        scrubToWeek(e.clientX);
        e.preventDefault();
      });
      pp.addEventListener("pointermove", function (e) { if (dragging) scrubToWeek(e.clientX); });
      function endDrag() { dragging = false; }
      pp.addEventListener("pointerup", endDrag);
      pp.addEventListener("pointercancel", endDrag);
    })();

    // Stop the migration animation when the tab is hidden so it never runs
    // unattended in a backgrounded window; also flush the range cache.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && animating) stopAnimation();
      if (document.hidden && h3SaveTimer) saveH3Cache();
    });
    window.addEventListener("pagehide", function () { if (h3SaveTimer) saveH3Cache(); });

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
    wireDropdown("checklists-toggle", "checklists-panel");
    wireDropdown("settings-toggle", "settings-panel");

    // About (model & methodology) opens from the Settings dropdown as a modal.
    document.getElementById("about-open").addEventListener("click", function () {
      closeDropdowns();
      document.getElementById("about-modal").style.display = "flex";
    });
    document.getElementById("about-close").addEventListener("click", function () {
      document.getElementById("about-modal").style.display = "none";
    });
    document.getElementById("about-modal").addEventListener("click", function (e) {
      if (e.target === this) this.style.display = "none";
    });

    // Checklist actions
    // Open the tickable Checklist for the current point (from the Species list).
    document.getElementById("sp-checklist-btn").addEventListener("click", function () {
      if (!marker) return;
      var ll = marker.getLatLng();
      renderFieldChecklist(ll.lat, ll.lng);
    });
    document.getElementById("sp-pdf-btn").addEventListener("click", exportSpeciesPdf);

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
        // BirdLife DataZone and eBird cover birds only — hide for other groups.
        var bird = isBirdKey(menuKey);
        var blBtn = spMenu.querySelector('[data-act="birdlife"]');
        if (blBtn) blBtn.style.display = bird ? "" : "none";
        var ebBtn = spMenu.querySelector('[data-act="ebird"]');
        if (ebBtn) ebBtn.style.display = bird ? "" : "none";
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
        else if (act === "apprange") showSpeciesRange(menuKey);
        else if (act === "appmig") showSpeciesMigration(menuKey);
        else if (act === "filter") applyNameFilter(menuName);
        else if (act === "wiki") openWikipedia(menuSci || menuName);
        else if (act === "birdlife") openBirdLife((labelsByKey[menuKey] && labelsByKey[menuKey].common) || menuName, menuSci || menuName);
        else if (act === "ebird") {
          // With a personal key, show eBird sightings in-app; otherwise the page.
          if (ebirdKey()) { var er = marker ? marker.getLatLng() : map.getCenter(); showRecent(menuName, menuSci || menuName, er.lat, er.lng, menuKey); }
          else openExternal(ebirdUrl(menuKey, menuSci || menuName));
        }
        else if (act === "macaulay") openExternal(macaulayUrl(menuKey, menuSci || menuName));
        else if (act === "xeno") openExternal(xenoCantoUrl(menuSci || menuName));
        else if (act === "distmap") showDistMap(menuName, menuSci || menuName, menuKey);
        else if (act === "recent") { var rl = marker ? marker.getLatLng() : map.getCenter(); showRecent(menuName, menuSci || menuName, rl.lat, rl.lng, menuKey); }
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

  // Per-species probabilities at the current map centre/week, used to rank the
  // species search by local likelihood. Computed lazily (one inference) and
  // cached; a centre/week change triggers a recompute that refreshes the
  // open dropdown (also re-run on map moveend).
  var searchProbs = null, searchProbsKey = null, searchProbsPending = null;
  function searchKeyNow() {
    if (!map) return null;
    var c = map.getCenter();
    return c.lat.toFixed(2) + "," + c.lng.toFixed(2) + ":" + (document.getElementById("week-select") || {}).value;
  }
  function searchProbsCurrent() {
    var key = searchKeyNow();
    if (searchProbs && searchProbsKey === key) return searchProbs;
    if (key && searchProbsPending !== key) {
      searchProbsPending = key;
      var c = map.getCenter(), wk = +document.getElementById("week-select").value;
      runInference(new Float32Array([c.lat, c.lng, wk]), 1).then(function (out) {
        searchProbs = out; searchProbsKey = key; searchProbsPending = null;
        var inp = document.getElementById("species-search"), res = document.getElementById("species-results");
        if (inp && res && res.style.display === "block") showSearch(inp, res);
      }).catch(function () { searchProbsPending = null; });
    }
    return null;
  }

  function showSearch(inputEl, resultsEl) {
    var q = inputEl.value.trim().toLowerCase();
    var probs = searchProbsCurrent();   // rank by likelihood at the map centre
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
      });
    }
    if (probs) matches.sort(function (a, b) { return (probs[b.index] || 0) - (probs[a.index] || 0); });
    matches = matches.slice(0, 30);
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

  // Show the app's own range map for a species: switch to Species Range mode,
  // close any full-screen panel, and select the species (which renders it).
  function showSpeciesRange(key) {
    if (!labelsByKey[key]) return;
    var modeEl = document.getElementById("mode-select");
    if (modeEl.value !== "range") { modeEl.value = "range"; modeEl.dispatchEvent(new Event("change", { bubbles: true })); }
    var ep = document.getElementById("entry-page"); if (ep) ep.style.display = "none";
    selectSpecies(key);
    if (map) map.invalidateSize();
  }

  // The point a per-species migration timeline should be computed at: the open
  // checklist's location, else the placed marker, else the current map centre.
  function migrationPoint() {
    var fp = document.getElementById("field-page");
    if (fp && fp.style.display !== "none" && typeof fieldLat === "number") return { lat: fieldLat, lon: fieldLon };
    if (marker) { var ll = marker.getLatLng(); return { lat: ll.lat, lon: ll.lng }; }
    var c = map.getCenter(); return { lat: c.lat, lon: c.lng };
  }

  // "Migration": this one species' weekly probability through the year at a
  // single point — i.e. the Migration (barchart) mode's Timeline tab, run at
  // the relevant point and filtered to just this species.
  function showSpeciesMigration(key) {
    var lbl = labelsByKey[key];
    if (!lbl) return;
    var pt = migrationPoint();
    var modeEl = document.getElementById("mode-select");
    if (modeEl.value !== "barchart") { modeEl.value = "barchart"; modeEl.dispatchEvent(new Event("change", { bubbles: true })); }
    analysisTab = "timeline";
    window.GeoState.save({ analysisTab: analysisTab });
    document.getElementById("an-filter").value = speciesName(lbl);
    renderAnalysis(pt.lat, pt.lon);
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

  // Bilinear sample of the cached probability field at a lat/lon — the same
  // mapping the smooth renderer uses (linear in lon, row by latitude).
  function sampleGridProb(g, probs, lat, lon) {
    var rf = (g.north - lat) / g.step - 0.5;
    var r0 = Math.floor(rf), fr = Math.max(0, Math.min(1, rf - r0));
    r0 = Math.max(0, Math.min(g.nLat - 1, r0));
    var r1 = Math.max(0, Math.min(g.nLat - 1, r0 + 1));
    var lonU = lon; while (lonU < g.west) lonU += 360; while (lonU > g.east) lonU -= 360;
    var cf = (lonU - g.west) / g.step - 0.5;
    var c0 = Math.floor(cf), fc = Math.max(0, Math.min(1, cf - c0));
    c0 = Math.max(0, Math.min(g.nLon - 1, c0));
    var c1 = Math.max(0, Math.min(g.nLon - 1, c0 + 1));
    var b0 = r0 * g.nLon, b1 = r1 * g.nLon;
    var top = probs[b0 + c0] + (probs[b0 + c1] - probs[b0 + c0]) * fc;
    var bot = probs[b1 + c0] + (probs[b1 + c1] - probs[b1 + c0]) * fc;
    return top + (bot - top) * fr;
  }

  // H3 resolution for the overlay. The *scale* (geographic hex size for a given
  // on-screen size) follows the map zoom (metres-per-pixel); the *number* of
  // hexes follows the Resolution setting — a higher setting shrinks the target
  // on-screen edge so more cells cover the view (count ∝ hiResFactor).
  function h3ResForView() {
    var c = map.getCenter(), z = map.getZoom();
    var mpp = 156543.03392 * Math.cos(c.lat * Math.PI / 180) / Math.pow(2, z);
    var edgePx = 26 / Math.sqrt(Math.max(1, hiResFactor));
    var targetM = Math.max(1, edgePx * mpp);
    var best = 0, bestD = Infinity;
    for (var r = 0; r <= 14; r++) {
      // Geometric (log) closeness: H3 resolutions are ~2.65x apart, so log
      // distance centres the on-screen size symmetrically around the target.
      var d = Math.abs(Math.log(window.h3.getHexagonEdgeLengthAvg(r, "m") / targetM));
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  // The distribution overlay is always drawn as filled H3 hexagons (the smooth
  // heatmap is used only if the H3 library failed to load at all).
  function paintOverlay() {
    if (!cachedRender || !map) return;
    if (!window.h3) { paintOverlaySmooth(); return; }
    try { if (cachedRender.h3range) paintRangeH3(); else paintOverlayH3(); } catch (e) { console.warn("h3 overlay", e); }
  }

  // Draw the Species-Range overlay from the per-cell H3 cache (Richness still
  // uses the grid-sampling path in paintOverlayH3).
  function paintRangeH3() {
    ensureOverlayCanvas();
    var cache = h3RangeCache.get(cachedRender.tag) || {};
    var size = map.getSize();
    if (overlayCanvas.width !== size.x || overlayCanvas.height !== size.y) { overlayCanvas.width = size.x; overlayCanvas.height = size.y; }
    L.DomUtil.setPosition(overlayCanvas, map.containerPointToLayerPoint([0, 0]));
    var ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, size.x, size.y);
    var cells = h3CellsInView(h3ResForView());
    var i, max = 0, v;
    for (i = 0; i < cells.length; i++) { v = cache[cells[i]]; if (v != null && v > max) max = v; }
    if (max <= 0) max = 0.01;
    cachedRender.maxProb = max;   // so the legend reflects the visible normalisation
    var pmin = +document.getElementById("prob-min").value / 100;
    var pmax = +document.getElementById("prob-max").value / 100;
    for (i = 0; i < cells.length; i++) {
      var raw = cache[cells[i]];
      if (raw == null || raw < pmin || raw > pmax) continue;   // not computed, or filtered out
      var p = Math.pow(raw / max, DISPLAY_GAMMA);
      if (!(p >= 0.01)) continue;
      var bnd = window.h3.cellToBoundary(cells[i]);
      var minLon = 999, maxLon = -999;
      for (var w = 0; w < bnd.length; w++) { if (bnd[w][1] < minLon) minLon = bnd[w][1]; if (bnd[w][1] > maxLon) maxLon = bnd[w][1]; }
      if (maxLon - minLon > 180) continue;
      ctx.beginPath();
      for (var vtx = 0; vtx < bnd.length; vtx++) {
        var pt = map.latLngToContainerPoint([bnd[vtx][0], bnd[vtx][1]]);
        if (vtx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      var col = colormapLookup(p);
      ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + Math.min(1, 0.25 + p * 0.75).toFixed(3) + ")";
      ctx.fill();
    }
  }

  // Enumerate the H3 cells (resolution `res`) covering the current viewport by
  // sampling screen points and mapping each to its cell. This is bounded by the
  // screen and never throws — unlike polygonToCells, which fails on large areas
  // at some resolutions and previously forced a fall back to square cells.
  function h3CellsInView(res) {
    var size = map.getSize(), c = map.getCenter();
    var mpp = 156543.03392 * Math.cos(c.lat * Math.PI / 180) / Math.pow(2, map.getZoom());
    var edgePx = Math.max(4, window.h3.getHexagonEdgeLengthAvg(res, "m") / mpp);
    var stepPx = Math.max(5, edgePx * 0.6);   // sample finer than a hex so none is missed
    var seen = {}, out = [];
    for (var y = 0; y <= size.y + stepPx; y += stepPx) {
      var yy = Math.min(y, size.y);
      for (var x = 0; x <= size.x + stepPx; x += stepPx) {
        var ll = map.containerPointToLatLng([Math.min(x, size.x), yy]);
        var cell = window.h3.latLngToCell(Math.max(-89.9, Math.min(89.9, ll.lat)), wrapLon(ll.lng), res);
        if (!seen[cell]) { seen[cell] = 1; out.push(cell); }
      }
    }
    return out;
  }

  function paintOverlayH3() {
    ensureOverlayCanvas();
    var g = cachedRender.grid, probs = cachedRender.probs;
    var size = map.getSize();
    if (overlayCanvas.width !== size.x || overlayCanvas.height !== size.y) { overlayCanvas.width = size.x; overlayCanvas.height = size.y; }
    L.DomUtil.setPosition(overlayCanvas, map.containerPointToLayerPoint([0, 0]));
    var ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, size.x, size.y);

    var cells = h3CellsInView(h3ResForView());
    // Only draw hexes whose centre lies within the computed data region, so the
    // overlay never spills predicted colour outside what was actually evaluated.
    for (var i = 0; i < cells.length; i++) {
      var ll = window.h3.cellToLatLng(cells[i]);
      var lonU = ll[1]; while (lonU < g.west) lonU += 360; while (lonU > g.east) lonU -= 360;
      if (ll[0] > g.north + 1e-9 || ll[0] < g.south - 1e-9 || lonU < g.west - 1e-9 || lonU > g.east + 1e-9) continue;
      var p = sampleGridProb(g, probs, ll[0], ll[1]);
      if (!(p >= 0.01)) continue;
      var bnd = window.h3.cellToBoundary(cells[i]);
      // Skip hexes straddling the antimeridian (would smear across the map).
      var minLon = 999, maxLon = -999;
      for (var w = 0; w < bnd.length; w++) { if (bnd[w][1] < minLon) minLon = bnd[w][1]; if (bnd[w][1] > maxLon) maxLon = bnd[w][1]; }
      if (maxLon - minLon > 180) continue;
      ctx.beginPath();
      for (var v = 0; v < bnd.length; v++) {
        var pt = map.latLngToContainerPoint([bnd[v][0], bnd[v][1]]);
        if (v === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      var col = colormapLookup(p);
      ctx.fillStyle = "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + Math.min(1, 0.25 + p * 0.75).toFixed(3) + ")";
      ctx.fill();
    }
  }

  // Smooth-heatmap fallback: bilinearly interpolate the PROBABILITY SCALAR (in
  // longitude, linear in screen-x, and latitude, mapped back per Mercator row),
  // then colourise each pixel. Built at ~screen resolution, drawn ~1:1.
  function paintOverlaySmooth() {
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
    // High-resolution multiplies the points per axis by hiResFactor
    // (1/hiResFactor the cell size); factor 1 = normal resolution.
    var step = (ZOOM_STEP[Math.round(map.getZoom())] || 3) / hiResFactor;   // zoom may be fractional (H3-aligned snapping)
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
  // The selected species' name shown above the map in Range mode — clickable
  // (same context menu as a species-list name).
  function updateRangeSpecies() {
    var el = document.getElementById("range-species");
    if (!el) return;
    var key = document.getElementById("species-search").dataset.selectedKey;
    if (currentMode === "range" && key && labelsByKey[key]) {
      el.innerHTML = nameLinkHtml(labelsByKey[key]);
      el.style.display = "block";
    } else {
      el.innerHTML = "";
      el.style.display = "none";
    }
  }

  // Species Range overlay, computed and cached per H3 cell. Only the cells
  // visible at the current zoom that aren't already cached are inferred, so
  // zooming/panning back over an area costs nothing.
  async function renderRangeMap() {
    if (!animateAll) invalidateAnimation();   // a fresh single-week render makes any precomputed animation stale
    var key = document.getElementById("species-search").dataset.selectedKey;
    updateRangeSpecies();
    if (!key || !labelsByKey[key] || !window.h3) return;
    if (rendering) { renderGeneration++; return; }
    var gen = ++renderGeneration;
    var lbl = labelsByKey[key], speciesIdx = lbl.index, name = speciesName(lbl);
    var selectedWeek = +document.getElementById("week-select").value;
    var weeks = weeksToCompute(), CHUNK = inferChunk();
    var res = h3ResForView(), cells = h3CellsInView(res);
    var approxStep = +(window.h3.getHexagonEdgeLengthAvg(res, "m") / 111320).toFixed(3);

    // Collect the (week, cell) pairs not yet in the cache.
    var missing = [];
    weeks.forEach(function (w) {
      var cache = h3RangeCacheFor(key + ":" + w);
      for (var i = 0; i < cells.length; i++) if (!(cells[i] in cache)) missing.push({ w: w, c: cells[i], cache: cache });
    });

    if (missing.length === 0) {   // fully cached for this view
      cachedRender = { h3range: true, tag: key + ":" + selectedWeek };
      paintOverlay();
      setStatus(t("status.rangeCached", { name: name, week: weekText(selectedWeek), n: cells.length.toLocaleString(), step: approxStep }));
      updateLegend(); updateMapCsv();
      return;
    }

    rendering = true;
    showComputingOverlay(true, name);
    var total = Math.ceil(missing.length / CHUNK), done = 0;
    try {
      for (var s = 0; s < missing.length; s += CHUNK) {
        if (gen !== renderGeneration) return;
        var batch = missing.slice(s, s + CHUNK);
        var inputs = new Float32Array(batch.length * 3);
        for (var j = 0; j < batch.length; j++) {
          var ll = window.h3.cellToLatLng(batch[j].c);
          inputs[j * 3] = ll[0]; inputs[j * 3 + 1] = ll[1]; inputs[j * 3 + 2] = batch[j].w;
        }
        // Worker returns just this species' column (batch.length floats).
        var out = await runInference(inputs, batch.length, { task: "column", speciesIdx: speciesIdx });
        for (var k = 0; k < batch.length; k++) batch[k].cache[batch[k].c] = out[k];
        setComputeProgress(++done / total);
        setStatus(t("status.computing", { name: name, week: weekText(selectedWeek), n: missing.length, i: done, total: total }));
        if (gen === renderGeneration) { cachedRender = { h3range: true, tag: key + ":" + selectedWeek }; paintOverlay(); }
      }
      if (gen !== renderGeneration) return;
      cachedRender = { h3range: true, tag: key + ":" + selectedWeek };
      paintOverlay();
      setStatus(t("status.rangeDone", { name: name, week: weekText(selectedWeek), n: cells.length.toLocaleString(), step: approxStep }));
      updateLegend(); updateMapCsv(); scheduleH3Save();
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
        setStatus(t("status.richnessCached", { week: weekText(week), n: g.nLat * g.nLon, step: fmtStep(g.step) }));
        updateLegend();
        updateMapCsv();
      } else { renderRichness(); }
      return;
    }

    var key = document.getElementById("species-search").dataset.selectedKey;
    if (!key || !labelsByKey[key] || !window.h3) return;
    // Range: paint from the H3 cache if every visible cell for this week is
    // cached (e.g. animation playback); otherwise compute the missing cells.
    var cache = h3RangeCache.get(key + ":" + week);
    var cells = h3CellsInView(h3ResForView());
    var allCached = cache && cells.every(function (c) { return c in cache; });
    if (allCached) {
      cachedRender = { h3range: true, tag: key + ":" + week };
      paintOverlay();
      setStatus(t("status.rangeCached", { name: speciesName(labelsByKey[key]), week: weekText(week), n: cells.length, step: "" }));
      updateLegend();
      updateMapCsv();
    } else { renderRangeMap(); }
  }

  // ---- Species richness ----------------------------------------------------
  var RICHNESS_THRESHOLD = 0.05;

  async function renderRichness() {
    if (!animateAll) invalidateAnimation();   // a fresh single-week render makes any precomputed animation stale
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
      setStatus(t("status.richnessCached", { week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: fmtStep(g.step) }));
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
      setStatus(t("status.richnessDone", { week: weekText(selectedWeek), n: totalPoints.toLocaleString(), step: fmtStep(g.step) }));
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
    if (!marker) return;
    var ll = marker.getLatLng();
    if (currentMode === "list" || currentMode === "range") renderSpeciesList(ll.lat, ll.lng);
  }

  function onMapClick(e) {
    // List + Range show the per-point species list; Migration the analysis.
    if (["list", "barchart", "range"].indexOf(currentMode) < 0) return;
    if (marker) map.removeLayer(marker);
    // Normalize: latitude clamped to [-90, 90]; longitude wrapped to [-180, 180]
    // (a click on a panned world-copy can otherwise give e.g. lon = 635).
    var lat = Math.max(-90, Math.min(90, e.latlng.lat));
    var lon = wrapLon(e.latlng.lng);
    marker = L.marker([lat, lon]).addTo(map);
    if (currentMode === "list") {
      // Let the user pick: the Species list, or the (tickable) Checklist.
      bindPointPopup(marker, lat, lon);
    } else if (currentMode === "barchart") {
      renderAnalysis(lat, lon);
    } else {
      renderSpeciesList(lat, lon);   // range (inline under map)
    }
  }

  function makePopupBtn(label, cls, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "demo-btn " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  // Species-List click: choose the Species list or the (tickable) Checklist.
  function bindPointPopup(mk, lat, lon) {
    var wrap = document.createElement("div");
    wrap.className = "map-choose";
    wrap.appendChild(makePopupBtn(t("mode.list"), "", function () { mk.closePopup(); renderSpeciesList(lat, lon); }));
    wrap.appendChild(makePopupBtn(t("btn.checklist"), "", function () { mk.closePopup(); renderFieldChecklist(lat, lon); }));
    mk.bindPopup(wrap, { closeButton: true, autoClose: false, autoPan: true, className: "choose-popup", offset: [0, -8] });
    mk.openPopup();
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

  // A detailed, specific place name (the actual locality — building/park/road/
  // neighbourhood, plus the town/city), not the county or country. Cached.
  var placeDetailCache = {};
  function detailedPlaceLabel(j) {
    var a = (j && j.address) || {};
    var specific = (j && j.name) || a.amenity || a.leisure || a.tourism || a.building ||
      a.natural || a.water || a.peak || a.road || a.pedestrian || a.neighbourhood ||
      a.suburb || a.quarter || a.hamlet || a.city_district || a.village || "";
    var town = a.town || a.city || a.village || a.municipality || "";
    if (specific && town && specific !== town) return specific + ", " + town;
    return specific || town || a.county || a.state || a.country || (j && j.display_name) || "";
  }
  function detailedPlaceName(lat, lon) {
    var k = lat.toFixed(4) + "," + lon.toFixed(4);
    if (placeDetailCache[k] !== undefined) return Promise.resolve(placeDetailCache[k]);
    return fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=" + lat + "&lon=" + lon, { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var n = detailedPlaceLabel(j); placeDetailCache[k] = n; return n; })
      .catch(function () { placeDetailCache[k] = ""; return ""; });
  }

  function haversineKm(la1, lo1, la2, lo2) {
    var R = 6371, dLa = (la2 - la1) * Math.PI / 180, dLo = (lo2 - lo1) * Math.PI / 180;
    var a = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  // Named natural features / reserves / parks / places near a point, from the
  // Overpass API, nearest first (the things reverse-geocoding tends to skip).
  function nearbyPlaces(lat, lon) {
    var R = 1000;   // metres
    var f = "(nwr(around:" + R + "," + lat + "," + lon + ")[name][natural];" +
      'nwr(around:' + R + ',' + lat + ',' + lon + ')[name][leisure~"^(nature_reserve|park)$"];' +
      'nwr(around:' + R + ',' + lat + ',' + lon + ')[name][boundary~"^(protected_area|national_park)$"];' +
      'nwr(around:' + R + ',' + lat + ',' + lon + ')[name][place];);';
    var q = "[out:json][timeout:25];" + f + "out tags center 120;";
    return fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: "data=" + encodeURIComponent(q) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var seen = {}, out = [];
        (j.elements || []).forEach(function (e) {
          var nm = e.tags && e.tags.name; if (!nm) return;
          var ela = e.lat != null ? e.lat : (e.center && e.center.lat);
          var elo = e.lon != null ? e.lon : (e.center && e.center.lon);
          if (ela == null) return;
          var d = haversineKm(lat, lon, ela, elo);
          if (seen[nm] != null) { if (d < seen[nm]) seen[nm] = d; return; }
          seen[nm] = d; out.push({ name: nm, dist: d });
        });
        out.forEach(function (o) { o.dist = seen[o.name]; });
        out.sort(function (a, b) { return a.dist - b.dist; });
        return out.slice(0, 30);
      });
  }
  function hidePlacePicker() { var p = document.getElementById("place-picker"); if (p) p.style.display = "none"; }
  // Set (and persist for this point) the field-checklist title.
  function setFieldTitle(name) {
    document.getElementById("field-coords").value = name;
    persistFieldTitle((name || "").trim());
  }
  function openPlacePicker() {
    var p = document.getElementById("place-picker"), list = document.getElementById("place-list");
    p.style.display = "block";
    // Section 1: your other checklists — selecting one merges it into this list.
    var lists = buildChecklistItems(getFieldChecklists()).filter(function (it) { return it.pkey !== fieldKey; });
    lists.forEach(function (it) { it.dist = (typeof fieldLat === "number" && it.lat != null) ? haversineKm(fieldLat, fieldLon, it.lat, it.lon) : null; });
    lists.sort(function (a, b) { return (a.dist == null ? Infinity : a.dist) - (b.dist == null ? Infinity : b.dist); });
    var distLabel = function (d) { return d == null ? "" : (d < 1 ? Math.round(d * 1000) + " m" : d.toFixed(1) + " km"); };
    var listsHtml = lists.length ? ('<div class="pp-head">' + escapeHtml(t("ctrl.checklists")) + "</div>" +
      lists.map(function (it) {
        return '<button type="button" class="pp-item pp-merge" data-id="' + escapeHtml(it.pkey) + '">⤭ ' + escapeHtml(it.name) + '<span class="pp-dist">' + distLabel(it.dist) + "</span></button>";
      }).join("")) : "";
    var placesHead = '<div class="pp-head">' + escapeHtml(t("place.nearby")) + "</div>";
    list.innerHTML = listsHtml + placesHead + '<div class="spinner" style="margin:18px auto"></div>';
    nearbyPlaces(fieldLat, fieldLon).then(function (rows) {
      var placesHtml = rows.length ? rows.map(function (r) {
        return '<button type="button" class="pp-item" data-name="' + escapeHtml(r.name) + '">' + escapeHtml(r.name) + '<span class="pp-dist">' + distLabel(r.dist) + "</span></button>";
      }).join("") : '<p class="recent-none">' + escapeHtml(t("place.none")) + "</p>";
      list.innerHTML = listsHtml + placesHead + placesHtml;
    }).catch(function () { list.innerHTML = listsHtml + placesHead + '<p class="recent-none">' + escapeHtml(t("place.none")) + "</p>"; });
  }

  // ---- Field checklist (mobile live entry) ---------------------------------
  // A checklist is a day-scoped record per location, keyed by placeKey@DAY, and
  // is *built from an append-only observation log*: every sighting (a tick, a
  // count change, or an explicit ＋) appends an entry stamped with its time and
  // coordinates. The visible per-species rows are an aggregation of that log,
  // so no detail (when/where each observation happened) is ever lost.
  //   record = { id, title, lat, lon, day, createdAt, log: [ entry, … ] }
  //   entry  = { ts, lat, lon, key, count, act, note }
  function getFieldChecklists() { return window.GeoState.get("fieldChecklists", {}) || {}; }
  function saveFieldChecklists(o) { window.GeoState.save({ fieldChecklists: o }); }
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function listIdFor(lat, lon, day) { return placeKey(lat, lon) + "@" + (day || todayStr()); }
  function dayOf(rec) { return rec.day || (rec.createdAt ? String(rec.createdAt).slice(0, 10) : todayStr()); }

  // Migrate a legacy {entries:{key:{seen,count,act,note}}} record to the
  // log-based shape, synthesising one log entry per recorded species.
  function migrateFieldRecord(rec, id) {
    if (!rec || rec.log) return rec;
    var ts = rec.createdAt ? (Date.parse(rec.createdAt) || Date.now()) : Date.now();
    var day = rec.createdAt ? String(rec.createdAt).slice(0, 10) : todayStr();
    var log = [], seen = {}, entries = rec.entries || {};
    Object.keys(entries).forEach(function (key) {
      var e = entries[key] || {};
      if (!e.seen && (e.count == null || e.count === "") && !e.act && !e.note) return;
      log.push({ id: "e" + (ts).toString(36) + Math.random().toString(36).slice(2, 6), ts: ts, lat: rec.lat, lon: rec.lon, key: key, count: e.count != null ? +e.count : null, act: e.act || "", note: e.note || "" });
      seen[key] = true;
    });
    return { id: id, title: rec.title || "", lat: rec.lat, lon: rec.lon, day: day, createdAt: rec.createdAt || new Date(ts).toISOString(), log: log, seen: seen };
  }
  function getFieldRecord(id) {
    var all = getFieldChecklists(), rec = all[id], changed = false;
    if (!rec) return null;
    if (!rec.log) { rec = migrateFieldRecord(rec, id); all[id] = rec; changed = true; }
    if (!rec.seen) { rec.seen = {}; rec.log.forEach(function (e) { rec.seen[e.key] = true; }); changed = true; }   // backfill seen flags
    rec.log.forEach(function (e) { if (!e.id) { e.id = "e" + (e.ts || Date.now()).toString(36) + Math.random().toString(36).slice(2, 6); changed = true; } });
    if (changed) { all[id] = rec; saveFieldChecklists(all); }
    return rec;
  }
  function newFieldRecord(id, lat, lon) {
    return { id: id, title: "", lat: lat, lon: lon, day: todayStr(), createdAt: new Date().toISOString(), log: [], seen: {} };
  }
  // The currently open record (optionally creating it on first write).
  function curFieldRecord(create) {
    if (!fieldKey) return null;
    return getFieldRecord(fieldKey) || (create ? newFieldRecord(fieldKey, fieldLat, fieldLon) : null);
  }
  function putFieldRecord(rec) {
    // Give a freshly-recorded list a real place name (not coordinates) as soon
    // as it has content, using the resolved name for its location when known.
    if (!(rec.title || "").trim() && rec.log.length) {
      var nm = fieldNameCache[String(rec.id).split("@")[0]];
      if (nm) rec.title = nm;
    }
    var all = getFieldChecklists();
    var hasSeen = rec.seen && Object.keys(rec.seen).length;
    if (!rec.log.length && !hasSeen && !(rec.title || "").trim()) delete all[rec.id];   // drop empty + untitled
    else all[rec.id] = rec;
    saveFieldChecklists(all);
    refreshChecklists();
  }

  // Sum a (possibly merged, comma-listed) count value numerically.
  function countNum(c) {
    if (c == null || c === "") return 0;
    if (typeof c === "number") return c;
    return String(c).split(/[^0-9.]+/).reduce(function (s, x) { return s + (+x || 0); }, 0);
  }
  // Aggregate a record's log into per-species rows (summed count, latest
  // activity/note, number of distinct observations). Seen is a separate flag.
  function fcAggregate(rec) {
    var agg = {};
    ((rec && rec.log) || []).forEach(function (e) {
      var a = agg[e.key] || (agg[e.key] = { count: 0, n: 0, act: "", note: "", lastTs: -1 });
      a.count += countNum(e.count); a.n++;
      if ((e.ts || 0) >= a.lastTs) { a.lastTs = e.ts || 0; a.act = e.act || ""; a.note = e.note || ""; }
    });
    return agg;
  }
  // Render-shaped view ({key:{seen,count,act,note,n}}) used by exports/badge.
  // `seen` is the checkbox flag (rec.seen), independent of having entries.
  function getFieldEntries() {
    var rec = curFieldRecord(false); if (!rec) return {};
    var agg = fcAggregate(rec), seenSet = rec.seen || {}, out = {};
    Object.keys(agg).forEach(function (k) {
      var a = agg[k], c = a.count > 0 ? a.count : 0;
      out[k] = { seen: !!seenSet[k], count: c > 0 ? c : null, act: a.act || undefined, note: a.note || undefined, n: a.n };
    });
    Object.keys(seenSet).forEach(function (k) { if (!out[k]) out[k] = { seen: true, count: null, n: 0 }; });
    return out;
  }
  function fcLatest(rec, key) { var last = null; rec.log.forEach(function (e) { if (e.key === key && (!last || (e.ts || 0) >= (last.ts || 0))) last = e; }); return last; }
  // A species' log entries (chronological).
  function fcEntriesFor(rec, key) { return ((rec && rec.log) || []).filter(function (e) { return e.key === key; }).sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }); }
  function fcIsSeen(key) { var rec = curFieldRecord(false); return !!(rec && rec.seen && rec.seen[key]); }

  // Transient per-species compose draft backing the top-line inputs (count,
  // activity, note); not persisted until committed via ＋ or a first tick.
  var composeDraft = {};
  function cd(key) { return composeDraft[key] || (composeDraft[key] = { count: null, act: "", note: "" }); }
  function eid() { return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // Append an observation entry to the open list (with id, time, location).
  function fcAppend(key, count, note, act) {
    var rec = curFieldRecord(true); if (!rec) return;
    var loc = regLocation(), eId = eid();
    rec.log.push({ id: eId, ts: Date.now(), lat: loc.lat, lon: loc.lon, key: key, count: (count != null && count !== "" ? count : null), act: act || "", note: (note || "").trim() });
    rec.seen = rec.seen || {}; rec.seen[key] = true;
    rec.lat = fieldLat; rec.lon = fieldLon;
    putFieldRecord(rec);
    freshenEntryLocation(eId);
  }
  // ＋ : commit the species' compose draft as a new entry, then clear it.
  function fcCommitCompose(key) {
    var d = composeDraft[key] || {};
    fcAppend(key, d.count, d.note, d.act);
    composeDraft[key] = { count: null, act: "", note: "" };
  }
  // Checkbox: mark/unmark seen. Ticking a species with no entries writes a
  // first (possibly "present"/uncounted) entry from the compose draft;
  // unticking only clears the flag — it never deletes entries.
  function fcTick(key, on) {
    var rec = curFieldRecord(true); if (!rec) return;
    rec.seen = rec.seen || {};
    var newId = null;
    if (on) {
      rec.seen[key] = true;
      if (!fcEntriesFor(rec, key).length) {
        var d = composeDraft[key] || {}, loc = regLocation(); newId = eid();
        rec.log.push({ id: newId, ts: Date.now(), lat: loc.lat, lon: loc.lon, key: key, count: (d.count != null && d.count !== "" ? d.count : null), act: d.act || "", note: (d.note || "").trim() });
        composeDraft[key] = { count: null, act: "", note: "" };
      }
    } else { delete rec.seen[key]; }
    rec.lat = fieldLat; rec.lon = fieldLon;
    putFieldRecord(rec);
    if (newId) freshenEntryLocation(newId);
  }
  function fcUpdateEntry(id, patch) {
    var rec = curFieldRecord(false); if (!rec) return;
    var e = rec.log.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    for (var k in patch) e[k] = patch[k];
    putFieldRecord(rec);
  }
  function fcDeleteEntry(id) {
    var rec = curFieldRecord(false); if (!rec) return;
    rec.log = rec.log.filter(function (e) { return e.id !== id; });
    putFieldRecord(rec);
  }
  // Merge selected entries into one that LISTS the values (counts/activities/
  // notes joined), keeping the earliest time and its location.
  function fcMergeEntries(ids) {
    var rec = curFieldRecord(false); if (!rec) return;
    var sel = rec.log.filter(function (e) { return ids.indexOf(e.id) >= 0; });
    if (sel.length < 2) return;
    sel.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    var counts = [], acts = [], notes = [];
    sel.forEach(function (e) {
      if (e.count != null && e.count !== "") counts.push(String(e.count));
      String(e.act || "").split(" / ").forEach(function (a) { if (a && acts.indexOf(a) < 0) acts.push(a); });
      if (e.note) notes.push(e.note);
    });
    var merged = { id: eid(), key: sel[0].key, ts: sel[0].ts, lat: sel[0].lat, lon: sel[0].lon,
      count: counts.length ? counts.join(", ") : null, act: acts.join(" / "), note: notes.join(" | ") };
    var first = rec.log.indexOf(sel[0]);
    rec.log = rec.log.filter(function (e) { return ids.indexOf(e.id) < 0; });
    rec.log.splice(Math.max(0, first), 0, merged);
    putFieldRecord(rec);
  }
  function fcClear() { var rec = curFieldRecord(false); if (!rec) return; rec.log = []; rec.seen = {}; putFieldRecord(rec); }
  // Merge another list's observations into the open one, then delete the other.
  function fcMerge(otherId) {
    if (!fieldKey || otherId === fieldKey) return;
    var rec = curFieldRecord(true), other = getFieldRecord(otherId);
    if (!rec || !other) return;
    rec.log = rec.log.concat(other.log).sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
    var all = getFieldChecklists(); delete all[otherId]; all[rec.id] = rec; saveFieldChecklists(all);
    refreshChecklists();
  }
  // Persist the title for the current list (creating its record).
  function persistFieldTitle(v) {
    var rec = curFieldRecord(true); if (!rec) return;
    rec.title = v; rec.lat = fieldLat; rec.lon = fieldLon;
    putFieldRecord(rec);
  }
  // Old per-point titles (pre per-location records); read-only migration fallback.
  function getFieldTitles() { return window.GeoState.get("fieldTitles", {}) || {}; }

  // Subsequence fuzzy match: query chars must appear in order in the name.
  function fuzzyMatch(name, q) {
    if (!q) return true;
    name = name.toLowerCase(); q = q.toLowerCase().replace(/\s+/g, "");
    var i = 0;
    for (var c = 0; c < name.length && i < q.length; c++) if (name[c] === q[i]) i++;
    return i === q.length;
  }

  // ---- "Far from checklist point" warning ----------------------------------
  // While a checklist is open, watch the device location; if it is more than
  // 2 km from the checklist's point, show a red "!" the user can tap to read a
  // short, localized explanation.
  var FIELD_FAR_KM = 2;
  function showFieldFar(on) {
    var b = document.getElementById("field-far");
    if (b) { b.style.display = on ? "" : "none"; b.title = t("chk.far"); }
    if (!on) { var m = document.getElementById("field-far-msg"); if (m) m.style.display = "none"; }
  }
  function stopFieldGeoWatch() {
    if (fieldGeoWatch != null && navigator.geolocation) navigator.geolocation.clearWatch(fieldGeoWatch);
    fieldGeoWatch = null;
    fieldGeoLast = null;
    showFieldFar(false);
  }
  function startFieldGeoWatch() {
    stopFieldGeoWatch();
    if (!navigator.geolocation) return;
    fieldGeoWatch = navigator.geolocation.watchPosition(function (pos) {
      // Stop once the checklist page is no longer showing.
      if (document.getElementById("field-page").style.display !== "flex") { stopFieldGeoWatch(); return; }
      fieldGeoLast = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() };
      var d = haversineKm(pos.coords.latitude, pos.coords.longitude, fieldLat, fieldLon);
      showFieldFar(d > FIELD_FAR_KM);
    }, function () { /* denied / unavailable — no warning */ }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }
  // Location to stamp on a new registration: the live device fix when available,
  // else the checklist's anchor point.
  function regLocation() {
    return fieldGeoLast ? { lat: fieldGeoLast.lat, lon: fieldGeoLast.lon } : { lat: fieldLat, lon: fieldLon };
  }
  // Request a one-shot high-accuracy fix and patch the just-logged entry with it,
  // so each registration ends up with a fresh position (not the open-time anchor).
  function freshenEntryLocation(entryId) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      fieldGeoLast = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() };
      var rec = curFieldRecord(false); if (!rec) return;
      var e = (rec.log || []).filter(function (x) { return x.id === entryId; })[0];
      if (e) { e.lat = pos.coords.latitude; e.lon = pos.coords.longitude; putFieldRecord(rec); }
    }, function () { /* denied / unavailable — keep best-known location */ }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }

  // Build the probability-ranked species list for the clicked/located point.
  // listId pins a specific (possibly past-day) list; otherwise today's list at
  // this place is started/continued.
  async function renderFieldChecklist(lat, lon, listId) {
    fieldQuery = ""; fieldFilter = "all"; composeDraft = {};   // fresh filters + compose drafts each open
    var fs = document.getElementById("field-search"); if (fs) fs.value = "";
    var ff = document.getElementById("field-filter");
    if (ff) ff.querySelectorAll(".chk-filter-btn").forEach(function (x) { x.classList.toggle("is-active", x.getAttribute("data-ffilter") === "all"); });
    var week = +document.getElementById("week-select").value;
    var pmin = +document.getElementById("prob-min").value / 100;
    var pmax = +document.getElementById("prob-max").value / 100;
    setStatus(t("status.predicting", { lat: lat.toFixed(2), lon: lon.toFixed(2), week: week }));
    try {
      var out = await runInference(new Float32Array([lat, lon, week]), 1);
      var rows = [];
      for (var i = 0; i < labels.length; i++) {
        if (out[i] >= pmin && out[i] <= pmax && inGroup(i) && !isHidden(labels[i].key)) {
          rows.push({ key: labels[i].key, name: speciesName(labels[i]), prob: out[i] });
        }
      }
      rows.sort(function (a, b) { return b.prob - a.prob; });
      fieldData = rows;
      fieldLat = lat; fieldLon = lon;
      // Editable title = the user's saved name for this point, else the actual
      // detailed location (resolved async; coordinates meanwhile).
      var fcEl = document.getElementById("field-coords");
      var pkey = placeKey(lat, lon);
      var id = listId || listIdFor(lat, lon);   // today's list at this place by default
      fcEl.dataset.pkey = id;
      fieldKey = id;
      // Stamp last-accessed (for the recency dots in the checklist list); only
      // for lists that already exist in storage — don't create an empty one.
      var allFcs = getFieldChecklists();
      if (allFcs[id]) { allFcs[id].accessedAt = Date.now(); saveFieldChecklists(allFcs); }
      var rec = getFieldRecord(id);
      var saved = (rec && rec.title) || getFieldTitles()[pkey] || fieldNameCache[pkey];
      fcEl.value = saved || (lat.toFixed(4) + "°, " + lon.toFixed(4) + "°");
      var ptok = ++fieldPlaceToken;
      if (!saved) {
        // Resolve a proper place name; show it, remember it as the auto-title,
        // and persist it onto the open list once it has observations so the
        // dropdown never shows raw coordinates.
        detailedPlaceName(lat, lon).then(function (name) {
          if (!name) return;
          fieldNameCache[pkey] = name;
          if (ptok !== fieldPlaceToken) return;          // user moved on
          if (getFieldTitles()[pkey]) return;            // user already named it
          if (!(fcEl.value || "").trim() || /^-?\d.*°/.test(fcEl.value)) fcEl.value = name;
          var r2 = getFieldRecord(id);
          if (r2 && r2.log && r2.log.length && !(r2.title || "").trim()) persistFieldTitle(name);
        });
      }
      document.getElementById("field-page").style.display = "flex";   // full-screen entry page
      hideFcPicker(); hidePlacePicker();
      showFieldFar(false); startFieldGeoWatch();   // re-check distance for this point
      renderFieldList();
      setStatus(t("status.spResult", { n: rows.length, p: (pmin * 100).toFixed(0), lat: lat.toFixed(2), lon: lon.toFixed(2) }));
    } catch (e) { setStatus(t("status.error", { msg: e.message })); console.error(e); }
  }

  // Checklist activity options. Each value is a stable key; ACT holds the label
  // per language [en, sv, de, es, fr, nl, no, it]. FIELD_ACTS is the dropdown
  // order — sorted from most to least commonly recorded.
  var ACT_LANGS = ["en", "sv", "de", "es", "fr", "nl", "no", "it"];
  var ACT = {
    // — everyday —
    stationary: ["Stationary", "Stationär", "Stationär", "Estacionario", "Stationnaire", "Stationair", "Stasjonær", "Stazionario"],
    resting: ["Resting", "Rastande", "Rastend", "En descanso", "En halte", "Rustend", "Rastende", "In sosta"],
    foraging: ["Foraging", "Födosökande", "Nahrungssuchend", "Alimentándose", "En quête de nourriture", "Foeragerend", "Næringssøkende", "In foraggiamento"],
    flyover: ["Flying over", "Överflygande", "Überfliegend", "Sobrevolando", "Survol", "Overvliegend", "Overflygende", "In volo sopra"],
    song: ["Song/display, not breeding", "Sång/spel, ej häckning", "Gesang/Balz, nicht brütend", "Canto/exhibición, no nidificante", "Chant/parade, hors nidification", "Zang/baltsen, niet broedend", "Sang/spill, ikke hekking", "Canto/parata, non nidificante"],
    call: ["Call/other sounds", "Lockläte/övriga ljud", "Ruf/sonstige Laute", "Reclamo/otros sonidos", "Cri/autres sons", "Roep/overige geluiden", "Lokkelyd, øvrige lyder", "Richiamo/altri suoni"],
    migrating: ["Migrating", "Sträckande", "Ziehend", "Migrando", "En migration", "Trekkend", "Trekkende", "In migrazione"],
    atfeeder: ["At feeder", "Vid matning", "Am Futterplatz", "En comedero", "À la mangeoire", "Bij voederplaats", "Ved fôring", "Alla mangiatoia"],
    // — breeding —
    obshab: ["Seen in breeding season, suitable habitat", "Obs. i häckningstid, lämplig biotop", "Beobachtung zur Brutzeit, geeignetes Habitat", "Observación en época de cría, hábitat adecuado", "Observé en période de nidification, habitat favorable", "Waarneming in broedtijd, geschikt biotoop", "Observasjon i hekketid, passende biotop", "Osservazione in periodo riproduttivo, habitat idoneo"],
    songhab: ["Song/display in breeding season & habitat", "Sång/spel i häckningstid, lämplig biotop", "Gesang/Balz zur Brutzeit, geeignetes Habitat", "Canto/exhibición en época y hábitat de cría", "Chant/parade en période et habitat de nidification", "Zang/baltsen in broedtijd, geschikt biotoop", "Sang/spill i hekketid og passende hekkebiotop", "Canto/parata in periodo e habitat riproduttivo"],
    pairhab: ["Pair in suitable breeding habitat", "Par i lämplig häckbiotop", "Paar im geeigneten Bruthabitat", "Pareja en hábitat de cría adecuado", "Couple en habitat de nidification favorable", "Paar in geschikt broedbiotoop", "Par i passende hekkebiotop", "Coppia in habitat riproduttivo idoneo"],
    permterr: ["Permanent territory", "Permanent revir", "Dauerrevier", "Territorio permanente", "Territoire permanent", "Permanent territorium", "Permanent revir", "Territorio permanente"],
    agitated: ["Agitated behaviour (breeding indication)", "Oroligt beteende (häckningsindikation)", "Erregtes Verhalten (Brutverdacht)", "Comportamiento de alarma (indicio de cría)", "Comportement inquiet (indice de nidification)", "Alarmgedrag (broedindicatie)", "Engstelig adferd, indikasjon på hekking", "Comportamento agitato (indizio di nidificazione)"],
    courtship: ["Mating/courtship at possible site", "Parning/uppvaktning på möjlig plats", "Paarung/Balz am möglichen Brutplatz", "Cópula/cortejo en posible lugar", "Accouplement/parade sur site possible", "Paring/balts op mogelijke plek", "Paring/kurtise på mulig hekkeplass", "Accoppiamento/corteggiamento su sito possibile"],
    nestbuild: ["Nest building", "Bobygge", "Nestbau", "Construcción de nido", "Construction du nid", "Nestbouw", "Reirbygging", "Costruzione del nido"],
    incubating: ["Incubating", "Ruvande", "Brütend", "Incubando", "En incubation", "Broedend", "Rugende", "In cova"],
    foodyoung: ["Food for young", "Mat till ungar", "Futter für Junge", "Alimento para crías", "Nourriture pour les jeunes", "Voer voor jongen", "Mat til unger", "Cibo per i piccoli"],
    nesteggsyoung: ["Nest with eggs or young", "Bo med ägg eller ungar", "Nest mit Eiern oder Jungen", "Nido con huevos o crías", "Nid avec œufs ou jeunes", "Nest met eieren of jongen", "Reir med egg eller unger", "Nido con uova o piccoli"],
    nestyoungheard: ["Nest, young heard", "Bo, ungar hörda", "Nest, Junge gehört", "Nido, crías oídas", "Nid, jeunes entendus", "Nest, jongen gehoord", "Reir, unger hørt", "Nido, piccoli uditi"],
    fledglings: ["Fledglings outside nest, not full-grown", "Ungar utanför bo, ej flygga", "Junge außerhalb des Nests, nicht flügge", "Pollos fuera del nido, no volantones", "Jeunes hors du nid, non volants", "Jongen buiten nest, niet vliegvlug", "Unger utenfor reir, ikke utvokste", "Giovani fuori dal nido, non involati"],
    nestinuse: ["Nest in use", "Bo i bruk", "Nest in Benutzung", "Nido en uso", "Nid utilisé", "Nest in gebruik", "Reir i bruk", "Nido in uso"],
    visitnest: ["Visiting occupied nest", "Besöker bebott bo", "Besucht besetztes Nest", "Visita nido ocupado", "Visite un nid occupé", "Bezoekt bewoond nest", "Besøker bebodd reir", "Visita nido occupato"],
    nestvisitq: ["Nest visit?", "Bobesök?", "Nestbesuch?", "¿Visita al nido?", "Visite du nid ?", "Nestbezoek?", "Reirbesøk?", "Visita al nido?"],
    faecalsac: ["Carrying faecal sac", "Bär exkrementsäck", "Kotballen tragend", "Transportando saco fecal", "Transport de sac fécal", "Draagt uitwerpselzakje", "Bar ekskrementpose", "Trasporto sacca fecale"],
    broodpatch: ["Brood patch", "Ruvfläckar", "Brutfleck", "Placa incubatriz", "Plaque incubatrice", "Broedvlek", "Rugeflekker", "Placca incubatrice"],
    usednest: ["Used nest", "Använt bo", "Benutztes Nest", "Nido usado", "Ancien nid utilisé", "Gebruikt nest", "Brukt reir", "Nido usato"],
    eggshell: ["Eggshell", "Äggskal", "Eierschale", "Cáscara de huevo", "Coquille d'œuf", "Eierschaal", "Eggeskall", "Guscio d'uovo"],
    distraction: ["Distraction display", "Avledningsbeteende", "Ablenkungsverhalten", "Distracción (simula herida)", "Comportement de diversion", "Afleidingsgedrag", "Avledningsmanøver", "Comportamento di distrazione"],
    failed: ["Failed breeding", "Misslyckad häckning", "Fehlgeschlagene Brut", "Cría fallida", "Nidification échouée", "Mislukte broedpoging", "Mislykket hekking", "Nidificazione fallita"],
    // — territory / marking —
    terrnonbreed: ["Territory, not breeding", "Revir, ej häckning", "Revier, nicht brütend", "Territorio, no reproductor", "Territoire, hors nidification", "Territorium, niet broedend", "Revir, ikke hekking", "Territorio, non nidificante"],
    ringed: ["Ringed", "Ringmärkt", "Beringt", "Anillado", "Bagué", "Geringd", "Ringmerket", "Inanellato"],
    marked: ["Individually marked (control)", "Individmärkt (kontroll)", "Individuell markiert (Kontrolle)", "Marcado individual (control)", "Marqué individuellement (contrôle)", "Individueel gemerkt (controle)", "Individmerket (kontroll)", "Marcato individualmente (controllo)"],
    // — migration —
    migattempt: ["Attempted migration", "Sträckförsök", "Zugversuch", "Intento de migración", "Tentative de migration", "Trekpoging", "Trekkforsøk", "Tentativo di migrazione"],
    mign: ["Migrating ↑", "Sträckande ↑", "Ziehend ↑", "Migrando ↑", "En migration ↑", "Trekkend ↑", "Trekkende ↑", "In migrazione ↑"],
    migne: ["Migrating ↗", "Sträckande ↗", "Ziehend ↗", "Migrando ↗", "En migration ↗", "Trekkend ↗", "Trekkende ↗", "In migrazione ↗"],
    mige: ["Migrating →", "Sträckande →", "Ziehend →", "Migrando →", "En migration →", "Trekkend →", "Trekkende →", "In migrazione →"],
    migse: ["Migrating ↘", "Sträckande ↘", "Ziehend ↘", "Migrando ↘", "En migration ↘", "Trekkend ↘", "Trekkende ↘", "In migrazione ↘"],
    migs: ["Migrating ↓", "Sträckande ↓", "Ziehend ↓", "Migrando ↓", "En migration ↓", "Trekkend ↓", "Trekkende ↓", "In migrazione ↓"],
    migsw: ["Migrating ↙", "Sträckande ↙", "Ziehend ↙", "Migrando ↙", "En migration ↙", "Trekkend ↙", "Trekkende ↙", "In migrazione ↙"],
    migw: ["Migrating ←", "Sträckande ←", "Ziehend ←", "Migrando ←", "En migration ←", "Trekkend ←", "Trekkende ←", "In migrazione ←"],
    mignw: ["Migrating ↖", "Sträckande ↖", "Ziehend ↖", "Migrando ↖", "En migration ↖", "Trekkend ↖", "Trekkende ↖", "In migrazione ↖"],
    // — mortality —
    sick: ["Sick", "Sjuk", "Krank", "Enfermo", "Malade", "Ziek", "Syk", "Malato"],
    shot: ["Shot/culled", "Skjuten/avlivad", "Geschossen/getötet", "Disparado/sacrificado", "Tiré/abattu", "Geschoten/gedood", "Skutt/avlivet", "Abbattuto/soppresso"],
    roadkill: ["Roadkill", "Trafikdödad", "Verkehrsopfer", "Atropellado", "Tué sur la route", "Verkeersslachtoffer", "Trafikkdrept", "Investito su strada"],
    predator: ["Killed by predator", "Dödad av predator", "Von Prädator getötet", "Muerto por depredador", "Tué par un prédateur", "Gedood door predator", "Drept av predator", "Ucciso da predatore"],
    disease: ["Died of disease/starvation", "Död av sjukdom/svält", "An Krankheit/Hunger gestorben", "Muerto por enfermedad/inanición", "Mort de maladie/famine", "Gestorven door ziekte/honger", "Død av sykdom/sult", "Morto per malattia/fame"],
    oil: ["Killed by oil", "Dödad av olja", "Durch Öl getötet", "Muerto por petróleo", "Tué par le pétrole", "Gedood door olie", "Drept av olje", "Ucciso dal petrolio"],
    electro: ["Electrocuted", "Dödad av elstöt", "Durch Stromschlag getötet", "Electrocutado", "Électrocuté", "Geëlektrocuteerd", "Drept av elektrokusjon (strømslag)", "Folgorato"],
    net: ["Died in net", "Nätdöd", "Im Netz verendet", "Muerto en red", "Mort dans un filet", "Gestorven in net", "Garndød", "Morto in rete"],
    fishgear: ["Injured by fishing gear", "Skadad av fiskeredskap", "Durch Fanggerät verletzt", "Herido por arte de pesca", "Blessé par engin de pêche", "Verwond door vistuig", "Skadet av fiskeredskap", "Ferito da attrezzi da pesca"],
    collwindow: ["Dead – window collision", "Död – kollision med fönster", "Tot – Kollision mit Fenster", "Muerto – colisión con ventana", "Mort – collision avec vitre", "Dood – botsing met raam", "Død - kollisjon med vindu", "Morto – collisione con vetro"],
    collpower: ["Dead – power line collision", "Död – kollision med kraftledning", "Tot – Kollision mit Stromleitung", "Muerto – colisión con línea eléctrica", "Mort – collision avec ligne électrique", "Dood – botsing met hoogspanningslijn", "Død - kollisjon med kraftledning", "Morto – collisione con linea elettrica"],
    collturbine: ["Dead – wind turbine collision", "Död – kollision med vindkraftverk", "Tot – Kollision mit Windrad", "Muerto – colisión con aerogenerador", "Mort – collision avec éolienne", "Dood – botsing met windturbine", "Død - kollisjon med vindturbin", "Morto – collisione con turbina eolica"],
    colllighthouse: ["Dead – lighthouse collision", "Död – kollision med fyr", "Tot – Kollision mit Leuchtturm", "Muerto – colisión con faro", "Mort – collision avec phare", "Dood – botsing met vuurtoren", "Død - kollisjon med fyr", "Morto – collisione con faro"],
    collaircraft: ["Dead – aircraft collision", "Död – kollision med flygplan", "Tot – Kollision mit Flugzeug", "Muerto – colisión con avión", "Mort – collision avec avion", "Dood – botsing met vliegtuig", "Død - kollisjon med fly", "Morto – collisione con aereo"],
    collfence: ["Dead – fence collision", "Död – kollision med stängsel", "Tot – Kollision mit Zaun", "Muerto – colisión con valla", "Mort – collision avec clôture", "Dood – botsing met hek", "Død - kollisjon med gjerde", "Morto – collisione con recinzione"],
    deadunknown: ["Dead – unknown cause", "Död – okänd dödsorsak", "Tot – unbekannte Ursache", "Muerto – causa desconocida", "Mort – cause inconnue", "Dood – onbekende oorzaak", "Død - ukjent dødsårsak", "Morto – causa sconosciuta"],
    // — traces —
    tracksfresh: ["Fresh tracks", "Färska spår", "Frische Spuren", "Rastros frescos", "Traces fraîches", "Verse sporen", "Ferske spor", "Tracce fresche"],
    tracksold: ["Old tracks", "Äldre spår", "Alte Spuren", "Rastros antiguos", "Traces anciennes", "Oude sporen", "Eldre spor", "Tracce vecchie"],
    droppingsfresh: ["Fresh droppings", "Färsk spillning", "Frischer Kot", "Excrementos frescos", "Crottes fraîches", "Verse uitwerpselen", "Fersk møkk", "Escrementi freschi"],
    droppingsold: ["Old droppings", "Äldre spillning", "Alter Kot", "Excrementos antiguos", "Crottes anciennes", "Oude uitwerpselen", "Eldre møkk", "Escrementi vecchi"],
  };
  // Dropdown order: most → least commonly recorded.
  var FIELD_ACTS = [
    "stationary", "resting", "foraging", "flyover", "song", "call", "migrating", "atfeeder",
    "obshab", "songhab", "pairhab", "permterr", "agitated", "courtship", "nestbuild", "incubating",
    "foodyoung", "nesteggsyoung", "nestyoungheard", "fledglings", "nestinuse", "visitnest",
    "nestvisitq", "faecalsac", "broodpatch", "usednest", "eggshell", "distraction", "failed",
    "terrnonbreed", "ringed", "marked",
    "migattempt", "mign", "migne", "mige", "migse", "migs", "migsw", "migw", "mignw",
    "sick", "shot", "roadkill", "predator", "disease", "oil", "electro", "net", "fishgear",
    "collwindow", "collpower", "collturbine", "colllighthouse", "collaircraft", "collfence", "deadunknown",
    "tracksfresh", "tracksold", "droppingsfresh", "droppingsold",
  ];
  // Localized label for an activity key (current UI language, English fallback).
  function actName(key) {
    var a = ACT[key];
    if (!a) return key;
    var i = ACT_LANGS.indexOf(lang);
    return a[i >= 0 ? i : 0] || a[0];
  }

  // Render the (filtered, probability-sorted) field-entry rows.
  function fmtClock(ts) { var d = new Date(ts || Date.now()); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function actLabel(act) { return String(act || "").split(" / ").filter(Boolean).map(function (a) { return actName(a); }).join(" / "); }
  // Compact one-line summary of a logged observation for the card.
  function fcEntryStr(e) {
    var parts = [];
    if (e.count != null && e.count !== "") parts.push("×" + e.count);
    var al = actLabel(e.act); if (al) parts.push(al);
    parts.push(fmtClock(e.ts));
    if (e.note) parts.push("“" + e.note + "”");
    return parts.join(" · ");
  }

  // A card per species: a top "compose" line (checkbox, #, activity, note, ＋)
  // plus the most recent logged observations as small lines you can tap to edit.
  function renderFieldList() {
    if (!fieldData) return;
    var entries = getFieldEntries();
    var rec = curFieldRecord(false);
    var list = document.getElementById("field-list");
    var rows = fieldData.slice(), have = {};
    fieldData.forEach(function (r) { have[r.key] = 1; });
    Object.keys(entries).forEach(function (k) {
      if (have[k]) return;
      var lbl = labelsByKey[k];
      rows.push({ key: k, name: lbl ? speciesName(lbl) : k, prob: null });
    });
    var shown = rows.filter(function (r) {
      if (!fuzzyMatch(r.name, fieldQuery)) return false;
      if (fieldFilter === "all") return true;
      var seen = !!(entries[r.key] && entries[r.key].seen);
      return fieldFilter === "seen" ? seen : !seen;
    });
    list.innerHTML = shown.map(function (r) {
      var en = entries[r.key] || {}, d = cd(r.key), lbl = labelsByKey[r.key];
      var ents = rec ? fcEntriesFor(rec, r.key) : [], n = ents.length;
      var hasN = (d.count != null && d.count !== "");
      var entLines = ents.slice(-2).reverse().map(function (e) {
        return '<div class="fc-eline">' + escapeHtml(fcEntryStr(e)) + "</div>";
      }).join("");
      if (n > 2) entLines += '<div class="fc-eline fc-emore">' + escapeHtml(t("chk.more", { n: n - 2 })) + "</div>";
      var entriesBlock = n ? '<div class="fc-entries" data-key="' + escapeHtml(r.key) + '">' + entLines + "</div>" : "";
      var badge = n > 1 ? '<span class="fc-ncount" title="' + n + '">×' + n + "</span>" : "";
      return '<div class="fc-card' + (en.seen ? " fc-on" : "") + (d.note ? " fc-note-on" : "") + '" data-key="' + escapeHtml(r.key) + '">' +
        '<div class="fc-top">' +
          '<label class="fc-tick"><input type="checkbox" class="fc-seen" data-key="' + escapeHtml(r.key) + '"' + (en.seen ? " checked" : "") + "></label>" +
          '<span class="fc-name sp-link" data-key="' + escapeHtml(r.key) + '" data-name="' + escapeHtml(r.name) + '" data-sci="' + escapeHtml(lbl ? (lbl.sci || "") : "") + '">' + escapeHtml(r.name) + badge + "</span>" +
          '<button type="button" class="fc-count' + (hasN ? " has-n" : "") + '" data-key="' + escapeHtml(r.key) + '">' + (hasN ? d.count : "#") + "</button>" +
          '<button type="button" class="fc-act-btn' + (d.act ? " has-act" : "") + '" data-key="' + escapeHtml(r.key) + '" title="' + escapeHtml(t("chk.activity")) + '">' + (d.act ? escapeHtml(actName(d.act)) : "🏷") + "</button>" +
          '<button type="button" class="fc-add" data-key="' + escapeHtml(r.key) + '" title="' + escapeHtml(t("fc.add")) + '" aria-label="' + escapeHtml(t("fc.add")) + '">＋</button>' +
          '<input type="text" class="fc-note" data-key="' + escapeHtml(r.key) + '" placeholder="' + escapeHtml(t("th.notes")) + '" value="' + escapeHtml(d.note || "") + '" />' +
        "</div>" + entriesBlock +
        "</div>";
    }).join("");
    if (!shown.length) list.innerHTML = '<p class="fc-empty">' + escapeHtml(t("analysis.empty")) + "</p>";
    updateFieldSeen();
  }

  // Update the "✓ N" seen-count badge in the field page bar.
  function updateFieldSeen() {
    var el = document.getElementById("field-seen");
    if (!el) return;
    var entries = getFieldEntries(), n = 0;
    for (var k in entries) if (entries[k] && entries[k].seen) n++;
    el.textContent = n ? "✓ " + n : "";
  }

  // ---- Count quick-select (field checklist) --------------------------------
  var fcPickerKey = null, fcHoldTimer = null, fcHoldInt = null;
  // The # picker now edits the species' compose-draft count (committed only by
  // ＋ or the checkbox), not the log.
  function openFcPicker(key, name) {
    fcPickerKey = key;
    document.getElementById("fcp-name").textContent = name || "";
    document.getElementById("fcp-val").textContent = countNum(cd(key).count);
    document.getElementById("fc-picker").style.display = "block";
  }
  function hideFcPicker() { fcPickerKey = null; var p = document.getElementById("fc-picker"); if (p) p.style.display = "none"; }
  function setFcCount(key, val) {
    val = Math.max(0, val | 0);
    cd(key).count = val > 0 ? val : null;
    var btn = document.querySelector('#field-list .fc-card[data-key="' + key + '"] .fc-count');
    if (btn) { btn.textContent = val > 0 ? val : "#"; btn.classList.toggle("has-n", val > 0); }
    var v = document.getElementById("fcp-val"); if (v) v.textContent = val;
  }
  function fcStep(delta) {
    if (!fcPickerKey) return;
    setFcCount(fcPickerKey, countNum(cd(fcPickerKey).count) + delta);
  }
  function fcStopHold() { clearTimeout(fcHoldTimer); clearInterval(fcHoldInt); fcHoldTimer = fcHoldInt = null; }
  function fcStartHold(delta) {
    fcStep(delta);   // immediate step
    fcHoldTimer = setTimeout(function () { fcHoldInt = setInterval(function () { fcStep(delta); }, 110); }, 400);
  }

  // ---- Activity picker (field checklist) -----------------------------------
  // A scrollable bottom sheet of the (long) activity list, opened from the
  // card's activity button — replaces a cramped <select>. Edits the species'
  // compose-draft activity (committed only by ＋ or the checkbox).
  var fcActKey = null;
  // Resolve a typed query to an activity value: an existing code if the text
  // matches a localized name exactly, otherwise the raw text (a custom value).
  function resolveActQuery(raw) {
    raw = (raw || "").trim(); if (!raw) return "";
    var lc = raw.toLowerCase();
    for (var i = 0; i < FIELD_ACTS.length; i++) if (actName(FIELD_ACTS[i]).toLowerCase() === lc) return FIELD_ACTS[i];
    return raw;
  }
  // (Re)build the list, filtered by the search box. A non-matching query also
  // offers a "＋ <text>" item so a custom activity can be written.
  function renderFcActList() {
    if (!fcActKey) return;
    var cur = cd(fcActKey).act || "";
    var raw = document.getElementById("fca-search").value.trim(), q = raw.toLowerCase();
    var exact = false;
    var matches = FIELD_ACTS.filter(function (a) { var nm = actName(a).toLowerCase(); if (nm === q) exact = true; return !q || nm.indexOf(q) >= 0; });
    var h = '<button type="button" class="fca-item fca-none' + (!cur ? " is-active" : "") + '" data-act="">—</button>';
    if (raw && !exact) h += '<button type="button" class="fca-item fca-custom' + (cur === raw ? " is-active" : "") + '" data-act="' + escapeHtml(raw) + '">＋ ' + escapeHtml(raw) + "</button>";
    matches.forEach(function (a) {
      h += '<button type="button" class="fca-item' + (cur === a ? " is-active" : "") + '" data-act="' + escapeHtml(a) + '">' + escapeHtml(actName(a)) + "</button>";
    });
    document.getElementById("fca-list").innerHTML = h;
  }
  function openFcActPicker(key, name) {
    fcActKey = key;
    document.getElementById("fca-name").textContent = name || "";
    var cur = cd(key).act || "";
    // Prefill the box with a custom value so it stays visible/editable.
    document.getElementById("fca-search").value = (cur && FIELD_ACTS.indexOf(cur) < 0) ? cur : "";
    renderFcActList();
    var p = document.getElementById("fc-act-picker");
    p.style.display = "block";
    var active = p.querySelector(".fca-item.is-active");
    if (active) active.scrollIntoView({ block: "center" });
  }
  function hideFcActPicker() { fcActKey = null; var p = document.getElementById("fc-act-picker"); if (p) p.style.display = "none"; }
  function setFcAct(key, a) {
    cd(key).act = a || "";
    var btn = document.querySelector('#field-list .fc-card[data-key="' + key + '"] .fc-act-btn');
    if (btn) { btn.textContent = a ? actName(a) : "🏷"; btn.classList.toggle("has-act", !!a); }
  }

  // ---- Entry-edit page (per species) ---------------------------------------
  function openEntryEdit(key) { entryEditKey = key; renderEntryEdit(); document.getElementById("entry-page").style.display = "flex"; }
  function closeEntryEdit() { document.getElementById("entry-page").style.display = "none"; entryEditKey = null; renderFieldList(); }
  function renderEntryEdit() {
    var key = entryEditKey, rec = curFieldRecord(false);
    var lbl = labelsByKey[key];
    document.getElementById("entry-title").textContent = lbl ? speciesName(lbl) : key;
    var list = document.getElementById("entry-list");
    var ents = rec ? fcEntriesFor(rec, key).slice().reverse() : [];   // newest first
    if (!ents.length) { list.innerHTML = '<p class="fc-empty">' + escapeHtml(t("analysis.empty")) + "</p>"; return; }
    var actOpts = function (sel) {
      var h = '<option value=""></option>';
      FIELD_ACTS.forEach(function (a) { h += '<option value="' + a + '"' + (sel === a ? " selected" : "") + ">" + escapeHtml(actName(a)) + "</option>"; });
      return h;
    };
    list.innerHTML = ents.map(function (e) {
      var meta = fmtClock(e.ts) + (e.lat != null ? " · " + e.lat.toFixed(3) + "," + e.lon.toFixed(3) : "");
      var singleAct = e.act && e.act.indexOf(" / ") < 0 ? e.act : "";   // merged activities aren't editable in the dropdown
      return '<div class="ent-row" data-id="' + escapeHtml(e.id) + '">' +
        '<label class="ent-sel-wrap"><input type="checkbox" class="ent-sel" data-id="' + escapeHtml(e.id) + '"></label>' +
        '<input type="text" class="ent-count" data-id="' + escapeHtml(e.id) + '" inputmode="numeric" value="' + escapeHtml(e.count != null ? String(e.count) : "") + '" placeholder="#" />' +
        '<select class="ent-act" data-id="' + escapeHtml(e.id) + '">' + actOpts(singleAct) + "</select>" +
        '<input type="text" class="ent-note" data-id="' + escapeHtml(e.id) + '" value="' + escapeHtml(e.note || "") + '" placeholder="' + escapeHtml(t("th.notes")) + '" />' +
        '<span class="ent-meta">' + escapeHtml(meta) + "</span>" +
        '<button type="button" class="ent-del" data-id="' + escapeHtml(e.id) + '" aria-label="' + escapeHtml(t("btn.delete")) + '">×</button>' +
        "</div>";
    }).join("");
  }

  function fieldChecklistCsv() {
    var entries = getFieldEntries(), esc = function (v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var byKey = {}; (fieldData || []).forEach(function (r) { byKey[r.key] = r; });
    var titleEl = document.getElementById("field-coords");
    var title = (titleEl && titleEl.value || "").trim() || (fieldLat.toFixed(4) + "°, " + fieldLon.toFixed(4) + "°");
    var lid = fieldKey || "";
    var lines = ["# " + title + " | " + new Date().toISOString().slice(0, 10)];
    lines.push("checklist,list_id,species,common_name,count,activity,notes");
    Object.keys(entries).forEach(function (key) {
      var e = entries[key]; if (!e.seen && (e.count == null || e.count === "") && !e.act && !e.note) return;
      var name = (byKey[key] && byKey[key].name) || (labelsByKey[key] && speciesName(labelsByKey[key])) || key;
      lines.push([esc(title), esc(lid), key, esc(name), e.count != null ? e.count : "", e.act ? actName(e.act) : "", esc(e.note || "")].join(","));
    });
    return lines.join("\n");
  }

  // The recorded (seen / counted / activity) species of the open checklist,
  // alphabetical — shared by the PDF export.
  function fieldSeenRows() {
    var entries = getFieldEntries();
    var byKey = {}; (fieldData || []).forEach(function (r) { byKey[r.key] = r; });
    var rows = [];
    Object.keys(entries).forEach(function (key) {
      var e = entries[key]; if (!e.seen && (e.count == null || e.count === "") && !e.act && !e.note) return;
      var name = (byKey[key] && byKey[key].name) || (labelsByKey[key] && speciesName(labelsByKey[key])) || key;
      rows.push({ name: name, count: e.count != null ? e.count : "", act: e.act ? actName(e.act) : "", note: e.note || "" });
    });
    rows.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return rows;
  }

  // Open a clean, print-ready page of the seen birds in a new tab and trigger
  // the print dialog (where the browser offers "Save as PDF"). No PDF library
  // needed — works offline.
  function exportFieldPdf() {
    var title = (document.getElementById("field-coords").value || "").trim() || t("btn.checklist").replace(/^[^\wÀ-ɏ]+\s*/, "");
    var date = new Date().toISOString().slice(0, 10);
    var rows = fieldSeenRows();
    var esc = escapeHtml;
    var body = rows.map(function (r, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(r.name) + "</td><td>" + esc(String(r.count)) + "</td><td>" + esc(r.act) + "</td><td>" + esc(r.note) + "</td></tr>";
    }).join("") || '<tr><td></td><td colspan="4">' + esc(t("analysis.empty")) + "</td></tr>";
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + "</title><style>" +
      "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#16302b;margin:32px;}" +
      "h1{font-size:19px;color:#0b3a3a;margin:0 0 2px;}" +
      ".meta{color:#5b6f69;font-size:12px;margin-bottom:18px;}" +
      "table{border-collapse:collapse;width:100%;font-size:13px;}" +
      "th,td{text-align:left;padding:6px 9px;border-bottom:1px solid #d8e1dd;}" +
      "th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5b6f69;}" +
      "thead th{border-bottom:2px solid #bcccc6;}" +
      "td:first-child,th:first-child{width:30px;color:#93a39d;}" +
      "td:nth-child(3),th:nth-child(3){text-align:right;width:64px;}" +
      "</style></head><body>" +
      "<h1>" + esc(title) + "</h1>" +
      '<div class="meta">' + esc(date) + " &middot; " + rows.length + " " + esc(t("chk.seen").toLowerCase()) + "</div>" +
      "<table><thead><tr><th>#</th><th>" + esc(t("th.species")) + "</th><th>" + esc(t("chk.count")) +
      "</th><th>" + esc(t("chk.activity")) + "</th><th>" + esc(t("th.notes")) + "</th></tr></thead><tbody>" + body + "</tbody></table>" +
      "</body></html>";
    openPrintWindow(html);
  }

  function openPrintWindow(html) {
    var w = window.open("", "_blank");
    if (!w) { setStatus(t("status.error", { msg: "popup blocked" })); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { /* user can print manually */ } }, 300);
  }

  // Printable PDF of the detailed Species List (same columns as on screen).
  function exportSpeciesPdf() {
    if (!lastSpeciesPdf || !lastSpeciesPdf.rows.length) { setStatus(t("status.selectSpecies")); return; }
    var d = lastSpeciesPdf, esc = escapeHtml;
    var heading = t("panel.spTitle");
    var meta = (document.getElementById("sp-coords").textContent || "").trim();
    var n2 = !!d.name2Head, cmp = !!d.cmpHead;
    var thead = "<tr><th>#</th><th>" + esc(t("th.species")) + "</th>" +
      (n2 ? "<th>" + esc(d.name2Head) + "</th>" : "") +
      "<th>" + esc(t("th.sci")) + "</th><th class='num'>" + esc(t("th.prob")) + "</th>" +
      (cmp ? "<th class='num'>" + esc(d.cmpHead) + "</th>" : "") + "</tr>";
    var body = d.rows.map(function (r, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(r.name) + "</td>" +
        (n2 ? "<td>" + esc(r.name2) + "</td>" : "") +
        "<td class='sci'>" + esc(r.sci) + "</td><td class='num'>" + esc(r.prob) + "</td>" +
        (cmp ? "<td class='num'>" + esc(r.cmp) + "</td>" : "") + "</tr>";
    }).join("");
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(heading) + "</title><style>" +
      "body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#16302b;margin:32px;}" +
      "h1{font-size:19px;color:#0b3a3a;margin:0 0 2px;}" +
      ".meta{color:#5b6f69;font-size:12px;margin-bottom:18px;}" +
      "table{border-collapse:collapse;width:100%;font-size:13px;}" +
      "th,td{text-align:left;padding:6px 9px;border-bottom:1px solid #d8e1dd;}" +
      "th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5b6f69;}" +
      "thead th{border-bottom:2px solid #bcccc6;}" +
      "td:first-child,th:first-child{width:30px;color:#93a39d;}" +
      "td.sci{font-style:italic;} td.num,th.num{text-align:right;white-space:nowrap;}" +
      "</style></head><body>" +
      "<h1>" + esc(heading) + "</h1>" +
      '<div class="meta">' + esc(meta) + "</div>" +
      "<table><thead>" + thead + "</thead><tbody>" + body + "</tbody></table>" +
      "</body></html>";
    openPrintWindow(html);
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
      document.getElementById("sp-tbody").innerHTML = results.map(function (r) {
        var cmpCell = !hasCompare ? "<td></td>" : cmpAllPositive ? cmpBarCell(kind, r.cmpVal) : deltaCell(r.cmpVal);
        var name2Cell = '<td class="name2">' + (secondLang ? escapeHtml(secondName(r.label)) : "") + '</td>';
        return '<tr><td>' + nameLinkHtml(r.label) + '</td>' + name2Cell + '<td style="font-style:italic">' +
               escapeHtml(r.label.sci) + '</td><td>' + (r.prob * 100).toFixed(1) + '%</td><td class="prob-bar-cell"><div class="prob-bar" style="width:' +
               Math.round(r.prob * 100) + '%"></div></td>' + cmpCell + '</tr>';
      }).join("");
      var sp = document.getElementById("species-panel");
      // In Species-List mode show the list as a full-screen page; in Range mode
      // keep it as an inline card under the map.
      sp.classList.toggle("as-page", currentMode === "list");
      sp.style.display = "block";
      if (currentMode === "list") sp.scrollTop = 0;
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
      // Snapshot the displayed rows/columns for the printable PDF export.
      lastSpeciesPdf = {
        name2Head: secondLang ? window.GeoI18N.langByCode(secondLang).name : "",
        cmpHead: document.getElementById("sp-delta-head").textContent || "",
        rows: results.map(function (r) {
          var cmpText = "";
          if (hasCompare) {
            cmpText = kind === "ratio" ? Math.round(r.cmpVal * 100) + "%"
              : kind === "focus" ? (r.cmpVal * 100).toFixed(0) + "%"
              : (r.cmpVal >= 0 ? "+" : "") + (r.cmpVal * 100).toFixed(1) + "%";
          }
          return { name: speciesName(r.label), name2: secondLang ? secondName(r.label) : "", sci: r.label.sci, prob: (r.prob * 100).toFixed(1) + "%", cmp: cmpText };
        }),
      };
      showCsvBtn();
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
    if (!key || !labelsByKey[key] || !window.h3) return null;
    var week = +document.getElementById("week-select").value;
    var cache = h3RangeCache.get(key + ":" + week) || {};
    var cells = h3CellsInView(h3ResForView());
    var lines = ["h3,latitude,longitude,probability"];
    cells.forEach(function (c) {
      var val = cache[c];
      if (val == null || !(val > 0.001)) return;
      var ll = window.h3.cellToLatLng(c);
      lines.push(c + "," + ll[0].toFixed(4) + "," + ll[1].toFixed(4) + "," + val.toFixed(6));
    });
    if (lines.length === 1) return null;
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
    // Sort by current-week probability (largest first).
    rows.sort(function (a, b) { return b.probs[wkIdx] - a.probs[wkIdx]; });

    var globalMax = 0;
    rows.forEach(function (r) {
      var mx = 0; for (var w = 0; w < 48; w++) if (r.probs[w] > mx) mx = r.probs[w];
      r.max = mx;
      if (mx > globalMax) globalMax = mx;
    });
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
        '<span class="bc-avg">' + t("bc.max", { p: (r.max * 100).toFixed(1) }) + '</span>' +
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
    // Neither map view (Species Range / Species Richness) shows an under-map
    // CSV download; map data is explored via the species list / analysis.
    if (currentMode === "range" || currentMode === "richness") hideCsvBtn();
  }

  // ---- Migration animation -------------------------------------------------
  // Precomputes all 48 weeks for the current viewport, then steps through them
  // so the user watches the predicted range/richness shift across the year.
  function setPlayBtn(playing) {
    var b = document.getElementById("play-btn");
    if (b) b.textContent = playing ? t("btn.pause") : t("btn.play");
  }

  // Month-divided progress bar (map width) shown during migration playback,
  // marking which week the displayed frame represents.
  function showPlayProgress(on) {
    var el = document.getElementById("play-progress");
    if (!el) return;
    if (on) {
      var ms = window.GeoI18N.months(lang);
      el.querySelector(".pp-months").innerHTML = ms.map(function (m) {
        return "<span>" + escapeHtml(String(m).slice(0, 3)) + "</span>";
      }).join("");
    }
    el.style.display = on ? "block" : "none";
  }
  function updatePlayProgress(week) {
    var el = document.getElementById("play-progress");
    if (!el || el.style.display === "none") return;
    var pct = (week / 48) * 100;
    el.querySelector(".pp-fill").style.width = pct + "%";
    el.querySelector(".pp-marker").style.left = pct + "%";
  }

  function stopAnimation() {
    animating = false;
    animateAll = false;
    if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    setPlayBtn(false);
    // Keep the (now paused) bar visible for scrubbing when a full 48-week
    // animation is cached; otherwise hide it.
    if (!animReady) showPlayProgress(false);
  }

  // Discard a precomputed animation — called whenever a fresh single-week
  // render supersedes it (pan/zoom, species/mode/group change) — and hide the
  // progress bar.
  function invalidateAnimation() {
    if (animating) {
      animating = false;
      if (animTimer) { clearTimeout(animTimer); animTimer = null; }
      setPlayBtn(false);
    }
    animReady = false;
    showPlayProgress(false);
  }

  // Map a pointer x-coordinate on the progress bar to a week (1–48) and show
  // that week's cached frame, so the user can scrub to find a date.
  function scrubToWeek(clientX) {
    var el = document.getElementById("play-progress");
    if (!el) return;
    var r = el.getBoundingClientRect();
    var frac = (clientX - r.left) / r.width;
    frac = Math.max(0, Math.min(0.999999, frac));
    var week = Math.floor(frac * 48) + 1;
    updatePlayProgress(week);
    var wsel = document.getElementById("week-select");
    if (+wsel.value === week) return;
    wsel.value = week;
    window.GeoState.save({ week: week });
    if (currentMode === "range" || currentMode === "richness") showCachedWeek();
    rerenderPointList();
    updateLegend();
  }

  async function toggleAnimation() {
    if (animating) { stopAnimation(); return; }
    if (currentMode === "range" && !document.getElementById("species-search").dataset.selectedKey) {
      setStatus(t("status.selectSpecies"));
      return;
    }
    animating = true;
    setPlayBtn(true);
    showPlayProgress(true);

    // Precompute every week for the current viewport.
    animateAll = true;
    if (currentMode === "richness") await renderRichness();
    else await renderRangeMap();
    animateAll = false;
    if (!animating) return;
    animReady = true;   // full 48-week set cached → bar stays scrubbable after playback

    // Step through cached weeks.
    var wsel = document.getElementById("week-select");
    var w = +wsel.value || 1;
    (function step() {
      if (!animating) return;
      wsel.value = w;
      showCachedWeek();
      updatePlayProgress(w);
      w = (w % 48) + 1;
      animTimer = setTimeout(step, ANIM_INTERVAL);
    })();
  }

  function closeDropdowns() {
    ["hidden-panel", "checklists-panel", "settings-panel"].forEach(function (idp) {
      var p = document.getElementById(idp);
      if (p) p.style.display = "none";
    });
  }

  // ---- Checklists ----------------------------------------------------------
  // Reverse-geocode to a place name for the header (falls back to coordinates).
  async function reverseGeocode(lat, lon) {
    try {
      var r = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=" + lat + "&lon=" + lon, { headers: { Accept: "application/json" } });
      if (r.ok) { var j = await r.json(); return j.display_name || j.name || null; }
    } catch (e) { /* offline / blocked — use coordinates */ }
    return null;
  }

  // Build display items for the stored checklists. Names get a date suffix
  // when several lists share the same base name (place/title) — e.g. one per day.
  function buildChecklistItems(fcs) {
    var items = [];
    Object.keys(fcs).forEach(function (id) {
      var r = getFieldRecord(id); if (!r) return;
      if (!((r.log && r.log.length) || (r.title || "").trim())) return;
      var base = (r.title || "").trim() || fieldNameCache[String(id).split("@")[0]] || (r.lat.toFixed(3) + "°, " + r.lon.toFixed(3) + "°");
      items.push({ pkey: id, base: base, day: dayOf(r), lat: r.lat, lon: r.lon });
    });
    var counts = {};
    items.forEach(function (it) { counts[it.base] = (counts[it.base] || 0) + 1; });
    items.forEach(function (it) { it.name = counts[it.base] > 1 ? it.base + " · " + it.day : it.base; });
    return items;
  }

  // When a checklist was last opened — explicit stamp, else newest log entry,
  // else creation time. Used to flag the most/recently accessed lists.
  function accessTime(r) {
    if (!r) return 0;
    if (r.accessedAt) return r.accessedAt;
    var ts = (r.log && r.log.length) ? (r.log[r.log.length - 1].ts || 0) : 0;
    if (!ts && r.createdAt) ts = Date.parse(r.createdAt) || 0;
    return ts;
  }

  // Dropdown listing the saved Checklists, most recently accessed first.
  function refreshChecklists() {
    var wrap = document.getElementById("checklists-wrap");
    var btnText = document.getElementById("checklists-btn-text");
    var panel = document.getElementById("checklists-panel");
    if (!wrap || !btnText || !panel) return;

    var fcs = getFieldChecklists();
    var items = buildChecklistItems(fcs);

    // Sort by last-access time (most recent first); distance to the current
    // map centre breaks ties.
    var c0 = map ? map.getCenter() : null;
    items.forEach(function (it) {
      it.acc = accessTime(getFieldRecord(it.pkey));
      it.dist = (c0 && it.lat != null && it.lon != null) ? haversineKm(c0.lat, c0.lng, it.lat, it.lon) : Infinity;
    });
    items.sort(function (a, b) { return (b.acc - a.acc) || (a.dist - b.dist); });

    wrap.style.display = items.length ? "" : "none";
    if (!items.length) panel.style.display = "none";
    btnText.textContent = items.length;   // small count badge on the list icon
    document.getElementById("checklists-toggle").title = t("ctrl.checklists") + " (" + items.length + ")";

    panel.innerHTML = items.map(function (it) {
      var n = escapeHtml(it.name);
      // Proximity dot: green < 500 m, orange ≤ 2 km, red beyond.
      var dot = "";
      if (isFinite(it.dist)) {
        var cls = it.dist < 0.5 ? "dd-dot-near" : (it.dist <= 2 ? "dd-dot-mid" : "dd-dot-far");
        var dtxt = it.dist < 1 ? Math.round(it.dist * 1000) + " m" : it.dist.toFixed(1) + " km";
        dot = '<span class="dd-dot ' + cls + '" title="' + dtxt + '"></span>';
      }
      return '<div class="dd-row"><button type="button" class="dd-name dd-open-field" data-pkey="' + escapeHtml(it.pkey) + '" title="' + n + '">' + dot + n + "</button>" +
        '<button type="button" class="dd-csv dd-csv-field" data-pkey="' + escapeHtml(it.pkey) + '" title="' + escapeHtml(t("btn.csv")) + '">⬇</button>' +
        '<button type="button" class="dd-del dd-del-field" data-pkey="' + escapeHtml(it.pkey) + '" title="' + escapeHtml(t("btn.delete")) + '">×</button></div>';
    }).join("");

    panel.querySelectorAll(".dd-open-field").forEach(function (b) {
      b.addEventListener("click", function () { closeDropdowns(); openFieldFromList(this.getAttribute("data-pkey")); });
    });
    panel.querySelectorAll(".dd-csv-field").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var pkey = this.getAttribute("data-pkey"), r = getFieldRecord(pkey);
        if (r) downloadCsv("checklist_" + String(r.title || pkey).replace(/[^\w-]+/g, "_") + ".csv", fieldRecordCsv(pkey));
      });
    });
    panel.querySelectorAll(".dd-del-field").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var pkey = this.getAttribute("data-pkey");
        var all = getFieldChecklists(); delete all[pkey]; saveFieldChecklists(all);
        if (fieldKey === pkey) { fieldKey = null; stopFieldGeoWatch(); document.getElementById("field-page").style.display = "none"; }
        refreshChecklists();
      });
    });
  }

  // Re-open a field checklist from the list: re-run inference at its point so
  // its species rows are rebuilt, pinned to that exact (possibly past-day) list.
  function openFieldFromList(id) {
    var r = getFieldRecord(id);
    if (!r) return;
    renderFieldChecklist(r.lat, r.lon, id);   // full-screen overlay; no mode switch
  }

  function csvEsc(v) { var s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  // Aggregated CSV for a stored field checklist (works for any record).
  function fieldRecordCsv(id) {
    var r = getFieldRecord(id); if (!r) return "";
    var title = (r.title || "").trim() || (r.lat.toFixed(4) + "°, " + r.lon.toFixed(4) + "°");
    var lid = r.id || id || "";
    var agg = fcAggregate(r), lines = ["# " + title + " | " + dayOf(r)];
    lines.push("checklist,list_id,species,common_name,count,activity,notes");
    Object.keys(agg).forEach(function (key) {
      var a = agg[key], name = (labelsByKey[key] && speciesName(labelsByKey[key])) || key;
      lines.push([csvEsc(title), csvEsc(lid), key, csvEsc(name), a.count > 0 ? a.count : "", a.act ? actName(a.act) : "", csvEsc(a.note || "")].join(","));
    });
    return lines.join("\n");
  }
  // Raw observation-log CSV: one row per logged sighting (time + coordinates).
  function fieldLogCsv(id) {
    var r = id ? getFieldRecord(id) : curFieldRecord(false); if (!r) return "";
    var title = (r.title || "").trim() || (r.lat.toFixed(4) + "°, " + r.lon.toFixed(4) + "°");
    var lid = r.id || id || "";
    var lines = ["# " + title + " | " + dayOf(r) + " | observation log"];
    lines.push("checklist,list_id,timestamp,lat,lon,species,common_name,count,activity,notes");
    (r.log || []).slice().sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); }).forEach(function (e) {
      var name = (labelsByKey[e.key] && speciesName(labelsByKey[e.key])) || e.key;
      lines.push([csvEsc(title), csvEsc(lid), new Date(e.ts).toISOString(), e.lat != null ? e.lat.toFixed(5) : "", e.lon != null ? e.lon.toFixed(5) : "",
        e.key, csvEsc(name), csvEsc(e.count != null ? e.count : ""), csvEsc(actLabel(e.act)), csvEsc(e.note || "")].join(","));
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
    updateSettingsIcon();

    // Always start at normal resolution (factor 1) on load.
    hiResFactor = 1;
    document.getElementById("hires-factor").value = "1";

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
