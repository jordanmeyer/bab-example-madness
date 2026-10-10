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
