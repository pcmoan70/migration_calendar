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
    // Italian has no common-name column in taxonomy.csv, so species names fall
    // back to (bracketed) English; the UI documentation is translated below.
    { code: "it",    name: "Italiano",    taxCol: "common_name_it" },
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
      "ctrl.group": "Species group",
      "group.all": "All groups",
      "group.aves": "Birds",
      "group.mammalia": "Mammals",
      "group.amphibia": "Amphibians",
      "group.insecta": "Insects",
      "mode.range": "Species Range",
      "mode.richness": "Species Richness",
      "mode.list": "Species List (click map)",
      "mode.barchart": "Migration Timeline (click map)",
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
      "menu.macaulay": "Macaulay Library",
      "btn.saveloc": "★ Save",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Play migration",
      "btn.pause": "⏸ Pause",
      "btn.newchecklist": "＋ Checklist",
      "btn.print": "🖨 Print",
      "btn.close": "Close",
      "btn.delete": "Delete",
      "ctrl.checklists": "Checklists",
      "chk.namePrompt": "Name this checklist:",
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
      "ph.filter": "Filter species…",
      "ctrl.topN": "Top N",
      "ctrl.rankby": "Rank by",
      "rank.arrival": "Arrivals",
      "rank.prob": "Probability",
      "rank.both": "Both",
      "ctrl.basemap": "Base map",
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
      "week.fmt": "Week {w} ({period} {month})",
      "loc.savePrompt": "Name this location:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Model: BirdNET Geomodel (weights CC BY-SA 4.0). App code MIT. Predictions are estimates — not ground truth.",
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
      "app.title": "Utforskare för artutbredning & migration",
      "app.loading": "Laddar modell, etiketter & artnamn…",
      "app.failed": "Kunde inte ladda: {msg}",
      "ctrl.language": "Språk",
      "ctrl.mode": "Läge",
      "ctrl.group": "Artgrupp",
      "group.all": "Alla grupper",
      "group.aves": "Fåglar",
      "group.mammalia": "Däggdjur",
      "group.amphibia": "Groddjur",
      "group.insecta": "Insekter",
      "mode.range": "Artutbredning",
      "mode.richness": "Artrikedom",
      "mode.list": "Artlista (klicka på kartan)",
      "mode.barchart": "Migrationstidslinje (klicka på kartan)",
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
      "menu.macaulay": "Macaulay Library",
      "btn.saveloc": "★ Spara",
      "btn.csv": "⬇ CSV",
      "btn.play": "▶ Spela migration",
      "btn.pause": "⏸ Pausa",
      "btn.newchecklist": "＋ Checklista",
      "btn.print": "🖨 Skriv ut",
      "btn.close": "Stäng",
      "btn.delete": "Ta bort",
      "ctrl.checklists": "Checklistor",
      "chk.namePrompt": "Namnge checklistan:",
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
      "ph.filter": "Filtrera arter…",
      "ctrl.topN": "Topp N",
      "ctrl.rankby": "Rangordna efter",
      "rank.arrival": "Ankomster",
      "rank.prob": "Sannolikhet",
      "rank.both": "Båda",
      "ctrl.basemap": "Bakgrundskarta",
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
      "week.fmt": "Vecka {w} ({period} {month})",
      "loc.savePrompt": "Namnge platsen:",
      "loc.defaultName": "{lat}, {lon}",
      "footer.attrib": "Modell: BirdNET Geomodel (vikter CC BY-SA 4.0). Appkod MIT. Förutsägelser är uppskattningar — inte sanning.",
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
    no: {
      // Norwegian: documentation is fully translated; other UI strings fall
      // back to English (per-key) until a full Norwegian UI is added.
      "about.title": "ℹ︎ Om modellen og hvordan verdiene beregnes",
      "about.html":
        "<h4>Habitatmodellen</h4>" +
        "<p>Dette verktøyet kjører <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — et spatiotemporalt nevralt nettverk — helt i nettleseren din via ONNX Runtime Web. Ut fra <b>breddegrad</b>, <b>lengdegrad</b> og <b>uke i året</b> (1–48; modellen deler året i 48 uker på omtrent 7,6 dager) forutsier den en <b>forekomstsannsynlighet</b> (0–100%) for hver av 12 012 arter blant fugler, pattedyr, amfibier og insekter. Sannsynligheten gjenspeiler hvor sannsynlig det er at arten finnes der på den tiden av året, lært fra globale funndata og miljøvariabler. Det er et modellert estimat — ikke et observasjonsantall eller en garanti.</p>" +
        "<h4>Kartvisninger</h4>" +
        "<ul>" +
        "<li><b>Artsutbredelse</b> — sannsynligheten for én valgt art over kartet for valgt uke.</li>" +
        "<li><b>Artsrikdom</b> — antall arter med sannsynlighet på minst 5% i hver rutecelle, begrenset til valgt artsgruppe. ▶ Spill av migrasjon animerer kartet uke for uke.</li>" +
        "</ul>" +
        "<p>Kartet beregnes på et rutenett (3° bredt utzoomet, ned til 0,25° innzoomet) og tegnes med bilineær glatting, slik at fargene tones mellom cellesentre i stedet for å danne harde blokker. <b>Merk:</b> Artsutbredelse, Artsrikdom og ▶ Spill av migrasjon kjører modellen over mange kartceller, så en moderne datamaskin med en rask prosessor (CPU) anbefales for jevn ytelse.</p>" +
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
    fr: {
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
    de: {
      "about.title": "ℹ︎ Über das Modell & wie die Werte berechnet werden",
      "about.html":
        "<h4>Das Habitatmodell</h4>" +
        "<p>Dieses Werkzeug führt das <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — ein raumzeitliches neuronales Netz — vollständig in Ihrem Browser über ONNX Runtime Web aus. Aus <b>Breitengrad</b>, <b>Längengrad</b> und <b>Woche des Jahres</b> (1–48; das Modell teilt das Jahr in 48 Wochen von etwa 7,6 Tagen) sagt es eine <b>Vorkommenswahrscheinlichkeit</b> (0–100 %) für jede der 12.012 Arten unter Vögeln, Säugetieren, Amphibien und Insekten voraus. Die Wahrscheinlichkeit spiegelt wider, wie wahrscheinlich eine Art dort zu dieser Jahreszeit vorkommt, gelernt aus globalen Fundmeldungen und Umweltvariablen. Es ist eine modellierte Schätzung — keine Beobachtungszählung und keine Garantie.</p>" +
        "<h4>Kartenansichten</h4>" +
        "<ul>" +
        "<li><b>Artverbreitung</b> — die Wahrscheinlichkeit einer ausgewählten Art auf der Karte für die gewählte Woche.</li>" +
        "<li><b>Artenreichtum</b> — die Anzahl der Arten mit einer Wahrscheinlichkeit von mindestens 5 % in jeder Rasterzelle, begrenzt auf die gewählte Artengruppe. ▶ Migration abspielen animiert die Karte Woche für Woche.</li>" +
        "</ul>" +
        "<p>Die Karte wird auf einem Zellraster berechnet (3° herausgezoomt, bis 0,25° herangezoomt) und mit bilinearer Glättung gezeichnet, sodass die Farben zwischen den Zellzentren ineinander übergehen, statt harte Blöcke zu bilden. <b>Hinweis:</b> Artverbreitung, Artenreichtum und ▶ Migration abspielen werten das Modell über viele Kartenzellen aus; für flüssige Leistung wird ein moderner Computer mit schneller CPU (Prozessor) empfohlen.</p>" +
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
    nl: {
      "about.title": "ℹ︎ Over het model & hoe waarden worden berekend",
      "about.html":
        "<h4>Het habitatmodel</h4>" +
        "<p>Deze tool draait het <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — een ruimtelijk-temporeel neuraal netwerk — volledig in je browser via ONNX Runtime Web. Op basis van <b>breedtegraad</b>, <b>lengtegraad</b> en <b>week van het jaar</b> (1–48; het model verdeelt het jaar in 48 weken van ongeveer 7,6 dagen) voorspelt het een <b>voorkomenswaarschijnlijkheid</b> (0–100%) voor elk van de 12.012 soorten onder vogels, zoogdieren, amfibieën en insecten. De waarschijnlijkheid geeft weer hoe waarschijnlijk een soort daar in die tijd van het jaar aanwezig is, geleerd uit wereldwijde waarnemingsgegevens en omgevingsvariabelen. Het is een gemodelleerde schatting — geen waarnemingstelling of garantie.</p>" +
        "<h4>Kaartweergaven</h4>" +
        "<ul>" +
        "<li><b>Verspreiding</b> — de waarschijnlijkheid van één gekozen soort over de kaart voor de geselecteerde week.</li>" +
        "<li><b>Soortenrijkdom</b> — het aantal soorten met een waarschijnlijkheid van minstens 5% in elke rastercel, beperkt tot de geselecteerde soortgroep. ▶ Migratie afspelen animeert de kaart week voor week.</li>" +
        "</ul>" +
        "<p>De kaart wordt berekend op een raster van cellen (3° uitgezoomd, tot 0,25° ingezoomd) en getekend met bilineaire vloeiing, zodat kleuren tussen celcentra in elkaar overvloeien in plaats van harde blokken te vormen. <b>Let op:</b> Verspreiding, Soortenrijkdom en ▶ Migratie afspelen berekenen het model over veel kaartcellen, dus een moderne computer met een snelle CPU (processor) wordt aanbevolen voor vlotte prestaties.</p>" +
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
    it: {
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
        "<li><b>Grafico a dispersione</b> — il punteggio di arrivo della settimana corrente (asse x) rispetto alla probabilità (asse y) per le specie principali, con una tabella ordinabile sotto.</li>" +
        "</ul>" +
        "<h4>Elenco specie — colonna « Confronta con »</h4>" +
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
