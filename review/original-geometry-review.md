# Original bracket geometry review — 2026-10-09

Reference: https://web.archive.org/web/20240411121651/https://projects.fivethirtyeight.com/madness-2015/index.html#mens
Recreation reviewed: https://jordanmeyer.github.io/bab-example-madness/ and app source at 09a22ac.

Evidence: independently opened the original in a new background browser tab, inspected initial Kentucky selection and the April 4 final forecast, and measured rendered SVG attributes/computed styles. Also inspected the previous original-route.png and current app source. This review corrects the prior review's inadequate visual acceptance criteria.

## Required corrections

1. **Replace the center cards with the same continuous, bilateral tree geometry as the original.** The original's horizontal columns are Round of 64, Round of 32, Sweet 16, Elite Eight, Final Four, Championship, then the mirrored sequence. The two regional finals on each side occur at the upper and lower region centers. Their winners converge vertically onto that side's championship branch at the whole bracket's vertical midpoint. The two championship branches meet at the center; a short central stem rises to the title probability display. This is a topology, not merely a group of connected boxes. Four Final Four cards sharing the center column with a stacked National Final block conceal this hierarchy.

2. **Use line width as the visible hover encoding.** Original default links measured 1.5 CSS px. Selecting Kentucky at the initial forecast yielded six strong blue links with widths 15.4702, 15.0266, 14.3579, 13.2639, 11.4167 and 10.0698 px, alongside probabilities >99%, 94%, 85%, 72%, 53% and 41%. The route conspicuously narrows as cumulative probability falls; changing only a 1px stroke's color is not equivalent. Use one documented probability-to-width scale, preserve clear low-probability visibility, and keep default links behind the active route. Do not draw the selected stroke through the probability text.

3. **Keep initial names at the outside terminals.** Initial forecasts have 64 name terminals (including paired First Four placeholders). Undecided internal branches are blank lines. They do not say “Open slot,” and hovering a team does not reproduce its name at every internal stage. Selection should highlight the terminal and reveal its route probabilities. An internal slot can still be a generous transparent hit target whose hover selects its most likely entrant.

4. **Preserve settled-team names on the branch itself as the replay advances.** On April 4, Duke appears on the right championship branch at local x=80.33,y=512, while MSU appears on the right Final Four branch at x=160.67,y=296. These are compact 20px-high strips centered on the horizontal branch y, not vertically stacked cards. The initial-forecast rule must not suppress known winners in late snapshots/results.

5. **Put cumulative probabilities next to the relevant horizontal segments.** On initial Kentucky selection, >99%,94%,85%,72% sit above the four upper-left horizontal segments; 53% sits below the left championship branch at the bracket midpoint; 41% is large in the central title display above the junction. The observed ordinary label offsets were dx=30,dy=-10 above upper segments and dy=23 below lower segments, with side-appropriate text anchoring. These are probabilities of reaching the next stage represented by that segment, not small right-aligned values squeezed inside team-name controls. Avoid 'Reached' cards and repeated stage labels in the route.

6. **Align all round headings to a single shared horizontal geometry.** Labels should accurately name the stage under their branch; Final Four and Championship need distinct x positions. The current region-local labels and separate central eyebrow labels invite precisely the user's confusion. Keep each pair of first-round participants visually adjacent with a little more space between matches than within a match, as in the original.

## Original coordinate measurements

At the default 1280×720 viewport the main SVG has a central group translated to x=502. The left branch x coordinates relative to this center are approximately -482 (outside names), -401.67, -321.33, -241, -160.67, -80.33, 0. The right half mirrors these coordinates. Upper and lower regional winner junctions are at y=296 and y=808, and the national championship junction is y=512. A title stem ends at y=462. These measured ratios can be scaled; the exact old site dimensions and logos are not requirements.

At the initial forecast, eight pairs per region use an 18px within-pair spacing and a 54px pair pitch, making the first-round matchups readable before following the tree.

## Acceptance review for the correction

- Inspect a complete desktop bracket at the initial forecast, one selected top-left team, one bottom/right team, a very low-probability team, a late replay snapshot, and Results.
- The complete trace must communicate regional final → national semifinal → national final without any central cards or lateral stage ambiguity.
- At initial state names remain at outside terminals, while probability labels are outside line bands. Later resolved names occupy compact strips on their true horizontal branch.
- Pointer and keyboard preview must reveal the same visible route; exiting preview restores the actual selected team. Test internal empty-slot hit targets as well as terminals.
- Verify that width meaning is consistent with labels and the seven-stage model, including First Four. Results should not create nonzero projected routes for eliminated teams.
- Check actual screenshots for thick-path joins, text/line collisions and clips. Passing data tests does not establish visual fidelity.
- Retain responsive/table alternatives and accessible controls; reproducing the original's visual hierarchy does not require reproducing its keyboard limitations or branded team logos.

Status: original comparison complete; correction not yet reviewed.

### Additional low-probability measurement

Selecting Lafayette at the initial forecast produced route widths 2.34093, 1.27096, 0.85171, 0.608825, 0.532982 and 0.50656 CSS px alongside 2%, <1%, <1%, <1%, <1%, <1%. Together with the Kentucky measurements these strongly fit `0.5 + 15 * sqrt(p)`; this formula is an inference from computed rendered values, not a claim to have read the publisher's calculation source. The original therefore approaches a 0.5px floor rather than forcing every active segment to remain thicker than the default 1.5px tree. Labels preserve the meaning of small probabilities. Original route color follows team colors; a consistent Duke navy route is appropriate here without copying team branding.

## Correction review — local production candidate

**Bounded verdict: PASS for the requested desktop bracket geometry, branch names, probability placement and route-width corrections.** Final inspected production asset: `main-CGWQTFsc.js`, served at `http://localhost:9742/bab-example-madness/`. Review used an independent browser tab at 1280×720 and full-page rendered captures. This is a comparison of the exercised states, not a claim of pixel identity, universal accessibility or every year's display-name combination.

Failed intermediate rounds were retained in the review exchange:

- The first rewrite still changed an unresolved internal slot's target to whichever entrant was currently being previewed, incorrectly calling a lower-probability entrant “Most likely.” The developer removed that preview-dependent target. Recheck: pinning Maryland and focusing the South Sweet 16 slot previewed Alabama at 81.951%, while the pinned detail remained Maryland; leaving bracket focus restored Maryland's preview.
- Initial combined First Four labels and late-finalist labels were clipped in the narrow name strips. The developer added compact display labels and removed repeated seeds from internal strips, retaining full names in titles/ARIA and detail/table views. A remaining Midwest pair was then shortened further. Final initial labels were `SEMO / TAMUCC`, `FDU / TXSO`, `Nevada / ASU`, and `Pitt / MSST`; none clipped. All 2023 late-snapshot team labels also fit.

Observed final behavior:

- Initial bracket has a continuous bilateral tree with eleven shared column headings, separate Final Four columns and a central championship junction; the unrelated central cards are gone. The upper/lower regional winners sit above/below that junction, matching the original topology.
- Initial names remain at outer terminals; unresolved internal branches are visually blank. Actual known entrants appear as compact strips on their horizontal branches after replay.
- Houston's initial route showed measured widths 15.2813, 13.4165, 12.0046, 10.0643, 8.83306 and 7.5492 px. Alabama's upper-left route showed 15.3948, 14.079, 12.6324, 10.5947, 8.78291 and 6.53293 px, with labels 99%,82%,65%,45%,30% on its horizontal segments and the title probability in the center. The paths visibly taper and remain connected.
- Texas Southern's long-shot route showed 1.94274, 0.846454, 0.579688, 0.521186, 0.506553 and 0.502076 px. Corresponding background route paths were hidden; their shared horizontal segments did not leave a thicker gray line underneath the tiny foreground probability.
- On April 1 the four regional winners occupied two x columns at y approximately698/1210, while championship entrants SDSU/UConn occupied the midpoint row at y954 (browser CSS coordinates). Names were distinct and legible, with no team-name clipping in the inspected snapshot.
- Connecticut's April 1 route showed completed stages at 100% and a 70% title forecast in the center. Eliminated Maryland/Alabama showed `0%`, not an ambiguous central dash.
- Keyboard focus on a blank internal slot previewed its correct most-likely team without changing the pinned selection; leaving focus restored the pinned team.

The coordinator separately owns Results, lost First Four entrant, responsive/narrow and final publication checks. This independent review did not repeat those checks or mark them passed on the coordinator's behalf.

Final rendered evidence: `/private/tmp/madness-geometry-reviewed-initial.png` and `/private/tmp/madness-geometry-reviewed-late.png`. Earlier local captures retained: `/private/tmp/madness-revised-alabama.png`, `/private/tmp/madness-revised-late.png`. Original measurements and limitations are recorded above.
