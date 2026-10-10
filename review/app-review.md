# Independent Tournament Atlas app review

Reviewed 2026-10-09 by a separate read-only agent. Scope: complete `app/main.js`, `app/model.js`, `app/style.css`, `app/index.html`, browser-test cases, normalized data, and the reconstructed forecast generator. Application folder: `/private/tmp/bab-example-madness-2026-10-09`.

## Result

**Source/model review passes after the six corrections below.** I re-read each correction in the application source. The coordinating agent owns rendered/browser acceptance. My attempt to open an independent review tab returned `Browser is not available: iab`; `cua.listBrowsers()` returned an empty list. I therefore do not count the coordinator's reported browser checks as independent browser observations.

## Findings corrected through developer review

1. **Incorrect no-contest copy.** Oregon and VCU both received “advanced by rule.” The game row now branches on the recorded advancement winner, showing VCU “did not advance” and no invented score for either team.
2. **Stale center bracket.** Selecting a new team updated regional route and title probability but left old Final Four/final participant projections. Center buttons now update in place with the selected route, preserving the existing focused button.
3. **Stale accessible route labels.** Hover/focus decoration changed the visible team without changing the accessible label, and restored nodes could retain another team's tooltip. Decoration now refreshes title and aria-label on both the active route and restored nodes.
4. **Replay skipped its initial frame.** Playing from the last snapshot reset the index without rendering, so the next interval immediately displayed frame 1. It now renders frame 0 before playback resumes.
5. **First Four loser appeared in Round of 64.** A `round === 0` shortcut allowed any selected play-in team to overwrite its settled R64 entrant even when its probability was zero. In Results this falsely described the losing team as “Reached.” All stages now require positive probability/reached state before overlay. Losing play-in teams remain inspectable in the team selector and First Four list. The initial unresolved play-in projection also displays its R64 probability.
6. **Back/Forward cache lost the chart.** `pagehide` disposed the chart but cached-page restoration did not rebuild it. A persisted `pageshow` now restores only the active forecast chart. The existing snapshot, selected team, expanded history, and paused playback are retained.

The developer also exposed the source metadata's rating methodology and source-data guide links in the UI and added a visible data-credits link.

## Checks from source and independent data review

- All eleven years are selectable; 2020 is a cancellation state with no fabricated bracket or probabilities.
- Forecast candidates come from region/seed topology, not observed later-round contestants. The reconstructed model never reads results. First Four pairs are actual initial matchups, not eventual winners.
- Forecast and result modes are separated; the result path does not masquerade as a probability model.
- Reconstructed 2024–2026 sources, dated initial snapshot, held-fixed model assumptions, and lack of daily history are explicit. The date slider and playback disable for the single snapshot.
- Original forecast replay and selected-team history use only recorded snapshots through the selected date. Snapshot dates are publisher calendar dates, not claimed tip-off timestamps.
- Game dates display in America/New_York, including the 2026 title game on April 6 despite its April 7 UTC timestamp.
- Changing years pauses playback, disposes the old chart, hides old content, and guards against out-of-order async loads. Switching result/forecast modes also pauses playback.
- Actual probabilities are sorted numerically; display rounding does not determine order. Distinct labels preserve tiny positive versus zero and nearly certain versus certain values.
- Imported/bundled names and source labels are escaped before HTML interpolation. Data and JavaScript assets use the repository base path; chart/fonts are local.
- A sortable native table and team selector provide alternatives to the dense bracket. Exact history is available as a table. These source measures do not establish actual screen-reader usability.

## Rendered regressions requested from coordinator

- 2023 Texas Southern in Results must not replace FDU's R64 berth; its detail must say it reached the First Four.
- 2021 VCU versus Oregon no-contest rows must differ in advancement, with no score.
- Changing teams updates both center projections and regional accessible labels while preserving keyboard focus.
- Replay from the end displays the initial snapshot before advancing; year/mode changes stop it.
- Navigate away and Back: chart returns, replay remains paused, selection/snapshot are retained if the browser uses its back-forward cache.
- Narrow table/bracket, desktop rendering, keyboard and visual zoom checks remain the coordinator's browser coverage.

## Handoff notes

- Replace the temporary general course evidence source URL with the actual example repository/build-record destination before publication. The current generic URL does not yet identify this app's source.
- No source/model blockers remain after the corrections above. Actual screen-reader testing and novice usability are not claimed. The independent data/model reports are `/private/tmp/bab-madness-data-review.md` and `/private/tmp/bab-madness-derived-review.md`.

## Final published-source delta review

Reviewed `/Users/jordan/Projects/bab-example-madness` after publication, bounded to the final formatting, region-picker, and two-page build changes. **Pass; no concrete bug found.**

- Directly evaluated percentage endpoints and both threshold boundaries. Zero remains `0%`, one remains `100%`, positive sub-threshold values remain `<0.001%`, and near-certainty remains `>99.999%`; exact boundary values render `0.001%` and `99.999%`. Ordinary values keep three-decimal maximum precision. The chart tooltip converts its percentage values back to probabilities before using the same formatter.
- An explicit narrow-screen team-picker change updates the regional selector and active panel in place, then selects the team. Hover/focus decoration does not invoke that regional change or rebuild the focused controls.
- Vite includes both `index.html` and `build-story.html`. The inspected generated HTML has repository-path CSS/JS references, relative navigation between both pages, local notices, and the actual `jordanmeyer/bab-example-madness` source links. The published checkout correctly excludes generated `dist/`; the build output inspected was retained in the trial folder.
- The tested executable paths have no changes from checkpoint `2f44204` through published-record commit `659f9d1`. Final rendered verification and 72/72 browser results were performed by the coordinator; this delta pass is independent source review plus direct formatter boundary checks.
- The data-preparation documentation now states its working directory and no longer claims a missing normalized-inventory report.
