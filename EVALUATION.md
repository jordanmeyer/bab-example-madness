# Evaluation

## Campus Designer checklist — October 10, 2026

Evaluated source: `72fb26c2b55b93f87c4f810a90398b85b28ee27f` (application and browser regression implementation `d93f75a`; the final source commit only shortens the story's navigation label after a phone render exposed wrapping).

The user's 32-item design review replaces the earlier literal black-strip/tinted-table styling. The explorer now shares one centered column, transparent Open Sans strips sit above their hairlines, selection and elimination differ visibly, dates form a calendar, and the table uses five published solid colors with unfilled reached checks. Single-snapshot years and one-point histories are compact. Results add winner-first score tooltips and a championship score. Pins scroll to detail before First Four. Whole-canvas nearest-slot hover, one bracket tab stop, arrow keys, Escape and tapered rounded route geometry remain.

`node tests/run.mjs`: **80/80**. `tests/design-review.html`: **82/82** in the actual application iframe, including 2,984 rendered labels across all ten played years' initial/last/Results states, distinct compact names for each year's full field, all potential 62px labels, 1024px alignment, 375px scrolling/type floor, known 2023 values, one-point omission, elimination, rounded-zero active 2016 FDU, score tooltips, 2020 controls, and 2024–2026 single-forecast views. `tests/route-rendering.html`: **16/16**, including 30 rasterized seams, negative control, animation, interruption and retirement.

Production screenshots and interactions were separately inspected: desktop 1313px and a second 1193px effective viewport; 375px phone; initial leaders; keyboard Alabama route; Mar 25 elimination and history; Results; table; 2020; 2025; build story. Pin scrolling settled with the detail top 16px from the viewport top. The phone table's visible height equals its scroll height, and the page width stays 375px. No captured production error/warning logs during representative interactions. Reduced-motion instant scrolling is source-reviewed; no OS preference was changed.

Failed rounds retained in course evidence: first implementation passed 46/63 checks, exposing narrow labels; reviewed abbreviations brought that to 62/63, then all fit. Visual review caught hairlines crossing names and story-header wrapping. Source/data review caught an active team's rounded-zero title probability: elimination now requires the archive's alive flag, preventing a future-loss disclosure. Unresolved First Four slots use “First Four winner,” with both full names in the tooltip, accessible label and First Four section, instead of cramped codes.

Build passed: `main-CfqeVjX3.js`, `style-B90lqaW9.css`. Frozen tournament files, model calculations, dependencies, lockfile and workflow compare unchanged against the previous release. Only static application files and notices are published. The existing 538.93 KB bundle warning remains; this task adds no library. Screen-reader speech, physical touch, novice usability, other browser engines and predictive calibration remain unverified. No independent reviewer was commissioned for this task; these are coordinator checks.

Reproduce from the project root with the verified Node 22.19.0/npm 10.9.3 pair: `npm ci`, `node tests/run.mjs`, `npm run build`, `npm run test:browser -- --port 9741`, then open `/tests/design-review.html` and `/tests/route-rendering.html`. Separately run `npm run preview -- --port 9742` and open `/bab-example-madness/`. Evidence: the course repository's `evidence/browser-app-builder/madness/2026-10-10/design-review/`. Prior evidence below remains historical.

## Width-matched corner geometry — October 9, 2026

Evaluated source: `58d7cdd5b1baffacf2312fc261b2f680c0fca20b`. This replaces the rejected round-cap workaround below. Flat path ends meet an ellipse whose radii match the two adjacent stroke widths; the curve cannot protrude beyond the narrower vertical band. The join waits for the incoming drawn path and follows both widths during growth and retirement. Interrupted paths preserve their current dash positions and widths.

`tests/route-rendering.html`, served by `npm run test:browser -- --port 9741` at `http://localhost:9741/tests/route-rendering.html`, passed **16/16 rendered checks** against the actual application iframe. Thirty seams across Alabama, Maryland, Kansas, Arizona, Houston and Fairleigh Dickinson were rasterized at 16 pixels per SVG unit and checked for overhangs and missing corner fill. A negative control restores the rejected round caps and detects their overhang. Six frozen animation checkpoints, interruption, shrinking visible joins and clearing passed. The rendered Alabama SVG was inspected at four times its actual size. See the [bounded independent review](review/corner-geometry-review.md).

The unchanged numerical suite passed **80/80**. The production build passed with `main-Dl6dz9Jv.js` and `style-DH0Cp_SR.css`; its 22 output files contain no tests, review records or development dependencies. The existing bundle-size warning remains. Production preview was inspected separately, including an unpinned pointer preview, with no captured errors/warnings. The iframe test tab's tool log contained three MutationObserver errors without source locations; no MutationObserver usage exists in the app, tests, ECharts, zrender or Vite client source. Their origin is unconfirmed; all visible test assertions completed. This does not establish universal browser compatibility, human accessibility or model calibration.

## Rejected round-cap workaround — October 9, 2026

**Rejected after publication.** The user’s enlarged screenshot demonstrated protruding caps at unequal-width connections. The earlier visual acceptance below was incorrect.

Previously evaluated source: `a58ed7b3aa92a22e090a3be3815377d08b65b00c`. The one-line CSS correction adds round caps to highlighted route segments. Round joins already covered bends inside each segment, but the separate paths left square ends at connections between rounds and at the title stem.

The production build passed, producing `main-DQNGODc9.js` and `style-DRKxRvGj.css`. Coordinator inspection of the rendered Houston route confirms rounded connections and unchanged settled widths (15.2813, 13.4165, 12.0046, 10.0643, 8.83306 and 7.5492 pixels). A separate mouse preview of Maryland, with no pinned team, displayed the same rounded connections and six settled route segments. No browser errors or warnings were observed. The [independent corner review](review/corner-review.md) records additional visual and interaction checks.

This is a targeted rendering check; the previous 80-case numerical suite and broad layout matrix were not repeated for a CSS cap change. No geometry, probabilities, data, dependencies or animation logic changed.

## Complete fidelity checklist — October 9, 2026

Final presentation checkpoint: `8f9147c0ad0094c0ae7a3b9edd2946e23efd6962`. This one-line follow-up removes a duplicated Winner label for champions; it changes no model, layout, route or data. Independent source review and coordinator production-browser checks confirm Connecticut displays Winner once while Houston retains Eliminated in Sweet 16. The build passed with `main-DKaVtwEg.js`; CSS is unchanged. The broader evidence below is from `7ffc82d`, whose relevant sources differ only by this reviewed label expression.

Evaluated source: `7ffc82d2df7e702bd3c3bf367c39e2537636e2f5`. The user’s 21-item checklist supersedes the prior bounded one-season geometry acceptance. The [independent checklist review](review/checklist-review.md) gives all 21 corrections a bounded pass, with no unresolved blocking findings. It covers every year, four desktop widths, initial/late/Results states, 375px phone output, pointer movement over empty space, keyboard navigation, pin/clear, animation and replay. Its 112-state matrix contains 11,168 named-strip measurements with zero clipping.

The clean checkpoint passed **80/80 Node and browser checks** and a production build, producing `main-DQGqCqRq.js` and `style-BQIAlD77.css`. The existing ECharts chunk-size warning remains (533.39 KB minified, 182.22 KB gzip). No dependencies or publishing workflow changed. An independent whole-file comparison against `6f98ed0` confirms that every existing data field is identical after excluding only new display labels and explanatory forecast prose: probabilities, ratings, dates, scores and outcomes are preserved. All generated labels can be reproduced from retained source inputs.

The reviewer directly observed incomplete route growth and shrinkage, 526ms between replay transitions including observation overhead, no hover route during playback, correct Results identity and per-slot losses, canonical bold labels, and a grey unavailable final-date tick. At 1280px the first bracket strip is y391.6; at 375px the first probability row is y503 with title odds second and no page overflow. The minimum measured text contrast among 476 probability cells is 4.7946:1. The coordinator separately confirmed late Houston has no completed-round bands, Results says Eliminated in Sweet 16, a fresh year clears the pin, and all 80 browser cases pass without console errors.

Failed correction rounds are retained: the initial candidate still had a tall control stack, later-year Results incorrectly carried a reconstruction badge, no-pin browser restoration could try to render a missing chart, and First Four pressed states needed centralized clearing. These were corrected before the final checkpoint. A separate simplification pass removed duplicate date controls, hidden unused status nodes, one-year UI abbreviation maps and redundant selection parameters.

Reduced-motion handling is source-reviewed; the actual preference was not emulated or changed. Screen-reader speech, physical touch, novice usability, other browser engines and predictive calibration remain unverified. No OS accessibility settings changed. Publication results are recorded separately in DEPLOYMENT.md.

## Original geometry correction — October 9, 2026

Current tested source: `40c6a1e0b2036c7b7e02fc60a279f4954f1abdac`. The user rejected the prior card layout despite its earlier bounded review. The new [independent original-geometry review](review/original-geometry-review.md) measures the actual reference, retains two failed correction rounds, and passes the final desktop candidate.

One continuous bilateral tree replaces separate region/card layouts. Final Four branches sit at regional centers and converge into championship entrants at the vertical midpoint. Names appear initially only at outer terminals, then on compact settled-entrant strips as replay advances. Hover/focus probabilities sit outside the horizontal bands. Width is `0.5 + 15 * sqrt(p)`, matching the original's observed scale; inactive underlays are removed from active shared segments so tiny probabilities remain thin. Exact probabilities and full names remain available through labels, titles, table and detail. Undecided slot targets remain the most likely entrants regardless of the previewed team.

The clean checkpoint passed **74/74 Node and browser checks**, and the production build generated `main-CGWQTFsc.js` / `style-DnBVnImn.css`. The existing bundle warning remains (530.38 KB minified, 181.32 KB gzip). No data, model functions, dependencies or workflow changed. Relevant source was clean before and after the checks.

Independent browser comparison at 1280px verified original geometry, upper-left Alabama/lower-right Houston routes, tiny Texas Southern probabilities, blank initial internal slots, compact April 1 settled labels, and keyboard preview/restore. The reviewer caught and rechecked an incorrect preview-dependent most-likely target and clipped names. Coordinator separately verified Results: selecting eliminated Texas Southern retains Fairleigh Dickinson's Round-of-64 berth and produces no active future route. At 375 × 900, default table/body widths were 343/375, the complete bracket scrolled within its 343px container, ArrowRight moved 40px, and selecting Houston revealed its terminal at x225–350. Narrow Bracket now shows one horizontally scrollable full tree; Table remains the compact default. No application console errors/warnings were observed.

This bounded review establishes the exercised visual/interaction corrections; it does not certify every name/year layout, screen-reader speech, physical touch or novice usability. Publication is recorded separately below and in DEPLOYMENT.md. Earlier rounds remain preserved as historical evidence, not as the current visual acceptance.

## Previous comparison correction — October 9, 2026

Previously tested source: `34bd4335e7c8297b5534e3ce2fa35b41db05a5d0`. An independent reviewer compared the archived original with the live recreation and required six UI corrections. The [retained review](review/fidelity-review.md) preserves the failures and two follow-up correction rounds, ending in a bounded PASS. The final re-review combines corrected source, independently inspected captures and explicitly attributed coordinator interaction measurements; the reviewer's browser became unavailable during follow-up.

Hover and keyboard focus now preview the same team through the complete bracket and title probability. Explicit selection pins the detail panel. Selected finalist hover remains white on navy (14.76:1). Final-round paths connect around the title card; a North Carolina–Asheville regression confirms resized cards and connector endpoints agree exactly. The first desktop team row moved from about 699 to 486 CSS pixels. The replay offers genuine dated choices positioned by elapsed days, and multi-point history uses UTC calendar spacing. One-point history has one date label.

From the clean checkpoint, `node tests/run.mjs` and the browser `/tests/` page both passed **74/74** cases, including two new calendar-gap cases. `npm run build` passed with `main-DHFdrHeu.js` and `style-B25DorEd.css`. The existing chunk-size warning remains (532.21 KB minified,181.35 KB gzip); it is not a build failure. Data files, model derivation, dependencies and publication workflow match the initial release. A generated Finder metadata file was removed from `app/`; relevant source has no staged, unstaged or untracked files.

Actual browser checks: Alabama focus showed 16.176% and the complete regional/Final Four/final path while Houston remained pinned; leaving restored Houston. Selected-card hover computed white on navy. April 1 selected the real last 2023 snapshot and calendar gaps remained visible. At 375 × 900, body width was 375, table width 343 and sticky names 138; keyboard moved horizontal table scroll 80 px, and selecting Duke opened East. Long-name central cards grew to 74.5625 px and both final connector endpoints matched the title top at 577.8203125 px relative to the grid. No console errors/warnings were observed. Screenshots and measurements are retained in the course repository's fidelity-review evidence folder.

Live publication is recorded in DEPLOYMENT.md. Human/device limitations below still apply.

## Initial publication source

Release source checkpoint: `2f44204` (publication links and retained review reports). Numerical and interaction implementation: `59f0fad2927ff297d650a41b45ce3a8d215e12ce`. The only application changes between them are source-repository links in two HTML pages. The final production build used the release checkpoint; its main JavaScript remains `main-CeFH68Bc.js`.

Relevant paths: `app/`, `tests/`, `scripts/`, `data-inputs/`, `data-preparation/`, `.github/`, `package.json`, `package-lock.json`, `vite.config.js`, `.npmrc`, `.node-version`, and substantive `PLAN.md` changes. Documentation-only evaluation/deployment records do not change these sources. `dist/` and `node_modules/` are ignored outputs.

## Round 1 — exploratory data checks

On October 9, 2026, the initial ten played years and cancelled 2020 passed 52/52 checks. This round preceded UI implementation and the replacement forecast model. It established neither final browser behavior nor publication.

## Independent review and corrections

The separate reviewer compared all 670 scheduled game records against raw ESPN inputs, all 39,508 FiveThirtyEight probabilities against archived CSVs, and title winners against NCAA history. The 2018 LIU identity/seed correction and 2021 Oregon–VCU no-contest are explicit. There are 669 played games: the no-contest has no invented score.

For 2024–2026, all 204 team ratings and joins match dated pre-tournament T-Rank inputs. All 1,428 derived probabilities match an independent odds-ratio/bracket calculation, maximum difference 3.33e-16. Fair-coin and one-strong-team examples provide hand-calculated oracles. A test prevents the model from consulting recorded results. These checks establish implementation consistency, not predictive calibration.

The independent app review found and verified six fixes: VCU's advancement copy, stale central finalists, stale accessible route labels, replay skipping its first frame, First Four losers replacing actual entrants, and chart restoration after a back-forward-cache return. Coordinator browser review additionally corrected narrow team-to-region navigation and tiny positive probabilities announced as zero. Reports in `review/` preserve the findings and distinguish source inspection from actual browser observations.

The preparation scripts reproduced all eleven year files, index, and three frozen rating inputs exactly using retained raw inputs. Fresh retrieval may depend on continued upstream availability; the review did not re-download every source.

## Final configured-Mac checks

Environment: Node 22.19.0, npm 10.9.3, Vite 8.3.4, ECharts 6.1.0, Codex in-app Chromium browser. `npm ci` installed the locked tree: 19 packages, 20 audited, zero reported advisories. The approved-dependency checker passed. This is not a security certification.

- `node tests/run.mjs`: **72/72 passed**.
- Browser page `http://127.0.0.1:9741/tests/`: **72/72 passed**, no observed console errors/warnings. One running development server initially retained the earlier 70-case module; restarting that owned server loaded the updated 72-case suite. No tests were counted as passing until the visible count matched.
- `npm run build`: passed. Production preview used `http://127.0.0.1:9742/bab-example-madness/`. Vite reports a size warning for the 528.58 KB minified ECharts/app chunk (180.26 KB gzip); no framework or extra library was added to conceal it.
- Output contains two HTML pages, bundled script/styles/fonts, eleven year JSON files plus index, and required notices. It contains no tests, source handoff reports, data-preparation tooling, dependency directory, or symlinks.
- All eleven year selections were observed. 2020 clears the active workspace and shows cancellation; 2024–2026 identify their reconstruction and disable replay. Historical snapshots retain their actual dates.
- 2023 Houston initial title chance renders 22.085%; the last archived snapshot is zero. Replay from the final date first renders March 12, then advances. Pause stops it.
- Selecting 2023 Texas Southern in Results leaves Fairleigh Dickinson in the Round-of-64 slot and shows Texas Southern's First Four loss, 61–84.
- 2021 VCU shows “did not advance”; Oregon shows “advanced by rule.” Both no-contest rows have “No score.” Oregon's played games remain separate.
- 2026 Michigan shows a 17.762% initial title chance; Results shows its 69–63 title win over UConn on April 6 (Eastern Time).
- Team selection updates regional and central routes. At narrow width it navigates to the selected team's region. Keyboard Enter sorts by seed and full numeric title probability while retaining header focus. Tiny positive source values announce `<0.001%`, distinct from zero.
- Desktop CSS width 1439 and narrow CSS width 727 were observed without body overflow. Narrow defaults to the sortable table and offers one regional bracket at a time. That local attempt did not establish phone width. A later live-site foreground check measured 375 × 900 CSS pixels, body scroll width 375, default table display, keyboard horizontal scrolling within the table, and Duke selection navigating to the East regional bracket. Physical phone/touch behavior is not claimed.
- The local build-story page opens and browser Back returns a rendered chart with replay stopped. This browser loaded a fresh document; preservation of state through its actual back-forward cache was not exercised. The persisted-page handler was source-reviewed only.
- Observed asset inventory included only same-origin script, CSS, three fonts, index, and selected-year JSON. Source review found no external runtime requests. This bounded observation is not proof that arbitrary JavaScript cannot transmit information.

## Limits

Actual screen-reader speech, novice usability, phone touch behavior, clean-machine installation, Windows, and model predictive accuracy remain unverified. Live Pages results are recorded separately in DEPLOYMENT.md. The final bounded independent delta review also passed the precision, narrow-region, and two-page publication changes.

## Final-day timeline correction — 2026-10-10

Evaluated source: `b2685ee89f20dba8a3214eccc06ddadf9f57ed23`. The calendar includes half a day beyond each endpoint; ticks, full-day shading, labels and click snapping share that range. Browser design regression: 110/110 (including 28 new geometry/click checks across all seven archived timelines); data/model checks: 80/80. Production build passed with the existing large-chunk warning. Desktop production preview at 1194 × 890 visibly centers Final beneath Apr 3. A narrow preview retained the full final band; the browser sizing override reported 341 CSS pixels rather than the requested 375, so the existing harness provides the exact 375px overflow check. No data, calculation, dependency, CSS or route-rendering changes.

## Unboxed team hover and attached routes — 2026-10-10

Evaluated source: `39e9069495f50854dbb33a611ed319b65c5a220f`. Removed the yellow selected fill, generic button hover shadow, and team-label bottom border. A short navy connector runs from the rendered text edge to the first uncertain route segment, including late forecasts and First Four labels. Keyboard-only focus uses a text underline or a dot for empty slots. Whole-canvas nearest-slot preview is retained.

Observed native pointer transitions over Alabama and Maryland have transparent backgrounds, no shadow and no border. Route rendering: 22/22, including five name-to-route attachments, late-round origin, clearing, interrupted animations and rasterized corners. Design regression: 110/110; model/data: 80/80. Production build passed (existing bundle-size warning). Final keyboard-dot CSS was checked in production preview after rebuilding; it changes no route geometry. No data, model, dependencies or publication configuration changed.

### Corrected after visual feedback: centered, full-width attachment

The preceding thin connector was rejected by the user: it did not share the probability stroke width and the bracket remained below the label center. Source `dad8ad6991c0d871506e4842190827c148052a98` removes that separate connector. The first probability path now begins beside the text and includes the extension in the same SVG stroke and animation. Labels are centered vertically on their bracket coordinates; white behind the text prevents background paths from striking through resolved names. No yellow fill or label border returns. The user’s explicit centering direction supersedes the prior above-line alignment.

Route rendering checks: 22/22; design checks: 110/110 with 2,984 rendered labels. Checks compare the actual path origin to the rendered name center for ordinary, First Four and late-forecast teams, preserve both-side corner raster checks, and confirm clearing removes all routes. Rebuilt production preview visibly confirms the centered full-width route. Model/data source is unchanged; 80/80 checks passed during this correction. Evidence retains the earlier failed design decision rather than presenting it as accepted.

## Continuous team-to-title animation — 2026-10-10

Evaluated source: `752012758e93c3fcf4b3606f67ddca0e0e23e21f`. Independent 45ms stage staggering started downstream strokes before the incoming dash arrived. Entering paths now share a clock and cumulative delays proportional to actual path length, completing the route in 900ms. The calculation includes the full-width text extension and skips completed rounds. Existing corner geometry, retirement behavior and reduced-motion bypass remain intact.

The new browser checks reproduced premature downstream strokes at 50ms (incoming path still 66.7% undrawn) and delayed starts in late forecasts. After correction: 25/25 actual rendered checks, including left/right/First Four routes sampled every 25ms, late-round immediate start, interrupted transitions and rasterized corners. Model/data: 80/80. Production build passed with its existing large-bundle warning. Production preview confirmed only the first stroke drawing while all five downstream paths remained undrawn; no browser console errors observed. No data, dependency, CSS or publication configuration changed.

## Smaller probability thresholds — 2026-10-10

Evaluated source: `3125553c9b7cd2635959791b5c3d004bd01014ec`. Shared labels now show `<0.1%` below 0.1% and `<0.01%` below 0.01%, preserving `<1%` for the remaining sub-percent values. Strict threshold boundaries, zero and certainty pass in the 81/81 model/data checks. Source probabilities, exact-value tooltips and sorting are unchanged. Archived rounded-zero active teams retain their existing explanatory treatment rather than inferring unsupported precision.

Production preview: 2023 Howard shows `<0.01%` in the center and later route labels; North Carolina State's table title chance shows `<0.1%`. The initial six-character center label overflowed its 144px panel; reducing only longer center labels to 2.7rem removed that overflow (scroll width and client width both 144px). Final production build passed with the existing bundle-size warning.

## Remove picker and center commentary — 2026-10-10

Evaluated source: `c583bf815439a76a9b89e28be5348c0e58038c30`. Removed the Find a team dropdown, its population/synchronization/listener code and associated CSS. Removed the two unselected-center sentences while retaining ranked title chances and selected-team/result status. Existing browser checks now select actual bracket and First Four buttons. Route checks: 25/25. Design and interaction checks: 110/110, including 2,984 rendered labels, keyboard navigation, direct selection and 375px layout. Production build passed with the existing bundle-size warning; desktop production preview confirms the simplified interface. No model, data or dependency changes.

## Filled round slots replace horizontal lines — 2026-10-10

Evaluated source: `e1522b60e9c6664c1a65eac06a080f2da172bf8a`. Resolved round slots omit the horizontal backbone segment beneath the entire slot. Vertical connectors remain, and original path geometry is retained for uncertain highlighted routes. This applies to regional rounds and finalist slots on both sides. Design checks: 140/140 across initial/final forecasts and Results for all ten played seasons, including actual path geometry under filled slots. Route checks: 25/25, including late-round attachment and continuous growth. Production build passed with the existing bundle-size warning; March 17, 2023 was visually checked against the user’s screenshot. No data, calculation, dependency or typography changes.

## Measured opening columns and redistributed spacing — 2026-10-10

Evaluated source: `8029793f38ea9c925ad8d69c3e71a208d1541582`. Opening columns fit the longest existing displayed team label measured in the loaded 600-weight Open Sans font, plus seed/gap/padding. An unresolved First Four placeholder is included when needed. Reclaimed width is divided equally among the five subsequent horizontal segments, mirrored on the right; headers and finalist slots derive from the same coordinates. On March 17, 2023, opening width is 111px instead of 128px, adding 3.4px to each later segment. Initial snapshots retain space for First Four winner. Production preview was inspected; 140/140 layout checks and 25/25 route checks pass, including 2,984 labels, late snapshots, Results, narrow output, name attachment and continuous animation. Production build passed with its existing size warning. No data, model, dependency or font changes.

## Matching connector ticks on filled rounds — 2026-10-10

Evaluated source: `09d7087c67014d9179d89f2fd5aa07940101f8cd`. Filled regional and finalist slots retain the same 4px horizontal terminal ticks as the opening round, without restoring the line across the label area. The existing geometry checks now require these ticks at the actual slot edges on both sides: 140/140 layout checks pass across ten played seasons; 25/25 route checks pass. March 17 production preview visually confirms the matching brackets. Production build passes with the existing bundle-size warning. No data, model, dependencies, spacing or type changes.

## Full-width evidence accordions — 2026-10-10

Evaluated source: `da966192d8b50d860efa33fc6da5936d48cd424b`. Reading the evidence is a collapsed native details section beside Sources and How this was built. Removed the redundant heading and dashboard footer; retained source and license links inside the sections. All three sections span the content width (1004px desktop, 355px at a 375px viewport). Enter opens and Space closes each section; dynamic 2023 coverage and source links remain available. Narrow viewport body width equals 375px, with no page overflow. Production browser console has no errors. Build and whitespace checks pass; existing bundle-size warning remains. No bracket, data, model or dependency changes; no redundant tests added for this markup-only correction.

## Fixed Results summary position — 2026-10-10

Evaluated source: `7a2ce700659251ccb29de398fbd191d5e1cd41e4`. Results summaries retain their 210px top position during hover, keyboard focus and selection; the lower position applies only to a selected forecast. The new real-browser pointer regression reproduced the 132px championship score jump in all ten played years (150/160 checks before the fix). After correction, 160/160 layout checks pass across 2,984 rendered labels, including score position on hover and exit. Production preview confirms the 2023 76–59 score at the same position before and after champion selection. Build and whitespace checks pass, with the existing bundle-size warning. No model/data/dependency changes.

## Women’s tournaments and competition toggle — 2026-10-10

Evaluated source: `7ae9c94361920956d161f634a64d2782cfaf6049`. Added 650 women’s tournament games for the ten played seasons 2016–2026, explicit cancelled 2020, and 74 original FiveThirtyEight snapshots for 2016–2019 and 2021–2023. Women’s 2024–2026 have results only because verified historical pre-tournament probability inputs are not bundled. Men’s frozen yearly files remain unchanged. Raw provenance/digests and documented region-label reconciliation travel with each dataset.

Data/model checks: 132/132, including independent original probabilities, known NCAA championship scores, 64/68-team field sizes, game topology and probability totals. Existing men’s layout checks: 160/160 (2,984 labels). Women’s integration: 95/95, spanning every season’s available initial/final forecasts and Results, source downloads, First Four presence, chart rendering, 2020 recovery, six-stage hover paths, same-school-ID cache isolation, rapid competition/year switches, playback/pin resets and phone controls. Route rendering: 25/25. The first women’s browser run failed ten width checks for four names; reviewed abbreviations corrected Albany (NY), Central Michigan, Missouri State and South Dakota. The resizing harness retains its known ResizeObserver notification warning; production console has no errors.

Production preview at the repository base path verified South Carolina’s initial 2023 64% title chance, LSU’s 102–85 final, UCLA’s 2026 79–51 final, explicit results-only coverage, men’s Houston 22% restoration and keyboard switching. At a measured 375px viewport the page width is 375px; native table scrolling remains available. Build and whitespace checks pass with the existing bundle-size warning. No new dependency, runtime service or telemetry. Screen-reader/novice-user checks remain human acceptance tasks.


## Complete opening sources and historical blends — October 10, 2026

Evaluated source: `7568eb9f086e77cb435c961d630ab0ff05379765`. Source selection uses 37 complete opening fields across 20 competition/seasons, with Silver restricted to women 2024. Partial ESPN and late Neil Paine fields were excluded per the user. The 60 source/blend options contain 757 dated snapshots. All original archive/result fields remain unchanged. SOURCE-MODEL.md documents inverse identification, rounding, missing First Four assumptions, fixed strengths, prior-season fitting and chronological comparison.

Passed `node tests/run.mjs` (132/132 original checks), `node tests/source-model.mjs` (independent four-team arithmetic, inverse recovery, logistic calibration, 20 real brackets, exact completed outcomes and current/future-label isolation), and `node tests/generated-sources.mjs` (all opening memberships, source/blend snapshots, probability bounds/mass, arithmetic averages, eligibility and scoring). A fresh generation is byte-identical to committed output. Original dataset fields compare equal to the preceding revision. The production build and whitespace checks pass; the existing ECharts chunk-size warning remains.

Browser production checks at the repository base path: all 22 Men/Women/year selections return expected source options/cancellation. Women 2024 exposes Silver only; women 2026 exposes Torvik and its prior-2025 calibration, with no premature validation score. Men 2016 has no ensemble; sources newly observed in 2017/2018/2025 suppress the all-source ensemble. The 2023 comparison shows signed improvements and losses on explicit historical cohorts. Keyboard source selection, Home/End/arrow date controls, Alabama pin/history chart, Results and restoration were observed. Women's 2026 ensemble reaches UCLA at 100% after the final. A 375px iframe containing the production app has body scrollWidth 375, readable year/source controls, native table scrolling, and a comparison scroller of 352px around its 807px table. Desktop viewport measured 1195px.

Failures/corrections: restored a competition-click binding accidentally removed while replacing source markup, disabled stale source selection during a year load, retained original source reconciliation, and widened the phone year selector to prevent clipping. Browser zoom confused automated pointer coordinates, so keyboard controls and measured iframe dimensions were used. One MutationObserver error appeared in the browser's iframe instrumentation; no app MutationObserver exists and direct application checks had no captured errors. This does not certify physical touch, screen-reader behavior or novice usability.

Historical findings are deliberately candid: for the men 2023 comparison the ensemble's Brier improvement is about +0.0014 over KenPom, +0.0038 over Torvik, -0.0008 versus FiveThirtyEight and -0.0002 versus the equal average. Different source rows have explicitly different historical cohorts, each paired with the ensemble on the same games. No universal improvement claim is made. Silver's real printed 100.7% half-region total is normalized, with maximum marginal adjustment 0.3585 percentage point disclosed. No new dependencies or visitor-side external requests were introduced.

## Separate timeline rounds — 2026-10-10

Evaluated source: `5c93050`. Round of 64, Round of 32, Sweet 16 and Elite Eight now have separate date bands. Every band uses the existing limestone gray. Audited Eastern-calendar game dates across all 20 played men’s/women’s tournaments: no day contains multiple rounds. Men 2023 uses March 16–17, 18–19, 23–24 and 25–26 respectively. Production browser checks confirm seven gray bands, women’s 2019 omits First Four, and arrow navigation advances the selected date. Desktop labels fit their bands; compact iframe body and scroll widths both measure 376px, with the existing compact table layout and hidden band labels. No captured browser errors. Build and whitespace checks pass; the existing ECharts bundle-size warning remains. No data, model or dependency changes. Temporary preview harness removed by the final production build.

## Wider responsive explorer — 2026-10-10

Evaluated source: `9ea9ad551d29e1801f8a55c763c5528662813384`. Header/main now share a 1400px maximum and 24px desktop padding (1352px usable); phone padding remains 10px. Bracket geometry expands the five later-round intervals evenly without scaling fonts or line weights. Centered summaries, champion stem and keyboard navigation use the current midpoint. Existing resize observation redraws geometry as needed.

Production browser checks: wide iframe measured main 1400px, bracket/viewBox 1352px, champion/stem x=676. Arrow navigation traversed all six rounds to the champion; active route ends at the current midpoint. Results retains Connecticut 76–59 and centered UConn label. Resizing the direct preview to approximately 1166px measured bracket/viewBox 1119px and champion x=559.5. Compact iframe measured body and scroll widths both 376px, with readable controls and internal table scrolling. Screenshots inspected for wide, intermediate and phone layouts. Browser iframe instrumentation again logged its known MutationObserver error; application code introduces no MutationObserver. Build and whitespace checks passed with the existing bundle-size warning. Final build removed the temporary width harness. No model, data or dependency changes.

## Published FiveThirtyEight timelines — 2026-10-10

Evaluated source: `76bdea84d1e5195c9f8297fdb577c91e1ad0d584`. FiveThirtyEight now selects the retained published archive from the year cache; other sources continue using reconstructed options. Switching sources does not mutate the original archive. Timeline labels, coverage, source explanations and screen-reader announcements distinguish published snapshots from reconstructions. Both blends and historical comparisons still use opening-derived models, explicitly disclosed. No bundled forecast data or blend coefficients changed.

`tests/published-forecasts.html` passes 82/82 browser checks across all 14 archived men’s/women’s seasons: all snapshot dates and displayed seven-stage probabilities match the retained archive, including source switching, restoration and Results. Production preview confirms men 2023 ends April 1 (UConn 70%, San Diego State 30%) with April 3 marked unavailable, while women 2023 ends March 31 (Iowa 55%, LSU 45%). Torvik remains labeled reconstructed; returning to FiveThirtyEight restores its last archived snapshot. Existing archive/model checks pass 132/132; generated-source checks pass for all 37 opening fields and 60 source/blend options. Build and whitespace checks pass with the existing ECharts chunk-size warning.
