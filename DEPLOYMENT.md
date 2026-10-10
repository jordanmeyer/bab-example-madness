# Deployment

Public source: https://github.com/jordanmeyer/bab-example-madness

Live application: https://jordanmeyer.github.io/bab-example-madness/

Build story: https://jordanmeyer.github.io/bab-example-madness/build-story.html

## First verified deployment — October 9, 2026

The user explicitly authorized this new public repository, Pages, and the plugin gallery entry. Created the empty public repository in the existing authenticated GitHub account, selected GitHub Actions as its Pages source, and pushed ordinary `main` history. No account, authentication scope, unrelated remote, or system setting was changed.

- Evaluated application/source checkpoint: `2f44204` (numerical/interaction source `59f0fad`).
- Published commit: `77e6e4021a51dda201bfeeb32f413ff73ec20bd4`.
- Successful workflow: https://github.com/jordanmeyer/bab-example-madness/actions/runs/38013910203.
- GitHub Actions used the committed lockfile and Node version, built static output, and uploaded only `dist/`.

Observed in the live application:

- Initial 2023 Houston title chance: 22.085%, with original FiveThirtyEight attribution.
- 2026 Michigan reconstructed title chance: 17.762%, dated March 16, with single-snapshot controls disabled and distinct T-Rank/log5 attribution.
- Results mode: Michigan's 69–63 championship win over UConn on April 6, with forecast and outcome views separate.
- 2020 displays cancellation, without a bracket or fabricated probability.
- The public build-story page renders, and the source link targets this repository.
- Assets load under `/bab-example-madness/`, including bundled fonts/data. Browser error/warning logs were empty during these representative interactions.

The main JavaScript asset is `main-CeFH68Bc.js`; the deployment adds no visitor-side API or telemetry. Relevant source is unchanged by this deployment-report commit. A returning-browser reload can confirm the same published app; a changed-JavaScript cache update has not been exercised in this initial release.

## Ordinary updates

Edit locally, review model/scope changes against PLAN.md, run affected browser/model checks, create a clean source checkpoint, and update EVALUATION.md. Check tracked and untracked relevant paths before pushing ordinary commits to main. Wait for the matching Actions run and inspect the live known answers and source link. Vite module assets carry content-based filenames; changed files copied verbatim from `app/public/` require deliberate versioning and returning-browser verification.

Local source is retained at `/Users/jordan/Projects/bab-example-madness`. Setup commands are documented in SETUP.md. Human accessibility, phone touch, novice usability, and predictive-model calibration limits remain in EVALUATION.md.

## Documentation follow-up and final display check

Report-only commit `659f9d18778b5ec5f76bbf032f1ae5bd422246eb` passed https://github.com/jordanmeyer/bab-example-madness/actions/runs/38014017853. A returning browser loaded `main-CeFH68Bc.js`, rendered Houston’s 22.085% initial forecast, and logged no errors/warnings. Relevant source did not change.

A foreground live browser was then measured at 375 × 900 CSS pixels. The table is the initial view, the body has no horizontal overflow, arrow keys scroll the table within its container, and choosing Duke displays the East regional bracket. Screenshot evidence is retained in the course gallery record. This verifies responsive browser layout, not physical touch or screen-reader behavior.

## Comparison correction deployment

Evaluated source: `34bd4335e7c8297b5534e3ce2fa35b41db05a5d0`. Published correction/report commit: `c8b7e81e98b9542fa41b9e35234a743ca73c9197`. [Actions run 38015656925](https://github.com/jordanmeyer/bab-example-madness/actions/runs/38015656925) completed successfully.

A returning live-browser tab reloaded and received `main-DHFdrHeu.js`, replacing the initial `main-CeFH68Bc.js`. It exposed twelve dated 2023 controls, displayed Houston 22.085%, and previewed Alabama 16.176% with all final-round routes while Houston remained pinned. The 2026 view retained one disabled-replay reconstruction, Michigan 17.762%, and its separate 69–63 championship result. The 2020 selection hid the workspace and showed cancellation. Observed error/warning logs were empty. The revised gallery image shows the complete connected 2023 bracket. The correction changes UI behavior and date presentation; all historical data, derivation, locked dependencies and the publication workflow remain unchanged.

The source checkpoint passed 74/74 Node and browser cases and a clean production build. The independent comparison review passed with its evidence limits explicit in `review/fidelity-review.md`. This documentation follow-up changes no evaluated application source.
