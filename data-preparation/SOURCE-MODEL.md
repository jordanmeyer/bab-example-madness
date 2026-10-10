# Opening-source reconstruction and historical blends

## Reproduce without network access

From the project root:

```sh
node scripts/build-sources.mjs /tmp/atlas-sources
node tests/source-model.mjs
node tests/generated-sources.mjs
```

The generator reads the frozen `data-inputs/opening-sources.json` and the unchanged original fields in `app/public/data/`. Compare `/tmp/atlas-sources` with the committed year files and `source-audit.json`; investigate differences before copying. It appends `forecastOptions` and `ensembleReport`, preserving original `forecasts`, provenance and corrections. Selecting FiveThirtyEight displays the retained original `forecasts`, whose dates match the catalog's `forecastDates`. Other selections display their generated `forecastOptions` timelines. The FiveThirtyEight option's reconstruction is retained only for blend generation/comparison; it does not replace the published archive in the source view.

To reproduce the frozen input normalization from the companion course research evidence:

```sh
python3 data-preparation/prepare-sources.py ../decision-999/evidence/browser-app-builder/madness/2026-10-10/forecast-sources . /tmp/opening-sources.json
```

This optional preparation command uses the Python standard library. No additional runtime or network is used by visitors. Explicit aliases and exact IDs join all 37 fields; tests check the full team set, not only counts. Partial ESPN fields and championship-eve Neil Paine tables are excluded by the user's complete-opening-field rule. Silver is restricted to women 2024. Torvik men 2024 uses its March 18 archive because the recovered “Pre-Tourney” option already knew Wagner's win.

## Inverse bracket model

Advancement probabilities do not uniquely identify pairwise win chances. At each binary bracket node, let `a_i` and `b_j` be the probabilities of teams arriving from the two child branches. Choose matchup probabilities `q_ij` maximizing the weighted Bernoulli entropy `sum(a_i*b_j*H(q_ij))`, subject to the published advancement marginals. The corresponding form is `q_ij = sigmoid(u_i-u_j)` with scores specific to that node. Coordinate Newton updates fit the scores; this is an identification assumption, not recovery of private publisher ratings.

Published values are retained in the input. A printed `<x%` becomes half the bound for fitting. Exact displayed zeros have a tiny positive floor; printed rounding is not proof of impossibility. Missing First Four probabilities use the two participants' Round-of-32 shares, assuming equal conditional next-round strength. Node targets are normalized to sum to one. The generator rejects maximum opening adjustments over 0.5 percentage point; all actual fit errors are recorded per source. This tolerance is a data-reconciliation gate, not a measure of predictive accuracy.

All FiveThirtyEight opening marginals are reproduced to numerical precision. Rounded sources require adjustments. The largest is about 0.359 percentage point for Silver women 2024: the published LSU/UCLA half-region totals 100.7% to reach the Elite Eight. The original printed facts remain intact; the app discloses normalization rather than pretending the table is exactly coherent. Sources with rounded tiny values can imply unstable rare-matchup odds; those are model estimates, not publisher claims.

Exact bracket propagation integrates all possible opponents. Each daily snapshot locks only games completed by that Eastern-time date. Later rounds recompute using the fitted, fixed matchup matrix. Winning margins, injuries, new ratings and future results do not enter. Venue assumptions embodied in the opening forecast are implicit, not separately estimated. The final snapshot is the known completed bracket, not a fresh predictive achievement.

## Blends

The average is the arithmetic mean of the eligible sources' advancement probabilities on the same day. It requires at least two sources.

The ensemble uses `sigmoid(sum(beta_s * logit(p_s)))` for pairwise matchups, then the same exact bracket propagation. No intercept preserves complementary probabilities when team order reverses. Coefficients need not sum to one and are not percentage shares. Fixed ridge strength 0.02 penalizes deviation from equal coefficients, without tuning on the displayed season. Logits are clipped at 1e-8 for numerical stability. Each prior season has equal training weight; its games divide that weight equally. The 2021 no-contest is excluded from training and scoring but retains actual advancement in the bracket.

Only years strictly earlier than the selected year and in the same competition enter training. Use all earlier games with at least one applicable current source. A missing historical source feature uses that game's mean available log-odds; it is not fabricated publisher data. Every current source must have genuine prior-season observations before exposing the all-source ensemble. Thus a new ESPN, Torvik, Silver or numberFire input cannot acquire coefficients from its own season's outcomes. A single source with history supports logistic calibration; it does not support an average.

## Historical comparison

For each earlier test season, fit using only still-earlier seasons, and predict its actual played matchups from opening-derived pairwise probabilities. The historically available subset of the current source set is used; seasons with a new unsupported input cannot be tested. The table therefore evaluates the expanding-window procedure, not today's fitted coefficients. Rows list test years and game counts; each individual/average row and its ensemble comparator use identical games. Different rows can cover different years.

Brier score is mean squared probability error. Log loss is `-log(probability assigned to the observed winner)`. Scores are averaged equally over test seasons. Improvement is individual Brier minus ensemble Brier; negative means the ensemble was worse. These game-level metrics do not establish title-forecast calibration, uncertainty intervals, or universal superiority. A fitted model with only one prior season has training evidence but no chronological out-of-sample comparison yet.

## Verification

Independent four-team arithmetic, inverse reproduction, complementary matchups, logistic calibration, current/future outcome mutations, 64/68-team brackets, 37 exact opening memberships, 60 source/blend options and 757 daily snapshots are covered. Checks include cumulative probability bounds, round totals, completed outcomes, average arithmetic, eligibility and chronological scoring. Original archive tests remain separate. Browser and publication observations are recorded in `EVALUATION.md` and `DEPLOYMENT.md`.
