# How Tournament Atlas was built

This record describes a real user request and implementation decisions. It is not a simulated student conversation.

## Opening request

The user supplied the archived FiveThirtyEight dashboard:

https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens

They asked: “please create a new example that recreates this dashboard” and “Please create a selector for year, and find the data needed to add a selector for every year since 2016.”

A subsequent user request asked for an alternative online probability model for 2024–2026 that could be transformed to the same round-by-round granularity. That follow-up is paraphrased here; no invented interview or approval transcript is supplied.

## Planning decisions that shaped the app

The original was a forecast explorer, not a user bracket-picking form. Its important interactions were a bilateral regional bracket, a sortable advancement-probability table, a historical snapshot timeline, and exploration of a team's route. The supplied hash selected men's tournaments, so this example covers men's tournaments only.

Data research recovered 83 genuine FiveThirtyEight snapshots across the seven played tournaments from 2016 through 2023. Their dates can include that day's games, and their final available snapshots precede the title game. The 2020 tournament was cancelled and has no invented field. Actual results were collected separately, with title winners cross-checked against NCAA history.

For 2024–2026, frozen T-Rank ratings from the morning after Selection Sunday feed Bart Torvik's published neutral-court log5 formula. Exact bracket propagation includes every possible opponent and all four First Four games. Only one initial reconstruction exists per year. It does not use actual tournament winners or later ratings and is not represented as a forecast published by the source providers.

## Skills and recipe

Browser App Builder's Setup, Plan, Build, Evaluate, and Deploy preparation guide the handoffs. Campus Designer supplies the local EB Garamond/Open Sans pairing and unchanged Duke palette without institutional marks or affiliation claims. The ECharts recipe supports the selected team's historical title-probability line, with a text table equivalent. Native HTML and SVG are sufficient for the fixed tournament tree and sortable table; no additional table or graph library was needed.

The managed build uses pinned ECharts 6.1.0 and Vite 8.3.4 with the committed lockfile. The published app is static and uses local assets and data. Optional source-retrieval utilities are maintainer tools, not runtime dependencies.

## Verification and revisions

The coordinating agent reported 72 of 72 automated data/model checks passing on the configured Mac. These include original CSV known answers, field and round counts, probability conservation, First Four sharing, no-contest handling, and independently calculated reconstruction cases. Structural invariants do not prove predictive accuracy.

An independent source/model reviewer found and verified corrections for six concrete defects: stale central finalists after changing teams; route labels that disagreed with visible text; VCU incorrectly described as advancing; replay skipping the initial snapshot; selected First Four losers overwriting real Round-of-64 entrants; and an empty chart after a browser back-forward-cache restore. Later browser review also caught a team selector that did not navigate to the selected narrow-screen region and tiny nonzero chances announced as 0%. Both were corrected; real-source and near-certainty formatting cases were added to the automated checks. Failed findings remain part of the development record rather than being erased.

The final tested source commit and actual browser observations belong in EVALUATION.md. Neither source review nor automated checks establish full screen-reader accessibility, novice usability, clean-machine installation, or a successful live deployment. A compact public-facing account is in `app/build-story.html`; full reports remain outside `dist/`.

## Source trail

- [Original dashboard](https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens)
- [FiveThirtyEight data and attribution](https://github.com/fivethirtyeight/data)
- [Bart Torvik's rating and log5 explanation](https://adamcwisports.blogspot.com/p/every-possession-counts.html)
- [Bart Torvik's archived-data guidance](https://adamcwisports.blogspot.com/p/data.html)
- [NCAA championship history](https://www.ncaa.com/history/basketball-men/d1)

Each bundled year retains its exact source URLs and corrections. DATA-NOTICES.txt describes the source-specific rights and transformations; library and font notices are separate.
