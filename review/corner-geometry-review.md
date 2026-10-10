# Rounded-corner correction review

Reviewed source checkpoint: `58d7cdd5b1baffacf2312fc261b2f680c0fca20b`.

The previous round-cap acceptance was wrong. Unequal adjacent stroke widths left visible lips beyond the narrower vertical band, as the user's screenshot demonstrates. This review supersedes that acceptance.

## Findings

No remaining blocker found in the bounded correction. Each stage now has butt caps and retains rounded internal joins. A seam ellipse has horizontal radius equal to half the outgoing vertical width and vertical radius equal to half the incoming horizontal width. Three quarters already lie inside those strokes; the remaining quarter supplies a tangent outside corner without an overhang. This geometry has no orientation branches and applies to mirrored, upward, downward, and championship connections.

The implementation delays each ellipse until the incoming dash reaches it. Its two radii follow the adjacent stroke animations separately. Interrupted routes retain their computed widths and dash positions; hidden corners are removed, and visible corners shrink with their matching strokes. Reduced-motion rendering uses the final geometry immediately.

I independently read the implementation and regression harness and inspected the supplied Alabama production screenshot plus its actual SVG geometry enlarged four times. The three enlarged inter-stage corners meet their vertical bands smoothly, with none of the lips shown in the user's screenshot. Internal elbows remain rounded.

The coordinator reports 16/16 rendered regression checks passing: 30 seams across six teams, including mirrored and thin paths and the championship stem; six animation checkpoints; interrupted drawing; visible-corner retirement; and clearing. The negative control restores the rejected round caps and detects their overhang. I reviewed this harness but did not independently execute it: this reviewer's browser inventory exposed no browser surface. The other orientations and thin/title connections are covered by the coordinator's raster evidence, not by a claim that I separately inspected screenshots of every case.

This is a source and bounded visual review of route geometry. It does not repeat the tournament-data audit or establish universal browser compatibility.
