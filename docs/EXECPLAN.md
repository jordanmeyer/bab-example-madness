# Move tournament evidence to an About page

This living plan follows `/Users/jordan/.codex/PLANS.md`.

## Purpose / Big Picture

The explorer should end with the bracket and footer, with supporting evidence on an About page. Visitors follow About to read all four former accordion sections and inspect source coverage for the same competition, year, and provider they selected in the explorer.

## Progress

- [x] (2026-10-11) Inspect current accordion markup and dynamic renderer.
- [x] (2026-10-11) Move content and data renderer; add contextual About links and build entry.
- [x] (2026-10-11) Verify built routes, cancelled and published-archive years, navigation, and responsive layout.

## Surprises & Discoveries

The accordion content is not all static. `renderSources()` in `app/main.js` writes coverage, archive links, corrections, download links, and ensemble tables using the currently loaded tournament. Simply moving HTML would break the explorer and lose evidence. Two existing browser regression pages queried these containers; they now follow the real About link in a second frame and retain their source-data checks.

## Decision Log

On 2026-10-11, move the renderer into `app/about.js`, its only remaining caller. Use ordinary URL query parameters (`competition`, `year`, `source`) to carry context; native selects allow changes on About. Keep the detailed build story accessible within the About page, while replacing footer links with About. Use visible sections and page navigation rather than top-level accordions. Nested archive and coefficient details remain available on About. No new dependencies are needed.

## Context and Orientation

Work in `/Users/jordan/Projects/bab-example-madness`. `app/index.html` contains the explorer and four supporting disclosures. `app/main.js` controls the explorer and currently renders evidence. Bundled JSON lives in `app/public/data`, with files listed by `index.json`. `app/style.css` contains shared local fonts, palette, and header/footer styling. `vite.config.js` lists the published HTML pages; add `app/about.html` there. Header/footer changes already in the working tree are part of this ongoing design task and must be preserved.

## Plan of Work

First add `app/about.html` using the shared masthead/footer, a navy introduction, readable sections, and a compact contents navigation. Move all four accordion bodies into sections, retaining existing disclosure wording. Move `renderSources()` into the new module, with a small loader and native select event listeners. Remove the former disclosure section and renderer from the explorer; replace its rendering calls with contextual link updates. Replace How this was built footer links on both existing pages with About. Add responsive page styling and the Vite HTML input.

## Milestones

The first milestone is functional separation: the explorer renders normally without evidence containers, and About displays the original notes, sources, comparison, and build explanation. `npm run build` must produce `dist/about.html` and its script. The second milestone is browser verification: selecting a published archive and a cancelled year must show accurate evidence, links and keyboard navigation must work, and desktop/mobile layouts must fit their viewports.

## Concrete Steps

Run from the repository root:

    npm run build
    git diff --check
    npm run dev -- --port 9742

The existing development server can be reused. Open `http://127.0.0.1:9742/bab-example-madness/`, then its About link. Check Men 2023 FiveThirtyEight for archived snapshots, Women 2024 for competition-specific evidence, and 2020 for cancellation. Build output should contain index.html, about.html, and build-story.html.

## Validation and Acceptance

All four original content sections must be present on About. The explorer must have no supporting accordions and remain interactive. About must render current source links and download path, and show the ensemble comparison when available. A cancelled year must not throw or leave stale forecast evidence. Keyboard links, select controls, in-page navigation, and the return route must work. Inspect at desktop and narrow widths; long comparison tables may scroll inside their own container, never widen the page. Check local links in generated output. Do not add tests that merely assert the moved markup.

## Idempotence and Recovery

The data and models are untouched. Rebuild safely after edits. Preserve unrelated changes; revert only task-specific edits if needed. Do not publish until requested.

## Artifacts and Notes

Browser screenshots will be saved in `/tmp` for review. Build warnings about the existing ECharts bundle size are unrelated to this content move.

## Interfaces and Dependencies

`app/about.js` owns the evidence renderer and data loading. It reads query parameters, validates them against the bundled catalog, and updates native selects. `app/main.js` sets `.about-link` URLs after year/source changes. Both use standard browser APIs; no framework or server is added.

## Outcomes & Retrospective

Completed locally. All four former disclosures are readable About sections; contextual links, source changes, download links, archived snapshots, and cancelled years work. The built About script is 8.58 kB and does not import the explorer chart bundle. Desktop, 390px, and 320px layouts were checked; page width equals viewport width, including the contained comparison table. Keyboard section navigation and local output links passed. Published-forecast regression: 82/82 passed. Women’s regression: 101/101 passed. Build and diff checks passed. Publication remains outside this request.

Plan created 2026-10-11 after discovering the dynamic evidence dependency.

Revision 2026-10-11: completed implementation and browser verification. The women's regression initially had 14 failures from pre-existing assumptions: a fixed 502px center and results-only coverage after 2023. Updated it to measure the responsive midpoint and use the selected source's forecast series; the full rerun passed. Existing source download checks now follow About, preserving their original data-boundary coverage. No app model behavior changed.
