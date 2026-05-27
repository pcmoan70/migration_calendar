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
    { code: "en", full: true,    name: "English",     taxCol: "com_name" },
    { code: "sv", full: true,    name: "Svenska",     taxCol: "common_name_sv" },
    { code: "de", full: true,    name: "Deutsch",     taxCol: "common_name_de" },
    { code: "es", full: true,    name: "Español",     taxCol: "common_name_es" },
    { code: "fr", full: true,    name: "Français",    taxCol: "common_name_fr" },
    { code: "nl", full: true,    name: "Nederlands",  taxCol: "common_name_nl" },
    { code: "it", full: true,    name: "Italiano",    taxCol: "common_name_it" },
    { code: "pt", full: true,    name: "Português",   taxCol: "common_name_pt" },
    { code: "pl", full: true,    name: "Polski",      taxCol: "common_name_pl" },
    { code: "cs", full: true,    name: "Čeština",     taxCol: "common_name_cs" },
    { code: "sk",    name: "Slovenčina",  taxCol: "common_name_sk" },
    { code: "hr",    name: "Hrvatski",    taxCol: "common_name_hr" },
    { code: "sr",    name: "Српски",      taxCol: "common_name_sr" },
    { code: "bg",    name: "Български",   taxCol: "common_name_bg" },
    { code: "uk",    name: "Українська",  taxCol: "common_name_uk" },
    { code: "ru",    name: "Русский",     taxCol: "common_name_ru" },
    { code: "no", full: true,    name: "Norsk",       taxCol: "common_name_no" },
    { code: "da", full: true,    name: "Dansk",       taxCol: "common_name_da" },
    { code: "fi", full: true,    name: "Suomi",       taxCol: "common_name_fi" },
    { code: "et", full: true,    name: "Eesti",       taxCol: "common_name_et" },
    { code: "lt", full: true,    name: "Lietuvių",    taxCol: "common_name_lt" },
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
    de: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],
    es: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
    fr: ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."],
    nl: ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"],
    no: ["jan.","feb.","mars","apr.","mai","juni","juli","aug.","sep.","okt.","nov.","des."],
    it: ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"],
    pl: ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"],
    cs: ["led","úno","bře","dub","kvě","čer","čvc","srp","zář","říj","lis","pro"],
    et: ["jaan","veebr","märts","apr","mai","juuni","juuli","aug","sept","okt","nov","dets"],
    lt: ["saus.","vas.","kov.","bal.","geg.","birž.","liep.","rugp.","rugs.","spal.","lapkr.","gruod."],
    fi: ["tammi","helmi","maalis","huhti","touko","kesä","heinä","elo","syys","loka","marras","joulu"],
    da: ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"],
    pt: ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"],
  };
  var PERIODS = {
    en: ["early", "mid", "late", "late"],
    sv: ["början av", "mitten av", "slutet av", "slutet av"],
    de: ["Anfang", "Mitte", "Ende", "Ende"],
    es: ["principios de", "mediados de", "finales de", "finales de"],
    fr: ["début", "mi-", "fin", "fin"],
    nl: ["begin", "half", "eind", "eind"],
    no: ["begynnelsen av", "midten av", "slutten av", "slutten av"],
    it: ["inizio", "metà", "fine", "fine"],
    pl: ["początek", "połowa", "koniec", "koniec"],
    cs: ["začátkem", "v polovině", "koncem", "koncem"],
    et: ["alguses", "keskel", "lõpus", "lõpus"],
    lt: ["pradžia", "vidurys", "pabaiga", "pabaiga"],
    fi: ["alku", "keski", "loppu", "loppu"],
    da: ["først i", "midt i", "sidst i", "sidst i"],
    pt: ["início de", "meados de", "fim de", "fim de"],
  };

  // {key} placeholders are filled by GeoI18N.t(key, vars).
  var STRINGS = {
    en: {
      "app.title": "Species & Checklists",
      "app.loading": "Loading model, labels & species names…",
      "app.failed": "Failed to load: {msg}",
      "ctrl.language": "Language",
      "ctrl.settings": "Settings",
      "ctrl.about": "About & how it works",
      "ctrl.mode": "Mode",
      "ctrl.group": "Species group",
      "group.all": "All groups",
      "group.aves": "Birds",
      "group.mammalia": "Mammals",
      "group.amphibia": "Amphibians",
      "group.insecta": "Insects",
      "mode.range": "Species Range",
      "mode.richness": "Species Richness",
      "mode.list": "📍 Species List",
      "mode.field": "📍 Field checklist",
      "btn.clear": "Clear",
      "act.heard": "Heard",
      "act.flying": "Flying",
      "act.feeding": "Feeding",
      "act.resting": "Resting",
      "act.breeding": "Breeding",
      "mode.barchart": "📍 Migration",
      "ctrl.species": "Species",
      "ph.species": "Search species…",
      "ctrl.week": "Week",
      "ctrl.bcthreshold": "Probability range",
      "ctrl.compare": "Compare to",
      "compare.none": "— none —",
      "compare.prev": "Previous week",
      "compare.next": "Next week",
      "compare.mean": "Annual mean",
      "compare.max": "Annual max",
      "compare.annualtop": "Annual Top",
      "ctrl.secondlang": "2nd name",
      "ctrl.savedloc": "Saved locations",
      "ph.savedloc": "No saved locations yet",
      "loc.delete": "Delete location",
      "ctrl.hidden": "Hidden species",
      "loc.unhide": "Show again",
      "menu.filter": "Filter",
      "menu.hide": "Do not show",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Recent detections",
      "recent.none": "No recent detections found nearby.",
      "recent.viewall": "View all on iNaturalist",
      "menu.distmap": "Distribution map",
      "distmap.none": "No distribution map found. Open the Wikipedia page:",
      "distmap.download": "Open full image",
      "btn.saveloc": "★ Save",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Play migration",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "⭳ Save",
      "btn.checklist": "✓ Checklist",
      "btn.print": "🖨 Print",
      "btn.close": "Close",
      "btn.delete": "Delete",
      "ctrl.checklists": "Checklist",
      "chk.namePrompt": "Name this checklist:",
      "chk.createNew": "Create new",
      "chk.all": "All",
      "chk.seen": "Seen",
      "chk.missing": "Missing",
      "chk.count": "Count",
      "chk.activity": "Activity",
      "fc.add": "Add observation",
      "btn.logcsv": "⬇ Log",
      "chk.merged": "Lists merged.",
      "chk.note": "NB: The probabilities and other values in this checklist are derived from an AI model and represent only an approximation of the species likely to occur at this location — they are not confirmed observations. For an authoritative species reference, see <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Building checklist…",
      "th.change": "Change (Δ)",
      "th.locality": "Locality",
      "th.notes": "Notes",
      "panel.spTitle": "Species at location",
      "panel.bcTitle": "Location analysis",
      "tab.timeline": "Timeline",
      "tab.prob": "Probability",
      "tab.arrival": "Arrivals",
      "tab.focus": "Annual Top",
      "tab.scatter": "Scatter",
      "analysis.empty": "No species above the threshold.",
      "ctrl.filter": "Filter species",
      "place.nearby": "Nearby places",
      "place.none": "No named places nearby.",
      "ph.fieldtitle": "Location name",
      "ph.filter": "Filter species…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Rank by",
      "rank.arrival": "Arrivals",
      "rank.prob": "Probability",
      "rank.both": "Both",
      "ctrl.locate": "Go to my location",
      "status.locateError": "Could not get your location.",
      "status.offline": "Offline — using cached data",
      "ctrl.basemap": "Base map",
      "ctrl.hires": "Resolution",
      "popup.title": "Species distributions and checklists",
      "popup.perf": "Species Range, Species Richness and ▶ Play migration evaluate the model across many map cells, so a modern computer with a fast CPU is recommended for smooth performance.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback and comments are welcome at:",
      "basemap.dark": "Dark",
      "basemap.light": "Light",
      "basemap.streets": "Streets",
      "basemap.topo": "Topographic",
      "basemap.satellite": "Satellite",
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
      "bc.max": "{p}% max",
      "week.fmt": "Week {w} ({period} {month})",
      "loc.savePrompt": "Name this location:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (weights CC BY-SA 4.0). App code MIT. Predictions are estimates — not ground truth.",
      "footer.lastchange": "Last change: {t}",
      "about.title": "ℹ︎ About the model & how values are computed",
      "about.html":
        "<h4>The habitat model</h4>" +
        "<p>This tool runs the <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — a spatiotemporal neural network — entirely in your browser via ONNX Runtime Web. From a <b>latitude</b>, <b>longitude</b> and <b>week of year</b> (1–48; the model splits the year into 48 weeks of about 7.6 days), it predicts an <b>occurrence probability</b> (0–100%) for each of 12,012 species across birds, mammals, amphibians and insects. The probability reflects how likely a species is to be present there at that time of year, learned from global occurrence records and environmental variables. It is a modelled estimate — not an observation count or a guarantee.</p>" +
        "<h4>Map views</h4>" +
        "<ul>" +
        "<li><b>Species Range</b> — the probability of one chosen species across the map for the selected week.</li>" +
        "<li><b>Species Richness</b> — the number of species whose probability is at least 5% in each grid cell, limited to the selected species group. ▶ Play migration animates the map week by week.</li>" +
        "</ul>" +
        "<p>The map is evaluated on a grid of cells (3° wide when zoomed out, down to 0.25° when zoomed in) and drawn with bilinear smoothing, so colours blend between cell centres instead of forming hard blocks. <b>Note:</b> Species Range, Species Richness and ▶ Play migration evaluate the model across many map cells, so a modern computer with a fast CPU is recommended for smooth performance.</p>" +
        "<h4>Location analysis (click the map)</h4>" +
        "<ul>" +
        "<li><b>Timeline</b> — each species' probability across all 48 weeks.</li>" +
        "<li><b>Probability</b> — a species × week heatmap (red = low, green = high), stretched across the values currently on screen.</li>" +
        "<li><b>Arrivals</b> — for each species and week, an arrival score <code>(P[next week] − P[previous week]) ÷ max</code>, where <code>max</code> is that species' highest weekly probability over the year. Green = probability rising (arriving), red = falling (departing); weeks wrap around the year boundary (1 ↔ 48).</li>" +
        "<li><b>Annual Top</b> — the running (cumulative) total of the weekly arrival scores, rescaled to 0–100 (the year's low = 0, its peak = 100). It highlights the part of the year when the species is most present.</li>" +
        "<li><b>Scatter</b> — the current week's arrival score (x-axis) versus probability (y-axis) for the top species, with a sortable table below.</li>" +
        "</ul>" +
        "<h4>Species List — “Compare to” column</h4>" +
        "<ul>" +
        "<li><b>Previous / Next week</b> and <b>Annual mean</b> show the change Δ = current probability − the comparison value.</li>" +
        "<li><b>Annual max</b> shows the current week as a fraction of the species' yearly peak: <code>current ÷ max over the year</code>. 100% means the selected week is that species' best week.</li>" +
        "</ul>" +
        "<h4>Technology</h4>" +
        "<p>The AI model runs <b>entirely in your web browser</b> — there is no server and your location is never sent anywhere. The neural network is downloaded once (~7 MB) and all predictions are computed on your own device. Built with:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — runs the neural network in the browser.</li>" +
        "<li><b>Web Workers</b> — inference runs off the main thread so the interface stays responsive.</li>" +
        "<li><b>BirdNET Geomodel</b> — the trained model, exported to ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> with OpenStreetMap / CARTO tiles — the interactive map.</li>" +
        "<li><b>Plain HTML, CSS and JavaScript</b> — no framework and no build step; served as a static site (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Project &amp; feedback</h4>" +
        "<p>This tool is free to use, and feedback is welcome at <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. A Norway-specific habitat model is under development, aiming to use richer Norwegian data than the Google Earth Engine data used in the current model. The goal of the habitat model is an improved birdsong detection app (A!Birder) (under development). This page is made for easy quality control of that model.</p>" +
        "<p class=\"about-note\">Predictions are model estimates, not ground truth. Model weights © the BirdNET team, licensed CC BY-SA 4.0; map tiles © OpenStreetMap contributors, © CARTO.</p>",
    },
    sv: {
      "app.title": "Arter & Checklistor",
      "app.loading": "Laddar modell, etiketter & artnamn…",
      "app.failed": "Kunde inte ladda: {msg}",
      "ctrl.language": "Språk",
      "ctrl.settings": "Inställningar",
      "ctrl.about": "Om & hur det fungerar",
      "ctrl.mode": "Läge",
      "ctrl.group": "Artgrupp",
      "group.all": "Alla grupper",
      "group.aves": "Fåglar",
      "group.mammalia": "Däggdjur",
      "group.amphibia": "Groddjur",
      "group.insecta": "Insekter",
      "mode.range": "Artutbredning",
      "mode.richness": "Artrikedom",
      "mode.list": "📍 Artlista",
      "mode.field": "📍 Fältchecklista",
      "btn.clear": "Rensa",
      "act.heard": "Hörd",
      "act.flying": "Flygande",
      "act.feeding": "Födosök",
      "act.resting": "Vilande",
      "act.breeding": "Häckning",
      "mode.barchart": "📍 Migration",
      "ctrl.species": "Art",
      "ph.species": "Sök art…",
      "ctrl.week": "Vecka",
      "ctrl.bcthreshold": "Sannolikhetsintervall",
      "ctrl.compare": "Jämför med",
      "compare.none": "— ingen —",
      "compare.prev": "Föregående vecka",
      "compare.next": "Nästa vecka",
      "compare.mean": "Årsmedel",
      "compare.max": "Årsmax",
      "compare.annualtop": "Årstopp",
      "ctrl.secondlang": "Andra namn",
      "ctrl.savedloc": "Sparade platser",
      "ph.savedloc": "Inga sparade platser än",
      "loc.delete": "Ta bort plats",
      "ctrl.hidden": "Dolda arter",
      "loc.unhide": "Visa igen",
      "menu.filter": "Filtrera",
      "menu.hide": "Dölj",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (ljud)",
      "menu.recent": "Senaste observationer",
      "recent.none": "Inga nyliga observationer i närheten.",
      "recent.viewall": "Visa alla på iNaturalist",
      "menu.distmap": "Utbredningskarta",
      "distmap.none": "Ingen utbredningskarta hittades. Öppna Wikipedia-sidan:",
      "distmap.download": "Öppna full bild",
      "btn.saveloc": "★ Spara",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Spela migration",
      "btn.pause": "⏸ Pausa",
      "btn.newchecklist": "⭳ Spara",
      "btn.checklist": "✓ Checklista",
      "btn.print": "🖨 Skriv ut",
      "btn.close": "Stäng",
      "btn.delete": "Ta bort",
      "ctrl.checklists": "Checklista",
      "chk.namePrompt": "Namnge checklistan:",
      "chk.createNew": "Skapa ny",
      "chk.all": "Alla",
      "chk.seen": "Sedda",
      "chk.missing": "Saknas",
      "chk.count": "Antal",
      "chk.activity": "Aktivitet",
      "fc.add": "Lägg till observation",
      "btn.logcsv": "⬇ Logg",
      "chk.merged": "Listor sammanslagna.",
      "chk.note": "OBS: Sannolikheterna och övriga värden i denna checklista är härledda från en AI-modell och är endast en uppskattning av de arter som kan förekomma på platsen — de är inte bekräftade observationer. För en auktoritativ artreferens, se <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Bygger checklista…",
      "th.change": "Förändring (Δ)",
      "th.locality": "Lokal",
      "th.notes": "Anteckningar",
      "panel.spTitle": "Arter på platsen",
      "panel.bcTitle": "Platsanalys",
      "tab.timeline": "Tidslinje",
      "tab.prob": "Sannolikhet",
      "tab.arrival": "Ankomster",
      "tab.focus": "Årstopp",
      "tab.scatter": "Spridning",
      "analysis.empty": "Inga arter över tröskeln.",
      "ctrl.filter": "Filtrera arter",
      "place.nearby": "Platser i närheten",
      "place.none": "Inga namngivna platser i närheten.",
      "ph.fieldtitle": "Platsnamn",
      "ph.filter": "Filtrera arter…",
      "ctrl.topN": "Topp N",
      "ctrl.rankby": "Rangordna efter",
      "rank.arrival": "Ankomster",
      "rank.prob": "Sannolikhet",
      "rank.both": "Båda",
      "ctrl.locate": "Gå till min plats",
      "status.locateError": "Kunde inte hämta din plats.",
      "status.offline": "Offline – använder cachelagrad data",
      "ctrl.basemap": "Bakgrundskarta",
      "ctrl.hires": "Upplösning",
      "popup.title": "Artutbredningar och checklistor",
      "popup.perf": "Artutbredning, Artrikedom och ▶ Spela migration kör modellen över många kartceller, så en modern dator med en snabb processor (CPU) rekommenderas för smidig prestanda.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback och kommentarer mottas gärna på:",
      "basemap.dark": "Mörk",
      "basemap.light": "Ljus",
      "basemap.streets": "Gator",
      "basemap.topo": "Topografisk",
      "basemap.satellite": "Satellit",
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
      "bc.max": "{p}% max",
      "week.fmt": "Vecka {w} ({period} {month})",
      "loc.savePrompt": "Namnge platsen:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modell: BirdNET Geomodel (vikter CC BY-SA 4.0). Appkod MIT. Förutsägelser är uppskattningar — inte sanning.",
      "footer.lastchange": "Senaste ändring: {t}",
      "about.title": "ℹ︎ Om modellen & hur värdena beräknas",
      "about.html":
        "<h4>Habitatmodellen</h4>" +
        "<p>Verktyget kör <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — ett spatiotemporalt neuralt nätverk — helt i din webbläsare via ONNX Runtime Web. Utifrån <b>latitud</b>, <b>longitud</b> och <b>vecka på året</b> (1–48; modellen delar året i 48 veckor om cirka 7,6 dagar) förutsägs en <b>förekomstsannolikhet</b> (0–100%) för var och en av 12 012 arter bland fåglar, däggdjur, groddjur och insekter. Sannolikheten speglar hur troligt det är att arten förekommer där vid den tiden på året, lärt från globala fynddata och miljövariabler. Det är en modellerad uppskattning — inte ett observationsantal eller en garanti.</p>" +
        "<h4>Kartvyer</h4>" +
        "<ul>" +
        "<li><b>Artutbredning</b> — sannolikheten för en vald art över kartan för vald vecka.</li>" +
        "<li><b>Artrikedom</b> — antalet arter vars sannolikhet är minst 5% i varje rutnätscell, begränsat till vald artgrupp. ▶ Spela migration animerar kartan vecka för vecka.</li>" +
        "</ul>" +
        "<p>Kartan beräknas på ett rutnät (3° brett utzoomat, ner till 0,25° inzoomat) och ritas med bilinjär utjämning, så att färger tonar mellan cellcentrum i stället för att bilda hårda block. <b>Obs:</b> Artutbredning, Artrikedom och ▶ Spela migration kör modellen över många kartceller, så en modern dator med en snabb processor (CPU) rekommenderas för smidig prestanda.</p>" +
        "<h4>Platsanalys (klicka på kartan)</h4>" +
        "<ul>" +
        "<li><b>Tidslinje</b> — varje arts sannolikhet över alla 48 veckor.</li>" +
        "<li><b>Sannolikhet</b> — en värmekarta art × vecka (rött = lågt, grönt = högt), skalad efter värdena på skärmen.</li>" +
        "<li><b>Ankomster</b> — för varje art och vecka en ankomstpoäng <code>(P[nästa vecka] − P[föregående vecka]) ÷ max</code>, där <code>max</code> är artens högsta veckosannolikhet under året. Grönt = stigande (ankommer), rött = fallande (lämnar); veckorna går runt årsgränsen (1 ↔ 48).</li>" +
        "<li><b>Årstopp</b> — den löpande (kumulativa) summan av veckornas ankomstpoäng, omskalad till 0–100 (årets lägsta = 0, toppen = 100). Lyfter fram den del av året då arten är som mest närvarande.</li>" +
        "<li><b>Spridning</b> — aktuell veckas ankomstpoäng (x) mot sannolikhet (y) för topparterna, med en sorterbar tabell under.</li>" +
        "</ul>" +
        "<h4>Artlista — kolumnen ”Jämför med”</h4>" +
        "<ul>" +
        "<li><b>Föregående / Nästa vecka</b> och <b>Årsmedel</b> visar förändringen Δ = aktuell sannolikhet − jämförelsevärdet.</li>" +
        "<li><b>Årsmax</b> visar aktuell vecka som en andel av artens årstopp: <code>aktuell ÷ max över året</code>. 100% betyder att vald vecka är artens bästa vecka.</li>" +
        "</ul>" +
        "<h4>Teknik</h4>" +
        "<p>AI-modellen körs <b>helt i din webbläsare</b> — det finns ingen server och din position skickas aldrig någonstans. Det neurala nätverket laddas ner en gång (~7 MB) och alla förutsägelser beräknas på din egen enhet. Byggt med:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — kör det neurala nätverket i webbläsaren.</li>" +
        "<li><b>Web Workers</b> — beräkningen körs utanför huvudtråden så att gränssnittet förblir responsivt.</li>" +
        "<li><b>BirdNET Geomodel</b> — den tränade modellen, exporterad till ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> med OpenStreetMap-/CARTO-rutor — den interaktiva kartan.</li>" +
        "<li><b>Ren HTML, CSS och JavaScript</b> — inget ramverk och inget byggsteg; serveras som en statisk sida (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; återkoppling</h4>" +
        "<p>Det här verktyget är gratis att använda, och återkoppling välkomnas till <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. En Norge-specifik habitatmodell är under utveckling och syftar till att använda rikare norska data än de Google Earth Engine-data som används i den nuvarande modellen. Målet med habitatmodellen är en förbättrad app för fågelsångsigenkänning (A!Birder) (under utveckling). Den här sidan är gjord för enkel kvalitetskontroll av den modellen.</p>" +
        "<p class=\"about-note\">Förutsägelser är modelluppskattningar, inte sanning. Modellvikter © BirdNET-teamet, licens CC BY-SA 4.0; kartrutor © OpenStreetMap-bidragsgivare, © CARTO.</p>",
    },
    de: {
      "app.title": "Arten & Checklisten",
      "app.loading": "Lade Modell, Bezeichnungen & Artnamen…",
      "app.failed": "Laden fehlgeschlagen: {msg}",
      "ctrl.language": "Sprache",
      "ctrl.settings": "Einstellungen",
      "ctrl.about": "Über & Funktionsweise",
      "ctrl.mode": "Modus",
      "ctrl.group": "Artengruppe",
      "group.all": "Alle Gruppen",
      "group.aves": "Vögel",
      "group.mammalia": "Säugetiere",
      "group.amphibia": "Amphibien",
      "group.insecta": "Insekten",
      "mode.range": "Artverbreitung",
      "mode.richness": "Artenreichtum",
      "mode.list": "📍 Artenliste",
      "mode.field": "📍 Feld-Checkliste",
      "btn.clear": "Leeren",
      "act.heard": "Gehört",
      "act.flying": "Fliegend",
      "act.feeding": "Nahrungssuche",
      "act.resting": "Rastend",
      "act.breeding": "Brütend",
      "mode.barchart": "📍 Zug",
      "ctrl.species": "Art",
      "ph.species": "Art suchen…",
      "ctrl.week": "Woche",
      "ctrl.bcthreshold": "Wahrscheinlichkeitsbereich",
      "ctrl.compare": "Vergleichen mit",
      "compare.none": "— keine —",
      "compare.prev": "Vorherige Woche",
      "compare.next": "Nächste Woche",
      "compare.mean": "Jahresmittel",
      "compare.max": "Jahresmaximum",
      "compare.annualtop": "Jahreshoch",
      "ctrl.secondlang": "Zweitname",
      "ctrl.savedloc": "Gespeicherte Orte",
      "ph.savedloc": "Noch keine gespeicherten Orte",
      "loc.delete": "Ort löschen",
      "ctrl.hidden": "Ausgeblendete Arten",
      "loc.unhide": "Wieder anzeigen",
      "menu.filter": "Filtern",
      "menu.hide": "Nicht anzeigen",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (Audio)",
      "menu.recent": "Aktuelle Beobachtungen",
      "recent.none": "Keine aktuellen Beobachtungen in der Nähe.",
      "recent.viewall": "Alle auf iNaturalist ansehen",
      "menu.distmap": "Verbreitungskarte",
      "distmap.none": "Keine Verbreitungskarte gefunden. Wikipedia-Seite öffnen:",
      "distmap.download": "Vollbild öffnen",
      "btn.saveloc": "★ Speichern",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Wanderung abspielen",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "⭳ Speichern",
      "btn.checklist": "✓ Checkliste",
      "btn.print": "🖨 Drucken",
      "btn.close": "Schließen",
      "btn.delete": "Löschen",
      "ctrl.checklists": "Checkliste",
      "chk.namePrompt": "Diese Checkliste benennen:",
      "chk.createNew": "Neu erstellen",
      "chk.all": "Alle",
      "chk.seen": "Gesehen",
      "chk.missing": "Fehlend",
      "chk.count": "Anzahl",
      "chk.activity": "Aktivität",
      "fc.add": "Beobachtung hinzufügen",
      "btn.logcsv": "⬇ Log",
      "chk.merged": "Listen zusammengeführt.",
      "chk.note": "Hinweis: Die Wahrscheinlichkeiten und sonstigen Werte in dieser Checkliste stammen aus einem KI-Modell und stellen nur eine Schätzung der an diesem Ort wahrscheinlich vorkommenden Arten dar — es handelt sich nicht um bestätigte Beobachtungen. Für eine maßgebliche Artenreferenz siehe <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Checkliste wird erstellt…",
      "th.change": "Änderung (Δ)",
      "th.locality": "Fundort",
      "th.notes": "Notizen",
      "panel.spTitle": "Arten am Standort",
      "panel.bcTitle": "Standortanalyse",
      "tab.timeline": "Zeitverlauf",
      "tab.prob": "Wahrscheinlichkeit",
      "tab.arrival": "Ankünfte",
      "tab.focus": "Jahreshoch",
      "tab.scatter": "Streudiagramm",
      "analysis.empty": "Keine Arten über dem Schwellenwert.",
      "ctrl.filter": "Arten filtern",
      "place.nearby": "Orte in der Nähe",
      "place.none": "Keine benannten Orte in der Nähe.",
      "ph.fieldtitle": "Ortsname",
      "ph.filter": "Arten filtern…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Ordnen nach",
      "rank.arrival": "Ankünfte",
      "rank.prob": "Wahrscheinlichkeit",
      "rank.both": "Beide",
      "ctrl.locate": "Zu meinem Standort",
      "status.locateError": "Standort konnte nicht ermittelt werden.",
      "status.offline": "Offline – zwischengespeicherte Daten werden verwendet",
      "ctrl.basemap": "Hintergrundkarte",
      "ctrl.hires": "Auflösung",
      "popup.title": "Artverbreitungen und Checklisten",
      "popup.perf": "Artverbreitung, Artenreichtum und ▶ Wanderung abspielen werten das Modell über viele Kartenzellen aus; für flüssige Leistung wird daher ein moderner Computer mit schneller CPU empfohlen.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback und Kommentare sind willkommen unter:",
      "basemap.dark": "Dunkel",
      "basemap.light": "Hell",
      "basemap.streets": "Straßen",
      "basemap.topo": "Topografisch",
      "basemap.satellite": "Satellit",
      "scatter.xAxis": "Ankunft (aktuelle Woche)",
      "scatter.yAxis": "Wahrscheinlichkeit (aktuelle Woche)",
      "th.rank": "#",
      "th.species": "Art",
      "th.sci": "Wissenschaftlicher Name",
      "th.prob": "Wahrscheinlichkeit",
      "th.arrival": "Ankunft",
      "th.delta": "Δ ggü. {ref}",
      "th.ratio": "% von {ref}",
      "legend.prob": "Vorkommenswahrscheinlichkeit",
      "legend.count": "Vorhergesagte Artenzahl",
      "status.selectSpecies": "Wählen Sie eine Art, um ihre vorhergesagte Verbreitungskarte zu sehen.",
      "status.loadingModel": "Lade ONNX-Modell…",
      "status.computing": "Berechne {name} – {week} · {n} neue Zellen [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} Zellen ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} Zellen ({step}°) [zwischengespeichert]",
      "status.richnessDone": "Artenreichtum – {week} · {n} Zellen ({step}°)",
      "status.richnessCached": "Artenreichtum – {week} · {n} Zellen ({step}°) [zwischengespeichert]",
      "status.predicting": "Sage Arten bei ({lat}, {lon}) für Woche {week} voraus…",
      "status.predicting48": "Sage 48 Wochen bei ({lat}, {lon}) voraus…",
      "status.spResult": "{n} Arten über {p}% bei ({lat}, {lon})",
      "status.error": "Fehler: {msg}",
      "sp.summary": "{lat}°, {lon}° · Woche {week} · {n} Arten über {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} Arten über {p}% Mittel · normiert auf {max}%",
      "bc.avg": "{p}% Mittel",
      "bc.max": "{p}% max",
      "week.fmt": "Woche {w} ({period} {month})",
      "loc.savePrompt": "Diesen Ort benennen:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modell: BirdNET Geomodel (Gewichte CC BY-SA 4.0). App-Code MIT. Vorhersagen sind Schätzungen — keine gesicherte Wahrheit.",
      "footer.lastchange": "Letzte Änderung: {t}",
      "about.title": "ℹ︎ Über das Modell & wie die Werte berechnet werden",
      "about.html":
        "<h4>Das Habitatmodell</h4>" +
        "<p>Dieses Werkzeug führt das <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — ein raumzeitliches neuronales Netz — vollständig in Ihrem Browser über ONNX Runtime Web aus. Aus <b>Breitengrad</b>, <b>Längengrad</b> und <b>Woche des Jahres</b> (1–48; das Modell teilt das Jahr in 48 Wochen von etwa 7,6 Tagen) sagt es eine <b>Vorkommenswahrscheinlichkeit</b> (0–100 %) für jede der 12.012 Arten unter Vögeln, Säugetieren, Amphibien und Insekten voraus. Die Wahrscheinlichkeit spiegelt wider, wie wahrscheinlich eine Art dort zu dieser Jahreszeit vorkommt, gelernt aus globalen Fundmeldungen und Umweltvariablen. Es ist eine modellierte Schätzung — keine Beobachtungszählung und keine Garantie.</p>" +
        "<h4>Kartenansichten</h4>" +
        "<ul>" +
        "<li><b>Artverbreitung</b> — die Wahrscheinlichkeit einer ausgewählten Art auf der Karte für die gewählte Woche.</li>" +
        "<li><b>Artenreichtum</b> — die Anzahl der Arten mit einer Wahrscheinlichkeit von mindestens 5 % in jeder Rasterzelle, begrenzt auf die gewählte Artengruppe. ▶ Wanderung abspielen animiert die Karte Woche für Woche.</li>" +
        "</ul>" +
        "<p>Die Karte wird auf einem Zellraster berechnet (3° herausgezoomt, bis 0,25° herangezoomt) und mit bilinearer Glättung gezeichnet, sodass die Farben zwischen den Zellzentren ineinander übergehen, statt harte Blöcke zu bilden. <b>Hinweis:</b> Artverbreitung, Artenreichtum und ▶ Wanderung abspielen werten das Modell über viele Kartenzellen aus; für flüssige Leistung wird ein moderner Computer mit schneller CPU (Prozessor) empfohlen.</p>" +
        "<h4>Standortanalyse (auf die Karte klicken)</h4>" +
        "<ul>" +
        "<li><b>Zeitverlauf</b> — die Wahrscheinlichkeit jeder Art über alle 48 Wochen.</li>" +
        "<li><b>Wahrscheinlichkeit</b> — eine Heatmap Art × Woche (rot = niedrig, grün = hoch), gestreckt über die angezeigten Werte.</li>" +
        "<li><b>Ankünfte</b> — für jede Art und Woche ein Ankunftswert <code>(P[nächste Woche] − P[vorherige Woche]) ÷ max</code>, wobei <code>max</code> die höchste Wochenwahrscheinlichkeit der Art im Jahr ist. Grün = steigend (Ankunft), rot = fallend (Abzug); die Wochen laufen über die Jahresgrenze um (1 ↔ 48).</li>" +
        "<li><b>Jahreshoch</b> — die kumulative Summe der wöchentlichen Ankunftswerte, auf 0–100 skaliert (Jahrestief = 0, Höhepunkt = 100). Hebt die Zeit des Jahres hervor, in der die Art am stärksten präsent ist.</li>" +
        "<li><b>Streudiagramm</b> — der Ankunftswert der aktuellen Woche (x-Achse) gegen die Wahrscheinlichkeit (y-Achse) für die wichtigsten Arten, mit einer sortierbaren Tabelle darunter.</li>" +
        "</ul>" +
        "<h4>Artenliste — Spalte „Vergleichen mit“</h4>" +
        "<ul>" +
        "<li><b>Vorherige / Nächste Woche</b> und <b>Jahresmittel</b> zeigen die Änderung Δ = aktuelle Wahrscheinlichkeit − Vergleichswert.</li>" +
        "<li><b>Jahresmaximum</b> zeigt die aktuelle Woche als Anteil am Jahreshöchstwert der Art: <code>aktuell ÷ Maximum im Jahr</code>. 100 % bedeutet, dass die gewählte Woche die beste Woche der Art ist.</li>" +
        "</ul>" +
        "<h4>Technologie</h4>" +
        "<p>Das KI-Modell läuft <b>vollständig in Ihrem Browser</b> — es gibt keinen Server und Ihr Standort wird nirgendwohin gesendet. Das neuronale Netz wird einmal heruntergeladen (~7 MB) und alle Vorhersagen werden auf Ihrem eigenen Gerät berechnet. Erstellt mit:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — führt das neuronale Netz im Browser aus.</li>" +
        "<li><b>Web Workers</b> — die Berechnung läuft außerhalb des Haupt-Threads, damit die Oberfläche reaktionsfähig bleibt.</li>" +
        "<li><b>BirdNET Geomodel</b> — das trainierte Modell, als ONNX exportiert (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> mit OpenStreetMap-/CARTO-Kacheln — die interaktive Karte.</li>" +
        "<li><b>Reines HTML, CSS und JavaScript</b> — kein Framework und kein Build-Schritt; als statische Seite bereitgestellt (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; Feedback</h4>" +
        "<p>Dieses Werkzeug ist kostenlos nutzbar, und Feedback ist willkommen unter <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Ein Norwegen-spezifisches Habitatmodell befindet sich in Entwicklung und soll reichhaltigere norwegische Daten nutzen als die Google-Earth-Engine-Daten des aktuellen Modells. Ziel des Habitatmodells ist eine verbesserte App zur Vogelstimmenerkennung (A!Birder) (in Entwicklung). Diese Seite dient der einfachen Qualitätskontrolle dieses Modells.</p>" +
        "<p class=\"about-note\">Vorhersagen sind Modellschätzungen, nicht die Wahrheit. Modellgewichte © das BirdNET-Team, lizenziert unter CC BY-SA 4.0; Kartenkacheln © OpenStreetMap-Mitwirkende, © CARTO.</p>",
    },
    es: {
      "app.title": "Especies y listas",
      "app.loading": "Cargando modelo, etiquetas y nombres de especies…",
      "app.failed": "No se pudo cargar: {msg}",
      "ctrl.language": "Idioma",
      "ctrl.settings": "Ajustes",
      "ctrl.about": "Acerca de & cómo funciona",
      "ctrl.mode": "Modo",
      "ctrl.group": "Grupo de especies",
      "group.all": "Todos los grupos",
      "group.aves": "Aves",
      "group.mammalia": "Mamíferos",
      "group.amphibia": "Anfibios",
      "group.insecta": "Insectos",
      "mode.range": "Área de distribución",
      "mode.richness": "Riqueza de especies",
      "mode.list": "📍 Lista de especies",
      "mode.field": "📍 Lista de campo",
      "btn.clear": "Vaciar",
      "act.heard": "Oído",
      "act.flying": "Volando",
      "act.feeding": "Alimentándose",
      "act.resting": "Descansando",
      "act.breeding": "Reproducción",
      "mode.barchart": "📍 Migración",
      "ctrl.species": "Especie",
      "ph.species": "Buscar especie…",
      "ctrl.week": "Semana",
      "ctrl.bcthreshold": "Rango de probabilidad",
      "ctrl.compare": "Comparar con",
      "compare.none": "— ninguno —",
      "compare.prev": "Semana anterior",
      "compare.next": "Semana siguiente",
      "compare.mean": "Media anual",
      "compare.max": "Máximo anual",
      "compare.annualtop": "Máximo anual",
      "ctrl.secondlang": "2.º nombre",
      "ctrl.savedloc": "Ubicaciones guardadas",
      "ph.savedloc": "Aún no hay ubicaciones guardadas",
      "loc.delete": "Eliminar ubicación",
      "ctrl.hidden": "Especies ocultas",
      "loc.unhide": "Mostrar de nuevo",
      "menu.filter": "Filtrar",
      "menu.hide": "No mostrar",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Detecciones recientes",
      "recent.none": "No hay detecciones recientes cerca.",
      "recent.viewall": "Ver todo en iNaturalist",
      "menu.distmap": "Mapa de distribución",
      "distmap.none": "No se encontró ningún mapa de distribución. Abre la página de Wikipedia:",
      "distmap.download": "Abrir imagen completa",
      "btn.saveloc": "★ Guardar",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Reproducir migración",
      "btn.pause": "⏸ Pausar",
      "btn.newchecklist": "⭳ Guardar",
      "btn.checklist": "✓ Lista",
      "btn.print": "🖨 Imprimir",
      "btn.close": "Cerrar",
      "btn.delete": "Eliminar",
      "ctrl.checklists": "Lista",
      "chk.namePrompt": "Nombra esta lista:",
      "chk.createNew": "Crear nueva",
      "chk.all": "Todas",
      "chk.seen": "Vistas",
      "chk.missing": "Faltan",
      "chk.count": "Cantidad",
      "chk.activity": "Actividad",
      "fc.add": "Añadir observación",
      "btn.logcsv": "⬇ Registro",
      "chk.merged": "Listas combinadas.",
      "chk.note": "NOTA: Las probabilidades y demás valores de esta lista proceden de un modelo de IA y representan solo una aproximación de las especies que probablemente se encuentren en esta ubicación — no son observaciones confirmadas. Para una referencia autorizada de especies, consulta <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Generando lista…",
      "th.change": "Cambio (Δ)",
      "th.locality": "Localidad",
      "th.notes": "Notas",
      "panel.spTitle": "Especies en la ubicación",
      "panel.bcTitle": "Análisis de la ubicación",
      "tab.timeline": "Cronología",
      "tab.prob": "Probabilidad",
      "tab.arrival": "Llegadas",
      "tab.focus": "Máximo anual",
      "tab.scatter": "Dispersión",
      "analysis.empty": "No hay especies por encima del umbral.",
      "ctrl.filter": "Filtrar especies",
      "place.nearby": "Lugares cercanos",
      "place.none": "No hay lugares con nombre cerca.",
      "ph.fieldtitle": "Nombre del lugar",
      "ph.filter": "Filtrar especies…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Ordenar por",
      "rank.arrival": "Llegadas",
      "rank.prob": "Probabilidad",
      "rank.both": "Ambos",
      "ctrl.locate": "Ir a mi ubicación",
      "status.locateError": "No se pudo obtener tu ubicación.",
      "status.offline": "Sin conexión: usando datos en caché",
      "ctrl.basemap": "Mapa base",
      "ctrl.hires": "Resolución",
      "popup.title": "Distribuciones de especies y listas",
      "popup.perf": "Área de distribución, Riqueza de especies y ▶ Reproducir migración evalúan el modelo en muchas celdas del mapa, por lo que se recomienda un ordenador moderno con una CPU rápida para un rendimiento fluido.",
      "popup.ok": "Aceptar",
      "popup.feedback": "Comentarios y sugerencias son bienvenidos en:",
      "basemap.dark": "Oscuro",
      "basemap.light": "Claro",
      "basemap.streets": "Calles",
      "basemap.topo": "Topográfico",
      "basemap.satellite": "Satélite",
      "scatter.xAxis": "Llegada (semana actual)",
      "scatter.yAxis": "Probabilidad (semana actual)",
      "th.rank": "#",
      "th.species": "Especie",
      "th.sci": "Nombre científico",
      "th.prob": "Probabilidad",
      "th.arrival": "Llegada",
      "th.delta": "Δ frente a {ref}",
      "th.ratio": "% de {ref}",
      "legend.prob": "Probabilidad de presencia",
      "legend.count": "Número previsto de especies",
      "status.selectSpecies": "Selecciona una especie para ver su área de distribución prevista.",
      "status.loadingModel": "Cargando modelo ONNX…",
      "status.computing": "Calculando {name} – {week} · {n} celdas nuevas [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} celdas ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} celdas ({step}°) [en caché]",
      "status.richnessDone": "Riqueza de especies – {week} · {n} celdas ({step}°)",
      "status.richnessCached": "Riqueza de especies – {week} · {n} celdas ({step}°) [en caché]",
      "status.predicting": "Prediciendo especies en ({lat}, {lon}) semana {week}…",
      "status.predicting48": "Prediciendo 48 semanas en ({lat}, {lon})…",
      "status.spResult": "{n} especies por encima del {p}% en ({lat}, {lon})",
      "status.error": "Error: {msg}",
      "sp.summary": "{lat}°, {lon}° · Semana {week} · {n} especies por encima del {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} especies por encima del {p}% de media · normalizado al {max}%",
      "bc.avg": "{p}% de media",
      "bc.max": "{p}% máx",
      "week.fmt": "Semana {w} ({period} {month})",
      "loc.savePrompt": "Nombra esta ubicación:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modelo: BirdNET Geomodel (pesos CC BY-SA 4.0). Código de la app MIT. Las predicciones son estimaciones — no la verdad absoluta.",
      "footer.lastchange": "Último cambio: {t}",
      "about.title": "ℹ︎ Acerca del modelo y cómo se calculan los valores",
      "about.html":
        "<h4>El modelo de hábitat</h4>" +
        "<p>Esta herramienta ejecuta el <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — una red neuronal espaciotemporal — íntegramente en tu navegador mediante ONNX Runtime Web. A partir de una <b>latitud</b>, una <b>longitud</b> y una <b>semana del año</b> (1–48; el modelo divide el año en 48 semanas de unos 7,6 días), predice una <b>probabilidad de presencia</b> (0–100%) para cada una de las 12 012 especies entre aves, mamíferos, anfibios e insectos. La probabilidad refleja cuán probable es que una especie esté presente allí en esa época del año, aprendida a partir de registros mundiales de presencia y variables ambientales. Es una estimación modelada — no un recuento de observaciones ni una garantía.</p>" +
        "<h4>Vistas del mapa</h4>" +
        "<ul>" +
        "<li><b>Área de distribución</b> — la probabilidad de una especie elegida sobre el mapa para la semana seleccionada.</li>" +
        "<li><b>Riqueza de especies</b> — el número de especies cuya probabilidad es de al menos el 5% en cada celda de la cuadrícula, limitado al grupo de especies seleccionado. ▶ Reproducir migración anima el mapa semana a semana.</li>" +
        "</ul>" +
        "<p>El mapa se evalúa sobre una cuadrícula de celdas (3° de ancho con la vista alejada, hasta 0,25° con la vista acercada) y se dibuja con suavizado bilineal, de modo que los colores se funden entre los centros de las celdas en lugar de formar bloques marcados. <b>Nota:</b> Área de distribución, Riqueza de especies y ▶ Reproducir migración evalúan el modelo en muchas celdas del mapa, por lo que se recomienda un ordenador moderno con una CPU (procesador) rápida para un rendimiento fluido.</p>" +
        "<h4>Análisis de la ubicación (haz clic en el mapa)</h4>" +
        "<ul>" +
        "<li><b>Cronología</b> — la probabilidad de cada especie a lo largo de las 48 semanas.</li>" +
        "<li><b>Probabilidad</b> — un mapa de calor especie × semana (rojo = baja, verde = alta), estirado según los valores actualmente en pantalla.</li>" +
        "<li><b>Llegadas</b> — para cada especie y semana, una puntuación de llegada <code>(P[semana siguiente] − P[semana anterior]) ÷ max</code>, donde <code>max</code> es la probabilidad semanal más alta de esa especie a lo largo del año. Verde = probabilidad en aumento (llegando), rojo = en descenso (partiendo); las semanas se enlazan en el límite del año (1 ↔ 48).</li>" +
        "<li><b>Máximo anual</b> — la suma acumulada de las puntuaciones de llegada semanales, reescalada a 0–100 (el mínimo del año = 0, su pico = 100). Resalta la parte del año en la que la especie está más presente.</li>" +
        "<li><b>Dispersión</b> — la puntuación de llegada de la semana actual (eje x) frente a la probabilidad (eje y) para las especies principales, con una tabla ordenable debajo.</li>" +
        "</ul>" +
        "<h4>Lista de especies — columna «Comparar con»</h4>" +
        "<ul>" +
        "<li><b>Semana anterior / siguiente</b> y <b>Media anual</b> muestran el cambio Δ = probabilidad actual − el valor de comparación.</li>" +
        "<li><b>Máximo anual</b> muestra la semana actual como fracción del pico anual de la especie: <code>actual ÷ max a lo largo del año</code>. 100% significa que la semana seleccionada es la mejor semana de la especie.</li>" +
        "</ul>" +
        "<h4>Tecnología</h4>" +
        "<p>El modelo de IA se ejecuta <b>íntegramente en tu navegador web</b> — no hay ningún servidor y tu ubicación nunca se envía a ningún sitio. La red neuronal se descarga una sola vez (~7 MB) y todas las predicciones se calculan en tu propio dispositivo. Construido con:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — ejecuta la red neuronal en el navegador.</li>" +
        "<li><b>Web Workers</b> — la inferencia se ejecuta fuera del hilo principal para que la interfaz siga respondiendo.</li>" +
        "<li><b>BirdNET Geomodel</b> — el modelo entrenado, exportado a ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> con teselas de OpenStreetMap / CARTO — el mapa interactivo.</li>" +
        "<li><b>HTML, CSS y JavaScript puros</b> — sin framework ni paso de compilación; servido como sitio estático (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Proyecto y comentarios</h4>" +
        "<p>Esta herramienta es de uso gratuito, y los comentarios son bienvenidos en <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Se está desarrollando un modelo de hábitat específico para Noruega, con el objetivo de usar datos noruegos más ricos que los datos de Google Earth Engine empleados en el modelo actual. La meta del modelo de hábitat es una app mejorada de detección del canto de las aves (A!Birder) (en desarrollo). Esta página se ha creado para facilitar el control de calidad de ese modelo.</p>" +
        "<p class=\"about-note\">Las predicciones son estimaciones del modelo, no la verdad absoluta. Pesos del modelo © el equipo de BirdNET, con licencia CC BY-SA 4.0; teselas del mapa © colaboradores de OpenStreetMap, © CARTO.</p>",
    },
    fr: {
      "app.title": "Espèces et listes",
      "app.loading": "Chargement du modèle, des étiquettes et des noms d'espèces…",
      "app.failed": "Échec du chargement : {msg}",
      "ctrl.language": "Langue",
      "ctrl.settings": "Paramètres",
      "ctrl.about": "À propos & fonctionnement",
      "ctrl.mode": "Mode",
      "ctrl.group": "Groupe d'espèces",
      "group.all": "Tous les groupes",
      "group.aves": "Oiseaux",
      "group.mammalia": "Mammifères",
      "group.amphibia": "Amphibiens",
      "group.insecta": "Insectes",
      "mode.range": "Aire de répartition",
      "mode.richness": "Richesse spécifique",
      "mode.list": "📍 Liste d'espèces",
      "mode.field": "📍 Liste de terrain",
      "btn.clear": "Effacer",
      "act.heard": "Entendu",
      "act.flying": "En vol",
      "act.feeding": "Se nourrit",
      "act.resting": "Au repos",
      "act.breeding": "Nidification",
      "mode.barchart": "📍 Migration",
      "ctrl.species": "Espèce",
      "ph.species": "Rechercher une espèce…",
      "ctrl.week": "Semaine",
      "ctrl.bcthreshold": "Plage de probabilité",
      "ctrl.compare": "Comparer à",
      "compare.none": "— aucun —",
      "compare.prev": "Semaine précédente",
      "compare.next": "Semaine suivante",
      "compare.mean": "Moyenne annuelle",
      "compare.max": "Maximum annuel",
      "compare.annualtop": "Pic annuel",
      "ctrl.secondlang": "2ᵉ nom",
      "ctrl.savedloc": "Lieux enregistrés",
      "ph.savedloc": "Aucun lieu enregistré pour l'instant",
      "loc.delete": "Supprimer le lieu",
      "ctrl.hidden": "Espèces masquées",
      "loc.unhide": "Afficher de nouveau",
      "menu.filter": "Filtrer",
      "menu.hide": "Ne pas afficher",
      "menu.wiki": "Wikipédia",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Observations récentes",
      "recent.none": "Aucune observation récente à proximité.",
      "recent.viewall": "Tout voir sur iNaturalist",
      "menu.distmap": "Carte de répartition",
      "distmap.none": "Aucune carte de répartition trouvée. Ouvrir la page Wikipédia :",
      "distmap.download": "Ouvrir l’image complète",
      "btn.saveloc": "★ Enregistrer",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Lire la migration",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "⭳ Enregistrer",
      "btn.checklist": "✓ Liste",
      "btn.print": "🖨 Imprimer",
      "btn.close": "Fermer",
      "btn.delete": "Supprimer",
      "ctrl.checklists": "Liste",
      "chk.namePrompt": "Nommez cette liste :",
      "chk.createNew": "Créer",
      "chk.all": "Toutes",
      "chk.seen": "Vues",
      "chk.missing": "Manquantes",
      "chk.count": "Nombre",
      "chk.activity": "Activité",
      "fc.add": "Ajouter une observation",
      "btn.logcsv": "⬇ Journal",
      "chk.merged": "Listes fusionnées.",
      "chk.note": "NB : les probabilités et autres valeurs de cette liste sont issues d'un modèle d'IA et ne représentent qu'une approximation des espèces susceptibles d'être présentes à cet endroit — il ne s'agit pas d'observations confirmées. Pour une référence faisant autorité sur les espèces, voir <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Création de la liste…",
      "th.change": "Variation (Δ)",
      "th.locality": "Localité",
      "th.notes": "Notes",
      "panel.spTitle": "Espèces à cet endroit",
      "panel.bcTitle": "Analyse de localisation",
      "tab.timeline": "Chronologie",
      "tab.prob": "Probabilité",
      "tab.arrival": "Arrivées",
      "tab.focus": "Pic annuel",
      "tab.scatter": "Nuage de points",
      "analysis.empty": "Aucune espèce au-dessus du seuil.",
      "ctrl.filter": "Filtrer les espèces",
      "place.nearby": "Lieux à proximité",
      "place.none": "Aucun lieu nommé à proximité.",
      "ph.fieldtitle": "Nom du lieu",
      "ph.filter": "Filtrer les espèces…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Classer par",
      "rank.arrival": "Arrivées",
      "rank.prob": "Probabilité",
      "rank.both": "Les deux",
      "ctrl.locate": "Aller à ma position",
      "status.locateError": "Impossible d’obtenir votre position.",
      "status.offline": "Hors ligne – utilisation des données en cache",
      "ctrl.basemap": "Fond de carte",
      "ctrl.hires": "Résolution",
      "popup.title": "Répartitions d'espèces et listes",
      "popup.perf": "L'Aire de répartition, la Richesse spécifique et ▶ Lire la migration évaluent le modèle sur de nombreuses cellules ; un ordinateur moderne doté d'un CPU (processeur) performant est recommandé pour une bonne fluidité.",
      "popup.ok": "OK",
      "popup.feedback": "Vos retours et commentaires sont les bienvenus à :",
      "basemap.dark": "Sombre",
      "basemap.light": "Clair",
      "basemap.streets": "Rues",
      "basemap.topo": "Topographique",
      "basemap.satellite": "Satellite",
      "scatter.xAxis": "Arrivée (semaine en cours)",
      "scatter.yAxis": "Probabilité (semaine en cours)",
      "th.rank": "#",
      "th.species": "Espèce",
      "th.sci": "Nom scientifique",
      "th.prob": "Probabilité",
      "th.arrival": "Arrivée",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% de {ref}",
      "legend.prob": "Probabilité de présence",
      "legend.count": "Nombre d'espèces prédit",
      "status.selectSpecies": "Sélectionnez une espèce pour afficher sa carte de répartition prédite.",
      "status.loadingModel": "Chargement du modèle ONNX…",
      "status.computing": "Calcul de {name} – {week} · {n} nouvelles cellules [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} cellules ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} cellules ({step}°) [en cache]",
      "status.richnessDone": "Richesse spécifique – {week} · {n} cellules ({step}°)",
      "status.richnessCached": "Richesse spécifique – {week} · {n} cellules ({step}°) [en cache]",
      "status.predicting": "Prédiction des espèces à ({lat}, {lon}) semaine {week}…",
      "status.predicting48": "Prédiction de 48 semaines à ({lat}, {lon})…",
      "status.spResult": "{n} espèces au-dessus de {p} % à ({lat}, {lon})",
      "status.error": "Erreur : {msg}",
      "sp.summary": "{lat}°, {lon}° · Semaine {week} · {n} espèces au-dessus de {p} %",
      "bc.summary": "{lat}°, {lon}° · {n} espèces au-dessus de {p} % en moyenne · normalisé à {max} %",
      "bc.avg": "{p} % en moyenne",
      "bc.max": "{p} % max",
      "week.fmt": "Semaine {w} ({period} {month})",
      "loc.savePrompt": "Nommez ce lieu :",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modèle : BirdNET Geomodel (poids CC BY-SA 4.0). Code de l'app sous licence MIT. Les prédictions sont des estimations — pas la réalité de terrain.",
      "footer.lastchange": "Dernière modification : {t}",
      "about.title": "ℹ︎ À propos du modèle et du calcul des valeurs",
      "about.html":
        "<h4>Le modèle d'habitat</h4>" +
        "<p>Cet outil exécute le <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — un réseau de neurones spatio-temporel — entièrement dans votre navigateur via ONNX Runtime Web. À partir d'une <b>latitude</b>, d'une <b>longitude</b> et d'une <b>semaine de l'année</b> (1–48 ; le modèle divise l'année en 48 semaines d'environ 7,6 jours), il prédit une <b>probabilité de présence</b> (0–100 %) pour chacune des 12 012 espèces parmi les oiseaux, mammifères, amphibiens et insectes. La probabilité reflète la probabilité qu'une espèce soit présente à cet endroit à cette période de l'année, apprise à partir de données mondiales d'observation et de variables environnementales. C'est une estimation modélisée — pas un comptage d'observations ni une garantie.</p>" +
        "<h4>Vues cartographiques</h4>" +
        "<ul>" +
        "<li><b>Aire de répartition</b> — la probabilité d'une espèce choisie sur la carte pour la semaine sélectionnée.</li>" +
        "<li><b>Richesse spécifique</b> — le nombre d'espèces dont la probabilité atteint au moins 5 % dans chaque cellule, limité au groupe d'espèces sélectionné. ▶ Lire la migration anime la carte semaine par semaine.</li>" +
        "</ul>" +
        "<p>La carte est calculée sur une grille de cellules (3° en vue éloignée, jusqu'à 0,25° en vue rapprochée) et dessinée avec un lissage bilinéaire, afin que les couleurs se fondent entre les centres des cellules au lieu de former des blocs nets. <b>Remarque :</b> l'Aire de répartition, la Richesse spécifique et ▶ Lire la migration évaluent le modèle sur de nombreuses cellules ; un ordinateur moderne doté d'un CPU (processeur) performant est recommandé pour une bonne fluidité.</p>" +
        "<h4>Analyse de localisation (cliquez sur la carte)</h4>" +
        "<ul>" +
        "<li><b>Chronologie</b> — la probabilité de chaque espèce sur les 48 semaines.</li>" +
        "<li><b>Probabilité</b> — une carte de chaleur espèce × semaine (rouge = faible, vert = élevé), étirée selon les valeurs affichées.</li>" +
        "<li><b>Arrivées</b> — pour chaque espèce et semaine, un score d'arrivée <code>(P[semaine suivante] − P[semaine précédente]) ÷ max</code>, où <code>max</code> est la probabilité hebdomadaire la plus élevée de l'espèce sur l'année. Vert = en hausse (arrivée), rouge = en baisse (départ) ; les semaines bouclent à la limite de l'année (1 ↔ 48).</li>" +
        "<li><b>Pic annuel</b> — la somme cumulée des scores d'arrivée hebdomadaires, ramenée à 0–100 (minimum de l'année = 0, pic = 100). Met en évidence la période de l'année où l'espèce est la plus présente.</li>" +
        "<li><b>Nuage de points</b> — le score d'arrivée de la semaine en cours (axe x) en fonction de la probabilité (axe y) pour les principales espèces, avec un tableau triable en dessous.</li>" +
        "</ul>" +
        "<h4>Liste d'espèces — colonne « Comparer à »</h4>" +
        "<ul>" +
        "<li><b>Semaine précédente / suivante</b> et <b>Moyenne annuelle</b> indiquent la variation Δ = probabilité actuelle − la valeur de comparaison.</li>" +
        "<li><b>Maximum annuel</b> indique la semaine en cours en proportion du pic annuel de l'espèce : <code>actuel ÷ max sur l'année</code>. 100 % signifie que la semaine sélectionnée est la meilleure semaine de l'espèce.</li>" +
        "</ul>" +
        "<h4>Technologie</h4>" +
        "<p>Le modèle d'IA s'exécute <b>entièrement dans votre navigateur</b> — il n'y a aucun serveur et votre position n'est jamais envoyée nulle part. Le réseau de neurones est téléchargé une seule fois (~7 Mo) et toutes les prédictions sont calculées sur votre propre appareil. Construit avec :</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — exécute le réseau de neurones dans le navigateur.</li>" +
        "<li><b>Web Workers</b> — le calcul s'exécute hors du thread principal pour garder l'interface réactive.</li>" +
        "<li><b>BirdNET Geomodel</b> — le modèle entraîné, exporté en ONNX (FP16, ~7 Mo).</li>" +
        "<li><b>Leaflet</b> avec des tuiles OpenStreetMap / CARTO — la carte interactive.</li>" +
        "<li><b>HTML, CSS et JavaScript purs</b> — aucun framework ni étape de compilation ; servi comme site statique (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projet et retours</h4>" +
        "<p>Cet outil est gratuit, et vos retours sont les bienvenus à <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Un modèle d'habitat spécifique à la Norvège est en cours de développement, visant à utiliser des données norvégiennes plus riches que les données Google Earth Engine du modèle actuel. L'objectif du modèle d'habitat est une meilleure application de détection du chant des oiseaux (A!Birder) (en cours de développement). Cette page est conçue pour faciliter le contrôle qualité de ce modèle.</p>" +
        "<p class=\"about-note\">Les prédictions sont des estimations du modèle, pas la réalité. Poids du modèle © l'équipe BirdNET, sous licence CC BY-SA 4.0 ; tuiles cartographiques © contributeurs OpenStreetMap, © CARTO.</p>",
    },
    nl: {
      "app.title": "Soorten & checklists",
      "app.loading": "Model, labels & soortnamen laden…",
      "app.failed": "Laden mislukt: {msg}",
      "ctrl.language": "Taal",
      "ctrl.settings": "Instellingen",
      "ctrl.about": "Over & hoe het werkt",
      "ctrl.mode": "Modus",
      "ctrl.group": "Soortgroep",
      "group.all": "Alle groepen",
      "group.aves": "Vogels",
      "group.mammalia": "Zoogdieren",
      "group.amphibia": "Amfibieën",
      "group.insecta": "Insecten",
      "mode.range": "Verspreiding",
      "mode.richness": "Soortenrijkdom",
      "mode.list": "📍 Soortenlijst",
      "mode.field": "📍 Veldchecklist",
      "btn.clear": "Wissen",
      "act.heard": "Gehoord",
      "act.flying": "Vliegend",
      "act.feeding": "Foeragerend",
      "act.resting": "Rustend",
      "act.breeding": "Broedend",
      "mode.barchart": "📍 Trek",
      "ctrl.species": "Soort",
      "ph.species": "Soort zoeken…",
      "ctrl.week": "Week",
      "ctrl.bcthreshold": "Waarschijnlijkheidsbereik",
      "ctrl.compare": "Vergelijken met",
      "compare.none": "— geen —",
      "compare.prev": "Vorige week",
      "compare.next": "Volgende week",
      "compare.mean": "Jaargemiddelde",
      "compare.max": "Jaarmaximum",
      "compare.annualtop": "Jaartop",
      "ctrl.secondlang": "2e naam",
      "ctrl.savedloc": "Opgeslagen locaties",
      "ph.savedloc": "Nog geen opgeslagen locaties",
      "loc.delete": "Locatie verwijderen",
      "ctrl.hidden": "Verborgen soorten",
      "loc.unhide": "Weer tonen",
      "menu.filter": "Filteren",
      "menu.hide": "Niet tonen",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Recente waarnemingen",
      "recent.none": "Geen recente waarnemingen in de buurt.",
      "recent.viewall": "Alles bekijken op iNaturalist",
      "menu.distmap": "Verspreidingskaart",
      "distmap.none": "Geen verspreidingskaart gevonden. Open de Wikipedia-pagina:",
      "distmap.download": "Volledige afbeelding openen",
      "btn.saveloc": "★ Opslaan",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Trek afspelen",
      "btn.pause": "⏸ Pauzeren",
      "btn.newchecklist": "⭳ Opslaan",
      "btn.checklist": "✓ Checklist",
      "btn.print": "🖨 Afdrukken",
      "btn.close": "Sluiten",
      "btn.delete": "Verwijderen",
      "ctrl.checklists": "Checklist",
      "chk.namePrompt": "Geef deze checklist een naam:",
      "chk.createNew": "Nieuw maken",
      "chk.all": "Alle",
      "chk.seen": "Gezien",
      "chk.missing": "Ontbrekend",
      "chk.count": "Aantal",
      "chk.activity": "Activiteit",
      "fc.add": "Waarneming toevoegen",
      "btn.logcsv": "⬇ Log",
      "chk.merged": "Lijsten samengevoegd.",
      "chk.note": "Let op: De waarschijnlijkheden en andere waarden in deze checklist zijn afgeleid van een AI-model en vormen slechts een benadering van de soorten die op deze locatie kunnen voorkomen — het zijn geen bevestigde waarnemingen. Voor een gezaghebbende soortenreferentie, zie <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Checklist samenstellen…",
      "th.change": "Verandering (Δ)",
      "th.locality": "Locatie",
      "th.notes": "Notities",
      "panel.spTitle": "Soorten op locatie",
      "panel.bcTitle": "Locatieanalyse",
      "tab.timeline": "Tijdlijn",
      "tab.prob": "Waarschijnlijkheid",
      "tab.arrival": "Aankomsten",
      "tab.focus": "Jaartop",
      "tab.scatter": "Spreidingsdiagram",
      "analysis.empty": "Geen soorten boven de drempel.",
      "ctrl.filter": "Soorten filteren",
      "place.nearby": "Plaatsen in de buurt",
      "place.none": "Geen benoemde plaatsen in de buurt.",
      "ph.fieldtitle": "Locatienaam",
      "ph.filter": "Soorten filteren…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Rangschikken op",
      "rank.arrival": "Aankomsten",
      "rank.prob": "Waarschijnlijkheid",
      "rank.both": "Beide",
      "ctrl.locate": "Naar mijn locatie",
      "status.locateError": "Kon je locatie niet bepalen.",
      "status.offline": "Offline – gebruikt gecachte gegevens",
      "ctrl.basemap": "Achtergrondkaart",
      "ctrl.hires": "Resolutie",
      "popup.title": "Soortverspreidingen en checklists",
      "popup.perf": "Verspreiding, Soortenrijkdom en ▶ Trek afspelen berekenen het model over veel kaartcellen, dus een moderne computer met een snelle processor (CPU) wordt aanbevolen voor vlotte prestaties.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback en opmerkingen zijn welkom op:",
      "basemap.dark": "Donker",
      "basemap.light": "Licht",
      "basemap.streets": "Straten",
      "basemap.topo": "Topografisch",
      "basemap.satellite": "Satelliet",
      "scatter.xAxis": "Aankomst (huidige week)",
      "scatter.yAxis": "Waarschijnlijkheid (huidige week)",
      "th.rank": "#",
      "th.species": "Soort",
      "th.sci": "Wetenschappelijke naam",
      "th.prob": "Waarschijnlijkheid",
      "th.arrival": "Aankomst",
      "th.delta": "Δ t.o.v. {ref}",
      "th.ratio": "% van {ref}",
      "legend.prob": "Voorkomenswaarschijnlijkheid",
      "legend.count": "Voorspeld aantal soorten",
      "status.selectSpecies": "Selecteer een soort om de voorspelde verspreidingskaart te bekijken.",
      "status.loadingModel": "ONNX-model laden…",
      "status.computing": "{name} berekenen – {week} · {n} nieuwe cellen [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} cellen ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} cellen ({step}°) [gecachet]",
      "status.richnessDone": "Soortenrijkdom – {week} · {n} cellen ({step}°)",
      "status.richnessCached": "Soortenrijkdom – {week} · {n} cellen ({step}°) [gecachet]",
      "status.predicting": "Soorten voorspellen bij ({lat}, {lon}) week {week}…",
      "status.predicting48": "48 weken voorspellen bij ({lat}, {lon})…",
      "status.spResult": "{n} soorten boven {p}% bij ({lat}, {lon})",
      "status.error": "Fout: {msg}",
      "sp.summary": "{lat}°, {lon}° · Week {week} · {n} soorten boven {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} soorten boven {p}% gem. · genormaliseerd naar {max}%",
      "bc.avg": "{p}% gem.",
      "bc.max": "{p}% max",
      "week.fmt": "Week {w} ({period} {month})",
      "loc.savePrompt": "Geef deze locatie een naam:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (gewichten CC BY-SA 4.0). App-code MIT. Voorspellingen zijn schattingen — geen grondwaarheid.",
      "footer.lastchange": "Laatste wijziging: {t}",
      "about.title": "ℹ︎ Over het model & hoe waarden worden berekend",
      "about.html":
        "<h4>Het habitatmodel</h4>" +
        "<p>Deze tool draait het <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — een ruimtelijk-temporeel neuraal netwerk — volledig in je browser via ONNX Runtime Web. Op basis van <b>breedtegraad</b>, <b>lengtegraad</b> en <b>week van het jaar</b> (1–48; het model verdeelt het jaar in 48 weken van ongeveer 7,6 dagen) voorspelt het een <b>voorkomenswaarschijnlijkheid</b> (0–100%) voor elk van de 12.012 soorten onder vogels, zoogdieren, amfibieën en insecten. De waarschijnlijkheid geeft weer hoe waarschijnlijk een soort daar in die tijd van het jaar aanwezig is, geleerd uit wereldwijde waarnemingsgegevens en omgevingsvariabelen. Het is een gemodelleerde schatting — geen waarnemingstelling of garantie.</p>" +
        "<h4>Kaartweergaven</h4>" +
        "<ul>" +
        "<li><b>Verspreiding</b> — de waarschijnlijkheid van één gekozen soort over de kaart voor de geselecteerde week.</li>" +
        "<li><b>Soortenrijkdom</b> — het aantal soorten met een waarschijnlijkheid van minstens 5% in elke rastercel, beperkt tot de geselecteerde soortgroep. ▶ Trek afspelen animeert de kaart week voor week.</li>" +
        "</ul>" +
        "<p>De kaart wordt berekend op een raster van cellen (3° uitgezoomd, tot 0,25° ingezoomd) en getekend met bilineaire vloeiing, zodat kleuren tussen celcentra in elkaar overvloeien in plaats van harde blokken te vormen. <b>Let op:</b> Verspreiding, Soortenrijkdom en ▶ Trek afspelen berekenen het model over veel kaartcellen, dus een moderne computer met een snelle processor (CPU) wordt aanbevolen voor vlotte prestaties.</p>" +
        "<h4>Locatieanalyse (klik op de kaart)</h4>" +
        "<ul>" +
        "<li><b>Tijdlijn</b> — de waarschijnlijkheid van elke soort over alle 48 weken.</li>" +
        "<li><b>Waarschijnlijkheid</b> — een heatmap soort × week (rood = laag, groen = hoog), uitgerekt over de waarden op het scherm.</li>" +
        "<li><b>Aankomsten</b> — voor elke soort en week een aankomstscore <code>(P[volgende week] − P[vorige week]) ÷ max</code>, waarbij <code>max</code> de hoogste wekelijkse waarschijnlijkheid van de soort in het jaar is. Groen = stijgend (aankomst), rood = dalend (vertrek); de weken lopen rond bij de jaargrens (1 ↔ 48).</li>" +
        "<li><b>Jaartop</b> — de cumulatieve som van de wekelijkse aankomstscores, geschaald naar 0–100 (jaarminimum = 0, piek = 100). Toont het deel van het jaar waarin de soort het meest aanwezig is.</li>" +
        "<li><b>Spreidingsdiagram</b> — de aankomstscore van de huidige week (x-as) tegen de waarschijnlijkheid (y-as) voor de topsoorten, met een sorteerbare tabel eronder.</li>" +
        "</ul>" +
        "<h4>Soortenlijst — kolom ‘Vergelijken met’</h4>" +
        "<ul>" +
        "<li><b>Vorige / Volgende week</b> en <b>Jaargemiddelde</b> tonen de verandering Δ = huidige waarschijnlijkheid − de vergelijkingswaarde.</li>" +
        "<li><b>Jaarmaximum</b> toont de huidige week als fractie van de jaarpiek van de soort: <code>huidig ÷ max over het jaar</code>. 100% betekent dat de geselecteerde week de beste week van de soort is.</li>" +
        "</ul>" +
        "<h4>Technologie</h4>" +
        "<p>Het AI-model draait <b>volledig in je browser</b> — er is geen server en je locatie wordt nergens naartoe gestuurd. Het neurale netwerk wordt één keer gedownload (~7 MB) en alle voorspellingen worden op je eigen apparaat berekend. Gebouwd met:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — draait het neurale netwerk in de browser.</li>" +
        "<li><b>Web Workers</b> — de berekening draait buiten de hoofdthread zodat de interface responsief blijft.</li>" +
        "<li><b>BirdNET Geomodel</b> — het getrainde model, geëxporteerd naar ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> met OpenStreetMap-/CARTO-tegels — de interactieve kaart.</li>" +
        "<li><b>Pure HTML, CSS en JavaScript</b> — geen framework en geen bouwstap; geserveerd als statische site (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Project &amp; feedback</h4>" +
        "<p>Deze tool is gratis te gebruiken en feedback is welkom op <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Een Noorwegen-specifiek habitatmodel is in ontwikkeling, met als doel rijkere Noorse data te gebruiken dan de Google Earth Engine-data van het huidige model. Het doel van het habitatmodel is een verbeterde app voor vogelzangherkenning (A!Birder) (in ontwikkeling). Deze pagina is gemaakt voor eenvoudige kwaliteitscontrole van dat model.</p>" +
        "<p class=\"about-note\">Voorspellingen zijn modelschattingen, geen grondwaarheid. Modelgewichten © het BirdNET-team, gelicentieerd onder CC BY-SA 4.0; kaarttegels © OpenStreetMap-bijdragers, © CARTO.</p>",
    },
    no: {
      "app.title": "Arter og sjekklister",
      "app.loading": "Laster modell, etiketter og artsnavn…",
      "app.failed": "Kunne ikke laste: {msg}",
      "ctrl.language": "Språk",
      "ctrl.settings": "Innstillinger",
      "ctrl.about": "Om & hvordan det virker",
      "ctrl.mode": "Modus",
      "ctrl.group": "Artsgruppe",
      "group.all": "Alle grupper",
      "group.aves": "Fugler",
      "group.mammalia": "Pattedyr",
      "group.amphibia": "Amfibier",
      "group.insecta": "Insekter",
      "mode.range": "Artsutbredelse",
      "mode.richness": "Artsrikdom",
      "mode.list": "📍 Artsliste",
      "mode.field": "📍 Feltsjekkliste",
      "btn.clear": "Tøm",
      "act.heard": "Hørt",
      "act.flying": "Flygende",
      "act.feeding": "Næringssøk",
      "act.resting": "Hvilende",
      "act.breeding": "Hekking",
      "mode.barchart": "📍 Trekk",
      "ctrl.species": "Art",
      "ph.species": "Søk art…",
      "ctrl.week": "Uke",
      "ctrl.bcthreshold": "Sannsynlighetsintervall",
      "ctrl.compare": "Sammenlign med",
      "compare.none": "— ingen —",
      "compare.prev": "Forrige uke",
      "compare.next": "Neste uke",
      "compare.mean": "Årsgjennomsnitt",
      "compare.max": "Årsmaks",
      "compare.annualtop": "Årstopp",
      "ctrl.secondlang": "Andre navn",
      "ctrl.savedloc": "Lagrede steder",
      "ph.savedloc": "Ingen lagrede steder ennå",
      "loc.delete": "Slett sted",
      "ctrl.hidden": "Skjulte arter",
      "loc.unhide": "Vis igjen",
      "menu.filter": "Filtrer",
      "menu.hide": "Ikke vis",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (lyd)",
      "menu.recent": "Nylige observasjoner",
      "recent.none": "Ingen nylige observasjoner i nærheten.",
      "recent.viewall": "Se alle på iNaturalist",
      "menu.distmap": "Utbredelseskart",
      "distmap.none": "Ingen utbredelseskart funnet. Åpne Wikipedia-siden:",
      "distmap.download": "Åpne fullt bilde",
      "btn.saveloc": "★ Lagre",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Spill av trekk",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "⭳ Lagre",
      "btn.checklist": "✓ Sjekkliste",
      "btn.print": "🖨 Skriv ut",
      "btn.close": "Lukk",
      "btn.delete": "Slett",
      "ctrl.checklists": "Sjekkliste",
      "chk.namePrompt": "Gi sjekklisten et navn:",
      "chk.createNew": "Opprett ny",
      "chk.all": "Alle",
      "chk.seen": "Sett",
      "chk.missing": "Mangler",
      "chk.count": "Antall",
      "chk.activity": "Aktivitet",
      "fc.add": "Legg til observasjon",
      "btn.logcsv": "⬇ Logg",
      "chk.merged": "Lister slått sammen.",
      "chk.note": "NB: Sannsynlighetene og de øvrige verdiene i denne sjekklisten er utledet fra en AI-modell og er bare et estimat på hvilke arter som kan forekomme på dette stedet — de er ikke bekreftede observasjoner. For en autoritativ artsreferanse, se <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Bygger sjekkliste…",
      "th.change": "Endring (Δ)",
      "th.locality": "Lokalitet",
      "th.notes": "Notater",
      "panel.spTitle": "Arter på stedet",
      "panel.bcTitle": "Stedsanalyse",
      "tab.timeline": "Tidslinje",
      "tab.prob": "Sannsynlighet",
      "tab.arrival": "Ankomster",
      "tab.focus": "Årstopp",
      "tab.scatter": "Spredning",
      "analysis.empty": "Ingen arter over terskelen.",
      "ctrl.filter": "Filtrer arter",
      "place.nearby": "Steder i nærheten",
      "place.none": "Ingen navngitte steder i nærheten.",
      "ph.fieldtitle": "Stedsnavn",
      "ph.filter": "Filtrer arter…",
      "ctrl.topN": "Topp N",
      "ctrl.rankby": "Ranger etter",
      "rank.arrival": "Ankomster",
      "rank.prob": "Sannsynlighet",
      "rank.both": "Begge",
      "ctrl.locate": "Gå til min posisjon",
      "status.locateError": "Kunne ikke hente posisjonen din.",
      "status.offline": "Frakoblet – bruker bufrede data",
      "ctrl.basemap": "Bakgrunnskart",
      "ctrl.hires": "Oppløsning",
      "popup.title": "Artsutbredelser og sjekklister",
      "popup.perf": "Artsutbredelse, Artsrikdom og ▶ Spill av trekk kjører modellen over mange kartceller, så en moderne datamaskin med en rask prosessor (CPU) anbefales for jevn ytelse.",
      "popup.ok": "OK",
      "popup.feedback": "Tilbakemeldinger og kommentarer mottas gjerne på:",
      "basemap.dark": "Mørk",
      "basemap.light": "Lys",
      "basemap.streets": "Gater",
      "basemap.topo": "Topografisk",
      "basemap.satellite": "Satellitt",
      "scatter.xAxis": "Ankomst (gjeldende uke)",
      "scatter.yAxis": "Sannsynlighet (gjeldende uke)",
      "th.rank": "#",
      "th.species": "Art",
      "th.sci": "Vitenskapelig navn",
      "th.prob": "Sannsynlighet",
      "th.arrival": "Ankomst",
      "th.delta": "Δ mot {ref}",
      "th.ratio": "% av {ref}",
      "legend.prob": "Forekomstsannsynlighet",
      "legend.count": "Forutsagt antall arter",
      "status.selectSpecies": "Velg en art for å se dens forutsagte utbredelseskart.",
      "status.loadingModel": "Laster ONNX-modell…",
      "status.computing": "Beregner {name} – {week} · {n} nye celler [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} celler ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} celler ({step}°) [bufret]",
      "status.richnessDone": "Artsrikdom – {week} · {n} celler ({step}°)",
      "status.richnessCached": "Artsrikdom – {week} · {n} celler ({step}°) [bufret]",
      "status.predicting": "Forutsier arter ved ({lat}, {lon}) uke {week}…",
      "status.predicting48": "Forutsier 48 uker ved ({lat}, {lon})…",
      "status.spResult": "{n} arter over {p}% ved ({lat}, {lon})",
      "status.error": "Feil: {msg}",
      "sp.summary": "{lat}°, {lon}° · Uke {week} · {n} arter over {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} arter over {p}% snitt · normalisert til {max}%",
      "bc.avg": "{p}% snitt",
      "bc.max": "{p}% maks",
      "week.fmt": "Uke {w} ({period} {month})",
      "loc.savePrompt": "Gi stedet et navn:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modell: BirdNET Geomodel (vekter CC BY-SA 4.0). Appkode MIT. Forutsigelser er estimater — ikke fasit.",
      "footer.lastchange": "Siste endring: {t}",
      "about.title": "ℹ︎ Om modellen og hvordan verdiene beregnes",
      "about.html":
        "<h4>Habitatmodellen</h4>" +
        "<p>Dette verktøyet kjører <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — et spatiotemporalt nevralt nettverk — helt i nettleseren din via ONNX Runtime Web. Ut fra <b>breddegrad</b>, <b>lengdegrad</b> og <b>uke i året</b> (1–48; modellen deler året i 48 uker på omtrent 7,6 dager) forutsier den en <b>forekomstsannsynlighet</b> (0–100%) for hver av 12 012 arter blant fugler, pattedyr, amfibier og insekter. Sannsynligheten gjenspeiler hvor sannsynlig det er at arten finnes der på den tiden av året, lært fra globale funndata og miljøvariabler. Det er et modellert estimat — ikke et observasjonsantall eller en garanti.</p>" +
        "<h4>Kartvisninger</h4>" +
        "<ul>" +
        "<li><b>Artsutbredelse</b> — sannsynligheten for én valgt art over kartet for valgt uke.</li>" +
        "<li><b>Artsrikdom</b> — antall arter med sannsynlighet på minst 5% i hver rutecelle, begrenset til valgt artsgruppe. ▶ Spill av trekk animerer kartet uke for uke.</li>" +
        "</ul>" +
        "<p>Kartet beregnes på et rutenett (3° bredt utzoomet, ned til 0,25° innzoomet) og tegnes med bilineær glatting, slik at fargene tones mellom cellesentre i stedet for å danne harde blokker. <b>Merk:</b> Artsutbredelse, Artsrikdom og ▶ Spill av trekk kjører modellen over mange kartceller, så en moderne datamaskin med en rask prosessor (CPU) anbefales for jevn ytelse.</p>" +
        "<h4>Stedsanalyse (klikk på kartet)</h4>" +
        "<ul>" +
        "<li><b>Tidslinje</b> — hver arts sannsynlighet over alle 48 ukene.</li>" +
        "<li><b>Sannsynlighet</b> — et varmekart art × uke (rødt = lavt, grønt = høyt), skalert etter verdiene på skjermen.</li>" +
        "<li><b>Ankomster</b> — for hver art og uke en ankomstscore <code>(P[neste uke] − P[forrige uke]) ÷ maks</code>, der <code>maks</code> er artens høyeste ukesannsynlighet gjennom året. Grønt = stigende (ankommer), rødt = synkende (forlater); ukene går rundt årsgrensen (1 ↔ 48).</li>" +
        "<li><b>Årstopp</b> — den løpende (kumulative) summen av ukentlige ankomstscorer, skalert til 0–100 (årets laveste = 0, toppen = 100). Fremhever den delen av året da arten er mest til stede.</li>" +
        "<li><b>Spredning</b> — gjeldende ukes ankomstscore (x) mot sannsynlighet (y) for topp-artene, med en sorterbar tabell under.</li>" +
        "</ul>" +
        "<h4>Artsliste — kolonnen «Sammenlign med»</h4>" +
        "<ul>" +
        "<li><b>Forrige / Neste uke</b> og <b>Årsgjennomsnitt</b> viser endringen Δ = gjeldende sannsynlighet − sammenligningsverdien.</li>" +
        "<li><b>Årsmaks</b> viser gjeldende uke som en andel av artens årstopp: <code>gjeldende ÷ maks gjennom året</code>. 100% betyr at valgt uke er artens beste uke.</li>" +
        "</ul>" +
        "<h4>Teknologi</h4>" +
        "<p>AI-modellen kjører <b>helt i nettleseren din</b> — det finnes ingen server, og posisjonen din sendes aldri noe sted. Det nevrale nettverket lastes ned én gang (~7 MB), og alle forutsigelser beregnes på din egen enhet. Bygget med:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — kjører det nevrale nettverket i nettleseren.</li>" +
        "<li><b>Web Workers</b> — beregningen kjøres utenfor hovedtråden så grensesnittet forblir responsivt.</li>" +
        "<li><b>BirdNET Geomodel</b> — den trente modellen, eksportert til ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> med OpenStreetMap-/CARTO-fliser — det interaktive kartet.</li>" +
        "<li><b>Ren HTML, CSS og JavaScript</b> — ingen rammeverk og ingen byggesteg; servert som en statisk side (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Prosjekt &amp; tilbakemelding</h4>" +
        "<p>Dette verktøyet er gratis å bruke, og tilbakemeldinger er velkomne til <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. En Norge-spesifikk habitatmodell er under utvikling, med mål om å bruke rikere norske data enn Google Earth Engine-dataene som brukes i den nåværende modellen. Målet med habitatmodellen er en forbedret app for fuglesanggjenkjenning (A!Birder) (under utvikling). Denne siden er laget for enkel kvalitetskontroll av den modellen.</p>" +
        "<p class=\"about-note\">Forutsigelser er modellestimater, ikke fasit. Modellvekter © BirdNET-teamet, lisensiert CC BY-SA 4.0; kartfliser © OpenStreetMap-bidragsytere, © CARTO.</p>",
    },
    it: {
      "app.title": "Specie e liste",
      "app.loading": "Caricamento di modello, etichette e nomi delle specie…",
      "app.failed": "Caricamento non riuscito: {msg}",
      "ctrl.language": "Lingua",
      "ctrl.settings": "Impostazioni",
      "ctrl.about": "Informazioni & come funziona",
      "ctrl.mode": "Modalità",
      "ctrl.group": "Gruppo di specie",
      "group.all": "Tutti i gruppi",
      "group.aves": "Uccelli",
      "group.mammalia": "Mammiferi",
      "group.amphibia": "Anfibi",
      "group.insecta": "Insetti",
      "mode.range": "Areale della specie",
      "mode.richness": "Ricchezza di specie",
      "mode.list": "📍 Elenco delle specie",
      "mode.field": "📍 Lista da campo",
      "btn.clear": "Svuota",
      "act.heard": "Sentito",
      "act.flying": "In volo",
      "act.feeding": "Alimentazione",
      "act.resting": "A riposo",
      "act.breeding": "Nidificazione",
      "mode.barchart": "📍 Migrazione",
      "ctrl.species": "Specie",
      "ph.species": "Cerca specie…",
      "ctrl.week": "Settimana",
      "ctrl.bcthreshold": "Intervallo di probabilità",
      "ctrl.compare": "Confronta con",
      "compare.none": "— nessuno —",
      "compare.prev": "Settimana precedente",
      "compare.next": "Settimana successiva",
      "compare.mean": "Media annuale",
      "compare.max": "Massimo annuale",
      "compare.annualtop": "Picco annuale",
      "ctrl.secondlang": "2° nome",
      "ctrl.savedloc": "Località salvate",
      "ph.savedloc": "Nessuna località salvata",
      "loc.delete": "Elimina località",
      "ctrl.hidden": "Specie nascoste",
      "loc.unhide": "Mostra di nuovo",
      "menu.filter": "Filtra",
      "menu.hide": "Non mostrare",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Avvistamenti recenti",
      "recent.none": "Nessun avvistamento recente nelle vicinanze.",
      "recent.viewall": "Vedi tutti su iNaturalist",
      "menu.distmap": "Mappa di distribuzione",
      "distmap.none": "Nessuna mappa di distribuzione trovata. Apri la pagina di Wikipedia:",
      "distmap.download": "Apri immagine intera",
      "btn.saveloc": "★ Salva",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Riproduci migrazione",
      "btn.pause": "⏸ Pausa",
      "btn.newchecklist": "⭳ Salva",
      "btn.checklist": "✓ Lista",
      "btn.print": "🖨 Stampa",
      "btn.close": "Chiudi",
      "btn.delete": "Elimina",
      "ctrl.checklists": "Lista",
      "chk.namePrompt": "Assegna un nome a questa lista:",
      "chk.createNew": "Crea nuova",
      "chk.all": "Tutte",
      "chk.seen": "Viste",
      "chk.missing": "Mancanti",
      "chk.count": "Numero",
      "chk.activity": "Attività",
      "fc.add": "Aggiungi osservazione",
      "btn.logcsv": "⬇ Log",
      "chk.merged": "Liste unite.",
      "chk.note": "NB: le probabilità e gli altri valori in questa lista derivano da un modello di IA e rappresentano solo un'approssimazione delle specie che potrebbero comparire in questa località — non sono osservazioni confermate. Per un riferimento autorevole sulle specie, vedi <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Creazione della lista in corso…",
      "th.change": "Variazione (Δ)",
      "th.locality": "Località",
      "th.notes": "Note",
      "panel.spTitle": "Specie nella località",
      "panel.bcTitle": "Analisi della località",
      "tab.timeline": "Cronologia",
      "tab.prob": "Probabilità",
      "tab.arrival": "Arrivi",
      "tab.focus": "Picco annuale",
      "tab.scatter": "Dispersione",
      "analysis.empty": "Nessuna specie sopra la soglia.",
      "ctrl.filter": "Filtra specie",
      "place.nearby": "Luoghi nelle vicinanze",
      "place.none": "Nessun luogo denominato nelle vicinanze.",
      "ph.fieldtitle": "Nome del luogo",
      "ph.filter": "Filtra specie…",
      "ctrl.topN": "Prime N",
      "ctrl.rankby": "Ordina per",
      "rank.arrival": "Arrivi",
      "rank.prob": "Probabilità",
      "rank.both": "Entrambi",
      "ctrl.locate": "Vai alla mia posizione",
      "status.locateError": "Impossibile ottenere la tua posizione.",
      "status.offline": "Offline – uso dei dati nella cache",
      "ctrl.basemap": "Mappa di base",
      "ctrl.hires": "Risoluzione",
      "popup.title": "Distribuzioni delle specie ed elenchi",
      "popup.perf": "Areale della specie, Ricchezza di specie e ▶ Riproduci migrazione valutano il modello su molte celle della mappa, quindi per prestazioni fluide si consiglia un computer moderno con una CPU veloce.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback e commenti sono benvenuti a:",
      "basemap.dark": "Scura",
      "basemap.light": "Chiara",
      "basemap.streets": "Stradale",
      "basemap.topo": "Topografica",
      "basemap.satellite": "Satellitare",
      "scatter.xAxis": "Arrivo (settimana corrente)",
      "scatter.yAxis": "Probabilità (settimana corrente)",
      "th.rank": "#",
      "th.species": "Specie",
      "th.sci": "Nome scientifico",
      "th.prob": "Probabilità",
      "th.arrival": "Arrivo",
      "th.delta": "Δ rispetto a {ref}",
      "th.ratio": "% di {ref}",
      "legend.prob": "Probabilità di presenza",
      "legend.count": "Numero di specie previsto",
      "status.selectSpecies": "Seleziona una specie per visualizzare la mappa del suo areale previsto.",
      "status.loadingModel": "Caricamento del modello ONNX…",
      "status.computing": "Calcolo di {name} – {week} · {n} nuove celle [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} celle ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} celle ({step}°) [in cache]",
      "status.richnessDone": "Ricchezza di specie – {week} · {n} celle ({step}°)",
      "status.richnessCached": "Ricchezza di specie – {week} · {n} celle ({step}°) [in cache]",
      "status.predicting": "Previsione delle specie a ({lat}, {lon}) settimana {week}…",
      "status.predicting48": "Previsione di 48 settimane a ({lat}, {lon})…",
      "status.spResult": "{n} specie sopra il {p}% a ({lat}, {lon})",
      "status.error": "Errore: {msg}",
      "sp.summary": "{lat}°, {lon}° · Settimana {week} · {n} specie sopra il {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} specie sopra il {p}% medio · normalizzato al {max}%",
      "bc.avg": "{p}% medio",
      "bc.max": "{p}% max",
      "week.fmt": "Settimana {w} ({period} {month})",
      "loc.savePrompt": "Assegna un nome a questa località:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modello: BirdNET Geomodel (pesi CC BY-SA 4.0). Codice dell'app MIT. Le previsioni sono stime — non dati certi.",
      "footer.lastchange": "Ultima modifica: {t}",
      "about.title": "ℹ︎ Informazioni sul modello e su come si calcolano i valori",
      "about.html":
        "<h4>Il modello di habitat</h4>" +
        "<p>Questo strumento esegue il <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — una rete neurale spazio-temporale — interamente nel tuo browser tramite ONNX Runtime Web. A partire da <b>latitudine</b>, <b>longitudine</b> e <b>settimana dell'anno</b> (1–48; il modello divide l'anno in 48 settimane di circa 7,6 giorni), prevede una <b>probabilità di presenza</b> (0–100%) per ciascuna delle 12.012 specie tra uccelli, mammiferi, anfibi e insetti. La probabilità riflette quanto sia probabile che una specie sia presente in quel luogo in quel periodo dell'anno, appresa da dati globali di osservazione e variabili ambientali. È una stima del modello — non un conteggio di osservazioni né una garanzia.</p>" +
        "<h4>Viste della mappa</h4>" +
        "<ul>" +
        "<li><b>Areale della specie</b> — la probabilità di una specie scelta sulla mappa per la settimana selezionata.</li>" +
        "<li><b>Ricchezza di specie</b> — il numero di specie con probabilità di almeno il 5% in ogni cella della griglia, limitato al gruppo di specie selezionato. ▶ Riproduci migrazione anima la mappa settimana per settimana.</li>" +
        "</ul>" +
        "<p>La mappa è calcolata su una griglia di celle (3° con vista ampia, fino a 0,25° con zoom ravvicinato) e disegnata con interpolazione bilineare, così che i colori sfumino tra i centri delle celle invece di formare blocchi netti. <b>Nota:</b> Areale della specie, Ricchezza di specie e ▶ Riproduci migrazione valutano il modello su molte celle, quindi si consiglia un computer moderno con una CPU (processore) veloce per prestazioni fluide.</p>" +
        "<h4>Analisi della località (clicca sulla mappa)</h4>" +
        "<ul>" +
        "<li><b>Cronologia</b> — la probabilità di ogni specie su tutte le 48 settimane.</li>" +
        "<li><b>Probabilità</b> — una mappa di calore specie × settimana (rosso = basso, verde = alto), estesa sui valori a schermo.</li>" +
        "<li><b>Arrivi</b> — per ogni specie e settimana, un punteggio di arrivo <code>(P[settimana successiva] − P[settimana precedente]) ÷ max</code>, dove <code>max</code> è la probabilità settimanale più alta della specie nell'anno. Verde = in aumento (arrivo), rosso = in calo (partenza); le settimane si chiudono al confine dell'anno (1 ↔ 48).</li>" +
        "<li><b>Picco annuale</b> — la somma cumulativa dei punteggi di arrivo settimanali, riscalata a 0–100 (minimo dell'anno = 0, picco = 100). Evidenzia il periodo dell'anno in cui la specie è più presente.</li>" +
        "<li><b>Dispersione</b> — il punteggio di arrivo della settimana corrente (asse x) rispetto alla probabilità (asse y) per le specie principali, con una tabella ordinabile sotto.</li>" +
        "</ul>" +
        "<h4>Elenco delle specie — colonna « Confronta con »</h4>" +
        "<ul>" +
        "<li><b>Settimana precedente / successiva</b> e <b>Media annuale</b> mostrano la variazione Δ = probabilità attuale − il valore di confronto.</li>" +
        "<li><b>Massimo annuale</b> mostra la settimana corrente come frazione del picco annuale della specie: <code>attuale ÷ max nell'anno</code>. 100% significa che la settimana selezionata è la settimana migliore della specie.</li>" +
        "</ul>" +
        "<h4>Tecnologia</h4>" +
        "<p>Il modello di IA viene eseguito <b>interamente nel tuo browser</b> — non c'è alcun server e la tua posizione non viene mai inviata da nessuna parte. La rete neurale viene scaricata una sola volta (~7 MB) e tutte le previsioni sono calcolate sul tuo dispositivo. Realizzato con:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — esegue la rete neurale nel browser.</li>" +
        "<li><b>Web Worker</b> — il calcolo viene eseguito fuori dal thread principale per mantenere l'interfaccia reattiva.</li>" +
        "<li><b>BirdNET Geomodel</b> — il modello addestrato, esportato in ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> con tessere OpenStreetMap / CARTO — la mappa interattiva.</li>" +
        "<li><b>HTML, CSS e JavaScript puri</b> — nessun framework e nessun passaggio di build; servito come sito statico (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Progetto e feedback</h4>" +
        "<p>Questo strumento è gratuito e i feedback sono benvenuti all'indirizzo <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. È in fase di sviluppo un modello di habitat specifico per la Norvegia, che mira a usare dati norvegesi più ricchi rispetto ai dati di Google Earth Engine usati nel modello attuale. L'obiettivo del modello di habitat è un'app migliorata per il riconoscimento del canto degli uccelli (A!Birder) (in sviluppo). Questa pagina è pensata per un facile controllo qualità di quel modello.</p>" +
        "<p class=\"about-note\">Le previsioni sono stime del modello, non verità assoluta. Pesi del modello © il team BirdNET, con licenza CC BY-SA 4.0; tessere della mappa © contributori OpenStreetMap, © CARTO.</p>",
    },
    pl: {
      "app.title": "Gatunki i listy obserwacji",
      "app.loading": "Wczytywanie modelu, etykiet i nazw gatunków…",
      "app.failed": "Nie udało się wczytać: {msg}",
      "ctrl.language": "Język",
      "ctrl.settings": "Ustawienia",
      "ctrl.about": "O aplikacji i jak działa",
      "ctrl.mode": "Tryb",
      "ctrl.group": "Grupa gatunków",
      "group.all": "Wszystkie grupy",
      "group.aves": "Ptaki",
      "group.mammalia": "Ssaki",
      "group.amphibia": "Płazy",
      "group.insecta": "Owady",
      "mode.range": "Zasięg gatunku",
      "mode.richness": "Bogactwo gatunkowe",
      "mode.list": "📍 Lista gatunków",
      "mode.field": "📍 Lista terenowa",
      "btn.clear": "Wyczyść",
      "act.heard": "Słyszane",
      "act.flying": "W locie",
      "act.feeding": "Żerujące",
      "act.resting": "Odpoczywające",
      "act.breeding": "Lęgowe",
      "mode.barchart": "📍 Migracja",
      "ctrl.species": "Gatunek",
      "ph.species": "Szukaj gatunku…",
      "ctrl.week": "Tydzień",
      "ctrl.bcthreshold": "Zakres prawdopodobieństwa",
      "ctrl.compare": "Porównaj z",
      "compare.none": "— brak —",
      "compare.prev": "Poprzedni tydzień",
      "compare.next": "Następny tydzień",
      "compare.mean": "Średnia roczna",
      "compare.max": "Maksimum roczne",
      "compare.annualtop": "Szczyt roczny",
      "ctrl.secondlang": "Druga nazwa",
      "ctrl.savedloc": "Zapisane lokalizacje",
      "ph.savedloc": "Brak zapisanych lokalizacji",
      "loc.delete": "Usuń lokalizację",
      "ctrl.hidden": "Ukryte gatunki",
      "loc.unhide": "Pokaż ponownie",
      "menu.filter": "Filtruj",
      "menu.hide": "Nie pokazuj",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (audio)",
      "menu.recent": "Najnowsze obserwacje",
      "recent.none": "Nie znaleziono w pobliżu najnowszych obserwacji.",
      "recent.viewall": "Zobacz wszystkie na iNaturalist",
      "menu.distmap": "Mapa rozmieszczenia",
      "distmap.none": "Nie znaleziono mapy rozmieszczenia. Otwórz stronę Wikipedii:",
      "distmap.download": "Otwórz pełny obraz",
      "btn.saveloc": "★ Zapisz",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Odtwórz migrację",
      "btn.pause": "⏸ Pauza",
      "btn.newchecklist": "⭳ Zapisz",
      "btn.checklist": "✓ Lista obserwacji",
      "btn.print": "🖨 Drukuj",
      "btn.close": "Zamknij",
      "btn.delete": "Usuń",
      "ctrl.checklists": "Lista obserwacji",
      "chk.namePrompt": "Nazwij tę listę obserwacji:",
      "chk.createNew": "Utwórz nową",
      "chk.all": "Wszystkie",
      "chk.seen": "Widziane",
      "chk.missing": "Brakujące",
      "chk.count": "Liczba",
      "chk.activity": "Aktywność",
      "fc.add": "Dodaj obserwację",
      "btn.logcsv": "⬇ Dziennik",
      "chk.merged": "Listy scalone.",
      "chk.note": "Uwaga: prawdopodobieństwa i inne wartości na tej liście pochodzą z modelu AI i stanowią jedynie przybliżenie gatunków, które prawdopodobnie występują w tym miejscu — nie są to potwierdzone obserwacje. Wiarygodne źródło informacji o gatunkach znajdziesz na <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Tworzenie listy obserwacji…",
      "th.change": "Zmiana (Δ)",
      "th.locality": "Miejscowość",
      "th.notes": "Notatki",
      "panel.spTitle": "Gatunki w lokalizacji",
      "panel.bcTitle": "Analiza lokalizacji",
      "tab.timeline": "Oś czasu",
      "tab.prob": "Prawdopodobieństwo",
      "tab.arrival": "Przyloty",
      "tab.focus": "Szczyt roczny",
      "tab.scatter": "Wykres punktowy",
      "analysis.empty": "Brak gatunków powyżej progu.",
      "ctrl.filter": "Filtruj gatunki",
      "place.nearby": "Pobliskie miejsca",
      "place.none": "Brak nazwanych miejsc w pobliżu.",
      "ph.fieldtitle": "Nazwa lokalizacji",
      "ph.filter": "Filtruj gatunki…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Sortuj według",
      "rank.arrival": "Przyloty",
      "rank.prob": "Prawdopodobieństwo",
      "rank.both": "Oba",
      "ctrl.locate": "Przejdź do mojej lokalizacji",
      "status.locateError": "Nie udało się ustalić Twojej lokalizacji.",
      "status.offline": "Offline — używane dane z pamięci podręcznej",
      "ctrl.basemap": "Mapa podkładowa",
      "ctrl.hires": "Rozdzielczość",
      "popup.title": "Rozmieszczenie gatunków i listy obserwacji",
      "popup.perf": "Zasięg gatunku, Bogactwo gatunkowe oraz ▶ Odtwórz migrację obliczają model w wielu komórkach mapy, dlatego do płynnego działania zalecany jest nowoczesny komputer z szybkim procesorem.",
      "popup.ok": "OK",
      "popup.feedback": "Opinie i komentarze są mile widziane pod adresem:",
      "basemap.dark": "Ciemna",
      "basemap.light": "Jasna",
      "basemap.streets": "Ulice",
      "basemap.topo": "Topograficzna",
      "basemap.satellite": "Satelitarna",
      "scatter.xAxis": "Przylot (bieżący tydzień)",
      "scatter.yAxis": "Prawdopodobieństwo (bieżący tydzień)",
      "th.rank": "#",
      "th.species": "Gatunek",
      "th.sci": "Nazwa naukowa",
      "th.prob": "Prawdopodobieństwo",
      "th.arrival": "Przylot",
      "th.delta": "Δ wzgl. {ref}",
      "th.ratio": "% z {ref}",
      "legend.prob": "Prawdopodobieństwo wystąpienia",
      "legend.count": "Przewidywana liczba gatunków",
      "status.selectSpecies": "Wybierz gatunek, aby zobaczyć jego przewidywaną mapę zasięgu.",
      "status.loadingModel": "Wczytywanie modelu ONNX…",
      "status.computing": "Obliczanie {name} – {week} · {n} nowych komórek [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} komórek ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} komórek ({step}°) [z pamięci podręcznej]",
      "status.richnessDone": "Bogactwo gatunkowe – {week} · {n} komórek ({step}°)",
      "status.richnessCached": "Bogactwo gatunkowe – {week} · {n} komórek ({step}°) [z pamięci podręcznej]",
      "status.predicting": "Przewidywanie gatunków w ({lat}, {lon}) tydzień {week}…",
      "status.predicting48": "Przewidywanie 48 tygodni w ({lat}, {lon})…",
      "status.spResult": "{n} gatunków powyżej {p}% w ({lat}, {lon})",
      "status.error": "Błąd: {msg}",
      "sp.summary": "{lat}°, {lon}° · Tydzień {week} · {n} gatunków powyżej {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} gatunków powyżej {p}% śr. · znormalizowane do {max}%",
      "bc.avg": "{p}% śr.",
      "bc.max": "{p}% maks.",
      "week.fmt": "Tydzień {w} ({period} {month})",
      "loc.savePrompt": "Nazwij tę lokalizację:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (wagi CC BY-SA 4.0). Kod aplikacji MIT. Przewidywania są szacunkami — nie stanem faktycznym.",
      "footer.lastchange": "Ostatnia zmiana: {t}",
      "about.title": "ℹ︎ O modelu i jak obliczane są wartości",
      "about.html":
        "<h4>Model siedliskowy</h4>" +
        "<p>To narzędzie uruchamia <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — czasoprzestrzenną sieć neuronową — w całości w Twojej przeglądarce za pomocą ONNX Runtime Web. Na podstawie <b>szerokości geograficznej</b>, <b>długości geograficznej</b> i <b>tygodnia roku</b> (1–48; model dzieli rok na 48 tygodni po około 7,6 dnia) przewiduje <b>prawdopodobieństwo wystąpienia</b> (0–100%) dla każdego z 12 012 gatunków ptaków, ssaków, płazów i owadów. Prawdopodobieństwo odzwierciedla, jak prawdopodobne jest, że dany gatunek występuje w tym miejscu o tej porze roku, co zostało wyuczone na podstawie globalnych zapisów występowania i zmiennych środowiskowych. Jest to szacunek modelu — nie liczba obserwacji ani gwarancja.</p>" +
        "<h4>Widoki mapy</h4>" +
        "<ul>" +
        "<li><b>Zasięg gatunku</b> — prawdopodobieństwo wystąpienia jednego wybranego gatunku na mapie dla wybranego tygodnia.</li>" +
        "<li><b>Bogactwo gatunkowe</b> — liczba gatunków, których prawdopodobieństwo wynosi co najmniej 5% w każdej komórce siatki, ograniczona do wybranej grupy gatunków. ▶ Odtwórz migrację animuje mapę tydzień po tygodniu.</li>" +
        "</ul>" +
        "<p>Mapa jest obliczana na siatce komórek (szerokich na 3° przy oddaleniu, do 0,25° przy przybliżeniu) i rysowana z dwuliniowym wygładzaniem, dzięki czemu kolory płynnie przechodzą między środkami komórek zamiast tworzyć ostre bloki. <b>Uwaga:</b> Zasięg gatunku, Bogactwo gatunkowe oraz ▶ Odtwórz migrację obliczają model w wielu komórkach mapy, dlatego do płynnego działania zalecany jest nowoczesny komputer z szybkim procesorem.</p>" +
        "<h4>Analiza lokalizacji (kliknij mapę)</h4>" +
        "<ul>" +
        "<li><b>Oś czasu</b> — prawdopodobieństwo każdego gatunku we wszystkich 48 tygodniach.</li>" +
        "<li><b>Prawdopodobieństwo</b> — mapa cieplna gatunek × tydzień (czerwony = niskie, zielony = wysokie), rozciągnięta na wartości aktualnie widoczne na ekranie.</li>" +
        "<li><b>Przyloty</b> — dla każdego gatunku i tygodnia wskaźnik przylotu <code>(P[następny tydzień] − P[poprzedni tydzień]) ÷ max</code>, gdzie <code>max</code> to najwyższe tygodniowe prawdopodobieństwo danego gatunku w ciągu roku. Zielony = prawdopodobieństwo rośnie (przylot), czerwony = maleje (odlot); tygodnie zawijają się na granicy roku (1 ↔ 48).</li>" +
        "<li><b>Szczyt roczny</b> — narastająca (skumulowana) suma tygodniowych wskaźników przylotu, przeskalowana do 0–100 (minimum roku = 0, szczyt = 100). Wyróżnia część roku, w której gatunek jest najbardziej obecny.</li>" +
        "<li><b>Wykres punktowy</b> — wskaźnik przylotu w bieżącym tygodniu (oś X) względem prawdopodobieństwa (oś Y) dla najważniejszych gatunków, z sortowalną tabelą poniżej.</li>" +
        "</ul>" +
        "<h4>Lista gatunków — kolumna „Porównaj z”</h4>" +
        "<ul>" +
        "<li><b>Poprzedni / Następny tydzień</b> oraz <b>Średnia roczna</b> pokazują zmianę Δ = bieżące prawdopodobieństwo − wartość porównawcza.</li>" +
        "<li><b>Maksimum roczne</b> pokazuje bieżący tydzień jako ułamek rocznego szczytu gatunku: <code>bieżące ÷ max w ciągu roku</code>. 100% oznacza, że wybrany tydzień jest najlepszym tygodniem danego gatunku.</li>" +
        "</ul>" +
        "<h4>Technologia</h4>" +
        "<p>Model AI działa <b>w całości w Twojej przeglądarce</b> — nie ma serwera, a Twoja lokalizacja nigdy nie jest nigdzie wysyłana. Sieć neuronowa jest pobierana jednorazowo (~7 MB), a wszystkie przewidywania są obliczane na Twoim własnym urządzeniu. Zbudowane przy użyciu:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — uruchamia sieć neuronową w przeglądarce.</li>" +
        "<li><b>Web Workers</b> — wnioskowanie działa poza głównym wątkiem, więc interfejs pozostaje responsywny.</li>" +
        "<li><b>BirdNET Geomodel</b> — wytrenowany model, wyeksportowany do ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> z kafelkami OpenStreetMap / CARTO — interaktywna mapa.</li>" +
        "<li><b>Czysty HTML, CSS i JavaScript</b> — bez frameworka i bez etapu budowania; serwowane jako strona statyczna (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; opinie</h4>" +
        "<p>To narzędzie jest darmowe, a opinie są mile widziane pod adresem <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Trwają prace nad modelem siedliskowym dedykowanym Norwegii, którego celem jest wykorzystanie bogatszych norweskich danych niż dane z Google Earth Engine używane w obecnym modelu. Celem modelu siedliskowego jest ulepszona aplikacja do rozpoznawania śpiewu ptaków (A!Birder) (w trakcie tworzenia). Ta strona powstała w celu łatwej kontroli jakości tego modelu.</p>" +
        "<p class=\"about-note\">Przewidywania są szacunkami modelu, nie stanem faktycznym. Wagi modelu © zespół BirdNET, na licencji CC BY-SA 4.0; kafelki mapy © współtwórcy OpenStreetMap, © CARTO.</p>",
    },
    cs: {
      "app.title": "Druhy a kontrolní seznamy",
      "app.loading": "Načítání modelu, štítků a názvů druhů…",
      "app.failed": "Načtení selhalo: {msg}",
      "ctrl.language": "Jazyk",
      "ctrl.settings": "Nastavení",
      "ctrl.about": "O aplikaci a jak funguje",
      "ctrl.mode": "Režim",
      "ctrl.group": "Skupina druhů",
      "group.all": "Všechny skupiny",
      "group.aves": "Ptáci",
      "group.mammalia": "Savci",
      "group.amphibia": "Obojživelníci",
      "group.insecta": "Hmyz",
      "mode.range": "Areál druhu",
      "mode.richness": "Druhová bohatost",
      "mode.list": "📍 Seznam druhů",
      "mode.field": "📍 Terénní seznam",
      "btn.clear": "Vymazat",
      "act.heard": "Slyšeno",
      "act.flying": "Letící",
      "act.feeding": "Krmení",
      "act.resting": "Odpočívající",
      "act.breeding": "Hnízdění",
      "mode.barchart": "📍 Migrace",
      "ctrl.species": "Druh",
      "ph.species": "Hledat druh…",
      "ctrl.week": "Týden",
      "ctrl.bcthreshold": "Rozsah pravděpodobnosti",
      "ctrl.compare": "Porovnat s",
      "compare.none": "— žádné —",
      "compare.prev": "Předchozí týden",
      "compare.next": "Následující týden",
      "compare.mean": "Roční průměr",
      "compare.max": "Roční maximum",
      "compare.annualtop": "Roční vrchol",
      "ctrl.secondlang": "2. název",
      "ctrl.savedloc": "Uložená místa",
      "ph.savedloc": "Zatím žádná uložená místa",
      "loc.delete": "Smazat místo",
      "ctrl.hidden": "Skryté druhy",
      "loc.unhide": "Zobrazit znovu",
      "menu.filter": "Filtrovat",
      "menu.hide": "Nezobrazovat",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (zvuk)",
      "menu.recent": "Nedávná pozorování",
      "recent.none": "V okolí nebyla nalezena žádná nedávná pozorování.",
      "recent.viewall": "Zobrazit vše na iNaturalist",
      "menu.distmap": "Mapa rozšíření",
      "distmap.none": "Nebyla nalezena žádná mapa rozšíření. Otevřete stránku na Wikipedia:",
      "distmap.download": "Otevřít celý obrázek",
      "btn.saveloc": "★ Uložit",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Přehrát migraci",
      "btn.pause": "⏸ Pozastavit",
      "btn.newchecklist": "⭳ Uložit",
      "btn.checklist": "✓ Seznam",
      "btn.print": "🖨 Tisk",
      "btn.close": "Zavřít",
      "btn.delete": "Smazat",
      "ctrl.checklists": "Kontrolní seznam",
      "chk.namePrompt": "Pojmenujte tento kontrolní seznam:",
      "chk.createNew": "Vytvořit nový",
      "chk.all": "Vše",
      "chk.seen": "Viděno",
      "chk.missing": "Chybí",
      "chk.count": "Počet",
      "chk.activity": "Aktivita",
      "fc.add": "Přidat pozorování",
      "btn.logcsv": "⬇ Záznam",
      "chk.merged": "Seznamy sloučeny.",
      "chk.note": "Pozn.: Pravděpodobnosti a další hodnoty v tomto kontrolním seznamu jsou odvozeny z modelu umělé inteligence a představují pouze přibližný odhad druhů, které se na tomto místě pravděpodobně vyskytují — nejedná se o potvrzená pozorování. Autoritativní přehled druhů najdete na <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Sestavování kontrolního seznamu…",
      "th.change": "Změna (Δ)",
      "th.locality": "Lokalita",
      "th.notes": "Poznámky",
      "panel.spTitle": "Druhy na místě",
      "panel.bcTitle": "Analýza místa",
      "tab.timeline": "Časová osa",
      "tab.prob": "Pravděpodobnost",
      "tab.arrival": "Přílety",
      "tab.focus": "Roční vrchol",
      "tab.scatter": "Bodový graf",
      "analysis.empty": "Žádné druhy nad prahem.",
      "ctrl.filter": "Filtrovat druhy",
      "place.nearby": "Místa v okolí",
      "place.none": "V okolí nejsou žádná pojmenovaná místa.",
      "ph.fieldtitle": "Název místa",
      "ph.filter": "Filtrovat druhy…",
      "ctrl.topN": "Nejlepších N",
      "ctrl.rankby": "Řadit podle",
      "rank.arrival": "Přílety",
      "rank.prob": "Pravděpodobnost",
      "rank.both": "Obojí",
      "ctrl.locate": "Přejít na mou polohu",
      "status.locateError": "Nepodařilo se získat vaši polohu.",
      "status.offline": "Offline — používají se data z mezipaměti",
      "ctrl.basemap": "Podkladová mapa",
      "ctrl.hires": "Rozlišení",
      "popup.title": "Rozšíření druhů a kontrolní seznamy",
      "popup.perf": "Areál druhu, Druhová bohatost a ▶ Přehrát migraci vyhodnocují model napříč mnoha buňkami mapy, proto se pro plynulý chod doporučuje moderní počítač s rychlým procesorem.",
      "popup.ok": "OK",
      "popup.feedback": "Zpětnou vazbu a komentáře uvítáme na:",
      "basemap.dark": "Tmavá",
      "basemap.light": "Světlá",
      "basemap.streets": "Ulice",
      "basemap.topo": "Topografická",
      "basemap.satellite": "Satelitní",
      "scatter.xAxis": "Přílet (aktuální týden)",
      "scatter.yAxis": "Pravděpodobnost (aktuální týden)",
      "th.rank": "#",
      "th.species": "Druh",
      "th.sci": "Vědecký název",
      "th.prob": "Pravděpodobnost",
      "th.arrival": "Přílet",
      "th.delta": "Δ vůči {ref}",
      "th.ratio": "% z {ref}",
      "legend.prob": "Pravděpodobnost výskytu",
      "legend.count": "Předpokládaný počet druhů",
      "status.selectSpecies": "Vyberte druh pro zobrazení jeho předpovězené mapy areálu.",
      "status.loadingModel": "Načítání modelu ONNX…",
      "status.computing": "Výpočet {name} – {week} · {n} nových buněk [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} buněk ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} buněk ({step}°) [z mezipaměti]",
      "status.richnessDone": "Druhová bohatost – {week} · {n} buněk ({step}°)",
      "status.richnessCached": "Druhová bohatost – {week} · {n} buněk ({step}°) [z mezipaměti]",
      "status.predicting": "Předpověď druhů na ({lat}, {lon}) týden {week}…",
      "status.predicting48": "Předpověď 48 týdnů na ({lat}, {lon})…",
      "status.spResult": "{n} druhů nad {p}% na ({lat}, {lon})",
      "status.error": "Chyba: {msg}",
      "sp.summary": "{lat}°, {lon}° · Týden {week} · {n} druhů nad {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} druhů nad {p}% prům. · normalizováno na {max}%",
      "bc.avg": "{p}% prům.",
      "bc.max": "{p}% max.",
      "week.fmt": "Týden {w} ({period} {month})",
      "loc.savePrompt": "Pojmenujte toto místo:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (váhy CC BY-SA 4.0). Kód aplikace MIT. Předpovědi jsou odhady — nikoli skutečnost.",
      "footer.lastchange": "Poslední změna: {t}",
      "about.title": "ℹ︎ O modelu a jak se hodnoty počítají",
      "about.html":
        "<h4>Model prostředí</h4>" +
        "<p>Tento nástroj spouští <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — prostorově-časovou neuronovou síť — zcela ve vašem prohlížeči prostřednictvím ONNX Runtime Web. Z <b>zeměpisné šířky</b>, <b>zeměpisné délky</b> a <b>týdne v roce</b> (1–48; model dělí rok na 48 týdnů po přibližně 7,6 dnech) předpovídá <b>pravděpodobnost výskytu</b> (0–100 %) pro každý z 12 012 druhů ptáků, savců, obojživelníků a hmyzu. Pravděpodobnost vyjadřuje, jak je pravděpodobné, že se druh na daném místě v dané roční době vyskytuje, a byla naučena z celosvětových záznamů o výskytu a environmentálních proměnných. Jedná se o modelovaný odhad — nikoli o počet pozorování ani záruku.</p>" +
        "<h4>Zobrazení mapy</h4>" +
        "<ul>" +
        "<li><b>Areál druhu</b> — pravděpodobnost jednoho vybraného druhu napříč mapou pro zvolený týden.</li>" +
        "<li><b>Druhová bohatost</b> — počet druhů, jejichž pravděpodobnost je v každé buňce mřížky alespoň 5 %, omezený na zvolenou skupinu druhů. ▶ Přehrát migraci animuje mapu týden po týdnu.</li>" +
        "</ul>" +
        "<p>Mapa se vyhodnocuje na mřížce buněk (3° široké při oddálení, až po 0,25° při přiblížení) a vykresluje se s bilineárním vyhlazením, takže barvy plynule přecházejí mezi středy buněk místo tvoření ostrých bloků. <b>Poznámka:</b> Areál druhu, Druhová bohatost a ▶ Přehrát migraci vyhodnocují model napříč mnoha buňkami mapy, proto se pro plynulý chod doporučuje moderní počítač s rychlým procesorem.</p>" +
        "<h4>Analýza místa (klikněte do mapy)</h4>" +
        "<ul>" +
        "<li><b>Časová osa</b> — pravděpodobnost každého druhu napříč všemi 48 týdny.</li>" +
        "<li><b>Pravděpodobnost</b> — teplotní mapa druh × týden (červená = nízká, zelená = vysoká), roztažená přes hodnoty aktuálně na obrazovce.</li>" +
        "<li><b>Přílety</b> — pro každý druh a týden skóre příletu <code>(P[následující týden] − P[předchozí týden]) ÷ max</code>, kde <code>max</code> je nejvyšší týdenní pravděpodobnost daného druhu za rok. Zelená = rostoucí pravděpodobnost (přílet), červená = klesající (odlet); týdny se přetáčejí přes hranici roku (1 ↔ 48).</li>" +
        "<li><b>Roční vrchol</b> — průběžný (kumulativní) součet týdenních skóre příletů, přeškálovaný na 0–100 (roční minimum = 0, vrchol = 100). Zvýrazňuje období roku, kdy je druh nejvíce přítomen.</li>" +
        "<li><b>Bodový graf</b> — skóre příletu aktuálního týdne (osa x) oproti pravděpodobnosti (osa y) pro nejlepší druhy, s tříditelnou tabulkou níže.</li>" +
        "</ul>" +
        "<h4>Seznam druhů — sloupec „Porovnat s“</h4>" +
        "<ul>" +
        "<li><b>Předchozí / Následující týden</b> a <b>Roční průměr</b> zobrazují změnu Δ = aktuální pravděpodobnost − porovnávaná hodnota.</li>" +
        "<li><b>Roční maximum</b> zobrazuje aktuální týden jako podíl ročního vrcholu druhu: <code>aktuální ÷ max za rok</code>. 100 % znamená, že zvolený týden je nejlepším týdnem daného druhu.</li>" +
        "</ul>" +
        "<h4>Technologie</h4>" +
        "<p>Model umělé inteligence běží <b>zcela ve vašem webovém prohlížeči</b> — neexistuje žádný server a vaše poloha se nikam neodesílá. Neuronová síť se stáhne jednou (~7 MB) a všechny předpovědi se počítají na vašem vlastním zařízení. Vytvořeno pomocí:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — spouští neuronovou síť v prohlížeči.</li>" +
        "<li><b>Web Workers</b> — inference běží mimo hlavní vlákno, takže rozhraní zůstává responzivní.</li>" +
        "<li><b>BirdNET Geomodel</b> — natrénovaný model, exportovaný do ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> s dlaždicemi OpenStreetMap / CARTO — interaktivní mapa.</li>" +
        "<li><b>Čisté HTML, CSS a JavaScript</b> — bez frameworku a bez build kroku; servírováno jako statický web (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; zpětná vazba</h4>" +
        "<p>Tento nástroj je zdarma k použití a zpětnou vazbu uvítáme na <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Vyvíjí se model prostředí specifický pro Norsko, jehož cílem je využít bohatší norská data než data z Google Earth Engine použitá v současném modelu. Cílem modelu prostředí je vylepšená aplikace pro detekci ptačího zpěvu (A!Birder) (ve vývoji). Tato stránka je vytvořena pro snadnou kontrolu kvality tohoto modelu.</p>" +
        "<p class=\"about-note\">Předpovědi jsou odhady modelu, nikoli skutečnost. Váhy modelu © tým BirdNET, licencováno CC BY-SA 4.0; mapové dlaždice © přispěvatelé OpenStreetMap, © CARTO.</p>",
    },
    et: {
      "app.title": "Liigid ja kontroll-loendid",
      "app.loading": "Mudeli, siltide ja liiginimede laadimine…",
      "app.failed": "Laadimine ebaõnnestus: {msg}",
      "ctrl.language": "Keel",
      "ctrl.settings": "Seaded",
      "ctrl.about": "Teave ja kuidas see töötab",
      "ctrl.mode": "Režiim",
      "ctrl.group": "Liigirühm",
      "group.all": "Kõik rühmad",
      "group.aves": "Linnud",
      "group.mammalia": "Imetajad",
      "group.amphibia": "Kahepaiksed",
      "group.insecta": "Putukad",
      "mode.range": "Liigi levik",
      "mode.richness": "Liigirikkus",
      "mode.list": "📍 Liiginimekiri",
      "mode.field": "📍 Välikontroll-loend",
      "btn.clear": "Tühjenda",
      "act.heard": "Kuuldud",
      "act.flying": "Lennus",
      "act.feeding": "Toitumas",
      "act.resting": "Puhkamas",
      "act.breeding": "Pesitsemas",
      "mode.barchart": "📍 Ränne",
      "ctrl.species": "Liik",
      "ph.species": "Otsi liiki…",
      "ctrl.week": "Nädal",
      "ctrl.bcthreshold": "Tõenäosusvahemik",
      "ctrl.compare": "Võrdle",
      "compare.none": "— puudub —",
      "compare.prev": "Eelmine nädal",
      "compare.next": "Järgmine nädal",
      "compare.mean": "Aasta keskmine",
      "compare.max": "Aasta maksimum",
      "compare.annualtop": "Aasta tipp",
      "ctrl.secondlang": "2. nimi",
      "ctrl.savedloc": "Salvestatud asukohad",
      "ph.savedloc": "Salvestatud asukohti veel pole",
      "loc.delete": "Kustuta asukoht",
      "ctrl.hidden": "Peidetud liigid",
      "loc.unhide": "Näita uuesti",
      "menu.filter": "Filtreeri",
      "menu.hide": "Ära näita",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (heli)",
      "menu.recent": "Hiljutised vaatlused",
      "recent.none": "Läheduses ei leitud hiljutisi vaatlusi.",
      "recent.viewall": "Vaata kõiki iNaturalistis",
      "menu.distmap": "Levikukaart",
      "distmap.none": "Levikukaarti ei leitud. Ava Wikipedia leht:",
      "distmap.download": "Ava täispilt",
      "btn.saveloc": "★ Salvesta",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Esita ränne",
      "btn.pause": "⏸ Peata",
      "btn.newchecklist": "⭳ Salvesta",
      "btn.checklist": "✓ Kontroll-loend",
      "btn.print": "🖨 Prindi",
      "btn.close": "Sulge",
      "btn.delete": "Kustuta",
      "ctrl.checklists": "Kontroll-loend",
      "chk.namePrompt": "Anna sellele kontroll-loendile nimi:",
      "chk.createNew": "Loo uus",
      "chk.all": "Kõik",
      "chk.seen": "Nähtud",
      "chk.missing": "Puudub",
      "chk.count": "Arv",
      "chk.activity": "Tegevus",
      "fc.add": "Lisa vaatlus",
      "btn.logcsv": "⬇ Logi",
      "chk.merged": "Loendid ühendatud.",
      "chk.note": "NB! Selle kontroll-loendi tõenäosused ja muud väärtused on tuletatud tehisintellekti mudelist ning kujutavad endast üksnes ligikaudset hinnangut selle kohta, millised liigid antud asukohas tõenäoliselt esinevad — need ei ole kinnitatud vaatlused. Usaldusväärse liigiteatmiku leiad aadressilt <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Kontroll-loendi koostamine…",
      "th.change": "Muutus (Δ)",
      "th.locality": "Paikkond",
      "th.notes": "Märkused",
      "panel.spTitle": "Liigid asukohas",
      "panel.bcTitle": "Asukoha analüüs",
      "tab.timeline": "Ajatelg",
      "tab.prob": "Tõenäosus",
      "tab.arrival": "Saabumised",
      "tab.focus": "Aasta tipp",
      "tab.scatter": "Hajuvus",
      "analysis.empty": "Läve ületavaid liike pole.",
      "ctrl.filter": "Filtreeri liike",
      "place.nearby": "Lähedased kohad",
      "place.none": "Läheduses pole nimega kohti.",
      "ph.fieldtitle": "Asukoha nimi",
      "ph.filter": "Filtreeri liike…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Järjesta",
      "rank.arrival": "Saabumised",
      "rank.prob": "Tõenäosus",
      "rank.both": "Mõlemad",
      "ctrl.locate": "Mine minu asukohta",
      "status.locateError": "Sinu asukohta ei õnnestunud hankida.",
      "status.offline": "Võrguühenduseta — kasutatakse vahemällu salvestatud andmeid",
      "ctrl.basemap": "Aluskaart",
      "ctrl.hires": "Resolutsioon",
      "popup.title": "Liikide levikud ja kontroll-loendid",
      "popup.perf": "Liigi levik, liigirikkus ja ▶ Esita ränne hindavad mudelit paljudes kaardiruutudes, seega sujuva töö tagamiseks on soovitatav kiire protsessoriga kaasaegne arvuti.",
      "popup.ok": "OK",
      "popup.feedback": "Tagasiside ja kommentaarid on teretulnud aadressil:",
      "basemap.dark": "Tume",
      "basemap.light": "Hele",
      "basemap.streets": "Tänavad",
      "basemap.topo": "Topograafiline",
      "basemap.satellite": "Satelliit",
      "scatter.xAxis": "Saabumine (käesolev nädal)",
      "scatter.yAxis": "Tõenäosus (käesolev nädal)",
      "th.rank": "#",
      "th.species": "Liik",
      "th.sci": "Teaduslik nimi",
      "th.prob": "Tõenäosus",
      "th.arrival": "Saabumine",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% {ref}-st",
      "legend.prob": "Esinemise tõenäosus",
      "legend.count": "Prognoositud liikide arv",
      "status.selectSpecies": "Vali liik, et näha selle prognoositud levikukaarti.",
      "status.loadingModel": "ONNX-mudeli laadimine…",
      "status.computing": "{name} arvutamine – {week} · {n} uut ruutu [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} ruutu ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} ruutu ({step}°) [vahemälust]",
      "status.richnessDone": "Liigirikkus – {week} · {n} ruutu ({step}°)",
      "status.richnessCached": "Liigirikkus – {week} · {n} ruutu ({step}°) [vahemälust]",
      "status.predicting": "Liikide prognoosimine asukohas ({lat}, {lon}) nädalal {week}…",
      "status.predicting48": "48 nädala prognoosimine asukohas ({lat}, {lon})…",
      "status.spResult": "{n} liiki üle {p}% asukohas ({lat}, {lon})",
      "status.error": "Viga: {msg}",
      "sp.summary": "{lat}°, {lon}° · Nädal {week} · {n} liiki üle {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} liiki üle {p}% keskmise · normaliseeritud väärtusele {max}%",
      "bc.avg": "{p}% keskm.",
      "bc.max": "{p}% maks.",
      "week.fmt": "Nädal {w} ({period} {month})",
      "loc.savePrompt": "Anna sellele asukohale nimi:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Mudel: BirdNET Geomodel (kaalud CC BY-SA 4.0). Rakenduse kood MIT. Prognoosid on hinnangud — mitte tegelik tõde.",
      "footer.lastchange": "Viimane muudatus: {t}",
      "about.title": "ℹ︎ Teave mudeli kohta ja kuidas väärtusi arvutatakse",
      "about.html":
        "<h4>Elupaigamudel</h4>" +
        "<p>See tööriist käivitab <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — ruumilis-ajalise närvivõrgu — täielikult sinu brauseris ONNX Runtime Web abil. <b>Laiuskraadi</b>, <b>pikkuskraadi</b> ja <b>aasta nädala</b> (1–48; mudel jagab aasta 48 nädalaks, igaüks umbes 7,6 päeva) põhjal prognoosib see <b>esinemise tõenäosuse</b> (0–100%) igale 12 012 liigile lindude, imetajate, kahepaiksete ja putukate seas. Tõenäosus peegeldab, kui tõenäoliselt liik selles kohas sel aastaajal esineb, õpituna globaalsetest esinemisandmetest ja keskkonnamuutujatest. Tegemist on mudeli hinnanguga — mitte vaatluste arvu ega garantiiga.</p>" +
        "<h4>Kaardivaated</h4>" +
        "<ul>" +
        "<li><b>Liigi levik</b> — ühe valitud liigi tõenäosus üle kaardi valitud nädalal.</li>" +
        "<li><b>Liigirikkus</b> — nende liikide arv, mille tõenäosus on igas võrgukastis vähemalt 5%, piiratuna valitud liigirühmaga. ▶ Esita ränne animeerib kaarti nädalate kaupa.</li>" +
        "</ul>" +
        "<p>Kaarti hinnatakse ruutude võrgustikul (3° lai eemale suumituna, kuni 0,25° sisse suumituna) ning joonistatakse bilineaarse pehmendusega, nii et värvid sulanduvad ruutude keskpunktide vahel, mitte ei moodusta teravaid plokke. <b>Märkus:</b> Liigi levik, liigirikkus ja ▶ Esita ränne hindavad mudelit paljudes kaardiruutudes, seega sujuva töö tagamiseks on soovitatav kiire protsessoriga kaasaegne arvuti.</p>" +
        "<h4>Asukoha analüüs (klõpsa kaardil)</h4>" +
        "<ul>" +
        "<li><b>Ajatelg</b> — iga liigi tõenäosus kõigil 48 nädalal.</li>" +
        "<li><b>Tõenäosus</b> — liik × nädal soojuskaart (punane = madal, roheline = kõrge), venitatud üle hetkel ekraanil olevate väärtuste.</li>" +
        "<li><b>Saabumised</b> — iga liigi ja nädala kohta saabumisskoor <code>(P[järgmine nädal] − P[eelmine nädal]) ÷ max</code>, kus <code>max</code> on selle liigi suurim nädalane tõenäosus aastas. Roheline = tõenäosus tõuseb (saabub), punane = langeb (lahkub); nädalad keerduvad ümber aastapiiri (1 ↔ 48).</li>" +
        "<li><b>Aasta tipp</b> — nädalaste saabumisskooride jooksev (kumulatiivne) summa, ümberskaleeritud vahemikku 0–100 (aasta miinimum = 0, tipp = 100). See toob esile selle aastaosa, mil liik on kõige enam kohal.</li>" +
        "<li><b>Hajuvus</b> — käesoleva nädala saabumisskoor (x-telg) versus tõenäosus (y-telg) tippliikide kohta, all sorditav tabel.</li>" +
        "</ul>" +
        "<h4>Liiginimekiri — veerg „Võrdle“</h4>" +
        "<ul>" +
        "<li><b>Eelmine / järgmine nädal</b> ja <b>aasta keskmine</b> näitavad muutust Δ = praegune tõenäosus − võrdlusväärtus.</li>" +
        "<li><b>Aasta maksimum</b> näitab käesolevat nädalat osana liigi aasta tipust: <code>praegune ÷ aasta max</code>. 100% tähendab, et valitud nädal on selle liigi parim nädal.</li>" +
        "</ul>" +
        "<h4>Tehnoloogia</h4>" +
        "<p>Tehisintellekti mudel töötab <b>täielikult sinu veebibrauseris</b> — serverit pole ja sinu asukohta ei saadeta kunagi kuhugi. Närvivõrk laaditakse alla üks kord (~7 MB) ja kõik prognoosid arvutatakse sinu enda seadmes. Ehitatud kasutades:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — käivitab närvivõrgu brauseris.</li>" +
        "<li><b>Web Workers</b> — järeldus jookseb põhilõimest eraldi, nii et liides püsib reageeriv.</li>" +
        "<li><b>BirdNET Geomodel</b> — treenitud mudel, eksporditud ONNX-i (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> koos OpenStreetMap / CARTO paanidega — interaktiivne kaart.</li>" +
        "<li><b>Lihtne HTML, CSS ja JavaScript</b> — raamistikku ega ehitussammu pole; serveeritakse staatilise saidina (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; tagasiside</h4>" +
        "<p>See tööriist on tasuta kasutatav ja tagasiside on teretulnud aadressil <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Arendamisel on Norra-spetsiifiline elupaigamudel, mille eesmärk on kasutada rikkalikumaid Norra andmeid kui praeguses mudelis kasutatud Google Earth Engine'i andmed. Elupaigamudeli eesmärk on täiustatud linnulaulu tuvastamise rakendus (A!Birder) (arendamisel). See leht on loodud selle mudeli lihtsaks kvaliteedikontrolliks.</p>" +
        "<p class=\"about-note\">Prognoosid on mudeli hinnangud, mitte tegelik tõde. Mudeli kaalud © BirdNET-i meeskond, litsentsitud CC BY-SA 4.0; kaardipaanid © OpenStreetMap kaastöölised, © CARTO.</p>",
    },
    lt: {
      "app.title": "Rūšys ir kontroliniai sąrašai",
      "app.loading": "Įkeliamas modelis, žymės ir rūšių pavadinimai…",
      "app.failed": "Nepavyko įkelti: {msg}",
      "ctrl.language": "Kalba",
      "ctrl.settings": "Nustatymai",
      "ctrl.about": "Apie ir kaip tai veikia",
      "ctrl.mode": "Režimas",
      "ctrl.group": "Rūšių grupė",
      "group.all": "Visos grupės",
      "group.aves": "Paukščiai",
      "group.mammalia": "Žinduoliai",
      "group.amphibia": "Varliagyviai",
      "group.insecta": "Vabzdžiai",
      "mode.range": "Rūšies paplitimas",
      "mode.richness": "Rūšių gausa",
      "mode.list": "📍 Rūšių sąrašas",
      "mode.field": "📍 Lauko kontrolinis sąrašas",
      "btn.clear": "Išvalyti",
      "act.heard": "Girdėta",
      "act.flying": "Skrendanti",
      "act.feeding": "Maitinasi",
      "act.resting": "Ilsisi",
      "act.breeding": "Veisiasi",
      "mode.barchart": "📍 Migracija",
      "ctrl.species": "Rūšis",
      "ph.species": "Ieškoti rūšies…",
      "ctrl.week": "Savaitė",
      "ctrl.bcthreshold": "Tikimybės intervalas",
      "ctrl.compare": "Palyginti su",
      "compare.none": "— nėra —",
      "compare.prev": "Praėjusi savaitė",
      "compare.next": "Kita savaitė",
      "compare.mean": "Metinis vidurkis",
      "compare.max": "Metinis maksimumas",
      "compare.annualtop": "Metinis pikas",
      "ctrl.secondlang": "2-asis pavadinimas",
      "ctrl.savedloc": "Įrašytos vietos",
      "ph.savedloc": "Dar nėra įrašytų vietų",
      "loc.delete": "Ištrinti vietą",
      "ctrl.hidden": "Paslėptos rūšys",
      "loc.unhide": "Rodyti vėl",
      "menu.filter": "Filtruoti",
      "menu.hide": "Nerodyti",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (garsas)",
      "menu.recent": "Naujausi aptikimai",
      "recent.none": "Netoliese naujausių aptikimų nerasta.",
      "recent.viewall": "Peržiūrėti visus iNaturalist",
      "menu.distmap": "Paplitimo žemėlapis",
      "distmap.none": "Paplitimo žemėlapis nerastas. Atverkite Wikipedia puslapį:",
      "distmap.download": "Atverti visą vaizdą",
      "btn.saveloc": "★ Įrašyti",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Leisti migraciją",
      "btn.pause": "⏸ Pauzė",
      "btn.newchecklist": "⭳ Įrašyti",
      "btn.checklist": "✓ Kontrolinis sąrašas",
      "btn.print": "🖨 Spausdinti",
      "btn.close": "Uždaryti",
      "btn.delete": "Ištrinti",
      "ctrl.checklists": "Kontrolinis sąrašas",
      "chk.namePrompt": "Pavadinkite šį kontrolinį sąrašą:",
      "chk.createNew": "Sukurti naują",
      "chk.all": "Visi",
      "chk.seen": "Matyti",
      "chk.missing": "Trūksta",
      "chk.count": "Kiekis",
      "chk.activity": "Veikla",
      "fc.add": "Pridėti stebėjimą",
      "btn.logcsv": "⬇ Žurnalas",
      "chk.merged": "Sąrašai sujungti.",
      "chk.note": "Pastaba: šio kontrolinio sąrašo tikimybės ir kitos reikšmės yra gautos iš DI modelio ir atspindi tik apytikslį rūšių, galinčių pasitaikyti šioje vietoje, įvertinimą — tai nėra patvirtinti stebėjimai. Patikimą rūšių žinyną rasite <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Sudaromas kontrolinis sąrašas…",
      "th.change": "Pokytis (Δ)",
      "th.locality": "Vietovė",
      "th.notes": "Pastabos",
      "panel.spTitle": "Rūšys vietoje",
      "panel.bcTitle": "Vietos analizė",
      "tab.timeline": "Laiko juosta",
      "tab.prob": "Tikimybė",
      "tab.arrival": "Atskridimai",
      "tab.focus": "Metinis pikas",
      "tab.scatter": "Taškinė diagrama",
      "analysis.empty": "Nėra rūšių virš slenksčio.",
      "ctrl.filter": "Filtruoti rūšis",
      "place.nearby": "Vietos netoliese",
      "place.none": "Netoliese nėra įvardytų vietų.",
      "ph.fieldtitle": "Vietos pavadinimas",
      "ph.filter": "Filtruoti rūšis…",
      "ctrl.topN": "Geriausi N",
      "ctrl.rankby": "Rikiuoti pagal",
      "rank.arrival": "Atskridimai",
      "rank.prob": "Tikimybė",
      "rank.both": "Abu",
      "ctrl.locate": "Eiti į mano vietą",
      "status.locateError": "Nepavyko nustatyti jūsų vietos.",
      "status.offline": "Neprisijungus — naudojami talpykloje saugomi duomenys",
      "ctrl.basemap": "Bazinis žemėlapis",
      "ctrl.hires": "Skiriamoji geba",
      "popup.title": "Rūšių paplitimas ir kontroliniai sąrašai",
      "popup.perf": "Rūšies paplitimas, Rūšių gausa ir ▶ Leisti migraciją įvertina modelį daugelyje žemėlapio langelių, todėl sklandžiam veikimui rekomenduojamas šiuolaikinis kompiuteris su greitu procesoriumi.",
      "popup.ok": "Gerai",
      "popup.feedback": "Atsiliepimų ir komentarų laukiame adresu:",
      "basemap.dark": "Tamsus",
      "basemap.light": "Šviesus",
      "basemap.streets": "Gatvės",
      "basemap.topo": "Topografinis",
      "basemap.satellite": "Palydovinis",
      "scatter.xAxis": "Atskridimas (dabartinė savaitė)",
      "scatter.yAxis": "Tikimybė (dabartinė savaitė)",
      "th.rank": "#",
      "th.species": "Rūšis",
      "th.sci": "Mokslinis pavadinimas",
      "th.prob": "Tikimybė",
      "th.arrival": "Atskridimas",
      "th.delta": "Δ lyginant su {ref}",
      "th.ratio": "{ref} proc.",
      "legend.prob": "Pasitaikymo tikimybė",
      "legend.count": "Prognozuojamas rūšių skaičius",
      "status.selectSpecies": "Pasirinkite rūšį, kad pamatytumėte jos prognozuojamo paplitimo žemėlapį.",
      "status.loadingModel": "Įkeliamas ONNX modelis…",
      "status.computing": "Skaičiuojama {name} – {week} · {n} naujų langelių [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} langelių ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} langelių ({step}°) [iš talpyklos]",
      "status.richnessDone": "Rūšių gausa – {week} · {n} langelių ({step}°)",
      "status.richnessCached": "Rūšių gausa – {week} · {n} langelių ({step}°) [iš talpyklos]",
      "status.predicting": "Prognozuojamos rūšys ({lat}, {lon}) {week} savaitę…",
      "status.predicting48": "Prognozuojamos 48 savaitės ({lat}, {lon})…",
      "status.spResult": "{n} rūšių virš {p}% ({lat}, {lon})",
      "status.error": "Klaida: {msg}",
      "sp.summary": "{lat}°, {lon}° · {week} savaitė · {n} rūšių virš {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} rūšių virš {p}% vid. · normalizuota iki {max}%",
      "bc.avg": "{p}% vid.",
      "bc.max": "{p}% maks.",
      "week.fmt": "Savaitė {w} ({period} {month})",
      "loc.savePrompt": "Pavadinkite šią vietą:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modelis: BirdNET Geomodel (svoriai CC BY-SA 4.0). Programos kodas MIT. Prognozės yra įverčiai — ne galutinė tiesa.",
      "footer.lastchange": "Paskutinis pakeitimas: {t}",
      "about.title": "ℹ︎ Apie modelį ir kaip skaičiuojamos reikšmės",
      "about.html":
        "<h4>Buveinių modelis</h4>" +
        "<p>Šis įrankis paleidžia <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — erdvėlaikinį neuroninį tinklą — visiškai jūsų naršyklėje per ONNX Runtime Web. Iš <b>platumos</b>, <b>ilgumos</b> ir <b>metų savaitės</b> (1–48; modelis padalija metus į 48 maždaug 7,6 dienos trukmės savaites) jis prognozuoja <b>pasitaikymo tikimybę</b> (0–100%) kiekvienai iš 12 012 rūšių tarp paukščių, žinduolių, varliagyvių ir vabzdžių. Tikimybė atspindi, kokia tikimybė, kad rūšis ten bus tuo metų laiku, ir yra išmokta iš pasaulinių pasitaikymo įrašų bei aplinkos kintamųjų. Tai modeliuotas įvertis — ne stebėjimų skaičius ar garantija.</p>" +
        "<h4>Žemėlapio rodiniai</h4>" +
        "<ul>" +
        "<li><b>Rūšies paplitimas</b> — vienos pasirinktos rūšies tikimybė visame žemėlapyje pasirinktą savaitę.</li>" +
        "<li><b>Rūšių gausa</b> — rūšių, kurių tikimybė yra bent 5% kiekviename tinklelio langelyje, skaičius, apribotas pasirinkta rūšių grupe. ▶ Leisti migraciją animuoja žemėlapį savaitę po savaitės.</li>" +
        "</ul>" +
        "<p>Žemėlapis vertinamas langelių tinklelyje (3° pločio nutolinus, iki 0,25° priartinus) ir piešiamas su dvitiesiu glodinimu, todėl spalvos susilieja tarp langelių centrų, o ne sudaro kietus blokus. <b>Pastaba:</b> Rūšies paplitimas, Rūšių gausa ir ▶ Leisti migraciją įvertina modelį daugelyje žemėlapio langelių, todėl sklandžiam veikimui rekomenduojamas šiuolaikinis kompiuteris su greitu procesoriumi.</p>" +
        "<h4>Vietos analizė (spustelėkite žemėlapį)</h4>" +
        "<ul>" +
        "<li><b>Laiko juosta</b> — kiekvienos rūšies tikimybė per visas 48 savaites.</li>" +
        "<li><b>Tikimybė</b> — rūšių × savaičių šilumos žemėlapis (raudona = maža, žalia = didelė), ištemptas per ekrane šiuo metu esančias reikšmes.</li>" +
        "<li><b>Atskridimai</b> — kiekvienai rūšiai ir savaitei atskridimo įvertis <code>(P[kita savaitė] − P[praėjusi savaitė]) ÷ max</code>, kur <code>max</code> yra tos rūšies didžiausia savaitinė tikimybė per metus. Žalia = tikimybė kyla (atskrenda), raudona = krenta (išskrenda); savaitės susisuka ties metų riba (1 ↔ 48).</li>" +
        "<li><b>Metinis pikas</b> — kaupiamoji (bėganti) savaitinių atskridimo įverčių suma, perskalduota į 0–100 (metų minimumas = 0, pikas = 100). Ji išryškina metų dalį, kai rūšis labiausiai pasitaiko.</li>" +
        "<li><b>Taškinė diagrama</b> — dabartinės savaitės atskridimo įvertis (x ašis) palyginti su tikimybe (y ašis) populiariausioms rūšims, su rikiuojama lentele apačioje.</li>" +
        "</ul>" +
        "<h4>Rūšių sąrašas — stulpelis „Palyginti su“</h4>" +
        "<ul>" +
        "<li><b>Praėjusi / Kita savaitė</b> ir <b>Metinis vidurkis</b> rodo pokytį Δ = dabartinė tikimybė − palyginimo reikšmė.</li>" +
        "<li><b>Metinis maksimumas</b> rodo dabartinę savaitę kaip rūšies metinio piko dalį: <code>dabartinė ÷ max per metus</code>. 100% reiškia, kad pasirinkta savaitė yra geriausia tos rūšies savaitė.</li>" +
        "</ul>" +
        "<h4>Technologijos</h4>" +
        "<p>DI modelis veikia <b>visiškai jūsų interneto naršyklėje</b> — nėra serverio ir jūsų vieta niekur nesiunčiama. Neuroninis tinklas atsisiunčiamas vieną kartą (~7 MB), o visos prognozės skaičiuojamos jūsų pačių įrenginyje. Sukurta su:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — paleidžia neuroninį tinklą naršyklėje.</li>" +
        "<li><b>Web Workers</b> — išvada vykdoma ne pagrindinėje gijoje, todėl sąsaja išlieka reaguojanti.</li>" +
        "<li><b>BirdNET Geomodel</b> — apmokytas modelis, eksportuotas į ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> su OpenStreetMap / CARTO plytelėmis — interaktyvus žemėlapis.</li>" +
        "<li><b>Grynas HTML, CSS ir JavaScript</b> — be karkaso ir be kūrimo žingsnio; pateikiama kaip statinė svetainė (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projektas &amp; atsiliepimai</h4>" +
        "<p>Šis įrankis yra nemokamas, o atsiliepimų laukiame adresu <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Norvegijai pritaikytas buveinių modelis kuriamas, siekiant naudoti turtingesnius Norvegijos duomenis nei dabartiniame modelyje naudojami Google Earth Engine duomenys. Buveinių modelio tikslas yra patobulinta paukščių dainų aptikimo programa (A!Birder) (kuriama). Šis puslapis sukurtas patogiai to modelio kokybės kontrolei.</p>" +
        "<p class=\"about-note\">Prognozės yra modelio įverčiai, o ne galutinė tiesa. Modelio svoriai © BirdNET komanda, licencijuota CC BY-SA 4.0; žemėlapio plytelės © OpenStreetMap bendraautoriai, © CARTO.</p>",
    },
    fi: {
      "app.title": "Lajit ja tarkistuslistat",
      "app.loading": "Ladataan mallia, otsikoita ja lajinimiä…",
      "app.failed": "Lataus epäonnistui: {msg}",
      "ctrl.language": "Kieli",
      "ctrl.settings": "Asetukset",
      "ctrl.about": "Tietoja ja toimintaperiaate",
      "ctrl.mode": "Tila",
      "ctrl.group": "Lajiryhmä",
      "group.all": "Kaikki ryhmät",
      "group.aves": "Linnut",
      "group.mammalia": "Nisäkkäät",
      "group.amphibia": "Sammakkoeläimet",
      "group.insecta": "Hyönteiset",
      "mode.range": "Lajin levinneisyys",
      "mode.richness": "Lajirunsaus",
      "mode.list": "📍 Lajilista",
      "mode.field": "📍 Maastotarkistuslista",
      "btn.clear": "Tyhjennä",
      "act.heard": "Kuultu",
      "act.flying": "Lentää",
      "act.feeding": "Ruokailee",
      "act.resting": "Lepää",
      "act.breeding": "Pesii",
      "mode.barchart": "📍 Muutto",
      "ctrl.species": "Laji",
      "ph.species": "Hae lajeja…",
      "ctrl.week": "Viikko",
      "ctrl.bcthreshold": "Todennäköisyysväli",
      "ctrl.compare": "Vertaa",
      "compare.none": "— ei mitään —",
      "compare.prev": "Edellinen viikko",
      "compare.next": "Seuraava viikko",
      "compare.mean": "Vuoden keskiarvo",
      "compare.max": "Vuoden maksimi",
      "compare.annualtop": "Vuoden huippu",
      "ctrl.secondlang": "2. nimi",
      "ctrl.savedloc": "Tallennetut sijainnit",
      "ph.savedloc": "Ei vielä tallennettuja sijainteja",
      "loc.delete": "Poista sijainti",
      "ctrl.hidden": "Piilotetut lajit",
      "loc.unhide": "Näytä uudelleen",
      "menu.filter": "Suodata",
      "menu.hide": "Älä näytä",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (ääni)",
      "menu.recent": "Viimeaikaiset havainnot",
      "recent.none": "Lähistöltä ei löytynyt viimeaikaisia havaintoja.",
      "recent.viewall": "Katso kaikki iNaturalistissa",
      "menu.distmap": "Levinneisyyskartta",
      "distmap.none": "Levinneisyyskarttaa ei löytynyt. Avaa Wikipedia-sivu:",
      "distmap.download": "Avaa koko kuva",
      "btn.saveloc": "★ Tallenna",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Toista muutto",
      "btn.pause": "⏸ Tauko",
      "btn.newchecklist": "⭳ Tallenna",
      "btn.checklist": "✓ Tarkistuslista",
      "btn.print": "🖨 Tulosta",
      "btn.close": "Sulje",
      "btn.delete": "Poista",
      "ctrl.checklists": "Tarkistuslista",
      "chk.namePrompt": "Anna tälle tarkistuslistalle nimi:",
      "chk.createNew": "Luo uusi",
      "chk.all": "Kaikki",
      "chk.seen": "Nähty",
      "chk.missing": "Puuttuu",
      "chk.count": "Lukumäärä",
      "chk.activity": "Toiminta",
      "fc.add": "Lisää havainto",
      "btn.logcsv": "⬇ Loki",
      "chk.merged": "Listat yhdistetty.",
      "chk.note": "Huom: Tämän tarkistuslistan todennäköisyydet ja muut arvot on johdettu tekoälymallista ja edustavat vain arviota lajeista, joita tässä sijainnissa todennäköisesti esiintyy — ne eivät ole vahvistettuja havaintoja. Luotettavan lajiviitteen saat osoitteesta <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Rakennetaan tarkistuslistaa…",
      "th.change": "Muutos (Δ)",
      "th.locality": "Paikkakunta",
      "th.notes": "Muistiinpanot",
      "panel.spTitle": "Lajit sijainnissa",
      "panel.bcTitle": "Sijainnin analyysi",
      "tab.timeline": "Aikajana",
      "tab.prob": "Todennäköisyys",
      "tab.arrival": "Saapumiset",
      "tab.focus": "Vuoden huippu",
      "tab.scatter": "Hajontakaavio",
      "analysis.empty": "Ei lajeja kynnysarvon yläpuolella.",
      "ctrl.filter": "Suodata lajeja",
      "place.nearby": "Lähistön paikat",
      "place.none": "Ei nimettyjä paikkoja lähistöllä.",
      "ph.fieldtitle": "Sijainnin nimi",
      "ph.filter": "Suodata lajeja…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Järjestysperuste",
      "rank.arrival": "Saapumiset",
      "rank.prob": "Todennäköisyys",
      "rank.both": "Molemmat",
      "ctrl.locate": "Siirry sijaintiini",
      "status.locateError": "Sijaintiasi ei saatu selville.",
      "status.offline": "Offline — käytetään välimuistissa olevia tietoja",
      "ctrl.basemap": "Taustakartta",
      "ctrl.hires": "Tarkkuus",
      "popup.title": "Lajien levinneisyydet ja tarkistuslistat",
      "popup.perf": "Lajin levinneisyys, Lajirunsaus ja ▶ Toista muutto arvioivat mallia useissa kartan soluissa, joten sujuvan suorituskyvyn takaamiseksi suositellaan nykyaikaista tietokonetta, jossa on nopea suoritin.",
      "popup.ok": "OK",
      "popup.feedback": "Palautetta ja kommentteja otetaan vastaan osoitteessa:",
      "basemap.dark": "Tumma",
      "basemap.light": "Vaalea",
      "basemap.streets": "Kadut",
      "basemap.topo": "Topografinen",
      "basemap.satellite": "Satelliitti",
      "scatter.xAxis": "Saapuminen (kuluva viikko)",
      "scatter.yAxis": "Todennäköisyys (kuluva viikko)",
      "th.rank": "#",
      "th.species": "Laji",
      "th.sci": "Tieteellinen nimi",
      "th.prob": "Todennäköisyys",
      "th.arrival": "Saapuminen",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% arvosta {ref}",
      "legend.prob": "Esiintymistodennäköisyys",
      "legend.count": "Ennustettu lajimäärä",
      "status.selectSpecies": "Valitse laji nähdäksesi sen ennustetun levinneisyyskartan.",
      "status.loadingModel": "Ladataan ONNX-mallia…",
      "status.computing": "Lasketaan {name} – {week} · {n} uutta solua [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} solua ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} solua ({step}°) [välimuistissa]",
      "status.richnessDone": "Lajirunsaus – {week} · {n} solua ({step}°)",
      "status.richnessCached": "Lajirunsaus – {week} · {n} solua ({step}°) [välimuistissa]",
      "status.predicting": "Ennustetaan lajeja sijainnissa ({lat}, {lon}) viikolla {week}…",
      "status.predicting48": "Ennustetaan 48 viikkoa sijainnissa ({lat}, {lon})…",
      "status.spResult": "{n} lajia yli {p}% sijainnissa ({lat}, {lon})",
      "status.error": "Virhe: {msg}",
      "sp.summary": "{lat}°, {lon}° · Viikko {week} · {n} lajia yli {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} lajia yli {p}% keskimäärin · normalisoitu arvoon {max}%",
      "bc.avg": "{p}% keskim.",
      "bc.max": "{p}% maks.",
      "week.fmt": "Viikko {w} ({period} {month})",
      "loc.savePrompt": "Anna tälle sijainnille nimi:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Malli: BirdNET Geomodel (painot CC BY-SA 4.0). Sovelluskoodi MIT. Ennusteet ovat arvioita — eivät absoluuttista totuutta.",
      "footer.lastchange": "Viimeisin muutos: {t}",
      "about.title": "ℹ︎ Tietoja mallista ja arvojen laskennasta",
      "about.html":
        "<h4>Habitaattimalli</h4>" +
        "<p>Tämä työkalu ajaa <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> -mallin — spatiotemporaalisen neuroverkon — kokonaan selaimessasi ONNX Runtime Webin avulla. <b>Leveysasteesta</b>, <b>pituusasteesta</b> ja <b>vuoden viikosta</b> (1–48; malli jakaa vuoden 48 viikkoon, joista kukin on noin 7,6 päivää) se ennustaa <b>esiintymistodennäköisyyden</b> (0–100 %) kullekin 12 012 lajille lintujen, nisäkkäiden, sammakkoeläinten ja hyönteisten joukosta. Todennäköisyys kuvastaa, kuinka todennäköisesti laji esiintyy kyseisessä paikassa kyseisenä vuodenaikana, ja se on opittu maailmanlaajuisista esiintymistiedoista ja ympäristömuuttujista. Kyseessä on mallinnettu arvio — ei havaintomäärä eikä takuu.</p>" +
        "<h4>Karttanäkymät</h4>" +
        "<ul>" +
        "<li><b>Lajin levinneisyys</b> — yhden valitun lajin todennäköisyys kartalla valitulla viikolla.</li>" +
        "<li><b>Lajirunsaus</b> — niiden lajien lukumäärä, joiden todennäköisyys on vähintään 5 % kussakin ruudussa, rajattuna valittuun lajiryhmään. ▶ Toista muutto animoi kartan viikko viikolta.</li>" +
        "</ul>" +
        "<p>Karttaa arvioidaan solujen ruudukolla (3° leveä loitonnettaessa, aina 0,25°:een asti lähennettäessä) ja se piirretään bilineaarisella pehmennyksellä, joten värit sulautuvat solujen keskipisteiden välillä sen sijaan, että muodostaisivat teräviä lohkoja. <b>Huom:</b> Lajin levinneisyys, Lajirunsaus ja ▶ Toista muutto arvioivat mallia useissa kartan soluissa, joten sujuvan suorituskyvyn takaamiseksi suositellaan nykyaikaista tietokonetta, jossa on nopea suoritin.</p>" +
        "<h4>Sijainnin analyysi (napsauta karttaa)</h4>" +
        "<ul>" +
        "<li><b>Aikajana</b> — kunkin lajin todennäköisyys kaikkien 48 viikon aikana.</li>" +
        "<li><b>Todennäköisyys</b> — laji × viikko -lämpökartta (punainen = matala, vihreä = korkea), venytettynä näytöllä parhaillaan oleviin arvoihin.</li>" +
        "<li><b>Saapumiset</b> — kullekin lajille ja viikolle saapumispistemäärä <code>(P[seuraava viikko] − P[edellinen viikko]) ÷ max</code>, jossa <code>max</code> on kyseisen lajin korkein viikoittainen todennäköisyys vuoden aikana. Vihreä = todennäköisyys nousee (saapuu), punainen = laskee (lähtee); viikot kiertävät vuoden rajan ympäri (1 ↔ 48).</li>" +
        "<li><b>Vuoden huippu</b> — viikoittaisten saapumispistemäärien juokseva (kumulatiivinen) summa, skaalattuna uudelleen välille 0–100 (vuoden alin = 0, sen huippu = 100). Se korostaa sitä osaa vuodesta, jolloin laji on eniten läsnä.</li>" +
        "<li><b>Hajontakaavio</b> — kuluvan viikon saapumispistemäärä (x-akseli) verrattuna todennäköisyyteen (y-akseli) suosituimmille lajeille, alla lajiteltava taulukko.</li>" +
        "</ul>" +
        "<h4>Lajilista — ”Vertaa”-sarake</h4>" +
        "<ul>" +
        "<li><b>Edellinen / Seuraava viikko</b> ja <b>Vuoden keskiarvo</b> näyttävät muutoksen Δ = nykyinen todennäköisyys − vertailuarvo.</li>" +
        "<li><b>Vuoden maksimi</b> näyttää kuluvan viikon osuutena lajin vuotuisesta huipusta: <code>nykyinen ÷ vuoden max</code>. 100 % tarkoittaa, että valittu viikko on kyseisen lajin paras viikko.</li>" +
        "</ul>" +
        "<h4>Teknologia</h4>" +
        "<p>Tekoälymalli ajetaan <b>kokonaan verkkoselaimessasi</b> — palvelinta ei ole eikä sijaintiasi koskaan lähetetä mihinkään. Neuroverkko ladataan kerran (~7 MB) ja kaikki ennusteet lasketaan omalla laitteellasi. Rakennettu seuraavilla:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — ajaa neuroverkon selaimessa.</li>" +
        "<li><b>Web Workers</b> — päättely suoritetaan pääsäikeen ulkopuolella, joten käyttöliittymä pysyy responsiivisena.</li>" +
        "<li><b>BirdNET Geomodel</b> — koulutettu malli, viety ONNX-muotoon (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> ja OpenStreetMap / CARTO -karttaruudut — interaktiivinen kartta.</li>" +
        "<li><b>Pelkkä HTML, CSS ja JavaScript</b> — ei sovelluskehystä eikä käännösvaihetta; tarjotaan staattisena sivustona (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekti &amp; palaute</h4>" +
        "<p>Tämä työkalu on ilmainen käyttää, ja palautetta otetaan mielellään vastaan osoitteessa <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Norjaan kohdistettua habitaattimallia kehitetään parhaillaan, ja sen tavoitteena on hyödyntää rikkaampaa norjalaista dataa kuin nykyisessä mallissa käytettyä Google Earth Engine -dataa. Habitaattimallin tavoitteena on parannettu linnunlaulun tunnistussovellus (A!Birder) (kehitteillä). Tämä sivu on tehty kyseisen mallin helppoa laadunvalvontaa varten.</p>" +
        "<p class=\"about-note\">Ennusteet ovat mallin arvioita, eivät absoluuttista totuutta. Mallin painot © BirdNET-tiimi, lisensoitu CC BY-SA 4.0; karttaruudut © OpenStreetMap-tekijät, © CARTO.</p>",
    },
    da: {
      "app.title": "Arter & tjeklister",
      "app.loading": "Indlæser model, etiketter og artsnavne…",
      "app.failed": "Indlæsning mislykkedes: {msg}",
      "ctrl.language": "Sprog",
      "ctrl.settings": "Indstillinger",
      "ctrl.about": "Om & sådan virker det",
      "ctrl.mode": "Tilstand",
      "ctrl.group": "Artsgruppe",
      "group.all": "Alle grupper",
      "group.aves": "Fugle",
      "group.mammalia": "Pattedyr",
      "group.amphibia": "Padder",
      "group.insecta": "Insekter",
      "mode.range": "Artsudbredelse",
      "mode.richness": "Artsrigdom",
      "mode.list": "📍 Artsliste",
      "mode.field": "📍 Felttjekliste",
      "btn.clear": "Ryd",
      "act.heard": "Hørt",
      "act.flying": "Flyvende",
      "act.feeding": "Fouragerende",
      "act.resting": "Hvilende",
      "act.breeding": "Ynglende",
      "mode.barchart": "📍 Migration",
      "ctrl.species": "Art",
      "ph.species": "Søg art…",
      "ctrl.week": "Uge",
      "ctrl.bcthreshold": "Sandsynlighedsinterval",
      "ctrl.compare": "Sammenlign med",
      "compare.none": "— ingen —",
      "compare.prev": "Forrige uge",
      "compare.next": "Næste uge",
      "compare.mean": "Årsgennemsnit",
      "compare.max": "Årsmaksimum",
      "compare.annualtop": "Årets top",
      "ctrl.secondlang": "2. navn",
      "ctrl.savedloc": "Gemte placeringer",
      "ph.savedloc": "Ingen gemte placeringer endnu",
      "loc.delete": "Slet placering",
      "ctrl.hidden": "Skjulte arter",
      "loc.unhide": "Vis igen",
      "menu.filter": "Filtrér",
      "menu.hide": "Vis ikke",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (lyd)",
      "menu.recent": "Nylige observationer",
      "recent.none": "Ingen nylige observationer fundet i nærheden.",
      "recent.viewall": "Se alle på iNaturalist",
      "menu.distmap": "Udbredelseskort",
      "distmap.none": "Intet udbredelseskort fundet. Åbn Wikipedia-siden:",
      "distmap.download": "Åbn fuldt billede",
      "btn.saveloc": "★ Gem",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Afspil migration",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "⭳ Gem",
      "btn.checklist": "✓ Tjekliste",
      "btn.print": "🖨 Udskriv",
      "btn.close": "Luk",
      "btn.delete": "Slet",
      "ctrl.checklists": "Tjekliste",
      "chk.namePrompt": "Navngiv denne tjekliste:",
      "chk.createNew": "Opret ny",
      "chk.all": "Alle",
      "chk.seen": "Set",
      "chk.missing": "Mangler",
      "chk.count": "Antal",
      "chk.activity": "Aktivitet",
      "fc.add": "Tilføj observation",
      "btn.logcsv": "⬇ Log",
      "chk.merged": "Lister sammenflettet.",
      "chk.note": "NB: Sandsynlighederne og de øvrige værdier i denne tjekliste stammer fra en AI-model og repræsenterer kun et skøn over de arter, der sandsynligvis forekommer på dette sted — de er ikke bekræftede observationer. For en autoritativ artsreference, se <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "Opbygger tjekliste…",
      "th.change": "Ændring (Δ)",
      "th.locality": "Lokalitet",
      "th.notes": "Noter",
      "panel.spTitle": "Arter på placeringen",
      "panel.bcTitle": "Stedanalyse",
      "tab.timeline": "Tidslinje",
      "tab.prob": "Sandsynlighed",
      "tab.arrival": "Ankomster",
      "tab.focus": "Årets top",
      "tab.scatter": "Spredning",
      "analysis.empty": "Ingen arter over tærsklen.",
      "ctrl.filter": "Filtrér arter",
      "place.nearby": "Steder i nærheden",
      "place.none": "Ingen navngivne steder i nærheden.",
      "ph.fieldtitle": "Stednavn",
      "ph.filter": "Filtrér arter…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Rangér efter",
      "rank.arrival": "Ankomster",
      "rank.prob": "Sandsynlighed",
      "rank.both": "Begge",
      "ctrl.locate": "Gå til min placering",
      "status.locateError": "Kunne ikke hente din placering.",
      "status.offline": "Offline — bruger cachelagrede data",
      "ctrl.basemap": "Baggrundskort",
      "ctrl.hires": "Opløsning",
      "popup.title": "Artsudbredelser og tjeklister",
      "popup.perf": "Artsudbredelse, Artsrigdom og ▶ Afspil migration evaluerer modellen på tværs af mange kortceller, så en moderne computer med en hurtig CPU anbefales for jævn ydeevne.",
      "popup.ok": "OK",
      "popup.feedback": "Feedback og kommentarer er velkomne på:",
      "basemap.dark": "Mørk",
      "basemap.light": "Lys",
      "basemap.streets": "Gader",
      "basemap.topo": "Topografisk",
      "basemap.satellite": "Satellit",
      "scatter.xAxis": "Ankomst (aktuel uge)",
      "scatter.yAxis": "Sandsynlighed (aktuel uge)",
      "th.rank": "#",
      "th.species": "Art",
      "th.sci": "Videnskabeligt navn",
      "th.prob": "Sandsynlighed",
      "th.arrival": "Ankomst",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% af {ref}",
      "legend.prob": "Forekomstsandsynlighed",
      "legend.count": "Forudsagt antal arter",
      "status.selectSpecies": "Vælg en art for at se dens forudsagte udbredelseskort.",
      "status.loadingModel": "Indlæser ONNX-model…",
      "status.computing": "Beregner {name} – {week} · {n} nye celler [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} celler ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} celler ({step}°) [cachelagret]",
      "status.richnessDone": "Artsrigdom – {week} · {n} celler ({step}°)",
      "status.richnessCached": "Artsrigdom – {week} · {n} celler ({step}°) [cachelagret]",
      "status.predicting": "Forudsiger arter ved ({lat}, {lon}) uge {week}…",
      "status.predicting48": "Forudsiger 48 uger ved ({lat}, {lon})…",
      "status.spResult": "{n} arter over {p}% ved ({lat}, {lon})",
      "status.error": "Fejl: {msg}",
      "sp.summary": "{lat}°, {lon}° · Uge {week} · {n} arter over {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} arter over {p}% gns. · normaliseret til {max}%",
      "bc.avg": "{p}% gns.",
      "bc.max": "{p}% maks.",
      "week.fmt": "Uge {w} ({period} {month})",
      "loc.savePrompt": "Navngiv denne placering:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (vægte CC BY-SA 4.0). App-kode MIT. Forudsigelser er skøn — ikke faktiske data.",
      "footer.lastchange": "Sidste ændring: {t}",
      "about.title": "ℹ︎ Om modellen & hvordan værdier beregnes",
      "about.html":
        "<h4>Habitatmodellen</h4>" +
        "<p>Dette værktøj kører <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — et spatiotemporalt neuralt netværk — udelukkende i din browser via ONNX Runtime Web. Ud fra en <b>breddegrad</b>, <b>længdegrad</b> og <b>uge i året</b> (1–48; modellen opdeler året i 48 uger på cirka 7,6 dage) forudsiger den en <b>forekomstsandsynlighed</b> (0–100%) for hver af 12.012 arter på tværs af fugle, pattedyr, padder og insekter. Sandsynligheden afspejler, hvor sandsynligt det er, at en art er til stede dér på det tidspunkt af året, lært ud fra globale forekomstdata og miljøvariabler. Det er et modelleret skøn — ikke et antal observationer eller en garanti.</p>" +
        "<h4>Kortvisninger</h4>" +
        "<ul>" +
        "<li><b>Artsudbredelse</b> — sandsynligheden for én valgt art på tværs af kortet for den valgte uge.</li>" +
        "<li><b>Artsrigdom</b> — antallet af arter, hvis sandsynlighed er mindst 5% i hver gittercelle, begrænset til den valgte artsgruppe. ▶ Afspil migration animerer kortet uge for uge.</li>" +
        "</ul>" +
        "<p>Kortet evalueres på et gitter af celler (3° brede ved udzoomning, ned til 0,25° ved indzoomning) og tegnes med bilineær udjævning, så farver glider over mellem cellecentre i stedet for at danne hårde blokke. <b>Bemærk:</b> Artsudbredelse, Artsrigdom og ▶ Afspil migration evaluerer modellen på tværs af mange kortceller, så en moderne computer med en hurtig CPU anbefales for jævn ydeevne.</p>" +
        "<h4>Stedanalyse (klik på kortet)</h4>" +
        "<ul>" +
        "<li><b>Tidslinje</b> — hver arts sandsynlighed på tværs af alle 48 uger.</li>" +
        "<li><b>Sandsynlighed</b> — et varmekort med art × uge (rød = lav, grøn = høj), strakt over de værdier, der aktuelt vises på skærmen.</li>" +
        "<li><b>Ankomster</b> — for hver art og uge en ankomstscore <code>(P[næste uge] − P[forrige uge]) ÷ max</code>, hvor <code>max</code> er den arts højeste ugentlige sandsynlighed over året. Grøn = sandsynlighed stiger (ankommer), rød = falder (afgår); uger fortsætter rundt om årsgrænsen (1 ↔ 48).</li>" +
        "<li><b>Årets top</b> — den løbende (kumulative) sum af de ugentlige ankomstscorer, omskaleret til 0–100 (årets lavpunkt = 0, dets højdepunkt = 100). Den fremhæver den del af året, hvor arten er mest til stede.</li>" +
        "<li><b>Spredning</b> — den aktuelle uges ankomstscore (x-akse) mod sandsynlighed (y-akse) for de øverste arter, med en sorterbar tabel nedenfor.</li>" +
        "</ul>" +
        "<h4>Artsliste — kolonnen “Sammenlign med”</h4>" +
        "<ul>" +
        "<li><b>Forrige / næste uge</b> og <b>årsgennemsnit</b> viser ændringen Δ = aktuel sandsynlighed − sammenligningsværdien.</li>" +
        "<li><b>Årsmaksimum</b> viser den aktuelle uge som en andel af artens årlige højdepunkt: <code>aktuel ÷ max over året</code>. 100% betyder, at den valgte uge er den arts bedste uge.</li>" +
        "</ul>" +
        "<h4>Teknologi</h4>" +
        "<p>AI-modellen kører <b>udelukkende i din webbrowser</b> — der er ingen server, og din placering sendes aldrig nogen steder hen. Det neurale netværk downloades én gang (~7 MB), og alle forudsigelser beregnes på din egen enhed. Bygget med:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — kører det neurale netværk i browseren.</li>" +
        "<li><b>Web Workers</b> — inferens kører uden for hovedtråden, så grænsefladen forbliver responsiv.</li>" +
        "<li><b>BirdNET Geomodel</b> — den trænede model, eksporteret til ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> med OpenStreetMap / CARTO-fliser — det interaktive kort.</li>" +
        "<li><b>Ren HTML, CSS og JavaScript</b> — ingen framework og intet byggetrin; serveret som et statisk websted (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projekt &amp; feedback</h4>" +
        "<p>Dette værktøj er gratis at bruge, og feedback er velkommen på <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. En Norge-specifik habitatmodel er under udvikling med det formål at bruge rigere norske data end de Google Earth Engine-data, der bruges i den nuværende model. Målet med habitatmodellen er en forbedret fuglesangsgenkendelsesapp (A!Birder) (under udvikling). Denne side er lavet til nem kvalitetskontrol af den model.</p>" +
        "<p class=\"about-note\">Forudsigelser er modelskøn, ikke faktiske data. Modelvægte © BirdNET-teamet, licenseret CC BY-SA 4.0; kortfliser © OpenStreetMap-bidragydere, © CARTO.</p>",
    },
    pt: {
      "app.title": "Espécies e Listas",
      "app.loading": "A carregar modelo, etiquetas e nomes de espécies…",
      "app.failed": "Falha ao carregar: {msg}",
      "ctrl.language": "Idioma",
      "ctrl.settings": "Definições",
      "ctrl.about": "Acerca e como funciona",
      "ctrl.mode": "Modo",
      "ctrl.group": "Grupo de espécies",
      "group.all": "Todos os grupos",
      "group.aves": "Aves",
      "group.mammalia": "Mamíferos",
      "group.amphibia": "Anfíbios",
      "group.insecta": "Insetos",
      "mode.range": "Distribuição de Espécies",
      "mode.richness": "Riqueza de Espécies",
      "mode.list": "📍 Lista de Espécies",
      "mode.field": "📍 Lista de campo",
      "btn.clear": "Limpar",
      "act.heard": "Ouvida",
      "act.flying": "A voar",
      "act.feeding": "A alimentar-se",
      "act.resting": "Em repouso",
      "act.breeding": "A reproduzir-se",
      "mode.barchart": "📍 Migração",
      "ctrl.species": "Espécies",
      "ph.species": "Procurar espécies…",
      "ctrl.week": "Semana",
      "ctrl.bcthreshold": "Intervalo de probabilidade",
      "ctrl.compare": "Comparar com",
      "compare.none": "— nenhum —",
      "compare.prev": "Semana anterior",
      "compare.next": "Semana seguinte",
      "compare.mean": "Média anual",
      "compare.max": "Máximo anual",
      "compare.annualtop": "Pico Anual",
      "ctrl.secondlang": "2.º nome",
      "ctrl.savedloc": "Localizações guardadas",
      "ph.savedloc": "Ainda não há localizações guardadas",
      "loc.delete": "Eliminar localização",
      "ctrl.hidden": "Espécies ocultas",
      "loc.unhide": "Mostrar novamente",
      "menu.filter": "Filtrar",
      "menu.hide": "Não mostrar",
      "menu.wiki": "Wikipedia",
      "menu.birdlife": "BirdLife",
      "menu.macaulay": "Macaulay Library",
      "menu.xeno": "Xeno-canto (áudio)",
      "menu.recent": "Deteções recentes",
      "recent.none": "Não foram encontradas deteções recentes nas proximidades.",
      "recent.viewall": "Ver tudo no iNaturalist",
      "menu.distmap": "Mapa de distribuição",
      "distmap.none": "Nenhum mapa de distribuição encontrado. Abra a página da Wikipedia:",
      "distmap.download": "Abrir imagem completa",
      "btn.saveloc": "★ Guardar",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Reproduzir migração",
      "btn.pause": "⏸ Pausar",
      "btn.newchecklist": "⭳ Guardar",
      "btn.checklist": "✓ Lista",
      "btn.print": "🖨 Imprimir",
      "btn.close": "Fechar",
      "btn.delete": "Eliminar",
      "ctrl.checklists": "Lista",
      "chk.namePrompt": "Dê um nome a esta lista:",
      "chk.createNew": "Criar nova",
      "chk.all": "Todas",
      "chk.seen": "Vistas",
      "chk.missing": "Em falta",
      "chk.count": "Contagem",
      "chk.activity": "Atividade",
      "fc.add": "Adicionar observação",
      "btn.logcsv": "⬇ Registo",
      "chk.merged": "Listas combinadas.",
      "chk.note": "NB: As probabilidades e outros valores nesta lista derivam de um modelo de IA e representam apenas uma aproximação das espécies que provavelmente ocorrem neste local — não são observações confirmadas. Para uma referência autoritativa de espécies, consulte <a href=\"https://www.avilist.org\">avilist.org</a>.",
      "status.buildingChecklist": "A criar lista…",
      "th.change": "Variação (Δ)",
      "th.locality": "Localidade",
      "th.notes": "Notas",
      "panel.spTitle": "Espécies no local",
      "panel.bcTitle": "Análise do local",
      "tab.timeline": "Cronologia",
      "tab.prob": "Probabilidade",
      "tab.arrival": "Chegadas",
      "tab.focus": "Pico Anual",
      "tab.scatter": "Dispersão",
      "analysis.empty": "Nenhuma espécie acima do limiar.",
      "ctrl.filter": "Filtrar espécies",
      "place.nearby": "Locais próximos",
      "place.none": "Nenhum local nomeado nas proximidades.",
      "ph.fieldtitle": "Nome do local",
      "ph.filter": "Filtrar espécies…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Ordenar por",
      "rank.arrival": "Chegadas",
      "rank.prob": "Probabilidade",
      "rank.both": "Ambos",
      "ctrl.locate": "Ir para a minha localização",
      "status.locateError": "Não foi possível obter a sua localização.",
      "status.offline": "Offline — a utilizar dados em cache",
      "ctrl.basemap": "Mapa base",
      "ctrl.hires": "Resolução",
      "popup.title": "Distribuições de espécies e listas",
      "popup.perf": "A Distribuição de Espécies, a Riqueza de Espécies e ▶ Reproduzir migração avaliam o modelo em muitas células do mapa, pelo que se recomenda um computador moderno com um CPU rápido para um desempenho fluido.",
      "popup.ok": "OK",
      "popup.feedback": "Sugestões e comentários são bem-vindos em:",
      "basemap.dark": "Escuro",
      "basemap.light": "Claro",
      "basemap.streets": "Ruas",
      "basemap.topo": "Topográfico",
      "basemap.satellite": "Satélite",
      "scatter.xAxis": "Chegada (semana atual)",
      "scatter.yAxis": "Probabilidade (semana atual)",
      "th.rank": "#",
      "th.species": "Espécie",
      "th.sci": "Nome científico",
      "th.prob": "Probabilidade",
      "th.arrival": "Chegada",
      "th.delta": "Δ vs {ref}",
      "th.ratio": "% de {ref}",
      "legend.prob": "Probabilidade de ocorrência",
      "legend.count": "Número previsto de espécies",
      "status.selectSpecies": "Selecione uma espécie para ver o seu mapa de distribuição previsto.",
      "status.loadingModel": "A carregar modelo ONNX…",
      "status.computing": "A calcular {name} – {week} · {n} novas células [{i}/{total}]…",
      "status.rangeDone": "{name} – {week} · {n} células ({step}°)",
      "status.rangeCached": "{name} – {week} · {n} células ({step}°) [em cache]",
      "status.richnessDone": "Riqueza de espécies – {week} · {n} células ({step}°)",
      "status.richnessCached": "Riqueza de espécies – {week} · {n} células ({step}°) [em cache]",
      "status.predicting": "A prever espécies em ({lat}, {lon}) semana {week}…",
      "status.predicting48": "A prever 48 semanas em ({lat}, {lon})…",
      "status.spResult": "{n} espécies acima de {p}% em ({lat}, {lon})",
      "status.error": "Erro: {msg}",
      "sp.summary": "{lat}°, {lon}° · Semana {week} · {n} espécies acima de {p}%",
      "bc.summary": "{lat}°, {lon}° · {n} espécies acima de {p}% méd · normalizado para {max}%",
      "bc.avg": "{p}% méd",
      "bc.max": "{p}% máx",
      "week.fmt": "Semana {w} ({period} {month})",
      "loc.savePrompt": "Dê um nome a esta localização:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modelo: BirdNET Geomodel (pesos CC BY-SA 4.0). Código da app MIT. As previsões são estimativas — não a verdade absoluta.",
      "footer.lastchange": "Última alteração: {t}",
      "about.title": "ℹ︎ Acerca do modelo e como os valores são calculados",
      "about.html":
        "<h4>O modelo de habitat</h4>" +
        "<p>Esta ferramenta executa o <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — uma rede neuronal espácio-temporal — inteiramente no seu navegador através do ONNX Runtime Web. A partir de uma <b>latitude</b>, <b>longitude</b> e <b>semana do ano</b> (1–48; o modelo divide o ano em 48 semanas de cerca de 7,6 dias), prevê uma <b>probabilidade de ocorrência</b> (0–100%) para cada uma das 12 012 espécies entre aves, mamíferos, anfíbios e insetos. A probabilidade reflete a probabilidade de uma espécie estar presente nesse local nessa altura do ano, aprendida a partir de registos globais de ocorrência e de variáveis ambientais. É uma estimativa modelada — não uma contagem de observações nem uma garantia.</p>" +
        "<h4>Vistas do mapa</h4>" +
        "<ul>" +
        "<li><b>Distribuição de Espécies</b> — a probabilidade de uma espécie escolhida ao longo do mapa para a semana selecionada.</li>" +
        "<li><b>Riqueza de Espécies</b> — o número de espécies cuja probabilidade é de pelo menos 5% em cada célula da grelha, limitado ao grupo de espécies selecionado. ▶ Reproduzir migração anima o mapa semana a semana.</li>" +
        "</ul>" +
        "<p>O mapa é avaliado numa grelha de células (3° de largura quando afastado, até 0,25° quando aproximado) e desenhado com suavização bilinear, de modo que as cores se misturam entre os centros das células em vez de formarem blocos rígidos. <b>Nota:</b> A Distribuição de Espécies, a Riqueza de Espécies e ▶ Reproduzir migração avaliam o modelo em muitas células do mapa, pelo que se recomenda um computador moderno com um CPU rápido para um desempenho fluido.</p>" +
        "<h4>Análise do local (clique no mapa)</h4>" +
        "<ul>" +
        "<li><b>Cronologia</b> — a probabilidade de cada espécie ao longo das 48 semanas.</li>" +
        "<li><b>Probabilidade</b> — um mapa de calor espécie × semana (vermelho = baixo, verde = alto), ajustado aos valores atualmente no ecrã.</li>" +
        "<li><b>Chegadas</b> — para cada espécie e semana, uma pontuação de chegada <code>(P[semana seguinte] − P[semana anterior]) ÷ max</code>, em que <code>max</code> é a probabilidade semanal mais elevada dessa espécie ao longo do ano. Verde = probabilidade a subir (a chegar), vermelho = a descer (a partir); as semanas dão a volta ao limite do ano (1 ↔ 48).</li>" +
        "<li><b>Pico Anual</b> — o total corrente (cumulativo) das pontuações de chegada semanais, redimensionado para 0–100 (o mínimo do ano = 0, o seu pico = 100). Destaca a parte do ano em que a espécie está mais presente.</li>" +
        "<li><b>Dispersão</b> — a pontuação de chegada da semana atual (eixo x) versus a probabilidade (eixo y) para as principais espécies, com uma tabela ordenável por baixo.</li>" +
        "</ul>" +
        "<h4>Lista de Espécies — coluna “Comparar com”</h4>" +
        "<ul>" +
        "<li><b>Semana anterior / seguinte</b> e <b>Média anual</b> mostram a variação Δ = probabilidade atual − o valor de comparação.</li>" +
        "<li><b>Máximo anual</b> mostra a semana atual como uma fração do pico anual da espécie: <code>atual ÷ máximo ao longo do ano</code>. 100% significa que a semana selecionada é a melhor semana dessa espécie.</li>" +
        "</ul>" +
        "<h4>Tecnologia</h4>" +
        "<p>O modelo de IA é executado <b>inteiramente no seu navegador web</b> — não existe servidor e a sua localização nunca é enviada para lado nenhum. A rede neuronal é descarregada uma vez (~7 MB) e todas as previsões são calculadas no seu próprio dispositivo. Construído com:</p>" +
        "<ul>" +
        "<li><b>ONNX Runtime Web</b> (WebAssembly) — executa a rede neuronal no navegador.</li>" +
        "<li><b>Web Workers</b> — a inferência é executada fora da thread principal para que a interface se mantenha responsiva.</li>" +
        "<li><b>BirdNET Geomodel</b> — o modelo treinado, exportado para ONNX (FP16, ~7 MB).</li>" +
        "<li><b>Leaflet</b> com mosaicos OpenStreetMap / CARTO — o mapa interativo.</li>" +
        "<li><b>HTML, CSS e JavaScript simples</b> — sem framework e sem etapa de compilação; servido como um site estático (GitHub Pages).</li>" +
        "</ul>" +
        "<h4>Projeto &amp; sugestões</h4>" +
        "<p>Esta ferramenta é de utilização gratuita e as sugestões são bem-vindas em <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. Está em desenvolvimento um modelo de habitat específico para a Noruega, com o objetivo de utilizar dados noruegueses mais ricos do que os dados do Google Earth Engine usados no modelo atual. O objetivo do modelo de habitat é uma aplicação melhorada de deteção de cantos de aves (A!Birder) (em desenvolvimento). Esta página foi feita para facilitar o controlo de qualidade desse modelo.</p>" +
        "<p class=\"about-note\">As previsões são estimativas do modelo, não a verdade absoluta. Pesos do modelo © a equipa BirdNET, licenciados sob CC BY-SA 4.0; mosaicos do mapa © contribuidores do OpenStreetMap, © CARTO.</p>",
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
