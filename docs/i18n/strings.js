/**
 * i18n for the Species Distribution & Migration Explorer.
 *
 * Two things are localized:
 *   1. UI strings  – via STRINGS[lang]; English ("en") is the complete
 *      reference, Swedish ("sv") is fully translated, other languages fall
 *      back to English for UI text.
 *   2. Species names – via LANGS[].taxCol, which names the column in
 *      taxonomy.csv holding the common name for that language. Species-name
 *      coverage is full for every language present in taxonomy.csv.
 *
 * Exposed as window.GeoI18N (no module system; loaded via <script>).
 */
window.GeoI18N = (function () {
  "use strict";

  // Offered languages. `code` is used for both UI strings and the localStorage
  // value; `taxCol` is the taxonomy.csv column for that language's common name.
  var LANGS = [
    { code: "en",    name: "English",     taxCol: "com_name" },
    { code: "sv",    name: "Svenska",     taxCol: "common_name_sv" },
    { code: "de",    name: "Deutsch",     taxCol: "common_name_de" },
    { code: "es",    name: "Español",     taxCol: "common_name_es" },
    { code: "fr",    name: "Français",    taxCol: "common_name_fr" },
    { code: "nl",    name: "Nederlands",  taxCol: "common_name_nl" },
    { code: "pt",    name: "Português",   taxCol: "common_name_pt" },
    { code: "pl",    name: "Polski",      taxCol: "common_name_pl" },
    { code: "cs",    name: "Čeština",     taxCol: "common_name_cs" },
    { code: "sk",    name: "Slovenčina",  taxCol: "common_name_sk" },
    { code: "hr",    name: "Hrvatski",    taxCol: "common_name_hr" },
    { code: "sr",    name: "Српски",      taxCol: "common_name_sr" },
    { code: "bg",    name: "Български",   taxCol: "common_name_bg" },
    { code: "uk",    name: "Українська",  taxCol: "common_name_uk" },
    { code: "ru",    name: "Русский",     taxCol: "common_name_ru" },
    { code: "no",    name: "Norsk",       taxCol: "common_name_no" },
    { code: "da",    name: "Dansk",       taxCol: "common_name_da" },
    { code: "fi",    name: "Suomi",       taxCol: "common_name_fi" },
    { code: "et",    name: "Eesti",       taxCol: "common_name_et" },
    { code: "lt",    name: "Lietuvių",    taxCol: "common_name_lt" },
    { code: "ca",    name: "Català",      taxCol: "common_name_ca" },
    { code: "tr",    name: "Türkçe",      taxCol: "common_name_tr" },
    { code: "cy",    name: "Cymraeg",     taxCol: "common_name_cy" },
    { code: "fa",    name: "فارسی",       taxCol: "common_name_fa" },
    { code: "ja",    name: "日本語",       taxCol: "common_name_ja" },
    { code: "zh-CN", name: "中文 (简体)",  taxCol: "common_name_zh-CN" },
  ];

  // Month abbreviations and intra-month period words, per language.
  // Falls back to English when a language is not listed here.
  var MONTHS = {
    en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    sv: ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"],
  };
  var PERIODS = {
    en: ["early", "mid", "late", "late"],
    sv: ["början av", "mitten av", "slutet av", "slutet av"],
  };

  // {key} placeholders are filled by GeoI18N.t(key, vars).
  var STRINGS = {
    en: {
      "app.title": "Species Distribution & Migration Explorer",
      "app.loading": "Loading model, labels & species names…",
      "app.failed": "Failed to load: {msg}",
      "ctrl.language": "Language",
      "ctrl.mode": "Mode",
      "mode.range": "Species Range",
      "mode.richness": "Species Richness",
      "mode.list": "Species List (click map)",
      "mode.barchart": "Migration Timeline (click map)",
      "ctrl.species": "Species",
      "ph.species": "Search species…",
      "ctrl.week": "Week",
      "ctrl.threshold": "Min probability",
      "ctrl.bcthreshold": "Min avg probability",
      "ctrl.compare": "Compare to",
      "compare.none": "— none —",
      "compare.prev": "Previous week",
      "compare.next": "Next week",
      "compare.mean": "Annual mean",
      "compare.max": "Annual max",
      "ctrl.savedloc": "Saved locations",
      "ph.savedloc": "— go to saved location —",
      "btn.saveloc": "★ Save",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Play migration",
      "btn.pause": "⏸ Pause",
      "panel.spTitle": "Species at location",
      "panel.bcTitle": "Location analysis",
      "tab.timeline": "Timeline",
      "tab.prob": "Probability",
      "tab.arrival": "Arrivals",
      "tab.scatter": "Scatter",
      "analysis.empty": "No species above the threshold.",
      "ctrl.filter": "Filter species",
      "ph.filter": "Filter species…",
      "ctrl.topN": "Top N",
      "ctrl.basemap": "Base map",
      "basemap.dark": "Dark",
      "basemap.light": "Light",
      "scatter.xAxis": "Arrival (current week)",
      "scatter.yAxis": "Probability (current week)",
      "th.rank": "#",
      "th.species": "Species",
      "th.sci": "Scientific name",
      "th.prob": "Probability",
      "th.arrival": "Arrival",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% of {ref}",
      "legend.prob": "Occurrence probability",
      "legend.count": "Predicted species count",
      "status.selectSpecies": "Select a species to view its predicted range map.",
      "status.loadingModel": "Loading ONNX model…",
      "status.computing": "Computing {name} – {week} · {n} new cells [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} cells ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} cells ({step}°) [cached]",
      "status.richnessDone": "Species richness – {week} · {n} cells ({step}°)",
      "status.richnessCached": "Species richness – {week} · {n} cells ({step}°) [cached]",
      "status.predicting": "Predicting species at ({lat}, {lon}) week {week}…",
      "status.predicting48": "Predicting 48 weeks at ({lat}, {lon})…",
      "status.spResult": "{n} species above {p}% at ({lat}, {lon})",
      "status.error": "Error: {msg}",
      "sp.summary": "{lat}°, {lon}° · Week {week} · {n} species above {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} species above {p}% avg · normalized to {max}%",
      "bc.avg": "{p}% avg",
      "week.fmt": "Week {w} ({period} {month})",
      "loc.savePrompt": "Name this location:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (weights CC BY-SA 4.0). App code MIT. Predictions are estimates — not ground truth.",
    },
    sv: {
      "app.title": "Utforskare för artutbredning & migration",
      "app.loading": "Laddar modell, etiketter & artnamn…",
      "app.failed": "Kunde inte ladda: {msg}",
      "ctrl.language": "Språk",
      "ctrl.mode": "Läge",
      "mode.range": "Artutbredning",
      "mode.richness": "Artrikedom",
      "mode.list": "Artlista (klicka på kartan)",
      "mode.barchart": "Migrationstidslinje (klicka på kartan)",
      "ctrl.species": "Art",
      "ph.species": "Sök art…",
      "ctrl.week": "Vecka",
      "ctrl.threshold": "Min sannolikhet",
      "ctrl.bcthreshold": "Min medelsannolikhet",
      "ctrl.compare": "Jämför med",
      "compare.none": "— ingen —",
      "compare.prev": "Föregående vecka",
      "compare.next": "Nästa vecka",
      "compare.mean": "Årsmedel",
      "compare.max": "Årsmax",
      "ctrl.savedloc": "Sparade platser",
      "ph.savedloc": "— gå till sparad plats —",
      "btn.saveloc": "★ Spara",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Spela migration",
      "btn.pause": "⏸ Pausa",
      "panel.spTitle": "Arter på platsen",
      "panel.bcTitle": "Platsanalys",
      "tab.timeline": "Tidslinje",
      "tab.prob": "Sannolikhet",
      "tab.arrival": "Ankomster",
      "tab.scatter": "Spridning",
      "analysis.empty": "Inga arter över tröskeln.",
      "ctrl.filter": "Filtrera arter",
      "ph.filter": "Filtrera arter…",
      "ctrl.topN": "Topp N",
      "ctrl.basemap": "Bakgrundskarta",
      "basemap.dark": "Mörk",
      "basemap.light": "Ljus",
      "scatter.xAxis": "Ankomst (aktuell vecka)",
      "scatter.yAxis": "Sannolikhet (aktuell vecka)",
      "th.rank": "#",
      "th.species": "Art",
      "th.sci": "Vetenskapligt namn",
      "th.prob": "Sannolikhet",
      "th.arrival": "Ankomst",
      "th.delta": "Δ mot {ref}",
      "th.ratio": "% av {ref}",
      "legend.prob": "Förekomstsannolikhet",
      "legend.count": "Förutsagt antal arter",
      "status.selectSpecies": "Välj en art för att se dess förutsagda utbredning.",
      "status.loadingModel": "Laddar ONNX-modell…",
      "status.computing": "Beräknar {name} – {week} · {n} nya celler [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} celler ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} celler ({step}°) [cachad]",
      "status.richnessDone": "Artrikedom – {week} · {n} celler ({step}°)",
      "status.richnessCached": "Artrikedom – {week} · {n} celler ({step}°) [cachad]",
      "status.predicting": "Förutsäger arter vid ({lat}, {lon}) vecka {week}…",
      "status.predicting48": "Förutsäger 48 veckor vid ({lat}, {lon})…",
      "status.spResult": "{n} arter över {p}% vid ({lat}, {lon})",
      "status.error": "Fel: {msg}",
      "sp.summary": "{lat}°, {lon}° · Vecka {week} · {n} arter över {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} arter över {p}% medel · normaliserat till {max}%",
      "bc.avg": "{p}% medel",
      "week.fmt": "Vecka {w} ({period} {month})",
      "loc.savePrompt": "Namnge platsen:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modell: BirdNET Geomodel (vikter CC BY-SA 4.0). Appkod MIT. Förutsägelser är uppskattningar — inte sanning.",
    },
  };

  function months(lang) { return MONTHS[lang] || MONTHS.en; }
  function periods(lang) { return PERIODS[lang] || PERIODS.en; }

  function fill(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (_, k) {
      return (vars[k] !== undefined && vars[k] !== null) ? vars[k] : "";
    });
  }

  // t(lang, key, vars): localized string with English fallback.
  function t(lang, key, vars) {
    var table = STRINGS[lang] || STRINGS.en;
    var s = table[key];
    if (s === undefined) s = STRINGS.en[key];
    if (s === undefined) return key;
    return fill(s, vars);
  }

  function langByCode(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return LANGS[0];
  }

  return {
    LANGS: LANGS,
    t: t,
    langByCode: langByCode,
    months: months,
    periods: periods,
  };
})();
