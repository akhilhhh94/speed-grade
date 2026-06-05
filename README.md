# Rubric Grade Calculator (Proof of Concept)

A learner's assignment-submission evaluation screen driven by rubrics, built with
**React + Vite + Tailwind CSS v4**. The emphasis is on the *concept and solution* —
a transparent grading engine — as much as the UI.

## Run

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # run the calculation-engine unit tests
```

## The 4-step flow

1. **Grade bands** — define any number of bands dynamically: a percentage range, a
   fully custom label, a pass/fail flag and a colour. Live validation flags overlaps,
   gaps and uncovered ranges; a coverage bar visualises the whole scale.
2. **Rubric & rules** — an editable criteria × performance-level table (seeded with the
   sample essay rubric). Each level's points can be a **single value or a range**, each
   criterion has a weight. Two configurable rules shape the grade:
   - **Minimum-criterion gate** — if *any / all / at least N* criteria fall below a level,
     force the grade down to a fail band (resubmission).
   - **Pass floor** — if chosen key criteria all reach a level, guarantee a minimum grade.
3. **Evaluate** — pick a performance level per criterion (with a slider to fine-tune
   points when the level is a range). A sticky live summary shows the running score and
   provisional grade.
4. **Result** — congrats (green) or resubmission (red) with explicit fail reasons, a full
   weighted-score breakdown, an ordered plain-language explanation of every rule applied,
   and a teacher override (grade + reason).

## Where the logic lives

`src/lib/calc.js` is a pure, fully-explained calculation engine — the single source of
truth. It returns the per-criterion breakdown, the computed/floored/gated/overridden band,
and an ordered `steps[]` list that the result screen renders verbatim, so every number on
screen is explained. Order of precedence: **computed % → floor (lift) → gate (force fail)
→ teacher override**.

State is in-memory (`src/state/store.jsx`) and re-seeds the sample rubric on reload.
