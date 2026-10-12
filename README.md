# Tournament Atlas

[Open the app](https://jordanmeyer.github.io/bab-example-madness/) · [Build story](https://jordanmeyer.github.io/bab-example-madness/build-story.html)

Explore the men’s and women’s NCAA tournaments from 2016 through 2026: trace a team's bracket, compare its chance of reaching each round, and follow reconstructed probabilities as games change the field. The 2020 cancellation is represented explicitly. This independent recreation draws its interaction pattern from [FiveThirtyEight's 2015 explorer](https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens).

The learning objective is to distinguish a strong contender from a certain champion and see how a knockout path compounds uncertainty.

Use the Men/Women toggle beside the year selector. Switching keeps the year and resets the selected team and forecast playback.

## Sources and daily updates

The Source selector includes only recovered **complete opening fields**:

| Source | Men | Women |
| --- | --- | --- |
| Ken Pomeroy | 2016–2019, 2021–2026 | — |
| Bart Torvik | 2018–2019, 2021–2026 | 2025–2026 |
| FiveThirtyEight | 2016–2019, 2021–2023 | 2016–2019, 2021–2023 |
| ESPN BPI | 2017 | — |
| numberFire / Brandon Gdula | 2025 | — |
| Silver Bulletin | — | 2024 |

Every source timeline is an **app reconstruction**, starting from that source's opening advancement probabilities. A bracket-specific matchup model reproduces those probabilities as closely as rounding permits. Completed games are then locked and remaining chances recalculated after each Eastern-time game day. These are not recovered official daily updates. Strength remains fixed; scores, injuries and later ratings do not refit it. Missing First Four probabilities require an explicit inference, described in the methods.

“All source average” appears with two or more sources. “All source ensemble” fits a regularized logistic model using earlier seasons in the same competition; every current source must have earlier observations. One source can support a calibrated ensemble, but never an average. The bottom comparison evaluates the historical procedure on seasons held out chronologically, and reports worse results as well as improvements. It does not claim that the ensemble always wins.

2020 has no field or forecasts. Actual results remain a separate view. The original FiveThirtyEight snapshots and earlier T-Rank rating reconstructions remain unchanged in downloadable JSON, separately from the new `forecastOptions` used by the interface. See [source model and reproduction](data-preparation/SOURCE-MODEL.md) and [data credits](app/public/DATA-NOTICES.txt).

## Run locally

From the project root, use the verified Node/npm pair in [SETUP.md](SETUP.md):

```sh
npm ci
npm run dev
```

The development URL uses `/bab-example-madness/`. Production output is built and previewed with:

```sh
npm run build
npm run preview -- --port 9742
```

Open `http://127.0.0.1:9742/bab-example-madness/`. The local [How this was built](app/build-story.html) page is available at `http://127.0.0.1:9742/bab-example-madness/build-story.html` after building.

For verification:

```sh
node tests/run.mjs
node tests/source-model.mjs
node tests/generated-sources.mjs
npm run test:browser -- --port 9741
```

Open `http://127.0.0.1:9741/tests/` for the visible browser test results. The tests use the application's actual model helpers and bundled data. Current checkpoint and observed browser coverage belong in [EVALUATION.md](EVALUATION.md); passing numerical tests is not a claim of complete accessibility or novice usability.

## Files and dependencies

The app has no runtime dependencies. Vite 8.3.4 produces static output. Dependencies are pinned in `package.json` and `package-lock.json`; lifecycle scripts are disabled. Native HTML/SVG handles the bracket and table. Campus Designer supplies locally bundled EB Garamond and Open Sans with license notices; no font substitution was needed.

`app/public/data/` contains the normalized yearly datasets. `data-inputs/opening-sources.json` retains 37 complete opening fields, published values, source links and explicit team joins. The three older rating sets are retained as original evidence. `data-preparation/` and `scripts/derive-forecasts.mjs` reproduce the transformation. Python is optional maintainer tooling for reacquiring original datasets; it is not needed to install dependencies, run the app, build it, or visit it.

The website uses only same-origin bundled assets and data: no runtime APIs, accounts, remote fonts, or telemetry. Keep source-specific rights and attribution in [DATA-NOTICES.txt](app/public/DATA-NOTICES.txt); FiveThirtyEight's data license does not cover ESPN, NCAA, or T-Rank material. Library and font notices are generated separately.

## Publication status

The application is published at the linked GitHub Pages address. [DEPLOYMENT.md](DEPLOYMENT.md) records exact commits, successful workflow runs and observed live behavior. Only `dist/` is uploaded; tests, source handoff reports and data-preparation tools remain in the source repository. Subsequent corrections use ordinary commits to the same authorized repository, followed by evaluation and exact-commit deployment checks.
