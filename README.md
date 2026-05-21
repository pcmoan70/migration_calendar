# Species Distribution & Migration Explorer

An interactive, **100% in-browser** explorer of species distribution and migration
patterns, powered by the [BirdNET Geomodel](https://github.com/birdnet-team/geomodel)
running client-side via [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/).
No server, no backend — the neural network runs on your machine.

The model predicts occurrence probabilities for **12,012 species** (birds, mammals,
insects, amphibians, reptiles) from `(latitude, longitude, week 1–48)`.

## Features

- **Map views** (Leaflet)
  - **Species Range** — probability heatmap for a chosen species, with a
    **▶ Play migration** button that animates the range across all 48 weeks.
  - **Species Richness** — predicted species count per grid cell.
  - Light / dark base map toggle, deep zoom (to ~0.25° cells), and bilinear
    smoothing so the heatmap blends instead of looking blocky.
- **Species-group filter** — restrict every view to birds, mammals, amphibians,
  insects, or all groups.
- **Location analysis** (click anywhere on the map) — a tabbed panel from a
  single 48-week prediction:
  - **Timeline** — per-species phenology bars across the year.
  - **Probability** — species × 48-week heatmap (red → green).
  - **Arrivals** — diverging heatmap of the arrival score
    `(P[next week] − P[prev week]) / max_year`, green = arriving, red = departing.
  - **Scatter** — top-N species plotted as (arrival, probability), plus a
    sortable, colour-tinted table.
- **Species List** — ranked species at a point, with an optional comparison
  column: **Δ probability** vs the previous/next week or the annual mean, or
  **% of annual max** (current week ÷ the species' yearly peak).
- **On-page documentation** — a collapsible panel explaining the model and how
  every derived value (richness, arrivals, comparisons) is computed.
- **Multilingual** — UI in English & Swedish (extensible), and **species common
  names in ~30 languages** sourced from the model's `taxonomy.csv`.
- **Persistent** — language, base map, week, threshold, map view, and named
  **saved locations** are remembered across visits (localStorage).
- **CSV export** for every view.

## Run locally

It's a static site — serve the `docs/` folder with any static server:

```bash
cd docs
python -m http.server 8000
# open http://localhost:8000
```

(A server is required — `file://` won't work because the app uses a Web Worker
and `fetch()`.)

## Deploy (GitHub Pages)

The site lives in `docs/`. In the repository **Settings → Pages**, set
**Source: Deploy from a branch**, **Branch: `main`**, **Folder: `/docs`**.
GitHub serves it at `https://<user>.github.io/<repo>/`.

## Project layout

```
docs/
  index.html            Standalone page (mount point + script tags)
  demo.js               App logic: map, modes, controls, inference orchestration
  inference-worker.js   ONNX Runtime Web worker (model runs here)
  analysis.js           Probability / Arrivals heatmaps + Scatter renderers
  i18n/strings.js       UI strings (en, sv) + language ↔ taxonomy column map
  state.js              localStorage persistence
  demo.css              Styles
  geomodel_fp16.onnx    Model weights (FP16, ~7 MB)
  labels.txt            Output-index → species_code/sci/common
  taxonomy.csv          Multilingual common names (joined to labels by species_code)
```

## Attribution & licensing

- **App code**: MIT (see `LICENSE`).
- **BirdNET Geomodel** by the [BirdNET team](https://github.com/birdnet-team/geomodel):
  source code MIT; **trained weights (`geomodel_fp16.onnx`) are licensed
  CC BY-SA 4.0** and are redistributed here under those terms.
- Map tiles © OpenStreetMap contributors, © CARTO.

Predictions are model estimates, not ground truth.
