# Upload Checklist Feature — eBird (v1)

## Decisions (user-confirmed)
1. **Mechanism**: CSV download in eBird Record Format; structure the code so a future API-submit hook can plug in.
2. **Scope**: One checklist = one upload group. User can split/merge log entries into ad-hoc groups in the review screen.
3. **Entry point**: New "Review & upload" button on the field-checklist page → dedicated review page.

## Existing model (no change needed, append-only field on entries)
- `fieldChecklists[id]` = `{ id, title, lat, lon, day, createdAt, log[], seen{} }` (one record per place+day).
- Each `log` entry: `{ id, ts, lat, lon, key, count, act, note }`.
- **Add**: optional `entry.grp` (group key, string). Absent → default group `"a"`. Backward compatible.

## Tasks

### 1. Data
- [ ] `entry.grp` (string) added to log entries. Default group when missing = `"a"`.
- [ ] Add `record.upload[grpKey]` to persist per-group submission metadata (start time, duration, protocol, distance/area, observers, effort comments, submission comments, state, country, location-name override).
- [ ] Helpers: `recordGroups(rec)` → array of group keys present in `rec.log` (+ any orphans from `rec.upload`). `entriesByGroup(rec, grp)` → log entries in that group, sorted by ts. `aggregateSpecies(entries)` → array `{ key, count, breeding, notes, firstTs, lastTs }`.

### 2. eBird mapping
- [ ] `EBIRD_BREEDING` map: subset of `FIELD_ACTS` → eBird breeding codes (NB, FL, ON, FY, NY, CF, FS, UN, DD, A, C, N, T, P, S, S7, H, F, …). Non-breeding activities pass through as plain text in "Identification details".
- [ ] `ebirdCsv(rec, grpKey)`: produces a string in Record Format (header row + one row per species). Columns:
  `Common Name, Genus, Species, Number, Identification details, Observation Date, Observation Time, State, Country, Location Name, Latitude, Longitude, Protocol, Duration (min), All observations reported, Distance Covered (km), Area Covered (ha), Number of Observers, Effort Comments, Submission Comments`.

### 3. UI — `#review-page`
- [ ] New full-screen page, opened by a new toolbar button on the field-checklist page.
- [ ] Group cards: editable meta + aggregated species list (count/breeding/note editable; expand to show source entries with "Move to group ▾").
- [ ] "+ Checklist" button creates a new group.
- [ ] Per-group "Download eBird CSV" button.
- [ ] Per-group "Submit to eBird API" placeholder (disabled tooltip "partner-only").

### 4. i18n
- [ ] Add ~25 keys to all 15 language blocks in `docs/i18n/strings.js` (English source; translations for sv/de/es/fr/nl/no/it/pl/cs/et/lt/fi/da/pt). Keep CRLF.

### 5. Housekeeping
- [ ] Bump SW to v73, update `last-change.txt`.

### 6. Verification (headless)
- [ ] Aggregation: two `barswa` entries with counts 3 + 2 → one row `count=5`.
- [ ] CSV roundtrip: header row + correct column count per data row.
- [ ] Breeding code mapping: `song` → `S`, `nestbuild` → `NB`.
- [ ] Move entry to new group → species moves between groups.
- [ ] Protocol Traveling shows Distance row.

## Out of scope (v1)
- Tracking which checklists were already uploaded.
- iNaturalist (the review page leaves a `destinations[]` seam).
- State/country auto-detection.
- Per-entry coords in the CSV (eBird Record Format takes one location per checklist).

## Review

(populated after implementation)
