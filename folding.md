# Iterated Folding: A Short Ascent Through the Fast-Growing Hierarchy

**Abstract.** Starting from the successor function and a single operation of
diagonalization ("folding"), we describe a sequence of increasingly powerful
mechanisms, each of which folds over everything constructed before it. The
ascent passes through the Veblen hierarchy to Buchholz's collapsing functions and
yields a finite number, defined in two pages, whose growth rate lies far beyond
that of Friedman's TREE function.

## 1. Definitions

Rungs of the hierarchy are named by countable ordinals. Every limit ordinal λ
used below carries a *fundamental sequence* λ[0] < λ[1] < λ[2] < … converging to
λ. Define functions F_α on the natural numbers by

- F₀(n) = n + 1;
- **step:** F_(α+1)(n) = F_α(F_α(⋯F_α(n)⋯)), with n applications of F_α;
- **fold:** F_λ(n) = F_(λ[n])(n) for limit λ.

A step iterates the previous rung; a fold diagonalizes over an endless increasing
list of rungs, evaluating its n-th member at n. For every ordinal named below and
every n, F_α(n) is a well-defined natural number. (This is the fast-growing
hierarchy of Löb and Wainer [7].)

## 2. The hierarchy

Each stage introduces one mechanism that folds over all preceding ones.

1. **Finite rungs.** F₁(n) = 2n, F₂(n) = n·2ⁿ, and F₃ already grows faster than
   towers of exponentials; in general F_k grows like k−1 of Knuth's up-arrows.
2. **The first fold.** ω, with ω[n] = n, so F_ω(n) = F_n(n): Ackermann's function.
3. **Iterated folds.** ω+1, ω+2, …, then ω·2 with (ω·2)[n] = ω+n, then ω·3, …
   For comparison, F_(ω+1)(64) exceeds Graham's number.
4. **Folds of folds.** ω² with ω²[n] = ω·n, then ω³, …, and ω^ω with
   (ω^ω)[n] = ωⁿ.
5. **Towers of variable height.** ε₀, with ε₀[n] a tower of n ω's:
   ω, ω^ω, ω^(ω^ω), …
6. **Restarting the tower.** ε₁ folds ε₀+1, ω^(ε₀+1), ω^(ω^(ε₀+1)), …; likewise
   ε₂, ε₃, …; with the index itself variable, ε_ω, ε_(ε₀), ε_(ε_(ε₀)), …, whose limit
   ζ₀ is the first ordinal with ε_(ζ₀) = ζ₀.
7. **A hierarchy of fixed-point operations** (Veblen [1]). Let φ₀(α) = ω^α, and let
   φ_(β+1) enumerate the fixed points of φ_β; at limits, φ_β enumerates the common
   fixed points of all earlier φ_γ. Then φ₁(α) = ε_α and φ₂(0) = ζ₀; each φ_(β+1)
   folds over φ_β.
8. **The index as a variable.** The Feferman–Schütte ordinal Γ₀ [2], the least α
   with φ_α(0) = α, folds 1, ε₀, φ_(ε₀)(0), φ_(φ_(ε₀)(0))(0), …
9. **Additional arguments.** Veblen's functions extend to several arguments, each
   new argument folding over all functions with fewer: φ(1, 0, 0) = Γ₀, then
   φ(1, 0, 1), φ(1, 1, 0), φ(2, 0, 0), …; four arguments give the Ackermann ordinal
   φ(1, 0, 0, 0); then five, six, …
10. **The number of arguments as a variable.** The limit of φ(1, 0, 0),
    φ(1, 0, 0, 0), φ(1, 0, 0, 0, 0), … is the **small Veblen ordinal**. The growth
    rate of Friedman's TREE function lies in the vicinity of this ordinal.
11. **Transfinitely many arguments.** Allowing argument positions indexed by
    ordinals, and folding at the point where the index of the leading position
    reaches the value itself, gives the **large Veblen ordinal**.
12. **Collapsing** (Bachmann [3], Howard [4], Buchholz [5]). Every mechanism above
    builds upward from below, and each has a first ordinal it cannot reach.
    Collapsing names such ordinals directly: one introduces a symbol Ω for an
    ordinal that no construction from below attains, applies all the preceding
    mechanisms to expressions involving Ω, and maps ("collapses") each resulting
    term to the least ordinal not obtainable without it. A single Ω yields the
    **Bachmann–Howard ordinal** ψ(ε_(Ω+1)). An increasing sequence
    Ω₁ < Ω₂ < Ω₃ < … with supremum Ω_ω, each level collapsing into the one below,
    yields ψ₀(ε_(Ω_ω+1)), the **Takeuti–Feferman–Buchholz ordinal**.

Fundamental sequences for the ordinals of stages 7–12 are standard and are
omitted for brevity.

## 3. The number

> **N = F_α(10), where α = ψ₀(ε_(Ω_ω+1)),** evaluated with Buchholz's
> ψ-functions [5] and their standard fundamental sequences.

## 4. Remarks

**On the base function.** Replacing F₀ by a much faster function, such as TREE,
does not raise the growth rate at this height: such a base contributes an
ordinal β far below α, and β + α = α.

**A combinatorial equivalent.** The ordinal α also measures the termination of
Buchholz's hydra game [6], in which the node labels 0, 1, 2, …, ω play the role of
the symbols Ω₁, Ω₂, …, Ω_ω, and the rules for cutting the hydra carry out the
folding of Section 2 automatically.

**Comparisons.** The function n ↦ F_α(n) eventually dominates every function in
the Veblen hierarchy, including Friedman's TREE function. It is generally
believed to be dominated in turn by the function D underlying Loader's number,
which diagonalizes over all normalizing terms of the Calculus of Constructions.
Both are computable, and both are eventually dominated by the busy-beaver
function; N itself is definable in far fewer than a googol symbols of
first-order set theory, and so is smaller than Rayo's number.

**Limits.** Each stage of Section 2 folds over everything before it, and each has
a first ordinal it cannot name, which is precisely what the next stage folds.
Collapsing extends much further than stage 12, using symbols for inaccessible,
Mahlo, and weakly compact ordinals; but every notation system that can be
written down has a least ordinal it cannot reach. There is no final stage.

## References

1. O. Veblen, "Continuous increasing functions of finite and transfinite
   ordinals", *Transactions of the American Mathematical Society* 9 (1908),
   280–292.
2. S. Feferman, "Systems of predicative analysis", *Journal of Symbolic Logic* 29
   (1964), 1–30.
3. H. Bachmann, "Die Normalfunktionen und das Problem der ausgezeichneten Folgen
   von Ordinalzahlen", *Vierteljahrsschrift der Naturforschenden Gesellschaft in
   Zürich* 95 (1950), 115–147.
4. W. A. Howard, "A system of abstract constructive ordinals", *Journal of
   Symbolic Logic* 37 (1972), 355–374.
5. W. Buchholz, "A new system of proof-theoretic ordinal functions", *Annals of
   Pure and Applied Logic* 32 (1986), 195–207.
6. W. Buchholz, "An independence result for (Π¹₁-CA)+BI", *Annals of Pure and
   Applied Logic* 33 (1987), 131–155.
7. M. H. Löb and S. S. Wainer, "Hierarchies of number-theoretic functions I",
   *Archiv für mathematische Logik und Grundlagenforschung* 13 (1970), 39–51.
