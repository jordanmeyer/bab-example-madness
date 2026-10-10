# Evaluation

## Original geometry correction — October 9, 2026

Current tested source: `40c6a1e0b2036c7b7e02fc60a279f4954f1abdac`. The user rejected the prior card layout despite its earlier bounded review. The new [independent original-geometry review](review/original-geometry-review.md) measures the actual reference, retains two failed correction rounds, and passes the final desktop candidate.

One continuous bilateral tree replaces separate region/card layouts. Final Four branches sit at regional centers and converge into championship entrants at the vertical midpoint. Names appear initially only at outer terminals, then on compact settled-entrant strips as replay advances. Hover/focus probabilities sit outside the horizontal bands. Width is `0.5 + 15 * sqrt(p)`, matching the original's observed scale; inactive underlays are removed from active shared segments so tiny probabilities remain thin. Exact probabilities and full names remain available through labels, titles, table and detail. Undecided slot targets remain the most likely entrants regardless of the previewed team.

The clean checkpoint passed **74/74 Node and browser checks**, and the production build generated `main-CGWQTFsc.js` / `style-DnBVnImn.css`. The existing bundle warning remains (530.38 KB minified,181.32 KB gzip). No data, model functions, dependencies or workflow changed. Relevant source was clean before and after the checks.

Independent browser comparison at 1280px verified original geometry, upper-left Alabama/lower-right Houston routes, tiny Texas Southern probabilities, blank initial internal slots, compact April 1 settled labels, and keyboard preview/restore. The reviewer caught and rechecked an incorrect preview-dependent most-likely target and clipped names. Coordinator separately verified Results: selecting eliminated Texas Southern retains Fairleigh Dickinson's Round-of-64 berth and produces no active future route. At 375 × 900, default table/body widths were343/375, the complete bracket scrolled within its343px container, ArrowRight moved40px, and selecting Houston revealed its terminal atx225–350. Narrow Bracket now shows one horizontally scrollable full tree; Table remains the compact default. No application console errors/warnings were observed.

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
