# Independent T-Rank/log5 reconstruction review

Reviewed 2026-10-09. Read-only review by a separate agent; no app, rating, or generator code changed. Result: **pass for the stated fixed-rating, neutral-court reconstruction**, subject to the presentation notes and limits below.

## Material reviewed

- `bab-madness-data-tools/derive-forecasts.mjs` and `prepare-ratings.py` under `/private/tmp/`.
- All three frozen `ratings/YEAR-ratings.json` inputs and 2024–2026 derived tournament files.
- Original publisher Time Machine JSON and compressed-source records under `/private/tmp/bab-madness-research/`.
- Original normalized bracket topology, independently reviewed in `/private/tmp/bab-madness-data-review.md`.

## Independent findings

1. Re-fetched the three dated official publisher files (20240318, 20250317, 20260316). Their compressed hashes and decompressed contents exactly match the frozen source. Their server Last-Modified timestamps are respectively 2024-03-19 15:30:03 GMT, 2025-03-18 15:30:02 GMT, and 2026-03-17 15:30:06 GMT: before each year's first First Four game. These timestamps corroborate the pre-tournament boundary; do not promote the filename's date to a precise model-release timestamp.
2. Every one of the 204 tournament-team joins is one-to-one and exactly preserves its named provider row, record, and Barthag. I inspected the explicit aliases, including LIU/Long Island, Miami FL, Queens, Connecticut/UConn, and Nebraska Omaha. None substitutes a similarly named team.
3. Independently checked the column interpretation across every provider team (362/364/365). Column 8 equals `AdjOE^11.5 / (AdjOE^11.5 + AdjDE^11.5)` to floating-point precision. Maximum discrepancies were 0, 1.11e-16, and 0.
4. Independently recomputed all 1,428 output probabilities using Python, odds ratios, and each team's opposite half-block of the seed-position tree rather than the generator's recursive merge. Maximum absolute errors were 3.33e-16, 1.67e-16, and 3.33e-16. The result is saved at `/private/tmp/bab-madness-derived-independent-check.json`.
5. All 24 First Four participants have a nonzero, non-certain Round of 64 chance and positive title chance. Later rounds integrate both possible First Four outcomes. The model does not insert eventual First Four winners as known.
6. Called `propagate` after replacing the tournament's games, champion, forecast, and first/last game date properties with getters that throw. Results remained identical in all three years. Bracket propagation does not consume scores, winners, or subsequent forecasts. The CLI's separate pre-tournament date gate is appropriate.
7. The generator uses published neutral-court log5 and fixed pre-tournament Barthag, preserves the existing year-specific region/semifinal topology, and calculates cumulative probabilities for each stage. It does not fit arbitrary parameters to observed tournament outcomes.
8. The output labels identify one reconstructed pre-tournament snapshot, distinguish it from FiveThirtyEight and a published T-Rank bracket forecast, and disclose fixed ratings, no venue/injury adjustment, and omitted model uncertainty. Older FiveThirtyEight data is not rewritten.

## Primary sources

The [publisher methodology FAQ](https://adamcwisports.blogspot.com/p/every-possession-counts.html) defines Barthag as the probability of beating an average Division I opponent at a neutral site, the 11.5 exponent, and conversion to opponent win probability using log5. The [publisher's 2018 update](https://adamcwisports.blogspot.com/2018/09/t-rank-methodology-update.html) documents that exponent. The [publisher data guide](https://adamcwisports.blogspot.com/p/data.html), including the author's 2021-02-14 explanation, identifies the dated Time Machine files as the actual ratings after Selection Sunday and explains why retrospective date-filtered season tables differ.

Verified files: [2024](https://barttorvik.com/timemachine/team_results/20240318_team_results.json.gz), [2025](https://barttorvik.com/timemachine/team_results/20250317_team_results.json.gz), [2026](https://barttorvik.com/timemachine/team_results/20260316_team_results.json.gz).

## Presentation suggestions and limits

- Show an ordinary methodology link in the app, alongside the downloaded data source. The JSON includes methodology and bulk-data guide URLs, but the UI currently renders only each source's main URL. This is a reproducibility improvement, not a probability defect.
- Keep the source-data date and reconstructed-model label visible. No replay or invented intermediate snapshots should be offered for these years.
- These checks establish correct implementation of the specified model and its provenance, not calibrated predictive accuracy or equivalence to a publisher's full tournament forecast. Fixed ratings do not model injuries, venues, rating uncertainty, or updating after results.
- The review does not establish data redistribution permission; provenance is not itself a license.
