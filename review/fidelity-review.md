# Tournament Atlas fidelity review

Reviewed October 9, 2026. Baseline application: main `ad38899` at https://jordanmeyer.github.io/bab-example-madness/. Reference: https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens.

Method: independent source inspection and actual browser interaction with both live pages. Actual browser viewport measured 1280 × 720 CSS pixels. The archived original rendered successfully, including Kentucky's route and 41% title chance. The attempted 375 × 900 override did not take effect in this reviewer's browser context; it still measured 1280 × 720 and was reset. Phone-width conclusions therefore require the coordinator's separate check.

## Findings requiring correction

1. **P1 — Exploring another team leaves the center attached to the wrong team.** With 2023 initial forecasts and Houston selected, keyboard-focus Alabama's Round-of-64 button without clicking. The highlighted regional route becomes Alabama, but the center still says Houston, 22.085%, and Houston's semifinal chance. Pointer exploration invokes the same route-only handler. The original updates the whole path and central title identity/probability together. Use one transient bracket preview across all stages and the center, restore the committed selection on pointer leave or focus exit, and clearly distinguish any click-pinned detail panel. Central unresolved slots need the same preview behavior. Baseline code: `app/main.js`, `decorateRoute` and the pointer/focus listeners. Evidence: `inconsistent-preview.png`.

2. **P1 — Selected finalist text disappears on hover.** Click the center's “Semifinal 2 winner Houston 31% chance” card. Computed foreground is white (`rgb(255,255,255)`), but the generic hover rule changes its background to cream (`rgb(252,247,229)`). All three lines become nearly invisible. Preserve the navy/white selected state or change both colors to another checked pairing. Baseline code: `app/style.css`, generic `button:hover:not(:disabled)` and `.finalist-button.selected`. Evidence: `selected-hover-contrast.png`.

3. **P2 — The bracket stops before the defining final-round connections.** Each regional tree terminates at its two Elite Eight participants. The four region-winner cards, two semifinal-winner cards and championship are separate stacked blocks with no connections from the regional trees or between those blocks. Consequently a highlighted route cannot be followed through Final Four and the final. The original has a continuous bilateral tournament tree all the way into the central title. Connect the remaining rounds according to actual semifinal pairings, keep probabilities attached to the relevant stages, and preserve usable keyboard targets. Probability-weighted path widths and emphasis on the explored stage would restore the original's analytical visual encoding. Evidence: the full recreation in `inconsistent-preview.png` versus `original-route.png`.

4. **P2 — Introductory material buries the primary visualization.** At 1280 × 720, the recreation's first team row is approximately y699, so the initial viewport contains almost no bracket. The original's first row is approximately y419 despite the Internet Archive toolbar. The recreation's large hero and generous control spacing delay the task the user requested. Compact the masthead/intro and replay area so the first screen shows a meaningful portion of the bracket, while retaining the clear year and model labels.

5. **P2 — Replay does not expose the available dates.** The recreation displays only the first and last date under an otherwise unlabeled range. Users cannot see or directly choose a particular recorded day, nor see the gaps between tournament rounds; they must scrub and read changing text. The original exposes individually labeled available dates and temporal gaps. Add a direct recorded-date selector or labeled date track; keep absent dates unavailable and distinguish actual elapsed dates from discrete snapshot steps. Do not synthesize additional 2024–2026 frames.

6. **P2 — History chart compresses unequal date gaps into equal spacing.** `renderChart` uses an ECharts category axis. A multi-day break therefore occupies the same horizontal distance as a one-day change, changing the apparent rate of movement in a chart presented as dated forecast history. Use actual snapshot timestamps on a time axis, retaining the selected-date cutoff and honest one-snapshot view. This is a recreation-specific addition, rather than behavior copied from the original.

## Checks that passed in this review

- Original reference loaded and its route/title behavior was observed directly, rather than inferred only from archived source.
- Recreation's table supports keyboard Enter on a stage heading and retains focus. Sorting Sweet 16 descending produced Alabama, Houston, UCLA in the correct order for the 2023 initial snapshot.
- Keyboard End on the forecast range selected April 1, 2023, the actual final available snapshot rather than inventing a championship frame.
- No console errors or warnings were observed during these desktop interactions.
- Men's scope, 2020 cancellation and separate model attribution for 2024–2026 are intentional; this review does not treat them as defects.

## Follow-up verification

Recheck transient and pinned identities through R64, future regional slots, regional champions and national finalists; verify reset on leave/blur, click selection, and switching year/date/mode. Check actual selected/hover/focus contrast. Inspect continuous route connections and legitimate region-to-semifinal pairing at desktop and phone widths. On phones, specifically inspect whether the sticky name column leaves enough space for probability columns; its baseline desktop width measured about 230 CSS pixels. Do not treat a lack of body overflow alone as successful mobile table usability.

Status: **changes required**. No pass is implied by the earlier numerical suite; these findings concern rendered behavior and fidelity.

## Correction round 1

Reviewed the corrected source and coordinator-captured images in the course evidence `fidelity-review/` folder. The reviewer's browser context was no longer available in this round; these are independent source/image assessments plus explicitly attributed coordinator interaction observations.

- The coordinator observed Alabama focus updating the center to 16.176%, South Final Four to 45%, and South/East finalist to 30%, while the detail stayed labeled as pinned Houston. Moving focus outside restored Houston. Source now uses the same decorator for regional and central routes.
- Selected finalist hover is explicitly navy/white in source. The coordinator measured white-on-navy at 14.76:1.
- Header/control compaction, selectable actual dates, and the 138px phone name column are visibly improved in `first-correction-desktop.png` and `phone-table.png`.
- The history source now uses a UTC time axis. A possible timezone mismatch raised during review had already been addressed with `useUTC:true` by the developer.
- **Still failing:** bottom-region connectors pass behind the championship card, breaking the visible route again. This was predicted in source inspection and confirmed in the desktop image. The developer is correcting geometry.
- **Still failing:** the initial single-point history has repeated date labels because sub-day tick positions are formatted as dates only. The developer is correcting tick intervals.
- Evidence caution: `alabama-preview.png` shows Houston after focus returned to the skip link; it is not visual proof of the transient Alabama state. The coordinator's separate DOM observation supports that check. Rename or replace the screenshot before treating it as evidence.

Status remains **changes required** pending the two rendered corrections and final capture review.

## Correction round 2

Independent image review of `after-desktop.png`, `preview-viewport.png`, and `history-calendar.png` confirms the six original issues are corrected in the displayed examples. Alabama's 16.176% center now matches its highlighted full route. Houston's lower route visibly goes around the title card. The first team row is now at y486 rather than y699 at 1280px width (coordinator DOM measurement). Recorded-date gaps and elapsed-day chart spacing are clear; the one-point chart has one date label.

One additional defect was found through source review and then reproduced by the coordinator: center cards can grow when a longer team name wraps, but connector geometry was measured before that content update and only the outer grid was observed for resizing. Selecting North Carolina-Asheville at 1280px produced 74.56px cards and moved the title to y577.82 relative to the grid, while the incoming title paths ended at y563.26: a visible 14.56px gap. The developer is correcting geometry updates for changed center-card sizes. This is a required fix to the existing connection requirement, not new application scope.

Status remains **changes required** for the reproduced long-name connection gap.

## Final correction verdict — PASS within reviewed scope

The final source change observes the regional-winner and national-final boxes as well as the outer bracket, so content-dependent card dimensions trigger connector redraw. The coordinator verified production asset `main-DHFdrHeu.js` with North Carolina-Asheville: both displayed cards measured 74.5625px high; the championship top and both incoming stage-6 endpoints were exactly y577.8203125 relative to the grid, and x599.046875 matched the championship center. No console warnings or errors were observed in that check.

**PASS:** the six original findings and the reproduced long-name follow-up are corrected. Evidence combines this reviewer's original live/reference browser walkthrough, independent corrected-source and screenshot inspection, and explicitly attributed coordinator browser interaction measurements. The final screenshots show consistent Alabama preview, connected Houston paths, compact controls, available dates, and elapsed-day history; the phone screenshot and coordinator measurements establish the tested 375px table behavior. Earlier failed rounds remain above.

This is a bounded review of these defects and representative interactions. It is not a claim of pixel-identical reproduction, exhaustive accessibility certification, actual screen-reader testing, physical-phone testing, novice usability, or predictive calibration of the probability models. Numerical validation and deployment checks are recorded separately by the coordinator.
