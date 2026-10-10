# Tournament Atlas

[Open the app](https://jordanmeyer.github.io/bab-example-madness/) · [Build story](https://jordanmeyer.github.io/bab-example-madness/build-story.html)

Explore the men's NCAA tournament from 2016 through 2026: trace a team's bracket, compare its chance of reaching each round, and follow archived forecasts as games change the field. The 2020 cancellation is represented explicitly. This independent recreation draws its interaction pattern from [FiveThirtyEight's 2015 explorer](https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens).

The learning objective is to distinguish a strong contender from a certain champion and see how a knockout path compounds uncertainty.

## What the years contain

- **2016–2019 and 2021–2023:** 83 original FiveThirtyEight daily snapshots, recovered from archived source CSVs. The latest available snapshots precede their championship games.
- **2020:** no field, games, or invented forecasts.
- **2024–2026:** one separately labeled reconstruction per year from frozen pre-tournament T-Rank ratings and Bart Torvik's documented neutral-court log5 formula. It averages across every possible opponent, including First Four teams. This is not a published FiveThirtyEight or T-Rank tournament forecast; there is no fabricated historical replay.

Actual game results are a separate view. Ratings in the reconstruction remain fixed and do not incorporate later results, injuries, venue effects, or rating uncertainty. See [the plan](PLAN.md), [data preparation and model explanation](data-preparation/README.md), and [data credits](app/public/DATA-NOTICES.txt).

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
npm run test:browser -- --port 9741
```

Open `http://127.0.0.1:9741/tests/` for the visible browser test results. The tests use the application's actual model helpers and bundled data. Current checkpoint and observed browser coverage belong in [EVALUATION.md](EVALUATION.md); passing numerical tests is not a claim of complete accessibility or novice usability.

## Files and dependencies

The approved direct library is Apache ECharts 6.1.0, used only for the forecast-history line chart. Vite 8.3.4 produces static output. Dependencies are pinned in `package.json` and `package-lock.json`; lifecycle scripts are disabled. Native HTML/SVG handles the bracket and table. Campus Designer supplies locally bundled EB Garamond and Open Sans with license notices; no font substitution was needed.

`app/public/data/` contains the normalized yearly datasets. `data-inputs/` retains the three frozen 68-team rating sets. `data-preparation/` and `scripts/derive-forecasts.mjs` reproduce the transformation. Python is optional maintainer tooling for reacquiring original datasets; it is not needed to install dependencies, run the app, build it, or visit it.

The website uses only same-origin bundled assets and data: no runtime APIs, accounts, remote fonts, or telemetry. Keep source-specific rights and attribution in [DATA-NOTICES.txt](app/public/DATA-NOTICES.txt); FiveThirtyEight's data license does not cover ESPN, NCAA, or T-Rank material. Library and font notices are generated separately.

## Publication status

The application is published at the linked GitHub Pages address. [DEPLOYMENT.md](DEPLOYMENT.md) records exact commits, successful workflow runs and observed live behavior. Only `dist/` is uploaded; tests, source handoff reports and data-preparation tools remain in the source repository. Subsequent corrections use ordinary commits to the same authorized repository, followed by evaluation and exact-commit deployment checks.
