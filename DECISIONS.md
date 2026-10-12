# Decisions

Decisions recorded on October 9, 2026.

- Recreate the reference's useful behavior with independent source code, without copying publisher code, logos, school marks, or remote fonts.
- Focus on the men's tournament selected by the supplied URL. Cover every year from 2016 through 2026, with an explicit cancelled state for 2020.
- Preserve genuine FiveThirtyEight probabilities and daily snapshots for the seven played years from 2016 through 2023. Actual scores and outcomes belong in a separately labeled Results view.
- In response to the user's follow-up, use Bart Torvik's documented neutral-court log5 method with frozen pre-tournament T-Rank ratings for 2024–2026. Derive all seven advancement probabilities by exact bracket propagation across possible opponents. Do not use actual results in the model, label it as a publisher's original bracket forecast, or invent subsequent snapshots.
- Keep the later-year model's limitations visible: fixed ratings, neutral court, no injury or matchup-specific adjustment, and no modeled rating uncertainty. Model availability is not evidence that its forecasts are calibrated.
- Use native bracket and table controls, with ECharts only for the concrete forecast-history chart. Bundle Campus Designer fonts, tokens, and the ECharts adapter locally.
- Derive forecast routes from each year's seed topology. Do not use known future game participants as early forecast contenders. A selected team highlights a route without conditioning any probability.
- Preserve the 2021 Oregon–VCU no-contest and the documented 2018 LIU seed/ID correction. Do not invent scores or erase First Four losers.
- Keep source attribution and rights distinct. FiveThirtyEight's CC-BY data license does not apply to other publishers. Link the T-Rank method and archive guidance and retain transformation notes.
- Preserve review failures and their corrections. Source review led to fixes for stale finalist labels, accessible route descriptions, VCU's status, replay reset, First Four loser overlays, and chart restoration after browser Back.
- Prepare the candidate Pages repository path locally, without creating or publishing a repository before destination authorization. Keep full project reports and data-preparation utilities out of website output.

2026-10-09: The user authorized the public repository `jordanmeyer/bab-example-madness`, GitHub Pages, and a plugin gallery listing. The source and approved Git attribution will be public.

## Restore the original bracket geometry

The user rejected connected central cards. One shared coordinate tree now owns all round positions, replacing the cards, dynamic connector measurements and separate mobile regional layout. Compact labels, external probabilities and tapered widths follow observed original conventions. The table remains the narrow default; the full tree scrolls horizontally.

## Apply the complete fidelity checklist

2026-10-09: Replace the automatic-favorite resting state, node-only hover, duplicate date controls and stretched geometry with the original’s clean/preview/pin behavior and one fixed drawing. Generate abbreviations with the data so all years share one naming policy. Snapshot status is based on recorded certainties and actual game records, retaining date-only precision. The user explicitly requested a continuous single-hue numerical heat scale; preserve brand colors elsewhere. Expand independent acceptance to all seasons, multiple desktop widths, phone, late forecasts and Results because the earlier bounded passes missed these failures.


## October 10, 2026 — complete opening fields and source blends

Use 37 complete opening fields; exclude partial ESPN and late Neil Paine data per the user's clarification. Maximum-entropy bracket inversion identifies a fixed matchup matrix from rounded advancement marginals; subsequent dates condition only on completed games. Published updates are not claimed. Preserve originals, disclose rounding and missing First Four assumptions, and retain exact provenance.

Fit men and women separately using strictly earlier years, equal seasonal weights, fixed ridge 0.02, and no intercept. Require previous observations for every current source before exposing the all-source ensemble. Historical missing features use the game-specific mean available log-odds. Validate chronologically and report negative improvement. See SOURCE-MODEL.md for reproducible definitions and limitations.

## October 11, 2026 — no pinned team detail

The user removed click-to-pin: selecting a team no longer opens a detail section or adds a pinned filter. Hover and keyboard focus preview a route; a tap previews on touch, and Escape clears. The forecast-history chart went with the detail section, so Apache ECharts and its theme were removed.
