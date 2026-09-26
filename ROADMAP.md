# mathzoom — roadmap

## Planned

### Option 1 — "Graham ladders, nested" (a second number)

The same kind of zoom as the current page, with Knuth's arrows at the bottom
instead of power towers — Graham's diagram, nested.

- **Base:** `10 ↑↑⋯↑ 10`, with an underbrace under the arrows giving how many
  there are (as in Graham's own diagram).
- **Level 1 (column):** each line's arrow count is the value of the line below;
  the bottom line's is 10. That is Graham's ladder, with 10s.
- **Level 2 (row):** ladders chained by `}`; each ladder's number of rungs is the
  value of the ladder to its right, the last one's is 10. That row is a stack
  g_{g_{g…}} whose height is set by the bracket around the row.
- **Level 3 (column):** rows stacked with underbraces, each row's length set by
  the row below — stacks of stacks. Further levels alternate as now.
- **Size:** every finished number beats Graham's number, even from a click in the
  first second. With N levels it is about the Conway chain 10→10→10→N — position
  ω + N on the fast-growing hierarchy, where the current number is at about N
  and Graham's number at ω + 1.
- **Reuse:** the TeX glyph pipeline, extensible braces, the periodic layout with
  equal growth (`H_SCALE`), the λ camera and wrapping, level-of-detail bitmaps,
  the click-to-finish ending and the outermost-row rule.
- **New work:**
  - The base glyph: arrows with their own underbrace, typeset in TeX. In a level-1
    column the next line hangs under the arrow run's brace, not a full-width one.
  - Factor the engine out of `index.html` into a shared script, so the towers page
    and a ladders page (e.g. `arrows.html`) share it.
  - `design.md`: the notation, how to read it, and its sizes.

## Under discussion

- **Option 2 — a fold per period.** One new kind of arrow per zoom period (↑ folds
  +, ×, ^; a heavier ⇑ folds Graham ladders; ⤊ folds those; …): position ω·N,
  Conway-chain territory. Probably superseded by the next item.
- **A new level of abstraction at every step (the user's idea).** Name positions on
  the step/fold ladder with ordinals and draw the ordinals as nested brackets
  (Cantor normal form, as in the Kirby–Paris hydra): `[ ]` is a step, brackets side
  by side add, a bracket around a row folds it (`[[ ]]` = ω, `[[ ][ ]]` = ω²,
  `[[[ ]]]` = ω^ω). Each zoom level wraps everything below in a new bracket, so the
  infinite zoom climbs toward ε₀ and a finished zoom of N levels sits at a tower of
  ω's N high. Going past ε₀ needs new bracket kinds (Veblen-style folds of the
  nesting itself).
