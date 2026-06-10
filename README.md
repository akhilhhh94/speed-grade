# Lumen LMS — Rubric-based Assessment Prototype

A professional, single-page **LMS UI/UX prototype** built with **React + Vite +
Tailwind CSS v4**. It frames the original transparent rubric grading engine inside
a full LMS experience: global configuration libraries, a guided assignment-create
flow, a learner-facing assignment page, a dummy submission, and the evaluate →
result screens.

> **Prototype scope:** everything is in-memory. There is **no backend and no
> storage** (no local/session storage) — state resets on reload and re-seeds from
> `src/data/sampleData.js`. Navigation is in-memory too (no router dependency).

## Run

```bash
npm install
npm run dev      # open the printed localhost URL
npm test         # engine + resolver unit tests
npm run build    # production build
```

## The experience

A left **sidebar** frames the app; a top bar carries the breadcrumb and an
**Instructor ↔ Learner** role switch.

**Instructor**
- **Configuration libraries** (global, reusable):
  - **Grade Scales** — named band-sets with a pass/fail mode.
  - **Rubrics** — criteria × performance-level grids (plain-text descriptors), a
    **rich-text Learning outcomes** field (markdown — tables, bullets, live
    preview), and **grading rules** (pass level, minimum-to-pass gate, grade
    guarantee). The guarantee's minimum band is chosen per assignment.
- **Create Assignment** — a guided 6-step wizard: Details & content → Grade
  scale → Rubric → Outcomes → Deadline & rules → Review & publish. Choosing a
  rubric seeds its outcomes and rule choices, which you then customize.
- **Assignment overview** → **Evaluate** the dummy submission → **Result** with the
  full transparent grade breakdown.

**Learner**
- A professional assignment page: rich instructions, the read-only rubric, the
  rich-text learning outcomes, due date/points, and **Submit**.

## Architecture

```
src/
  lib/
    calc.js          The pure grading engine — UNCHANGED from the original PoC.
    calc.test.js     Engine tests — UNCHANGED.
    resolve.js       Resolves an assignment's references → the exact engine input.
  state/store.jsx    In-memory store: role, route, libraries, assignments, draft, session.
  data/sampleData.js Seed libraries + assignments (calc-relevant shapes identical to the PoC).
  components/
    Markdown.jsx     react-markdown + remark-gfm wrapper (rich content, incl. tables).
    Router.jsx       In-memory (route, role) → page switch, with learner guards.
    layout/          AppShell, Sidebar, TopBar (role switch), Icons.
    editors/         Controlled GradeScaleEditor, RubricEditor, RulesConfig.
    views/           EvaluationView, ResultView, RubricView.
  pages/             One component per route (instructor + learner).
```

### The grading logic never changes

`src/lib/calc.js` is the single source of truth and is preserved **byte-for-byte**.
Every grade still flows through `computeResult({ bands, rubric, rules, evaluation,
override, passFailEnabled })`. The new `resolve.js` is the only bridge: it turns an
assignment's library references into that exact input object (and repairs any
dangling rule references). `src/lib/resolve.test.js` asserts the resolved path
produces a result identical to calling the engine directly.
