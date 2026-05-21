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
      "ctrl.threshold": "Min probability",
      "ctrl.bcthreshold": "Probability range",
      "ctrl.compare": "Compare to",
      "compare.none": "— none —",
      "compare.prev": "Previous week",
      "compare.next": "Next week",
      "compare.mean": "Annual mean",
      "compare.max": "Annual max",
      "ctrl.savedloc": "Saved locations",
      "ph.savedloc": "No saved locations yet",
      "loc.delete": "Delete location",
      "ctrl.hidden": "Hidden species",
      "loc.unhide": "Show again",
      "menu.filter": "Filter",
      "menu.hide": "Do not show",
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
      "about.title": "ℹ︎ About the model & how values are computed",
      "about.html":
        "<h4>The habitat model</h4>" +
        "<p>This tool runs the <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — a spatiotemporal neural network — entirely in your browser via ONNX Runtime Web. From a <b>latitude</b>, <b>longitude</b> and <b>week of year</b> (1–48; the model splits the year into 48 weeks of about 7.6 days), it predicts an <b>occurrence probability</b> (0–100%) for each of 12,012 species across birds, mammals, amphibians and insects. The probability reflects how likely a species is to be present there at that time of year, learned from global occurrence records and environmental variables. It is a modelled estimate — not an observation count or a guarantee.</p>" +
        "<h4>Map views</h4>" +
        "<ul>" +
        "<li><b>Species Range</b> — the probability of one chosen species across the map for the selected week.</li>" +
        "<li><b>Species Richness</b> — the number of species whose probability is at least 5% in each grid cell, limited to the selected species group. ▶ Play migration animates the map week by week.</li>" +
        "</ul>" +
        "<p>The map is evaluated on a grid of cells (3° wide when zoomed out, down to 0.25° when zoomed in) and drawn with bilinear smoothing, so colours blend between cell centres instead of forming hard blocks.</p>" +
        "<h4>Location analysis (click the map)</h4>" +
        "<ul>" +
        "<li><b>Timeline</b> — each species' probability across all 48 weeks.</li>" +
        "<li><b>Probability</b> — a species × week heatmap (red = low, green = high), stretched across the values currently on screen.</li>" +
        "<li><b>Arrivals</b> — for each species and week, an arrival score <code>(P[next week] − P[previous week]) ÷ max</code>, where <code>max</code> is that species' highest weekly probability over the year. Green = probability rising (arriving), red = falling (departing); weeks wrap around the year boundary (1 ↔ 48).</li>" +
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
        "<p>This tool is free to use, and feedback is welcome at <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. A Norway-specific habitat model is under development, aiming to use richer Norwegian data than the Google Earth Engine data used in the current model — for example, using explicit altitude as an input parameter. The goal of the habitat model is an improved birdsong detection app (A!Birder), which is also under development.</p>" +
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
      "ctrl.threshold": "Min sannolikhet",
      "ctrl.bcthreshold": "Sannolikhetsintervall",
      "ctrl.compare": "Jämför med",
      "compare.none": "— ingen —",
      "compare.prev": "Föregående vecka",
      "compare.next": "Nästa vecka",
      "compare.mean": "Årsmedel",
      "compare.max": "Årsmax",
      "ctrl.savedloc": "Sparade platser",
      "ph.savedloc": "Inga sparade platser än",
      "loc.delete": "Ta bort plats",
      "ctrl.hidden": "Dolda arter",
      "loc.unhide": "Visa igen",
      "menu.filter": "Filtrera",
      "menu.hide": "Dölj",
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
      "about.title": "ℹ︎ Om modellen & hur värdena beräknas",
      "about.html":
        "<h4>Habitatmodellen</h4>" +
        "<p>Verktyget kör <a href=\"https://github.com/birdnet-team/geomodel\" target=\"_blank\" rel=\"noopener\">BirdNET Geomodel</a> — ett spatiotemporalt neuralt nätverk — helt i din webbläsare via ONNX Runtime Web. Utifrån <b>latitud</b>, <b>longitud</b> och <b>vecka på året</b> (1–48; modellen delar året i 48 veckor om cirka 7,6 dagar) förutsägs en <b>förekomstsannolikhet</b> (0–100%) för var och en av 12 012 arter bland fåglar, däggdjur, groddjur och insekter. Sannolikheten speglar hur troligt det är att arten förekommer där vid den tiden på året, lärt från globala fynddata och miljövariabler. Det är en modellerad uppskattning — inte ett observationsantal eller en garanti.</p>" +
        "<h4>Kartvyer</h4>" +
        "<ul>" +
        "<li><b>Artutbredning</b> — sannolikheten för en vald art över kartan för vald vecka.</li>" +
        "<li><b>Artrikedom</b> — antalet arter vars sannolikhet är minst 5% i varje rutnätscell, begränsat till vald artgrupp. ▶ Spela migration animerar kartan vecka för vecka.</li>" +
        "</ul>" +
        "<p>Kartan beräknas på ett rutnät (3° brett utzoomat, ner till 0,25° inzoomat) och ritas med bilinjär utjämning, så att färger tonar mellan cellcentrum i stället för att bilda hårda block.</p>" +
        "<h4>Platsanalys (klicka på kartan)</h4>" +
        "<ul>" +
        "<li><b>Tidslinje</b> — varje arts sannolikhet över alla 48 veckor.</li>" +
        "<li><b>Sannolikhet</b> — en värmekarta art × vecka (rött = lågt, grönt = högt), skalad efter värdena på skärmen.</li>" +
        "<li><b>Ankomster</b> — för varje art och vecka en ankomstpoäng <code>(P[nästa vecka] − P[föregående vecka]) ÷ max</code>, där <code>max</code> är artens högsta veckosannolikhet under året. Grönt = stigande (ankommer), rött = fallande (lämnar); veckorna går runt årsgränsen (1 ↔ 48).</li>" +
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
        "<p>Det här verktyget är gratis att använda, och återkoppling välkomnas till <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. En Norge-specifik habitatmodell är under utveckling och syftar till att använda rikare norska data än de Google Earth Engine-data som används i den nuvarande modellen — till exempel genom att använda explicit höjddata som en indataparameter. Målet med habitatmodellen är en förbättrad app för fågelsångsigenkänning (A!Birder), som också är under utveckling.</p>" +
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
        "<p>Kartet beregnes på et rutenett (3° bredt utzoomet, ned til 0,25° innzoomet) og tegnes med bilineær glatting, slik at fargene tones mellom cellesentre i stedet for å danne harde blokker.</p>" +
        "<h4>Stedsanalyse (klikk på kartet)</h4>" +
        "<ul>" +
        "<li><b>Tidslinje</b> — hver arts sannsynlighet over alle 48 ukene.</li>" +
        "<li><b>Sannsynlighet</b> — et varmekart art × uke (rødt = lavt, grønt = høyt), skalert etter verdiene på skjermen.</li>" +
        "<li><b>Ankomster</b> — for hver art og uke en ankomstscore <code>(P[neste uke] − P[forrige uke]) ÷ maks</code>, der <code>maks</code> er artens høyeste ukesannsynlighet gjennom året. Grønt = stigende (ankommer), rødt = synkende (forlater); ukene går rundt årsgrensen (1 ↔ 48).</li>" +
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
        "<p>Dette verktøyet er gratis å bruke, og tilbakemeldinger er velkomne til <a href=\"mailto:vesmir09@gmail.com\">vesmir09@gmail.com</a>. En Norge-spesifikk habitatmodell er under utvikling, med mål om å bruke rikere norske data enn Google Earth Engine-dataene som brukes i den nåværende modellen — for eksempel ved å bruke eksplisitte høydedata som en inngangsparameter. Målet med habitatmodellen er en forbedret app for fuglesanggjenkjenning (A!Birder), som også er under utvikling.</p>" +
        "<p class=\"about-note\">Forutsigelser er modellestimater, ikke fasit. Modellvekter © BirdNET-teamet, lisensiert CC BY-SA 4.0; kartfliser © OpenStreetMap-bidragsytere, © CARTO.</p>",
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
