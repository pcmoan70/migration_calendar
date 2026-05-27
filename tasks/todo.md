# Plan — list bars, current-week highlight/sort, default week

## Tasks
- [x] 1. Species List: render the comparison ("Compare to") column with probability-style **bars** when all its values are positive (e.g. Annual max, Annual Top); when negatives occur (changes), show values with **negatives in red**.
- [x] 2. Location analysis **Timeline**: mark the **current-week** bar specially (red).
- [x] 3. Sort all analysis tables except Scatter (**Timeline, Probability, Arrivals, Annual Top**) from largest→smallest by the **current-week** value.
- [x] 4. On page load, set the **Week** selector to the **current week of the year**.
- [x] 5. Verify in-browser (headless) and commit + push.

## Review
All verified headless (0 console errors): default week = 19 (today), comparison column shows bars when all-positive / red negatives for changes, Timeline current-week bar is red (rgb 211,47,47), and Timeline/Probability/Arrivals sort by current-week value descending.

## Notes
- Comparison kinds: delta (prev/next/mean, can be negative), ratio (annual max, 0–1), focus (annual top, 0–100).
- Current BirdNET week from today: floor((dayOfYear-1)/365*48)+1, clamped 1–48.
