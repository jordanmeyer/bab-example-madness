# Independent rounded-corner review

Reviewed source checkpoint `a58ed7b3aa92a22e090a3be3815377d08b65b00c` and its production preview at `http://localhost:9742/bab-example-madness/` on 2026-10-09, with the 1004-pixel bracket at a 1280-pixel browser viewport.

**Pass for this bounded correction.** The defect was the join between separate SVG stage paths: `stroke-linejoin: round` covered each path's internal elbow, while its butt-capped endpoint left a square notch where the next stage began. Adding `stroke-linecap: round` to highlighted routes removes those notches without changing probability widths, route positions, data, or animation logic.

Observed candidate cases:

- Alabama, initial 2023 forecast: thick upper-left route now has rounded inter-stage corners as well as rounded internal elbows.
- Maryland: the large 50.8% to 9.2% probability decrease produces a small rounded width shoulder, with no square notch or gap. This does not warrant more complicated route geometry.
- Kansas: mirrored upper-right route has rounded joins; an unpinned keyboard focus preview displayed it while the pin chip stayed hidden. Its appearance matches the pinned route.
- Fairleigh Dickinson: lower-left route with widths from 1.64968px down to 0.500789px stays continuous and fine, without exaggerated caps or displaced labels.
- Source inspection confirms the same style applies to the stage-6 title stem and to retiring animation paths. The coordinating agent separately inspected Houston's lower-right route and title attachment.

The screenshots used for review were settled viewport captures. An initial full-page crop captured the route near the beginning of its draw animation, so it was not treated as evidence of a missing settled path. This is a focused rendering check, not a repeat of the all-year model or accessibility review. No independent pointer-hover motion or frame-by-frame animation audit was claimed; keyboard preview and pinned selection use the same observed route elements and CSS.
