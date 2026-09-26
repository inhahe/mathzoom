# mathzoom — roadmap

Four zooms, each a whole tier stronger than the last, and a hub page that links
them in order of power. All four share one engine: the TeX glyph pipeline,
extensible delimiters, the self-similar alternating layout (columns / rows),
the λ camera with wrapping, level-of-detail bitmaps, the accelerating zoom and
the click-to-finish ending.

"Rung" is the position on the step/fold ladder (the fast-growing hierarchy):
0, 1, 2, … are steps; ω is the first fold; ω² folds the folds; ε₀ is the limit
of ω, ω^ω, ω^ω^ω, …. N is the number of levels in the finished number.

| # | Page | Notation | Finished number | Readable without a key by |
|---|---|---|---|---|
| 1 | `towers.html` | power towers of 10s, braces | rung ≈ N: past Graham's g₁, below g₂ | anyone who knows exponents |
| 2 | `arrows.html` | Knuth arrows, braces — Graham's diagram, nested | ω + N: beats Graham's number | anyone who has seen Graham's number |
| 3 | `chains.html` | Conway chains 10→10→⋯→10, braces | ω² + N: beats any Conway chain one could write out | people who follow big numbers |
| 4 | `brackets.html` | nested brackets (Cantor normal form, as in the Kirby–Paris hydra), with a key | a tower of ω's N high, climbing toward ε₀ | logicians; everyone else via the key |
| — | `index.html` | hub: the four in order of power | | |

## 1. Towers — done

The original page (formerly `index.html`). Base: a power tower of 10s whose
underbrace gives its height. Columns stack towers with underbraces (each
tower's height is the value of the one below); rows chain columns with right
braces (each column's length is the value to its right); seeds are 10. Each
level adds one Knuth arrow: a finished number of N levels is ≥ 10 ↑^(N+2) 4.

## 2. Arrows (Graham ladders, nested) — planned

- **Base:** `10 ↑↑⋯↑ 10` with an underbrace under the arrows only, giving how
  many there are — as in Graham's own diagram.
- **Level 1 (column):** each line's arrow count is the value of the line below;
  the bottom one's is 10. Graham's ladder, with 10s.
- **Level 2 (row):** ladders chained by `}`: each ladder's number of rungs is the
  value to its right. That row is a stack g_{g_{g…}}, its height set by the
  bracket around it. Level 3 stacks those, and so on, alternating as now.
- **Size:** every finished number beats Graham's number, even from a click in the
  first second; N levels sit at rung ω + N (Conway chain ≈ 10→10→10→N).
- **New:** the base glyph and its arrow-run span (the level-1 underbrace, the `⋮`
  and the seed are centred on the arrows).

## 3. Chains — planned

- **Base:** the Conway chain `10→10→⋯→10` with an underbrace giving how many 10s
  it has (like a tower's height).
- **Levels:** exactly as for towers and arrows: in a column each chain's length is
  the value of the chain below; in a row each column's length is the value to
  its right.
- **Size:** a chain's value as a function of its length is already a fold of
  folds (rung ω²); each level adds a step, so N levels sit at ω² + N — past every
  Conway chain anyone could write out.

## 4. Brackets — planned

- **Meaning:** a bracket with nothing inside, `[ ]`, is one step; brackets side by
  side add; a bracket around brackets folds as many times as what is inside it
  says (`[[ ]]` = ω, `[[ ][ ]]` = ω², `[[[ ]]]` = ω^ω). A picture followed by 10
  is the number at that rung, applied to 10, on the Knuth-arrow ladder
  (rung k = k arrows).
- **Picture:** each level is a bracket around three copies of the level below —
  a row inside `[` `]`, or a column between a top bracket `⎴` and a bottom
  bracket `⎵` (the same bracket, turned). No ellipses: every copy is drawn, so the
  finished picture is exact. The finished number is the outermost bracket
  followed by `10`.
- **Key (shown at the start, standard notation instead of English):**
  `[ ] 10 = 10↑10`, `[ ][ ] 10 = 10↑↑10`, `[[ ]] 10 = 10↑↑⋯↑10` (ten arrows).
- **Size:** each level wraps everything below in a new fold: N levels sit at a
  tower of ω's N high, climbing toward ε₀ — the limit of what Peano arithmetic
  can prove terminates.
- **New:** square brackets drawn from TeX's own proportions (stem and serifs,
  any length, four orientations), the bracket grammar, the key.

## Hub — planned

`index.html`: the four pages in order, each with a picture of a finished
number, its rung, and what it beats, so the step up in power reads left to
right.

## Later

- **Past ε₀:** a new kind of bracket that folds the nesting itself (Veblen-style),
  the road toward TREE(3)'s neighbourhood.
