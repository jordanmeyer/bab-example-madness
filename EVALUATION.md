# Evaluation

## Tested source

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
