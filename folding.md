# Folding all the way up

A number described in English with one idea — the **fold** — applied to itself
as many times as fits on two pages.

## The two moves

Start from the simplest operation there is: **adding one**, F₀(n) = n + 1.
Every other rung is built from it with two moves:

- **Step.** The next rung repeats the one before it *n* times:
  F<sub>r+1</sub>(n) = F<sub>r</sub>(F<sub>r</sub>(⋯F<sub>r</sub>(n)⋯)), *n* applications.
- **Fold.** Given an endless climbing list of rungs r₁ < r₂ < r₃ < …, their fold
  means *go n rungs up the list and apply that rung to n*:
  F<sub>r</sub>(n) = F<sub>rₙ</sub>(n).

Every rung below has a name (an ordinal — the standard one is in brackets) and,
if it is a fold, the list it folds. So every rung applied to a number is one
definite, finite number.

## The ladder

1. **Steps** — rungs 0, 1, 2, 3, …: adding one repeated is doubling (F₁), doubling
   repeated is exponential (F₂), then towers (F₃), then Knuth's ↑↑↑ (F₄), and so on.
2. **The first fold** — ω folds 0, 1, 2, …: F<sub>ω</sub>(n) = F<sub>n</sub>(n), as many
   arrows as the number itself.
3. **Steps after a fold** — ω+1, ω+2, … (Graham's number is here, at ω+1);
   **the second fold** ω·2 folds ω+1, ω+2, …; then ω·3, ω·4, …
4. **Folds of folds** — ω² folds ω, ω·2, ω·3, …; then ω³, ω⁴, …; ω<sup>ω</sup> folds
   ω, ω², ω³, …
5. **A tower of folds whose height is a variable** (your `w(x)`) — ε₀ folds
   ω, ω<sup>ω</sup>, ω<sup>ω<sup>ω</sup></sup>, …
6. **The tower trick, restarted on top of itself** — ε₁ folds ε₀+1,
   ω<sup>ε₀+1</sup>, ω<sup>ω<sup>ε₀+1</sup></sup>, …; then ε₂, ε₃, …; then the index
   itself a variable: ε<sub>ω</sub>, ε<sub>ε₀</sub>, ε<sub>ε<sub>ε₀</sub></sub>, …, folded
   where the index catches up with the result: ζ₀.
7. **Letters for tricks** (your `a`–`z`) — call the trick that makes ε's **a**. Trick
   **b** feeds a's output back into a until it catches up with itself (it makes
   ζ₀, ζ₁, …). Trick **c** does the same to b, and so on to **z**. [Veblen's
   φ₁, φ₂, …, φ₂₆; plain ω<sup>x</sup> is φ₀.]
8. **The letter as a variable** — the ω-th trick, the ε₀-th trick, …, folded where
   the letter's number catches up with the result: Γ₀, folding 1, ε₀, the ε₀-th
   trick at 0, the (that)-th trick at 0, … [Feferman–Schütte's Γ₀.]
9. **More slots** (your `1a`, `2a`, `a1a`, …) — write a trick's name as a list of
   slots, (letter, input), rather than one letter. A new slot in front folds every
   name with fewer slots. This is what your prefixed digit did; written as a list,
   it can't be misread as multiplication. (1, 0, 0) is Γ₀; then (1, 0, 1),
   (1, 1, 0), (2, 0, 0), …; with the front slot a variable and folded: (1, 0, 0, 0)
   [the Ackermann ordinal]; then five slots, six, …
10. **The number of slots as a variable** (your `..`, `...`, `....`) — folds
    (1, 0, 0), (1, 0, 0, 0), (1, 0, 0, 0, 0), …: the **small Veblen ordinal**.
    TREE(3) lives about here.
11. **Slots numbered by rungs** (your `.(x).`) — allow an ω-th slot, an ε₀-th slot,
    a slot numbered by any rung already named, and fold where the slot's number
    catches up with the result (your `.(.(.(x).).).`, nested as deep as a variable
    says): the **large Veblen ordinal**.
12. **Name the unreachable** — every trick so far builds up from below, and each
    has a first rung it cannot reach; that rung is what the next trick folds. So
    name it directly: take a placeholder Ω for "a rung nothing below can reach",
    let every trick above work on Ω like any other rung (Ω+1, ε<sub>Ω+1</sub>, …),
    then collapse each result down to the first rung that could not have been
    built without Ω. One placeholder reaches the **Bachmann–Howard ordinal**
    ψ(ε<sub>Ω+1</sub>). A tower of placeholders — Ω₁ < Ω₂ < Ω₃ < …, and Ω<sub>ω</sub>
    above them all, each collapsing into the one below — reaches
    ψ₀(ε<sub>Ω<sub>ω</sub>+1</sub>), the **Takeuti–Feferman–Buchholz ordinal**.

## The number

> **Rung ψ₀(ε<sub>Ω<sub>ω</sub>+1</sub>) applied to 10** —
> F<sub>ψ₀(ε<sub>Ω<sub>ω</sub>+1</sub>)</sub>(10), with F₀(n) = n + 1, using Buchholz's
> ψ-functions (1986) and their standard fold lists.

Everything is built from adding one: no big number is borrowed, and the depth
comes from the rungs alone. (Starting from something huge, like TREE, would not
go any deeper — its head start is swallowed long before the top, like adding a
million to a googolplex.)

The same strength as a game: Buchholz's hydra, a tree whose node labels
0, 1, 2, …, ω are the placeholders of step 12, cut down by rules that do all this
folding automatically.

**How big.** Far past TREE(3), which sits near step 10, and past everything built
by nesting Veblen's slots. Still believed smaller than Loader's number, and
nowhere near the busy-beaver numbers or Rayo's number, which leave notation
behind altogether.

## Why it never ends

Each step is one idea that folds everything before it, and each has a first rung
it cannot name — which is exactly what the next step folds. Placeholders go much
further than step 12 (placeholders for "unreachable even by placeholders":
inaccessible, Mahlo, weakly compact, …), but any notation that can be written
down has a first thing it cannot name. The only way past all of them is to talk
about what notations can say at all — which is where Rayo's number lives.
