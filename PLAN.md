# Tournament Atlas

## Request and intended use

Recreate the archived FiveThirtyEight 2015 men's tournament forecast dashboard and provide a year selector for every year since 2016, through 2026. The supplied URL selects men. This is an independent educational recreation using real historical data; it is not an official publisher, NCAA, or university product.

The user subsequently requested another online probability model for 2024–2026 that could be expressed at the same round-by-round granularity. The implementation uses frozen pre-tournament T-Rank ratings and Bart Torvik's documented neutral-court log5 formula, then calculates each team's chance of advancing through every possible opponent. This is explicitly labeled as our reconstruction, not a tournament forecast published by FiveThirtyEight or Bart Torvik.

## Delivered scope

A four-region bracket, sortable cumulative-probability table, archived forecast replay, selected-team route and forecast-history chart. Every year from 2016 through 2026 is available. The 2020 option explains the cancelled tournament rather than inventing a field. A separate Results view shows actual scores and advancement. All visitor assets and data are bundled; no account, external runtime API, or telemetry is required.

The learning objective is to distinguish a strong contender from a certain champion and to explore how a team's path and a sequence of uncertain games affect its title chance. Selecting a team highlights its route; it does not condition or recalculate the forecast as though that team had already won.

## Data and model boundaries

| Years | Probability evidence | Timeline |
| --- | --- | --- |
| 2016–2019, 2021–2023 | 83 genuine archived FiveThirtyEight snapshots across seven tournaments | Recorded daily snapshots only; the last available snapshot precedes the title game |
| 2020 | No tournament, field, games, or forecasts | None |
| 2024–2026 | One T-Rank / log5 reconstruction per year, using ratings dated March 18, 2024; March 17, 2025; and March 16, 2026 | One pre-tournament snapshot; no invented daily replay |

A probability vector records the chance to reach the Round of 64, Round of 32, Sweet 16, Elite Eight, Final Four, the title game, and to win the title. Values are unconditional at the selected snapshot. First Four participants share one bracket slot. Date-only archive snapshots retain the publisher’s daily state, not precise live timestamps. Display status is derived from their recorded certainties and corresponding game results; do not guess an intraday update time. Actual game dates display in Eastern Time.

For the reconstruction, if two teams' Barthag values are `a` and `b`, the pairwise probability is `a(1-b) / [a(1-b) + b(1-a)]`. Exact bracket propagation averages over every possible opposing team, including First Four uncertainty. Ratings remain fixed. Actual results, later ratings, injuries, venue effects, matchup-specific adjustments, and rating uncertainty do not enter the calculation. Different years' provider models are not presented as directly interchangeable.

## Implementation choices

Use native HTML and SVG for the fixed bracket and sortable table, Apache ECharts for a selected team's probability history, and managed JavaScript/Vite with pinned approved dependencies. Use Campus Designer's bundled fonts and unchanged Duke palette without university or publisher marks. Preserve keyboard equivalents, responsive table access, visible source distinctions, and original-source attribution.

## Evidence and acceptance

Independent source examples: Kansas's initial 2016 title chance is 0.19203143; Villanova's initial 2018 chance is 0.179788104721 and its post-semifinal chance is 0.644389873381; Gonzaga's initial 2021 chance is 0.281433472751; Houston's initial 2023 chance is 0.22085016963 and its final archived chance is zero. Data retains full precision; the interface labels tiny nonzero probabilities separately from zero and uncertain near-certainty separately from achieved stages.

Each played year has 68 teams and 67 scheduled bracket games. Oregon advanced over VCU without playing in 2021: preserve no-contest status and null scores. There was no 2020 field or title game. Coherent forecasts sum to 64/32/16/8/4/2/1 expected round participants, with nonincreasing probabilities per team. Seeds, region assignments, and semifinal pairings are year-specific. The reconstruction must also pass independently calculated equal-strength and unequal-strength cases, not only structural invariants.

Check keyboard-equivalent team details, numeric sorting, playback stop/reset, year-switch state, narrow table and bracket access, chart resizing, Back navigation, and same-origin production assets. First Four losers must not overwrite the actual Round-of-64 entrant when selected. The final evaluation must identify its tested source commit and distinguish browser observations from unperformed human or device checks.

## Publication boundary

The user authorized the public `jordanmeyer/bab-example-madness` repository, its GitHub Pages application and its course-gallery listing. Vite and the Pages workflow use `/bab-example-madness/`. Subsequent corrections are ordinary commits to this destination. Source history uses the approved attribution recorded in SETUP.md.

## Comparison-review corrections — October 9, 2026

The user requested an independent original-versus-recreation review and correction of the reported issues. Hover and keyboard focus must preview one team consistently through the regional rounds, Final Four, national final and title probability. Explicit selection pins the longer team detail; exiting a transient preview restores that selection. Team labels remain legible in hover and focus states. Final-round connections must follow each year's real semifinal pairings. Compact introductory material gives the bracket priority. Recorded dates are directly selectable, and replay positions and forecast-history chart spacing reflect elapsed calendar days. Missing dates remain unavailable and later-year reconstructions retain one snapshot. These interface corrections leave the underlying data and probability model unchanged.

Acceptance adds an independent rendered re-review of these behaviors, desktop and actual narrow-width inspection, and preservation of the existing calculation and publication checks.

## Original bracket geometry — October 9, 2026

The user rejected the card-based final rounds and explicitly requested the original's line widths, team-name placement and probability placement. Use one continuous bilateral tree with shared round columns: Final Four regional winners occupy distinct branches outside the two championship entrants. Their semifinal branches meet at the whole bracket's vertical midpoint, with a title display above the center junction. Initial internal slots are blank; names appear on compact branch strips only after entrants are secured. Hover and focus reveal cumulative probabilities adjacent to their branch, with substantially tapered probability-width routes. Preserve accessible transparent targets for unresolved slots, pinned detail selection, calendar replay and responsive table access. An independent reviewer must compare actual rendered initial, late-forecast and Results states against the original; numerical checks alone do not establish visual fidelity.

## Full fidelity checklist — October 9, 2026

The user supplied a 21-item review after the prior one-season geometry pass proved insufficient. Every year starts with a clean bracket. Whole-area pointer movement previews the nearest slot; explicit click/Enter pins with a visible chip, Escape clears, and keyboard arrows navigate a single roving tab stop. Only unresolved probabilities produce animated route bands and labels. Completed advancement appears through highlighted name strips. Results identity follows the same previewed team and strips dim only at its losing stage.

Use fixed 1004px geometry, 12px team names and canonical generated abbreviations for every season. Consolidate date controls, identify snapshots from their recorded outcomes, mark the unavailable title-game date, and replay at 500ms while suspending hover. The compact control row and bracket-center status prioritize the drawing. Responsive defaults follow available width unless explicitly overridden. The phone table places title odds beside the short team name and avoids redundant columns. A continuous single-hue probability scale must retain readable text contrast.

Acceptance covers all years from 2016–2026, widths 1024, 1217, 1280 and 1680, and a 375px phone layout. Include late snapshots, Results, First Four, keyboard, rest/pin/preview, rendering and data-preservation checks. The prior reports remain historical; a source check alone cannot establish a rendered interaction pass.

## Campus Designer review — October 10, 2026

The user supplied `docs/MADNESS-DESIGN-REVIEW.md` in the course repository. This supersedes the earlier continuous color scale and black-strip styling: use one 1004px centered explorer, local Open Sans labels at least 12px, transparent name strips above hairlines, Graphite losers, Dandelion selection, and published solid table colors. Preserve the tapered rounded SVG geometry and whole-canvas nearest-slot preview; the user explicitly retained that behavior.

At rest, rank up to five teams still in contention; Results shows the champion and final score. Use a real calendar with round bands and a prominent Play control, but replace a single-snapshot timeline with one explanatory line. Move pinned detail before First Four and scroll it into view, instantly under reduced motion. Show whole percentages with <1%/>99%; retain precision in tooltips and downloads. Replace a one-point chart with a sentence. Historical rounded-zero probabilities are not proof of elimination: use the archived alive flag before describing a loss.

Narrow strips use a reviewed display-name map only when the full bracket name exceeds the actual Open Sans width. An unresolved First Four berth says “First Four winner”; both full candidate names remain in its tooltip/accessibility label and the separate First Four section. This avoids packing ambiguous two-team codes into a 128px strip. No probabilities, scores, source dates, dependencies or publication settings change.

## Women’s tournaments — October 10, 2026

The user requested women’s data and a Men/Women toggle matching the other controls. Both competitions retain year coverage 2016–2026 and explicit 2020 cancellation. Women’s 2016–2019 and 2021 fields have 64 teams/63 games; 2022 onward has 68/67. Seventy-four original FiveThirtyEight snapshots are preserved for the seven archived women’s tournaments. Later women’s years contain results only: no verified pre-tournament forecast inputs have been bundled. Do not use completed-season ratings to imply a pre-tournament prediction.

Switching competition retains year, stops playback and resets selected teams; data caches distinguish competition plus year because schools share numeric IDs. Source links, downloads, headings and pressed-button state must identify the selected competition. Tests cover real women’s scores/probabilities, every rendered season, labels, 2020 recovery, fast switches, keyboard and narrow output.
